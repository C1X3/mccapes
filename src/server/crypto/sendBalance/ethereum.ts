import { prisma } from "@/utils/prisma";
import { CryptoType, OrderStatus } from "@generated";
import { ethers } from "ethers";

// — Ethereum sweep —
export async function sendEthereumBalance(destination: string): Promise<void> {
    if (!process.env.ETHEREUM_RPC_URL)
        throw new Error('ETHEREUM_RPC_URL not set');

    // 1) fetch unpaid ETH wallets
    const unpaid = await prisma.order.findMany({
        where: {
            status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
            Wallet: {
                some: { chain: CryptoType.ETHEREUM, withdrawn: false },
            },
        },
        select: {
            Wallet: {
                where: { chain: CryptoType.ETHEREUM, withdrawn: false },
                select: { address: true, depositIndex: true },
            },
        },
    });
    const indexes = Array.from(
        new Set(
            unpaid.flatMap(o =>
                o.Wallet.map(w => JSON.stringify({ address: w.address, index: w.depositIndex }))
            )
        )
    ).map(s => JSON.parse(s) as { address: string; index: number });

    // 2) prepare ethers.js
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.ETHEREUM_RPC_URL
    );

    // 3) sweep each
    for (const { address, index } of indexes) {
        // derive via BIP44 (m/44'/60'/0'/0/index)
        const hdNode = ethers.utils
            .HDNode.fromMnemonic(process.env.MNEMONIC!)
            .derivePath(`m/44'/60'/0'/0/${index}`);
        const wallet = new ethers.Wallet(hdNode.privateKey, provider);

        const balance = await wallet.getBalance();
        if (balance.isZero()) continue;

        const feeData = await provider.getFeeData();
        const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice!;
        const gasLimit = ethers.BigNumber.from(21_000);
        const fee = gasPrice.mul(gasLimit);
        if (balance.lte(fee)) continue;

        const value = balance.sub(fee);
        const tx = await wallet.sendTransaction({
            to: destination,
            value,
            gasPrice,
            gasLimit,
        });
        await tx.wait();
        console.log(
            `Sent ${ethers.utils.formatEther(value)} ETH from index ${index} — tx ${tx.hash}`
        );

        // mark withdrawn
        await prisma.wallet.updateMany({
            where: { chain: CryptoType.ETHEREUM, address },
            data: { withdrawn: true },
        });
    }
}