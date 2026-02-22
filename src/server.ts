import "module-alias/register";

import { OrderStatus, PaymentType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { reconcilePendingCryptoPayments } from "@/server/orders/reconcileCrypto";

const POLL_INTERVAL = 30 * 1000;
const CRYPTO_RECONCILE_INTERVAL = 60 * 1000;

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

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  } catch (error) {
    console.error("Background loop failed:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
