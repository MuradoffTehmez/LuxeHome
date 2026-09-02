# LuxeHomeEstate — tam layihə və GitHub governance auditi

**Tarix:** 2 sentyabr 2026  
**Kod bazası:** `main` üzərindən yaradılmış `chore/19-github-governance`  
**Əhatə:** tətbiq arxitekturası, admin/public data axını, Prisma modelləri, Server Action-lar,
ölü kod ehtimalları, test/build, GitHub repository faylları və canlı GitHub parametrləri.

## İcraçı xülasə

Repository production-a çıxan real və geniş platformadır; skeleton və ya yalnız təqdimat
frontend-i deyil. Production build 136 route yaradır, 60 Prisma modeli tətbiq kodunda istifadə
olunur, 62 admin səhifəsi və 58 locale əsaslı səhifə mövcuddur. Əsas biznes modelləri üçün
admin → D1 → public sayt zənciri qurulub.

Yeni auditdə **kritik və yüksək səviyyəli açıq kod xətası tapılmadı**. Əvvəlki ayrıca
kibertəhlükəsizlik auditindəki 11 tapıntının hamısı artıq bağlanıb. Cari açıq nəticə:

- 3 orta prioritetli correctness/product borcu;
- 5 aşağı prioritetli maintainability və məhsul tamamlama işi;
- GitHub UI-da merge-dən sonra tamamlanmalı 8 idarəetmə parametri.

“Hər şey işləyir” nəticəsi yalnız source-a baxmaqla verilməyib: typecheck, lint, 474 test,
production build, YAML parse və dependency audit faktiki işlədilib. Bununla belə canlı admin
hesabı ilə hər CRUD-un production məlumatına yazılması bu auditə daxil edilməyib; belə test
real məlumatı dəyişdirə bilər və ayrıca staging acceptance ssenarisi tələb edir.

## Ölçülən repository səthi

| Ölçü | Nəticə |
|---|---:|
| `src/` TypeScript/TSX faylı | 582 |
| Prisma modeli | 60 |
| D1 miqrasiya faylı | 28 |
| Admin `page.tsx` | 62 |
| Locale əsaslı `page.tsx` | 58 |
| Route Handler | 16 |
| `"use server"` faylı | 45 |
| Server Action ixracı | 151 |
| Vitest faylı / test | 102 / 474 |
| Playwright spec / statik `test()` deklarasiyası | 12 / 120 |
| Audit başlanğıcındakı commit sayı | 463 |

Playwright matrisi müxtəlif brauzer/viewport layihələrinə görə 120 deklarasiyadan 190-dan çox
icra yaradır. Staging E2E public axınları və admin giriş qorumasını yoxlayır; autentifikasiyalı
admin CRUD acceptance dəsti hələ yoxdur.

## Admin → backend → public sayt xəritəsi

| Domen | Admin səthi | Public/kabinet səthi | Nəticə |
|---|---|---|---|
| Əmlak, şəkil, taksonomiya | Əmlak CRUD, moderasiya, media, taksonomiya | Kataloq, filtr, detal, xəritə, müqayisə, favorit | Bağlıdır |
| Layihələr | Layihə və şəkil CRUD-u, tərəfdaş əlaqəsi | Layihə kataloqu və detalı | Bağlıdır |
| Xidmətlər | Xidmət CRUD-u | Xidmət siyahısı və detalı | Bağlıdır |
| Bloq | Yazı və kateqoriya CRUD-u | Bloq siyahısı, detal, SEO | Bağlıdır |
| Bilik Mərkəzi | Məqalə, kateqoriya, termin, FAQ CRUD-u | Bələdçi, lüğət, hüquqi FAQ | Bağlıdır |
| Agentlik və agent | Təsdiq, profil, rəy, testimonial | Agentlik/agent kataloqu, profil və rəylər | Bağlıdır |
| Tərəfdaş | CRUD, müqavilə metadata-sı, əlaqələr | Kataloq, profil və əlaqəli entity-lər | Bağlıdır |
| Lead və rezervasiya | Müraciət və rezervasiya idarəsi | Əlaqə forması, əmlak rezervasiyası, kabinet | Bağlıdır |
| Hesab və bildiriş | Hesab təsdiqi, təhlükəsizlik, sessiya görünüşü | Profil, komanda, favorit, saved search, notification | Bağlıdır |
| SEO/SERP | Metadata, landing, redirect, schema, sitemap, robots, GSC | Canonical, hreflang, JSON-LD, sitemap, redirect runtime | Bağlıdır |
| Analitika və e-poçt | Web Vital/client error və Resend hadisələri | API/webhook telemetry mənbələri | Admin-only olması düzgündür |
| Audit və AI draft | Audit jurnalı, AI qaralama approval-u | Birbaşa public CRUD deyil; təsdiqdən sonra entity-də görünür | Dizayna uyğundur |

