-- Add per-product preorder message configuration
ALTER TABLE "Product"
ADD COLUMN "preorderMessage" TEXT;
