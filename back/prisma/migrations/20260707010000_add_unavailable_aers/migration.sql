-- CreateTable
CREATE TABLE "_GuardUnavailabilities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GuardUnavailabilities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GuardUnavailabilities_B_index" ON "_GuardUnavailabilities"("B");

-- AddForeignKey
ALTER TABLE "_GuardUnavailabilities" ADD CONSTRAINT "_GuardUnavailabilities_A_fkey" FOREIGN KEY ("A") REFERENCES "Guard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuardUnavailabilities" ADD CONSTRAINT "_GuardUnavailabilities_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
