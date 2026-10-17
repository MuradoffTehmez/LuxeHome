-- VIP sorğuları və VIP dövrləri (#248, PRD v2 Modul 12).
CREATE TABLE "VipRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "requesterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "requestedDays" INTEGER NOT NULL,
    "message" TEXT,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "decisionNote" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "extendedCount" INTEGER NOT NULL DEFAULT 0,
    "featuredBefore" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "VipRequest_status_createdAt_idx" ON "VipRequest"("status", "createdAt");
CREATE INDEX "VipRequest_propertyId_status_idx" ON "VipRequest"("propertyId", "status");
CREATE INDEX "VipRequest_requesterId_createdAt_idx" ON "VipRequest"("requesterId", "createdAt");
