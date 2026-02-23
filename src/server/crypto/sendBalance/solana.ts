import { prisma } from "@/utils/prisma";
import { OrderStatus, CryptoType } from "@generated/client";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { deleteCryptoWebhook } from "@/server/crypto/webhooks";

function solanaKeypairFromMnemonic(mnemonic: string, index: number): Keypair {
  const seed = mnemonicToSeedSync(mnemonic);
  const seedHex = seed.toString("hex");
  const path = `m/44'/501'/${index}'/0'`;
  const { key } = derivePath(path, seedHex);
  return Keypair.fromSeed(key.slice(0, 32));
}

export async function sendSolanaBalance(destination: string) {
  // 1) Fetch orders with unpaid SOL wallets
  const unpaid = await prisma.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
      Wallet: {
        some: {
          chain: CryptoType.SOLANA,
          paid: true,
          withdrawn: false,
        },
      },
    },
    select: {
      id: true,
      Wallet: {
        where: {
          chain: CryptoType.SOLANA,
          paid: true,
          withdrawn: false,
          txHash: { not: null },
        },
        select: { id: true, address: true, depositIndex: true, webhookId: true },
      },
    },
  });

  if (unpaid.length === 0) {
    console.log("No unswept SOL wallets found.");
    return {
      chain: "SOLANA" as const,
      initiatedCount: 0,
      txIds: [] as string[],
      txs: [] as Array<{ txId: string; amount: number }>,
      message: "No unswept SOL wallets found.",
    };
  }

  // 2) Flatten & dedupe derive-indexes
  const deduped = new Map<
    string,
    { address: string; index: number; webhookId: string | null }
  >();
  for (const order of unpaid) {
    for (const wallet of order.Wallet) {
      deduped.set(`${wallet.address}:${wallet.depositIndex}`, {
        address: wallet.address,
        index: wallet.depositIndex,
        webhookId: wallet.webhookId,
      });
    }
  }
  const indexes = Array.from(deduped.values());

  // 3) Setup connection & destination
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const destPubkey = new PublicKey(destination);
  const txIds: string[] = [];
  const txs: Array<{ txId: string; amount: number }> = [];

  for (const idx of indexes) {
    try {
      // derive keypair
      const kp = solanaKeypairFromMnemonic(process.env.MNEMONIC!, idx.index);
      const balance = await connection.getBalance(kp.publicKey);

      // skip empty accounts
      if (balance === 0) {
        await prisma.wallet.updateMany({
          where: { chain: CryptoType.SOLANA, address: idx.address },
          data: { withdrawn: true },
        });
        continue;
      }

      // estimate fee
      const { blockhash: feeBlockhash } =
        await connection.getLatestBlockhash("confirmed");
      const feeTx = new Transaction({
        feePayer: kp.publicKey,
        recentBlockhash: feeBlockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: kp.publicKey,
          toPubkey: destPubkey,
          lamports: balance,
        }),
      );
      const feeResponse = await connection.getFeeForMessage(
        feeTx.compileMessage(),
        "confirmed",
      );
      const fee = feeResponse.value ?? 0;

      // compute sendable lamports
      const lamportsToSend = balance - fee;
      if (lamportsToSend <= 0) {
        await prisma.wallet.updateMany({
          where: { chain: CryptoType.SOLANA, address: idx.address },
          data: { withdrawn: true },
        });
        continue;
      }

      // build actual send tx
      const { blockhash: sendBlockhash } =
        await connection.getLatestBlockhash("confirmed");
      const sendTx = new Transaction({
        feePayer: kp.publicKey,
        recentBlockhash: sendBlockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: kp.publicKey,
          toPubkey: destPubkey,
          lamports: lamportsToSend,
        }),
      );

      // sign & send; do not wait for full confirmation so admin gets immediate feedback.
      sendTx.sign(kp);
      const raw = sendTx.serialize();
      const sig = await connection.sendRawTransaction(raw);
      txIds.push(sig);
      txs.push({ txId: sig, amount: lamportsToSend / LAMPORTS_PER_SOL });

      console.log(
        `Initiated ${(lamportsToSend / LAMPORTS_PER_SOL).toFixed(6)} SOL from index ${idx.index} — tx ${sig}`,
      );

      // mark withdrawn in DB
      await prisma.wallet.updateMany({
        where: { chain: CryptoType.SOLANA, address: idx.address },
        data: { withdrawn: true, txHash: sig },
      });

      if (idx.webhookId) {
        await deleteCryptoWebhook(CryptoType.SOLANA, idx.webhookId);
      }
    } catch (error) {
      console.error(`Failed to sweep SOL wallet index ${idx.index}:`, error);
    }
  }

  console.log("All addresses marked as swept.");

  return {
    chain: "SOLANA" as const,
    initiatedCount: txIds.length,
    txIds,
    txs,
    message:
      txIds.length > 0
        ? `SOL withdrawals initiated for ${txIds.length} wallet${txIds.length === 1 ? "" : "s"}.`
        : "No SOL balances available to sweep.",
  };
}
