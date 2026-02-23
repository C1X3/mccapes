import { mnemonicToSeedSync } from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import axios, { AxiosError } from "axios";
import { prisma } from "@/utils/prisma";
import { CryptoType } from "@generated/client";
import { deleteCryptoWebhook } from "@/server/crypto/webhooks";

const litecoinNetwork: bitcoin.Network = {
  messagePrefix: "\x19Litecoin Signed Message:\n",
  bech32: "ltc",
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

type WalletRow = {
  id: string;
  depositIndex: number;
  address: string;
  webhookId: string | null;
};

type UTXOInfo = {
  txid: string;
  vout: number;
  value: number;
  depositIndex: number;
  rawTxHex: string;
  address: string;
  walletId: string;
  webhookId: string | null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRY_WAIT_MS = 10000;

function isRetryableNetworkError(code?: string) {
  return (
    code === "ECONNABORTED" || code === "ETIMEDOUT" || code === "ECONNRESET"
  );
}

async function fetchWithRetry<T>(url: string, maxRetries: number = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { timeout: REQUEST_TIMEOUT_MS });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const code = axiosError.code;

      const shouldRetry =
        attempt < maxRetries &&
        (status === 429 ||
          isRetryableNetworkError(code));

      if (shouldRetry) {
        const retryAfter = axiosError.response?.headers?.["retry-after"];
        const rawWait = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(1000 * Math.pow(2, attempt), 30000);
        const waitTime = Math.min(rawWait, MAX_RETRY_WAIT_MS);
        await sleep(waitTime);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retries exceeded");
}

async function postWithRetry<T>(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, body, {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const code = axiosError.code;
      const shouldRetry =
        attempt < maxRetries &&
        (status === 429 ||
          isRetryableNetworkError(code));
      if (shouldRetry) {
        const retryAfter = axiosError.response?.headers?.["retry-after"];
        const rawWait = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(1000 * Math.pow(2, attempt), 30000);
        const waitTime = Math.min(rawWait, MAX_RETRY_WAIT_MS);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

async function fetchUtxos(wallets: WalletRow[]) {
  const utxos: UTXOInfo[] = [];
  const token = process.env.BLOCKCYPHER_TOKEN;
  const tokenParam = token ? `&token=${token}` : "";

  for (const wallet of wallets) {
    const utxoUrl = `https://api.blockcypher.com/v1/ltc/main/addrs/${wallet.address}?unspentOnly=true${tokenParam}`;
    const utxoData = await fetchWithRetry<{
      txrefs?: Array<{ tx_hash: string; tx_output_n: number; value: number }>;
    }>(utxoUrl);

    for (const ref of utxoData.txrefs || []) {
      const rawTxUrl = `https://api.blockcypher.com/v1/ltc/main/txs/${ref.tx_hash}?includeHex=true${tokenParam}`;
      const rawTxData = await fetchWithRetry<{ hex?: string }>(rawTxUrl);

      if (!rawTxData.hex) {
        continue;
      }

      utxos.push({
        txid: ref.tx_hash,
        vout: ref.tx_output_n,
        value: ref.value,
        depositIndex: wallet.depositIndex,
        rawTxHex: rawTxData.hex,
        address: wallet.address,
        walletId: wallet.id,
        webhookId: wallet.webhookId,
      });
    }
  }

  return utxos;
}

function groupUtxos(utxos: UTXOInfo[]) {
  if (utxos.length > 5) {
    return [utxos];
  }

  const byAddress = new Map<string, UTXOInfo[]>();
  for (const utxo of utxos) {
    const current = byAddress.get(utxo.address) ?? [];
    current.push(utxo);
    byAddress.set(utxo.address, current);
  }

  return Array.from(byAddress.values());
}

async function buildAndBroadcastSweep(
  group: UTXOInfo[],
  targetAddress: string,
  root: ReturnType<ReturnType<typeof BIP32Factory>["fromSeed"]>,
) {
  const ECPair = ECPairFactory(ecc);
  const network = litecoinNetwork;
  const psbt = new bitcoin.Psbt({ network });

  let totalLitoshis = 0;
  for (const utxo of group) {
    totalLitoshis += utxo.value;
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(utxo.rawTxHex, "hex"),
    });
  }

  const feeRateLitoshiPerVbyte = 1;
  const vbytes = group.length * 148 + 34 + 10;
  const fee = Math.ceil(vbytes * feeRateLitoshiPerVbyte);

  if (fee > totalLitoshis * 0.015) {
    throw new Error(
      `LTC sweep fee threshold exceeded: fee=${fee} litoshis total=${totalLitoshis} litoshis`,
    );
  }

  const sendLitoshis = totalLitoshis - fee;
  if (sendLitoshis <= 0) {
    throw new Error(
      `Insufficient LTC funds (${totalLitoshis} litoshis) to cover fee (${fee} litoshis)`,
    );
  }

  psbt.addOutput({
    address: targetAddress,
    value: BigInt(sendLitoshis),
  });

  group.forEach((u, i) => {
    const path = `m/44'/2'/0'/0/${u.depositIndex}`;
    const child = root.derivePath(path);
    if (!child.privateKey) {
      throw new Error(`No private key at ${path}`);
    }

    const keyPair = ECPair.fromPrivateKey(child.privateKey, { network });
    const signer: bitcoin.Signer = {
      publicKey: Buffer.from(keyPair.publicKey),
      sign: (hash: Buffer, lowR?: boolean): Buffer => {
        const sigUint8 = keyPair.sign(hash, lowR);
        return Buffer.from(sigUint8);
      },
    };

    psbt.signInput(i, signer);
  });

  psbt.validateSignaturesOfAllInputs((pubkey, msgHash, signature) => {
    return ECPair.fromPublicKey(pubkey, { network }).verify(msgHash, signature);
  });
  psbt.finalizeAllInputs();

  const txHex = psbt.extractTransaction().toHex();
  const token = process.env.BLOCKCYPHER_TOKEN;
  const pushUrl = token
    ? `https://api.blockcypher.com/v1/ltc/main/txs/push?token=${token}`
    : "https://api.blockcypher.com/v1/ltc/main/txs/push";
  const pushResp = await postWithRetry<{ tx: { hash: string } }>(
    pushUrl,
    { tx: txHex },
    { "Content-Type": "application/json" },
  );
  const txid = pushResp.tx.hash;

  return { txid, sentLitoshis: sendLitoshis };
}

export async function sendLitecoin(targetAddress: string) {
  try {
    const bip32 = BIP32Factory(ecc);
    const mnemonic = process.env.MNEMONIC;

    if (!mnemonic) {
      throw new Error("MNEMONIC is not set in env");
    }

    const seed = mnemonicToSeedSync(mnemonic);
    const root = bip32.fromSeed(seed);

  const wallets = await prisma.wallet.findMany({
    where: {
      chain: CryptoType.LITECOIN,
      paid: true,
      withdrawn: false,
      txHash: { not: null },
    },
    select: {
      id: true,
      depositIndex: true,
      address: true,
      webhookId: true,
    },
  });

  if (wallets.length === 0) {
    return {
      chain: "LITECOIN" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      txs: [] as Array<{ txId: string; amount: number }>,
      message: "No paid unswept LTC wallets found.",
    };
  }

  const utxos = await fetchUtxos(wallets);

  // Auto-close wallets that are paid but currently have no spendable UTXOs.
  const walletIdsWithUtxos = new Set(utxos.map((u) => u.walletId));
  const emptyWalletIds = wallets
    .filter((w) => !walletIdsWithUtxos.has(w.id))
    .map((w) => w.id);
  if (emptyWalletIds.length > 0) {
    await prisma.wallet.updateMany({
      where: { id: { in: emptyWalletIds } },
      data: { withdrawn: true },
    });
  }

  if (utxos.length === 0) {
    return {
      chain: "LITECOIN" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      txs: [] as Array<{ txId: string; amount: number }>,
      message: "No LTC UTXOs available to sweep.",
    };
  }

  const groups = groupUtxos(utxos);
  const txIds: string[] = [];
  const txs: Array<{ txId: string; amount: number }> = [];
  const sweptWalletIds = new Set<string>();

  for (const group of groups) {
    const { txid, sentLitoshis } = await buildAndBroadcastSweep(
      group,
      targetAddress,
      root,
    );
    txIds.push(txid);
    txs.push({ txId: txid, amount: sentLitoshis / 1e8 });

    const walletIds = Array.from(new Set(group.map((u) => u.walletId)));
    await prisma.wallet.updateMany({
      where: { id: { in: walletIds } },
      data: { withdrawn: true, txHash: txid },
    });

    for (const id of walletIds) {
      sweptWalletIds.add(id);
    }

    const webhookDeletes = Array.from(
      new Map(
        group
          .filter((u) => Boolean(u.webhookId))
          .map((u) => [u.walletId, u.webhookId as string]),
      ).values(),
    );

    const deletionFailures: string[] = [];
    for (const webhookId of webhookDeletes) {
      try {
        await deleteCryptoWebhook(CryptoType.LITECOIN, webhookId);
      } catch (error) {
        deletionFailures.push(webhookId);
        console.error(`Failed to delete LTC webhook ${webhookId}`, error);
      }
    }

    if (deletionFailures.length > 0) {
      throw new Error(
        `Failed to delete LTC webhook(s): ${deletionFailures.join(", ")}`,
      );
    }
  }

    return {
      chain: "LITECOIN" as const,
      initiatedCount: sweptWalletIds.size,
      txIds,
      txs,
      message: `LTC withdrawal initiated for ${sweptWalletIds.size} wallet${sweptWalletIds.size === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    throw error instanceof Error
      ? new Error(`LTC withdrawal failed: ${error.message}`)
      : new Error("LTC withdrawal failed due to unknown error");
  }
}
