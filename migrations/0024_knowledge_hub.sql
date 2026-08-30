-- Bilik Mərkəzi (Real Estate Knowledge Hub).
-- Public PRD §86-87 (FAQ CMS + FAQ SEO) və köhnəlməyən təlimat məzmunu.
-- Miqrasiya tam additivdir: mövcud cədvəllərə və sətirlərə toxunmur.

CREATE TABLE "KnowledgeCategory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "searchName" TEXT NOT NULL DEFAULT '',
  "description" TEXT,
  "icon" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "KnowledgeCategory_slug_key" ON "KnowledgeCategory"("slug");
CREATE INDEX "KnowledgeCategory_isActive_order_idx" ON "KnowledgeCategory"("isActive", "order");

CREATE TABLE "KnowledgeArticle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "searchText" TEXT NOT NULL DEFAULT '',
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "categoryId" TEXT,
  "audience" TEXT NOT NULL DEFAULT 'BUYER',
  "level" TEXT NOT NULL DEFAULT 'BEGINNER',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "legalStatus" TEXT NOT NULL DEFAULT 'CURRENT',
  "riskLevel" TEXT NOT NULL DEFAULT 'YELLOW',
  "jurisdiction" TEXT NOT NULL DEFAULT 'Azərbaycan Respublikası',
  "legalReviewedAt" DATETIME,
  "legalActs" TEXT,
  "sourceUrls" TEXT,
  "legalBasis" TEXT,
  "requiredDocuments" TEXT,
  "procedure" TEXT,
  "duration" TEXT,
  "costs" TEXT,
  "risks" TEXT,
  "checklist" TEXT,
  "template" TEXT,
  "courtPosition" TEXT,
  "readMinutes" INTEGER NOT NULL DEFAULT 1,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "isDemo" BOOLEAN NOT NULL DEFAULT false,
  "coverUrl" TEXT,
  "coverAlt" TEXT NOT NULL DEFAULT '',
  "authorId" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "noIndex" BOOLEAN NOT NULL DEFAULT false,
  "canonicalUrl" TEXT,
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "ogImage" TEXT,
  "publishedAt" DATETIME,
  "deletedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "KnowledgeArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "KnowledgeArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");
CREATE INDEX "KnowledgeArticle_status_publishedAt_idx" ON "KnowledgeArticle"("status", "publishedAt");
CREATE INDEX "KnowledgeArticle_categoryId_idx" ON "KnowledgeArticle"("categoryId");
CREATE INDEX "KnowledgeArticle_audience_idx" ON "KnowledgeArticle"("audience");
CREATE INDEX "KnowledgeArticle_legalStatus_legalReviewedAt_idx" ON "KnowledgeArticle"("legalStatus", "legalReviewedAt");
CREATE INDEX "KnowledgeArticle_riskLevel_idx" ON "KnowledgeArticle"("riskLevel");
CREATE INDEX "KnowledgeArticle_isFeatured_idx" ON "KnowledgeArticle"("isFeatured");
CREATE INDEX "KnowledgeArticle_deletedAt_idx" ON "KnowledgeArticle"("deletedAt");

CREATE TABLE "KnowledgeTerm" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "searchName" TEXT NOT NULL DEFAULT '',
  "shortDefinition" TEXT NOT NULL,
  "definition" TEXT,
  "initial" TEXT NOT NULL DEFAULT '',
  "categoryId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "order" INTEGER NOT NULL DEFAULT 0,
  "relatedSlugs" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "KnowledgeTerm_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "KnowledgeTerm_slug_key" ON "KnowledgeTerm"("slug");
CREATE INDEX "KnowledgeTerm_status_initial_idx" ON "KnowledgeTerm"("status", "initial");
CREATE INDEX "KnowledgeTerm_categoryId_idx" ON "KnowledgeTerm"("categoryId");

CREATE TABLE "KnowledgeFaq" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'PLATFORM',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "KnowledgeFaq_status_category_order_idx" ON "KnowledgeFaq"("status", "category", "order");
