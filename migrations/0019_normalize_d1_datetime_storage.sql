-- Prisma D1 DateTime dəyərlərini ISO-8601 mətn kimi yazır. Köhnə seed və
-- 0011 miqrasiyası Service tarixlərini integer millisekund kimi saxladığı üçün
-- ilk admin redaktəsindən sonra eyni sütunda qarışıq SQLite tipləri yaranırdı.
-- Adapter birinci sətrə əsasən mətn gözləyəndə sonrakı integer sətirdə bütün
-- ictimai xidmət sorğusu çökürdü.
UPDATE "Service"
SET "createdAt" = strftime('%Y-%m-%dT%H:%M:%fZ', "createdAt" / 1000.0, 'unixepoch')
WHERE typeof("createdAt") = 'integer';

UPDATE "Service"
SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', "updatedAt" / 1000.0, 'unixepoch')
WHERE typeof("updatedAt") = 'integer';

-- Setting sətrlərinin bəzisi də köhnə seed-dən integer kimi qalıb. Hazırda
-- sorğular updatedAt seçməsə də gələcək tam seçimlərdə eyni xəta yaranmasın.
UPDATE "Setting"
SET "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', "updatedAt" / 1000.0, 'unixepoch')
WHERE typeof("updatedAt") = 'integer';
