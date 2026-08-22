# İctimai hesablar və elan göndərmə planı

## Məqsəd

Luxe Home Estate saytında adi istifadəçi, mülk sahibi və agentlik hesablarını işçi
admin hesablarından təhlükəsiz ayırmaq; qeydiyyat/giriş, qorunan kabinet və elan
göndərmə axınını Cloudflare D1 üzərində tamamlamaq.

## Qlobal məhdudiyyətlər

- İstifadəçiyə görünən mətn və şərhlər Azərbaycan dilində, identifikatorlar ingiliscədir.
- `role` yalnız staff RBAC üçündür; `accountType` hesabın növünü göstərir.
- `STAFF` yalnız `/giris` + məcburi 2FA ilə daxil olur; `/daxil-ol` staff sessiyası yaratmır.
- `/admin` həm layout/action guard səviyyəsində yalnız `STAFF` qəbul edir.
- `/kabinet` middleware imza yoxlaması ilə yanaşı hər server page/action-da D1 əsaslı guard istifadə edir.
- OWNER və təsdiqlənməmiş AGENCY elanları `PENDING`; təsdiqlənmiş AGENCY elanları `PUBLISHED` olur.
- İctimai action client-dən gələn `status`, `authorId`, `isFeatured` və `publishedAt` dəyərlərinə etibar etmir.
- İctimai əmlak oxunuşları mövcud `publicPropertyWhere()` qorumasından keçməlidir.
- Dark mode üçün `dark:` sinfi deyil, dizayn tokenləri istifadə olunur.
- D1 transaction yoxdur; yarımçıq qeydiyyat və media axınında kompensasiya/cleanup nəzərə alınır.
- Hər davranış dəyişikliyi TDD red-green dövrü ilə edilir.
- Keyfiyyət qapıları: `npm test`, `npm run typecheck`, `npm run build`, sonra brauzer preview smoke-test.

## Task 1 — Hesab foundation, qeydiyyat/giriş və kabinet

- Mövcud `0004_public_accounts.sql`, Prisma sxemi, account constants və session projection-u tamamla.
- `/qeydiyyat` səhifəsini yarat; `/daxil-ol` və qeydiyyatda təhlükəsiz `davam` yönləndirməsini saxla.
- Staff hesabının ictimai girişdən keçməməsini və public hesabın `/admin`-ə girməməsini testlə.
- `/kabinet` qorunan layout/səhifəsini yarat; hesab növü, agentlik təsdiqi və öz elanlarının xülasəsini göstər.
- Middleware-də `/kabinet` üçün yalnız ucuz cookie-imza qapısı qur; D1 guard serverdə qalır.
- Agentlik profili yaradılmasa yeni user sətrini kompensasiya olaraq sil.

## Task 2 — İctimai media və elan göndərmə

- Admin `ImageDropzone` komponentini upload endpoint propu ilə təkrar istifadə edilə bilən et; default admin endpoint dəyişməsin.
- `POST /api/hesab/media` yarat: `requireLister`, same-origin yoxlaması, upload limitləri, yalnız `emlaklar` qovluğu və uploader ownership.
- `/kabinet/elanlar/yeni` üçün məhdud forma yarat; admin-only sahələri göstərmə.
- Server action həmişə author-u sessiyadan, statusu hesab siyasətindən təyin et.
- OWNER/unverified AGENCY → `PENDING`; verified AGENCY → `PUBLISHED` və `publishedAt`.
- Şəkil URL-lərini mövcud parser/validator ilə saxla; uğursuz DB yazısında əlaqəsiz media qeydlərini təhlükəsiz buraxma siyasətini sənədləşdir.
- Kabinetdə istifadəçinin öz elanlarını status badge-ləri ilə göstər.

## Task 3 — 2FA kontrast və inteqrasiya yoxlamaları

- 2FA backup-code ekranındakı xəbərdarlıq mətnini semantik tokenlərlə oxunaqlı et.
- Auth/guard/status policy və property input testlərini tam işlə.
- `npm test`, `npm run typecheck`, `npm run build` qapılarını keç.
- Local OpenNext preview-də qeydiyyat → kabinet → elan göndərmə və admin elan forması smoke-test et.

## Task 4 — Miqrasiya və yayım

- `0004`-ü əvvəl staging D1-ə tətbiq et, staging deploy və smoke-test et.
- Additiv miqrasiyanı production D1-ə tətbiq et, sonra production deploy et.
- Production-da staff login/2FA, public registration/login, `/admin` və `/kabinet` ayrımı, elan status siyasətini smoke-test et.
- Git iş sahəsinin təmizliyini və commit tarixçəsini təsdiqlə.
