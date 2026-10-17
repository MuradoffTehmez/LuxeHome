-- Agentlik daxili tapşırıqları (#220, PRD v2 7.3).

CREATE TABLE "AgencyTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT,
    "propertyId" TEXT,
    "leadId" TEXT,
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgencyTask_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AgencyTask_agencyId_status_dueAt_idx" ON "AgencyTask"("agencyId", "status", "dueAt");
CREATE INDEX "AgencyTask_agencyId_assigneeId_status_idx" ON "AgencyTask"("agencyId", "assigneeId", "status");
