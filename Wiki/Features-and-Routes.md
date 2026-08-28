# Funksiyalar və marşrutlar

`main@ed93ba4` snapshot-unda 71 `page.tsx` faylı, 28 Server Action faylı və 7 Route Handler mövcuddur. İstifadəçi səhifələri həmişə `/{locale}` prefiksi (`az`, `en`, `ru`) daşıyır; aşağıdakı public cədvəldə qısa yol göstərilir.

## İctimai sayt

| Marşrut | Funksiya | Data/render |
|---|---|---|
| `/` | Ana səhifə, seçilmiş elanlar, layihə/xidmət/bloq/tərəfdaş blokları | SSG + public cache |
| `/emlaklar` | Kataloq, URL filtrləri, sıralama, aktiv filtr nişanları, səhifələmə | `getProperties`, `getFilterOptions` |
| `/emlaklar/[slug]` | Elan detalı, qalereya, xəritə, agentlik nişanı, oxşar elanlar | Public predicate ilə D1 |
| `/layiheler` | Aktiv və real layihələrin siyahısı | D1 |
| `/layiheler/[slug]` | Layihə detalı və qalereya | D1 |
| `/agentlikler` | Təsdiqlənmiş agentlik kataloqu | Aktiv user + `isVerified` |
| `/agentlikler/[slug]` | Agentlik profili və public elanları | D1 |
| `/terefdaslar` | Public/rəsmi tərəfdaş kataloqu və tip filtri | Public partner predicate |
| `/terefdaslar/[slug]` | Çoxdilli tərəfdaş profili, əlaqəli elan/layihə və izlənən keçidlər | D1 + cache |
| `/xidmetler` | Aktiv xidmətlər | D1 |
| `/xidmetler/[slug]` | Xidmət detalı və JSON-LD | D1 |
| `/blog` | Kateqoriya, axtarış və səhifələmə | D1 |
| `/blog/[slug]` | Sanitizasiya olunmuş məqalə və əlaqəli yazılar | D1 |
| `/favoritler` | Brauzerdə saxlanan favoritlərin kartları | LocalStorage ID → Server Action |
| `/muqayise` | Ən çox 4 elanın yan-yana müqayisəsi | Cookie ID → Server Action |
| `/haqqimizda` | Şirkət və brend məlumatı | Statik |
| `/elaqe` | Əlaqə forması və şirkət rekvizitləri | Server Action → D1 + Resend |
| `/suallar` | FAQ və `FAQPage` struktur datası | Statik |
| `/mexfilik-siyaseti` | Məxfilik siyasəti | Statik |
| `/istifade-sertleri` | İstifadə şərtləri | Statik |
| `/cookie-siyaseti` | Cookie siyasəti | Statik |
| `/rayon/[slug]`, `/metro/[slug]` | Yerə görə indekslənən əmlak landing-i | D1 |
| `/[seoLanding]` | Satış/kirayə, tip və Bakı niyyətli SEO landing-ləri | D1 |
| `/[...slug]` | Aktiv 301/302 redirect və 404 hit qeydiyyatı | D1 |

### Əmlak kataloqu

Kataloq aşağıdakı imkanları dəstəkləyir:

- satış və kirayə;
- aylıq və günlük kirayə;
- əmlak növü, şəhər və rayon;
- mətn axtarışı;
- qiymət və sahə intervalı;
- otaq və mərtəbə intervalı;
- birinci/son mərtəbəni istisna etmə;
- təmir və sənəd statusu;
- yeni/köhnə tikili;
- yalnız şəkilli elanlar;
- çoxseçimli xüsusiyyət və ödəniş şərtləri;
- yeni, ucuz, baha, sahə və seçilmiş statusuna görə sıralama.

`5` otaq seçimi “5 və daha çox” kimi işləyir. `xususiyyet` query parametri təkrarlana bilər və bütün seçilən xüsusiyyətlərə sahib elanları tələb edir.

### Favorit axını

1. Kartdakı düymə əmlak ID-sini LocalStorage-də saxlayır.
2. `/favoritler` səhifəsi ID-ləri `fetchFavoriteProperties` action-ına göndərir.
3. Server yalnız public predicate-ə uyğun qalan qeydləri qaytarır.

Hesab tələb olunmur və cihazlararası sinxronizasiya yoxdur. Prisma `Favorite` modeli gələcək hesab əsaslı sinxronizasiya üçün mövcuddur, lakin hazırkı UI onu istifadə etmir.

### Müqayisə axını

1. İstifadəçi kart və ya detal səhifəsində müqayisə düyməsini seçir.
2. Client helper ID-ləri cookie-də saxlayır.
3. `MAX_COMPARE = 4` limiti həm client, həm server helper-larında tətbiq olunur.
4. `/muqayise` yalnız public elanları serverdən alıb qiymət, sahə və digər sahələri yan-yana göstərir.

## İctimai hesab və kabinet

