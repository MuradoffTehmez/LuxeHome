# Cari vəziyyət və yol xəritəsi

Bu səhifə 28 avqust 2026 tarixində `main@ed93ba4` kod auditi, 81 test faylındakı 335 test və production smoke yoxlaması əsasında hazırlanıb. Prioritetlər faktiki boşluğu göstərir; buradakı maddə avtomatik olaraq təsdiqlənmiş məhsul planı demək deyil.

## Hazırlıq matrisi

| Sahə | Vəziyyət | Qeyd |
|---|---:|---|
| Production sayt | ✅ İşlək | Worker deploy `11ade039-1f72-4777-b1e7-33df3376aef9`; AZ/EN/RU public route-lar işləyir |
| Əmlak kataloqu | ✅ İşlək | Geniş filtr, sort, pagination, metro/rayon və detail |
| Xəritə | ✅ İşlək | Koordinatlı əmlak üçün Leaflet |
| Favorit | ✅ İşlək | LocalStorage; hesabla sync hələ yoxdur |
| Müqayisə | ✅ İşlək | Cookie, maksimum 4 əmlak |
| Layihə/xidmət/bloq | ✅ İşlək | Public read və permission əsaslı admin CRUD |
| Tərəfdaşlıq sistemi | ✅ İşlək | Public kataloq/detail, property/project/agency əlaqələri, görünüş və audit |
| Agentlik kataloqu | ✅ İşlək | Verification, public profil, əməkdaş heyəti və profil bərpası |
| Public auth | ✅ İşlək | Qeydiyyat, login, approval/activation və revoke edilə bilən sessiya |
| Public kabinet | 🟡 Qismən | Profil, elan yaratma, saved search, bildiriş və son baxılanlar; elan edit/delete yoxdur |
| Staff auth | ✅ İşlək | TOTP, backup code, lockout, session və permission guard |
| Admin panel | ✅ İşlək | Məzmun, CRM, hesab, agentlik, tərəfdaş, SEO, analitika, e-poçt və sistem idarəetməsi |
| Media | ✅ İşlək | Admin/public upload, R2, Images və thumbnail |
| Lead/əlaqə | ✅ İşlək | D1 + Resend, honeypot, same-origin və IP rate limit |
| SEO | ✅ İşlək | Metadata, schema-lar, hreflang, sitemap, robots, redirect və 404 monitorinqi |
| E-poçt əməliyyatları | 🟡 Konfiqurasiya | Admin jurnalı və imzalı webhook hazırdır; production Resend secret/endpoint tələb edir |
| Test | 🟡 Qismən | 81 fayl, 335 test; browser E2E və real remote D1 integration yoxdur |
| CI/CD | 🔴 Yoxdur | Manual quality gate və deploy |
| Backup/DR | 🔴 Yoxdur | Avtomatlaşdırılmış export/restore drill yoxdur |
| Çoxdillilik | ✅ İşlək | Public AZ/EN/RU, locale-prefiksli URL və alternates |

## Son tamamlanan mərhələlər

### Lokalizasiya və SEO

- public səhifələr üçün məcburi `/az`, `/en`, `/ru` prefiksi;
- locale dəyişdirici, message kataloqları və lokalizə edilmiş metadata;
- canonical, Open Graph, Twitter və hreflang alternates;
- `RealEstateAgent`, property, project, service, article, FAQ, breadcrumb, partner və website JSON-LD;
- çoxdilli sitemap, robots, `llms.txt`, redirect və 404 hit idarəetməsi;
- Cloudflare trafik/Search Analytics admin görünüşü.

### Staff auth və admin əməliyyatları

- PBKDF2 parol, məcburi TOTP, backup kod və lockout;
- D1 sessiyası, ayrıca public/staff auth növü və permission guard;
- əmlak, layihə, xidmət, bloq, kateqoriya, lead, media və setting idarəetməsi;
- public hesab approval/activation və agency verification/recovery;
- lead üçün sürətli status dəyişməsi;
- cədvəl/səhifələmə əsaslı audit jurnalı və yalnız Super Admin üçün sıfırlama;
- staff profil şəkli, ad, telefon, locale, tema və backup code regenerasiyası;
- runtime əlaqə məlumatları və default tema parametrinin paneldən idarəsi;
- korporativ e-poçt jurnalı, Resend webhook və notification parametrləri.

