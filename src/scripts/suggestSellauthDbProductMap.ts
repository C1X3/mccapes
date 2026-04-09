/**
 * Cross-walk SellAuth product IDs + names (from the wide invoice CSV) to Prisma Product rows.
 *
 * Usage (loads DATABASE_URL from encrypted .env via dotenvx, same as `pnpm server`):
 *   pnpm sellauth:suggest-product-map -- invoices-mccapes-2025-05-24.csv [outDir]
 *
 * Writes (default outDir: schema-import-export):
 *   - sellauth-products-from-invoices.csv   — unique SellAuth id + sample names from export
 *   - product-id-map.suggested.json         — auto matches only (review before rename to product-id-map.json)
 *   - product-id-map.match-report.txt       — human-readable: each id → db pick or UNMAPPED + runner-up
 *
 * Matching uses name / stripeProductName / token overlap (same rules as historical importer tooling).
 * Rows with title "Unknown" in SellAuth will not auto-map — edit JSON by hand or fix names in SellAuth export.
 */

import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { PrismaClient } from "@generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { parseSellauthInvoiceRow } from "../utils/sellauthCsv";

type DbProduct = {
  id: string;
  name: string;
  slug: string;
  stripeProductName: string | null;
  stripeId: string | null;
};

const MIN_SCORE_AUTO = 58;

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripParens(s: string): string {
  return s.replace(/\([^)]*\)/g, " ");
}

