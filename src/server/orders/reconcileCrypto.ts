import axios, { AxiosError } from "axios";
import { parseUnits } from "ethers";
import { CryptoType, OrderStatus } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { settleCryptoWalletPayment } from "@/server/orders/fulfill";

const PATH_MAP: Record<CryptoType, string> = {
  [CryptoType.BITCOIN]: "btc",
  [CryptoType.LITECOIN]: "ltc",
  [CryptoType.ETHEREUM]: "eth",
  [CryptoType.SOLANA]: "",
};

const REQUEST_SPACING_MS = 250;
const RECONCILE_DEBUG = process.env.CRYPTO_RECONCILE_DEBUG === "true";

let blockCypherRetryAfter = 0;
let heliusRetryAfter = 0;

class ReconcileRateLimitError extends Error {
  constructor(
    readonly provider: "blockcypher" | "helius",
    readonly retryAfterMs: number,
  ) {
    super(`Rate limited by ${provider}. Retry in ${Math.ceil(retryAfterMs / 1000)}s`);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(err: AxiosError) {
  const header = err.response?.headers?.["retry-after"];
  const seconds = Number(Array.isArray(header) ? header[0] : header);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }
  return 60_000;
}

async function getWithRateLimit(url: string) {
  if (Date.now() < blockCypherRetryAfter) {
    throw new ReconcileRateLimitError(
      "blockcypher",
      blockCypherRetryAfter - Date.now(),
    );
  }

  try {
    return await axios.get(url, { timeout: 15000 });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      const retryAfterMs = parseRetryAfterMs(axiosError);
      blockCypherRetryAfter = Date.now() + retryAfterMs;
      throw new ReconcileRateLimitError("blockcypher", retryAfterMs);
    }
    throw error;
  }
}

async function postHeliusWithRateLimit(url: string, body: unknown) {
  if (Date.now() < heliusRetryAfter) {
    throw new ReconcileRateLimitError("helius", heliusRetryAfter - Date.now());
  }

  try {
    return await axios.post(url, body, { timeout: 15000 });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 429) {
      const retryAfterMs = parseRetryAfterMs(axiosError);
      heliusRetryAfter = Date.now() + retryAfterMs;
      throw new ReconcileRateLimitError("helius", retryAfterMs);
    }
    throw error;
  }
}

function normalizeHexAddress(value: string) {
  return value.toLowerCase().replace(/^0x/, "");
}

