import axios from "axios";
import { parseUnits } from "ethers";
import { CryptoType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { settleCryptoWalletPayment } from "@/server/orders/fulfill";

const PATH_MAP: Record<CryptoType, string> = {
  [CryptoType.BITCOIN]: "btc",
  [CryptoType.LITECOIN]: "ltc",
  [CryptoType.ETHEREUM]: "eth",
  [CryptoType.SOLANA]: "",
};

function normalizeHexAddress(value: string) {
  return value.toLowerCase().replace(/^0x/, "");
}

function toBaseUnits(chain: CryptoType, amount: string) {
  if (chain === CryptoType.ETHEREUM) {
    return BigInt(parseUnits(amount, 18).toString());
  }
  if (chain === CryptoType.SOLANA) {
    return BigInt(parseUnits(amount, 9).toString());
  }
  return BigInt(parseUnits(amount, 8).toString());
}

async function reconcileUtxoOrEthWallet(wallet: {
  id: string;
  chain: CryptoType;
  address: string;
  expectedAmount: { toString(): string };
}) {
  const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
  if (!blockcypherToken) {
    throw new Error("BLOCKCYPHER_TOKEN is not configured");
  }

  const path = PATH_MAP[wallet.chain];
  const url = `https://api.blockcypher.com/v1/${path}/main/addrs/${wallet.address}/full?limit=50&token=${blockcypherToken}`;
  const response = await axios.get(url, { timeout: 15000 });

  const txs = (response.data?.txs || []) as Array<{
    hash: string;
    outputs?: Array<{ addresses?: string[]; value?: number }>;
    confirmations?: number;
  }>;

  const expectedUnits = toBaseUnits(wallet.chain, wallet.expectedAmount.toString());

  const normalizedTarget =
    wallet.chain === CryptoType.ETHEREUM
      ? normalizeHexAddress(wallet.address)
      : wallet.address;

  const match = txs.find((tx) => {
    const received = (tx.outputs || []).reduce((sum, output) => {
      const outputAddresses = (output.addresses || []).map((addr) =>
        wallet.chain === CryptoType.ETHEREUM ? normalizeHexAddress(addr) : addr,
      );

      if (!outputAddresses.includes(normalizedTarget)) {
        return sum;
      }

      return sum + BigInt(output.value || 0);
    }, BigInt(0));

    return received >= expectedUnits;
  });

  if (!match) {
    return false;
  }

  await settleCryptoWalletPayment({
    walletId: wallet.id,
    txHash: match.hash,
    confirmations: Math.max(1, Number(match.confirmations || 0)),
  });

  return true;
}

async function reconcileSolWallet(wallet: {
  id: string;
  address: string;
  expectedAmount: { toString(): string };
}) {
  const heliusApiKey = process.env.HELIUS_API_KEY;
  if (!heliusApiKey) {
    throw new Error("HELIUS_API_KEY is not configured");
  }

  const helApiUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;

  const signaturesResp = await axios.post(
    helApiUrl,
    {
      jsonrpc: "2.0",
      id: "1",
      method: "getSignaturesForAddress",
      params: [wallet.address, { limit: 20 }],
    },
    { timeout: 15000 },
  );

  const signatures = (signaturesResp.data?.result || []) as Array<{
    signature?: string;
    confirmationStatus?: string;
  }>;

  if (!signatures.length) {
    return false;
  }

  const balanceResp = await axios.post(
    helApiUrl,
    {
      jsonrpc: "2.0",
      id: "2",
      method: "getBalance",
      params: [wallet.address],
    },
    { timeout: 15000 },
  );

  const currentLamports = BigInt(balanceResp.data?.result?.value || 0);
  const expectedLamports = toBaseUnits(CryptoType.SOLANA, wallet.expectedAmount.toString());

  if (currentLamports < expectedLamports) {
    return false;
  }

  const bestSig = signatures.find(
    (s) => s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized",
  );

  await settleCryptoWalletPayment({
    walletId: wallet.id,
    txHash: bestSig?.signature ?? signatures[0]?.signature ?? null,
    confirmations: 1,
  });

  return true;
}

export async function reconcilePendingCryptoPayments(limit = 100) {
  const wallets = await prisma.wallet.findMany({
    where: { paid: false },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      chain: true,
      address: true,
      expectedAmount: true,
    },
  });

  if (wallets.length === 0) {
    return { checked: 0, settled: 0 };
  }

  let settled = 0;

  for (const wallet of wallets) {
    try {
      const didSettle =
        wallet.chain === CryptoType.SOLANA
          ? await reconcileSolWallet(wallet)
          : await reconcileUtxoOrEthWallet(wallet);

      if (didSettle) {
        settled += 1;
      }
    } catch (error) {
      console.error(
        `Crypto reconcile failed for wallet ${wallet.id} (${wallet.chain})`,
        error,
      );
    }
  }

  return { checked: wallets.length, settled };
}
