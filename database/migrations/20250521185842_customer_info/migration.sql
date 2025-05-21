/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `CustomerInformation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CustomerInformation_orderId_key" ON "CustomerInformation"("orderId");
