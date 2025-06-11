import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import axios from 'axios';

export async function getTotalBitcoinBalance(): Promise<number> {
    const SATOSHIS_PER_BTC = 1e8;
    const BATCH_SIZE = 50;   // BlockCypher allows up to ~50 addrs per request

    // 1) Pull all unpaid BTC‐chain wallets
    const unpaid = await prisma.order.findMany({
        where: {
            status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
            Wallet: {
                some: {
                    chain: CryptoType.BITCOIN,
                    withdrawn: false,
                },
            },
        },
        select: {
            Wallet: {
                where: { chain: CryptoType.BITCOIN, withdrawn: false },
                select: { address: true },
            },
        },
    });

    // 2) Flatten & dedupe
    const allAddrs = unpaid.flatMap(o => o.Wallet.map(w => w.address));
    const uniqueAddrs = Array.from(new Set(allAddrs));

    let totalSats = 0;

    // 3) Batch‐fetch via BlockCypher
    for (let i = 0; i < uniqueAddrs.length; i += BATCH_SIZE) {
        const batch = uniqueAddrs.slice(i, i + BATCH_SIZE);
        const path = batch.join(';');
        const url = `https://api.blockcypher.com/v1/btc/main/addrs/${path}/balance`;

        // returns either a single object (1 addr) or an array (multi-addr)
        const resp = await axios.get(url);
        const data = Array.isArray(resp.data) ? resp.data : [resp.data];

        // final_balance is in satoshis
        for (const addrInfo of data) {
            totalSats += addrInfo.final_balance;
        }
    }

    // 4) Convert to BTC
    return totalSats / SATOSHIS_PER_BTC;
}
