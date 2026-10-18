-- Elanı irəli çəkmə kampaniyaları (#250, PRD v2 Modul 13).
ALTER TABLE "Property" ADD COLUMN "promotedUntil" DATETIME;
CREATE INDEX "Property_promotedUntil_idx" ON "Property"("promotedUntil");

CREATE TABLE "PromotionCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "requesterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "message" TEXT,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "decisionNote" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "PromotionCampaign_status_createdAt_idx" ON "PromotionCampaign"("status", "createdAt");
CREATE INDEX "PromotionCampaign_propertyId_status_idx" ON "PromotionCampaign"("propertyId", "status");
