-- LuxeHomeEstate SERP Ecosystem PRD — idarə olunan metadata, landing, entity,
-- keyword, audit, Search Console və atribusiya infrastrukturu.
-- Miqrasiya additivdir; mövcud public qeydlərin statusunu və məzmununu dəyişmir.

ALTER TABLE "Property" ADD COLUMN "closedAt" DATETIME;
ALTER TABLE "Property" ADD COLUMN "retentionUntil" DATETIME;
ALTER TABLE "Property" ADD COLUMN "contentFingerprint" TEXT;
CREATE INDEX "Property_closedAt_retentionUntil_idx" ON "Property"("closedAt", "retentionUntil");
CREATE INDEX "Property_contentFingerprint_idx" ON "Property"("contentFingerprint");

ALTER TABLE "PropertyImage" ADD COLUMN "caption" TEXT;
ALTER TABLE "PropertyImage" ADD COLUMN "checksum" TEXT;
CREATE INDEX "PropertyImage_checksum_idx" ON "PropertyImage"("checksum");

ALTER TABLE "BlogPost" ADD COLUMN "reviewerName" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "BlogPost" ADD COLUMN "reviewAfter" DATETIME;
ALTER TABLE "BlogPost" ADD COLUMN "tags" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "references" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "relatedPropertyIds" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "relatedPostIds" TEXT;
CREATE INDEX "BlogPost_reviewAfter_idx" ON "BlogPost"("reviewAfter");

ALTER TABLE "Lead" ADD COLUMN "acquisitionSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "acquisitionMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN "landingPage" TEXT;
ALTER TABLE "Lead" ADD COLUMN "referrer" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmTerm" TEXT;
ALTER TABLE "Lead" ADD COLUMN "utmContent" TEXT;
CREATE INDEX "Lead_acquisitionSource_acquisitionMedium_createdAt_idx"
  ON "Lead"("acquisitionSource", "acquisitionMedium", "createdAt");

ALTER TABLE "Media" ADD COLUMN "caption" TEXT;
ALTER TABLE "Media" ADD COLUMN "checksum" TEXT;
ALTER TABLE "Media" ADD COLUMN "watermarkApplied" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Media_checksum_idx" ON "Media"("checksum");

ALTER TABLE "Redirect" ADD COLUMN "createdBy" TEXT;

ALTER TABLE "KnowledgeArticle" ADD COLUMN "reviewerName" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "reviewAfter" DATETIME;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "tags" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "relatedPropertyIds" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "relatedArticleIds" TEXT;
CREATE INDEX "KnowledgeArticle_reviewAfter_idx" ON "KnowledgeArticle"("reviewAfter");

CREATE TABLE "SeoMetadata" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'az',
  "title" TEXT,
  "description" TEXT,
  "canonical" TEXT,
  "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
  "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "ogImage" TEXT,
  "updatedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "SeoMetadata_entityType_entityId_locale_key"
  ON "SeoMetadata"("entityType", "entityId", "locale");
CREATE INDEX "SeoMetadata_entityType_locale_idx" ON "SeoMetadata"("entityType", "locale");

CREATE TABLE "SeoLandingPage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "locale" TEXT NOT NULL DEFAULT 'az',
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "h1" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "introContent" TEXT NOT NULL,
  "bottomContent" TEXT,
  "filtersJson" TEXT NOT NULL,
  "faqJson" TEXT NOT NULL DEFAULT '[]',
  "relatedPathsJson" TEXT NOT NULL DEFAULT '[]',
  "indexable" BOOLEAN NOT NULL DEFAULT false,
  "indexEmpty" BOOLEAN NOT NULL DEFAULT false,
  "minInventory" INTEGER NOT NULL DEFAULT 5,
  "canonical" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "publishedAt" DATETIME,
  "updatedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "SeoLandingPage_locale_slug_key" ON "SeoLandingPage"("locale", "slug");
CREATE INDEX "SeoLandingPage_status_indexable_locale_idx"
  ON "SeoLandingPage"("status", "indexable", "locale");

CREATE TABLE "SeoKeyword" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "keyword" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'az',
  "intent" TEXT NOT NULL,
  "cluster" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 3,
  "searchVolume" INTEGER,
  "currentPosition" REAL,
  "measuredAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "SeoKeyword_keyword_locale_key" ON "SeoKeyword"("keyword", "locale");
CREATE INDEX "SeoKeyword_cluster_priority_idx" ON "SeoKeyword"("cluster", "priority");
CREATE INDEX "SeoKeyword_targetUrl_idx" ON "SeoKeyword"("targetUrl");

CREATE TABLE "EntityProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'az',
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "legalName" TEXT,
  "description" TEXT,
  "schemaType" TEXT NOT NULL,
  "dataJson" TEXT NOT NULL DEFAULT '{}',
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "updatedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "EntityProfile_entityType_slug_locale_key"
  ON "EntityProfile"("entityType", "slug", "locale");
CREATE INDEX "EntityProfile_entityId_locale_idx" ON "EntityProfile"("entityId", "locale");
CREATE INDEX "EntityProfile_isPublic_entityType_idx" ON "EntityProfile"("isPublic", "entityType");

CREATE TABLE "SeoAuditIssue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" DATETIME
);
CREATE INDEX "SeoAuditIssue_status_severity_detectedAt_idx"
  ON "SeoAuditIssue"("status", "severity", "detectedAt");
CREATE INDEX "SeoAuditIssue_entityType_entityId_idx" ON "SeoAuditIssue"("entityType", "entityId");
CREATE INDEX "SeoAuditIssue_url_idx" ON "SeoAuditIssue"("url");

CREATE TABLE "SeoSearchMetric" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" DATETIME NOT NULL,
  "query" TEXT NOT NULL DEFAULT '',
  "page" TEXT NOT NULL DEFAULT '',
  "country" TEXT NOT NULL DEFAULT '',
  "device" TEXT NOT NULL DEFAULT '',
  "clicks" REAL NOT NULL DEFAULT 0,
  "impressions" REAL NOT NULL DEFAULT 0,
  "ctr" REAL NOT NULL DEFAULT 0,
  "position" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "SeoSearchMetric_date_query_page_country_device_key"
  ON "SeoSearchMetric"("date", "query", "page", "country", "device");
CREATE INDEX "SeoSearchMetric_date_idx" ON "SeoSearchMetric"("date");
CREATE INDEX "SeoSearchMetric_page_date_idx" ON "SeoSearchMetric"("page", "date");

CREATE TABLE "SeoAlert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" DATETIME
);
CREATE INDEX "SeoAlert_status_severity_detectedAt_idx"
  ON "SeoAlert"("status", "severity", "detectedAt");
