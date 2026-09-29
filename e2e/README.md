# Browser E2E

Playwright dəsti. Testlər **canlı mühitə qarşı** işləyir — build artefaktına deyil,
faktiki yayımlanmış worker-ə.

## İşlətmə

```bash
npm run e2e              # bütün layihələr (chromium + mobile)
npm run e2e:chromium     # yalnız desktop
npm run e2e:mobile       # yalnız mobil
npm run e2e:ui           # interaktiv rejim (debug üçün)
npm run e2e:report       # son hesabatı aç
```

Hədəf mühit `E2E_BASE_URL` ilə seçilir, defolt staging-dir:

```bash
E2E_BASE_URL=https://luxehomeestate.az npm run e2e
```

### Lokal işlətmə

`next dev` **etibarlı hədəf deyil**: Prisma-nın wasm engine-i dev serverində
yüklənmir və D1-dən oxuyan hər səhifə 500 qaytarır. Production ilə eyni davranışı
yalnız workerd verir. PR-dakı məcburi `Local stack E2E` yoxlaması ilə eyni stack:

```bash
npm run e2e:install         # bir dəfə: Chromium + sistem asılılıqları
npm run e2e:local:build     # OpenNext bundle (IS_STAGING=true, SITE_URL=http://localhost:8787)
npm run e2e:local:prepare   # .wrangler/e2e-state: təzə D1 + test hesabları
npm run e2e:local:serve     # workerd :8787 (ayrıca terminalda saxla)
E2E_BASE_URL=http://localhost:8787 npm run e2e
```

`prepare` `AUTH_SECRET` və `E2E_ADMIN_TOTP_SECRET` tələb edir (CI onları hər run üçün
efemer yaradır). Hazırlıq bash skriptidir — Windows-da Git Bash işlədin. Yalnız ictimai
testlər üçün `npm run preview` də kifayətdir, amma onda auth ssenariləri atlanır.

## Layihələr

| Layihə | Cihaz | Nə edir |
|---|---|---|
| `auth-setup` | Desktop Chrome | Lokal stack-də admin bir dəfə real TOTP ilə daxil olur və sessiya paylaşılır (TOTP replay qoruması eyni 30 s addımda ikinci girişi rədd edir). Fixture yoxdursa (staging) boş vəziyyət yazılır və auth testləri atlanır |
| `chromium` | Desktop Chrome | `mobile.spec.ts` xaric bütün spec-lər |
| `mobile` | Pixel 7 | `mobile.spec.ts` və `smoke.spec.ts` |

`npx playwright test --list` üzrə cəmi 190 test icrası (chromium 158 setup daxil, mobile 32).
Turnstile üçün test bypass-ı **qəsdən yoxdur**; elan sahibi fixture sessiyası ilə daxil olur
(`scripts/e2e/local-stack-fixtures.ts`, `support/auth.ts`).

## Struktur

| Yol | Məzmun |
|---|---|
| `support/helpers.ts` | Davranış köməkçiləri — naviqasiya, JSON-LD, konsol, hidratasiya |
| `support/auth.ts`, `support/fixtures.ts` | Admin/sahib sessiyaları və test fixture-ları |
| `specs/auth.setup.ts` | `auth-setup` layihəsi — admin 2FA girişi |
| `pages/*.page.ts` | Səhifə obyektləri — **seçicilər yalnız burada** |
| `specs/*.spec.ts` | Testlər |

Seçicilərin səhifə obyektlərində toplanması qəsdəndir: UI dəyişəndə yalnız bir
fayl yenilənir.

## Test qatları

