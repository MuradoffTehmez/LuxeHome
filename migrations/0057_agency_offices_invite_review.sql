-- Agentlik profilinin genişlənməsi (#157):
--   * örtük şəkli (`coverUrl`);
--   * dəvət linki — sahib yaradır, agent linklə birbaşa komandaya qoşulur (`inviteToken`);
--   * təsdiq mərkəzində rədd səbəbi — agentlik, agent profili və komanda sorğusu üçün;
--   * filiallar (`AgencyOffice`).
-- Hamısı istəyə bağlıdır; mövcud qeydlər dəyişmir.

-- AlterTable
ALTER TABLE "Agency" ADD COLUMN "coverUrl" TEXT;
ALTER TABLE "Agency" ADD COLUMN "inviteToken" TEXT;
ALTER TABLE "Agency" ADD COLUMN "inviteTokenCreatedAt" DATETIME;
ALTER TABLE "Agency" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "Agency" ADD COLUMN "rejectedAt" DATETIME;

-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "AgentProfile" ADD COLUMN "rejectedAt" DATETIME;

-- AlterTable
ALTER TABLE "AgencyEmployee" ADD COLUMN "decisionNote" TEXT;

-- CreateTable
CREATE TABLE "AgencyOffice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cityId" TEXT,
    "phone" TEXT,
    "workingHours" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgencyOffice_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgencyOffice_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgencyOffice_agencyId_order_idx" ON "AgencyOffice"("agencyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_inviteToken_key" ON "Agency"("inviteToken");

-- CreateIndex
CREATE INDEX "Agency_rejectedAt_idx" ON "Agency"("rejectedAt");
