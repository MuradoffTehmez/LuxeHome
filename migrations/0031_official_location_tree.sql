-- Yerləşmə ağacını Azərbaycanın rəsmi inzibati-ərazi bölgüsünə uyğunlaşdırır.
--
-- Mənbə: «İnzibati Ərazi Bölgüsü Təsnifatı, 2024» (Dövlət Statistika Komitəsi
-- kollegiyasının 16.02.2024 tarixli 2/2 nömrəli qərarı, Milli Məclisin Aparatı
-- ilə razılaşdırılıb) — https://e-qanun.az/framework/57325
--
-- Köhnə ağacda üç sistemli səhv var idi:
--   1. Abşeron rayonunun yaşayış məntəqələri Bakının rayonu kimi qeyd olunmuşdu
--      (`baki-novxani`), Xırdalan isə respublika tabeli şəhər kimi ayrıca durur
--      və Masazır/Digah onun «rayonları» sayılırdı.
--   2. Bir sıra şəhərdə uydurma «Mərkəz» rayonu yaradılmışdı — rəsmi təsnifatda
--      belə inzibati vahid yoxdur.
--   3. Rəsmi siyahıda olmayan qeydlər (Qriz, Həmzəli) rayon səviyyəsində idi.
--
-- Ağacın tam məzmunu `prisma/taxonomy.sql`-dən gəlir (669 qeyd), lakin CI yalnız
-- `migrations/` qovluğunu tətbiq edir. Ona görə bu miqrasiya **özü-yetərlidir**:
-- köçürmə üçün lazım olan hədəf sətirləri özü yaradır və `taxonomy.sql`-in nə
-- vaxt tətbiq olunmasından asılı deyil. ID konvensiyası eynidir (`loc_<slug>`),
-- ona görə sonradan gələn `taxonomy.sql` bu sətirləri təkrarlamır.
--
-- Hər addım idempotentdir — D1 tranzaksiya dəstəkləmir, ona görə miqrasiya
-- yarımçıq qalarsa təkrar işlədilə bilər.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- 0. Köçürmənin hədəfləri. `taxonomy.sql` ilə eyni id/slug/kind dəyərləri.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order")
VALUES ('loc_abseron','Abşeron','abseron','CITY',NULL,1110);

INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order")
VALUES ('loc_abseron-xirdalan','Xırdalan','abseron-xirdalan','SETTLEMENT',
        (SELECT "id" FROM "Location" WHERE "slug"='abseron'),80);

INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order")
VALUES ('loc_abseron-digah','Digah','abseron-digah','SETTLEMENT',
        (SELECT "id" FROM "Location" WHERE "slug"='abseron'),20);

INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order")
VALUES ('loc_abseron-masazir','Masazır','abseron-masazir','VILLAGE',
        (SELECT "id" FROM "Location" WHERE "slug"='abseron'),120);

INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order")
VALUES ('loc_abseron-novxani','Novxanı','abseron-novxani','VILLAGE',
        (SELECT "id" FROM "Location" WHERE "slug"='abseron'),140);

-- Metro adı «Nariman» → «Nəriman» düzəldiyi üçün slug dəyişir; yeni sətir
-- burada yaradılır ki, aşağıdakı köçürmə hədəfsiz qalmasın.
INSERT OR IGNORE INTO "Location" ("id","name","slug","kind","parentId","order")
VALUES ('loc_metro-neriman-nerimanov','Nəriman Nərimanov','metro-neriman-nerimanov','METRO',
        (SELECT "id" FROM "Location" WHERE "slug"='baki'),170);

-- ---------------------------------------------------------------------------
-- 1. Xırdalan: respublika tabeli şəhər deyil, Abşeron rayonunun şəhəridir.
--    Ona bağlı elanlar şəhər olaraq Abşerona, rayon olaraq Xırdalana keçir.
-- ---------------------------------------------------------------------------

UPDATE "Property"
SET "districtId" = COALESCE(
      "districtId",
      (SELECT "id" FROM "Location" WHERE "slug" = 'abseron-xirdalan')
    ),
    "cityId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron')
WHERE "cityId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'xirdalan')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'abseron');

UPDATE "Project"
SET "cityId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron')
WHERE "cityId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'xirdalan')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'abseron');

-- ---------------------------------------------------------------------------
-- 2. Abşeronun yaşayış məntəqələri Bakıdan/Xırdalandan öz rayonuna keçir.
--    Şəhər sahəsi də düzəlir: bu elanlar Bakıda deyil, Abşerondadır.
-- ---------------------------------------------------------------------------

