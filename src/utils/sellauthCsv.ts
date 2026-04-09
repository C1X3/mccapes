/**
 * Parse SellAuth / wide-format invoice CSV rows (one row = one order, items in Item 1…Item N columns).
 */

export const SELLAUTH_CSV_MAX_ITEM_SLOTS = 20;

export type SellauthOrderHeader = {
  id: string;
  uniqueId: string;
  status: string;
  manuallyProcessed: boolean;
  paymentMethod: string;
  subtotal: number;
  couponDiscount: number;
  volumeDiscount: number;
  gatewayFee: number;
  taxRate: number;
  tax: number;
  total: number;
  customerId: string;
  email: string;
  discordId: string | null;
  discordUsername: string | null;
  ipAddress: string | null;
  countryCode: string | null;
  userAgent: string | null;
  asn: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type SellauthOrderItem = {
  index: number;
  name: string | null;
  sellauthProductId: string;
  sellauthVariantId: string | null;
  status: string | null;
  quantity: number;
  couponDiscount: number;
  volumeDiscount: number;
  lineTotalPrice: number;
  customFieldsRaw: string | null;
  deliveredRaw: string | null;
  codes: string[];
  itemCompletedAt: Date | null;
};

export type SellauthParsedInvoice = {
  order: SellauthOrderHeader;
  items: SellauthOrderItem[];
};

function trimCell(value: string | undefined): string {
  return (value ?? "").trim();
}

function parseBoolLoose(value: string | undefined): boolean {
  const v = trimCell(value).toLowerCase();
  return v === "yes" || v === "true" || v === "1";
}

function parseMoney(value: string | undefined): number {
  const v = trimCell(value);
  if (v === "") return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function parseIntLoose(value: string | undefined, fallback: number): number {
  const v = trimCell(value);
  if (v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalDate(value: string | undefined): Date | null {
  const v = trimCell(value);
  if (v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function requiredDate(value: string | undefined, label: string): Date {
  const d = parseOptionalDate(value);
  if (!d) {
    throw new Error(`Invalid or missing date for ${label}`);
  }
  return d;
}

export function parseSellauthCodesJson(raw: string | null | undefined): string[] {
  const s = trimCell(raw ?? undefined);
  if (!s || s === "null" || s === "[]") return [];
  if (!s.startsWith("[")) return [];

  try {
    const parsed: unknown = JSON.parse(s);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function itemCodesFromRow(
  customFields: string | null,
  delivered: string | null,
): string[] {
  const fromDelivered = parseSellauthCodesJson(delivered);
  if (fromDelivered.length > 0) return fromDelivered;
  return parseSellauthCodesJson(customFields);
}

function itemSlotHasProductId(row: Record<string, string | undefined>, i: number): boolean {
  const key = `Item ${i} Product ID`;
  return trimCell(row[key]) !== "";
}

function parseItemRow(
  row: Record<string, string | undefined>,
  i: number,
): SellauthOrderItem {
  const name = trimCell(row[`Item ${i} Item Name`]) || null;
  const sellauthProductId = trimCell(row[`Item ${i} Product ID`]);
  const sellauthVariantId =
    trimCell(row[`Item ${i} Variant ID`]) || null;
  const status = trimCell(row[`Item ${i} Status`]) || null;
  const quantity = Math.max(1, parseIntLoose(row[`Item ${i} Quantity`], 1));
  const couponDiscount = parseMoney(row[`Item ${i} Coupon Discount`]);
  const volumeDiscount = parseMoney(row[`Item ${i} Volume Discount`]);
  const lineTotalPrice = parseMoney(row[`Item ${i} Total Price`]);
  const customFieldsRaw = trimCell(row[`Item ${i} Custom Fields`]) || null;
  const deliveredRaw = trimCell(row[`Item ${i} Delivered`]) || null;

  const codes = itemCodesFromRow(customFieldsRaw, deliveredRaw);
  const itemCompletedAt = parseOptionalDate(row[`Item ${i} Completed At`]);

  return {
    index: i,
    name,
    sellauthProductId,
    sellauthVariantId,
    status,
    quantity,
    couponDiscount,
    volumeDiscount,
    lineTotalPrice,
    customFieldsRaw,
    deliveredRaw,
    codes,
    itemCompletedAt,
  };
}

export function parseSellauthInvoiceRow(
  row: Record<string, string | undefined>,
): SellauthParsedInvoice {
  const email = trimCell(row["E-mail Address"]);
  if (!email) {
    throw new Error("Row missing E-mail Address");
  }

  const order: SellauthOrderHeader = {
    id: trimCell(row["ID"]),
    uniqueId: trimCell(row["Unique ID"]),
    status: trimCell(row["Status"]),
    manuallyProcessed: parseBoolLoose(row["Manually Processed"]),
    paymentMethod: trimCell(row["Payment Method"]),
    subtotal: parseMoney(row["Subtotal"]),
    couponDiscount: parseMoney(row["Coupon Discount"]),
    volumeDiscount: parseMoney(row["Volume Discount"]),
    gatewayFee: parseMoney(row["Gateway Fee"]),
    taxRate: parseMoney(row["Tax Rate"]),
    tax: parseMoney(row["Tax"]),
    total: parseMoney(row["Total"]),
    customerId: trimCell(row["Customer ID"]),
    email,
    discordId: trimCell(row["Discord ID"]) || null,
    discordUsername: trimCell(row["Discord Username"]) || null,
    ipAddress: trimCell(row["IP Address"]) || null,
    countryCode: trimCell(row["Country Code"]) || null,
    userAgent: trimCell(row["User Agent"]) || null,
    asn: trimCell(row["ASN"]) || null,
    createdAt: requiredDate(row["Created At"], "Created At"),
    completedAt: parseOptionalDate(row["Completed At"]),
  };

  const items: SellauthOrderItem[] = [];
  for (let i = 1; i <= SELLAUTH_CSV_MAX_ITEM_SLOTS; i++) {
    if (!itemSlotHasProductId(row, i)) continue;
    items.push(parseItemRow(row, i));
  }

  return { order, items };
}
