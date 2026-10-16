-- Telegram əlaqəsi və klik sayğacı (#208, PRD v2 8.2 / 11.3 / 13.2).

ALTER TABLE "User" ADD COLUMN "telegram" TEXT;
ALTER TABLE "Agency" ADD COLUMN "telegram" TEXT;
ALTER TABLE "PropertyDailyStat" ADD COLUMN "telegramClicks" INTEGER NOT NULL DEFAULT 0;
