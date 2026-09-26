-- Toplu şəkil yükləmə idempotentliyi (#79): client hər fayl üçün `clientUploadId`
-- göndərir, cavab itib sorğu təkrarlananda server eyni `Media` sətrini qaytarır.
-- SQLite unikal indeksdə NULL-ları bərabər saymır, ona görə köhnə sətirlər təsirlənmir.

-- AlterTable
ALTER TABLE "Media" ADD COLUMN "clientUploadId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Media_uploaderId_clientUploadId_key" ON "Media"("uploaderId", "clientUploadId");
