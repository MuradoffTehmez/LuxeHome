-- Mini CRM: müştəri kartları, ehtiyaclar və daxili qeydlər (#226, PRD v2 9.1, 9.2).

CREATE TABLE "CrmClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "phoneKey" TEXT,
    "email" TEXT,
    "emailKey" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "interestedPropertyId" TEXT,
    "listingType" TEXT,
    "typeId" TEXT,
    "cityId" TEXT,
    "districtId" TEXT,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "areaMin" INTEGER,
    "areaMax" INTEGER,
    "rooms" INTEGER,
    "renovation" TEXT,
    "preferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CrmClient_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CrmClient_agencyId_updatedAt_idx" ON "CrmClient"("agencyId", "updatedAt");
CREATE INDEX "CrmClient_ownerId_updatedAt_idx" ON "CrmClient"("ownerId", "updatedAt");
CREATE INDEX "CrmClient_phoneKey_idx" ON "CrmClient"("phoneKey");
CREATE INDEX "CrmClient_emailKey_idx" ON "CrmClient"("emailKey");

CREATE TABLE "CrmClientNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrmClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CrmClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CrmClientNote_clientId_createdAt_idx" ON "CrmClientNote"("clientId", "createdAt");

ALTER TABLE "Lead" ADD COLUMN "clientId" TEXT;
CREATE INDEX "Lead_clientId_idx" ON "Lead"("clientId");
