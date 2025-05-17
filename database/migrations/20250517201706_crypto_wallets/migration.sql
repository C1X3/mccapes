-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "chain" "CryptoType" NOT NULL,
    "depositIndex" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "expectedAmount" DECIMAL(30,18) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
