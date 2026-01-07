/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationTokenHash]` on the table `AuthCredential` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AuthCredential" ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerificationTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_emailVerificationTokenHash_key" ON "AuthCredential"("emailVerificationTokenHash");
