import dotenv from "dotenv";
import "module-alias/register";
dotenv.config(); // Load .env variables

import axios from "axios";
import { CryptoType, OrderStatus, PaymentType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { parseUnits } from "ethers";
import { sendOrderCompleteEmail } from "./server/email/send";

const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN!;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const POLL_INTERVAL = 30 * 1000;
const REQUEST_DELAY = 1000; // 1 second delay between requests to avoid rate limits

// Rate limit tracking
let blockCypherRetryAfter = 0; // Timestamp when we can retry BlockCypher
let heliusRetryAfter = 0; // Timestamp when we can retry Helius

// how many confirmations before we consider "final"
const CONFIRMATION_THRESHOLDS: Record<CryptoType, number> = {
  [CryptoType.BITCOIN]: 1,
  [CryptoType.LITECOIN]: 1,
  [CryptoType.ETHEREUM]: 1,
  [CryptoType.SOLANA]: 1,
};

// map our enum to BlockCypher path segments
const PATH_MAP: Record<CryptoType, string> = {
  [CryptoType.BITCOIN]: "btc",
  [CryptoType.LITECOIN]: "ltc",
  [CryptoType.ETHEREUM]: "eth",
  [CryptoType.SOLANA]: "",
};

function normalizeHex(addr: string) {
  return addr.toLowerCase().replace(/^0x/, "");
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if we're currently rate limited for BlockCypher
 */
function isBlockCypherRateLimited(): boolean {
  return Date.now() < blockCypherRetryAfter;
}

/**
 * Check if we're currently rate limited for Helius
 */
function isHeliusRateLimited(): boolean {
  return Date.now() < heliusRetryAfter;
}

/**
 * Make a request with exponential backoff and rate limit handling
 */
async function makeRequestWithBackoff<T>(
  requestFn: () => Promise<T>,
  serviceName: string,
): Promise<T | null> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await requestFn();
      return result;
    } catch (err: any) {
      // Check if it's a rate limit error (429)
      if (err.response?.status === 429) {
        const retryAfterSeconds = parseInt(err.response.headers["retry-after"] || "60", 10);
        const retryAfterMs = retryAfterSeconds * 1000;
        const retryTimestamp = Date.now() + retryAfterMs;

        // Set the rate limit timestamp for the appropriate service
        if (serviceName === "BlockCypher") {
          blockCypherRetryAfter = retryTimestamp;
        } else if (serviceName === "Helius") {
          heliusRetryAfter = retryTimestamp;
        }

        console.warn(
          `${serviceName} rate limited. Retry after ${retryAfterSeconds} seconds (${new Date(retryTimestamp).toISOString()})`,
        );
        return null;
      }

      // For other errors, use exponential backoff
      retryCount++;
      if (retryCount >= maxRetries) {
        throw err;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      console.warn(
        `${serviceName} request failed (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffMs}ms...`,
      );
      await sleep(backoffMs);
    }
  }

  return null;
}