### Public kabinet və bildirişlər

- `USER`, `OWNER`, `AGENCY` qeydiyyatı və təsdiq vəziyyəti;
- profil və qorunan media upload;
- owner/agency property submission və moderation statusu;
- saved search yaratma, redaktə, silmə və uyğunluq izləmə;
- gündəlik/həftəlik digest üçün ayrıca scheduled Worker;
- kabinet bildirişləri və son baxılan əmlaklar;
- agency əməkdaşlarının dəvət və idarə edilməsi.

### Rəsmi tərəfdaşlıq sistemi

- partner CRUD, verification, status və public görünüşün ayrıca idarəsi;
- public kataloq və SEO detail səhifəsi;
- əmlak, layihə və agentliklərlə many-to-many əlaqələr;
- layihə tərəfdaşı source URL-i və əlaqə metadata-sı;
- public görünüş üçün `ACTIVE + verified + officialPartner + showPublicly + deletedAt=null` qaydası;
- partner dəyişikliklərinin audit snapshot-ları.

### Cloudflare-native deployment

- OpenNext Worker build və production/staging izolyasiyası;
- Prisma D1 adapter və WASM runtime;
- D1, R2, Cloudflare Images, incremental cache və D1 tag cache;
- custom domain, staging noindex və server-side revalidation;
- saved-search üçün ayrıca cron Worker;
- qarışıq D1 tarix formatını normallaşdıran `0019` miqrasiyası.

## P0 — production riskinin azaldılması

### Backup və bərpa

**Mövcud:** migration və deploy manual idarə olunur; avtomatlaşdırılmış D1 export, R2 inventory və restore drill yoxdur.

**Hədəf:** planlı D1 export, retention siyasəti, RPO/RTO, R2 inventory/lifecycle, ayrıca şifrəli backup və dövri restore testi.

### E-poçt və cron əməliyyat təsdiqi

**Mövcud:** imzalı Resend webhook, `EmailActivity`, qorunan digest endpoint və cron Worker kodu hazırdır.

**Hədəf:** production `RESEND_WEBHOOK_SECRET` və endpoint abunəliyini təsdiqləmək, əsas və cron Worker üçün eyni `CRON_SECRET` qurmaq, delivery/digest uğursuzluqlarına alert və runbook əlavə etmək.

## P1 — əsas məhsul boşluqları

### Public elan lifecycle

Public user yeni elan yaradır və statusu izləyir. Hələ lazımdır:

- yalnız sahibinə açıq edit;
- statusa görə redaktə qaydası;
- soft-delete və yenidən göndərmə;
- rədd səbəbinin kabinetdə aydın göstərilməsi;
- şəkil orphan cleanup siyasəti;
- agency verification dəyişəndə mövcud elanların davranış qərarı.

### Public hesab bərpası və məlumat hüquqları

- e-poçt verification;
- “parolu unutdum” token axını;
- e-poçt dəyişmə təsdiqi;
- optional public 2FA;
- hesab silmə və data export tələbi.

### CI və browser E2E

GitHub Actions pipeline üçün minimum qapı:

1. `npm ci`;
2. typecheck;
3. lint;
4. Vitest;
5. production build;
6. migration drift yoxlaması.

Browser E2E minimum axınları:

- locale keçidi → search → detail → favorite/compare;
- public register/login → media → listing submit;
- saved search → uyğunluq → notification/digest;
- staff login → TOTP → permission;
- admin property/partner/agency CRUD;
- contact submit, honeypot və rate limit;
- Resend webhook imzası;
- staging noindex və production canonical/hreflang.

### Azərbaycan dilində axtarış normallaşdırması

