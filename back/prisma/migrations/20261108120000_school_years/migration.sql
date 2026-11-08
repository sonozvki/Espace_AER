-- AlterTable
ALTER TABLE "User" ADD COLUMN "aerSince" INTEGER;

-- CreateTable
CREATE TABLE "SchoolYear" (
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("year")
);

-- Seed : année courante déduite de la date (bascule au 25 septembre)
INSERT INTO "SchoolYear" ("year", "startDate")
SELECT y, make_date(y, 9, 25)
FROM (
  SELECT CASE
    WHEN CURRENT_DATE < make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 9, 25)
      THEN EXTRACT(YEAR FROM CURRENT_DATE)::int - 1
    ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int
  END AS y
) AS cur;

-- Les AER existants appartiennent à la génération courante (modifiable depuis l'UI)
UPDATE "User" SET "aerSince" = (SELECT MAX("year") FROM "SchoolYear");