Admin panelində “dəyişdi, amma saytda görünmədi” sinfində ümumi memarlıq qırığı tapılmadı.
Public görünürlük status, `deletedAt`, `isDemo`, locale tərcüməsi və indekslənmə qaydalarından
keçir; buna görə DRAFT, silinmiş və demo qeydinin production-da görünməməsi xəta deyil.

## 60 Prisma modelinin səth yoxlaması

| Model qrupu | Modellər | İstifadə və görünürlük |
|---|---|---|
| Kimlik və auth | `User`, `EmailVerificationToken`, `PasswordResetToken`, `Session`, `BackupCode`, `LoginAttempt` | Giriş/qeydiyyat/2FA/sessiya axınları; session və login hadisələri admin security-də görünür, token cədvəllərinin ayrıca CRUD-u qəsdən yoxdur. |
| Agentlik | `Agency`, `AgencyEmployee`, `AgentProfile`, `AgentReview`, `Testimonial` | Admin təsdiq/CRUD və public agentlik-agent profillərinə bağlıdır. |
| Telemetry | `ClientErrorEvent`, `WebVitalMetric` | Monitorinq endpoint-ləri yazır, admin analitika oxuyur. |
| Tərcümə | `ContentTranslation` | Admin translation manager yazır; public sorğu/SEO locale override kimi oxuyur. |
| Əmlak | `PropertyType`, `Location`, `Feature`, `PropertyFeature`, `Property`, `PropertyImage` | Admin/taksonomiya/kabinet yazır; public axtarış, kart, detal və sitemap oxuyur. |
| Layihə | `Project`, `ProjectImage` | Admin CRUD yazır; public layihə kataloqu və detalı oxuyur. |
| Xidmət və bloq | `Service`, `BlogCategory`, `BlogPost` | Admin CMS yazır; public siyahı/detal və SEO oxuyur. |
| CRM | `Lead` | Əlaqə forması yazır; admin status, assignee və qeyd idarə edir. |
| Şəxsi məhsul | `Favorite`, `SavedSearch`, `SavedSearchMatch`, `Notification`, `PushSubscription`, `NotificationPreference` | API/kabinet/cron və notification xidmətləri ilə tam bağlıdır. |
| Qiymət | `PropertyPriceHistory` | Qiymət dəyişəndə yazılır və endirim bildirişi yaradır; tarixçənin öz qrafiki UI-da yoxdur. |
| Rayon və obyektlər | `NeighborhoodProfile`, `NearbyPlace` | Admin public-imkanlar paneli yazır; rayon/əmlak public səthləri oxuyur. |
| Rezervasiya | `Reservation`, `ReservationEvent` | Əmlak detalı, kabinet və admin rezervasiya səhifəsi arasında bağlıdır. |
| AI | `AiContentDraft` | Admin AI köməkçisində qaralama, apply və reject axını var. |
| Media | `Media` | Admin/kabinet upload route-ları və public media delivery ilə bağlıdır. |
| Sistem | `Setting`, `AuditLog`, `EmailActivity`, `DomainEvent` | Setting public runtime-a, audit/e-poçt adminə bağlıdır; `DomainEvent` hazırda yalnız yazılan gələcək outbox mənbəyidir. |
| URL idarəsi | `Redirect`, `NotFoundHit` | Admin redirect/404 paneli və public catch-all route arasında bağlıdır. |
| Tərəfdaş | `Partner`, `PropertyPartner`, `ProjectPartner`, `AgencyPartner` | Admin relation manager yazır; public profillər və entity əlaqələri oxuyur. |
| Bilik | `KnowledgeCategory`, `KnowledgeArticle`, `KnowledgeTerm`, `KnowledgeFaq` | Admin CMS, public Knowledge Hub, sitemap və struktur data ilə bağlıdır. |
| SERP | `SeoMetadata`, `SeoLandingPage`, `SeoKeyword`, `EntityProfile`, `SeoAuditIssue`, `SeoSearchMetric`, `SeoAlert` | Admin SERP mərkəzi idarə edir; uyğun hissələr public metadata/landing/schema/sitemap runtime-ına gedir. GSC metric/alert-lərin public görünməməsi düzgündür. |