### Giriş marşrutları

| Marşrut | Funksiya |
|---|---|
| `/qeydiyyat` | `USER`, `OWNER`, `AGENCY` qeydiyyatı |
| `/daxil-ol` | İctimai hesab girişi |
| `/kabinet` | Hesab xülasəsi |
| `/kabinet/profil` | Ad, telefon, agentlik məlumatı və parol |
| `/kabinet/elanlar` | Hesaba aid elanlar və statusları |
| `/kabinet/elanlar/yeni` | Mülk sahibi və agentlik üçün elan forması |
| `/kabinet/axtarislarim` | Filtri saxlama, tezlik və aktivlik idarəetməsi |
| `/kabinet/bildirisler` | Oxunmuş/oxunmamış bildirişlər |
| `/kabinet/son-baxilanlar` | Brauzer tarixçəsinə əsaslanan son elanlar |
| `/kabinet/komanda` | Agentlik sahibi üçün menecer/agent təsdiqi |

### Hesab növləri

| Hesab | Qeydiyyat | Elan yerləşdirmə | Admin panel |
|---|---:|---:|---:|
| `USER` | ✅ | ❌ | ❌ |
| `OWNER` | ✅ | ✅, təsdiq gözləyir | ❌ |
| `AGENCY` | ✅ | ✅ | ❌ |
| `STAFF` | Yalnız admin/bootstrap | Admin CRUD | ✅ |

İctimai hesabın `User.approvedAt` təsdiqi aktivlikdən ayrıdır. Agentlikdə bundan əlavə `Agency.isVerified` tələb olunur. Agentlik user-i profili olmadan qalıbsa admin panel profil yaradıb sonra təsdiqləyə bilir. Təsdiqlənməmiş agentliyin elanı `PENDING`, təsdiqlənmiş agentliyin yeni elanı `PUBLISHED` olur. Təsdiqi ləğv etmək əvvəl dərc edilmiş elanların statusunu avtomatik dəyişmir.

### İctimai elan göndərmə

Server aşağıdakı sərhədləri məcburi edir:

- yalnız `OWNER` və `AGENCY`;
- maksimum 20 şəkil;
- hər şəkil URL-si cari user-in `Media.uploaderId` dəyərinə aid olmalıdır;
- property type aktiv olmalıdır;
- city `CITY`, district/settlement/metro seçilən şəhərin child-ı olmalıdır;
- bütün feature ID-ləri mövcud olmalıdır;
- status, author, featured, project və SEO sahələri client-dən qəbul edilmir;
- relation yazısı uğursuz olarsa yarımçıq əmlak kompensasiya ilə silinir.

Hazırda kabinet elan yaratma və status izləmə verir; redaktə və silmə route-u yoxdur.

## Əməkdaş giriş axını

| Marşrut | Funksiya |
|---|---|
| `/giris` | E-poçt + parol, rate limit və lockout |
| `/giris/dogrulama` | TOTP və ya backup kod doğrulaması |
| `/giris/2fa-qurulumu` | İlk girişdə məcburi TOTP enrollment |
| `/admin/hesabim` | Parol, TOTP vəziyyəti və aktiv sessiyalar |

Əməkdaş girişi public `/daxil-ol` axınından ayrıdır. Düzgün staff parolu public login-də qəbul edilsə belə sessiya yaradılmır; istifadəçiyə panel girişindən istifadə etməsi bildirilir.

## Admin panel

