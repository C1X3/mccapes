import "server-only";

import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import { z } from "zod";
import { EmailValidationStatus } from "@generated/client";
import { prisma } from "@/utils/prisma";
import { DISPOSABLE_EMAIL_DOMAINS } from "@/server/email/disposable-domains";

const emailSchema = z.email();
const DNS_LOOKUP_TIMEOUT_MS = 4000;

type BlockReason =
  | "invalid"
  | "disposable"
  | "domain_has_no_mail_records"
  | "suppressed_due_to_previous_bounce";

export type EmailValidationResult =
  | {
      ok: true;
      normalizedEmail: string;
      status: EmailValidationStatus;
      reason: null;
    }
  | {
      ok: false;
      normalizedEmail: string;
      status: EmailValidationStatus;
      reason: BlockReason;
    };

const dnsCache = new Map<string, { valid: boolean; expiresAt: number }>();

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function getDomain(email: string) {
  const [, domain] = email.split("@");
  return domain ?? "";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("dns_timeout")), timeoutMs);
    }),
  ]);
}

async function domainHasMailRecords(domain: string) {
  const now = Date.now();
  const cached = dnsCache.get(domain);
  if (cached && cached.expiresAt > now) {
    return cached.valid;
  }

  let hasMx = false;
  let hasAddress = false;

  try {
    const records = await withTimeout(resolveMx(domain), DNS_LOOKUP_TIMEOUT_MS);
    hasMx = records.length > 0;
  } catch {
    hasMx = false;
  }

  if (!hasMx) {
    try {
      const [aRecords, aaaaRecords] = await Promise.allSettled([
        withTimeout(resolve4(domain), DNS_LOOKUP_TIMEOUT_MS),
        withTimeout(resolve6(domain), DNS_LOOKUP_TIMEOUT_MS),
      ]);

      const aCount =
        aRecords.status === "fulfilled" ? aRecords.value.length : 0;
      const aaaaCount =
        aaaaRecords.status === "fulfilled" ? aaaaRecords.value.length : 0;
      hasAddress = aCount > 0 || aaaaCount > 0;
    } catch {
      hasAddress = false;
    }
  }

  const valid = hasMx || hasAddress;
  dnsCache.set(domain, {
    valid,
    // Keep DNS results for 15 minutes to reduce lookup overhead.
    expiresAt: now + 15 * 60 * 1000,
  });

  return valid;
}

export async function validateCustomerEmail(
  rawEmail: string,
): Promise<EmailValidationResult> {
  const normalizedEmail = normalizeEmail(rawEmail);

  const syntax = emailSchema.safeParse(normalizedEmail);
  if (!syntax.success) {
    return {
      ok: false,
      normalizedEmail,
      status: "BLOCKED",
      reason: "invalid",
    };
  }

  const domain = getDomain(normalizedEmail);
  if (!domain || DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      ok: false,
      normalizedEmail,
      status: "BLOCKED",
      reason: "disposable",
    };
  }

  const suppressed = await prisma.suppressedEmail.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (suppressed) {
    return {
      ok: false,
      normalizedEmail,
      status: "BLOCKED",
      reason: "suppressed_due_to_previous_bounce",
    };
  }

  const hasMailRecords = await domainHasMailRecords(domain);
  if (!hasMailRecords) {
    return {
      ok: false,
      normalizedEmail,
      status: "BLOCKED",
      reason: "domain_has_no_mail_records",
    };
  }

  return {
    ok: true,
    normalizedEmail,
    status: "VALID",
    reason: null,
  };
}

export function getEmailValidationErrorMessage(reason: BlockReason) {
  const errorMap: Record<BlockReason, string> = {
    invalid: "Please enter a valid email address.",
    disposable:
      "Temporary/disposable email addresses are not allowed. Please use a real inbox.",
    domain_has_no_mail_records:
      "This email domain cannot receive mail. Please use a different email address.",
    suppressed_due_to_previous_bounce:
      "This email address cannot receive messages from us. Please use a different email.",
  };

  return errorMap[reason];
}
