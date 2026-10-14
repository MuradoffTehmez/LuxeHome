-- Elan şikayəti və avtomatik moderasiya (#159):
--   * `ListingReport` — ziyarətçinin elan şikayəti və admin qərarı;
--   * `Property.riskScore` / `riskFlags` / `riskCheckedAt` — dərcdən əvvəl hesablanan
--     risk siqnalları (aşağı qiymət, mətndə əlaqə, başqa hesabın fotosu və s.).
-- Mövcud elanlar `riskScore = 0` ilə qalır; risk növbəti saxlamada hesablanır.

-- «Uğurlu sövdələşmələr» yalnız `closedAt`-a baxır. Köhnə SOLD/RENTED qeydlərində tarix boşdur;
-- bir dəfəlik doldurma `updatedAt` snapshot-ıdır — sonrakı baxışlar (`updatedAt`-ı dəyişən
-- sayğac) onu artıq yerindən oynatmır.
UPDATE "Property" SET "closedAt" = "updatedAt"
WHERE "status" IN ('SOLD', 'RENTED') AND "closedAt" IS NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "riskScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Property" ADD COLUMN "riskFlags" TEXT;
ALTER TABLE "Property" ADD COLUMN "riskCheckedAt" DATETIME;

-- CreateTable
CREATE TABLE "ListingReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT,
    "reporterUserId" TEXT,
    "reporterKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolutionNote" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingReport_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ListingReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ListingReport_status_createdAt_idx" ON "ListingReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ListingReport_propertyId_status_idx" ON "ListingReport"("propertyId", "status");

-- CreateIndex
CREATE INDEX "ListingReport_reporterKey_createdAt_idx" ON "ListingReport"("reporterKey", "createdAt");

-- CreateIndex
CREATE INDEX "Property_riskScore_idx" ON "Property"("riskScore");
