-- Moderasiya qərarına etiraz (#206, PRD v2 20.4).

CREATE TABLE "ListingAppeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "authorId" TEXT,
    "appealedStatus" TEXT NOT NULL,
    "previousStatus" TEXT,
    "decidedById" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewerId" TEXT,
    "decisionNote" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingAppeal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingAppeal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ListingAppeal_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ListingAppeal_status_createdAt_idx" ON "ListingAppeal"("status", "createdAt");
CREATE INDEX "ListingAppeal_propertyId_status_idx" ON "ListingAppeal"("propertyId", "status");
