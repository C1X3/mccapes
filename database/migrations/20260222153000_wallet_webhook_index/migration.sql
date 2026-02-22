-- AlterTable
ALTER TABLE "Wallet"
ADD COLUMN "webhookId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_chain_depositIndex_key" ON "Wallet"("chain", "depositIndex");
