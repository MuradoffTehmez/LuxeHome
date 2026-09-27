-- İctimai hesab üçün Google ilə giriş (#109): Google kimliyinin dəyişməz ID-si.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleSub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");