Nəticə: bütün 60 model üçün tətbiq kodunda real oxu və ya yazı izi var. Hər model üçün ayrıca
admin CRUD tələb olunmur; join, token, sessiya, telemetry və hadisə modellərinin xidmət və ya
aggregate UI arxasında qalması normaldır.

## Açıq tapıntılar

### A-01 — Üç Server Action heç bir UI və ya cron tərəfindən çağırılmır — Orta

- `src/app/admin/emlaklar/actions.ts` — `setPropertyStatus()`;
- `src/app/admin/emlaklar/actions.ts` — `togglePropertyFeatured()`;
- `src/app/admin/terefdaslar/actions.ts` — `expireOverduePartners()`.

151 ixracın statik referens xəritəsində yalnız bu üçü təkcə öz tərifində göründü. İlk iki
funksiyanın davranışı ümumi redaktə forması ilə qismən təkrarlanır və ölü kod ola bilər.
Üçüncünün çağırılmaması daha vacibdir: vaxtı keçmiş tərəfdaşların avtomatik status yeniləməsi
adından göründüyü halda onu işlədən schedule yoxdur.

**Tövsiyə:** ilk ikisini silmək və ya siyahıdakı quick action-a bağlamaq barədə qərar ver;
`expireOverduePartners()` üçün isə idempotent cron/maintenance çağırışı və test əlavə et.

### A-02 — Admin lokallaşdırması tam deyil — Orta

Admin tərcümə infrastrukturu və AZ/EN/RU kataloq parity testi düzgündür, amma raw JSX mətnini
tutmur. Qalan nümunələr:

- security səhifəsində AZ təsvirlər və `aktiv sessiya` suffix-i;
- e-poçt səhifəsində `aktiv`, webhook statusu və izah mətni;
- blog/layihə səhifəsində `Zibil qutusu`;
- SERP səhifələrində `asset`, `entity`, `chain`, `alert`, `problem`, media problem səbəbləri;
- bəzi delete/deactivate düymə mətnləri və admin loading screen-reader mətni.

Bu, AZ istifadəçidə əsas funksiyanı qırmır, amma EN/RU panelində qarışıq dil yaradır və “panel
tam üçdillidir” qəbul meyarını pozur.

**Tövsiyə:** raw user-facing literal aşkarlayan AST əsaslı test/lint qaydası əlavə et, sonra
qalan mətnləri `admin.json` kataloqlarına köçür.

### A-03 — Self-service hesab silinməsi D1-də atomik deyil — Orta

`deleteAccount()` əvvəl istifadəçinin elanlarını arxivləyir, sonra `User` qeydini silir. D1
transaction dəstəkləmədiyi üçün ikinci əməliyyat uğursuz olarsa hesab aktiv qala, elanlar isə
artıq gizlənə bilər. Cari kod xəta qaytarır, amma əvvəlki addımı bərpa etmir.

**Tövsiyə:** idempotent deletion state/job modeli, yaxud kompensasiya addımı qur; ayrıca
integration testi ikinci əməliyyatın süni uğursuzluğunu yoxlasın.

### A-04 — `/admin/seo` naviqasiyadan kənar paralel legacy route-dur — Aşağı

