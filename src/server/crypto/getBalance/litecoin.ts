import { CryptoType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import axios from "axios";

export async function getTotalLitecoinBalance(): Promise<number> {
  const LITOSHI_PER_LTC = 1e8;

  // 1) Fetch all paid, unswept LTC wallets (matches sendBalance criteria for withdrawable)
  const wallets = await prisma.wallet.findMany({
    where: {
      chain: CryptoType.LITECOIN,
      paid: true,
      withdrawn: false,
    },
    select: { address: true },
  });

  // 2) Flatten & dedupe
  const uniqueAddrs = Array.from(new Set(wallets.map((w) => w.address)));

  let totalLitoshis = 0;

  const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
  const bcUrl = (addr: string) =>
    blockcypherToken
      ? `https://api.blockcypher.com/v1/ltc/main/addrs/${addr}/balance?token=${blockcypherToken}`
      : `https://api.blockcypher.com/v1/ltc/main/addrs/${addr}/balance`;

  // 3) Fetch balances - try BlockCypher first (more reliable with token), fallback to SoChain
  for (const address of uniqueAddrs) {
    let balance = 0;

    // Try BlockCypher first when we have a token (higher rate limit, more reliable)
    if (blockcypherToken) {
      try {
        const resp = await axios.get(bcUrl(address), { timeout: 8000 });
        balance = resp.data?.final_balance ?? 0;
      } catch {
        // Fall through to SoChain
      }
    }

    // Fallback: SoChain (slower, may timeout)
    if (balance === 0) {
      try {
        const url = `https://sochain.com/api/v2/get_address_balance/LTC/${address}`;
        const resp = await axios.get(url, { timeout: 8000 });
        if (resp.data?.status === "success") {
          const balanceLTC = parseFloat(resp.data.data.confirmed_balance);
          balance = Math.round(balanceLTC * LITOSHI_PER_LTC);
        }
      } catch (error) {
        // Last resort: BlockCypher without token
        if (!blockcypherToken) {
          try {
            const resp = await axios.get(bcUrl(address), { timeout: 8000 });
            balance = resp.data?.final_balance ?? 0;
          } catch {
            // Skip - don't spam console
          }
        }
      }
    }

    totalLitoshis += balance;
  }

  // 4) Convert to LTC and return
  return totalLitoshis / LITOSHI_PER_LTC;
}
