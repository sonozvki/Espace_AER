-- Merge 4 fixed sections into a single Markdown content field.
-- Existing data: concatenate old sections (preserving any content already typed).

ALTER TABLE "Memo" ADD COLUMN "content" TEXT NOT NULL DEFAULT '';

UPDATE "Memo" SET "content" = CONCAT_WS(
  E'\n\n',
  CASE WHEN "chosesADire"       <> '' THEN E'## Choses à dire\n\n'       || "chosesADire"       END,
  CASE WHEN "activitesPge"      <> '' THEN E'## Activités PGE\n\n'       || "activitesPge"      END,
  CASE WHEN "activitesBachelor" <> '' THEN E'## Activités Bachelor\n\n'  || "activitesBachelor" END,
  CASE WHEN "autres"            <> '' THEN E'## Autres\n\n'                    || "autres"            END
);

ALTER TABLE "Memo" DROP COLUMN "chosesADire";
ALTER TABLE "Memo" DROP COLUMN "activitesPge";
ALTER TABLE "Memo" DROP COLUMN "activitesBachelor";
ALTER TABLE "Memo" DROP COLUMN "autres";
