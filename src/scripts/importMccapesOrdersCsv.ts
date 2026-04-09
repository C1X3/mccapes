/**
 * Import `mccapes-orders-import.csv` (unified SellAuth export) into Postgres via Prisma.
 *
 * Expects schema from sellauthToMccapesUnifiedOrdersCsv.ts and existing Product rows
 * for every productId referenced in order_items_json.
 *
 * Usage (DATABASE_URL from .env via dotenvx, same as other DB scripts):
 *   pnpm exec dotenvx run -- pnpm db:import-mccapes-orders-csv
 *
 * Optional args after `--`:
 *   path/to/import.csv     (default: schema-import-export/mccapes-orders-import.csv)
 *   --dry-run              validate only, no writes
 *   --fail-on-existing     error if an order_id already exists (default: skip existing)
 *   --replace              delete orders (and CSV customers) matching this CSV, then import
 *                          (removes Wallet rows for those orders first; destructive)
 */

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  PaymentType,
  OrderStatus,
  EmailValidationStatus,
} from "@generated/client";

type OrderItemRow = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  codes: string[];
  createdAt: string;
  updatedAt: string;
};

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let dryRun = false;
  let failOnExisting = false;
  let replace = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a.endsWith(".ts")) continue;
    if (a === "--tsconfig" && argv[i + 1]) {
      i++;
      continue;
    }
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--fail-on-existing") {
      failOnExisting = true;
      continue;
    }
    if (a === "--replace") {
      replace = true;
      continue;
    }
    positional.push(a);
  }
  return { positional, dryRun, failOnExisting, replace };
}

function parseFloatCell(key: string, raw: string | undefined): number {
  const n = Number.parseFloat(String(raw ?? "").trim());
  if (Number.isNaN(n)) {
    throw new Error(`${key}: invalid number`);
  }
  return n;
}

function parsePaymentType(raw: string | undefined): PaymentType {
  const s = String(raw ?? "").trim();
  if (s === "STRIPE") return PaymentType.STRIPE;
  if (s === "CRYPTO") return PaymentType.CRYPTO;
  if (s === "PAYPAL") return PaymentType.PAYPAL;
  throw new Error(`order_paymentType: invalid ${JSON.stringify(s)}`);
}

function parseOrderStatus(raw: string | undefined): OrderStatus {
  const s = String(raw ?? "").trim();
  if (s === "PENDING") return OrderStatus.PENDING;
  if (s === "PAID") return OrderStatus.PAID;
  if (s === "DELIVERED") return OrderStatus.DELIVERED;
  if (s === "CANCELLED") return OrderStatus.CANCELLED;
  throw new Error(`order_status: invalid ${JSON.stringify(s)}`);
}

function parseEmailValidation(
  raw: string | undefined,
): EmailValidationStatus | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s === "VALID") return EmailValidationStatus.VALID;
  if (s === "BLOCKED") return EmailValidationStatus.BLOCKED;
  throw new Error(`customer_emailValidationStatus: invalid ${JSON.stringify(s)}`);
}

function parseItemsJson(raw: string | undefined, orderId: string): OrderItemRow[] {
  const parsed = JSON.parse(String(raw ?? "null")) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("order_items_json: expected non-empty array");
  }
  const out: OrderItemRow[] = [];
  for (const el of parsed) {
    if (!el || typeof el !== "object") throw new Error("order_items_json: bad item");
    const o = el as Record<string, unknown>;
    const id = String(o.id ?? "");
    const oid = String(o.orderId ?? "");
    const productId = String(o.productId ?? "");
    const quantity = Number(o.quantity);
    const price = Number(o.price);
    const codes = o.codes;
    const createdAt = String(o.createdAt ?? "");
    const updatedAt = String(o.updatedAt ?? "");
    if (!id || !oid || !productId) throw new Error("order_items_json: missing id/orderId/productId");
    if (oid !== orderId) throw new Error(`order_items_json: orderId mismatch (row ${orderId})`);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("order_items_json: bad quantity");
    if (typeof price !== "number" || Number.isNaN(price)) throw new Error("order_items_json: bad price");
    if (!Array.isArray(codes) || !codes.every((c) => typeof c === "string")) {
      throw new Error("order_items_json: codes must be string[]");
    }
    if (!createdAt || !updatedAt) throw new Error("order_items_json: missing dates");
    out.push({
      id,
      orderId: oid,
      productId,
      quantity,
      price,
      codes,
      createdAt,
      updatedAt,
    });
  }
  return out;
}

