import { mnemonicToSeedSync } from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import axios from "axios";
import { prisma } from "@/utils/prisma";
import { CryptoType } from "@generated/client";
import { deleteCryptoWebhook } from "@/server/crypto/webhooks";

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

async function fetchUtxos(wallets: WalletRow[]) {
  const utxos: UTXOInfo[] = [];

  for (const wallet of wallets) {
    const utxoList: Array<{ txid: string; vout: number; value: number }> = (
      await axios.get(`https://blockstream.info/api/address/${wallet.address}/utxo`)
    ).data;

    for (const { txid, vout, value } of utxoList) {
      const rawTxHex: string = (
        await axios.get(`https://blockstream.info/api/tx/${txid}/hex`, {
          responseType: "text",
        })
      ).data.trim();

      utxos.push({
        txid,
        vout,
        value,
        depositIndex: wallet.depositIndex,
        rawTxHex,
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
  const network = bitcoin.networks.bitcoin;
  const psbt = new bitcoin.Psbt({ network });

  let totalSats = 0;
  for (const utxo of group) {
    totalSats += utxo.value;
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(utxo.rawTxHex, "hex"),
    });
  }

  const feeRateSatPerVbyte =
    (await axios.get("https://blockstream.info/api/fee-estimates")).data["6"] || 1;
  const vbytes = group.length * 148 + 34 + 10;
  const fee = Math.ceil(vbytes * feeRateSatPerVbyte);

  if (fee > totalSats * 0.015) {
    throw new Error(
      `BTC sweep fee threshold exceeded: fee=${fee} sats total=${totalSats} sats`,
    );
  }

  const sendSats = totalSats - fee;
  if (sendSats <= 0) {
    throw new Error(
      `Insufficient BTC funds (${totalSats} sats) to cover fee (${fee} sats)`,
    );
  }

  psbt.addOutput({
    address: targetAddress,
    value: BigInt(sendSats),
  });

  group.forEach((u, i) => {
    const path = `m/44'/0'/0'/0/${u.depositIndex}`;
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
  const txid = await axios
    .post("https://blockstream.info/api/tx", txHex, {
      headers: { "Content-Type": "text/plain" },
    })
    .then((res) => res.data as string);

  return { txid, sentSats: sendSats };
}

export async function sendBitcoin(targetAddress: string) {
  const bip32 = BIP32Factory(ecc);
  const mnemonic = process.env.MNEMONIC;

  if (!mnemonic) {
    throw new Error("MNEMONIC is not set in env");
  }

  const seed = mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);

  const wallets = await prisma.wallet.findMany({
    where: {
      chain: CryptoType.BITCOIN,
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
      chain: "BITCOIN" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      txs: [] as Array<{ txId: string; amount: number }>,
      message: "No paid unswept BTC wallets found.",
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
      chain: "BITCOIN" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      txs: [] as Array<{ txId: string; amount: number }>,
      message: "No BTC UTXOs available to sweep.",
    };
  }

  const groups = groupUtxos(utxos);
  const txIds: string[] = [];
  const txs: Array<{ txId: string; amount: number }> = [];
  const sweptWalletIds = new Set<string>();

  for (const group of groups) {
    const { txid, sentSats } = await buildAndBroadcastSweep(
      group,
      targetAddress,
      root,
    );
    txIds.push(txid);
    txs.push({ txId: txid, amount: sentSats / 1e8 });

    const walletIds = Array.from(new Set(group.map((u) => u.walletId)));
    await prisma.wallet.updateMany({
      where: { id: { in: walletIds } },
      data: { withdrawn: true },
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
        await deleteCryptoWebhook(CryptoType.BITCOIN, webhookId);
      } catch (error) {
        deletionFailures.push(webhookId);
        console.error(`Failed to delete BTC webhook ${webhookId}`, error);
      }
    }

    if (deletionFailures.length > 0) {
      throw new Error(
        `Failed to delete BTC webhook(s): ${deletionFailures.join(", ")}`,
      );
    }
  }

  return {
    chain: "BITCOIN" as const,
    initiatedCount: sweptWalletIds.size,
    txIds,
    txs,
    message: `BTC withdrawal initiated for ${sweptWalletIds.size} wallet${sweptWalletIds.size === 1 ? "" : "s"}.`,
  };
}
