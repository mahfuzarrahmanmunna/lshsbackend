/*
  Warnings:

  - You are about to drop the column `fullName` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the `activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[firebaseUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_leadId_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_userId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_leadId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firebaseUid" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "tuitionFee" DROP NOT NULL;

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "fullName",
DROP COLUMN "source",
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "activities";

-- DropTable
DROP TABLE "tasks";

-- DropEnum
DROP TYPE "ActivityType";

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "leads_sourceId_idx" ON "leads"("sourceId");
