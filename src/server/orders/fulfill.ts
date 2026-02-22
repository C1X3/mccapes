import { OrderStatus } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { sendOrderCompleteEmail } from "@/server/email/send";

type SettleInput = {
  walletId: string;
  txHash?: string | null;
  confirmations?: number;
};

export async function settleCryptoWalletPayment(input: SettleInput) {
  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { id: input.walletId },
      select: { id: true, orderId: true, paid: true },
    });

    if (!wallet) {
      return { settled: false, sendEmail: false, orderId: null as string | null };
    }

    const updated = await tx.wallet.updateMany({
      where: { id: wallet.id, paid: false },
      data: {
        paid: true,
        txHash: input.txHash ?? undefined,
        confirmations: input.confirmations ?? 1,
      },
    });

    if (updated.count === 0) {
      return { settled: false, sendEmail: false, orderId: wallet.orderId };
    }

    const order = await tx.order.findUnique({
      where: { id: wallet.orderId },
      include: { OrderItem: true },
    });

    if (!order) {
      return { settled: true, sendEmail: false, orderId: wallet.orderId };
    }

    let sendEmail = false;

    if (order.status === OrderStatus.PENDING) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      for (const item of order.OrderItem) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (!product || product.stock.length < item.quantity) {
          continue;
        }

        const oldestStock = product.stock.slice(0, item.quantity);
        const filteredStock = product.stock.filter(
          (stock) => !oldestStock.includes(stock),
        );

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: filteredStock },
        });

        await tx.orderItem.update({
          where: { id: item.id },
          data: { codes: oldestStock },
        });
      }

      if (order.couponUsed) {
        await tx.coupon.update({
          where: { code: order.couponUsed },
          data: { usageCount: { increment: 1 } },
        });
      }

      sendEmail = true;
    }

    return { settled: true, sendEmail, orderId: order.id };
  });

  if (!result.sendEmail || !result.orderId) {
    return result;
  }

  const fullOrderDetails = await prisma.order.findUnique({
    where: { id: result.orderId },
    include: {
      customer: true,
      OrderItem: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!fullOrderDetails) {
    return result;
  }

  await sendOrderCompleteEmail({
    customerName: fullOrderDetails.customer.name,
    customerEmail: fullOrderDetails.customer.email,
    orderId: fullOrderDetails.id,
    totalPrice: fullOrderDetails.totalPrice,
    paymentFee: fullOrderDetails.paymentFee,
    totalWithFee: fullOrderDetails.totalPrice + fullOrderDetails.paymentFee,
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

  return result;
}
