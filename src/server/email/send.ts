import "server-only";

import type { ReactNode } from "react";
import { PaymentType, ProductType } from "@generated/client";
import { getResendClient } from "@/server/email/client";
import {
  buildCodeReplacedText,
  CodeReplacedTemplate,
} from "@/views/emails/templates/code-replaced";
import {
  buildOrderCompleteText,
  OrderCompleteTemplate,
} from "@/views/emails/templates/order-complete";

export type SendEmailResult =
  | {
      success: true;
      id: string;
      accepted: true;
    }
  | {
      success: false;
      accepted: false;
      error: unknown;
    };

async function sendEmail({
  to,
  subject,
  react,
  text,
}: {
  to: string;
  subject: string;
  react: ReactNode;
  text: string;
}): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const from = process.env.RESEND_FROM_EMAIL!;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
      text,
      replyTo: process.env.RESEND_AUDIENCE_REPLY_TO,
    });

    if (error || !data?.id) {
      return {
        success: false,
        accepted: false,
        error: error || "missing_message_id",
      };
    }

    return { success: true, accepted: true, id: data.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, accepted: false, error };
  }
}

export async function sendOrderCompleteEmail({
  customerName,
  customerEmail,
  orderId,
  items,
  totalPrice,
  paymentFee,
  totalWithFee,
  paymentType,
  orderDate,
}: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    codes?: string[];
    image?: string;
    slug?: string;
    productType?: ProductType;
  }>;
  totalPrice: number;
  paymentFee: number;
  totalWithFee: number;
  paymentType: PaymentType;
  orderDate: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mccapes.net";

  const normalizedItems = items.map((item) => {
    if (item.productType === ProductType.CAPE && item.slug) {
      return {
        ...item,
        image: `${appUrl}/api/email/cape-flat?src=${encodeURIComponent(`/cape renders/${item.slug}.png`)}`,
      };
    }

    return item;
  });

  const props = {
    customerName,
    customerEmail,
    orderId,
    items: normalizedItems,
    totalPrice,
    paymentFee,
    totalWithFee,
    paymentType,
    orderDate,
  };

  return sendEmail({
    to: customerEmail,
    subject: "Order Complete: your purchase is ready",
    react: OrderCompleteTemplate(props),
    text: buildOrderCompleteText(props),
  });
}

export async function sendCodeReplacedEmail({
  customerName,
  customerEmail,
  orderId,
  productName,
  productSlug,
  oldCode,
  newCode,
}: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productName: string;
  productSlug?: string;
  oldCode: string;
  newCode: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mccapes.net";
  const productImage = productSlug
    ? `${appUrl}/api/email/cape-flat?src=${encodeURIComponent(`/cape renders/${productSlug}.png`)}`
    : `${appUrl}/api/email/cape-flat?src=${encodeURIComponent("/cape renders/experience-cape.png")}`;

  const props = {
    customerName,
    customerEmail,
    orderId,
    productName,
    productImage,
    oldCode,
    newCode,
  };

  return sendEmail({
    to: customerEmail,
    subject: `Code replacement notice - order #${orderId.substring(0, 8)}`,
    react: CodeReplacedTemplate(props),
    text: buildCodeReplacedText(props),
  });
}
