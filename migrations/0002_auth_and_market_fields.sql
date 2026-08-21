-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "revokedAt" DATETIME,
    "totpCounter" INTEGER,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackupCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "BackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "authorId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "Property_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "PropertyType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Property_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Property_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Property_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "area", "authorId", "bathrooms", "bedrooms", "cityId", "createdAt", "currency", "deletedAt", "description", "districtId", "documentStatus", "floor", "id", "isDemo", "isFeatured", "landArea", "latitude", "listingType", "longitude", "metaDescription", "metaTitle", "price", "pricePeriod", "projectId", "publishedAt", "renovation", "rooms", "slug", "status", "title", "totalFloors", "typeId", "updatedAt", "videoUrl", "viewCount") SELECT "address", "area", "authorId", "bathrooms", "bedrooms", "cityId", "createdAt", "currency", "deletedAt", "description", "districtId", "documentStatus", "floor", "id", "isDemo", "isFeatured", "landArea", "latitude", "listingType", "longitude", "metaDescription", "metaTitle", "price", "pricePeriod", "projectId", "publishedAt", "renovation", "rooms", "slug", "status", "title", "totalFloors", "typeId", "updatedAt", "videoUrl", "viewCount" FROM "Property";
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
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totpSecret" TEXT,
    "totpEnabledAt" DATETIME,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isActive", "lastLoginAt", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "email", "id", "isActive", "lastLoginAt", "name", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "BackupCode_userId_idx" ON "BackupCode"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");
