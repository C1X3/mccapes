import { CryptoType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import axios from "axios";

export async function getTotalBitcoinBalance(): Promise<number> {
  const SATOSHIS_PER_BTC = 1e8;

  // 1) Pull all paid, unswept BTC wallets (matches sendBalance criteria for withdrawable)
  const wallets = await prisma.wallet.findMany({
    where: {
      chain: CryptoType.BITCOIN,
      paid: true,
      withdrawn: false,
    },
    select: { address: true },
  });

  // 2) Flatten & dedupe
  const uniqueAddrs = Array.from(new Set(wallets.map((w) => w.address)));

  let totalSats = 0;

  // 3) Fetch balances via Blockstream API (FREE, no rate limits!)
  // Must fetch individually, but no rate limit issues
  for (const address of uniqueAddrs) {
    try {
      const url = `https://blockstream.info/api/address/${address}`;
      const resp = await axios.get(url, {
        timeout: 3000, // 3 second timeout
      });

      // Blockstream returns: { chain_stats: { funded_txo_sum, spent_txo_sum }, ... }
      const funded = resp.data.chain_stats.funded_txo_sum || 0;
      const spent = resp.data.chain_stats.spent_txo_sum || 0;
      const balance = funded - spent;

      totalSats += balance;
    } catch (error) {
      console.error(`Error fetching Bitcoin balance for ${address}:`, error);
      // Continue to next address instead of failing completely
    }
  }

  // 4) Convert to BTC
  return totalSats / SATOSHIS_PER_BTC;
}
