# Cari vəziyyət və yol xəritəsi

Bu səhifə 31 avqust 2026 tarixində `main` kod auditi, 89 test faylındakı 373 test və production deploy əsasında hazırlanıb. Prioritetlər faktiki boşluğu göstərir; buradakı maddə avtomatik olaraq təsdiqlənmiş məhsul planı demək deyil.

## Hazırlıq matrisi

| Sahə | Vəziyyət | Qeyd |
|---|---:|---|
| Production sayt | ✅ İşlək | Worker deploy `a88cf4ab-6a5e-4b84-a038-2a6c82f0ae92`; AZ/EN/RU public route-lar işləyir |
| Əmlak kataloqu | ✅ İşlək | Geniş filtr, sort, pagination, metro/rayon və detail |
| Xəritə | ✅ İşlək | Koordinatlı əmlak üçün Leaflet |
| Favorit | ✅ İşlək | LocalStorage və hesabla sinxronizasiya |
| Müqayisə | ✅ İşlək | Cookie, maksimum 4 əmlak |
| Layihə/xidmət/bloq | ✅ İşlək | Public read və permission əsaslı admin CRUD |
| Tərəfdaşlıq sistemi | ✅ İşlək | Public kataloq/detail, property/project/agency əlaqələri, görünüş və audit |
| Agentlik kataloqu | ✅ İşlək | Verification, public profil, əməkdaş heyəti və profil bərpası |
| Public auth | ✅ İşlək | Qeydiyyat, login, approval/activation və revoke edilə bilən sessiya |
| Public kabinet | ✅ İşlək | Profil, elan CRUD-u, saved search, rezervasiya, tövsiyə, bildiriş və son baxılanlar |
| Staff auth | ✅ İşlək | TOTP, backup code, lockout, session və permission guard |
| Admin panel | ✅ İşlək | Məzmun, CRM, hesab, agentlik, tərəfdaş, SEO, analitika, e-poçt və sistem idarəetməsi |
| Media | ✅ İşlək | Admin/public upload, R2, Images və thumbnail |
| Lead/əlaqə | ✅ İşlək | D1 + Resend, honeypot, same-origin və IP rate limit |
| SEO | ✅ İşlək | Metadata, schema-lar, hreflang, sitemap, robots, redirect və 404 monitorinqi |
| SERP ekosistemi | ✅ İşlək | İdarə olunan metadata/landing runtime-ı, entity schema mühərriki, sitemap index feed-ləri, açar söz/entity idarəsi, monitorinq/alert, Search Console və indeksləmə nəzarəti, link diaqnostikası |
| Bilik Mərkəzi | ✅ İşlək | Bələdçi, lüğət, CMS FAQ, kalkulyator, tərcümə və audit |
| AI | ✅ İşlək | Cloudflare Workers AI ilə public axtarış, Match Score və admin köməkçisi |
| Rezervasiya və agentlər | ✅ İşlək | Rezervasiya axını, agent kataloqu, profil və rəy moderasiyası |
| Web Push | ✅ İşlək | Abunə, kanal seçimləri və sakit saatlar |
| E-poçt əməliyyatları | 🟡 Konfiqurasiya | Admin jurnalı və imzalı webhook hazırdır; production Resend secret/endpoint tələb edir |
| Test | 🟡 Qismən | 89 fayl, 373 test; browser E2E və real remote D1 integration yoxdur |
| CI | ✅ İşlək | GitHub Actions `test + typecheck + lint + build` + miqrasiya drift yoxlaması |
| CD | 🟡 Qismən | Deploy hələ manualdır (`npm run deploy`); avtomatik yayım pipeline-ı yoxdur |
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

### SERP ekosistemi

- D1-də saxlanan SERP persistence modelləri və granular SEO icazələri;
- SERP siyasəti/validasiya primitivləri və slug redirect avtomatlaşdırması (zəncir rədd edilir);
- idarə olunan metadata mühərriki, entity schema və public route-larda tətbiqi;
- bazadan idarə olunan landing runtime-ı və nəzarətli landing menecceri;
- locale və entity üzrə sitemap index feed-ləri (`/sitemap-index.xml`, `/sitemaps/[feed]`);
- organik lead atribusiyası və hadisə jurnalı;
- semantik WebP watermark upload pipeline-ı;
- elan dərc bütövlüyü və saxlama (retention) qaydaları;
- 16 səhifəlik admin SERP mərkəzi: metadata/SERP preview, açar sözlər, entity-lər, landing-lər,
  audit kontenti və media iş siyahıları, monitorinq/alert, Search Console və indeksləmə,
  schema/sitemap və daxili link diaqnostikası, robots və lokal SEO parametrləri;
- `npm run test:seo:live` ilə production qəbul testi və Cloudflare crawler challenge təsnifatı.

### Real Estate Knowledge Hub

- `KnowledgeCategory`, `KnowledgeArticle`, `KnowledgeTerm` və `KnowledgeFaq` modelləri;
- public bələdçi kataloqu, hüquqi status səhifələri, lüğət və CMS FAQ;
- ipoteka/büdcə kalkulyatoru;
- `/suallar` (platforma) və `/bilik-merkezi/suallar` (hüquqi CMS) səthlərinin ayrılması;
- `Article` və `DefinedTerm` struktur datası, public keş və invalidasiya zənciri;
- tam admin CRUD-u, tərcümə axını, validasiya və audit;
- hüquqi araşdırmadan yaradılan **DRAFT** idxal paketi (redaktor təsdiqi olmadan PUBLISHED edilmir).

### Phase 2 ictimai imkanlar

- əmlak rezervasiya axını və admin/kabinet panelləri;
- ictimai agent kataloqu, agent profili və rəy moderasiyası;
- qiymət dəyişikliyi izləmə və alert sistemi;
- Web Push infrastrukturu, kanal seçimləri və sakit saatlar;
- fərdi tövsiyələr, əmlak sehrbazı və ana səhifə kəşf bölmələri;
- Cloudflare Workers AI inteqrasiyası: public AI axtarışı, Match Score və admin köməkçisi;
- ictimai imkanların paneldən idarəsi və müddət təmizləmə maintenance job-u.

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

### Browser E2E

GitHub Actions pipeline **qurulub və işləyir** (`.github/workflows/ci.yml`): `npm ci`, Vitest,
typecheck, lint, production build və `main` push-unda production miqrasiya drift yoxlaması.
Pipeline runner-in npm versiyasını `package.json` → `packageManager` dəyərindən pinləyir; bu addım
olmadan lock faylı formatı uyğunsuzluğu `npm ci`-ni sındırır (bax [[İnkişaf təlimatı|Development-Guide]]).

Qalan boşluq brauzer E2E-dir. Minimum axınlar:

- locale keçidi → search → detail → favorite/compare;
- public register/login → media → listing submit;
- saved search → uyğunluq → notification/digest;
- staff login → TOTP → permission;
- admin property/partner/agency CRUD;
- contact submit, honeypot və rate limit;
- Resend webhook imzası;
- staging noindex və production canonical/hreflang.

### Azərbaycan dilində axtarış normallaşdırması

**Həll olunub.** `0021_azerbaijani_search_normalization.sql` miqrasiyası, `src/lib/search-normalization.ts`
və `Property.searchText` / taksonomiya `searchName` sütunları registrsiz axtarışı təmin edir. Yeni
yazma axınlarında bu normallaşdırılmış sahələri doldurmaq qalan öhdəlikdir.

## P2 — məhsul yetkinliyi

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
