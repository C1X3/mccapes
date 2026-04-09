/**
 * SellAuth → single review CSV for Order + CustomerInformation + OrderItem import.
 *
 * Reads the wide SellAuth invoice export (one row per checkout). Writes:
 *   - Main CSV: one data row per importable line item (order + customer columns repeated),
 *     plus ORDER_NO_ITEMS rows for investigation.
 *   - `orders-import-db-ready.csv` (same folder): only ITEM rows with empty
 *     import_blocked_reason (safe path for DB import after review).
 *   - `orders-excluded-bundles-founders.csv` (same folder as main out): line items for
 *     SellAuth product IDs 248454, 248455, 248458, 330501 — excluded from the main file.
 * Orders with no parsable line items still get one row (row_kind=ORDER_NO_ITEMS) on the main
 * file only. Nothing is written to the database.
 *
 * Usage (repo root):
 *   pnpm sellauth:orders-import-csv -- <sellauth-export.csv> [out.csv] [--map product-id-map.json]
 *
 * Default output: schema-import-export/orders-import.csv
 *
 * -----------------------------------------------------------------------------
 * ENUM / FIELD RULES (must match database/order.prisma)
 * -----------------------------------------------------------------------------
 *
 * order_payment_type → PaymentType (see `src/utils/sellauthPaymentMap.ts`)
 *   - stripe / sumup → STRIPE; paypal → PAYPAL; bitcoin/litecoin → CRYPTO
 *   - cash app / venmo → PAYPAL; `order_paypal_note` stays empty (no external labels in CSV)
 *
 * order_status → OrderStatus
 *   - "completed"                                             → PAID
 *   - all other SellAuth values (pending, cancelled, expired, voided, …) → CANCELLED
 *
 * order_total_price
 *   - SellAuth "Total" minus "Gateway Fee" (amount before processing fee, matches
 *     totalPrice + paymentFee semantics used in emails/checkout).
 *
 * order_discount_amount
 *   - SellAuth order "Coupon Discount" + "Volume Discount".
 *
 * customer_name
 *   - Always `SellAuth Customer` for this export.
 *
 * prisma_product_id
 *   - Empty unless you pass --map pointing at JSON: { "sellauthProductId": "prismaProductCuid", ... }
 *
 * row_kind
 *   - ITEM                 — normal line
 *   - ORDER_NO_ITEMS       — no Item N Product ID columns populated (investigate source row)
 *
 * import_blocked_reason
 *   - Empty when ready: ITEM row has prisma_product_id, or you will fill it before import.
 *   - "MISSING_PRISMA_PRODUCT_ID" — add to product-id-map.json or paste id in CSV.
 *   - "NO_LINE_ITEMS"            — order row had no products parsed.
 *
 * SellAuth "Unknown" product IDs (no real listing title in export) are omitted from the CSV:
 *   247322, 249600, 249626, 249627, 249629, 269765, 269770, 269775, 269776
 *   (Some SellAuth orders are still PAID with these SKUs — they are skipped too unless you
 *   remove an id from SKIP_IMPORT_SELLAUTH_PRODUCT_IDS in this file.)
 *
 * Bundle / Founders SKUs go only to the sidecar CSV (not main import):
 *   248454, 248455, 248458, 330501
 *
 * Mixed orders — at least one mapped importable line AND at least one Unknown SKU and/or
 * sidecar (bundle/Founders) line on the same checkout — are omitted from both main and
 * sidecar CSVs (whole order excluded; avoids partial carts / totals mismatch).
 */

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

import { parseSellauthInvoiceRow } from "../utils/sellauthCsv";
import { paymentFromSellAuthMethod } from "../utils/sellauthPaymentMap";

/** SellAuth Item Product IDs where the export only has title "Unknown" — drop from import. */
const SKIP_IMPORT_SELLAUTH_PRODUCT_IDS = new Set([
  "247322",
  "249600",
  "249626",
  "249627",
  "249629",
  "269765",
  "269770",
  "269775",
  "269776",
]);

/** Routed to orders-excluded-bundles-founders.csv only; omitted from main import CSV. */
const SIDECAR_ONLY_SELLAUTH_PRODUCT_IDS = new Set([
  "248454",
  "248455",
  "248458",
  "330501",
]);

type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toIso(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString();
}

function sellauthStatusToOrderStatus(raw: string): OrderStatus {
  const s = raw.toLowerCase();
  if (s === "completed") return "PAID";
  return "CANCELLED";
}

