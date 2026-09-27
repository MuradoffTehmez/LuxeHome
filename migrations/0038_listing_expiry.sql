-- Sahib/agentlik elanlarının müddəti və yeniləmə (#109).

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "listingExpiresAt" DATETIME;
ALTER TABLE "Property" ADD COLUMN "expiryReminderSentAt" DATETIME;
ALTER TABLE "Property" ADD COLUMN "expiredAt" DATETIME;

-- CreateIndex
CREATE INDEX "Property_status_listingExpiresAt_idx" ON "Property"("status", "listingExpiresAt");
