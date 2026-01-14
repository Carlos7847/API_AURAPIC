/*
  Warnings:

  - Added the required column `providerId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "providerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PaymentProvider" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayConfig" JSONB,
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "lastHealthCheck" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProvider_code_key" ON "PaymentProvider"("code");

-- CreateIndex
CREATE INDEX "PaymentProvider_isActive_idx" ON "PaymentProvider"("isActive");

-- CreateIndex
CREATE INDEX "PaymentProvider_healthStatus_idx" ON "PaymentProvider"("healthStatus");

-- CreateIndex
CREATE INDEX "PaymentProvider_displayConfig_idx" ON "PaymentProvider" USING GIN ("displayConfig");

-- CreateIndex
CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "PaymentProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
