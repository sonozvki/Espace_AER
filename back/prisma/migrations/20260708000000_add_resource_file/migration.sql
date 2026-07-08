-- AlterTable
ALTER TABLE "Resource" ALTER COLUMN "url" DROP NOT NULL;
ALTER TABLE "Resource" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Resource" ADD COLUMN "fileMime" TEXT;
ALTER TABLE "Resource" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Resource" ADD COLUMN "fileData" BYTEA;
