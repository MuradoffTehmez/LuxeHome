-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "coverAlt" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT,
    "authorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "readMinutes" INTEGER NOT NULL DEFAULT 3,
    "publishedAt" DATETIME,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("authorId", "categoryId", "content", "coverAlt", "coverUrl", "createdAt", "deletedAt", "excerpt", "id", "isDemo", "metaDescription", "metaTitle", "publishedAt", "readMinutes", "slug", "status", "title", "updatedAt", "viewCount") SELECT "authorId", "categoryId", "content", "coverAlt", "coverUrl", "createdAt", "deletedAt", "excerpt", "id", "isDemo", "metaDescription", "metaTitle", "publishedAt", "readMinutes", "slug", "status", "title", "updatedAt", "viewCount" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");
CREATE INDEX "BlogPost_deletedAt_idx" ON "BlogPost"("deletedAt");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "projectType" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "cityId" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "startDate" DATETIME,
    "deliveryDate" DATETIME,
    "year" INTEGER,
    "totalArea" REAL,
    "floors" INTEGER,
    "unitCount" INTEGER,
    "highlights" TEXT,
    "timeline" TEXT,
    "coverUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Project_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("address", "cityId", "coverUrl", "createdAt", "deletedAt", "deliveryDate", "description", "floors", "highlights", "id", "isActive", "isDemo", "latitude", "longitude", "metaDescription", "metaTitle", "name", "order", "projectType", "slug", "startDate", "status", "summary", "timeline", "totalArea", "unitCount", "updatedAt", "year") SELECT "address", "cityId", "coverUrl", "createdAt", "deletedAt", "deliveryDate", "description", "floors", "highlights", "id", "isActive", "isDemo", "latitude", "longitude", "metaDescription", "metaTitle", "name", "order", "projectType", "slug", "startDate", "status", "summary", "timeline", "totalArea", "unitCount", "updatedAt", "year" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'SALE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "pricePeriod" TEXT,
    "typeId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "districtId" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "rooms" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" REAL,
    "landArea" REAL,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "renovation" TEXT,
    "documentStatus" TEXT,
    "videoUrl" TEXT,
    "buildingType" TEXT,
    "mortgageAvailable" BOOLEAN NOT NULL DEFAULT false,
    "installmentAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "authorId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "Property_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "PropertyType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Property_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "area", "authorId", "bathrooms", "bedrooms", "buildingType", "cityId", "createdAt", "currency", "deletedAt", "description", "districtId", "documentStatus", "floor", "id", "installmentAvailable", "isDemo", "isFeatured", "landArea", "latitude", "listingType", "longitude", "metaDescription", "metaTitle", "mortgageAvailable", "price", "pricePeriod", "projectId", "publishedAt", "renovation", "rooms", "slug", "status", "title", "totalFloors", "typeId", "updatedAt", "videoUrl", "viewCount") SELECT "address", "area", "authorId", "bathrooms", "bedrooms", "buildingType", "cityId", "createdAt", "currency", "deletedAt", "description", "districtId", "documentStatus", "floor", "id", "installmentAvailable", "isDemo", "isFeatured", "landArea", "latitude", "listingType", "longitude", "metaDescription", "metaTitle", "mortgageAvailable", "price", "pricePeriod", "projectId", "publishedAt", "renovation", "rooms", "slug", "status", "title", "totalFloors", "typeId", "updatedAt", "videoUrl", "viewCount" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
CREATE INDEX "Property_status_listingType_idx" ON "Property"("status", "listingType");
CREATE INDEX "Property_typeId_idx" ON "Property"("typeId");
CREATE INDEX "Property_cityId_idx" ON "Property"("cityId");
CREATE INDEX "Property_districtId_idx" ON "Property"("districtId");
CREATE INDEX "Property_price_idx" ON "Property"("price");
CREATE INDEX "Property_isFeatured_idx" ON "Property"("isFeatured");
CREATE INDEX "Property_deletedAt_idx" ON "Property"("deletedAt");
CREATE INDEX "Property_publishedAt_idx" ON "Property"("publishedAt");
CREATE INDEX "Property_authorId_idx" ON "Property"("authorId");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Building2',
    "imageUrl" TEXT,
    "bullets" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Service" ("bullets", "createdAt", "description", "icon", "id", "imageUrl", "isActive", "metaDescription", "metaTitle", "order", "shortDescription", "slug", "title", "updatedAt") SELECT "bullets", "createdAt", "description", "icon", "id", "imageUrl", "isActive", "metaDescription", "metaTitle", "order", "shortDescription", "slug", "title", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
