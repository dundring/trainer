/*
  Warnings:

  - A unique constraint covering the columns `[identityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "identityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_identityId_key" ON "User"("identityId");
