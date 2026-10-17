-- Rəydən şikayət (#232, PRD v2 10.5).
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewKind" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ReviewReport_reviewKind_reviewId_reporterId_key" ON "ReviewReport"("reviewKind", "reviewId", "reporterId");
CREATE INDEX "ReviewReport_status_createdAt_idx" ON "ReviewReport"("status", "createdAt");
