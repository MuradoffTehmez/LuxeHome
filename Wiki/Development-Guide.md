# İnkişaf təlimatı

## Tələblər

- Node.js 20 və ya daha yeni LTS;
- npm və repozitoriyadakı `package-lock.json`;
- remote D1 və deploy üçün Cloudflare hesabı;
- lokal secret-lər üçün `.env`.

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
| `RESEND_FROM_EMAIL` | Göndərən |
| `NOTIFICATION_EMAIL` | Lead bildiriş alıcısı |
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
| `npm run auth:create-admin` | İlk staff user üçün SQL generatoru |

### Deployment

| Əmr | Nəticə |
|---|---|
| `npm run preview:staging` | Staging vars ilə local OpenNext preview |
| `npm run deploy:staging` | `luxehomeestate-staging` Worker |
| `npm run deploy` | Production Worker |

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

## Testlər

Testlər `@cloudflare/vitest-plugin` ilə `workerd` runtime-da işləyir. Bu, Web Crypto davranışının production-a yaxın olmasını təmin edir.

Audit snapshot-unda 21 test faylı aşağıdakı sahələri əhatə edir:

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
- public content guard qaydaları.

Hazırda yoxdur:

- real lokal D1 binding-i ilə integration test;
- Server Action integration test;
- Playwright/Cypress browser E2E;
- GitHub Actions CI.

### Son audit nəticəsi

23 avqust 2026, `main@f7348b2`:

| Yoxlama | Nəticə |
|---|---:|
| TypeScript | ✅ Keçdi |
| ESLint | ✅ Keçdi |
| Vitest | ✅ 21 fayl, 107 test |
| Next.js production build | ✅ Keçdi, 15 statik səhifə yaradıldı |

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
- istifadəçiyə görünən mətnlər azərbaycanca;
- Azərbaycan dilli route və query müqaviləsi qorunur.

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
