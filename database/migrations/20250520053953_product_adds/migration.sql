-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hideHomePage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideProductPage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slashPrice" DOUBLE PRECISION;
