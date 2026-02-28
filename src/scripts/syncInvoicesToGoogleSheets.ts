import "module-alias/register";

import { syncCompletedInvoicesToGoogleSheets } from "@/server/invoices/googleSheetsSync";
import { prisma } from "@/utils/prisma";

(async function run() {
  try {
    const result = await syncCompletedInvoicesToGoogleSheets();

    if (!result.synced) {
      console.log(`[google-sheets-sync] skipped: ${result.skippedReason}`);
      process.exit(0);
    }

    console.log(`[google-sheets-sync] success rows=${result.rowsWritten}`);
    process.exit(0);
  } catch (error) {
    console.error("[google-sheets-sync] failed", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
