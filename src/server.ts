import dotenv from "dotenv";
import "module-alias/register";
dotenv.config(); // Load .env variables

import axios from 'axios';
import { CryptoType, OrderStatus, PaymentType } from '@generated';
import { prisma } from '@/utils/prisma';
import { parseUnits } from 'ethers';
import { sendOrderCompleteEmail } from "./utils/email";

const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN!;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const POLL_INTERVAL = 30 * 1000;

// how many confirmations before we consider "final"
const CONFIRMATION_THRESHOLDS: Record<CryptoType, number> = {
    [CryptoType.BITCOIN]: 1,
    [CryptoType.LITECOIN]: 1,
    [CryptoType.ETHEREUM]: 1,
    [CryptoType.SOLANA]: 1,
};

// map our enum to BlockCypher path segments
const PATH_MAP: Record<CryptoType, string> = {
    [CryptoType.BITCOIN]: 'btc',
    [CryptoType.LITECOIN]: 'ltc',
    [CryptoType.ETHEREUM]: 'eth',
    [CryptoType.SOLANA]: '',
};

function normalizeHex(addr: string) {
    return addr.toLowerCase().replace(/^0x/, "");
}

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

                const normalizedAddr = normalizeHex(address);
                const match = txs.find(tx => {
                    const received = tx.outputs
                        .filter(o =>
                            // for each output address array, see if **any** entry matches
                            o.addresses.some(a => normalizeHex(a) === normalizedAddr)
                        )
                        .reduce((sum, o) => sum + BigInt(o.value), BigInt(0));

                    return received >= expectedUnits;
                });

                console.log(match);

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

                if (!sigInfos.length) {
                    console.log(w, 'No signatures found');
                    continue;
                }

                const matchSig = sigInfos.find(s => s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized');
                if (matchSig) {
                    const balResp = await axios.post(helApiUrl, {
                        jsonrpc: "2.0",
                        id: "2",
                        method: "getBalance",
                        params: [address]
                    });
                    const currentLamports = BigInt(balResp.data.result.value as number);

                    console.log(w, currentLamports);

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

                const order = await prisma.order.update({
                    where: { id: w.orderId },
                    data: { status: OrderStatus.PAID },
                    include: {
                        OrderItem: true
                    }
                });

                for (const item of order.OrderItem) {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId },
                        select: {
                            stock: true,
                        }
                    });

                    if (!product) continue;

                    if (product.stock.length < item.quantity) continue;

                    const oldestStock = product.stock.slice(0, item.quantity);
                    const filteredStock = product.stock.filter(stock => !oldestStock.includes(stock));
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: filteredStock },
                    });

                    await prisma.orderItem.update({
                        where: { id: item.id },
                        data: {
                            codes: oldestStock,
                        }
                    });
                }

                const fullOrderDetails = await prisma.order.findUnique({
                    where: { id: w.orderId },
                    include: {
                        customer: true,
                        OrderItem: {
                            include: {
                                product: true
                            }
                        }
                    }
                });

                if (fullOrderDetails) {
                    await sendOrderCompleteEmail({
                        customerName: fullOrderDetails.customer.name,
                        customerEmail: fullOrderDetails.customer.email,
                        orderId: w.orderId,
                        totalPrice: fullOrderDetails.totalPrice,
                        paymentFee: fullOrderDetails.paymentFee,
                        totalWithFee: fullOrderDetails.totalPrice + fullOrderDetails.paymentFee,
                        paymentType: fullOrderDetails.paymentType,
                        orderDate: fullOrderDetails.createdAt.toISOString(),
                        items: fullOrderDetails.OrderItem.map(i => ({
                            name: i.product.name,
                            price: i.price,
                            quantity: i.quantity,
                            codes: i.codes,
                            image: i.product.image
                        }))
                    });

                    if (order.couponUsed) {
                        await prisma.coupon.update({
                            where: { id: order.couponUsed },
                            data: { usageCount: { increment: 1 } },
                        });
                    }
                }
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

async function expireOrders() {
    await prisma.order.updateMany({
        where: {
            status: OrderStatus.PENDING,
            paymentType: { in: [PaymentType.STRIPE, PaymentType.PAYPAL] },
            createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }
        },
        data: { status: OrderStatus.CANCELLED }
    });
}

(async function pollLoop() {
    try {
        while (true) {
            console.log('Checking payments...');
            await checkPayments();
            await expireOrders();
            await new Promise(res => setTimeout(res, POLL_INTERVAL));
        }
    } catch (err) {
        console.error('Polling loop failed:', err);
    } finally {
        await prisma.$disconnect();
    }
})();
