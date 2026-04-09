/**
 * Remove local orders imported from SellAuth (notes contain `SellAuth: <numeric id>`).
 *
 * Matches the same note pattern as admin invoice filter (`includeSellAuth: false`) in
 * `src/server/routes/invoices.ts`.
 *
 * Usage (DATABASE_URL via dotenvx, same as other DB scripts):
 *   pnpm db:delete-sellauth-orders              # dry-run: counts only
 *   pnpm db:delete-sellauth-orders -- --execute # destructive delete
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@generated/client";

async function main() {
  const execute = process.argv.includes("--execute");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  /** Same pattern as `includeSellAuth: false` in `src/server/routes/invoices.ts`. */
  const rows = await prisma.$queryRaw<{ id: string; customerId: string }[]>`
    SELECT id, "customerId" FROM "Order"
    WHERE EXISTS (
      SELECT 1 FROM unnest(notes) AS t(note)
      WHERE t.note ~ '^SellAuth:[[:space:]]*[0-9]+[[:space:]]*$'
    )
  `;

  const orderIds = rows.map((r) => r.id);
  const customerIds = [...new Set(rows.map((r) => r.customerId))];

  if (orderIds.length === 0) {
    console.log("No orders with SellAuth notes found.");
    await prisma.$disconnect();
    return;
  }

  const walletCount = await prisma.wallet.count({
    where: { orderId: { in: orderIds } },
  });

  console.log(
    `Found ${orderIds.length} order(s), ${customerIds.length} customer row(s), ${walletCount} wallet row(s).`,
  );

  if (!execute) {
    console.log(
      "Dry run only. Re-run with --execute after `pnpm db:delete-sellauth-orders -- --execute` to delete.",
    );
    await prisma.$disconnect();
    return;
  }

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
    return {
      wallets: wallets.count,
      orders: orders.count,
      customers: customers.count,
    };
  });

  console.log(
    `Deleted ${removed.wallets} wallet(s), ${removed.orders} order(s), ${removed.customers} customer(s).`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
