-- Migration: ictimai hesablar (istifadəçi, mülk sahibi, agentlik)
--
-- `role` panel səlahiyyətini göstərməyə davam edir; `accountType` isə hesabın kim
-- olduğunu bildirir. İki ölçü ayrı saxlanılır ki, yeni ictimai hesab növü əlavə etmək
-- RBAC matrisinə toxunmasın.

ALTER TABLE "User" ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'STAFF';
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;

CREATE INDEX "User_accountType_idx" ON "User"("accountType");

-- Agentlik profili. Yalnız `accountType = 'AGENCY'` olan hesablarda olur.
-- `isVerified` — admin təsdiqi: təsdiqlənmiş agentliyin elanı birbaşa dərc olunur,
-- təsdiqlənməmişin elanı «Təsdiq gözləyir» statusunda qalır.
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Agency_userId_key" ON "Agency"("userId");
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");
CREATE INDEX "Agency_isVerified_idx" ON "Agency"("isVerified");