function tokenize(s: string): Set<string> {
  return new Set(
    normalizeForMatch(stripParens(s))
      .split(" ")
      .filter((t) => t.length > 1),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter++;
  }
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function scorePair(sellauthName: string, db: DbProduct): { score: number; reason: string } {
  const na = normalizeForMatch(sellauthName);
  const nb = normalizeForMatch(db.name);
  const ns = db.stripeProductName
    ? normalizeForMatch(db.stripeProductName)
    : "";

  if (!na || na === "unknown") return { score: 0, reason: "unknown_title" };

  if (na === nb) return { score: 100, reason: "db.name_exact" };
  if (ns && na === ns) return { score: 100, reason: "stripeProductName_exact" };

  if (na.length >= 8 && nb.length >= 8 && (na.includes(nb) || nb.includes(na))) {
    return { score: 88, reason: "name_substring" };
  }
  if (
    na.length >= 8 &&
    ns.length >= 8 &&
    (na.includes(ns) || ns.includes(na))
  ) {
    return { score: 87, reason: "stripe_substring" };
  }

  const na2 = normalizeForMatch(stripParens(sellauthName));
  const nb2 = normalizeForMatch(stripParens(db.name));
  if (na2 && na2 === nb2) return { score: 92, reason: "name_no_paren_exact" };

  const ta = tokenize(sellauthName);
  const tb = tokenize(db.name);
  const ts = db.stripeProductName ? tokenize(db.stripeProductName) : new Set<string>();
  const jName = jaccard(ta, tb);
  const jStripe = ts.size ? jaccard(ta, ts) : 0;
  const j = Math.max(jName, jStripe);
  if (j >= 0.72) return { score: 70 + j * 25, reason: `token_jaccard_${j.toFixed(2)}` };
  if (j >= 0.45 && ta.size >= 3) return { score: 55 + j * 20, reason: `token_jaccard_weak_${j.toFixed(2)}` };

  return { score: 0, reason: "no_match" };
}

function pickDisplayName(names: Set<string>): string {
  const list = [...names].filter(Boolean);
  if (list.length === 0) return "";
  const nonUnknown = list.filter((n) => normalizeForMatch(n) !== "unknown");
  const pool = nonUnknown.length ? nonUnknown : list;
  return pool.reduce((a, b) => (b.length > a.length ? b : a));
}

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function positionalCliArgs(): string[] {
  return process.argv
    .slice(2)
    .filter((a) => a !== "--" && !a.endsWith(".ts"));
}

async function main() {
  const repoRoot = path.resolve(__dirname, "../..");
  const rest = positionalCliArgs();
  const inputCsv =
    rest[0] ?? path.join(repoRoot, "invoices-mccapes-2025-05-24.csv");
  const outDir =
    rest[1] ?? path.join(repoRoot, "schema-import-export");

  if (!process.env.DATABASE_URL) {
    console.error(`DATABASE_URL is missing. Load .env with dotenvx (same as server / sheets sync):

  pnpm sellauth:suggest-product-map -- invoices-mccapes-2025-05-24.csv schema-import-export

Or export it yourself, then run tsx on the script.`);
    process.exit(1);
  }

  if (!fs.existsSync(inputCsv)) {
    console.error(`Input not found: ${inputCsv}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const sellauthById = new Map<string, Set<string>>();

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(inputCsv)
      .pipe(csvParser())
      .on("data", (row: Record<string, string | undefined>) => {
        try {
          const parsed = parseSellauthInvoiceRow(row);
          for (const item of parsed.items) {
            if (!sellauthById.has(item.sellauthProductId)) {
              sellauthById.set(item.sellauthProductId, new Set());
            }
            const set = sellauthById.get(item.sellauthProductId)!;
            if (item.name) set.add(item.name);
          }
        } catch {
          /* skip bad rows */
        }
      })
      .on("end", () => resolve())
      .on("error", reject);
  });

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const dbProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      stripeProductName: true,
      stripeId: true,
    },
  });
  await prisma.$disconnect();

  const sellauthSummaryRows: string[] = [
    [
      "sellauth_product_id",
      "title_sample_from_csv",
      "all_titles_seen_pipe_sep",
    ].join(","),
  ];

  const suggested: Record<string, string> = {};
  const reportLines: string[] = [
    `SellAuth products seen: ${sellauthById.size}`,
    `Database products: ${dbProducts.length}`,
    "",
  ];

  const candidateCsvLines: string[] = [
    [
      "sellauth_product_id",
      "sellauth_title_sample",
      "suggested_prisma_product_id",
      "suggested_db_product_name",
      "suggested_db_slug",
      "match_score",
      "match_reason",
      "review_hint",
    ].join(","),
  ];

  const sortedIds = [...sellauthById.keys()].sort(
    (a, b) => Number(a) - Number(b),
  );

  for (const sid of sortedIds) {
    const titleSet = sellauthById.get(sid)!;
    const sample = pickDisplayName(titleSet);
    const allTitles = [...titleSet].join(" | ");
    sellauthSummaryRows.push(
      [csvCell(sid), csvCell(sample), csvCell(allTitles)].join(","),
    );

    let best: { db: DbProduct; score: number; reason: string } | null = null;
    let second: { db: DbProduct; score: number; reason: string } | null = null;

    for (const db of dbProducts) {
      const { score, reason } = scorePair(sample, db);
      if (!best || score > best.score) {
        second = best;
        best = { db, score, reason };
      } else if (!second || score > second.score) {
        second = { db, score, reason };
      }
    }

    let reviewHint = "";
    if (!sample || normalizeForMatch(sample) === "unknown") {
      reviewHint = "SellAuth title is Unknown — map manually to the correct DB product.";
    } else if (!best || best.score < MIN_SCORE_AUTO) {
      reviewHint = "No confident match — pick prisma id manually.";
    } else if (second && best.score - second.score < 8) {
      reviewHint = `Close call vs "${second.db.name}" (${second.score.toFixed(0)}) — verify.`;
    }

    if (best && best.score >= MIN_SCORE_AUTO && reviewHint === "") {
      suggested[sid] = best.db.id;
    }

    const line =
      `[${sid}] "${sample || "(no title)"}"` +
      (best
        ? `\n  best: ${best.score.toFixed(1)} ${best.reason} → ${best.db.id} | "${best.db.name}" | slug=${best.db.slug}`
        : "\n  best: (none)") +
      (second
        ? `\n  2nd: ${second.score.toFixed(1)} ${second.reason} → ${second.db.id} | "${second.db.name}"`
        : "") +
      `\n  titles seen: ${allTitles || "(none)"}\n`;

    reportLines.push(line);

    candidateCsvLines.push(
      [
        csvCell(sid),
        csvCell(sample),
        csvCell(best && best.score >= MIN_SCORE_AUTO ? best.db.id : ""),
        csvCell(best ? best.db.name : ""),
        csvCell(best ? best.db.slug : ""),
        csvCell(best ? best.score.toFixed(1) : ""),
        csvCell(best ? best.reason : ""),
        csvCell(reviewHint),
      ].join(","),
    );
  }

  fs.writeFileSync(
    path.join(outDir, "sellauth-products-from-invoices.csv"),
    sellauthSummaryRows.join("\n") + "\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(outDir, "product-id-map.suggested.json"),
    JSON.stringify(suggested, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(outDir, "product-id-map.match-report.txt"),
    reportLines.join("\n"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(outDir, "sellauth-to-db-candidates.csv"),
    candidateCsvLines.join("\n") + "\n",
    "utf8",
  );

  const autoCount = Object.keys(suggested).length;
  console.log(`Wrote ${outDir}/sellauth-products-from-invoices.csv (${sellauthById.size} ids)`);
  console.log(
    `Wrote product-id-map.suggested.json with ${autoCount} high-confidence entries (${sellauthById.size - autoCount} need manual review).`,
  );
  console.log(`See product-id-map.match-report.txt and sellauth-to-db-candidates.csv`);
  console.log(`After review: copy/rename to product-id-map.json and pass to sellauth:orders-import-csv with --map`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
