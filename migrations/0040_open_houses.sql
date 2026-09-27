-- Açıq qapı günləri və qeydiyyat (#109).

-- CreateTable
CREATE TABLE "OpenHouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "capacity" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenHouse_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpenHouseRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openHouseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "leadId" TEXT,
    "reminderSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpenHouseRegistration_openHouseId_fkey" FOREIGN KEY ("openHouseId") REFERENCES "OpenHouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OpenHouse_propertyId_startsAt_idx" ON "OpenHouse"("propertyId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpenHouseRegistration_openHouseId_phone_key" ON "OpenHouseRegistration"("openHouseId", "phone");