function debugLog(message: string, data?: Record<string, unknown>) {
  if (!RECONCILE_DEBUG) {
    return;
  }

  if (data) {
    console.log(`[crypto-reconcile:debug] ${message}`, data);
  } else {
    console.log(`[crypto-reconcile:debug] ${message}`);
  }
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
  debugLog("checking wallet", {
    walletId: wallet.id,
    chain: wallet.chain,
    address: wallet.address,
    expectedAmount: wallet.expectedAmount.toString(),
  });

  const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
  if (!blockcypherToken) {
    throw new Error("BLOCKCYPHER_TOKEN is not configured");
  }

  const path = PATH_MAP[wallet.chain];
  const url = `https://api.blockcypher.com/v1/${path}/main/addrs/${wallet.address}/full?limit=50&token=${blockcypherToken}`;
  const response = await getWithRateLimit(url);

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

  debugLog("wallet scan stats", {
    walletId: wallet.id,
    chain: wallet.chain,
    txCount: txs.length,
    expectedUnits: expectedUnits.toString(),
    normalizedTarget,
  });

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

    if (wallet.chain === CryptoType.ETHEREUM) {
      debugLog("eth tx candidate", {
        walletId: wallet.id,
        txHash: tx.hash,
        confirmations: Number(tx.confirmations || 0),
        receivedUnits: received.toString(),
        expectedUnits: expectedUnits.toString(),
        passes: received >= expectedUnits,
      });
    }

    return received >= expectedUnits;
  });

  if (!match) {
    debugLog("no matching payment tx", {
      walletId: wallet.id,
      chain: wallet.chain,
      address: wallet.address,
      expectedUnits: expectedUnits.toString(),
    });
    return false;
  }

  debugLog("payment tx matched", {
    walletId: wallet.id,
    chain: wallet.chain,
    txHash: match.hash,
    confirmations: Math.max(1, Number(match.confirmations || 0)),
  });

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
  debugLog("checking sol wallet", {
    walletId: wallet.id,
    address: wallet.address,
    expectedAmount: wallet.expectedAmount.toString(),
  });

  const heliusApiKey = process.env.HELIUS_API_KEY;
  if (!heliusApiKey) {
    throw new Error("HELIUS_API_KEY is not configured");
  }

  const helApiUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;

  const signaturesResp = await postHeliusWithRateLimit(
    helApiUrl,
    {
      jsonrpc: "2.0",
      id: "1",
      method: "getSignaturesForAddress",
      params: [wallet.address, { limit: 20 }],
    },
  );

  const signatures = (signaturesResp.data?.result || []) as Array<{
    signature?: string;
    confirmationStatus?: string;
  }>;

  if (!signatures.length) {
    debugLog("no sol signatures", { walletId: wallet.id, address: wallet.address });
    return false;
  }

  const balanceResp = await postHeliusWithRateLimit(
    helApiUrl,
    {
      jsonrpc: "2.0",
      id: "2",
      method: "getBalance",
      params: [wallet.address],
    },
  );

  const currentLamports = BigInt(balanceResp.data?.result?.value || 0);
  const expectedLamports = toBaseUnits(CryptoType.SOLANA, wallet.expectedAmount.toString());

  if (currentLamports < expectedLamports) {
    debugLog("sol balance below expected", {
      walletId: wallet.id,
      address: wallet.address,
      currentLamports: currentLamports.toString(),
      expectedLamports: expectedLamports.toString(),
    });
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

export async function reconcilePendingCryptoPayments(limit = 25) {
  const perChainLimit = Math.max(1, Math.floor(limit / 4));
  const commonWhere = {
    paid: false,
    order: {
      status: OrderStatus.PENDING,
    },
  };

  const [btcWallets, ltcWallets, ethWallets, solWallets] = await Promise.all([
    prisma.wallet.findMany({
      where: { ...commonWhere, chain: CryptoType.BITCOIN },
      orderBy: { createdAt: "desc" },
      take: perChainLimit,
      select: {
        id: true,
        chain: true,
        address: true,
        expectedAmount: true,
      },
    }),
    prisma.wallet.findMany({
      where: { ...commonWhere, chain: CryptoType.LITECOIN },
      orderBy: { createdAt: "desc" },
      take: perChainLimit,
      select: {
        id: true,
        chain: true,
        address: true,
        expectedAmount: true,
      },
    }),
    prisma.wallet.findMany({
      where: { ...commonWhere, chain: CryptoType.ETHEREUM },
      orderBy: { createdAt: "desc" },
      take: perChainLimit,
      select: {
        id: true,
        chain: true,
        address: true,
        expectedAmount: true,
      },
    }),
    prisma.wallet.findMany({
      where: { ...commonWhere, chain: CryptoType.SOLANA },
      orderBy: { createdAt: "desc" },
      take: perChainLimit,
      select: {
        id: true,
        chain: true,
        address: true,
        expectedAmount: true,
      },
    }),
  ]);

  const wallets = [...ethWallets, ...btcWallets, ...ltcWallets, ...solWallets];

  debugLog("reconcile batch composed", {
    limit,
    perChainLimit,
    selected: {
      ethereum: ethWallets.length,
      bitcoin: btcWallets.length,
      litecoin: ltcWallets.length,
      solana: solWallets.length,
      total: wallets.length,
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
      if (error instanceof ReconcileRateLimitError) {
        console.warn(error.message);
        continue;
      }
      console.error(
        `Crypto reconcile failed for wallet ${wallet.id} (${wallet.chain})`,
        error,
      );
    } finally {
      await sleep(REQUEST_SPACING_MS);
    }
  }

  return { checked: wallets.length, settled };
}