Aktiv admin menyusu `/admin/serp/*` ağacını göstərir. `/admin/seo` yalnız öz daxilində özünə
link verir və köhnə audit sənədindən başqa repository-də giriş nöqtəsi yoxdur. Funksiya build-ə
daxildir, amma discoverable deyil və SERP audit/content səhifələri ilə məsuliyyəti təkrarlayır.

**Tövsiyə:** dəyərli metrikləri SERP mərkəzinə köçürüb route-u redirect/deprecate et və ya onu
naviqasiyada şüurlu şəkildə göstər.

### A-05 — Qiymət tarixçəsi backend-dədir, UI-da görünmür — Aşağı / məhsul

`PropertyPriceHistory` hər qiymət dəyişikliyini saxlayır və qiymət enişi bildirişi yaradır.
Admin və public əmlak detalında zaman üzrə qiymət tarixçəsi yoxdur.

**Tövsiyə:** admin audit bloku və yalnız kifayət qədər nöqtə olduqda public qiymət qrafiki əlavə
et; dəyişiklik edən istifadəçi və mənbə yalnız səlahiyyətli paneldə göstərilsin.

### A-06 — `DomainEvent` write-only outbox-dur — Aşağı / əməliyyat

Model və yazıcı var, amma consumer, retry/dead-letter, admin görünüşü və retention yoxdur.
Şərhlərdə gələcək notification/analytics mənbəyi kimi nəzərdə tutulduğu üçün bu, hazırda ölü
model deyil; natamam infrastruktur sərhədidir.

**Tövsiyə:** real subscriber yaranana qədər retention/cleanup job-u əlavə et və ya hadisə
həcmini dashboard-da izlənən aggregate et.

### A-07 — Domen statusları bəzi production sorğularında hardcode edilir — Aşağı

`constants.ts` authoritative mənbə olsa da `"PUBLISHED"`, `"APPROVED"`, `"NEW"`, `"SOLD"`
və `"RENTED"` bir neçə public/admin sorğusunda birbaşa yazılıb. Cari dəyərlər düzgündür, ona
görə runtime bug yoxdur; gələcək status dəyişikliyində səssiz drift riski yaradır.

**Tövsiyə:** test fixture-lər istisna olmaqla production kodunu uyğun `*_STATUSES` sabitlərinə
keçir və literal statusları qadağan edən sadə lint/AST yoxlaması qur.

### A-08 — Ölü export səthi CI-da ölçülmür — Aşağı

Knip production analizi framework/test entrypoint-ləri səbəbindən konfiqurasiyasız halda false
positive verir, amma statik referenslə təsdiqlənən əlavə namizədlər var: `PropertyRow`,
`ConfirmModal`, `NoResultsState`, `useAdminFormState`, `sendShowcaseEmail`,
`paymentFlagsFromSlugs`, `settingSchema`. Bəzi başqa nəticələr daxilən istifadə olunan, sadəcə
lazımsız `export` edilmiş simvollardır; avtomatik silinməməlidir.

**Tövsiyə:** layihəyə uyğun Knip entry/ignore konfiqurasiyası əlavə et, əvvəl baseline-i manual
triage et, sonra yalnız yeni ölü fayl/export artımını CI-da blokla.

## Məhsul səviyyəli açıq imkanlar

- moderatorun kabinet elanındakı koordinatı xəritədə preview etməsi;
- production deploy-dan sonra ayrıca minimal browser smoke;
- ümumi statik səhifə/homepage blokları üçün CMS;
- Finance/CRM paket və ödəniş strukturu;
- embedding/vector əsaslı həqiqi semantik axtarış, chatbot və map-draw search;
- D1 backup/restore drill-i və xarici xidmətlərin əməliyyat monitorinqi.

## GitHub auditinin nəticəsi

### Repository-yə əlavə edildi

- `.github/CODEOWNERS`;
- `.github/dependabot.yml`;
- `.github/labeler.yml`;
- `.github/workflows/codeql.yml`;
- `.github/workflows/dependency-review.yml`;
- `.github/workflows/labeler.yml`;
- `docs/github-governance.md`.

