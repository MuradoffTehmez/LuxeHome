-- Müraciət bölgüsü rejimləri və konfiqurasiya olunan cavabsız müraciət pillələri (#224, PRD 8.4, 8.5).
ALTER TABLE "Agency" ADD COLUMN "leadReminderMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Agency" ADD COLUMN "leadAlertMinutes" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "Agency" ADD COLUMN "leadReassignMinutes" INTEGER NOT NULL DEFAULT 1440;

ALTER TABLE "Lead" ADD COLUMN "reminderSentAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "reassignSuggestedAt" DATETIME;

-- Artıq menecerə bildirilmiş müraciət ilkin xatırlatmanı sonradan almasın.
UPDATE "Lead" SET "reminderSentAt" = "escalatedAt" WHERE "escalatedAt" IS NOT NULL;
