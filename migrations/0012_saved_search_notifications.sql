-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" DATETIME,
    "lastNotifiedAt" DATETIME,
    CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedSearchMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "savedSearchId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "notifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSearchMatch_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSearchMatch_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_enabled_idx" ON "SavedSearch"("enabled");

-- CreateIndex
CREATE INDEX "SavedSearchMatch_propertyId_idx" ON "SavedSearchMatch"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearchMatch_savedSearchId_propertyId_key" ON "SavedSearchMatch"("savedSearchId", "propertyId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
