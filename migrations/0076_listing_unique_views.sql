-- Elan performansı: unikal baxış (#236, PRD v2 11.3).
ALTER TABLE "PropertyDailyStat" ADD COLUMN "uniqueViews" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PropertyUniqueView" (
    "propertyId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    PRIMARY KEY ("propertyId", "day", "visitorKey")
);
CREATE INDEX "PropertyUniqueView_day_idx" ON "PropertyUniqueView"("day");
