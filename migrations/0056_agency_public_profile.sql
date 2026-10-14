-- Agentliyin ictimai profili (bina.az tipli səhifə): ofis e-poçtu, WhatsApp, Instagram,
-- iş saatları və profil baxış sayğacı. Hamısı istəyə bağlıdır; mövcud qeydlər dəyişmir.

-- AlterTable
ALTER TABLE "Agency" ADD COLUMN "email" TEXT;
ALTER TABLE "Agency" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Agency" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Agency" ADD COLUMN "workingHours" TEXT;
ALTER TABLE "Agency" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
