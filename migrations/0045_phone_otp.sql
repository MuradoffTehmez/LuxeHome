-- Telefonla OTP girişi (#109): təsdiqlənmiş nömrə və birdəfəlik kodlar.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "verifiedPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_verifiedPhone_key" ON "User"("verifiedPhone");

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_createdAt_idx" ON "PhoneOtp"("phone", "createdAt");
