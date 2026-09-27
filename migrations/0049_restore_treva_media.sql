-- TREVA loqosu və örtük şəklini bərpa edir.
--
-- Tərəfdaş formasının saxlanması `parseImages()`-dən keçirdi və o, yalnız `/media/...`
-- ünvanlarını qəbul edir. Seed-dəki rəsmi kənar fayllar (`treva.realestate`) buna görə
-- ilk saxlamada səssizcə `null` olurdu: ana səhifədə və `/terefdaslar`-da loqo yerinə
-- boz ikon qalırdı. Action artıq mövcud kənar ünvanı saxlayır; bu miqrasiya isə yalnız
-- **boş** sahələri doldurur — redaktorun sonradan yüklədiyi loqoya toxunmur.
UPDATE "Partner"
SET "logoDark" = 'https://treva.realestate/cdn-assets/c06d6deb09-685d6b08f6dce7040049422e_treva-logo.svg'
WHERE "slug" = 'treva-real-estate'
  AND "logoUrl" IS NULL
  AND "logoLight" IS NULL
  AND "logoDark" IS NULL;

UPDATE "Partner"
SET "coverImage" = 'https://treva.realestate/images/treva-hero-bg.jpg'
WHERE "slug" = 'treva-real-estate'
  AND "coverImage" IS NULL;
