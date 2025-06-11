import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import axios from 'axios';

export async function getTotalLitecoinBalance(): Promise<number> {
  const LITOSHI_PER_LTC = 1e8;
  const BATCH_SIZE = 50;  // BlockCypher limit per request

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

  // 3) Batch‐fetch via BlockCypher
  for (let i = 0; i < uniqueAddrs.length; i += BATCH_SIZE) {
    const batch = uniqueAddrs.slice(i, i + BATCH_SIZE);
    const path = batch.join(';');
    const url = `https://api.blockcypher.com/v1/ltc/main/addrs/${path}/balance`;

    // BlockCypher returns array if >1 addr, else object
    const resp = await axios.get(url);
    const data = Array.isArray(resp.data) ? resp.data : [resp.data];

    for (const addrInfo of data) {
      totalLitoshis += addrInfo.final_balance;
    }
  }

  // 4) Convert to LTC and return
  return totalLitoshis / LITOSHI_PER_LTC;
}