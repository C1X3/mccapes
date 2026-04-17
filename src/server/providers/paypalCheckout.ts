import { CheckoutPayload } from "@/server/providers/types";

const PAYPAL_API_URL = (
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com"
).trim();

const PAYPAL_CLIENT_ID = (
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
).trim();

const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

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

export async function createPayPalCheckoutApprovalUrl(
  payload: CheckoutPayload,
): Promise<string> {
  return createPayPalCheckoutApprovalUrlFromOrder({
    orderId: payload.orderId,
    totalPrice: payload.totalPrice,
    paymentFee: payload.paymentFee,
    discountAmount: payload.discountAmount,
  });
}

export async function createPayPalCheckoutApprovalUrlFromOrder(order: {
  orderId: string;
  totalPrice: number;
  paymentFee: number;
  discountAmount: number;
}): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const accessToken = await getPayPalAccessToken();
  const expectedTotal = (
    order.totalPrice +
    order.paymentFee -
    order.discountAmount
  ).toFixed(2);

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.orderId,
          custom_id: order.orderId,
          description: `Order #${order.orderId}`,
          amount: {
            currency_code: "USD",
            value: expectedTotal,
          },
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
        return_url: `${appUrl}/order/${order.orderId}`,
        cancel_url: `${appUrl}/order/${order.orderId}?canceled=true`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal order: ${errorText}`);
  }

  const data = (await response.json()) as {
    links?: Array<{ rel?: string; href?: string }>;
  };
  const approveLink = data.links?.find((link) => link.rel === "approve")?.href;

  if (!approveLink) {
    throw new Error("PayPal order did not include an approval URL");
  }

  return approveLink;
}
