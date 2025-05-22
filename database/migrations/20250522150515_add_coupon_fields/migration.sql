-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponUsed" TEXT,
ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
