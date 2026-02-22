-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CAPE', 'STANDARD');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "backgroundImageUrl" TEXT,
ADD COLUMN     "capeTexturePng" BYTEA,
ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'CAPE';
