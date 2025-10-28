import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../init';
import { CryptoType } from '@generated';
import { getTotalSolanaBalance } from '../crypto/getBalance/solana';
import { getTotalBitcoinBalance } from '../crypto/getBalance/bitcoin';
import { getTotalLitecoinBalance } from '../crypto/getBalance/litecoin';
import { getTotalEthereumBalance } from '../crypto/getBalance/ethereum';
import { sendSolanaBalance } from '../crypto/sendBalance/solana';
import { sendBitcoin } from '../crypto/sendBalance/bitcoin';
import axios from 'axios';

// Fetch current crypto prices from CoinGecko
async function getCryptoPrices() {
    try {
        const resp = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,solana&vs_currencies=usd',
            { timeout: 5000 }
        );
        return {
            bitcoin: resp.data.bitcoin?.usd || 0,
            ethereum: resp.data.ethereum?.usd || 0,
            litecoin: resp.data.litecoin?.usd || 0,
            solana: resp.data.solana?.usd || 0,
        };
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        // Return 0 if prices can't be fetched
        return { bitcoin: 0, ethereum: 0, litecoin: 0, solana: 0 };
    }
}

export const cryptoRouter = createTRPCRouter({
    getCryptoBalance: adminProcedure
        .query(async () => {
            try {
                // Fetch balances and prices with individual error handling
                const [solana, bitcoin, litecoin, ethereum, prices] = await Promise.all([
                    getTotalSolanaBalance().catch(err => {
                        console.error('Error fetching Solana balance:', err);
                        return 0;
                    }),
                    getTotalBitcoinBalance().catch(err => {
                        console.error('Error fetching Bitcoin balance:', err);
                        return 0;
                    }),
                    getTotalLitecoinBalance().catch(err => {
                        console.error('Error fetching Litecoin balance:', err);
                        return 0;
                    }),
                    getTotalEthereumBalance().catch(err => {
                        console.error('Error fetching Ethereum balance:', err);
                        return 0;
                    }),
                    getCryptoPrices().catch(err => {
                        console.error('Error fetching prices:', err);
                        return { bitcoin: 0, ethereum: 0, litecoin: 0, solana: 0 };
                    }),
                ]);

                return {
                    solana,
                    bitcoin,
                    litecoin,
                    ethereum,
                    prices,
                    usdValues: {
                        solana: solana * prices.solana,
                        bitcoin: bitcoin * prices.bitcoin,
                        litecoin: litecoin * prices.litecoin,
                        ethereum: ethereum * prices.ethereum,
                    },
                };
            } catch (error) {
                console.error('Error in getCryptoBalance:', error);
                // Return zeros if everything fails
                return {
                    solana: 0,
                    bitcoin: 0,
                    litecoin: 0,
                    ethereum: 0,
                    prices: { bitcoin: 0, ethereum: 0, litecoin: 0, solana: 0 },
                    usdValues: { solana: 0, bitcoin: 0, litecoin: 0, ethereum: 0 },
                };
            }
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

            else if (input.type === CryptoType.BITCOIN) {
                return sendBitcoin(input.destination);
            }

            // else if (input.type === CryptoType.LITECOIN) {
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