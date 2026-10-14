-- Agentliklər üçün analitika, müraciət bölgüsü və cavab göstəriciləri (#161):
--   * `Lead.handlerId` / `agencyId` / `respondedAt` / `escalatedAt` — müraciətə baxan ictimai
--     hesab, agentlik, ilk cavab və 30 dəqiqəlik eskalasiya;
--   * `Agency.leadRouting` + ölçülmüş cavab göstəriciləri; `AgencyEmployee.receivesLeads/lastLeadAt`;
--   * `AgentProfile.measuredResponse*` — admin tərəfindən yazılan `responseMinutes`-dən ayrıdır;
--   * `PropertyDailyStat` — elanın gündəlik baxış, «Nömrəni göstər» və WhatsApp sayğacları.
-- Cədvəllər yenidən qurulmur: SQLite-də NULL defoltlu xarici açar sütunu `ADD COLUMN` ilə əlavə olunur.

-- Lead
ALTER TABLE "Lead" ADD COLUMN "handlerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD COLUMN "agencyId" TEXT REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD COLUMN "respondedAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "escalatedAt" DATETIME;
CREATE INDEX "Lead_handlerId_createdAt_idx" ON "Lead"("handlerId", "createdAt");
CREATE INDEX "Lead_agencyId_createdAt_idx" ON "Lead"("agencyId", "createdAt");
CREATE INDEX "Lead_respondedAt_escalatedAt_createdAt_idx" ON "Lead"("respondedAt", "escalatedAt", "createdAt");

-- Köhnə elan müraciətləri elanın müəllifinə bağlanır (kabinet onları onsuz da müəllifə göstərirdi).
-- Şirkət (STAFF) elanı ofisin işidir — ona `handlerId` yazılmır.
UPDATE "Lead" SET "handlerId" = (
  SELECT p."authorId" FROM "Property" p JOIN "User" u ON u."id" = p."authorId"
  WHERE p."id" = "Lead"."propertyId" AND u."accountType" <> 'STAFF'
)
WHERE "propertyId" IS NOT NULL AND "handlerId" IS NULL;

-- Agency
ALTER TABLE "Agency" ADD COLUMN "leadRouting" TEXT NOT NULL DEFAULT 'ROUND_ROBIN';
ALTER TABLE "Agency" ADD COLUMN "responseMinutes" INTEGER;
ALTER TABLE "Agency" ADD COLUMN "responseSample" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Agency" ADD COLUMN "responseRate" INTEGER;
ALTER TABLE "Agency" ADD COLUMN "responseComputedAt" DATETIME;

-- AgencyEmployee
ALTER TABLE "AgencyEmployee" ADD COLUMN "receivesLeads" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AgencyEmployee" ADD COLUMN "lastLeadAt" DATETIME;

-- AgentProfile
ALTER TABLE "AgentProfile" ADD COLUMN "measuredResponseMinutes" INTEGER;
ALTER TABLE "AgentProfile" ADD COLUMN "responseSample" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AgentProfile" ADD COLUMN "responseRate" INTEGER;
ALTER TABLE "AgentProfile" ADD COLUMN "responseComputedAt" DATETIME;

-- CreateTable
CREATE TABLE "PropertyDailyStat" (
    "propertyId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "contactReveals" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("propertyId", "day"),
    CONSTRAINT "PropertyDailyStat_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PropertyDailyStat_day_idx" ON "PropertyDailyStat"("day");