### Repository-də genişləndirildi

- 6 strukturlaşdırılmış Issue Form;
- Pull Request template;
- mövcud CI-də bütün GitHub action-ların full SHA pinlənməsi;
- `CONTRIBUTING.md`, `README.md`, `SECURITY.md`, `CLAUDE.md`, `MEMORY.md`.

Cloudflare deploy ardıcıllığı dəyişdirilməyib:
`quality → deploy-staging → e2e-staging → deploy-production`. D1 miqrasiyası hər mühitdə
bundle/deploy-dan əvvəl qalır.

### Canlı GitHub-da təsdiqlənənlər

- `main`: PR məcburi, strict `Quality gate`, conversation resolution, linear history və
  admin enforcement aktivdir;
- force push və branch deletion bağlıdır;
- Actions token default read-only-dir, workflow PR yarada/təsdiqləyə bilmir;
- dependency graph, secret scanning və push protection aktivdir;
- `staging` və `production` environment-ləri mövcuddur;
- əvvəlki CI run-u yaşıl idi;
- repository-də əvvəldən v0.1.0 və v0.2.0 tag/release-i var, amma versiya intizamı cari deyil.

### Merge-dən sonra GitHub UI-da tamamlanmalı addımlar

1. CodeQL ilk dəfə yaşıl işlədikdən sonra `Analyze (javascript-typescript)` required check et.
2. `Dependency review` ilk yaşıl run-dan sonra required check et.
3. Dependabot alerts, security updates və grouped updates aktiv et.
4. Private vulnerability reporting aktiv et.
5. Actions üçün full-length SHA policy-ni aktiv et.
6. Merge commit və lazım deyilsə rebase merge-i söndür; squash əsas yol olsun.
7. Update-branch təklifini və merge-dən sonra head branch auto-delete-i aktiv et.
8. Staging/production deployment branch qaydasını yalnız `main` ilə məhdudlaşdır.

Solo maintainer üçün məcburi approval qəsdən tövsiyə edilmir; müəllif öz PR-ını approve edə
bilmədiyi üçün repository self-block olar. İkinci maintainer gələndə 1 approval və Code Owner
review aktivləşdirilməlidir.

### Release qərarı

Yeni `release.yml` yaradılmayıb. Hazırkı model continuous deployment-dır və `package.json`
versiyası ilə mövcud tag-lar production vəziyyətini etibarlı göstərmir. Əvvəl version bump,
changelog, baseline release və tag ownership qaydası seçilməlidir; sonra SemVer tag-triggered
release automation əlavə edilə bilər.

## Doğrulama

| Yoxlama | Nəticə |
|---|---|
| Bütün `.github/*.yml` / `.yaml` fayllarının parse-i | PASS |
| `git diff --check` | PASS |
| `npm audit --audit-level=high` | PASS — 0 zəiflik |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 xəta |
| `npm test` | PASS — 102/102 fayl, 474/474 test |
| `npm run build` | PASS — 136 səhifə generasiya edildi |

E2E bu dəyişiklikdə lokal təkrar işlədilməyib: governance/sənəd dəyişiklikləri tətbiq runtime-ını
dəyişmir, E2E konfiqurasiyası isə canlı staging worker-ə qarşıdır və `main` deploy zəncirində
production-dan əvvəl məcburi qapı olaraq qalır.

## Tövsiyə edilən ardıcıllıq

1. Governance PR-ını CI/CodeQL/Dependency Review ilə yaşıl vəziyyətə gətir və squash merge et.
2. Yuxarıdakı GitHub UI parametrlərini tətbiq et.
3. A-01 və A-04 üçün “sil, birləşdir, yoxsa UI-a bağla” qərarı ver.
4. A-02 admin raw-text lint/test işi ilə lokallaşdırmanı həqiqətən tamamla.
5. A-03 üçün D1-safe hesab silinmə/reconciliation dizaynı qur.
6. Autentifikasiyalı staging admin CRUD acceptance dəsti əlavə et.
7. Sonra A-05–A-08 və məhsul yol xəritəsini prioritetləndir.
