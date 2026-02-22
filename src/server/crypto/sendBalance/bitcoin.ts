import { mnemonicToSeedSync } from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import axios from "axios";
import { prisma } from "@/utils/prisma";

export async function sendBitcoin(TARGET_ADDRESS: string) {
  const bip32 = BIP32Factory(ecc);
  const ECPair = ECPairFactory(ecc);
  const NETWORK = bitcoin.networks.bitcoin;
  const MNEMONIC = process.env.MNEMONIC;

  if (!MNEMONIC) {
    throw new Error("MNEMONIC is not set in env");
  }

  const seed = mnemonicToSeedSync(MNEMONIC);
  const root = bip32.fromSeed(seed);

  const wallets = await prisma.wallet.findMany({
    where: { chain: "BITCOIN", withdrawn: false },
    select: { id: true, depositIndex: true, address: true },
  });
  if (wallets.length === 0) {
    return {
      chain: "BITCOIN" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      message: "No unswept BTC wallets found.",
    };
  }

  type UTXOInfo = {
    txid: string;
    vout: number;
    value: number;
    depositIndex: number;
    rawTxHex: string;
    address: string;
  };
  const utxos: UTXOInfo[] = [];

  for (const { depositIndex, address } of wallets) {
    console.log(`Fetching UTXOs for ${address}…`);
    const utxoList: Array<{ txid: string; vout: number; value: number }> = (
      await axios.get(`https://blockstream.info/api/address/${address}/utxo`)
    ).data;

    for (const { txid, vout, value } of utxoList) {
      console.log(`  found UTXO ${txid}:${vout} (${value} sats)`);
      const rawTxHex: string = (
        await axios.get(`https://blockstream.info/api/tx/${txid}/hex`, {
          responseType: "text",
        })
      ).data.trim();
      utxos.push({ txid, vout, value, depositIndex, rawTxHex, address });
    }
  }

  if (utxos.length === 0) {
    return {
      chain: "BITCOIN" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      message: "No BTC UTXOs available to sweep.",
    };
  }

  const psbt = new bitcoin.Psbt({ network: NETWORK });
  let totalSats = 0;
  for (const { txid, vout, value, rawTxHex } of utxos) {
    totalSats += value;
    psbt.addInput({
      hash: txid,
      index: vout,
      nonWitnessUtxo: Buffer.from(rawTxHex, "hex"),
    });
  }

  const feeRateSatPerVbyte =
    (await axios.get("https://blockstream.info/api/fee-estimates")).data["6"] ||
    1;
  const vbytes = utxos.length * 148 + 34 + 10;
  const fee = Math.ceil(vbytes * feeRateSatPerVbyte);

  const sendSats = totalSats - fee;
  if (sendSats <= 0) {
    throw new Error(
      `Insufficient BTC funds (${totalSats} sats) to cover fee (${fee} sats)`,
    );
  }
  console.log(
    `Total: ${totalSats} sats, fee: ${fee} sats, sending: ${sendSats} sats`,
  );

  psbt.addOutput({
    address: TARGET_ADDRESS,
    value: BigInt(sendSats),
  });

  utxos.forEach((u, i) => {
    const path = `m/44'/0'/0'/0/${u.depositIndex}`;
    const child = root.derivePath(path);
    if (!child.privateKey) throw new Error(`No private key at ${path}`);

    const keyPair = ECPair.fromPrivateKey(child.privateKey, {
      network: NETWORK,
    });

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
    return ECPair.fromPublicKey(pubkey, { network: NETWORK }).verify(
      msgHash,
      signature,
    );
  });
  psbt.finalizeAllInputs();

  const txHex = psbt.extractTransaction().toHex();
  console.log("🖊️  Raw TX hex:", txHex);

  console.log("Broadcasting transaction…");
  const txid = await axios
    .post("https://blockstream.info/api/tx", txHex, {
      headers: { "Content-Type": "text/plain" },
    })
    .then((res) => res.data as string);
  console.log(`✅ Broadcasted TXID: ${txid}`);

  const sweptAddresses = Array.from(new Set(utxos.map((u) => u.address)));
  await prisma.wallet.updateMany({
    where: {
      chain: "BITCOIN",
      address: { in: sweptAddresses },
    },
    data: { withdrawn: true, txHash: txid },
  });

  console.log("All addresses marked as swept.");

  return {
    chain: "BITCOIN" as const,
    initiatedCount: sweptAddresses.length,
    txIds: [txid],
    message: `BTC withdrawal initiated for ${sweptAddresses.length} wallet${sweptAddresses.length === 1 ? "" : "s"}.`,
  };
}
