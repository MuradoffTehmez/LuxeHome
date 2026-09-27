-- Premium paketləri və ödəniş uçotu (#109).

-- CreateTable
CREATE TABLE "ListingPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PackageOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "userId" TEXT,
    "propertyId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "note" TEXT,
    "paidAt" DATETIME,
    "activatedAt" DATETIME,
    "cancelledAt" DATETIME,
    "refundedAt" DATETIME,
    "recordedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PackageOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ListingPackage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PackageOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PackageOrder_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PackageOrder_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ListingPackage_isActive_sortOrder_idx" ON "ListingPackage"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PackageOrder_status_createdAt_idx" ON "PackageOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PackageOrder_userId_createdAt_idx" ON "PackageOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PackageOrder_propertyId_idx" ON "PackageOrder"("propertyId");

-- CreateIndex
CREATE INDEX "PackageOrder_paidAt_idx" ON "PackageOrder"("paidAt");
