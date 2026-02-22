/*
  Warnings:

  - A unique constraint covering the columns `[chain,depositIndex]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "webhookId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_chain_depositIndex_key" ON "Wallet"("chain", "depositIndex");
