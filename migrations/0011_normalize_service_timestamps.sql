-- Köhnə `services-add.sql` D1 DATETIME sahələrinə mətn yazırdı. Prisma D1
-- adapteri DateTime üçün Unix millisecond integer gözləyir; yalnız legacy mətn
-- sətirlərini eyni anı saxlayan integer formata çeviririk.
UPDATE "Service"
SET "createdAt" = unixepoch("createdAt") * 1000
WHERE typeof("createdAt") = 'text';

UPDATE "Service"
SET "updatedAt" = unixepoch("updatedAt") * 1000
WHERE typeof("updatedAt") = 'text';
