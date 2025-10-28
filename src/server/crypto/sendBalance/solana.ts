import { prisma } from "@/utils/prisma";
import { OrderStatus, CryptoType } from "@generated";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";

function solanaKeypairFromMnemonic(mnemonic: string, index: number): Keypair {
    const seed = mnemonicToSeedSync(mnemonic);
    const seedHex = seed.toString('hex');
    const path = `m/44'/501'/${index}'/0'`;
    const { key } = derivePath(path, seedHex);
    return Keypair.fromSeed(key.slice(0, 32));
}

export async function sendSolanaBalance(destination: string): Promise<void> {
    // 1) Fetch orders with unpaid SOL wallets
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
            id: true,
            Wallet: {
                where: { chain: CryptoType.SOLANA, withdrawn: false },
                select: { address: true, depositIndex: true },
            },
        },
    });

    if (unpaid.length === 0) {
        console.log('No unswept SOL wallets found.');
        return;
    }

    // 2) Flatten & dedupe derive-indexes
    const indexes = Array.from(
        new Set(
            unpaid.flatMap(o => o.Wallet.map(w => ({ address: w.address, index: w.depositIndex })))
        )
    );

    // 3) Setup connection & destination
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const destPubkey = new PublicKey(destination);

    for (const idx of indexes) {
        // derive keypair
        const kp = solanaKeypairFromMnemonic(process.env.MNEMONIC!, idx.index);
        const balance = await connection.getBalance(kp.publicKey);

        // skip empty accounts
        if (balance === 0) continue;

        // estimate fee
        const { blockhash: feeBlockhash } = await connection.getLatestBlockhash('confirmed');
        const feeTx = new Transaction({ feePayer: kp.publicKey, recentBlockhash: feeBlockhash })
            .add(
                SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: destPubkey, lamports: balance })
            );
        const feeResponse = await connection.getFeeForMessage(feeTx.compileMessage(), 'confirmed');
        const fee = feeResponse.value ?? 0;

        // compute sendable lamports
        const lamportsToSend = balance - fee;
        if (lamportsToSend <= 0) continue;

        // build actual send tx
        const { blockhash: sendBlockhash } = await connection.getLatestBlockhash('confirmed');
        const sendTx = new Transaction({ feePayer: kp.publicKey, recentBlockhash: sendBlockhash })
            .add(
                SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: destPubkey, lamports: lamportsToSend })
            );

        // sign & send
        sendTx.sign(kp);
        const raw = sendTx.serialize();
        const sig = await connection.sendRawTransaction(raw);
        await connection.confirmTransaction(sig, 'confirmed');

        console.log(
            `Sent ${(lamportsToSend / LAMPORTS_PER_SOL).toFixed(6)} SOL from index ${idx.index} — tx ${sig}`
        );

        // mark withdrawn in DB
        await prisma.wallet.updateMany({
            where: { chain: CryptoType.SOLANA, address: idx.address },
            data: { withdrawn: true, txHash: sig }
        });
    }

    console.log('All addresses marked as swept.');
}