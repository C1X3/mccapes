import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import axios from 'axios';

export async function getTotalBitcoinBalance(): Promise<number> {
    const SATOSHIS_PER_BTC = 1e8;

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

    // 3) Fetch balances via Blockstream API (FREE, no rate limits!)
    // Must fetch individually, but no rate limit issues
    for (const address of uniqueAddrs) {
        try {
            const url = `https://blockstream.info/api/address/${address}`;
            const resp = await axios.get(url);
            
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
