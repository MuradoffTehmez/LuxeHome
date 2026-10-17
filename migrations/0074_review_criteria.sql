-- Meyarlı qiymətləndirmə, agentlik rəyləri, təsdiqlənmiş əlaqə, şübhə siqnalları və cavab (#230, PRD v2 10.2–10.5).
ALTER TABLE "AgentReview" ADD COLUMN "ratingCommunication" INTEGER;
ALTER TABLE "AgentReview" ADD COLUMN "ratingAccuracy" INTEGER;
ALTER TABLE "AgentReview" ADD COLUMN "ratingResponsiveness" INTEGER;
ALTER TABLE "AgentReview" ADD COLUMN "ratingProfessionalism" INTEGER;
ALTER TABLE "AgentReview" ADD COLUMN "verifiedInteraction" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AgentReview" ADD COLUMN "suspicionFlags" TEXT;
ALTER TABLE "AgentReview" ADD COLUMN "replyText" TEXT;
ALTER TABLE "AgentReview" ADD COLUMN "replyAuthorName" TEXT;
ALTER TABLE "AgentReview" ADD COLUMN "repliedAt" DATETIME;

CREATE TABLE "AgencyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "serviceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" DATETIME,
    "ratingCommunication" INTEGER,
    "ratingAccuracy" INTEGER,
    "ratingResponsiveness" INTEGER,
    "ratingProfessionalism" INTEGER,
    "verifiedInteraction" BOOLEAN NOT NULL DEFAULT false,
    "suspicionFlags" TEXT,
    "replyText" TEXT,
    "replyAuthorName" TEXT,
    "repliedAt" DATETIME,
    CONSTRAINT "AgencyReview_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AgencyReview_agencyId_status_createdAt_idx" ON "AgencyReview"("agencyId", "status", "createdAt");
CREATE UNIQUE INDEX "AgencyReview_agencyId_customerId_key" ON "AgencyReview"("agencyId", "customerId");
CREATE INDEX "AgencyReview_customerId_idx" ON "AgencyReview"("customerId");
CREATE INDEX "AgencyReview_status_createdAt_idx" ON "AgencyReview"("status", "createdAt");
