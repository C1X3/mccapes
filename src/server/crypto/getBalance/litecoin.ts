import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import axios from 'axios';

export async function getTotalLitecoinBalance(): Promise<number> {
  const LITOSHI_PER_LTC = 1e8;

  // 1) Fetch all unpaid LTC wallets
  const unpaid = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
      Wallet: {
        some: {
          chain: CryptoType.LITECOIN,
          withdrawn: false,
        },
      },
    },
    select: {
      Wallet: {
        where: { chain: CryptoType.LITECOIN, withdrawn: false },
        select: { address: true },
      },
    },
  });

  // 2) Flatten & dedupe
  const allAddrs = unpaid.flatMap(o => o.Wallet.map(w => w.address));
  const uniqueAddrs = Array.from(new Set(allAddrs));

  let totalLitoshis = 0;

  // 3) Fetch balances with timeout and fallback to BlockCypher if SoChain fails
  for (const address of uniqueAddrs) {
    try {
      // Try SoChain first (free, no rate limits)
      const url = `https://sochain.com/api/v2/get_address_balance/LTC/${address}`;
      const resp = await axios.get(url, {
        timeout: 3000 // 3 second timeout
      });
      
      if (resp.data.status === 'success') {
        // SoChain returns balance as string in LTC, convert to litoshis
        const balanceLTC = parseFloat(resp.data.data.confirmed_balance);
        totalLitoshis += Math.round(balanceLTC * LITOSHI_PER_LTC);
      }
    } catch (error) {
      // Fallback to BlockCypher if SoChain fails
      try {
        const bcUrl = `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`;
        const bcResp = await axios.get(bcUrl, {
          timeout: 3000
        });
        totalLitoshis += bcResp.data.final_balance || 0;
      } catch (fallbackError) {
        console.error(`Error fetching Litecoin balance for ${address} (both APIs failed):`, error);
        // Continue to next address instead of failing completely
      }
    }
  }

  // 4) Convert to LTC and return
  return totalLitoshis / LITOSHI_PER_LTC;
}