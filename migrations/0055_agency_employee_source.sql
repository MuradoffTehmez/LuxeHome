-- Agentlik komandasına qoşulma sorğusu: əməkdaş qeydiyyatda agentliyi özü seçə bilir.
-- `source` qeydin kimin təşəbbüsü ilə yarandığını saxlayır: INVITE — agentlik sahibi
-- dəvət edib (admin təsdiqləyir), REQUEST — agent qeydiyyatda sorğu göndərib
-- (agentlik sahibi və ya admin təsdiqləyir). Mövcud qeydlərin hamısı dəvətdir.

-- AlterTable
ALTER TABLE "AgencyEmployee" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'INVITE';
