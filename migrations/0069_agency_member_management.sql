-- Agentlərin idarə edilməsi: səlahiyyətlər və girişin dayandırılması (#218, PRD v2 7.2).

ALTER TABLE "AgencyEmployee" ADD COLUMN "permissions" TEXT;
ALTER TABLE "AgencyEmployee" ADD COLUMN "suspendedAt" DATETIME;
ALTER TABLE "AgencyEmployee" ADD COLUMN "suspendedReason" TEXT;
