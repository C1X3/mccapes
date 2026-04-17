import {
  createPayPalCheckoutApprovalUrlFromOrder,
} from "@/server/providers/paypalCheckout";
import { sendOrderCompleteEmail } from "@/server/email/send";
import { prisma } from "@/utils/prisma";
import { OrderStatus, PaymentType } from "@generated/client";
import { NextResponse } from "next/server";

type CreateRequest = {
  action: "create";
  orderId: string;
};

type CaptureRequest = {
  action: "capture";
  orderId: string;
  paypalOrderId: string;
};

type PayPalCaptureResponse = {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        amount?: {
          value?: string;
        };
      }>;
    };
  }>;
};

type PayPalErrorResponse = {
  message?: string;
  details?: Array<{
    issue?: string;
    description?: string;
  }>;
  links?: Array<{
    href?: string;
    rel?: string;
    method?: string;
  }>;
};

const PAYPAL_API_URL = (
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com"
).trim();

const PAYPAL_CLIENT_ID = (
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
).trim();

const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

const getExpectedTotal = (order: {
  totalPrice: number;
  paymentFee: number;
  discountAmount: number;
}) => order.totalPrice + order.paymentFee - order.discountAmount;

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal client credentials are not configured");
  }

  const basicAuth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes("invalid_client")) {
      const environment = PAYPAL_API_URL.includes("sandbox") ? "sandbox" : "live";
      throw new Error(
        `Failed to fetch PayPal access token: invalid_client. Check PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET for the ${environment} environment (${PAYPAL_API_URL}).`,
      );
    }
    throw new Error(`Failed to fetch PayPal access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

async function markOrderPaidAndFulfill(
  orderId: string,
  paymentReference?: string,
) {
  const txResult = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { OrderItem: true },
    });

    if (!order) {
      return { status: "not_found" as const };
    }

    const updateResult = await tx.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING },
      data: {
        status: OrderStatus.PAID,
        ...(paymentReference ? { paypalNote: paymentReference } : {}),
      },
    });

    if (updateResult.count === 0) {
      return { status: "already_processed" as const };
    }

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

    return { status: "paid" as const };
  });

  if (txResult.status !== "paid") {
    return txResult;
  }

  const fullOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      OrderItem: {
        include: { product: true },
      },
    },
  });

  if (!fullOrder) {
    return { status: "not_found" as const };
  }

  await sendOrderCompleteEmail({
    customerName: fullOrder.customer.name,
    customerEmail: fullOrder.customer.email,
    orderId: fullOrder.id,
    totalPrice: fullOrder.totalPrice,
    paymentFee: fullOrder.paymentFee,
    totalWithFee: fullOrder.totalPrice + fullOrder.paymentFee,
    paymentType: fullOrder.paymentType,
    orderDate: fullOrder.createdAt.toISOString(),
    items: fullOrder.OrderItem.map((i) => ({
      name: i.product.name,
      price: i.price,
      quantity: i.quantity,
      codes: i.codes,
      image: i.product.image,
      slug: i.product.slug,
      productType: i.product.productType,
    })),
  });

  return { status: "paid" as const };
}

async function capturePayPalCheckoutOrder(orderId: string, paypalOrderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentType: true,
      totalPrice: true,
      paymentFee: true,
      discountAmount: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentType !== PaymentType.PAYPAL_CHECKOUT) {
    throw new Error("Order payment type is not PAYPAL_CHECKOUT");
  }

  if (order.status !== OrderStatus.PENDING) {
    return { alreadyProcessed: true, captureId: undefined as string | undefined };
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    let parsedError: PayPalErrorResponse | null = null;
    let rawErrorText = "";

    try {
      parsedError = (await response.json()) as PayPalErrorResponse;
    } catch {
      rawErrorText = await response.text();
    }

    const issue = parsedError?.details?.[0]?.issue;
    if (issue === "INSTRUMENT_DECLINED") {
      const retryUrl = parsedError?.links?.find((link) => link.rel === "redirect")
        ?.href;

      return {
        alreadyProcessed: false,
        captureId: undefined as string | undefined,
        recoverableDecline: true,
        retryUrl,
        issue,
      };
    }

    const serializedError = parsedError
      ? JSON.stringify(parsedError)
      : rawErrorText || "Unknown PayPal capture error";
    throw new Error(`Failed to capture PayPal order: ${serializedError}`);
  }

  const captureData = (await response.json()) as PayPalCaptureResponse;

  if (captureData.status !== "COMPLETED") {
    throw new Error(`Unexpected capture status: ${captureData.status}`);
  }

  const capturedAmount =
    captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
  const expectedAmount = getExpectedTotal(order);

  if (
    capturedAmount &&
    Math.abs(Number.parseFloat(capturedAmount) - expectedAmount) > 0.01
  ) {
    throw new Error("Captured amount does not match order amount");
  }

  const result = await markOrderPaidAndFulfill(order.id, captureData.id);
  return {
    alreadyProcessed: result.status === "already_processed",
    captureId: captureData.id,
    recoverableDecline: false,
    retryUrl: undefined as string | undefined,
    issue: undefined as string | undefined,
  };
}


export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRequest | CaptureRequest;

    if (!body?.action || !body?.orderId) {
      return NextResponse.json(
        { error: "Missing required request fields" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        status: true,
        paymentType: true,
        totalPrice: true,
        paymentFee: true,
        discountAmount: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentType !== PaymentType.PAYPAL_CHECKOUT) {
      return NextResponse.json(
        { error: "Order payment type is not PAYPAL_CHECKOUT" },
        { status: 400 },
      );
    }

    if (body.action === "create") {
      if (order.status !== OrderStatus.PENDING) {
        return NextResponse.json(
          { error: "Order is no longer payable" },
          { status: 400 },
        );
      }

      const approvalUrl = await createPayPalCheckoutApprovalUrlFromOrder({
        orderId: order.id,
        totalPrice: order.totalPrice,
        paymentFee: order.paymentFee,
        discountAmount: order.discountAmount,
      });
      return NextResponse.json({ approvalUrl }, { status: 200 });
    }

    if (body.action === "capture") {
      if (!body.paypalOrderId) {
        return NextResponse.json(
          { error: "paypalOrderId is required for capture" },
          { status: 400 },
        );
      }

      const result = await capturePayPalCheckoutOrder(
        order.id,
        body.paypalOrderId,
      );

      if (result.recoverableDecline) {
        return NextResponse.json(
          {
            success: false,
            recoverableDecline: true,
            issue: result.issue,
            retryUrl: result.retryUrl,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          alreadyProcessed: result.alreadyProcessed,
          captureId: result.captureId,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("PayPal checkout processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
