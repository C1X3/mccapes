import { CryptoType, OrderStatus } from '@generated';
import {
    Connection,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js';
import { prisma } from '@/utils/prisma';

export async function getTotalSolanaBalance(): Promise<number> {
    // 1. Fetch all unpaid Solana‐wallet records and pluck their addresses:
    const unpaid = await prisma.order.findMany({
        where: {
            status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
            Wallet: {
                some: {
                    chain: CryptoType.SOLANA,
                    withdrawn: false,
                },
            },
        },
        select: {
            Wallet: {
                where: { chain: CryptoType.SOLANA, withdrawn: false },
                select: { address: true },
            },
        },
    });

    // 2. Flatten & dedupe the addresses:
    const allAddrs = unpaid
        .flatMap((o) => o.Wallet.map((w) => w.address))
        .filter(Boolean);
    const uniqueAddrs = Array.from(new Set(allAddrs));

    // 3. Convert to PublicKey objects:
    const pubkeys = uniqueAddrs.map((addr) => new PublicKey(addr));

    // 4. Batch‐fetch balances via getMultipleAccountsInfo:
    const conn = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    const BATCH_SIZE = 100;
    let totalLamports = 0;

    for (let i = 0; i < pubkeys.length; i += BATCH_SIZE) {
        const batch = pubkeys.slice(i, i + BATCH_SIZE);
        const infos = await conn.getMultipleAccountsInfo(batch);
        totalLamports += infos.reduce(
            (sum, info) => sum + (info?.lamports ?? 0),
            0
        );
    }

    // 5. Convert to SOL and return:
    return totalLamports / LAMPORTS_PER_SOL;
}