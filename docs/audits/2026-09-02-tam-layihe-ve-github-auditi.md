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
kibertəhlükəsizlik auditindəki 11 tapıntının hamısı artıq bağlı idi; bu auditdə qeydə alınan
3 orta və 5 aşağı prioritetli tapıntının hamısı da eyni governance branch-də həll edildi.

"Hər şey işləyir" nəticəsi yalnız source-a baxmaqla verilməyib: typecheck, lint, 480 test,
production build, YAML parse və dependency audit faktiki işlədilib. Bununla belə canlı admin
hesabı ilə hər CRUD-un production məlumatına yazılması bu auditə daxil edilməyib; belə test
real məlumatı dəyişdirə bilər və ayrıca staging acceptance ssenarisi tələb edir.

## Ölçülən repository səthi

| Ölçü | Nəticə |
|---|---:|
| `src/` TypeScript/TSX faylı | 582 |
| Prisma modeli | 60 |
| D1 miqrasiya faylı | 29 |
| Admin `page.tsx` | 62 |
| Locale əsaslı `page.tsx` | 58 |
| Route Handler | 16 |
| `"use server"` faylı | 45 |
| Server Action ixracı | 148 |
| Vitest faylı / test | 104 / 480 |
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
| Qiymət | `PropertyPriceHistory` | Qiymət dəyişəndə yazılır, endirim bildirişi yaradır; public detalda tarixçə, admin redaktədə isə mənbə və tarixlə daxili görünüş var. |
| Rayon və obyektlər | `NeighborhoodProfile`, `NearbyPlace` | Admin public-imkanlar paneli yazır; rayon/əmlak public səthləri oxuyur. |
| Rezervasiya | `Reservation`, `ReservationEvent` | Əmlak detalı, kabinet və admin rezervasiya səhifəsi arasında bağlıdır. |
| AI | `AiContentDraft` | Admin AI köməkçisində qaralama, apply və reject axını var. |
| Media | `Media` | Admin/kabinet upload route-ları və public media delivery ilə bağlıdır. |
| Sistem | `Setting`, `AuditLog`, `EmailActivity`, `DomainEvent` | Setting public runtime-a, audit/e-poçt adminə bağlıdır; `DomainEvent` audit görünüşü və 180 günlük retention ilə nəzarətdə saxlanılan outbox mənbəyidir. |
| URL idarəsi | `Redirect`, `NotFoundHit` | Admin redirect/404 paneli və public catch-all route arasında bağlıdır. |
| Tərəfdaş | `Partner`, `PropertyPartner`, `ProjectPartner`, `AgencyPartner` | Admin relation manager yazır; public profillər və entity əlaqələri oxuyur. |
| Bilik | `KnowledgeCategory`, `KnowledgeArticle`, `KnowledgeTerm`, `KnowledgeFaq` | Admin CMS, public Knowledge Hub, sitemap və struktur data ilə bağlıdır. |
| SERP | `SeoMetadata`, `SeoLandingPage`, `SeoKeyword`, `EntityProfile`, `SeoAuditIssue`, `SeoSearchMetric`, `SeoAlert` | Admin SERP mərkəzi idarə edir; uyğun hissələr public metadata/landing/schema/sitemap runtime-ına gedir. GSC metric/alert-lərin public görünməməsi düzgündür. |

Nəticə: bütün 60 model üçün tətbiq kodunda real oxu və ya yazı izi var. Hər model üçün ayrıca
admin CRUD tələb olunmur; join, token, sessiya, telemetry və hadisə modellərinin xidmət və ya
aggregate UI arxasında qalması normaldır.

## Tapıntıların bağlanma vəziyyəti

Auditdə qeydə alınmış səkkiz tapıntının hamısı bu branch-də bağlanıb:

| ID | Səviyyə | Həll |
|---|---|---|
| A-01 | Orta | İstifadəsiz əmlak quick-action-ları silindi; tərəfdaş müddətinin bitməsi Bakı gün sərhədi ilə gündəlik maintenance işinə qoşuldu və domen hadisəsi yaradır. |
| A-02 | Orta | Admin security, e-poçt, hesab, trash və SERP görünüşlərində qalan raw UI mətnləri AZ/EN/RU kataloqlarına köçürüldü; yeni source-audit testi gələcək regresiyanı bloklayır. |
| A-03 | Orta | D1-safe iki mərhələli hesab silinməsi quruldu: hesab əvvəl atomik olaraq deaktiv edilir və `deletionRequestedAt` marker-i yazılır; idempotent təmizlik yarımçıq qalarsa gündəlik maintenance yenidən sınayır. Miqrasiya: `0028_account_deletion_queue.sql`. |
| A-04 | Aşağı | `/admin/seo` canlı diaqnostika route-u SERP alt menyusuna açıq şəkildə əlavə edildi; route artıq discoverable-dır və ayrıca runtime audit rolu aydındır. |
| A-05 | Aşağı | İlkin nəticə düzəldildi: public əmlak detalı qiymət tarixçəsini artıq göstərirdi. Admin əmlak redaktəsinə də mənbə və tarixlə daxili qiymət tarixçəsi əlavə edildi. |
| A-06 | Aşağı | Son 50 `DomainEvent` audit səhifəsində görünür; gündəlik maintenance 180 gündən köhnə qeydləri təmizləyir. Real subscriber yaranana qədər jurnal nəzarətsiz böyümür. |
| A-07 | Aşağı | Production sorğuları və status müqayisələri uyğun `*_STATUSES` sabitlərinə keçirildi; qalan status literalları tip sərhədi, UI label kataloqu və ya building type kimi ayrıca domen dəyərləridir. |
| A-08 | Aşağı | Təsdiqlənmiş ölü komponent, helper, e-poçt şablonu və əl test script-ləri silindi. Knip 5.80.2 layihənin xarici entrypoint-lərinə uyğun konfiqurasiya edildi; `npm run dead-code` CI-da istifadə olunmayan fayl/asılılıq artımını bloklayır. |

D1 hesab silmə testi həm uğurlu axını, həm ikinci addımın süni uğursuzluğunu, həm də maintenance retry-sini yoxlayır. Tərəfdaş testi Bakı vaxtı ilə gecə sərhədini ayrıca təsdiqləyir.

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

- `main`: PR məcburi, strict `Quality gate`, `Analyze (javascript-typescript)`,
  `Dependency review`, conversation resolution, linear history və admin enforcement aktivdir;
- force push və branch deletion bağlıdır;
- Actions token default read-only-dir, workflow PR yarada/təsdiqləyə bilmir;
- dependency graph, secret scanning, push protection, private vulnerability reporting və
  bütün Dependabot xəbərdarlıq/təhlükəsizlik yeniləmələri aktivdir;
- Actions full-length SHA siyasəti aktivdir;
- yalnız squash merge aktivdir; update-branch təklifi və head-branch auto-delete aktivdir;
- `staging` və `production` environment-ləri yalnız `main`-dən deploy qəbul edir;
- əvvəlki CI run-u yaşıl idi;
- repository-də əvvəldən v0.1.0 və v0.2.0 tag/release-i var, amma versiya intizamı cari deyil.

### GitHub UI sazlamaları — tətbiq edildi

3 sentyabr 2026-da repository owner sessiyası ilə bütün avtomatlaşdırıla bilən governance
sazlamaları Chrome-dan tətbiq və DOM səviyyəsində təkrar yoxlanıldı: üç required check,
Dependabot/private reporting, full-SHA policy, squash-only merge modeli, update/auto-delete
seçimləri və hər iki deployment environment-i üçün yalnız `main` qaydası aktivdir.

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
| `npm test` | PASS — 104/104 fayl, 480/480 test |
| `npm run dead-code` | PASS — istifadə olunmayan fayl və dependency tapılmadı |
| Lokal D1 miqrasiyası (`0028`) | PASS |
| `npm run build` | PASS — 136 səhifə generasiya edildi |

E2E bu dəyişiklikdə lokal təkrar işlədilməyib: governance/sənəd dəyişiklikləri tətbiq runtime-ını
dəyişmir, E2E konfiqurasiyası isə canlı staging worker-ə qarşıdır və `main` deploy zəncirində
production-dan əvvəl məcburi qapı olaraq qalır.

## Tövsiyə edilən ardıcıllıq

1. Governance PR-ının yenilənmiş CI/CodeQL/Dependency Review yoxlamalarını yaşıl saxla.
2. PR-ı review etdikdən sonra squash merge et; `main` zənciri staging → E2E → production yayımını özü idarə edəcək.
3. Autentifikasiyalı staging admin CRUD acceptance dəstini növbəti ayrıca issue kimi planlaşdır.
4. D1 backup/restore drill-i və xarici xidmət monitorinqini əməliyyat runbook-una çevir.
5. Sonra məhsul səviyyəli imkanları biznes prioritetinə görə roadmap-ə daxil et.
