-- Müraciət mərhələləri, növbəti əlaqə tarixi və fəaliyyət tarixçəsi (#222, PRD v2 8.3, 8.6).

ALTER TABLE "Lead" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "Lead" ADD COLUMN "nextContactAt" DATETIME;

CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "LeadActivity_leadId_createdAt_idx" ON "LeadActivity"("leadId", "createdAt");

-- Mövcud müraciətlər: mərhələ qaba statusdan bərpa olunur. Agentə düşmüş yeni müraciət «təyin edilib» sayılır.
UPDATE "Lead" SET "stage" = 'CONTACTED' WHERE "status" = 'CONTACTED';
UPDATE "Lead" SET "stage" = 'NEGOTIATING' WHERE "status" = 'IN_PROGRESS';
-- Tamamlanmış müraciət bağlanmış mərhələdə qalmalıdır (`leadStatusForStage` yenə COMPLETED verir):
-- kirayə elanında «Kirayə müqaviləsi bağlanıb», qalanlarında «Satış tamamlanıb».
UPDATE "Lead" SET "stage" = CASE
  WHEN EXISTS (SELECT 1 FROM "Property" WHERE "Property"."id" = "Lead"."propertyId" AND "Property"."listingType" = 'RENT') THEN 'RENTED'
  ELSE 'SOLD'
END
WHERE "status" = 'COMPLETED';
UPDATE "Lead" SET "stage" = 'CLOSED' WHERE "status" = 'CLOSED';
UPDATE "Lead" SET "stage" = 'ASSIGNED'
WHERE "status" = 'NEW' AND "agencyId" IS NOT NULL AND "handlerId" IS NOT NULL
  AND "handlerId" NOT IN (SELECT "userId" FROM "Agency" WHERE "id" = "Lead"."agencyId");
