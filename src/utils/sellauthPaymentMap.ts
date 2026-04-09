/** Matches Prisma `PaymentType` for order imports. */
export type SellauthPaymentType = "STRIPE" | "PAYPAL" | "CRYPTO";

/**
 * Map invoice "Payment Method" text → Prisma `PaymentType` only (enum values).
 * No non–MCCapes provider names are written to `paypalNote`; leave that empty for imports.
 */
export function paymentFromSellAuthMethod(raw: string): {
  paymentType: SellauthPaymentType;
  paypalNote: string;
} {
  const m = raw.trim().toLowerCase();

  if (m.includes("paypal")) {
    return { paymentType: "PAYPAL", paypalNote: "" };
  }
  if (m.includes("cash app") || m.includes("cashapp") || m.includes("venmo")) {
    return { paymentType: "PAYPAL", paypalNote: "" };
  }
  if (m.includes("bitcoin") || m.includes("litecoin")) {
    return { paymentType: "CRYPTO", paypalNote: "" };
  }
  if (m.includes("stripe")) {
    return { paymentType: "STRIPE", paypalNote: "" };
  }
  if (m.includes("sumup")) {
    return { paymentType: "STRIPE", paypalNote: "" };
  }
  return { paymentType: "STRIPE", paypalNote: "" };
}
