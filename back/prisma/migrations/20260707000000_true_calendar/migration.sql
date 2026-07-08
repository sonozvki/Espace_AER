-- DropForeignKey
ALTER TABLE "Absence" DROP CONSTRAINT "Absence_userId_fkey";

-- DropForeignKey
ALTER TABLE "Guard" DROP CONSTRAINT "Guard_aerId_fkey";

-- AlterTable
ALTER TABLE "Guard" DROP COLUMN "aerId",
ADD COLUMN     "guardAerId" INTEGER,
ADD COLUMN     "isPublicHoliday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSchoolHoliday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicHolidayName" TEXT,
ADD COLUMN     "schoolHolidayName" TEXT;

-- DropTable
DROP TABLE "Absence";

-- CreateTable
CREATE TABLE "_GuardAbsences" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GuardAbsences_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GuardAbsences_B_index" ON "_GuardAbsences"("B");

-- AddForeignKey
ALTER TABLE "Guard" ADD CONSTRAINT "Guard_guardAerId_fkey" FOREIGN KEY ("guardAerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuardAbsences" ADD CONSTRAINT "_GuardAbsences_A_fkey" FOREIGN KEY ("A") REFERENCES "Guard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuardAbsences" ADD CONSTRAINT "_GuardAbsences_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