| Marşrut | Əsas imkanlar | Permission |
|---|---|---|
| `/admin` | Dashboard statistikası və son qeydlər | Staff |
| `/admin/emlaklar` | Filtr, status, featured, soft-delete/restore | `property:manage` |
| `/admin/emlaklar/yeni` | Əmlak yaratma | `property:manage` |
| `/admin/emlaklar/[id]` | Tam redaktə və qalereya | `property:manage` |
| `/admin/layiheler` | Siyahı, filtr, soft-delete/restore | `project:manage` |
| `/admin/layiheler/yeni` | Layihə yaratma | `project:manage` |
| `/admin/layiheler/[id]` | Layihə və şəkillər | `project:manage` |
| `/admin/xidmetler` | Xidmət siyahısı və silmə | `service:manage` |
| `/admin/xidmetler/yeni` | Xidmət yaratma | `service:manage` |
| `/admin/xidmetler/[id]` | Xidmət redaktəsi | `service:manage` |
| `/admin/blog` | Yazı filtri, soft-delete/restore | `blog:manage` |
| `/admin/blog/yeni` | Bloq yazısı yaratma | `blog:manage` |
| `/admin/blog/[id]` | Rich-text redaktə | `blog:manage` |
| `/admin/blog/kateqoriyalar` | Kateqoriya CRUD | `blog:manage` |
| `/admin/muracietler` | Lead filtri və sürətli status | `lead:manage` |
| `/admin/muracietler/[id]` | Status, assignee, admin note və silmə | `lead:manage` |
| `/admin/media` | Upload, axtarış, alt mətn və silmə | `media:manage` |
| `/admin/istifadeciler` | Staff yaratma, rol/aktivlik, parol/2FA/session reset | `user:manage` |
| `/admin/moderation` | Pending elanlar, approve/reject və moderasiya qeydi | `property:manage` |
| `/admin/taksonomiya` | Əmlak tipi, yerləşmə və xüsusiyyətlər | uyğun manage permission |
| `/admin/agentlikler` | Profili çatışmayan AGENCY hesabı, profil yaratma və verification | `user:manage` |
| `/admin/hesablar` | İctimai hesab təsdiqi və ayrıca aktiv/deaktiv | `user:manage` |
| `/admin/terefdaslar` | Tərəfdaş CRUD, public görünürlük, müqavilə və entity əlaqələri | `partner:*` |
| `/admin/seo` | Route və metadata auditı | Staff |
| `/admin/redirects` | 301/302 və 404 hit idarəetməsi | `settings:manage` |
| `/admin/analitika` | Cloudflare GraphQL trafik metrikləri | Staff + token |
| `/admin/e-poct` | Resend e-poçt event metadata-sı | `lead:manage` |
| `/admin/security` | Login və sessiya təhlükəsizlik görünüşü | `user:manage` |
| `/admin/audit` | 12 sətirlik cədvəl, filtr və Super Admin sıfırlama | Staff / Super Admin reset |
| `/admin/hesabim` | Ad, telefon, avatar, locale, tema, parol, backup kod və sessiya | Staff |
| `/admin/parametrler` | Əlaqə, bildiriş və komanda runtime parametrləri | `settings:manage` |

### Rol matrisi

| Rol | İcazələr |
|---|---|
| `SUPER_ADMIN` | Bütün 16 permission, o cümlədən müqavilə və audit reset |
| `ADMIN` | Əsas kontent/CRM/media və müqavilə xaric tərəfdaş əməliyyatları |
| `EDITOR` | Bloq, media və tərəfdaşlara read-only baxış |

User, agentlik və settings idarəetməsi yalnız `SUPER_ADMIN`-ə açıqdır.

## Route Handler-lar

| Metod və marşrut | Məsuliyyət | Qoruma |
|---|---|---|
| `POST /api/admin/media` | Admin şəkil yükləmə və Media qeydi | `media:manage`, origin, rate limit |
| `POST /api/hesab/media` | Public elan şəkli yükləmə | `OWNER`/`AGENCY`, ownership, origin, rate limit |
| `GET /api/hesab/menu` | Cari hesab üçün header menu məlumatı | Optional public session |
| `GET /media/[...key]` | R2 obyektinin public delivery-si | Key parser və cache metadata |
| `POST /api/cron/saved-search-digest` | Daily/weekly axtarış uyğunluğu və digest | `CRON_SECRET` Bearer |
| `POST /api/webhooks/resend` | Resend/Svix event qəbulu | `RESEND_WEBHOOK_SECRET` imzası |
| `GET /llms.txt` | Maşın oxunaqlı public sayt xəritəsi | Public |

## Server Action inventarı

### İctimai

- əlaqə formu;
- favorit kartlarının serverdən alınması;
- qeydiyyat, giriş və çıxış;
- profil və parol yeniləmə;
- public elan yaratma;
- agentlik komandası, saxlanmış axtarış, bildiriş və son baxılanlar;
- müqayisə datasının alınması.

### Staff

- login, TOTP verification/enrollment və logout;
- əmlak, layihə, xidmət, bloq, kateqoriya CRUD;
- lead idarəetməsi;
- media alt mətni və silmə;
- staff user lifecycle;
- agentlik verification;
- ictimai hesab approval/activation;
- tərəfdaş və entity əlaqələri;
- audit reset, redirect, moderasiya, taksonomiya və security əməliyyatları;
- runtime settings;
- staff profili, avatar, backup kodu, parol və sessiyalar.

## SEO və sistem marşrutları

| Marşrut | Davranış |
|---|---|
| `/sitemap.xml` | Public əmlak, layihə, xidmət və bloq qeydlərini D1-dən yaradır |
| `/robots.txt` | Admin, staff login və favoritləri bloklayır; staging-də bütün saytı disallow edir |
| `not-found.tsx` | Brendli Azərbaycan dilli 404 |
| `error.tsx` | Brendli global xəta sərhədi |
| `forbidden.tsx` | Permission rəddi üçün 403 görünüşü |

Sitemap locale-lar üzrə public baza səhifələrini, SEO landing-ləri və D1-dən self-canonical əmlak, layihə, xidmət, bloq, agentlik və tərəfdaş detallarını yaradır. Kabinet, auth, admin, favorit və müqayisə indexlənmir. `robots.txt` və metadata eyni locale/canonical siyasətini izləyir.
