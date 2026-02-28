import "module-alias/register";

import { OrderStatus, PaymentType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { reconcilePendingCryptoPayments } from "@/server/orders/reconcileCrypto";
import { syncCompletedInvoicesToGoogleSheets } from "@/server/invoices/googleSheetsSync";

const POLL_INTERVAL = 30 * 1000;
const CRYPTO_RECONCILE_INTERVAL = 60 * 1000;
const DEFAULT_SHEETS_SYNC_INTERVAL = 60 * 60 * 1000;

function getSheetsSyncIntervalMs(): number {
  const raw = process.env.GOOGLE_SHEETS_SYNC_INTERVAL_MS;
  const parsed = raw ? Number(raw) : DEFAULT_SHEETS_SYNC_INTERVAL;

  if (!Number.isFinite(parsed) || parsed < 60 * 1000) {
    return DEFAULT_SHEETS_SYNC_INTERVAL;
  }

  return parsed;
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

(async function backgroundLoop() {
  try {
    let lastCryptoReconcileAt = 0;
    let lastGoogleSheetsSyncAt = 0;
    const googleSheetsSyncIntervalMs = getSheetsSyncIntervalMs();

    while (true) {
      await expireOrders();

      const now = Date.now();
      if (now - lastCryptoReconcileAt >= CRYPTO_RECONCILE_INTERVAL) {
        const result = await reconcilePendingCryptoPayments();
        if (result.checked > 0) {
          console.log(
            `[crypto-reconcile] checked=${result.checked} settled=${result.settled}`,
          );
        }
        lastCryptoReconcileAt = now;
      }

      if (now - lastGoogleSheetsSyncAt >= googleSheetsSyncIntervalMs) {
        try {
          const syncResult = await syncCompletedInvoicesToGoogleSheets();

          if (syncResult.synced) {
            console.log(
              `[google-sheets-sync] rowsWritten=${syncResult.rowsWritten}`,
            );
          } else {
            console.log(
              `[google-sheets-sync] skipped=${syncResult.skippedReason}`,
            );
          }
        } catch (error) {
          console.error("[google-sheets-sync] failed", error);
        }

        lastGoogleSheetsSyncAt = now;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  } catch (error) {
    console.error("Background loop failed:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
