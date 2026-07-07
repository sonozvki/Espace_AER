-- AlterTable
ALTER TABLE "Guard" DROP COLUMN "absent";

-- CreateTable
CREATE TABLE "Absence" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_date_idx" ON "Absence"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Absence_date_userId_key" ON "Absence"("date", "userId");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
