-- CreateEnum
CREATE TYPE "EmailSuppressionReason" AS ENUM ('HARD_BOUNCE', 'COMPLAINT', 'MANUAL_BLOCK');

-- CreateEnum
CREATE TYPE "EmailSuppressionSource" AS ENUM ('RESEND_WEBHOOK', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmailValidationStatus" AS ENUM ('VALID', 'BLOCKED');

-- AlterTable
ALTER TABLE "CustomerInformation"
  ADD COLUMN "emailValidationReason" TEXT,
  ADD COLUMN "emailValidationStatus" "EmailValidationStatus",
  ADD COLUMN "emailValidatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SuppressedEmail" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "reason" "EmailSuppressionReason" NOT NULL,
  "source" "EmailSuppressionSource" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SuppressedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDeliveryEvent" (
  "id" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "eventType" TEXT NOT NULL,
  "recipient" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuppressedEmail_email_key" ON "SuppressedEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "unique_provider_message_event" ON "EmailDeliveryEvent"("providerMessageId", "eventType");
