// import { CryptoType } from '@generated';
// import { bitcoinNetwork, sendUtxoChainBalance } from '.';

// export async function sendBitcoinBalance(destination: string): Promise<void> {
//     if (!process.env.BITCOIN_RPC_URL)
//         throw new Error('BITCOIN_RPC_URL not set');

//     return sendUtxoChainBalance(
//         destination,
//         CryptoType.BITCOIN,
//         bitcoinNetwork,
//         process.env.BITCOIN_RPC_URL
//     );
// }