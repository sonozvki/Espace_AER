/*
  Warnings:

  - You are about to drop the column `myEpitechToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "myEpitechToken";

-- CreateTable
CREATE TABLE "StudentCache" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "promo" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "semester" INTEGER,
    "gpa" DOUBLE PRECISION,
    "credits" INTEGER,
    "netsoulHours" INTEGER,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentCache_promo_location_idx" ON "StudentCache"("promo", "location");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCache_login_promo_location_key" ON "StudentCache"("login", "promo", "location");
