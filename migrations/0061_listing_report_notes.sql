-- Şikayət qrupu (elan) üzrə moderatorun daxili qeydləri (#197). Yalnız paneldə görünür.

CREATE TABLE "ListingReportNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingReportNote_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingReportNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ListingReportNote_propertyId_createdAt_idx" ON "ListingReportNote"("propertyId", "createdAt");
