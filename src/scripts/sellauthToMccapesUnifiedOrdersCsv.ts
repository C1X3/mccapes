/**
 * SellAuth invoices → one row per Order in `mccapes-orders-format.csv` shape.
 *
 * `order_items_json` is a JSON array of objects with **every scalar field** on `OrderItem`
 * (database/order.prisma): `id`, `orderId`, `productId`, `quantity`, `price`, `codes`,
 * `createdAt`, `updatedAt`. Relation objects (`order`, `product`) are omitted; `productId`
 * points at existing `Product` rows from the map.
 *
 * - New CUID2 ids (`@paralleldrive/cuid2`) for customer and each order item. `order_id` (and item
 *   `orderId`) matches **Prisma Client’s bundled legacy `cuid()`** (v1-style: leading `c`, ~25 chars
 *   today) but replaces the first two characters with **`sa`** so SellAuth imports are recognizable.
 * - Order item `price`: SellAuth “Item N Total Price” usually matches invoice **Total** (gateway baked in).
 *   Line amounts are reallocated in proportion so they sum to **`order_totalPrice`** (`Total − Gateway Fee`,
 *   same as subtotal-before-gateway), matching `Order.totalPrice` + `Order.paymentFee` split.
 * - Payment: invoice Cash App / Venmo → PAYPAL; SumUp → STRIPE; `order_paypalNote` empty (enum-only).
 * - `order_updatedAt`: SellAuth `Completed At` when present, else same as `order_createdAt` (required for DB).
 * - Datetimes: SellAuth CSV strings interpreted as America/New_York wall time → ISO-8601 (UTC Z in output).
 * - `order_notes`: JSON array of one string: `["SellAuth: <SellAuth invoice ID>"]`.
 * - `order_couponUsed`: left empty (coupon code not in export).
 * - Order status: SellAuth `completed` → PAID; everything else → CANCELLED.
 * - Same line filters as `sellauthToOrdersImportCsv.ts` (Unknown SKUs, sidecar SKUs, mixed orders).
 *
 * Usage:
 *   pnpm sellauth:mccapes-unified-csv -- <invoices.csv> [out.csv] [--map product-id-map.json]
 *
 * Defaults: `invoices-mccapes-2025-05-24.csv` → `schema-import-export/mccapes-orders-import.csv`.
 * If `--map` is omitted and `schema-import-export/product-id-map.ai.json` exists, it is used (otherwise
 * every row is skipped for unmapped SellAuth product ids and the CSV is header-only).
 */

import fs from "fs";
import os from "node:os";
import path from "path";
import csvParser from "csv-parser";
import { createId } from "@paralleldrive/cuid2";
import { toDate } from "date-fns-tz";

import { parseSellauthInvoiceRow } from "../utils/sellauthCsv";
import { paymentFromSellAuthMethod } from "../utils/sellauthPaymentMap";

/** Matches `OrderItem` model fields needed for insert (no relation includes). */
type OrderItemImportJson = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  codes: string[];
  createdAt: string;
  updatedAt: string;
};

const TZ = "America/New_York";

const SELLAUTH_ORDER_ID_PREFIX = "sa";

/** Left-pad a base-36 string to `width` (same helper shape as Prisma’s legacy `cuid` bundle). */
function padBase36(value: string, width: number): string {
  const padded = "000000000" + value;
  return padded.slice(padded.length - width);
}

function prismaHostname(): string {
  try {
    return os.hostname();
  } catch {
    return (
      process.env._CLUSTER_NETWORK_NAME_ ??
      process.env.COMPUTERNAME ??
      "hostname"
    );
  }
}

/** Fingerprint block matching `@prisma/client` runtime legacy cuid (`Rn` → `Ap` + `Cp`). */
function prismaLegacyCuidFingerprint(): string {
  const pidBlock = padBase36(process.pid.toString(36), 2);
  const host = prismaHostname();
  const hostLen = host.length;
  const sum = host
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), hostLen + 36);
  const hostBlock = padBase36(sum.toString(36), 2);
  return pidBlock + hostBlock;
}

/**
 * Same layout as Prisma Client’s bundled legacy `cuid()` used for `@default(cuid())` when the
 * engine selects generator v1: `c` + time36 + counter4 + fingerprint4 + random8 (regex `^c[a-z0-9]{20,32}$`).
 * Counter semantics match Prisma: `i = i < n ? i : 0; i++; return i - 1`.
 */
