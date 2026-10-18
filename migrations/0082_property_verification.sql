-- Əmlak sənədi yoxlaması və doğrulama nişanları (#256, PRD v2 Modul 17).
ALTER TABLE "Property" ADD COLUMN "documentsVerifiedAt" DATETIME;
ALTER TABLE "Property" ADD COLUMN "documentsVerifiedById" TEXT;
ALTER TABLE "Property" ADD COLUMN "dataVerifiedAt" DATETIME;
ALTER TABLE "Property" ADD COLUMN "dataVerifiedById" TEXT;

CREATE TABLE "PropertyDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "note" TEXT,
    "purgeAfter" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PropertyDocument_propertyId_status_idx" ON "PropertyDocument"("propertyId", "status");
CREATE INDEX "PropertyDocument_status_createdAt_idx" ON "PropertyDocument"("status", "createdAt");
CREATE INDEX "PropertyDocument_purgeAfter_idx" ON "PropertyDocument"("purgeAfter");

CREATE TABLE "DocumentAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "DocumentAccessLog_documentId_createdAt_idx" ON "DocumentAccessLog"("documentId", "createdAt");
CREATE INDEX "DocumentAccessLog_propertyId_createdAt_idx" ON "DocumentAccessLog"("propertyId", "createdAt");