async function loadCsvRows(csvPath: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on("data", (row: Record<string, string>) => rows.push(row))
      .on("end", () => resolve())
      .on("error", reject);
  });
  return rows;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const { positional, dryRun, failOnExisting, replace } = parseArgs(
    process.argv.slice(2),
  );
  const csvPath =
    positional[0] ??
    path.join(repoRoot, "schema-import-export/mccapes-orders-import.csv");

  if (!process.env.DATABASE_URL) {
    console.error(`DATABASE_URL is missing. Example:

  pnpm exec dotenvx run -- pnpm db:import-mccapes-orders-csv`);
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const rawRows = await loadCsvRows(csvPath);
  const productIdsInCsv = new Set<string>();
  const prepared: {
    orderId: string;
    customerId: string;
    data: {
      order: {
        totalPrice: number;
        paymentFee: number;
        paymentType: PaymentType;
        status: OrderStatus;
        couponUsed: string | null;
        discountAmount: number;
        createdAt: Date;
        updatedAt: Date;
        paypalNote: string | null;
        notes: string[];
      };
      customer: {
        id: string;
        name: string;
        email: string;
        emailValidationStatus: EmailValidationStatus | null;
        emailValidationReason: string | null;
        emailValidatedAt: Date | null;
        useragent: string | null;
        ipAddress: string | null;
        discord: string | null;
        affiliateId: string | null;
      };
      items: OrderItemRow[];
    };
  }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const line = i + 2;
    try {
      const orderId = String(row.order_id ?? "").trim();
      const customerId = String(row.customer_id ?? "").trim();
      const orderCustomerId = String(row.order_customerId ?? "").trim();
      if (!orderId || !customerId || customerId !== orderCustomerId) {
        throw new Error("order_id / customer_id mismatch or empty");
      }

      const items = parseItemsJson(row.order_items_json, orderId);
      for (const it of items) productIdsInCsv.add(it.productId);

      const notes = JSON.parse(String(row.order_notes ?? "null")) as unknown;
      if (!Array.isArray(notes) || notes.length !== 1 || typeof notes[0] !== "string") {
        throw new Error("order_notes must be JSON array of one string");
      }

      const emailValidatedRaw = String(
        row.customer_emailValidatedAt ?? "",
      ).trim();
      const affiliateRaw = String(row.customer_affiliateId ?? "").trim();

      prepared.push({
        orderId,
        customerId,
        data: {
          order: {
            totalPrice: parseFloatCell("order_totalPrice", row.order_totalPrice),
            paymentFee: parseFloatCell("order_paymentFee", row.order_paymentFee),
            paymentType: parsePaymentType(row.order_paymentType),
            status: parseOrderStatus(row.order_status),
            couponUsed: String(row.order_couponUsed ?? "").trim() || null,
            discountAmount: parseFloatCell(
              "order_discountAmount",
              row.order_discountAmount,
            ),
            createdAt: new Date(String(row.order_createdAt ?? "").trim()),
            updatedAt: new Date(String(row.order_updatedAt ?? "").trim()),
            paypalNote: String(row.order_paypalNote ?? "").trim() || null,
            notes: [notes[0]],
          },
          customer: {
            id: customerId,
            name: String(row.customer_name ?? "").trim() || "Customer",
            email: String(row.customer_email ?? "").trim(),
            emailValidationStatus: parseEmailValidation(
              row.customer_emailValidationStatus,
            ),
            emailValidationReason:
              String(row.customer_emailValidationReason ?? "").trim() || null,
            emailValidatedAt: emailValidatedRaw
              ? new Date(emailValidatedRaw)
              : null,
            useragent: String(row.customer_useragent ?? "").trim() || null,
            ipAddress: String(row.customer_ipAddress ?? "").trim() || null,
            discord: String(row.customer_discord ?? "").trim() || null,
            affiliateId: affiliateRaw || null,
          },
          items,
        },
      });

      if (!prepared[prepared.length - 1].data.customer.email) {
        throw new Error("customer_email required");
      }
      if (
        Number.isNaN(prepared[prepared.length - 1].data.order.createdAt.getTime()) ||
        Number.isNaN(prepared[prepared.length - 1].data.order.updatedAt.getTime())
      ) {
        throw new Error("invalid order_createdAt / order_updatedAt");
      }
    } catch (e) {
      console.error(`Row ${line}: ${e instanceof Error ? e.message : e}`);
      process.exit(1);
    }
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const dbProducts = await prisma.product.findMany({ select: { id: true } });
  const dbProductSet = new Set(dbProducts.map((p) => p.id));
  const missingProducts = [...productIdsInCsv].filter((id) => !dbProductSet.has(id));
  if (missingProducts.length > 0) {
    console.error(
      "These productId values from the CSV are not in the database. Seed or migrate products first:\n",
      missingProducts.join("\n"),
    );
    process.exit(1);
  }

  if (affiliateIdsUsed(prepared).length > 0) {
    const affSet = new Set(
      (await prisma.affiliate.findMany({ select: { id: true } })).map((a) => a.id),
    );
    const missingAff = affiliateIdsUsed(prepared).filter((id) => !affSet.has(id));
    if (missingAff.length > 0) {
      console.error(
        "CSV references affiliate id(s) not in DB. Remove affiliate or seed affiliates:\n",
        missingAff.join("\n"),
      );
      process.exit(1);
    }
  }

  console.log(
    `Parsed ${prepared.length} order row(s); ${productIdsInCsv.size} distinct productId(s).`,
  );
  if (dryRun) {
    console.log("Dry run: no writes.");
    await prisma.$disconnect();
    return;
  }

  if (replace) {
    const orderIds = prepared.map((p) => p.orderId);
    const customerIds = [...new Set(prepared.map((p) => p.customerId))];
    const removed = await prisma.$transaction(async (tx) => {
      const wallets = await tx.wallet.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      const orders = await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });
      const customers = await tx.customerInformation.deleteMany({
        where: { id: { in: customerIds } },
      });
      return { wallets: wallets.count, orders: orders.count, customers: customers.count };
    });
    console.log(
      `Replace: removed ${removed.wallets} wallet row(s), ${removed.orders} order(s), ${removed.customers} customer row(s) tied to this CSV.`,
    );
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  const progressEvery = 100;
  console.log(
    `Importing ${prepared.length} row(s) one-by-one (remote DBs can take several minutes; progress every ${progressEvery} rows).`,
  );

  let rowIndex = 0;
  for (const { orderId, customerId, data } of prepared) {
    rowIndex++;
    try {
      const exists = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      });
      if (exists) {
        if (failOnExisting) {
          throw new Error(`order_id already exists: ${orderId}`);
        }
        skipped++;
        if (rowIndex % progressEvery === 0) {
          console.log(
            `… ${rowIndex}/${prepared.length} processed — inserted=${inserted} skipped=${skipped} failed=${failed}`,
          );
        }
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.customerInformation.create({
          data: {
            id: customerId,
            name: data.customer.name,
            email: data.customer.email,
            emailValidationStatus: data.customer.emailValidationStatus,
            emailValidationReason: data.customer.emailValidationReason,
            emailValidatedAt: data.customer.emailValidatedAt,
            useragent: data.customer.useragent,
            ipAddress: data.customer.ipAddress,
            discord: data.customer.discord,
            affiliateId: data.customer.affiliateId,
          },
        });

        await tx.order.create({
          data: {
            id: orderId,
            totalPrice: data.order.totalPrice,
            paymentFee: data.order.paymentFee,
            paymentType: data.order.paymentType,
            status: data.order.status,
            couponUsed: data.order.couponUsed,
            discountAmount: data.order.discountAmount,
            createdAt: data.order.createdAt,
            updatedAt: data.order.updatedAt,
            paypalNote: data.order.paypalNote,
            notes: data.order.notes,
            customerId,
            OrderItem: {
              create: data.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                codes: item.codes,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
              })),
            },
          },
        });
      });

      inserted++;
      if (inserted % progressEvery === 0 || rowIndex % progressEvery === 0) {
        console.log(
          `… ${rowIndex}/${prepared.length} processed — inserted=${inserted} skipped=${skipped} failed=${failed}`,
        );
      }
    } catch (e) {
      failed++;
      console.error(
        `Failed order ${orderId}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  await prisma.$disconnect();
  console.log(`Done. inserted=${inserted} skipped=${skipped} failed=${failed}`);
  if (skipped === prepared.length && inserted === 0 && failed === 0 && !replace) {
    console.log(
      "Note: every order_id from the CSV already exists. Re-run with --replace to delete those orders (and their CSV customers) and import again.",
    );
  }
}

function affiliateIdsUsed(
  prepared: { data: { customer: { affiliateId: string | null } } }[],
): string[] {
  const s = new Set<string>();
  for (const p of prepared) {
    const id = p.data.customer.affiliateId;
    if (id) s.add(id);
  }
  return [...s];
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
