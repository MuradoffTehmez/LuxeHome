-- Migration: sessiya authentication flow və kabinet sorğu indeksi
--
-- `0004_public_accounts.sql` artıq tətbiq edilmiş ola bilər, ona görə additive
-- authKind və indeks dəyişiklikləri ayrıca miqrasiyada saxlanılır.

-- Köhnə sessiyalar panelin əvvəlki 2FA axınından gəlib. Yeni public sessiya
-- explicit olaraq PUBLIC yazılır və cookie claim-i ilə D1-də müqayisə edilir.
ALTER TABLE "Session" ADD COLUMN "authKind" TEXT NOT NULL DEFAULT 'STAFF_2FA';

-- Kabinet yalnız müəllifin elanlarının sayını/siyahısını oxuyur.
CREATE INDEX "Property_authorId_idx" ON "Property"("authorId");
