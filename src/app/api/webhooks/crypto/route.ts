import { NextRequest, NextResponse } from "next/server";
import { CryptoType } from "@generated/client";
import { parseUnits } from "ethers";
import { prisma } from "@/utils/prisma";
import { settleCryptoWalletPayment } from "@/server/orders/fulfill";

function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return BigInt(value);
    } catch {
      return BigInt(0);
    }
  }
  return BigInt(0);
}

function looksLikeEthAddress(value: string) {
  return /^0x?[0-9a-fA-F]{40}$/.test(value.trim());
}

function normalizeEthAddress(value: string) {
  return value.trim().toLowerCase().replace(/^0x/, "");
}

async function settleMatchingWallet(
  address: string,
  receivedBaseUnits: bigint,
  txHash: string | undefined,
  chainHint?: CryptoType,
) {
  const effectiveChainHint = chainHint ?? (looksLikeEthAddress(address) ? CryptoType.ETHEREUM : undefined);
  let wallet =
    effectiveChainHint === CryptoType.ETHEREUM
      ? null
      : await prisma.wallet.findFirst({
          where: {
            paid: false,
            ...(effectiveChainHint ? { chain: effectiveChainHint } : {}),
            address: { equals: address, mode: "insensitive" as const },
          },
        });

  if (!wallet && effectiveChainHint === CryptoType.ETHEREUM) {
    const normalizedTarget = normalizeEthAddress(address);
    const ethWallets = await prisma.wallet.findMany({
      where: { paid: false, chain: CryptoType.ETHEREUM },
    });
    wallet =
      ethWallets.find(
        (candidate) => normalizeEthAddress(candidate.address) === normalizedTarget,
      ) ?? null;
  }

  if (!wallet) {
    return false;
  }

  const decimals = wallet.chain === CryptoType.ETHEREUM ? 18 : wallet.chain === CryptoType.SOLANA ? 9 : 8;
  const expectedBaseUnits = toBigInt(
    parseUnits(wallet.expectedAmount.toString(), decimals).toString(),
  );

  if (receivedBaseUnits < expectedBaseUnits) {
    return false;
  }

  await settleCryptoWalletPayment({
    walletId: wallet.id,
    txHash: txHash ?? null,
    confirmations: 1,
  });

  return true;
}

async function handleBlockcypherPayload(payload: any) {
  const outputSource = Array.isArray(payload?.outputs)
    ? payload.outputs
    : Array.isArray(payload?.tx?.outputs)
      ? payload.tx.outputs
      : [];
  const outputs = outputSource;
  const txHash = payload?.hash || payload?.tx?.hash;
  let settledCount = 0;

  for (const output of outputs) {
    const addresses = Array.isArray(output?.addresses) ? output.addresses : [];
    const value = toBigInt(output?.value);

    for (const rawAddress of addresses) {
      if (typeof rawAddress !== "string") {
        continue;
      }

      const chainHint = looksLikeEthAddress(rawAddress)
        ? CryptoType.ETHEREUM
        : undefined;

      if (
        await settleMatchingWallet(
          rawAddress,
          value,
          typeof txHash === "string" ? txHash : undefined,
          chainHint,
        )
      ) {
        settledCount += 1;
      }
    }
  }

  return settledCount;
}

async function handleHeliusPayload(payload: any) {
  const events = Array.isArray(payload) ? payload : [payload];
  let settledCount = 0;

  for (const event of events) {
    const txHash =
      typeof event?.signature === "string"
        ? event.signature
        : typeof event?.transactionSignature === "string"
          ? event.transactionSignature
          : undefined;

    const nativeTransfers = Array.isArray(event?.nativeTransfers)
      ? event.nativeTransfers
      : [];

    for (const transfer of nativeTransfers) {
      const toAddress =
        typeof transfer?.toUserAccount === "string"
          ? transfer.toUserAccount
          : typeof transfer?.to === "string"
            ? transfer.to
            : typeof transfer?.toAccount === "string"
              ? transfer.toAccount
              : null;

      if (!toAddress) {
        continue;
      }

      const amountLamports = toBigInt(transfer?.amount ?? transfer?.lamports);

      if (
        await settleMatchingWallet(
          toAddress,
          amountLamports,
          txHash,
          CryptoType.SOLANA,
        )
      ) {
        settledCount += 1;
      }
    }

    const accountData = Array.isArray(event?.accountData) ? event.accountData : [];
    for (const accountEntry of accountData) {
      const account =
        typeof accountEntry?.account === "string"
          ? accountEntry.account
          : typeof accountEntry?.accountAddress === "string"
            ? accountEntry.accountAddress
            : null;

      if (!account) {
        continue;
      }

      const delta = toBigInt(
        accountEntry?.nativeBalanceChange ?? accountEntry?.balanceChange,
      );

      if (delta <= BigInt(0)) {
        continue;
      }

      if (
        await settleMatchingWallet(account, delta, txHash, CryptoType.SOLANA)
      ) {
        settledCount += 1;
      }
    }
  }

  return settledCount;
}

export async function POST(request: NextRequest) {
  let payload: any;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const isLikelyHelius =
      Array.isArray(payload) ||
      Boolean(payload?.nativeTransfers) ||
      Boolean(payload?.accountData) ||
      payload?.type === "ENHANCED";

    const settledCount = isLikelyHelius
      ? await handleHeliusPayload(payload)
      : await handleBlockcypherPayload(payload);

    return NextResponse.json({ ok: true, settledCount }, { status: 200 });
  } catch (error) {
    console.error("Failed to process crypto webhook", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