const nextPrismaLegacyCuid = (() => {
  const fingerprint = prismaLegacyCuidFingerprint();
  const counterMod = 36 ** 4;
  let counter = 0;

  const randomBlock = () =>
    padBase36(((Math.random() * counterMod) << 0).toString(36), 4);

  return () => {
    counter = counter < counterMod ? counter : 0;
    const idx = counter;
    counter++;
    const time = Date.now().toString(36);
    const countStr = padBase36(idx.toString(36), 4);
    const random = randomBlock() + randomBlock();
    return "c" + time + countStr + fingerprint + random;
  };
})();

/** Legacy Prisma-shaped id with `sa` instead of the first two characters (same length as raw legacy cuid). */
function sellauthOrderId(): string {
  const raw = nextPrismaLegacyCuid();
  return SELLAUTH_ORDER_ID_PREFIX + raw.slice(SELLAUTH_ORDER_ID_PREFIX.length);
}

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

function trimCell(value: string | undefined): string {
  return (value ?? "").trim();
}

/** SellAuth export datetime (no TZ) = wall clock in America/New_York → ISO UTC. */
function sellauthNyToIso(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const d = toDate(trimCell(raw), { timeZone: TZ });
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function sellauthStatusToOrderStatus(raw: string): OrderStatus {
  const s = raw.toLowerCase();
  if (s === "completed") return "PAID";
  return "CANCELLED";
}

/**
 * SellAuth per-line totals often sum to invoice Total (includes gateway). Split `targetSum` (e.g.
 * `total - gatewayFee`) across lines in proportion to `lineTotals` so the result sums to `targetSum`
 * after cent rounding (last line absorbs drift).
 */
function linePricesForSubtotal(
  lineTotals: number[],
  targetSum: number,
): number[] {
  const n = lineTotals.length;
  if (n === 0) return [];
  const lineSum = lineTotals.reduce((a, b) => a + b, 0);
  const targetCents = Math.round(targetSum * 100);
  if (lineSum <= 0 || targetCents <= 0) {
    const eachCents = Math.floor(targetCents / n);
    const out = Array.from({ length: n }, (_, i) =>
      i < n - 1 ? eachCents : targetCents - eachCents * (n - 1),
    );
    return out.map((c) => c / 100);
  }
  const out: number[] = [];
  let allocatedCents = 0;
  for (let i = 0; i < n - 1; i++) {
    const raw = (lineTotals[i]! / lineSum) * targetSum;
    const c = Math.round(raw * 100);
    out.push(c / 100);
    allocatedCents += c;
  }
  out.push((targetCents - allocatedCents) / 100);
  return out;
}

function loadProductMap(filePath: string | undefined): Record<string, string> {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, string>;
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
  "order_id",
  "order_totalPrice",
  "order_paymentFee",
  "order_paymentType",
  "order_status",
  "order_couponUsed",
  "order_discountAmount",
  "order_createdAt",
  "order_updatedAt",
  "order_paypalNote",
  "order_notes",
  "order_customerId",
  "customer_id",
  "customer_name",
  "customer_email",
  "customer_emailValidationStatus",
  "customer_emailValidationReason",
  "customer_emailValidatedAt",
  "customer_useragent",
  "customer_ipAddress",
  "customer_discord",
  "customer_affiliateId",
  "order_items_json",
] as const;

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const { positional, mapPath } = parseArgs(process.argv.slice(2));
  const inputCsv =
    positional[0] ?? path.join(repoRoot, "invoices-mccapes-2025-05-24.csv");
  const outputCsv =
    positional[1] ??
    path.join(repoRoot, "schema-import-export/mccapes-orders-import.csv");

  if (!fs.existsSync(inputCsv)) {
    console.error(`Input not found: ${inputCsv}`);
    process.exit(1);
  }

  const defaultMapPath = path.join(
    repoRoot,
    "schema-import-export/product-id-map.ai.json",
  );
  const resolvedMapPath =
    mapPath ?? (fs.existsSync(defaultMapPath) ? defaultMapPath : undefined);
  const productMap = loadProductMap(resolvedMapPath);
  if (Object.keys(productMap).length === 0) {
    console.warn(
      "No product map loaded — pass e.g. --map schema-import-export/product-id-map.ai.json (without it, all rows are skipped).",
    );
  } else if (!mapPath && resolvedMapPath) {
    console.log(`Using product map: ${resolvedMapPath}`);
  }

  fs.mkdirSync(path.dirname(outputCsv), { recursive: true });

  const lines: string[] = [HEADERS.join(",")];
  let sourceRows = 0;
  let skippedParse = 0;
  let emittedOrders = 0;
  let skippedMixed = 0;
  let skippedNoImportableLines = 0;
  let skippedMissingMap = 0;

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

        if (parsed.items.length === 0) {
          skippedNoImportableLines++;
          return;
        }

        const notUnknown = parsed.items.filter(
          (item) =>
            !SKIP_IMPORT_SELLAUTH_PRODUCT_IDS.has(item.sellauthProductId),
        );

        const itemsSidecar = notUnknown.filter((item) =>
          SIDECAR_ONLY_SELLAUTH_PRODUCT_IDS.has(item.sellauthProductId),
        );
        const itemsMain = notUnknown.filter(
          (item) =>
            !SIDECAR_ONLY_SELLAUTH_PRODUCT_IDS.has(item.sellauthProductId),
        );

        const hasUnknownLines = parsed.items.length > notUnknown.length;
        const isMixedOrder =
          itemsMain.length > 0 &&
          (hasUnknownLines || itemsSidecar.length > 0);
        if (isMixedOrder) {
          skippedMixed++;
          return;
        }

        if (itemsMain.length === 0) {
          skippedNoImportableLines++;
          return;
        }

        const itemsJson: OrderItemImportJson[] = [];
        const orderId = sellauthOrderId();
        const customerId = createId();

        for (const item of itemsMain) {
          const prismaProductId = productMap[item.sellauthProductId];
          if (!prismaProductId) {
            skippedMissingMap++;
            return;
          }
        }

        const createdAtRaw = trimCell(row["Created At"]);
        const completedAtRaw = trimCell(row["Completed At"]);

        const itemLineTotals = itemsMain.map((it) => it.lineTotalPrice);
        const itemPrices = linePricesForSubtotal(
          itemLineTotals,
          subtotalBeforeGateway,
        );

        for (let i = 0; i < itemsMain.length; i++) {
          const item = itemsMain[i]!;
          const prismaProductId = productMap[item.sellauthProductId]!;

          const itemId = createId();
          const itemCompletedRaw = trimCell(
            row[`Item ${item.index} Completed At`],
          );
          const orderCreatedIso = sellauthNyToIso(createdAtRaw);
          const itemUpdatedIso =
            sellauthNyToIso(itemCompletedRaw) ||
            sellauthNyToIso(completedAtRaw || createdAtRaw);

          const orderItemPayload: OrderItemImportJson = {
            id: itemId,
            orderId,
            productId: prismaProductId,
            quantity: item.quantity,
            price: itemPrices[i]!,
            codes: [...item.codes],
            createdAt: orderCreatedIso || itemUpdatedIso,
            updatedAt: itemUpdatedIso,
          };
          itemsJson.push(orderItemPayload);
        }

        const orderNotes = [`SellAuth: ${o.id}`];

        const orderCreated = sellauthNyToIso(createdAtRaw);
        const orderUpdated = completedAtRaw
          ? sellauthNyToIso(completedAtRaw)
          : orderCreated;

        const { paymentType, paypalNote } = paymentFromSellAuthMethod(
          o.paymentMethod,
        );

        const line = [
          csvCell(orderId),
          csvCell(subtotalBeforeGateway),
          csvCell(o.gatewayFee),
          csvCell(paymentType),
          csvCell(sellauthStatusToOrderStatus(o.status)),
          csvCell(""),
          csvCell(discountAmount),
          csvCell(orderCreated),
          csvCell(orderUpdated),
          csvCell(paypalNote),
          csvCell(JSON.stringify(orderNotes)),
          csvCell(customerId),
          csvCell(customerId),
          csvCell(customerName),
          csvCell(o.email),
          csvCell(""),
          csvCell(""),
          csvCell(""),
          csvCell(o.userAgent ?? ""),
          csvCell(o.ipAddress ?? ""),
          csvCell(o.discordUsername ?? ""),
          csvCell(""),
          csvCell(JSON.stringify(itemsJson)),
        ].join(",");

        lines.push(line);
        emittedOrders++;
      })
      .on("end", () => resolve())
      .on("error", reject);
  });

  fs.writeFileSync(outputCsv, lines.join("\n") + "\n", "utf8");

  console.log(`Wrote ${outputCsv}`);
  console.log(
    `Orders: ${emittedOrders} row(s); source rows: ${sourceRows}; parse errors: ${skippedParse}`,
  );
  console.log(
    `Skipped: ${skippedMixed} mixed; ${skippedNoImportableLines} no importable line(s); ${skippedMissingMap} order(s) with unmapped product id (add to map)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
