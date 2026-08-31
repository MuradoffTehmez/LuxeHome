# İnkişaf təlimatı

## Tələblər

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` — CI `.nvmrc` faylındakı `24` versiyasını işlədir;
- **npm 12** və repozitoriyadakı `package-lock.json` (`package.json` → `packageManager: "npm@12.0.1"`);
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

`IS_STAGING` əsasən Wrangler staging vars daxilində təyin olunur.

### Secret qaydası

- `.env` Git-ə commit edilmir;
- production/staging secret-lər Cloudflare secret store-da saxlanır;
- hər mühit fərqli `AUTH_SECRET` istifadə etməlidir;
- real admin parolu seed SQL, issue, log və sənədə yazılmamalıdır.

## Əmrlər

### İnkişaf və keyfiyyət

| Əmr | Nəticə |
|---|---|
| `npm run dev` | `next dev` |
| `npm run build` | `prisma generate && next build` |
| `npm run start` | `next start` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | `vitest run` |
| `npm run test:watch` | Vitest watch |
| `npm run test:seo:routes` | Production SEO route status smoke testi |
| `npm run test:seo:live` | Production SERP qəbul (acceptance) testi |
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
| `npm run db:clean-demo:local` | Lokal demo təmizliyi |
| `npm run db:clean-demo:remote` | Production demo təmizliyi |
| `npm run db:studio` | Prisma Studio |

### Taksonomiya və admin bootstrap

| Əmr | Nəticə |
|---|---|
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
3. `npm run db:migrate:new` çıxışını yeni `migrations/000N_name.sql` faylı kimi saxlayın.
4. Generasiya olunmuş SQL-i əl ilə oxuyun; destruktiv əməliyyatı avtomatik qəbul etməyin.
5. `npm run db:migrate:local` işlədin.
6. Seed və ya taksonomiya təsirlənirsə uyğun generatoru işlədin.
7. Test və build qapısını keçirin.
8. Əvvəl staging, smoke test-dən sonra backup ilə production-a keçin.

### Seed mənbələri

- `prisma/seed.ts` — lokal Prisma SQLite başlanğıc məlumatı;
- `prisma/build-seed-sql.ts` — D1 üçün SQL generatoru;
- `prisma/seed.sql` — D1-ə tətbiq olunan yaradılmış artifact;
- `prisma/taxonomy-data.ts` və `locations-data.ts` — taksonomiya source-u;
- `prisma/build-taxonomy-sql.ts` — taxonomy SQL generatoru;
- `prisma/remove-demo-content.sql` — yalnız `isDemo` kontent təmizliyi.

Remote seed və taksonomiya əmrləri idempotent və ya qeyri-destruktiv sayılmamalıdır. SQL-i və hədəf environment-i ayrıca yoxlayın.

Prisma `DateTime` sahələri D1-də ISO-8601 mətn kimi saxlanılır. Seed, əl ilə SQL və yeni miqrasiya Unix integer yazmamalıdır; qarışıq format Prisma D1 adapterində runtime parse xətasına səbəb olur.

## Testlər

Testlər `@cloudflare/vitest-plugin` ilə `workerd` runtime-da işləyir. Bu, Web Crypto davranışının production-a yaxın olmasını təmin edir.

Audit snapshot-unda 89 test faylı və 373 test aşağıdakı sahələri əhatə edir:

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
  təsnifatı.

Hazırda yoxdur:

- real lokal D1 binding-i ilə integration test;
- Server Action integration test;
- Playwright/Cypress browser E2E.

### GitHub Actions CI

`.github/workflows/ci.yml` hər pull request və `main` push-unda işləyir:

1. `actions/checkout@v4`;
2. `actions/setup-node@v4` — Node versiyası `.nvmrc`-dən (`node-version-file`);
3. `package.json`-dakı `packageManager` dəyərinə uyğun npm-in quraşdırılması;
4. `npm ci`;
5. `npm run test`;
6. `npm run typecheck`;
7. `npm run lint`;
8. `npm run build`;
9. yalnız `main` push-unda və Cloudflare secret-ləri qoyulubsa —
   `npx wrangler d1 migrations list DB --remote` ilə production miqrasiya drift yoxlaması.

3-cü addım qəsdən `npm ci`-dən əvvəldir: onsuz runner-in npm versiyası lock faylının formatı ilə
uyuşmaya bilər və pipeline testlərə çatmadan sınır.

### Son audit nəticəsi

31 avqust 2026, `main`:

| Yoxlama | Nəticə |
|---|---:|
| TypeScript | ✅ Keçdi |
| ESLint | ✅ Keçdi |
| Vitest | ✅ 89 fayl, 373 test |
| Next.js production build | ✅ Keçdi |
| OpenNext production deploy | ✅ Keçdi |

## Məcburi keyfiyyət qapısı

Hər dəyişiklikdən sonra:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Ən azı `typecheck` və `build` işlədilmədən dəyişiklik tamamlanmış sayılmır. Test və lint də cari layihə üçün standart completion qapısının hissəsidir.

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

### Build zamanı D1 binding tapılmır

Data oxuyan səhifənin request-time render olduğunu və Prisma-nın `src/lib/prisma.ts` proxy-si ilə istifadə edildiyini yoxlayın. Modul səviyyəsində `new PrismaClient()` yaratmayın.

### Workers Node binary engine axtarır

Prisma generator output-unu custom qovluğa köçürməyin və client-i paket adı ilə import edin. Standart output `workerd` şərtinin WASM variantını seçməsi üçün qəsdən saxlanılıb.

### Server Action 403 qaytarır

`next.config.ts` `allowedOrigins`, request `Origin`/`Host`, `Sec-Fetch-Site`, session auth kind və permission-u yoxlayın.

### Azərbaycan hərfi ilə axtarış qeyri-sabitdir

Bu, D1/SQLite `LIKE` registr davranışının məlum məhdudiyyətidir. `mode: "insensitive"` D1 provider-də mövcud deyil; uzunmüddətli həll normallaşdırılmış axtarış sahəsidir.

### Şəkil upload lokalda “media anbarı əlçatan deyil” deyir

Miniflare/Wrangler `MEDIA` R2 binding-inin yükləndiyini və route-un OpenNext dev init-dən keçdiyini yoxlayın. Cloudflare Images olmadan original format fallback ola bilər, amma R2 binding olmadan upload edilmir.

### D1 oxunuşunda `Inconsistent column data` və ya tarix parse xətası görünür

Problemli cədvəldə Prisma `DateTime` sütunlarının `typeof()` və dəyərlərini yoxlayın. Tətbiq ISO-8601 mətn gözləyir; Unix integer qalıqları varsa əvvəl backup alın, sonra `0019_normalize_d1_datetime_storage.sql` invariantına uyğun normallaşdırın. Yeni seed və migration-larda tarixləri integer kimi yazmayın.
