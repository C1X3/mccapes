import { createSign } from "node:crypto";

import { OrderStatus, PaymentType } from "@generated/client";

import { prisma } from "@/utils/prisma";

type GoogleAccessTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleSheetsSyncResult = {
  synced: boolean;
  rowsWritten: number;
  skippedReason?: string;
};

type InvoiceForSheet = {
  id: string;
  createdAt: Date;
  totalPrice: number;
  paymentFee: number;
  discountAmount: number;
  paymentType: PaymentType;
  notes: string[];
  customer: {
    email: string;
    discord: string | null;
  };
  OrderItem: Array<{
    price: number;
    product: {
      name: string;
    };
    codes: string[];
  }>;
};

const TRANSACTIONS_HEADERS = [
  "Product",
  "Codes",
  "Date Sold",
  "Payment Method",
  "Amount",
  "Discount",
  "Fees",
  "Buyer Email",
  "Buyer Discord",
  "Order ID",
  "Notes",
];

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DEFAULT_GOOGLE_REQUEST_TIMEOUT_MS = 15_000;

function getGoogleRequestTimeoutMs(): number {
  const raw = process.env.GOOGLE_SHEETS_REQUEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : DEFAULT_GOOGLE_REQUEST_TIMEOUT_MS;

  if (!Number.isFinite(parsed) || parsed < 1_000) {
    return DEFAULT_GOOGLE_REQUEST_TIMEOUT_MS;
  }

  return parsed;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
): Promise<Response> {
  const timeoutMs = getGoogleRequestTimeoutMs();
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new Error(
        `Request timed out after ${timeoutMs}ms while calling Google API`,
      );
    }

    throw error;
  }
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwtAssertion(email: string, privateKey: string): string {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const claims = {
    iss: email,
    scope: SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    exp: nowInSeconds + 3600,
    iat: nowInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const payload = `${encodedHeader}.${encodedClaims}`;

  const signature = createSign("RSA-SHA256")
    .update(payload)
    .end()
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${payload}.${signature}`;
}

async function fetchGoogleAccessToken(
  serviceAccountEmail: string,
  serviceAccountPrivateKey: string,
): Promise<string> {
  const jwtAssertion = createJwtAssertion(
    serviceAccountEmail,
    serviceAccountPrivateKey,
  );

  const tokenResponse = await fetchWithTimeout(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion,
    }),
  });

  const tokenResponseText = await tokenResponse.text();
  let payload: GoogleAccessTokenResponse = {};

  try {
    payload = JSON.parse(tokenResponseText) as GoogleAccessTokenResponse;
  } catch {
    throw new Error(
      `Failed to parse Google token response: ${tokenResponseText.slice(0, 200)}`,
    );
  }

  if (!tokenResponse.ok || !payload.access_token) {
    const message = payload.error_description || payload.error || "Unknown error";
    throw new Error(`Failed to fetch Google access token: ${message}`);
  }

  return payload.access_token;
}

function formatDateTimeForCSV(date: Date): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

function getShortenedProductName(name: string): string {
  if (name === "Experience Cape Code") {
    return "MCE";
  }
  if (name === "Purple Heart Cape Code") {
    return "Twitch";
  }
  if (name === "Follower's Cape Code") {
    return "TikTok";
  }
  if (name === "Home Cape Code") {
    return "Home";
  }
  if (name === "Menace Cape Code") {
    return "Menace";
  }
  if (name === "Copper Cape Code") {
    return "Copper";
  }

  return name;
}

function getPaymentMethodName(method: PaymentType): string {
  switch (method) {
    case PaymentType.STRIPE:
      return "Stripe";
    case PaymentType.PAYPAL:
      return "PayPal";
    case PaymentType.CRYPTO:
      return "Crypto";
    default:
      return method;
  }
}

function getReplacementNote(notes: string[]): string {
  if (notes.length === 0) {
    return "";
  }

  const replacementNote = [...notes]
    .reverse()
    .find((note) => typeof note === "string" && note.startsWith("REPLACED:"));

  if (!replacementNote) {
    return "";
  }

  const timestampMatch = replacementNote.match(
    /(\d{1,2}\/\d{1,2}\/\d{4}\s\d{2}:\d{2}:\d{2})/,
  );

  return timestampMatch ? `Replaced (${timestampMatch[1]})` : "Replaced";
}

function mapInvoicesToSheetRows(invoices: InvoiceForSheet[]): string[][] {
  const rows: string[][] = [TRANSACTIONS_HEADERS];

  for (const invoice of invoices) {
    const replacementNote = getReplacementNote(invoice.notes);

    if (invoice.OrderItem.length === 0) {
      rows.push([
        "N/A",
        "N/A",
        formatDateTimeForCSV(invoice.createdAt),
        getPaymentMethodName(invoice.paymentType),
        invoice.totalPrice.toFixed(2),
        invoice.discountAmount.toFixed(2),
        invoice.paymentFee.toFixed(2),
        invoice.customer.email || "N/A",
        invoice.customer.discord || "N/A",
        invoice.id.substring(0, 8),
        replacementNote,
      ]);
      continue;
    }

    for (const item of invoice.OrderItem) {
      if (item.codes.length === 0) {
        rows.push([
          getShortenedProductName(item.product.name),
          "N/A",
          formatDateTimeForCSV(invoice.createdAt),
          getPaymentMethodName(invoice.paymentType),
          item.price.toFixed(2),
          invoice.discountAmount.toFixed(2),
          invoice.paymentFee.toFixed(2),
          invoice.customer.email || "N/A",
          invoice.customer.discord || "N/A",
          invoice.id.substring(0, 8),
          replacementNote,
        ]);
        continue;
      }

      for (const code of item.codes) {
        rows.push([
          getShortenedProductName(item.product.name),
          code,
          formatDateTimeForCSV(invoice.createdAt),
          getPaymentMethodName(invoice.paymentType),
          item.price.toFixed(2),
          invoice.discountAmount.toFixed(2),
          invoice.paymentFee.toFixed(2),
          invoice.customer.email || "N/A",
          invoice.customer.discord || "N/A",
          invoice.id.substring(0, 8),
          replacementNote,
        ]);
      }
    }
  }

  return rows;
}

async function clearAndWriteTransactionsSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  rows: string[][],
): Promise<void> {
  const range = `'${tabName}'!A1:K`;
  const encodedRange = encodeURIComponent(range);

  const clearResponse = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:clear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  if (!clearResponse.ok) {
    const clearText = await clearResponse.text();
    throw new Error(`Failed to clear sheet range: ${clearText}`);
  }

  const updateResponse = await fetchWithTimeout(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: rows,
      }),
    },
  );

  if (!updateResponse.ok) {
    const updateText = await updateResponse.text();
    throw new Error(`Failed to update sheet values: ${updateText}`);
  }
}

async function getCompletedInvoices(): Promise<InvoiceForSheet[]> {
  return prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.PAID, OrderStatus.DELIVERED],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          email: true,
          discord: true,
        },
      },
      OrderItem: {
        select: {
          price: true,
          codes: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function syncCompletedInvoicesToGoogleSheets(): Promise<GoogleSheetsSyncResult> {
  const syncEnabled = process.env.GOOGLE_SHEETS_SYNC_ENABLED === "true";

  if (!syncEnabled) {
    return {
      synced: false,
      rowsWritten: 0,
      skippedReason: "GOOGLE_SHEETS_SYNC_ENABLED is not true",
    };
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const tabName = process.env.GOOGLE_SHEETS_TAB_NAME || "Transactions";

  if (!spreadsheetId || !serviceAccountEmail || !rawPrivateKey) {
    return {
      synced: false,
      rowsWritten: 0,
      skippedReason:
        "Missing GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    };
  }

  const serviceAccountPrivateKey = rawPrivateKey.replace(/\\n/g, "\n");
  const accessToken = await fetchGoogleAccessToken(
    serviceAccountEmail,
    serviceAccountPrivateKey,
  );

  const invoices = await getCompletedInvoices();
  const rows = mapInvoicesToSheetRows(invoices);

  await clearAndWriteTransactionsSheet(accessToken, spreadsheetId, tabName, rows);

  return {
    synced: true,
    rowsWritten: rows.length - 1,
  };
}