| Spec | Nə yoxlayır |
|---|---|
| `smoke` | Hər ictimai marşrut 200, locale prefiksi, konsol xətaları |
| `listings` | Filtr, axtarış, sıralama, səhifələmə — URL müqaviləsi |
| `property-detail` | Detal səhifəsi, qalereya, 404 statusu, canonical |
| `favorites-compare` | `localStorage` → Server Action zənciri |
| `content` | Layihə, bloq, xidmət, bilik mərkəzi, kalkulyator |
| `i18n` | Üç dil, hreflang, tərcümə bütövlüyü |
| `api` | `/api/*` qorunması, media proxy, path traversal |
| `seo` | Metadata, Open Graph, JSON-LD, sitemap, robots |
| `security` | Panel qorunması, cookie bayraqları, başlıqlar, sirr sızması |
| `performance` | Resurs büdcəsi, CLS, TTFB, şəkil optimizasiyası |
| `a11y` | WCAG (axe-core), klaviatura, semantik struktur, dark kontrast |
| `mobile` | Çekmece, üfüqi sürüşmə, toxunma hədəfləri |
| `admin-panel` | Admin 2FA doğrulaması, panel səhifələri, toplu şəkil yükləmə (yalnız lokal stack) |
| `kabinet-listing` | Kabinetdə elan sehrbazı forması (yalnız lokal stack) |
| `projects-section` | «Layihələr» bölməsi açarı — naviqasiya və səhifənin gizlədilməsi |

## Yazma qaydaları

**Məzmun sayından asılı olma.** Staging-də nümunə məzmun açıqdır (300+ elan),
production-da isə yalnız real qeydlər var. Testlər hər ikisində keçməlidir:

```ts
const total = (await listings.resultCount()) ?? 0;
test.skip(total === 0, "kataloq boşdur");
```

**Slug hardcode etmə.** Konkret elana bağlanmaq əvəzinə kataloqdan ilk elementi
götür — məzmun dəyişəndə test sınmır.

**Hidratasiyanı nəzərə al.** Server HTML-i düyməni dərhal göstərir, lakin React
hidratasiya edənə qədər `onClick` bağlanmır: `domcontentloaded`-dan sonrakı klik
səssizcə itir. İnteraktiv testlər `clickUntil()` işlədir.

**Semantik seçici seç.** Layihədə `data-testid` yoxdur; rol, `aria-label` və
mətn işlədilir. React-in generasiya etdiyi `id` dəyərləri sabit deyil — `select`
elementləri `name` atributu ilə seçilir.

## CI

PR-da: `Quality gate` + məcburi `Local stack E2E` (lokal workerd + real D1/R2, public + auth).

`main` push-unda axın: `quality + e2e-local → deploy-staging → e2e-staging → deploy-production`.

E2E staging yayımından **sonra**, production yayımından **əvvəl** işləyir —
uğursuz olarsa production yayımı baş vermir. Hesabat `playwright-report`
artefaktı kimi 14 gün saxlanılır.

## Bilinən mühit fərqləri

| Davranış | Production | Staging |
|---|---|---|
| Nümunə məzmun | yoxdur | açıqdır (300+ elan) |
| `robots.txt` | normal | tam `Disallow: /` |
| `meta robots` | indekslənir | `noindex` |
| HSTS | var | yoxdur (`workers.dev` zona qaydalarından kənardır) |

Sitemap **hər iki mühitdə production hostunu** yazır (`src/app/sitemap.ts`):
unudulmuş env dəyəri indeksdə alternativ host yaratmasın deyə canonical host
qəsdən sabitdir.

## Bot qoruması və sorğu üsulu

Production Cloudflare bot qoruması arxasındadır. Qoruma TLS/HTTP fingerprint-ə
baxır, ona görə Playwright-in `request` fixture-u **403 alır** — User-Agent
başlığı bunu keçmir. Brauzer naviqasiyası isə normal keçir.

Buna görə status və gövdə yoxlamaları naviqasiya əsaslıdır:

```ts
const status = await statusOf(page, "/api/monitoring/vitals");  // 405
const body = await bodyOf(page, "/robots.txt");
```

`request` fixture-u yalnız **POST** testlərində qalır (naviqasiya ilə POST
mümkün deyil) və onlar `botProtectionActive(baseURL)` şərti ilə qorumalı
mühitdə atlanır. Staging `workers.dev` altındadır — orada qayda tətbiq
olunmur, ona görə həmin testlər CI-də tam işləyir.
