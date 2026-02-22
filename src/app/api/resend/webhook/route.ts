import {
  EmailSuppressionReason,
  EmailSuppressionSource,
  Prisma,
} from "@generated/client";
import { NextRequest, NextResponse } from "next/server";
import { getResendClient } from "@/server/email/client";
import { prisma } from "@/utils/prisma";
import { WebhookEventPayload } from "resend";

type BouncedEvent = Extract<WebhookEventPayload, { type: "email.bounced" }>;

function normalizeRecipient(value: string[] | undefined) {
  const email = value?.[0];
  return email?.trim().toLowerCase() || null;
}

function isEmailEvent(
  payload: WebhookEventPayload,
): payload is Extract<WebhookEventPayload, { type: `email.${string}` }> {
  return payload.type.startsWith("email.");
}

function isHardBounce(payload: BouncedEvent) {
  const bounceType = payload.data.bounce.type.toLowerCase();
  return (
    bounceType === "hard" || bounceType === "hard_bounce" || bounceType === ""
  );
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "missing svix headers" },
      { status: 400 },
    );
  }

  const body = await request.text();

  let payload: WebhookEventPayload;
  try {
    const resend = getResendClient();
    payload = resend.webhooks.verify({
      payload: body,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    });
  } catch (error) {
    console.error("Invalid Resend webhook signature", error);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const eventType = payload.type;
  const providerMessageId = isEmailEvent(payload) ? payload.data.email_id : null;
  const recipient = isEmailEvent(payload)
    ? normalizeRecipient(payload.data.to)
    : null;

  try {
    const serializablePayload = JSON.parse(
      JSON.stringify(payload),
    ) as Prisma.InputJsonValue;

    await prisma.emailDeliveryEvent.create({
      data: {
        providerMessageId,
        eventType,
        recipient,
        payload: serializablePayload,
      },
    });
  } catch (error) {
    const duplicateEvent =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    if (!duplicateEvent) {
      throw error;
    }
  }

  if (payload.type === "email.complained" && recipient) {
    await prisma.suppressedEmail.upsert({
      where: { email: recipient },
      create: {
        email: recipient,
        reason: EmailSuppressionReason.COMPLAINT,
        source: EmailSuppressionSource.RESEND_WEBHOOK,
      },
      update: {
        reason: EmailSuppressionReason.COMPLAINT,
        source: EmailSuppressionSource.RESEND_WEBHOOK,
      },
    });
  }

  if (payload.type === "email.bounced" && recipient && isHardBounce(payload)) {
    await prisma.suppressedEmail.upsert({
      where: { email: recipient },
      create: {
        email: recipient,
        reason: EmailSuppressionReason.HARD_BOUNCE,
        source: EmailSuppressionSource.RESEND_WEBHOOK,
      },
      update: {
        reason: EmailSuppressionReason.HARD_BOUNCE,
        source: EmailSuppressionSource.RESEND_WEBHOOK,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
