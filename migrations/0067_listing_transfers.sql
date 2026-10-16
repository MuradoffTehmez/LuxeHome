-- Agentliklər arası elan köçürmə sorğusu (#212, PRD v2 6.4).

CREATE TABLE "ListingTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "fromAgencyId" TEXT NOT NULL,
    "toAgencyId" TEXT NOT NULL,
    "requestedById" TEXT,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ownerConsent" BOOLEAN NOT NULL DEFAULT false,
    "ownerConsentNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_SOURCE',
    "sourceDecidedById" TEXT,
    "sourceDecidedAt" DATETIME,
    "sourceNote" TEXT,
    "adminDecidedById" TEXT,
    "adminDecidedAt" DATETIME,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ListingTransfer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingTransfer_fromAgencyId_fkey" FOREIGN KEY ("fromAgencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingTransfer_toAgencyId_fkey" FOREIGN KEY ("toAgencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingTransfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ListingTransfer_status_createdAt_idx" ON "ListingTransfer"("status", "createdAt");
CREATE INDEX "ListingTransfer_propertyId_status_idx" ON "ListingTransfer"("propertyId", "status");
CREATE INDEX "ListingTransfer_fromAgencyId_status_idx" ON "ListingTransfer"("fromAgencyId", "status");
CREATE INDEX "ListingTransfer_toAgencyId_status_idx" ON "ListingTransfer"("toAgencyId", "status");
