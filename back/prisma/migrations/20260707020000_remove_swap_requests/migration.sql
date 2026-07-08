-- DropForeignKey
ALTER TABLE "GuardSwapRequest" DROP CONSTRAINT "GuardSwapRequest_accepterId_fkey";

-- DropForeignKey
ALTER TABLE "GuardSwapRequest" DROP CONSTRAINT "GuardSwapRequest_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "GuardSwapRequest" DROP CONSTRAINT "GuardSwapRequest_sourceGuardId_fkey";

-- DropForeignKey
ALTER TABLE "GuardSwapRequest" DROP CONSTRAINT "GuardSwapRequest_targetGuardId_fkey";

-- DropTable
DROP TABLE "GuardSwapRequest";

-- DropEnum
DROP TYPE "SwapStatus";
