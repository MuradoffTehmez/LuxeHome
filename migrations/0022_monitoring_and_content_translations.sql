-- Real-user monitoring: şəxsi məlumat, stack trace və tam URL saxlanılmır.
CREATE TABLE "ClientErrorEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "message" TEXT NOT NULL,
  "digest" TEXT,
  "path" TEXT,
  "source" TEXT NOT NULL DEFAULT 'client',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ClientErrorEvent_createdAt_idx" ON "ClientErrorEvent"("createdAt");
CREATE INDEX "ClientErrorEvent_digest_createdAt_idx" ON "ClientErrorEvent"("digest", "createdAt");

CREATE TABLE "WebVitalMetric" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "rating" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "navigationType" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WebVitalMetric_createdAt_idx" ON "WebVitalMetric"("createdAt");
CREATE INDEX "WebVitalMetric_name_createdAt_idx" ON "WebVitalMetric"("name", "createdAt");

CREATE TABLE "ContentTranslation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "title" TEXT,
  "summary" TEXT,
  "content" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "updatedById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "ContentTranslation_entityType_entityId_locale_key" ON "ContentTranslation"("entityType", "entityId", "locale");
CREATE INDEX "ContentTranslation_locale_status_idx" ON "ContentTranslation"("locale", "status");
CREATE INDEX "ContentTranslation_entityType_entityId_idx" ON "ContentTranslation"("entityType", "entityId");
