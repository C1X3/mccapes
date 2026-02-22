import { parseIPN } from "@/types/paypal";
import { sendOrderCompleteEmail } from "@/server/email/send";
import { prisma } from "@/utils/prisma";
import { OrderStatus, PaymentType } from "@generated/client";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const payload = `cmd=_notify-validate&${body}`;
    const verificationResponse = await axios.post(
      "https://ipnpb.paypal.com/cgi-bin/webscr",
      payload,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        maxBodyLength: Infinity, // in case your body is large
      },
    );

    if (verificationResponse.data !== "VERIFIED") {
      return new NextResponse("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch (error) {
    console.error(error);
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const ipn = parseIPN(body);

  const orderInclude = {
    customer: true,
    OrderItem: {
      include: {
        product: true,
      },
    },
  } as const;

  const order = ipn.memo
    ? await prisma.order.findFirst({
        where: {
          paypalNote: {
            equals: ipn.memo,
            mode: "insensitive",
          },
          status: OrderStatus.PENDING,
          paymentType: PaymentType.PAYPAL,
        },
        include: orderInclude,
      })
    : await prisma.order.findFirst({
        where: {
          customer: {
            email: {
              equals: ipn.payerEmail,
              mode: "insensitive",
            },
          },
          status: OrderStatus.PENDING,
          paymentType: PaymentType.PAYPAL,
        },
        include: orderInclude,
      });

  if (!order) {
    return new NextResponse("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Calculate the expected amount with discount applied
  const expectedTotal =
    order.totalPrice + order.paymentFee - (order.discountAmount ?? 0);

  // Allow for 1 cent tolerance since invoice displays prices rounded to 2 decimal places
  const amountDifference = Math.abs(ipn.mcGross - expectedTotal);

  if (
    ipn.receiverEmail === process.env.NEXT_PUBLIC_PAYPAL_EMAIL &&
    ipn.paymentStatus === "Completed" &&
    ipn.txnType === "send_money" &&
    ipn.paymentType === "instant" &&
    ipn.mcCurrency === "USD" &&
    amountDifference <= 0.01
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
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

    if (order.couponUsed) {
      await prisma.coupon.update({
        where: { code: order.couponUsed },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Fetch the updated order with codes for the email
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        OrderItem: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!updatedOrder) {
      console.log("Updated order not found");
      return new NextResponse("Updated order not found", { status: 400 });
    }

    await sendOrderCompleteEmail({
      customerName: updatedOrder.customer.name,
      customerEmail: updatedOrder.customer.email,
      orderId: updatedOrder.id,
      totalPrice: updatedOrder.totalPrice,
      paymentFee: updatedOrder.paymentFee,
      totalWithFee: updatedOrder.totalPrice + updatedOrder.paymentFee,
      paymentType: updatedOrder.paymentType,
      orderDate: updatedOrder.createdAt.toISOString(),
      items: updatedOrder.OrderItem.map((i) => ({
        name: i.product.name,
        price: i.price,
        quantity: i.quantity,
        codes: i.codes,
        image: i.product.image,
            slug: i.product.slug,
            productType: i.product.productType,
      })),
    });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