function loadProductMap(filePath: string | undefined): Record<string, string> {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    string
  >;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string" && v.trim()) out[String(k).trim()] = v.trim();
  }
  return out;
}

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let mapPath: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--") continue;
    if (argv[i] === "--map" && argv[i + 1]) {
      mapPath = argv[i + 1];
      i++;
      continue;
    }
    if (argv[i].endsWith(".ts")) continue;
    positional.push(argv[i]);
  }
  return { positional, mapPath };
}

const HEADERS = [
  "source_sellauth_order_numeric_id",
  "source_sellauth_order_unique_id",
  "customer_name",
  "customer_email",
  "customer_discord",
  "customer_ip_address",
  "customer_useragent",
  "customer_email_validation_status",
  "customer_email_validation_reason",
  "customer_email_validated_at",
  "customer_affiliate_id",
  "order_total_price",
  "order_payment_fee",
  "order_payment_type",
  "order_status",
  "order_coupon_used",
  "order_discount_amount",
  "order_created_at",
  "order_updated_at",
  "order_paypal_note",
  "order_notes_json",
  "row_kind",
  "line_slot_index",
  "sellauth_product_id",
  "prisma_product_id",
  "line_quantity",
  "line_price",
  "line_codes_json",
  "import_blocked_reason",
] as const;

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const { positional, mapPath } = parseArgs(process.argv.slice(2));
  const inputCsv =
    positional[0] ?? path.join(repoRoot, "invoices-mccapes-2025-05-24.csv");
  const outputCsv =
    positional[1] ?? path.join(repoRoot, "schema-import-export/orders-import.csv");
  const excludedCsv = path.join(
    path.dirname(outputCsv),
    "orders-excluded-bundles-founders.csv",
  );
  const dbReadyCsv = path.join(
    path.dirname(outputCsv),
    "orders-import-db-ready.csv",
  );

  if (!fs.existsSync(inputCsv)) {
    console.error(`Input not found: ${inputCsv}`);
    process.exit(1);
  }

  const productMap = loadProductMap(mapPath);
  if (mapPath && Object.keys(productMap).length === 0) {
    console.warn(`--map ${mapPath} missing or empty; prisma_product_id column will be blank.`);
  }

  fs.mkdirSync(path.dirname(outputCsv), { recursive: true });

  const lines: string[] = [HEADERS.join(",")];
  const excludedLines: string[] = [HEADERS.join(",")];
  const dbReadyLines: string[] = [HEADERS.join(",")];

  let sourceRows = 0;
  let skippedParse = 0;
  let emittedItemRows = 0;
  let emittedDbReadyRows = 0;
  let emittedEmptyOrderRows = 0;
  let skippedUnknownLineItems = 0;
  let skippedOrdersAllUnknownLines = 0;
  let emittedSidecarItemRows = 0;
  let skippedOrdersOnlySidecarOrUnknown = 0;
  let skippedOrdersMixed = 0;

  function pushItemRow(
    target: string[],
    baseCells: string[],
    item: {
      index: number;
      sellauthProductId: string;
      quantity: number;
      lineTotalPrice: number;
      codes: string[];
    },
    productMap: Record<string, string>,
    blocked: string,
  ) {
    const prismaId = productMap[item.sellauthProductId] ?? "";
    const row = [
      ...baseCells,
      csvCell("ITEM"),
      csvCell(item.index),
      csvCell(item.sellauthProductId),
      csvCell(prismaId),
      csvCell(item.quantity),
      csvCell(item.lineTotalPrice),
      csvCell(JSON.stringify(item.codes)),
      csvCell(blocked),
    ].join(",");
    target.push(row);
    if (target === lines && blocked === "") {
      dbReadyLines.push(row);
      emittedDbReadyRows++;
    }
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(inputCsv)
      .pipe(csvParser())
      .on("data", (row: Record<string, string | undefined>) => {
        sourceRows++;
        let parsed;
        try {
          parsed = parseSellauthInvoiceRow(row);
        } catch {
          skippedParse++;
          return;
        }

        const o = parsed.order;
        const customerName = "SellAuth Customer";

        const subtotalBeforeGateway = o.total - o.gatewayFee;
        const discountAmount = o.couponDiscount + o.volumeDiscount;
        const { paymentType, paypalNote } = paymentFromSellAuthMethod(
          o.paymentMethod,
        );
        const notesArr = [
          `IMPORT:sellauth:${o.uniqueId}`,
          o.customerId ? `sellauthCustomer:${o.customerId}` : "",
        ].filter(Boolean);

        const baseCells = [
          csvCell(o.id),
          csvCell(o.uniqueId),
          csvCell(customerName),
          csvCell(o.email),
          csvCell(o.discordUsername),
          csvCell(o.ipAddress),
          csvCell(o.userAgent),
          csvCell(""),
          csvCell(""),
          csvCell(""),
          csvCell(""),
          csvCell(subtotalBeforeGateway),
          csvCell(o.gatewayFee),
          csvCell(paymentType),
          csvCell(sellauthStatusToOrderStatus(o.status)),
          csvCell(""),
          csvCell(discountAmount),
          csvCell(toIso(o.createdAt)),
          csvCell(toIso(o.completedAt)),
          csvCell(paypalNote),
          csvCell(JSON.stringify(notesArr)),
        ];

        if (parsed.items.length === 0) {
          emittedEmptyOrderRows++;
          lines.push(
            [
              ...baseCells,
              csvCell("ORDER_NO_ITEMS"),
              csvCell(""),
              csvCell(""),
              csvCell(""),
              csvCell(""),
              csvCell(""),
              csvCell(JSON.stringify([])),
              csvCell("NO_LINE_ITEMS"),
            ].join(","),
          );
          return;
        }

        const notUnknown = parsed.items.filter(
          (item) =>
            !SKIP_IMPORT_SELLAUTH_PRODUCT_IDS.has(item.sellauthProductId),
        );
        skippedUnknownLineItems += parsed.items.length - notUnknown.length;

        const itemsSidecar = notUnknown.filter((item) =>
          SIDECAR_ONLY_SELLAUTH_PRODUCT_IDS.has(item.sellauthProductId),
        );
        const itemsMain = notUnknown.filter(
          (item) =>
            !SIDECAR_ONLY_SELLAUTH_PRODUCT_IDS.has(item.sellauthProductId),
        );

        const hasUnknownLines =
          parsed.items.length > notUnknown.length;
        const isMixedOrder =
          itemsMain.length > 0 &&
          (hasUnknownLines || itemsSidecar.length > 0);
        if (isMixedOrder) {
          skippedOrdersMixed++;
          return;
        }

        for (const item of itemsSidecar) {
          emittedSidecarItemRows++;
          pushItemRow(
            excludedLines,
            baseCells,
            item,
            productMap,
            "EXCLUDED_BUNDLE_OR_FOUNDERS_EXPORT",
          );
        }

        if (itemsMain.length === 0) {
          if (notUnknown.length === 0) {
            skippedOrdersAllUnknownLines++;
          } else {
            skippedOrdersOnlySidecarOrUnknown++;
          }
          return;
        }

        for (const item of itemsMain) {
          emittedItemRows++;
          const prismaId = productMap[item.sellauthProductId] ?? "";
          const blocked =
            prismaId === "" ? "MISSING_PRISMA_PRODUCT_ID" : "";
          pushItemRow(lines, baseCells, item, productMap, blocked);
        }
      })
      .on("end", () => resolve())
      .on("error", reject);
  });

  fs.writeFileSync(outputCsv, lines.join("\n") + "\n", "utf8");
  fs.writeFileSync(excludedCsv, excludedLines.join("\n") + "\n", "utf8");
  fs.writeFileSync(dbReadyCsv, dbReadyLines.join("\n") + "\n", "utf8");

  console.log(`Wrote ${outputCsv}`);
  console.log(`Wrote ${dbReadyCsv} (${emittedDbReadyRows} ITEM rows, no blockers)`);
  console.log(`Wrote ${excludedCsv} (${emittedSidecarItemRows} ITEM rows)`);
  console.log(`Source rows: ${sourceRows}, skipped (parse): ${skippedParse}`);
  console.log(
    `Skipped ${skippedUnknownLineItems} line item(s) (Unknown SKUs); ${skippedOrdersAllUnknownLines} order(s) only Unknown; ${skippedOrdersOnlySidecarOrUnknown} order(s) only bundle/Founders/excluded SKUs (no main lines); ${skippedOrdersMixed} mixed order(s) (importable + Unknown/sidecar on same checkout — excluded entirely).`,
  );
  console.log(
    `Main file: ${emittedItemRows} ITEM rows, ${emittedEmptyOrderRows} ORDER_NO_ITEMS rows`,
  );
  if (emittedItemRows !== emittedDbReadyRows) {
    console.log(
      `Note: ${emittedItemRows - emittedDbReadyRows} ITEM row(s) have import_blocked_reason set — fix map or CSV before using db-ready file.`,
    );
  }
  console.log(`Columns: ${HEADERS.length} (see JSDoc at top of this script for enum rules).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
