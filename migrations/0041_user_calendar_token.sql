-- Əməkdaşın şəxsi təqvim abunəsi (ICS) üçün gizli açar (#109).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "calendarToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_calendarToken_key" ON "User"("calendarToken");
