-- Şirkət ünvanı Google Business Profile ilə eyniləşdirilir (#110):
-- «Əliyar Əliyev 109A, AZ1033» → «Əliyar Əliyev 45a, AZ1005».
-- Bu miqrasiya deploy zamanı GitHub Actions tərəfindən D1 bazasına avtomatik tətbiq olunur.

-- Paneldən yazılmış tam ünvan yalnız köhnə dəyərdirsə yenilənir — redaktorun
-- sonradan yazdığı başqa mətn üzərinə yazılmır.
UPDATE "Setting"
   SET "value" = 'Əliyar Əliyev 45a, Nərimanov rayonu, Bakı AZ1005, Azərbaycan',
       "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE "key" = 'site.contact_address' AND "value" LIKE '%109A%';

UPDATE "Setting"
   SET "value" = 'Əliyar Əliyev 45a',
       "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE "key" = 'contact.address' AND "value" LIKE '%109A%';

-- Ofisin xəritədəki yeri: dəyər yoxdursa yazılır, mövcud dəyərə toxunulmur.
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt")
VALUES ('site.contact_latitude', '40.4076723677061', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt")
VALUES ('site.contact_longitude', '49.87432370341122', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