UPDATE "Property"
SET "districtId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron-novxani'),
    "cityId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron')
WHERE "districtId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'baki-novxani')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'abseron-novxani');

UPDATE "Property"
SET "districtId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron-masazir'),
    "cityId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron')
WHERE "districtId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'xirdalan-masazir')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'abseron-masazir');

UPDATE "Property"
SET "districtId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron-digah'),
    "cityId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron')
WHERE "districtId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'xirdalan-digah')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'abseron-digah');

UPDATE "Property"
SET "districtId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron-xirdalan'),
    "cityId" = (SELECT "id" FROM "Location" WHERE "slug" = 'abseron')
WHERE "districtId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'xirdalan-merkez')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'abseron-xirdalan');

-- ---------------------------------------------------------------------------
-- 3. Uydurma «Mərkəz» rayonları: rəsmi təsnifatda yoxdur. Elan şəhər
--    səviyyəsində qalır, rayon əlaqəsi boşalır.
-- ---------------------------------------------------------------------------

UPDATE "Property"
SET "districtId" = NULL
WHERE "districtId" IN (
  SELECT "id" FROM "Location"
  WHERE "slug" IN ('sumqayit-merkez', 'qebele-merkez', 'seki-merkez', 'quba-merkez')
);

-- ---------------------------------------------------------------------------
-- 4. Rəsmi siyahıda olmayan qeydlər — elan öz şəhərində qalır.
-- ---------------------------------------------------------------------------

UPDATE "Property"
SET "districtId" = NULL
WHERE "districtId" IN (
  SELECT "id" FROM "Location" WHERE "slug" IN ('quba-qriz', 'qebele-hemzeli')
);

-- ---------------------------------------------------------------------------
-- 4b. Metro stansiyasının adı düzəlib: «Nariman Nərimanov» → «Nəriman
--     Nərimanov». Ad slug-a girdiyi üçün yeni sətir yarandı; elanlar köhnəsinə
--     bağlı qalmasın deyə köçürülür.
-- ---------------------------------------------------------------------------

UPDATE "Property"
SET "metroId" = (SELECT "id" FROM "Location" WHERE "slug" = 'metro-neriman-nerimanov')
WHERE "metroId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'metro-nariman-nerimanov')
  AND EXISTS (SELECT 1 FROM "Location" WHERE "slug" = 'metro-neriman-nerimanov');

DELETE FROM "NeighborhoodProfile"
WHERE "locationId" IN (SELECT "id" FROM "Location" WHERE "slug" = 'metro-nariman-nerimanov');

DELETE FROM "Location" WHERE "slug" = 'metro-nariman-nerimanov';

-- ---------------------------------------------------------------------------
-- 5. Rayon analitikası eyni qeydlərə bağlıdır — silinən sətirlə birlikdə
--    getməsin deyə əvvəlcə profil silinir (hesabat paneldən yenidən qurulur).
-- ---------------------------------------------------------------------------

DELETE FROM "NeighborhoodProfile"
WHERE "locationId" IN (
  SELECT "id" FROM "Location"
  WHERE "slug" IN (
    'baki-novxani', 'xirdalan', 'xirdalan-merkez', 'xirdalan-masazir',
    'xirdalan-digah', 'sumqayit-merkez', 'qebele-merkez', 'qebele-hemzeli',
    'seki-merkez', 'quba-merkez', 'quba-qriz'
  )
);

-- ---------------------------------------------------------------------------
-- 6. Köhnə qeydləri sil. `Property.districtId` və `Project.cityId`
--    `onDelete: SetNull` daşıyır, `Property.cityId` isə daşımır — ona görə
--    şəhər sətri yalnız heç bir elan qalmayanda silinir.
-- ---------------------------------------------------------------------------

DELETE FROM "Location"
WHERE "slug" IN (
  'baki-novxani', 'xirdalan-merkez', 'xirdalan-masazir', 'xirdalan-digah',
  'sumqayit-merkez', 'qebele-merkez', 'qebele-hemzeli', 'seki-merkez',
  'quba-merkez', 'quba-qriz'
);

DELETE FROM "Location"
WHERE "slug" = 'xirdalan'
  AND NOT EXISTS (SELECT 1 FROM "Property" WHERE "cityId" = "Location"."id");
