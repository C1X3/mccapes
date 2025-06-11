import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../init';
import { CryptoType } from '@generated';
import { getTotalSolanaBalance } from '../crypto/getBalance/solana';
import { getTotalBitcoinBalance } from '../crypto/getBalance/bitcoin';
import { getTotalLitecoinBalance } from '../crypto/getBalance/litecoin';
import { getTotalEthereumBalance } from '../crypto/getBalance/ethereum';
import { sendSolanaBalance } from '../crypto/sendBalance/solana';

export const cryptoRouter = createTRPCRouter({
    getCryptoBalance: adminProcedure
        .query(async () => {
            return {
                solana: await getTotalSolanaBalance(),
                bitcoin: await getTotalBitcoinBalance(),
                litecoin: await getTotalLitecoinBalance(),
                ethereum: await getTotalEthereumBalance(),
            };
        }),

    sendBalance: adminProcedure
        .input(z.object({
            type: z.nativeEnum(CryptoType),
            destination: z.string(),
        }))
        .mutation(async ({ input }) => {
            if (input.type === CryptoType.SOLANA) {
                return sendSolanaBalance(input.destination);
            }

            // else if (input.type === CryptoType.BITCOIN) {
            //     return sendBitcoinBalance(input.destination);
            // } else if (input.type === CryptoType.LITECOIN) {
            //     return sendLitecoinBalance(input.destination);
            // } else if (input.type === CryptoType.ETHEREUM) {
            //     return sendEthereumBalance(input.destination);
            // } else {
            //     throw new Error('Unsupported crypto type');
            // }

            void input;

            throw new Error('Unsupported crypto type');
        }),
});