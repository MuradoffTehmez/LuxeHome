-- Agentlik daxili fəaliyyət jurnalı (#214, PRD v2 7.4).

CREATE TABLE "AgencyActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyActivity_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AgencyActivity_agencyId_createdAt_idx" ON "AgencyActivity"("agencyId", "createdAt");
CREATE INDEX "AgencyActivity_agencyId_action_createdAt_idx" ON "AgencyActivity"("agencyId", "action", "createdAt");
CREATE INDEX "AgencyActivity_agencyId_actorId_createdAt_idx" ON "AgencyActivity"("agencyId", "actorId", "createdAt");
