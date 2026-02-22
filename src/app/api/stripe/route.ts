import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/server/providers/stripe";
import Stripe from "stripe";
import { prisma } from "@/utils/prisma";
import { OrderStatus } from "@generated/client";
import { sendOrderCompleteEmail } from "@/server/email/send";

export async function POST(request: Request) {
  const reqHeaders = await headers();
  const body = await request.text();

  let event: Stripe.Event | null = null;
  if (!body) {
    console.log("No event or body");
    return NextResponse.json({ error: "No event or body" }, { status: 400 });
  }

  const signature = reqHeaders.get("stripe-signature");
  if (!signature) {
    console.log("No signature");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  if (!event) {
    console.log("No event");
    return NextResponse.json({ error: "No event" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const checkoutIntent = event.data.object;
      if (checkoutIntent.payment_status === "paid") {
        if (!checkoutIntent.metadata?.orderId) {
          console.log("No orderId in metadata");
          return NextResponse.json(
            { error: "No orderId in metadata" },
            { status: 400 },
          );
        }

        const orderId = checkoutIntent.metadata.orderId;

        const fullOrderDetails = await prisma.order.findUnique({
          where: { id: orderId },
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
          console.log("No order found");
          return NextResponse.json(
            { error: "No order found" },
            { status: 400 },
          );
        }

        await prisma.$transaction(async (tx) => {
          const order = await tx.order.update({
            where: { id: orderId },
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
        });

        // Fetch the updated order with codes for the email
        const updatedOrderDetails = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            customer: true,
            OrderItem: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!updatedOrderDetails) {
          console.log("Updated order not found");
          return NextResponse.json(
            { error: "Updated order not found" },
            { status: 400 },
          );
        }

        await sendOrderCompleteEmail({
          customerName: updatedOrderDetails.customer.name,
          customerEmail: updatedOrderDetails.customer.email,
          orderId: updatedOrderDetails.id,
          totalPrice: updatedOrderDetails.totalPrice,
          paymentFee: updatedOrderDetails.paymentFee,
          totalWithFee:
            updatedOrderDetails.totalPrice + updatedOrderDetails.paymentFee,
          paymentType: updatedOrderDetails.paymentType,
          orderDate: updatedOrderDetails.createdAt.toISOString(),
          items: updatedOrderDetails.OrderItem.map((i) => ({
            name: i.product.name,
            price: i.price,
            quantity: i.quantity,
            codes: i.codes,
            image: i.product.image,
            slug: i.product.slug,
            productType: i.product.productType,
          })),
        });

        if (fullOrderDetails.couponUsed) {
          await prisma.coupon.update({
            where: { code: fullOrderDetails.couponUsed },
            data: { usageCount: { increment: 1 } },
          });
        }
      }

      console.log(
        `PaymentIntent for ${checkoutIntent.payment_status} was successful!`,
      );
      break;
    case "checkout.session.expired":
      const expiryIntent = event.data.object;

      if (!expiryIntent.metadata?.orderId) {
        console.log("No orderId in metadata");
        return NextResponse.json(
          { error: "No orderId in metadata" },
          { status: 400 },
        );
      }

      const orderId = expiryIntent.metadata.orderId;

      // Use updateMany to avoid errors if the order was already deleted
      const result = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.PENDING, // Only update if still pending
        },
        data: { status: OrderStatus.CANCELLED },
      });

      if (result.count === 0) {
        console.log(
          `Order ${orderId} not found or already processed - skipping cancellation`,
        );
      } else {
        console.log(`Order ${orderId} cancelled due to Stripe session expiry`);
      }

      break;
    default:
      console.log(`Unhandled event type ${event.type}.`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
