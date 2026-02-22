import dotenv from "dotenv";
import "module-alias/register";
dotenv.config();

import { OrderStatus, PaymentType } from "@generated/client";
import { prisma } from "@/utils/prisma";

const POLL_INTERVAL = 30 * 1000;

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

(async function expirationLoop() {
  try {
    while (true) {
      await expireOrders();
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  } catch (error) {
    console.error("Order expiration loop failed:", error);
  } finally {
    await prisma.$disconnect();
  }
})();
