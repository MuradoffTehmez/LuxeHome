-- Tərəfdaş audit trail-i üçün əvvəlki/yeni dəyər snapshot-ları.
--
-- 0013 lokal və bəzi mühitlərdə artıq tətbiq oluna bildiyi üçün həmin migration
-- dəyişdirilmir. Yeni nullable sahələr ayrıca additiv migration-dadır.

ALTER TABLE "AuditLog" ADD COLUMN "oldValue" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "newValue" TEXT;
