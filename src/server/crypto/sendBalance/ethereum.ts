import { JsonRpcProvider, HDNodeWallet, formatEther, parseEther } from "ethers";
import { prisma } from "@/utils/prisma";
import { CryptoType } from "@generated/client";
import { deleteCryptoWebhook } from "@/server/crypto/webhooks";

export async function sendEthereum(TARGET_ADDRESS: string) {
  const MNEMONIC = process.env.MNEMONIC;

  if (!MNEMONIC) {
    throw new Error("MNEMONIC is not set in env");
  }

  const provider = new JsonRpcProvider(
    "https://mainnet.infura.io/v3/c640af3039344ab59b56c95f0b572d14",
  );

  const wallets = await prisma.wallet.findMany({
    where: {
      chain: "ETHEREUM",
      paid: true,
      withdrawn: false,
      txHash: { not: null },
    },
    select: { id: true, depositIndex: true, address: true, webhookId: true },
  });

  if (wallets.length === 0) {
    return {
      chain: "ETHEREUM" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      txs: [] as Array<{ txId: string; amount: number }>,
      message: "No unswept ETH wallets found.",
    };
  }

  let totalSent = BigInt(0);
  const txHashes: string[] = [];
  const txs: Array<{ txId: string; amount: number }> = [];

  for (const { id, depositIndex, address, webhookId } of wallets) {
    console.log(`Processing wallet ${address} (index ${depositIndex})…`);

    const derivationPath = `m/44'/60'/0'/0/${depositIndex}`;
    const wallet = HDNodeWallet.fromPhrase(MNEMONIC, undefined, derivationPath);
    const connectedWallet = wallet.connect(provider);

    const balance = await provider.getBalance(address);
    console.log(`  Current balance: ${formatEther(balance)} ETH`);

    if (balance === BigInt(0)) {
      console.log("  Skipping (no balance)");
      continue;
    }

    try {
      // Reserve 0.0001 ETH for gas
      const reservedGas = parseEther("0.0001");

      if (balance <= reservedGas) {
        console.log(`  Skipping (insufficient balance to cover gas)`);
        // Mark dust wallets as withdrawn so they do not remain in "available" forever.
        await prisma.wallet.update({
          where: { id },
          data: {
            withdrawn: true,
          },
        });
        continue;
      }

      const valueToSend = balance - reservedGas;

      const tx = await connectedWallet.sendTransaction({
        to: TARGET_ADDRESS,
        value: valueToSend,
      });

      console.log(`  Transaction sent: ${tx.hash}`);
      console.log(`  ✅ Initiated: ${formatEther(valueToSend)} ETH`);

      totalSent += valueToSend;
      txHashes.push(tx.hash);
      txs.push({
        txId: tx.hash,
        amount: Number(formatEther(valueToSend)),
      });

      await prisma.wallet.update({
        where: { id },
        data: { withdrawn: true },
      });

      if (webhookId) {
        await deleteCryptoWebhook(CryptoType.ETHEREUM, webhookId);
      }
    } catch (error) {
      console.error(`  ❌ Error sending transaction: ${error}`);
    }
  }

  if (txHashes.length > 0) {
    console.log(`\n✅ Total sent: ${formatEther(totalSent)} ETH`);
    console.log(`Transaction hashes: ${txHashes.join(", ")}`);
  }

  console.log("All processed addresses marked as swept.");

  return {
    chain: "ETHEREUM" as const,
    initiatedCount: txHashes.length,
    txIds: txHashes,
    txs,
    message:
      txHashes.length > 0
        ? `ETH withdrawals initiated for ${txHashes.length} wallet${txHashes.length === 1 ? "" : "s"}.`
        : "No ETH balances available to sweep.",
  };
}
