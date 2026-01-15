/*
  Warnings:

  - You are about to drop the column `s3Key` on the `ImageAsset` table. All the data in the column will be lost.
  - The `embedding` column on the `Memory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[storageKey]` on the table `ImageAsset` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storageKey` to the `ImageAsset` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- DropIndex
DROP INDEX "ImageAsset_s3Key_key";

-- AlterTable
ALTER TABLE "ImageAsset" DROP COLUMN "s3Key",
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector(768);

-- CreateIndex
CREATE UNIQUE INDEX "ImageAsset_storageKey_key" ON "ImageAsset"("storageKey");
