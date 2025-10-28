import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import axios from 'axios';
import { formatEther } from 'ethers';

export async function getTotalEthereumBalance(): Promise<number> {
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

    // 3) Fetch balances via public Ethereum RPC (FREE, no rate limits on public nodes)
    let totalWei = BigInt(0);

    for (const address of uniqueAddrs) {
        try {
            // Using Cloudflare's public Ethereum node (no auth required, generous limits)
            const url = 'https://cloudflare-eth.com';
            const resp = await axios.post(url, {
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            });

            if (resp.data.result) {
                // Result is hex string, convert to BigInt
                const balance = BigInt(resp.data.result);
                totalWei += balance;
            }
        } catch (error) {
            console.error(`Error fetching Ethereum balance for ${address}:`, error);
            // Continue to next address instead of failing completely
        }
    }

    // 4) Convert wei to ETH string then parse to number
    const totalEthString = formatEther(totalWei);
    return parseFloat(totalEthString);
}