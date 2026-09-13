-- Texniki xidmət (maintenance) rejimini bağla və sistem rejimini NORMAL et.
-- Bu miqrasiya deploy zamanı GitHub Actions tərəfindən D1 bazasına avtomatik tətbiq olunur.
UPDATE "Setting"
   SET "value" = CASE
                   WHEN json_valid("value") = 1 THEN json_set("value", '$.mode', 'NORMAL')
                   ELSE '{"mode":"NORMAL","title":{"az":"","en":"","ru":""},"description":{"az":"","en":"","ru":""},"expectedBackAt":null,"startAt":null,"endAt":null,"superAdminBypass":true,"showCountdown":true,"updatedAt":null}'
                 END,
       "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE "key" = 'system.mode_config';
