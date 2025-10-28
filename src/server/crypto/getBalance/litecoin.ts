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

  // 3) Fetch balances via SoChain API (FREE, generous rate limits)
  for (const address of uniqueAddrs) {
    try {
      const url = `https://sochain.com/api/v2/get_address_balance/LTC/${address}`;
      const resp = await axios.get(url);
      
      if (resp.data.status === 'success') {
        // SoChain returns balance as string in LTC, convert to litoshis
        const balanceLTC = parseFloat(resp.data.data.confirmed_balance);
        totalLitoshis += Math.round(balanceLTC * LITOSHI_PER_LTC);
      }
    } catch (error) {
      console.error(`Error fetching Litecoin balance for ${address}:`, error);
      // Continue to next address instead of failing completely
    }
  }

  // 4) Convert to LTC and return
  return totalLitoshis / LITOSHI_PER_LTC;
}