-- Rəsmi Tərəfdaşlıq Sistemi (Partners).
--
-- Miqrasiya tamamilə additivdir: mövcud cədvəllərdən yalnız `Lead` iki nullable
-- sütun alır. `prisma migrate diff` burada `Property` və `Lead` üçün tam
-- RedefineTables bloku yaradırdı (CREATE new_ → INSERT SELECT → DROP → RENAME).
-- O yol production-da böyük `Property` cədvəlini bütövlükdə köçürərdi və D1
-- tranzaksiya dəstəkləmədiyi üçün yarıda kəsilsə cədvəl itə bilərdi.
-- Nəticə eynidir, ona görə 0009/0010-dakı kimi `ADD COLUMN` işlədilir.

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "shortDescription" TEXT,
    "shortDescriptionEn" TEXT,
    "shortDescriptionRu" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "descriptionRu" TEXT,
    "disclaimer" TEXT,
    "disclaimerEn" TEXT,
    "disclaimerRu" TEXT,
    "websiteUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "logoUrl" TEXT,
    "logoLight" TEXT,
    "logoDark" TEXT,
    "coverImage" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "partnershipType" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "officialPartner" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "showPublicly" BOOLEAN NOT NULL DEFAULT false,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "officialSince" DATETIME,
    "partnershipEndDate" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "ogImage" TEXT,
    "contractNumber" TEXT,
    "contractStartDate" DATETIME,
    "contractEndDate" DATETIME,
    "contractDocument" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    CONSTRAINT "Partner_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Partner_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Partner_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SOURCE',
    "sourceUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyPartner_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DEVELOPER',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectPartner_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgencyPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'BROKER',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgencyPartner_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgencyPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable — müraciət atribusiyası (tərəfdaş / layihə).
-- Mövcud sətirlər NULL qalır; keçmiş müraciətlərin mənbəyi təxmin edilmir.
ALTER TABLE "Lead" ADD COLUMN "partnerId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_partnerId_idx" ON "Lead"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_slug_idx" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "Partner_partnershipType_idx" ON "Partner"("partnershipType");

-- CreateIndex
CREATE INDEX "Partner_featured_idx" ON "Partner"("featured");

-- CreateIndex
CREATE INDEX "Partner_showPublicly_idx" ON "Partner"("showPublicly");

-- CreateIndex
CREATE INDEX "Partner_showOnHomepage_idx" ON "Partner"("showOnHomepage");

-- CreateIndex
CREATE INDEX "Partner_officialSince_idx" ON "Partner"("officialSince");

-- CreateIndex
CREATE INDEX "Partner_deletedAt_idx" ON "Partner"("deletedAt");

-- CreateIndex
CREATE INDEX "Partner_status_showPublicly_deletedAt_idx" ON "Partner"("status", "showPublicly", "deletedAt");

-- CreateIndex
CREATE INDEX "Partner_sortOrder_idx" ON "Partner"("sortOrder");

-- CreateIndex
CREATE INDEX "PropertyPartner_partnerId_idx" ON "PropertyPartner"("partnerId");

-- CreateIndex
CREATE INDEX "PropertyPartner_propertyId_isPublic_idx" ON "PropertyPartner"("propertyId", "isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPartner_propertyId_partnerId_role_key" ON "PropertyPartner"("propertyId", "partnerId", "role");

-- CreateIndex
CREATE INDEX "ProjectPartner_partnerId_idx" ON "ProjectPartner"("partnerId");

-- CreateIndex
CREATE INDEX "ProjectPartner_projectId_isPublic_idx" ON "ProjectPartner"("projectId", "isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPartner_projectId_partnerId_role_key" ON "ProjectPartner"("projectId", "partnerId", "role");

-- CreateIndex
CREATE INDEX "AgencyPartner_partnerId_idx" ON "AgencyPartner"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPartner_agencyId_partnerId_key" ON "AgencyPartner"("agencyId", "partnerId");
