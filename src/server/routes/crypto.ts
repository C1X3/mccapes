import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../init";
import { CryptoType } from "@generated/client";
import { TRPCError } from "@trpc/server";
import { sendSolanaBalance } from "../crypto/sendBalance/solana";
import { sendBitcoin } from "../crypto/sendBalance/bitcoin";
import { sendLitecoin } from "../crypto/sendBalance/litecoin";
import { sendEthereum } from "../crypto/sendBalance/ethereum";
import Coingecko from "@coingecko/coingecko-typescript";
import { prisma } from "@/utils/prisma";
import axios from "axios";

const DUST_PRUNE_INTERVAL_MS = 10 * 60 * 1000;

declare global {
  var CRYPTO_DUST_PRUNE_LAST_RUN_MS: number | undefined;
}

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

async function getWithdrawableBalancesFromDb() {
  const now = Date.now();
  const lastRun = globalThis.CRYPTO_DUST_PRUNE_LAST_RUN_MS ?? 0;
  if (now - lastRun > DUST_PRUNE_INTERVAL_MS) {
    await pruneDustWalletsAllChains();
    globalThis.CRYPTO_DUST_PRUNE_LAST_RUN_MS = now;
  }

  const rows = await prisma.wallet.groupBy({
    by: ["chain"],
    where: {
      paid: true,
      withdrawn: false,
      txHash: { not: null },
    },
    _sum: {
      expectedAmount: true,
    },
  });

  const totals = {
    solana: 0,
    bitcoin: 0,
    litecoin: 0,
    ethereum: 0,
  };

  for (const row of rows) {
    const amount = Number(row._sum.expectedAmount ?? 0);
    if (row.chain === CryptoType.SOLANA) totals.solana = amount;
    if (row.chain === CryptoType.BITCOIN) totals.bitcoin = amount;
    if (row.chain === CryptoType.LITECOIN) totals.litecoin = amount;
    if (row.chain === CryptoType.ETHEREUM) totals.ethereum = amount;
  }

  return totals;
}

async function pruneDustWalletsAllChains() {
  const reserveGasWei = BigInt("100000000000000"); // 0.0001 ETH
  const reserveSolLamports = BigInt(5000); // Typical SOL transfer fee reserve
  const reserveBtcSats = 1000; // Practical dust cutoff for BTC sweepability
  const reserveLtcLitoshis = 1000; // Practical dust cutoff for LTC sweepability
  const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
  const heliusKey = process.env.HELIUS_API_KEY;
  const solanaRpcUrl = heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : "https://api.mainnet-beta.solana.com";

  const wallets = await prisma.wallet.findMany({
    where: { paid: true, withdrawn: false, txHash: { not: null } },
    select: { id: true, chain: true, address: true },
  });

  if (wallets.length === 0) {
    return;
  }

  const dustWalletIds: string[] = [];
  for (const wallet of wallets) {
    try {
      if (wallet.chain === CryptoType.ETHEREUM) {
        const resp = await axios.post(
          "https://ethereum.publicnode.com",
          {
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [wallet.address, "latest"],
            id: 1,
          },
          { timeout: 6000 },
        );
        const rawHex = resp.data?.result;
        if (typeof rawHex === "string" && BigInt(rawHex) <= reserveGasWei) {
          dustWalletIds.push(wallet.id);
        }
        continue;
      }

      if (wallet.chain === CryptoType.SOLANA) {
        const resp = await axios.post(
          solanaRpcUrl,
          {
            jsonrpc: "2.0",
            method: "getBalance",
            params: [wallet.address],
            id: 1,
          },
          { timeout: 6000 },
        );
        const lamports = BigInt(resp.data?.result?.value ?? 0);
        if (lamports <= reserveSolLamports) {
          dustWalletIds.push(wallet.id);
        }
        continue;
      }

      if (wallet.chain === CryptoType.BITCOIN) {
        const resp = await axios.get(
          `https://blockstream.info/api/address/${wallet.address}`,
          { timeout: 6000 },
        );
        const funded = resp.data?.chain_stats?.funded_txo_sum ?? 0;
        const spent = resp.data?.chain_stats?.spent_txo_sum ?? 0;
        const sats = funded - spent;
        if (sats <= reserveBtcSats) {
          dustWalletIds.push(wallet.id);
        }
        continue;
      }

      if (wallet.chain === CryptoType.LITECOIN) {
        const bcUrl = blockcypherToken
          ? `https://api.blockcypher.com/v1/ltc/main/addrs/${wallet.address}/balance?token=${blockcypherToken}`
          : `https://api.blockcypher.com/v1/ltc/main/addrs/${wallet.address}/balance`;
        const resp = await axios.get(bcUrl, { timeout: 8000 });
        const litoshis = Number(resp.data?.final_balance ?? 0);
        if (litoshis <= reserveLtcLitoshis) {
          dustWalletIds.push(wallet.id);
        }
      }
    } catch {
      // Ignore transient RPC issues and keep wallet as-is.
    }
  }

  if (dustWalletIds.length > 0) {
    await prisma.wallet.updateMany({
      where: { id: { in: dustWalletIds } },
      data: { withdrawn: true },
    });
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
      // Use DB-backed withdrawable totals so admin balance is deterministic.
      // This reflects wallets eligible for sweep: paid=true && withdrawn=false.
      const [balances, prices] = await Promise.all([
        getWithdrawableBalancesFromDb().catch((err) => {
          console.error("Error fetching DB-backed crypto balances:", err);
          return { bitcoin: 0, ethereum: 0, litecoin: 0, solana: 0 };
        }),
        getCryptoPrices().catch((err) => {
          console.error("Error fetching prices:", err);
          return { bitcoin: 0, ethereum: 0, litecoin: 0, solana: 0 };
        }),
      ]);

      const { solana, bitcoin, litecoin, ethereum } = balances;

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
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const ownerPass = process.env.OWNER_PASS?.trim();
      if (!ownerPass) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Owner password is not configured",
        });
      }
      if (input.password !== ownerPass) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password",
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
