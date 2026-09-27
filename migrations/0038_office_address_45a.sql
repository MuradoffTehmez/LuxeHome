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

-- SERP → Local SEO formu `seo.local` JSON-unu oxuyur; orada köhnə ünvan qalıbsa
-- form onu göstərib təkrar yadda saxlayardı. Yalnız `address` sahəsi dəyişir.
UPDATE "Setting"
   SET "value" = json_set("value", '$.address', 'Əliyar Əliyev 45a, Nərimanov rayonu, Bakı AZ1005, Azərbaycan'),
       "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
 WHERE "key" = 'seo.local'
   AND json_valid("value") = 1
   AND json_extract("value", '$.address') LIKE '%109A%';

-- Ofisin xəritədəki yeri **cüt halında** yazılır: tam (hər ikisi dolu) cüt varsa
-- toxunulmur, yoxsa hər iki açar birlikdə yazılır. Ayrı-ayrı `INSERT OR IGNORE`
-- tək qalmış və ya boş açarla köhnə/yeni qarışıq cüt yarada bilərdi.
-- Tək ifadədir: SQLite hədəf cədvəli oxuyan INSERT…SELECT-i əvvəlcə tam hesablayır,
-- ona görə şərt hər iki sətir üçün eyni vəziyyətə baxır.
INSERT INTO "Setting" ("key", "value", "updatedAt")
SELECT "pair"."key", "pair"."value", strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  FROM (
    SELECT 'site.contact_latitude' AS "key", '40.4076723677061' AS "value"
    UNION ALL
    SELECT 'site.contact_longitude', '49.87432370341122'
  ) AS "pair"
 WHERE NOT EXISTS (
   SELECT 1
     FROM "Setting" AS "lat"
     JOIN "Setting" AS "lng" ON "lng"."key" = 'site.contact_longitude'
    WHERE "lat"."key" = 'site.contact_latitude'
      AND trim("lat"."value") <> ''
      AND trim("lng"."value") <> ''
 )
ON CONFLICT ("key") DO UPDATE SET "value" = excluded."value", "updatedAt" = excluded."updatedAt";
