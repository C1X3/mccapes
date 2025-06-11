// import { CryptoType } from "@generated";
// import { litecoinNetwork, sendUtxoChainBalance } from ".";

// export async function sendLitecoinBalance(destination: string): Promise<void> {
//     if (!process.env.LITECOIN_RPC_URL)
//         throw new Error('LITECOIN_RPC_URL not set');

//     return sendUtxoChainBalance(
//         destination,
//         CryptoType.LITECOIN,
//         litecoinNetwork,
//         process.env.LITECOIN_RPC_URL
//     );
// }