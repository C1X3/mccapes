import 'module-alias/register';

import axios from 'axios';
import { CryptoType, OrderStatus } from '@generated';
import { prisma } from '@/utils/prisma';
import { parseUnits } from 'ethers';

const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN!;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const POLL_INTERVAL = 60 * 1000;

// how many confirmations before we consider "final"
const CONFIRMATION_THRESHOLDS: Record<CryptoType, number> = {
    [CryptoType.BITCOIN]: 3,
    [CryptoType.LITECOIN]: 6,
    [CryptoType.ETHEREUM]: 12,
    [CryptoType.SOLANA]: 1,
};

// map our enum to BlockCypher path segments
const PATH_MAP: Record<CryptoType, string> = {
    [CryptoType.BITCOIN]: 'btc',
    [CryptoType.LITECOIN]: 'ltc',
    [CryptoType.ETHEREUM]: 'eth',
    [CryptoType.SOLANA]: '',
};

async function checkPayments() {
    const wallets = await prisma.wallet.findMany({
        where: { paid: false }
    });

    for (const w of wallets) {
        const { id, chain, address, expectedAmount } = w;
        const threshold = CONFIRMATION_THRESHOLDS[chain];

        try {
            let foundTxHash: string | null = null;
            let confirmations = 0;

            if (chain !== CryptoType.SOLANA) {
                const path = PATH_MAP[chain];
                const url = `https://api.blockcypher.com/v1/${path}/main/addrs/${address}/full?limit=50&token=${BLOCKCYPHER_TOKEN}`;
                const resp = await axios.get(url);
                const txs = resp.data.txs as Array<{
                    hash: string;
                    confirmations: number;
                    outputs: Array<{ addresses: string[], value: number }>;
                }>;

                const expectedUnits = chain === CryptoType.ETHEREUM
                    ? BigInt(parseUnits(expectedAmount.toString(), 18).toString())
                    : BigInt(Math.round(Number(expectedAmount) * 1e8));

                const match = txs.find(tx => {
                    const received = tx.outputs
                        .filter(o => o.addresses.includes(address))
                        .reduce((sum, o) => sum + BigInt(o.value), BigInt(0));
                    return received >= expectedUnits;
                });

                if (match) {
                    foundTxHash = match.hash;
                    confirmations = match.confirmations;
                }
            } else {
                const helApiUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

                const sigResp = await axios.post(helApiUrl, {
                    jsonrpc: "2.0",
                    id: "1",
                    method: "getSignaturesForAddress",
                    params: [
                        address,
                        { limit: 20 }
                    ]
                });
                const sigInfos = sigResp.data.result as Array<{
                    signature: string;
                    confirmationStatus: string;
                }>;

                const matchSig = sigInfos.find(s => s.confirmationStatus === 'confirmed');
                if (matchSig) {
                    const balResp = await axios.post(helApiUrl, {
                        jsonrpc: "2.0",
                        id: "2",
                        method: "getBalance",
                        params: [address]
                    });
                    const currentLamports = BigInt(balResp.data.result.value as number);

                    const expectedLamports = BigInt(parseUnits(expectedAmount.toString(), 9).toString());
                    if (currentLamports >= expectedLamports) {
                        foundTxHash = matchSig.signature;
                        confirmations = 1;
                    }
                }
            }

            if (confirmations >= threshold) {
                await prisma.wallet.update({
                    where: { id },
                    data: { paid: true, txHash: foundTxHash, confirmations }
                });

                await prisma.order.update({
                    where: { id: w.orderId },
                    data: { status: OrderStatus.PAID }
                });
            } else if (foundTxHash && confirmations < threshold) {
                await prisma.wallet.update({
                    where: { id },
                    data: {
                        paid: false,
                        txHash: foundTxHash,
                        confirmations,
                    }
                });
            }
        } catch (err) {
            console.error(`Error checking wallet ${id} (${chain}):`, err);
        }
    }
}

(async function pollLoop() {
    try {
        while (true) {
            await checkPayments();
            await new Promise(res => setTimeout(res, POLL_INTERVAL));
        }
    } catch (err) {
        console.error('Polling loop failed:', err);
    } finally {
        await prisma.$disconnect();
    }
})();
