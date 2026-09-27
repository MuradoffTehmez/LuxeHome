-- Mərtəbə planları və 360° virtual tur (#107).

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "virtualTourUrl" TEXT;

-- CreateTable
CREATE TABLE "PropertyFloorPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyFloorPlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PropertyFloorPlan_propertyId_order_idx" ON "PropertyFloorPlan"("propertyId", "order");
