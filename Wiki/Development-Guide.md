# İnkişaf təlimatı

## Tələblər

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` — CI `.nvmrc` faylındakı `24` versiyasını işlədir;
- **npm 12** və repozitoriyadakı `package-lock.json` (`package.json` → `packageManager: "npm@12.0.1"`);
- **Python 3** — ərazi bölgüsü generatorları (`db:locations:build`, `db:streets:build`, `db:locations:report`, `db:locations:migrations`) `scripts/*.py`-dir; yalnız ərazi datası yenilənəndə lazımdır;
- E2E lokal stack üçün `bash` (`scripts/e2e/prepare-local-stack.sh`) — Windows-da Git Bash;
- remote D1 və deploy üçün Cloudflare hesabı;
- lokal secret-lər üçün `.env`.

### npm versiyası niyə pinlənib

`package-lock.json`-un formatı npm major versiyasından asılıdır:

- **npm 12** opsional peer asılılıqlarını (məsələn `next-intl` → `@swc/core` → `@swc/helpers@0.5.23`)
  lock faylına yazmır;
- **npm 10 və 11** həmin qeydi lock faylında görməyi tələb edir və tapmayanda `npm ci` işə düşmür:

  ```text
  npm error code EUSAGE
  npm error `npm ci` can only install packages when your package.json and
  npm error package-lock.json ... are in sync.
  npm error Missing: @swc/helpers@0.5.23 from lock file
  ```

Bu, 30–31 avqust 2026-da GitHub Actions-ın hər `main` push-unda 3–16 saniyə ərzində uğursuz
olmasının səbəbi idi: lock faylı lokal npm 12 ilə yaradılırdı, CI isə `node-version: 22` ilə gələn
npm 10-u işlədirdi. Testlərə heç çatmırdı, çünki `npm ci` addımı sınırdı.

Həll: `package.json`-da `packageManager` sahəsi həqiqət mənbəyidir, CI isə asılılıqları
quraşdırmazdan əvvəl həmin dəyəri oxuyub eyni npm-i qurur. Lokal npm versiyanızı dəyişsəniz:

1. `package.json` → `packageManager` dəyərini yeniləyin;
2. `npm install --package-lock-only` ilə lock faylını yenidən yaradın;
3. hər ikisini eyni commit-də göndərin.

## İlk quraşdırma

```bash
git clone https://github.com/MuradoffTehmez/LuxeHome.git
cd LuxeHome
npm ci
```

`.env.example` faylını `.env` kimi kopyalayın.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Sonra:

```bash
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Development server standart olaraq [http://localhost:3000](http://localhost:3000) ünvanında açılır.

`next.config.ts` içindəki `initOpenNextCloudflareForDev()` lokal `next dev` zamanı D1/R2 binding-lərini Miniflare vasitəsilə təqdim edir. Data oxuyan route-lar production ilə eyni D1 adapter yolunu istifadə edir.

## Mühit dəyişənləri

### Lokal `.env`

| Dəyişən | Təyinat |
|---|---|
| `DATABASE_URL` | Prisma CLI və standalone script üçün lokal SQLite |
| `AUTH_SECRET` | Session JWT və TOTP encryption key derivation |
| `SITE_URL` | Canonical, sitemap və OG üçün public base URL |
| `SEED_ADMIN_EMAIL` | Bootstrap/seed staff e-poçtu |
| `SEED_ADMIN_PASSWORD` | Bootstrap/seed parolu |
| `RESEND_API_KEY` | E-poçt göndərmə |
| `RESEND_WEBHOOK_SECRET` | Resend/Svix webhook imzası |
| `RESEND_FROM_EMAIL` | Göndərən |
| `NOTIFICATION_EMAIL` | Lead bildiriş alıcısı |
| `CRON_SECRET` | Saved-search digest endpoint Bearer açarı |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Admin trafik analitikası üçün `Analytics:Read` token-i |
| `ADMIN_ENABLED` | Staff route feature flag-i |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` (köhnə adı `TURNSTILE_SECRET_KEY` də oxunur), `TURNSTILE_HOSTNAMES` | Cloudflare Turnstile |
| `GEOAPIFY_API_KEY` | Paneldə ünvan axtarışı və xəritədən ünvan seçimi |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Ofis çatına lead bildirişi (istəyə bağlı) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google ilə giriş (yoxdursa söndürülüdür) |
| `SMS_PROVIDER_URL`, `SMS_PROVIDER_TOKEN`, `SMS_SENDER` | Telefonla OTP girişi (yoxdursa söndürülüdür) |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push |
| `GSC_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON` | Admin Search Console inteqrasiyası |
| `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` | Cloudflare Web Analytics beacon-u (build dəyişəni) |
| `AI_TEXT_MODEL`, `AI_VISION_MODEL` | Workers AI modelinin əvəzlənməsi (istəyə bağlı) |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_ID`, `_CLIENT_SECRET`, `_REFRESH_TOKEN` | Service account əvəzinə OAuth refresh dəsti; `_ACCESS_TOKEN` yalnız diaqnostika üçün |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID` | Google Analytics / Tag Manager (build dəyişəni; production `deploy` skripti GA ID-ni özü ötürür) |
| `GOOGLE_SITE_VERIFICATION` | Search Console HTML meta təsdiqi |
| `NEXT_PUBLIC_SITE_URL` | Client tərəfdə lazım olan public base URL |
| `CF_ZONE_ID`, `CF_ACCOUNT_ID` | Admin analitikası üçün Cloudflare zona/hesab ID-si (`wrangler.jsonc` vars) |
| `ACCESS_ENFORCED`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | İstəyə bağlı Cloudflare Access (Zero Trust) qapısı — panel üçün |
| `SYSTEM_MODE`, `FORCE_MAINTENANCE`, `EDGE_HTML_CACHE_TTL` | Worker vars: defolt sistem rejimi, təcili texniki xidmət açarı, kənar keş TTL-i |

`IS_STAGING` əsasən Wrangler staging vars daxilində təyin olunur.

`process.env` Workers-də yalnız sorğu kontekstində doludur. Modul səviyyəsində oxunan konfiqurasiya boş qalır — `runtimeEnv()` və lazy funksiya işlət (`src/lib/email.ts` nümunəsi).

### Secret qaydası

- `.env` Git-ə commit edilmir;
- production/staging secret-lər Cloudflare secret store-da saxlanır;
- hər mühit fərqli `AUTH_SECRET` istifadə etməlidir;
- real admin parolu seed SQL, issue, log və sənədə yazılmamalıdır.

## Əmrlər

### İnkişaf və keyfiyyət

| Əmr | Nəticə |
|---|---|
| `npm run dev` | `next dev --webpack` |
| `npm run build` | `prisma generate && next build --webpack` |
| `npm run start` | `next start` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run dead-code` | Knip: istifadə olunmayan fayl və asılılıqlar |
| `npm test` | `vitest run` (workerd + Node layihələri, real D1 integration daxil) |
| `npm run test:watch` | Vitest watch |
| `npm run test:seo:routes` | Production SEO route status smoke testi |
| `npm run test:seo:live` | Production SERP qəbul (acceptance) testi |
| `npm run e2e` | Konfiqurasiya edilmiş workerd mühitinə qarşı Playwright (`E2E_BASE_URL`) |
| `npm run e2e:local:build` | Lokal stack üçün OpenNext bundle (`IS_STAGING=true`, localhost) |
| `npm run e2e:local:prepare` | `.wrangler/e2e-state`-də təzə D1 + test hesabları |
| `npm run e2e:local:serve` | Lokal workerd `:8787` |
| `npm run e2e:chromium`, `e2e:mobile`, `e2e:ui`, `e2e:report` | Playwright layihələri və hesabat |
| `npm run e2e:install` | Playwright Chromium-u sistem asılılıqları ilə quraşdırır |
| `npm run assets:maintenance-logo` | Texniki xidmət səhifəsinin daxili loqosunu (`maintenance-logo.ts`) yenidən qurur |
| `npm run preview` | OpenNext build + local Worker preview |
| `npm run cf-typegen` | Wrangler binding type generation |

### D1 və seed

| Əmr | Hədəf |
|---|---|
| `npm run db:generate` | Prisma client |
| `npm run db:migrate:new` | Schema diff SQL-i stdout-a çıxarır |
| `npm run db:migrate:local` | Lokal D1 |
| `npm run db:migrate:staging` | Staging D1 |
| `npm run db:migrate:remote` | Production D1 |
| `npm run db:seed:build` | Lokal SQLite → `prisma/seed.sql` |
| `npm run db:seed:local` | Lokal D1 |
| `npm run db:seed:staging` | Staging D1 |
| `npm run db:seed:remote` | Production D1 |
| `npm run db:demo:build` | `prisma/demo-content-data.ts` → `prisma/demo-content.sql` |
| `npm run db:demo:local` / `:staging` / `:remote` | Nümunə məzmunun tətbiqi (production-a yüklənmir) |
| `npm run db:clean-demo:local` / `:staging` / `:remote` | Bütün `isDemo` qeydlərinin silinməsi və açarın söndürülməsi |
| `npm run db:studio` | Prisma Studio |

### Taksonomiya və admin bootstrap

| Əmr | Nəticə |
|---|---|
| `npm run db:locations:build` | DSK + Ünvan Reyestri + bazar massivləri JSON-undan `prisma/locations-data.ts` yaradır; ziddiyyətdə dayanır |
| `npm run db:streets:build` | Ünvan Reyestri küçələrindən `public/data/kuceler/<kod>.json` və `src/lib/official-street-codes.ts` yaradır |
| `npm run db:locations:report` | `docs/erazi/baki-erazi-bolgusu.md` hesabatını data fayllarından qurur |
| `npm run db:locations:migrations` | `taxonomy.sql`-in yerləşmə bölməsini `migrations/0050`–`0053` hissələrinə bölür |
| `npm run db:taxonomy:build` | `prisma/taxonomy.sql` yaradır |
| `npm run db:taxonomy:local` | Lokal D1 taksonomiyası |
| `npm run db:taxonomy:staging` | Staging D1 taksonomiyası |
| `npm run db:taxonomy:remote` | Production D1 taksonomiyası |
| `npm run db:knowledge:build` | `prisma/knowledge-hub.sql` (DRAFT) yaradır |
| `npm run db:knowledge:local` | Lokal D1 Bilik Mərkəzi idxalı |
| `npm run db:knowledge:staging` | Staging D1 Bilik Mərkəzi idxalı |
| `npm run db:knowledge:remote` | Production D1 Bilik Mərkəzi idxalı |
| `npm run auth:create-admin` | İlk staff user üçün SQL generatoru |

### Deployment

| Əmr | Nəticə |
|---|---|
| `npm run preview:staging` | Staging vars ilə local OpenNext preview |
| `npm run deploy:staging` | `luxehomeestate-staging` Worker |
| `npm run deploy` | Production Worker |
| `npm run deploy:cron:staging` | Staging saved-search cron Worker |
| `npm run deploy:cron` | Production saved-search cron Worker |

## Prisma/D1 dəyişiklik axını

### Sxem dəyişikliyi

1. `prisma/schema.prisma` dəyişdirin.
2. Domen string-i əlavə olunursa `src/lib/constants.ts` dəyər/label/tone xəritəsini yeniləyin.
3. `npm run db:migrate:local`, sonra `npm run db:migrate:new -- --output migrations/000N_ad.sql`.
4. Generasiya olunmuş SQL-i əl ilə oxuyun; destruktiv əməliyyatı avtomatik qəbul etməyin.
5. `npm run db:migrate:local` işlədin.
6. Seed və ya taksonomiya təsirlənirsə uyğun generatoru işlədin.
7. Test və build qapısını keçirin.
8. `main`-ə merge-dən sonra CI miqrasiyanı əvvəl staging, sonra production D1-ə bundle-dan əvvəl tətbiq edir.
9. Sorğu formasını dəyişirsinizsə (uzun `IN`, nested relation) `*.integration.test.ts` yazın — lokal SQLite D1-in 100 parametr həddini tutmur.

### Seed mənbələri

- `prisma/seed.ts` — lokal Prisma SQLite başlanğıc məlumatı;
- `prisma/build-seed-sql.ts` — D1 üçün SQL generatoru;
- `prisma/seed.sql` — D1-ə tətbiq olunan yaradılmış artifact;
- `prisma/taxonomy-data.ts` və `locations-data.ts` — taksonomiya source-u;
- `prisma/az-admin-divisions.json`, `unvanportali-admin-units.json`, `unvanportali-streets.json`, `baku-market-locations.json` — yerləşmə generatorunun girişləri (massiv/metro/nişangah/alias əlavəsi yalnız `baku-market-locations.json`-da, `sources` kodu ilə);
- `prisma/build-taxonomy-sql.ts` — taxonomy SQL generatoru;
- `prisma/remove-demo-content.sql` — yalnız `isDemo` kontent təmizliyi.

Remote seed və taksonomiya əmrləri idempotent və ya qeyri-destruktiv sayılmamalıdır. SQL-i və hədəf environment-i ayrıca yoxlayın.

Prisma `DateTime` sahələri D1-də ISO-8601 mətn kimi saxlanılır. Seed, əl ilə SQL və yeni miqrasiya Unix integer yazmamalıdır; qarışıq format Prisma D1 adapterində runtime parse xətasına səbəb olur.

## Testlər

> Test strategiyası, qoruyucu testlər və «hansı dəyişikliyə hansı test» cədvəli: [[Test və keyfiyyət|Testing-and-Quality]].

Testlər `@cloudflare/vitest-plugin` ilə `workerd` runtime-da (domen qatı) və Node layihəsində (SSR komponentləri) işləyir. Bu, Web Crypto davranışının production-a yaxın olmasını təmin edir. `*.integration.test.ts` faylları real miniflare D1 ilə işləyir.

29 sentyabr 2026 snapshot-unda 173 test faylı və 889 test (lokal işləmə ~65 s) aşağıdakı sahələri əhatə edir:

- parol, crypto, TOTP və cookie;
- lockout, permission və session policy/projection/routing;
- staff və public login siyasəti;
- public qeydiyyat və elan göndərmə;
- kabinet xülasəsi;
- admin HTML sanitizasiyası və property input;
- staff user management helper-ları;
- media upload record rollback-i;
- image dropzone config;
- theme provider runtime;
- public content guard qaydaları;
- locale middleware, canonical redirect, hreflang və SEO route-ları;
- saved search, bildiriş və cron digest axını;
- partner görünüşü, əlaqələri və admin action-ları;
- lead statusu, hesab təsdiqi, agency recovery və audit reset;
- Resend webhook, e-poçt jurnalı və Cloudflare analitika helper-ları;
- SERP siyasəti, idarə olunan metadata, sitemap data mənbələri və Cloudflare crawler challenge
  təsnifatı;
- yerləşmə ağacının struktur qaydaları, rəsmi kodlar, massiv bölgüsü, alias və nişangahlar (`locations-tree.test.ts`);
- nişangahın şəhərə aidlik validasiyası (`property-submission.test.ts`);
- Azərbaycan əlifbası ilə sıralama (`az-collation.test.ts`) — workerd-in ICU-su `localeCompare("az")`-ni tam dəstəkləmir;
- kənar keşin təhlükəsizliyi (`public-cache-safety.test.ts`);
- admin kataloq parity-si və `*_LABELS` sinxronu (`admin-label-sync.test.ts`);
- passkey, Google və telefon giriş siyasətləri, paket/elan müddəti riyaziyyatı, qiymət göstəricisi;
- D1 integration: xəritə sorğusu, yerləşmə ağacı (kəndlər yalnız elanlı/redaktə olunanda), tərcümə `IN` sorğuları.

### Browser E2E (Playwright)

`e2e/specs/` qovluğunda 15 spec faylı var: `smoke`, `listings` (filtrlər), `property-detail`, `favorites-compare`, `content`, `i18n`, `api`, `seo`, `security`, `performance`, `a11y` (axe-core), `mobile`, `admin-panel` (admin 2FA, toplu şəkil yükləmə), `kabinet-listing` (kabinet forması), `projects-section` (layihələr açarı). `e2e/support/` fixture-ları, `e2e/pages/` page object-ləri saxlayır.

Playwright üç layihə işlədir (`playwright.config.ts`):

| Layihə | Nə edir | `--list` üzrə test |
|---|---|---:|
| `auth-setup` | Lokal stack-də admin bir dəfə 2FA ilə daxil olur, sessiya paylaşılır (TOTP replay qoruması eyni 30 s addımda ikinci girişi rədd edir) | 1 |
| `chromium` | Desktop Chrome; `mobile.spec.ts` xaric bütün spec-lər | 158 (setup daxil) |
| `mobile` | Pixel 7; `mobile.spec.ts` və `smoke.spec.ts` | 32 |

Cəmi 190 test icrası. Fixture-lar yoxdursa (staging run) auth testləri atlanır.

Testlər `next dev`-ə deyil, workerd-ə qarşı qurulub (Prisma wasm engine `next dev`-də yüklənmir). Lokal stack:

```bash
npm run e2e:local:build
npm run e2e:local:prepare   # AUTH_SECRET və E2E_ADMIN_TOTP_SECRET tələb edir
npm run e2e:local:serve
E2E_BASE_URL=http://localhost:8787 npm run e2e
```

Turnstile test bypass-ı qəsdən yoxdur: admin stage cookie ilə TOTP addımından real keçir, elan sahibi fixture sessiyası ilə daxil olur (`scripts/e2e/`, `e2e/support/auth.ts`).

### GitHub Actions CI

`.github/workflows/ci.yml` iş axınları (action-lar tam commit SHA ilə pin edilib):

| Job | Nə vaxt | Addımlar |
|---|---|---|
| `Quality gate` | Hər PR və `main` push | `npm ci` → `npm audit --audit-level=high` → test → typecheck → lint → dead-code → build |
| `Local stack E2E` | Hər PR və `main` push (məcburi yoxlama) | OpenNext bundle → lokal D1 (miqrasiya, seed, taksonomiya, demo, fixture) → lokal worker → Playwright (public + auth) |
| `Deploy to staging` | `main` push | Cloudflare credential formatının yoxlanması → D1 miqrasiyaları → taksonomiya → staging bundle → yayım |
| `Browser E2E (staging)` | `main` push | Canlı staging-ə qarşı Playwright |
| `Deploy to production` | `main` push, əvvəlki üçü uğurludursa | Credential yoxlaması → D1 miqrasiyaları → taksonomiya (`db:taxonomy:remote`) → production bundle (`SITE_URL`, GA ID, VAPID və Web Analytics dəyişənləri ilə) → `wrangler deploy --env=""` |

Ayrıca iş axınları: `codeql.yml`, `dependency-review.yml`, `labeler.yml`. Node versiyası `.nvmrc`-dən, npm versiyası `packageManager`-dən gəlir — bu addım `npm ci`-dən əvvəldir, onsuz runner-in npm-i lock faylı formatı ilə uyuşmaya bilər.

### Son audit nəticəsi

29 sentyabr 2026, `main@199f8409` (#128 ərazi bölgüsündən sonra):

| Yoxlama | Nəticə |
|---|---:|
| Vitest | ✅ 173 fayl, 889 test |
| TypeScript | ✅ Keçdi |
| ESLint | ✅ Keçdi |
| Knip (dead-code) | ✅ Keçdi |
| Next.js production build (webpack) | ✅ Keçdi |

## Məcburi keyfiyyət qapısı

Hər dəyişiklikdən sonra:

```bash
npm run test
npm run typecheck
npm run lint
npm run dead-code
npm run build
```

Beşi də işlədilmədən dəyişiklik tamamlanmış sayılmır. **`npm run build`-i buraxma:** Server Action qaydaları yalnız webpack mərhələsində yoxlanılır — `"use server"` faylındakı hər ixrac `async` olmalıdır, Promise qaytaran sinxron sarğı belə build-i saxlayır.

`npm audit --audit-level=high` CI-da ayrıca işləyir; lokalda yalnız `package.json`/`package-lock.json` dəyişəndə lazımdır.

### Asılılıq yeniləmələri

Dependabot həftəlik qruplaşdırılmış PR açır (production/development minor+patch, GitHub Actions). Aşağıdakı major-lar upstream uyğunsuzluğuna görə `.github/dependabot.yml`-də ignore edilib: `typescript >=7` (typescript-eslint), `eslint >=10` (eslint-plugin-react), `vitest >=5` (`@cloudflare/vitest-plugin`).

### Bundler: webpack

Next 16 defolt olaraq Turbopack işlədir, lakin `build` və `dev` qəsdən `--webpack` ilə işləyir: Turbopack Prisma klientini hash-lı `@prisma/client-<hash>` symlink-i kimi xaricləşdirir və bu, OpenNext/workerd bundle-ında yoxlanmayıb (Windows-da symlink `EPERM` ilə düşür).

`revalidateTag()` Next 16-da ikinci arqument tələb edir; `revalidatePublicContent()` `{ expire: 0 }` ilə dərhal bitmə davranışını saxlayır.

## Kod konvensiyaları

### Dil

- identifier-lar ingiliscə;
- şərhlər azərbaycanca;
- istifadəçiyə görünən mətnlər AZ/EN/RU message kataloqlarından gəlir;
- public route həmişə `/{locale}` prefiksi daşıyır, admin isə locale-siz `/admin` qalır;
- Azərbaycan dilli query müqaviləsi (`elan`, `sehife` və s.) locale-lər arasında sabit saxlanılır.

### Data

- runtime Prisma yalnız `src/lib/prisma.ts`;
- public property query public predicate ilə başlamalıdır;
- status və rol string-i hardcode edilmir;
- relation ID-si client-dən gəlibsə serverdə doğrulanır;
- D1 transaction məhdudluğunda kompensasiya/rollback nəzərdə tutulur;
- `isDemo` və soft-delete sərhədləri public query-də unudulmur.

### Server Action

- admin mutation ilk addımda `requireAdminAction(permission)` çağırır;
- public listing/media mutation `requirePublicAction(scope)` çağırır;
- form data Zod ilə parse edilir;
- client admin-only sahələrin source-u deyil;
- mutation audit və `revalidatePath` ehtiyacını nəzərə alır;
- xəta istifadəçiyə Azərbaycan dilində, daxili detal sızdırmadan qaytarılır.

### UI və dizayn

- `dark:` class yazılmır; semantik token işlədilir;
- foto üzərində `charcoal`/`navy` tokeni yox, `on-image-chip` və ya sabit `black/<opacity>`;
- breakpoint-li grid-ə baza `grid-cols-1`; `overflow-x-auto` konteyneri `relative`;
- admin JSX-də xam AZ/EN mətni yazılmır — `getAdminT()` / `useTranslations("admin")`;
- `Section` spacing propu ilə idarə olunur;
- 44 px touch target və görünən focus qorunur;
- reduced-motion nəzərə alınır;
- şirkət məlumatı `src/config/site.ts`-dən gəlir;
- yeni image host üçün `next.config.ts` remote pattern-i yenilənir.

### SEO

- səhifə `buildMetadata()` çağırır;
- dynamic detail `generateMetadata()` ilə canonical qurur;
- uyğun JSON-LD generatoru istifadə olunur;
- yeni indexlənən route sitemap qərarına daxil edilir;
- kabinet/admin/login səhifələri noindex olur;
- staging üçün `IS_STAGING` davranışı saxlanır.

## Yeni route checklist-i

- [ ] Route doğru layout qrupundadır
- [ ] Public route AZ/EN/RU locale prefiksi və message fallback-i ilə işləyir
- [ ] Metadata və canonical var
- [ ] Public/private render qərarı düzgündür
- [ ] D1 oxuyursa request-time render nəzərə alınıb
- [ ] Empty/error/not-found state var
- [ ] Auth və permission yalnız layout-a buraxılmayıb
- [ ] Sitemap/robots qərarı verilib
- [ ] Server tərəfdə sessiya oxuyursa `SESSION_DEPENDENT_PUBLIC_ROUTES`-a əlavə olunub
- [ ] Qısa ünvandırsa `NEVER_CACHED_PREFIXES`-ə yazılıb
- [ ] Naviqasiya linki lazımdırsa `site.ts` yenilənib
- [ ] Light/dark, mobile və keyboard yoxlanıb
- [ ] Test, typecheck, lint və build keçib

## Troubleshooting

### `npm ci` `EUSAGE` / `Missing: ... from lock file` deyir

Lokal npm versiyası ilə lock faylını yaradan npm versiyası uyğun gəlmir. `npm --version` çıxışını
`package.json`-dakı `packageManager` dəyəri ilə tutuşdurun. Fərqlidirsə ya həmin npm-i quraşdırın
(`npm install -g npm@<versiya>`), ya da versiyanı qəsdən dəyişirsinizsə `packageManager` sahəsini
yeniləyib `npm install --package-lock-only` ilə lock faylını yenidən yaradın. Lock faylını
`npm ci`-nin təklif etdiyi kimi sadəcə `npm install` ilə "düzəltmək" problemi digər tərəfə keçirir:
CI-da işləyən lock lokal mühitdə sınır.

### Build «Failed to start the remote proxy session» deyir

`wrangler.jsonc`-dəki `ai` və `images` binding-lərinin lokal emulyasiyası yoxdur; Wrangler onlar
üçün **remote proxy sessiyası** açır və bu sessiya Cloudflare kimlik məlumatı tələb edir. Ona görə
`next.config.ts`-dəki `initOpenNextCloudflareForDev()` çağırışı yalnız
`process.env.NODE_ENV === "development"` olduqda işə düşür.

Şərt silinsə `next build` də həmin sessiyanı açmağa çalışır və token olmayan mühitdə (məsələn
GitHub Actions) build sınır:

```text
unhandledRejection [Error: Failed to start the remote proxy session.
  ... it's necessary to set a CLOUDFLARE_API_TOKEN environment variable ...]
```

Lokal maşında xəta görünmür, çünki `wrangler login` sessiyası mövcuddur — problem yalnız CI-da üzə
çıxır. Build zamanı binding lazım deyil: D1-dən oxuyan səhifələr onsuz da request-time render olunur.

### Build zamanı D1 binding tapılmır

Data oxuyan səhifənin request-time render olduğunu və Prisma-nın `src/lib/prisma.ts` proxy-si ilə istifadə edildiyini yoxlayın. Modul səviyyəsində `new PrismaClient()` yaratmayın.

### Workers Node binary engine axtarır

Prisma generator output-unu custom qovluğa köçürməyin və client-i paket adı ilə import edin. Standart output `workerd` şərtinin WASM variantını seçməsi üçün qəsdən saxlanılıb.

### Server Action 403 qaytarır

`next.config.ts` `allowedOrigins`, request `Origin`/`Host`, `Sec-Fetch-Site`, session auth kind və permission-u yoxlayın.

### Azərbaycan hərfi ilə axtarış qeyri-sabitdir

`mode: "insensitive"` D1-də dəstəklənmir. Həll `src/lib/search-normalization.ts` və `Property.searchText` / taksonomiya `searchName` sütunlarıdır — yazma axınlarında bu sahələri doldurmağı unutma.

### Build `next/font` xətası verir

`An error occurred in next/font ... Cannot read properties of null (reading '1')` — Google Fonts build zamanı standart uzantısız font URL-i qaytarıb. Kod xətası deyil; build-i (və ya CI job-unu) yenidən işlətmək kifayətdir.

### Sorğu staging-də 500 verir, lokalda işləyir

D1-in 100 bound parametr həddi və ya `take`/`orderBy`-li nested əlaqə (98-dən çox valideyn) ola bilər. Lokal SQLite bunu tutmur — `*.integration.test.ts` yazın və `findManyInChunks()` işlədin.

### Şəkil upload lokalda “media anbarı əlçatan deyil” deyir

Miniflare/Wrangler `MEDIA` R2 binding-inin yükləndiyini və route-un OpenNext dev init-dən keçdiyini yoxlayın. Cloudflare Images olmadan original format fallback ola bilər, amma R2 binding olmadan upload edilmir.

### D1 oxunuşunda `Inconsistent column data` və ya tarix parse xətası görünür

Problemli cədvəldə Prisma `DateTime` sütunlarının `typeof()` və dəyərlərini yoxlayın. Tətbiq ISO-8601 mətn gözləyir; Unix integer qalıqları varsa əvvəl backup alın, sonra `0019_normalize_d1_datetime_storage.sql` invariantına uyğun normallaşdırın. Yeni seed və migration-larda tarixləri integer kimi yazmayın.