SQLite/D1 `LIKE` ə, ş, ç, ğ, ı, ö, ü hərflərində hər zaman etibarlı registrsiz nəticə vermir. Uzunmüddətli həll yazı zamanı yenilənən normallaşdırılmış search text/sütun və həmin sahə üzrə indeksdir.

## P2 — məhsul yetkinliyi

### Hesab əsaslı favorit

Prisma `Favorite` modeli var, UI LocalStorage istifadə edir. Login zamanı lokal favoritləri hesaba birləşdirən sync axını əlavə oluna bilər.

### Tərcümə və kontent idarəetməsi

Route və interfeys AZ/EN/RU işləyir. Növbəti mərhələdə admin tərəfindən daxil edilən property, project, service, blog və partner məzmunu üçün strukturlaşdırılmış tərcümə sahələri, fallback qaydası və locale parity audit-i lazımdır.

### Anti-spam və abuse müdafiəsinin genişləndirilməsi

Əlaqə formunda honeypot, same-origin və rate limit aktivdir. Risk artarsa Turnstile server verification, risk siqnalı və şəxsi məlumat saxlamayan abuse metrikası əlavə edilə bilər.

### Observability və analitika

- error tracking və alert;
- strukturlaşdırılmış log korrelyasiyası;
- Core Web Vitals monitorinqi;
- e-poçt delivery və cron digest alert-ləri;
- audit jurnalında anomaliya siqnalları.

### Kontent və hüquqi təsdiq

- hüquqi səhifələrin hüquqşünas yoxlaması;
- `siteConfig.geo` koordinatının və iş saatlarının təsdiqi;
- real şirkət foto arxivi;
- xidmət və FAQ iddialarının əməliyyat təsdiqi;
- Resend sender domain doğrulaması;
- AZ/EN/RU kontent parity və terminologiya redaktəsi.

### UX və performans

- browser əsaslı tam accessibility və responsive regressiya testi;
- public listing edit UX;
- media orphan cleanup;
- uzun filter URL-ləri üçün round-trip E2E;
- xəritə bundle və Core Web Vitals ölçümü;
- comparison/favorite üçün hesab sync qərarı.

## Bilinən əməliyyat qeydləri

- Cloudflare Managed Content/Bot qaydası default CLI User-Agent ilə bəzi HTML route-larına 403 verə bilər; browser tipli User-Agent ilə ayrıca yoxlanmalıdır.
- Admin locale-siz `/admin` marşrutundadır; `/{locale}/admin/...` canonical `/admin/...` ünvanına 308 qaytarır.
- `AUTH_SECRET` rotasiyası versiyalı deyil və TOTP secret encryption-a təsir edir.
- Cloudflare Images çevirməsi uğursuz olarsa original image fallback yazıla bilər.
- D1 interactive transaction olmayan axınlar tətbiq səviyyəli kompensasiya istifadə edir.
- Prisma `DateTime` sahələri D1-də ISO-8601 mətn olmalıdır; Unix integer ilə qarışdırılmamalıdır.
- Demo content public query-də bloklansa da admin təmizləmə üçün görə bilər.

## Tamamlanma meyarı

Bir roadmap maddəsi yalnız aşağıdakılar olduqda tamamlanmış sayılır:

- davranış source-da mövcuddur;
- auth/data sərhədi serverdə qorunur;
- uyğun unit/integration/E2E test əlavə edilib;
- typecheck, lint, test və build keçir;
- staging smoke test keçir;
- README/Wiki/SECURITY təsirlənirsə yenilənib;
- migration/deploy/rollback qeydi mövcuddur;
- production davranışı ayrıca yoxlanıb.

## Sənədləşdirmə borcu qaydası

Yeni route, model, permission, npm script, binding və security davranışı eyni pull request-də sənədləşdirilməlidir. Wiki-ni faktiki koddan üstün həqiqət mənbəyi saymaq olmaz; ziddiyyətdə source qalibdir və sənəd düzəldilməlidir.