async function checkPayments() {
  const wallets = await prisma.wallet.findMany({
    where: { paid: false },
  });

  console.log(`Found ${wallets.length} unpaid wallets to check`);

  for (let i = 0; i < wallets.length; i++) {
    const w = wallets[i];
    const { id, chain, address, expectedAmount } = w;
    const threshold = CONFIRMATION_THRESHOLDS[chain];

    try {
      let foundTxHash: string | null = null;
      let confirmations = 0;

      if (chain !== CryptoType.SOLANA) {
        // Check if we're rate limited for BlockCypher
        if (isBlockCypherRateLimited()) {
          const waitTime = Math.ceil((blockCypherRetryAfter - Date.now()) / 1000);
          console.log(
            `Skipping BlockCypher wallet ${id} (${chain}). Rate limited for ${waitTime} more seconds.`,
          );
          continue;
        }

        const path = PATH_MAP[chain];
        const url = `https://api.blockcypher.com/v1/${path}/main/addrs/${address}/full?limit=50&token=${BLOCKCYPHER_TOKEN}`;

        const resp = await makeRequestWithBackoff(
          () => axios.get(url),
          "BlockCypher",
        );

        // If rate limited or request failed, skip this wallet
        if (!resp) {
          continue;
        }

        const txs = resp.data.txs as Array<{
          hash: string;
          confirmations: number;
          outputs: Array<{ addresses: string[]; value: number }>;
        }>;

        const expectedUnits =
          chain === CryptoType.ETHEREUM
            ? BigInt(parseUnits(expectedAmount.toString(), 18).toString())
            : BigInt(Math.round(Number(expectedAmount) * 1e8));

        const normalizedAddr = normalizeHex(address);
        const match = txs.find((tx) => {
          const received = tx.outputs
            .filter((o) =>
              // for each output address array, see if **any** entry matches
              o.addresses.some((a) => normalizeHex(a) === normalizedAddr),
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
        // Check if we're rate limited for Helius
        if (isHeliusRateLimited()) {
          const waitTime = Math.ceil((heliusRetryAfter - Date.now()) / 1000);
          console.log(
            `Skipping Helius wallet ${id} (${chain}). Rate limited for ${waitTime} more seconds.`,
          );
          continue;
        }

        const helApiUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

        const sigResp = await makeRequestWithBackoff(
          () =>
            axios.post(helApiUrl, {
              jsonrpc: "2.0",
              id: "1",
              method: "getSignaturesForAddress",
              params: [address, { limit: 20 }],
            }),
          "Helius",
        );

        // If rate limited or request failed, skip this wallet
        if (!sigResp) {
          continue;
        }

        const sigInfos = sigResp.data.result as Array<{
          signature: string;
          confirmationStatus: string;
        }>;

        if (!sigInfos.length) {
          console.log(w, "No signatures found");
          continue;
        }

        const matchSig = sigInfos.find(
          (s) =>
            s.confirmationStatus === "confirmed" ||
            s.confirmationStatus === "finalized",
        );
        if (matchSig) {
          const balResp = await makeRequestWithBackoff(
            () =>
              axios.post(helApiUrl, {
                jsonrpc: "2.0",
                id: "2",
                method: "getBalance",
                params: [address],
              }),
            "Helius",
          );

          // If rate limited or request failed, skip
          if (!balResp) {
            continue;
          }

          const currentLamports = BigInt(balResp.data.result.value as number);

          console.log(w, currentLamports);

          const expectedLamports = BigInt(
            parseUnits(expectedAmount.toString(), 9).toString(),
          );
          if (currentLamports >= expectedLamports) {
            foundTxHash = matchSig.signature;
            confirmations = 1;
          }
        }
      }

      if (confirmations >= threshold) {
        await prisma.wallet.update({
          where: { id },
          data: { paid: true, txHash: foundTxHash, confirmations },
        });

        const order = await prisma.order.update({
          where: { id: w.orderId },
          data: { status: OrderStatus.PAID },
          include: {
            OrderItem: true,
          },
        });

        for (const item of order.OrderItem) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              stock: true,
            },
          });

          if (!product) continue;

          if (product.stock.length < item.quantity) continue;

          const oldestStock = product.stock.slice(0, item.quantity);
          const filteredStock = product.stock.filter(
            (stock) => !oldestStock.includes(stock),
          );
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: filteredStock },
          });

          await prisma.orderItem.update({
            where: { id: item.id },
            data: {
              codes: oldestStock,
            },
          });
        }

        const fullOrderDetails = await prisma.order.findUnique({
          where: { id: w.orderId },
          include: {
            customer: true,
            OrderItem: {
              include: {
                product: true,
              },
            },
          },
        });

        if (fullOrderDetails) {
          await sendOrderCompleteEmail({
            customerName: fullOrderDetails.customer.name,
            customerEmail: fullOrderDetails.customer.email,
            orderId: w.orderId,
            totalPrice: fullOrderDetails.totalPrice,
            paymentFee: fullOrderDetails.paymentFee,
            totalWithFee:
              fullOrderDetails.totalPrice + fullOrderDetails.paymentFee,
            paymentType: fullOrderDetails.paymentType,
            orderDate: fullOrderDetails.createdAt.toISOString(),
            items: fullOrderDetails.OrderItem.map((i) => ({
              name: i.product.name,
              price: i.price,
              quantity: i.quantity,
              codes: i.codes,
              image: i.product.image,
            slug: i.product.slug,
            productType: i.product.productType,
            })),
          });

          if (order.couponUsed) {
            await prisma.coupon.update({
              where: { code: order.couponUsed },
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
          },
        });
      }
    } catch (err) {
      console.error(`Error checking wallet ${id} (${chain}):`, err);
    }

    // Add delay between requests to avoid hitting rate limits
    if (i < wallets.length - 1) {
      await sleep(REQUEST_DELAY);
    }
  }
}

async function expireOrders() {
  await prisma.order.updateMany({
    where: {
      status: OrderStatus.PENDING,
      paymentType: { in: [PaymentType.STRIPE, PaymentType.PAYPAL] },
      createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
    },
    data: { status: OrderStatus.CANCELLED },
  });
}

(async function pollLoop() {
  try {
    while (true) {
      console.log("Checking payments...");

      // Show rate limit status
      if (isBlockCypherRateLimited()) {
        const waitTime = Math.ceil((blockCypherRetryAfter - Date.now()) / 1000);
        console.log(`BlockCypher rate limited for ${waitTime} more seconds`);
      }
      if (isHeliusRateLimited()) {
        const waitTime = Math.ceil((heliusRetryAfter - Date.now()) / 1000);
        console.log(`Helius rate limited for ${waitTime} more seconds`);
      }

      await checkPayments();
      await expireOrders();

      // If we're rate limited, increase the wait time to avoid wasting resources
      const nextPollInterval =
        isBlockCypherRateLimited() || isHeliusRateLimited()
          ? Math.max(POLL_INTERVAL, 5 * 60 * 1000) // Wait at least 5 minutes if rate limited
          : POLL_INTERVAL;

      console.log(`Next check in ${nextPollInterval / 1000} seconds`);
      await new Promise((res) => setTimeout(res, nextPollInterval));
    }
  } catch (err) {
    console.error("Polling loop failed:", err);
  } finally {
    await prisma.$disconnect();
  }
})();
