-- Hesab etibarlılığı, tədbirlər və etiraz (#258, PRD v2 Modul 18).
ALTER TABLE "User" ADD COLUMN "trustScore" INTEGER;
ALTER TABLE "User" ADD COLUMN "trustFlags" TEXT;
ALTER TABLE "User" ADD COLUMN "trustCheckedAt" DATETIME;

CREATE TABLE "AccountRestriction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "liftedAt" DATETIME,
    "liftedById" TEXT,
    "liftReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AccountRestriction_userId_liftedAt_idx" ON "AccountRestriction"("userId", "liftedAt");
CREATE INDEX "AccountRestriction_kind_liftedAt_idx" ON "AccountRestriction"("kind", "liftedAt");

CREATE TABLE "AccountRestrictionAppeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restrictionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "decisionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AccountRestrictionAppeal_status_createdAt_idx" ON "AccountRestrictionAppeal"("status", "createdAt");
CREATE INDEX "AccountRestrictionAppeal_restrictionId_idx" ON "AccountRestrictionAppeal"("restrictionId");
