import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import axios from 'axios';
import { formatEther } from 'ethers';

export async function getTotalEthereumBalance(): Promise<number> {
    const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN!;
    const BLOCKCYPHER_BASE_URL = 'https://api.blockcypher.com/v1/eth/main/addrs';
    const ADDRS_PER_REQUEST = 20;

    function chunkArray<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    const unpaid = await prisma.order.findMany({
        where: {
            status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
            Wallet: {
                some: {
                    chain: CryptoType.ETHEREUM,
                    withdrawn: false,
                },
            },
        },
        select: {
            Wallet: {
                where: { chain: CryptoType.ETHEREUM, withdrawn: false },
                select: { address: true },
            },
        },
    });

    // 2) Flatten & dedupe addresses
    const allAddrs = unpaid.flatMap(o => o.Wallet.map(w => w.address));
    const uniqueAddrs = Array.from(new Set(allAddrs));

    // 3) Batch-fetch via BlockCypher and sum using BigInt
    let totalWei = BigInt(0);
    const batches = chunkArray(uniqueAddrs, ADDRS_PER_REQUEST);

    for (const batch of batches) {
        const path = batch.join(';');
        const url = `${BLOCKCYPHER_BASE_URL}/${path}/balance?token=${BLOCKCYPHER_TOKEN}`;
        const resp = await axios.get(url);
        const data = Array.isArray(resp.data) ? resp.data : [resp.data];

        for (const addrInfo of data) {
            totalWei = totalWei + BigInt(addrInfo.final_balance);
        }
    }

    // 4) Convert wei to ETH string then parse to number
    const totalEthString = formatEther(totalWei);
    return parseFloat(totalEthString);
}