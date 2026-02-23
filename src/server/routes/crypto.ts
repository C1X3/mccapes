import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import { CryptoType } from "@generated/client";
import { TRPCError } from "@trpc/server";
import { getTotalSolanaBalance } from "../crypto/getBalance/solana";
import { getTotalBitcoinBalance } from "../crypto/getBalance/bitcoin";
import { getTotalLitecoinBalance } from "../crypto/getBalance/litecoin";
import { getTotalEthereumBalance } from "../crypto/getBalance/ethereum";
import { sendSolanaBalance } from "../crypto/sendBalance/solana";
import { sendBitcoin } from "../crypto/sendBalance/bitcoin";
import { sendLitecoin } from "../crypto/sendBalance/litecoin";
import { sendEthereum } from "../crypto/sendBalance/ethereum";
import Coingecko from "@coingecko/coingecko-typescript";

const coingeckoClient = new Coingecko({
  environment: "demo",
  demoAPIKey: process.env.COINGECKO_DEMO_API_KEY || undefined,
  timeout: 5000,
});

// Fetch current crypto prices from CoinGecko
async function getCryptoPrices() {
  try {
    const resp = await coingeckoClient.simple.price.get({
      ids: "bitcoin,ethereum,litecoin,solana",
      vs_currencies: "usd",
    });
    return {
      bitcoin: resp.bitcoin?.usd || 0,
      ethereum: resp.ethereum?.usd || 0,
      litecoin: resp.litecoin?.usd || 0,
      solana: resp.solana?.usd || 0,
    };
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    // Return 0 if prices can't be fetched
    return { bitcoin: 0, ethereum: 0, litecoin: 0, solana: 0 };
  }
}

export const cryptoRouter = createTRPCRouter({
  getCryptoBalance: adminProcedure.query(async ({ ctx }) => {
    if (ctx.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    try {
      // Fetch balances and prices with individual error handling
      const [solana, bitcoin, litecoin, ethereum, prices] = await Promise.all([
        getTotalSolanaBalance().catch((err) => {
          console.error("Error fetching Solana balance:", err);
          return 0;
        }),
        getTotalBitcoinBalance().catch((err) => {
          console.error("Error fetching Bitcoin balance:", err);
          return 0;
        }),
        getTotalLitecoinBalance().catch((err) => {
          console.error("Error fetching Litecoin balance:", err);
          return 0;
        }),
        getTotalEthereumBalance().catch((err) => {
          console.error("Error fetching Ethereum balance:", err);
          return 0;
        }),
        getCryptoPrices().catch((err) => {
          console.error("Error fetching prices:", err);
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
      console.error("Error in getCryptoBalance:", error);
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
    .input(
      z.object({
        type: z.enum(CryptoType),
        destination: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      if (input.type === CryptoType.SOLANA) {
        return sendSolanaBalance(input.destination);
      } else if (input.type === CryptoType.BITCOIN) {
        return sendBitcoin(input.destination);
      } else if (input.type === CryptoType.ETHEREUM) {
        return sendEthereum(input.destination);
      } else if (input.type === CryptoType.LITECOIN) {
        return sendLitecoin(input.destination);
      } else {
        throw new Error("Unsupported crypto type");
      }
    }),
});
