/*
  Warnings:

  - You are about to drop the column `mpCollectorId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `mpPaymentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `mpEventId` on the `WebhookEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerPaymentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerEventId]` on the table `WebhookEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payment_mpPaymentId_idx";

-- DropIndex
DROP INDEX "Payment_mpPaymentId_key";

-- DropIndex
DROP INDEX "WebhookEvent_mpEventId_idx";

-- DropIndex
DROP INDEX "WebhookEvent_mpEventId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "mpCollectorId",
DROP COLUMN "mpPaymentId",
ADD COLUMN     "providerCollectorId" TEXT,
ADD COLUMN     "providerPaymentId" TEXT;

-- AlterTable
ALTER TABLE "WebhookEvent" DROP COLUMN "mpEventId",
ADD COLUMN     "providerEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "Payment_providerPaymentId_idx" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON "WebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_providerEventId_idx" ON "WebhookEvent"("providerEventId");
