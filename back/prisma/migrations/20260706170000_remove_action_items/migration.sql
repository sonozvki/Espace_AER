-- DropForeignKey
ALTER TABLE "ActionItem" DROP CONSTRAINT "ActionItem_memoId_fkey";

-- DropForeignKey
ALTER TABLE "ActionItem" DROP CONSTRAINT "ActionItem_assigneeId_fkey";

-- DropTable
DROP TABLE "ActionItem";

-- DropEnum
DROP TYPE "ActionStatus";
