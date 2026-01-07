/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetTokenHash]` on the table `AuthCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AuthCredential" ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_passwordResetTokenHash_key" ON "AuthCredential"("passwordResetTokenHash");
