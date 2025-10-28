import { JsonRpcProvider, HDNodeWallet, formatEther, parseEther } from 'ethers';
import { prisma } from '@/utils/prisma';

export async function sendEthereum(TARGET_ADDRESS: string) {
    const MNEMONIC = process.env.MNEMONIC;

    if (!MNEMONIC) {
        console.error('❌ MNEMONIC is not set in env');
        process.exit(1);
    }

    const provider = new JsonRpcProvider(
        'https://mainnet.infura.io/v3/c640af3039344ab59b56c95f0b572d14'
    );

    const wallets = await prisma.wallet.findMany({
        where: { chain: "ETHEREUM", withdrawn: false },
        select: { id: true, depositIndex: true, address: true },
    });

    if (wallets.length === 0) {
        console.log('No unswept ETH wallets found.');
        return;
    }

    let totalSent = BigInt(0);
    const txHashes: string[] = [];

    for (const { id, depositIndex, address } of wallets) {
        console.log(`Processing wallet ${address} (index ${depositIndex})…`);

        const derivationPath = `m/44'/60'/0'/0/${depositIndex}`;
        const wallet = HDNodeWallet.fromPhrase(MNEMONIC, undefined, derivationPath);
        const connectedWallet = wallet.connect(provider);

        const balance = await provider.getBalance(address);
        console.log(`  Current balance: ${formatEther(balance)} ETH`);

        if (balance === BigInt(0)) {
            console.log('  Skipping (no balance)');
            continue;
        }

        try {
            // Reserve 0.0001 ETH for gas
            const reservedGas = parseEther("0.0001");
            
            if (balance <= reservedGas) {
                console.log(`  Skipping (insufficient balance to cover gas)`);
                continue;
            }

            const valueToSend = balance - reservedGas;

            const tx = await connectedWallet.sendTransaction({
                to: TARGET_ADDRESS,
                value: valueToSend,
            });
            
            console.log(`  Transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`  ✅ Confirmed: ${formatEther(valueToSend)} ETH`);

            totalSent += valueToSend;
            txHashes.push(tx.hash);

            await prisma.wallet.update({
                where: { id },
                data: { withdrawn: true, txHash: tx.hash },
            });

        } catch (error) {
            console.error(`  ❌ Error sending transaction: ${error}`);
        }
    }

    if (txHashes.length > 0) {
        console.log(`\n✅ Total sent: ${formatEther(totalSent)} ETH`);
        console.log(`Transaction hashes: ${txHashes.join(', ')}`);
    }

    console.log('All processed addresses marked as swept.');
}