// import { prisma } from "@/utils/prisma";
// import { CryptoType, OrderStatus } from "@generated";
// import Client from 'bitcoin-core';
// import * as bitcoin from 'bitcoinjs-lib';
// import { mnemonicToSeedSync } from 'bip39';
// import BIP32Factory from 'bip32';
// import * as ecc from "tiny-secp256k1";
// import ECPairFactory, { ECPairInterface } from "ecpair";

// const bip32 = BIP32Factory(ecc);
// const ECPair = ECPairFactory(ecc);

// export const bitcoinNetwork = bitcoin.networks.bitcoin;
// export const litecoinNetwork: bitcoin.Network = {
//     messagePrefix: '\x19Litecoin Signed Message:\n',
//     bech32: 'ltc',
//     bip32: {
//         public: 0x019da462,
//         private: 0x019d9cfe,
//     },
//     pubKeyHash: 0x30,
//     scriptHash: 0x32,
//     wif: 0xb0,
// };

// function deriveKeypair(
//     mnemonic: string,
//     index: number,
//     network: bitcoin.Network
// ): ECPairInterface {
//     const seed = mnemonicToSeedSync(mnemonic);
//     const root = bip32.fromSeed(seed, network);
//     const coinType = network === bitcoinNetwork ? 0 : 2;
//     const path = `m/84'/${coinType}'/0'/0/${index}`;
//     const child = root.derivePath(path);
//     return ECPair.fromPrivateKey(child.privateKey!, { network });
// }

// export async function sendUtxoChainBalance(
//     destination: string,
//     chain: CryptoType,
//     network: bitcoin.Network,
//     rpcUrl: string
// ): Promise<void> {
//     // 1) load all unpaid wallets for this chain
//     const unpaid = await prisma.order.findMany({
//         where: {
//             status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
//             Wallet: {
//                 some: { chain, withdrawn: false },
//             },
//         },
//         select: {
//             Wallet: {
//                 where: { chain, withdrawn: false },
//                 select: { address: true, depositIndex: true },
//             },
//         },
//     });

//     // dedupe by address+index
//     const indexes = Array.from(
//         new Set(
//             unpaid.flatMap(o =>
//                 o.Wallet.map(w => JSON.stringify({ address: w.address, index: w.depositIndex }))
//             )
//         )
//     ).map(s => JSON.parse(s) as { address: string; index: number });

//     // 2) set up JSON-RPC client
//     const url = new URL(rpcUrl);
//     const client = new Client({
//         host: `${url.protocol}://${url.hostname}:${url.port}`,
//         username: url.username,
//         password: url.password,
//     });

//     // 3) for each derived wallet
//     for (const { address, index } of indexes) {
//         // 3a) fetch all UTXOs for that address
//         const utxos: Array<{
//             txid: string
//             vout: number
//             amount: number
//             scriptPubKey: string
//         }> = await client.listUnspent(0, 9999999, [address]);

//         const totalSats = utxos.reduce((sum, u) => sum + Math.round(u.amount * 1e8), 0);
//         if (totalSats === 0) continue;

//         // 3b) fee estimate via `estimatesmartfee`
//         const feeResp: { feerate: number } = (await client.command('estimatesmartfee', 6));
//         const feeRateBtcPerKb = feeResp.feerate;

//         // 3c) build a dummy PSBT for vbyte estimation
//         const dummyPsbt = new bitcoin.Psbt({ network });
//         utxos.forEach(u =>
//             dummyPsbt.addInput({
//                 hash: u.txid,
//                 index: u.vout,
//                 witnessUtxo: {
//                     script: Buffer.from(u.scriptPubKey, 'hex'),
//                     value: Math.round(u.amount * 1e8),
//                 },
//             })
//         );
//         dummyPsbt.addOutput({ address: destination, value: 0 });
//         const keypair = deriveKeypair(process.env.MNEMONIC!, index, network);
//         dummyPsbt.signAllInputs(keypair);
//         dummyPsbt.finalizeAllInputs();
//         const txForSize = dummyPsbt.extractTransaction();
//         const vbytes = txForSize.virtualSize();
//         const fee = Math.ceil((feeRateBtcPerKb * 1e8 * vbytes) / 1000);

//         // 3d) rebuild real PSBT with actual amount
//         const psbt = new bitcoin.Psbt({ network });
//         utxos.forEach(u =>
//             psbt.addInput({
//                 hash: u.txid,
//                 index: u.vout,
//                 witnessUtxo: {
//                     script: Buffer.from(u.scriptPubKey, 'hex'),
//                     value: Math.round(u.amount * 1e8),
//                 },
//             })
//         );
//         const sendValue = totalSats - fee;
//         if (sendValue <= 0) continue;

//         psbt.addOutput({ address: destination, value: sendValue });
//         psbt.signAllInputs(keypair);
//         psbt.finalizeAllInputs();

//         const txHex = psbt.extractTransaction().toHex();
//         const txid = await client.sendRawTransaction(txHex);
//         console.log(
//             `Sent ${sendValue / 1e8} ${chain} from index ${index} — tx ${txid}`
//         );

//         // 3e) mark withdrawn
//         await prisma.wallet.updateMany({
//             where: { chain, address },
//             data: { withdrawn: true },
//         });
//     }
// }
