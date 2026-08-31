# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layihə haqqında

Luxe Home Estate — Luxe Home Estate MMC (Bakı) üçün daşınmaz əmlak platforması. Next.js 15 App Router,
React 19, Tailwind CSS v4, Prisma v6. Saytın bütün istifadəçi mətnləri Azərbaycan dilindədir.

**İnfrastruktur tam Cloudflare-dədir:** Workers (OpenNext adapteri), D1 (verilənlər bazası),
R2 (media + ISR keşi), Images (şəkil optimizasiyası). Supabase və PostgreSQL layihədən çıxarılıb.

**Kod dilində konvensiya:** identifikatorlar (dəyişən, funksiya, tip adları) ingiliscədir,
şərhlər və istifadəçiyə görünən sətirlər Azərbaycan dilindədir. Yeni kod da bu qaydaya uyğun yazılır.

## Əmrlər

```bash
npm run dev          # development server (localhost:3000)
npm run build        # prisma generate + next build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest (workerd runtime, auth qatının unit testləri)

npm run preview      # OpenNext bundle + lokal workerd (production ilə eyni runtime)
npm run deploy:staging  # staging worker-ə yayım (luxehomeestate-staging)
npm run deploy       # OpenNext bundle + Cloudflare Workers-ə yayım (production)
npm run cf-typegen   # wrangler.jsonc-dən CloudflareEnv tiplərini yenidən yaradır

npm run auth:create-admin  # ilk SUPER_ADMIN üçün INSERT ifadəsi çap edir
npm run db:knowledge:build    # hüquqi mənbə sənədindən DRAFT Knowledge Hub SQL yaradır
npm run db:knowledge:local    # yaradılmış Knowledge Hub SQL-i lokal D1-ə tətbiq edir
npm run db:knowledge:staging  # eyni SQL-i staging D1-ə tətbiq edir
npm run db:knowledge:remote   # eyni SQL-i production D1-ə tətbiq edir
```

Verilənlər bazası (D1) axını:

```bash
npx prisma db push                # lokal prisma/dev.db faylını sxemlə sinxronlaşdırır
npx tsx prisma/seed.ts            # sistem və taksonomiya məlumatlarını lokal fayla yazır
npm run db:seed:build             # lokal fayldan prisma/seed.sql qurur
npm run db:migrate:remote         # migrations/ qovluğunu remote D1-ə tətbiq edir
npm run db:seed:remote            # prisma/seed.sql-i remote D1-ə yükləyir
npm run db:migrate:staging        # eyni miqrasiyalar staging D1-ə
npm run db:seed:staging           # seed staging D1-ə
```

`prisma/seed.ts` **giriş edilə bilən hesab yaratmır**: `SEED_ADMIN_PASSWORD` verilmədikdə
istifadəçilər `passwordHash = "disabled"` və `isActive = 0` ilə yaradılır. Səbəb — `seed.sql`
git-ə commit olunur, orada işlək hash saxlamaq repoya parol yerləşdirmək deməkdir.
Real hesab `npm run auth:create-admin` ilə qurulur.

Yeni miqrasiya: `npm run db:migrate:new -- --output migrations/000N_ad.sql`
(`prisma migrate diff --from-local-d1` işlədir, ona görə əvvəlcə `npm run db:migrate:local`).

Keyfiyyət qapısı: `npm run test` + `npm run typecheck` + `npm run lint` + `npm run build` —
dəyişiklikdən sonra dördü də işlədilməlidir. Testlər `@cloudflare/vitest-plugin` vasitəsilə
workerd runtime-ında (domen qatı) və Node layihəsində (SSR komponentləri) işləyir.

**`npm run build`-i buraxma.** Digər üç qapı təmiz olsa da build sınıq qala bilər: Server
Action qaydaları yalnız webpack mərhələsində yoxlanılır. `"use server"` faylındakı **hər
ixrac** Server Action-dır və **`async` olmalıdır** — Promise qaytaran sinxron sarğı belə
build-i saxlayır (`fix(build): agent rəy action-larını async et`).

Yayımdan əvvəl `npm run preview` ilə workerd runtime-ında yoxlamaq tövsiyə olunur, çünki bəzi
problemlər yalnız orada üzə çıxır.

**Miqrasiyanın repoda olması onun tətbiq edildiyi demək deyil.** Yayımdan əvvəl
`npx wrangler d1 migrations list DB --remote` (və `--env staging`) ilə hər iki mühitin
vəziyyəti yoxlanmalıdır — kod cədvəl gözləyib bazada tapmayanda xəta çox vaxt `try/catch`
içində səssizcə udulur.

## Arxitektura

### Route qrupu və marşrutlar

Bütün ictimai səhifələr `src/app/(site)/` qrupundadır və `(site)/layout.tsx` Navbar + Footer
sarğısını verir. Marşrut adları azərbaycancadır və URL-in bir hissəsidir:
`/emlaklar`, `/xidmetler`, `/layiheler`, `/haqqimizda`, `/blog`, `/elaqe`,
`/bilik-merkezi`, `/lugat`, `/kalkulyator`, `/suallar`.

FAQ iki ayrı məhsul səthidir və yenidən birləşdirilməməlidir:

- `/suallar` — sayt/platforma haqqında 20 əsas sual; mənbə `src/i18n/site-faq.ts`-dir.
- `/bilik-merkezi/suallar` — əmlak və qanunlar üzrə CMS məzmunu; `KnowledgeFaq` modelindən oxuyur.

Query parametrləri də azərbaycancadır və `emlaklar/page.tsx`-də əl ilə map olunur:
`?elan=` (listingType), `?tip=` (əmlak növü), `?seher=` (şəhər), `?min=`/`?max=` (qiymət),
`?otaq=` (otaq sayı), `?siralama=` (sort), `?sehife=` (səhifə).

### Data axını

Səhifələr Server Component-dir və birbaşa `src/lib/queries.ts`-dən oxuyur — ayrıca API qatı yoxdur.
Yazma əməliyyatları Server Action ilə gedir (`(site)/elaqe/actions.ts`, `(site)/favoritler/actions.ts`).

**D1 binding yalnız sorğu kontekstində əlçatandır.** Buna görə:

- `src/lib/prisma.ts` klienti Proxy arxasında lazy qurur (`getCloudflareContext().env.DB`).
  Modul səviyyəsində `new PrismaClient()` yazmaq olmaz — build zamanı çökür.
- Prisma klienti `@prisma/client/wasm.js`-dən idxal olunur. Sadəcə `@prisma/client` yazılsa,
  esbuild `node` şərtini seçir və Workers-də mövcud olmayan binary engine-i yükləməyə çalışır.
- D1-dən oxuyan hər səhifədə `export const dynamic = "force-dynamic"` var — binding build
  vaxtı olmadığı üçün statik prerender mümkün deyil.
- **D1 transaction dəstəkləmir.** `$transaction` ayrı-ayrı sorğulara bölünür, atomarlıq yoxdur.

`queries.ts` mərkəzi qaydaları saxlayır:

- `publicPropertyWhere()` — hər ictimai sorğunun bazası: `deletedAt: null` + status
  `PUBLIC_PROPERTY_STATUSES` içində. **Yeni ictimai əmlak sorğusu yazarkən mütləq bu şərtdən
  başlanmalıdır**, yoxsa qaralama və silinmiş elanlar sızır.
- `propertyCardSelect` / `projectCardSelect` / `postCardSelect` — kart komponentlərinin gözlədiyi
  dəqiq sahə dəsti. Kart komponentləri bu `select`-dən çıxarılan tiplə (`PropertyCardData` və s.)
  yazılıb, ona görə select dəyişəndə komponent tipi avtomatik uyğunlaşır.

### Real Estate Knowledge Hub

Modulun public sorğuları `src/lib/knowledge.ts`, admin yazmaları
`src/app/admin/bilik-merkezi/actions.ts` üzərindən gedir. Məlumat modeli `KnowledgeCategory`,
`KnowledgeArticle`, `KnowledgeTerm` və `KnowledgeFaq` cədvəllərindən ibarətdir.

- Public sorğu yalnız yayımlanmış və soft-delete edilməmiş məzmunu qaytarmalıdır.
- Hüquqi məqalənin `legalStatus`, `riskLevel`, `legalReviewedAt`, `legalActs`, `sourceUrls` və
  strukturlaşdırılmış prosedur/checklist sahələri redaksiya provenance-i üçün saxlanmalıdır.
- HTML həm əsas məzmun, həm də tərcümə yazılarkən sanitizasiya olunur; bunu yalnız render
  sərhədinə köçürmək və ya tərcümə action-ında ötürmək olmaz.
- Bilik məzmunu dəyişəndə `public:knowledge` keşi və əlaqəli list/detail/sitemap yolları
  invalidasiya edilməlidir.
- `docs/Real Estate Knowledge Hub/Real Estate Knowledge Hub.md` hüquqi mənbə materialıdır,
  avtomatik dərc müqaviləsi deyil. `prisma/build-knowledge-hub-sql.ts` qeydləri DRAFT yaradır;
  hüquqşünas/redaktor təsdiqi olmadan PUBLISHED edilməməlidir.

### Domen sabitləri

SQLite native enum dəstəkləmir, buna görə bütün status/rol/kateqoriya dəyərləri `String`-dir və
icazə verilən dəyərlər **yalnız** `src/lib/constants.ts`-də toplanıb: `PROPERTY_STATUSES`,
`LISTING_TYPES`, `RENOVATIONS`, `DOCUMENT_STATUSES`, `PRICE_PERIODS`, `PROJECT_STATUSES`,
`POST_STATUSES`, `LEAD_STATUSES`, `ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`.

Hər dəyər dəsti üçün `*_LABELS` (azərbaycanca göstərilən mətn) və bəziləri üçün `*_TONE`
(badge rəngi) cütü var. **Status sətirini heç vaxt hardcode etmə** — sabitdən istifadə et.
Sxem şərhləri ilə sabitlər arasında uyğunsuzluq buglara səbəb olur; yazma zamanı yalnız
`constants.ts` dəyərlərindən istifadə edilməlidir.

### Autentifikasiya

Bütün auth kodu `src/lib/auth/` altındadır. Qatların bölgüsü qəsdəndir:

| Fayl | Məsuliyyət |
|---|---|
| `password.ts` | Web Crypto PBKDF2-SHA256, 210 000 iterasiya. Format iterasiya sayını daşıyır, `needsRehash()` köhnə hash-ı uğurlu girişdə səssizcə yeniləyir. |
| `crypto.ts` | HKDF açar törəmə, AES-GCM şifrələmə, base64url, `timingSafeEqual`. |
| `totp.ts` | TOTP yoxlaması, QR SVG (server tərəfdə çəkilir), ehtiyat kodlar. Sirr bazada AES-GCM ilə şifrəli saxlanılır. |
| `cookies.ts` | `jose` ilə imzalanan iki cookie: sessiya (`lhe_session`) və ikinci mərhələ (`lhe_2fa`). |
| `cookie-names.ts` | Yalnız sabitlər — `middleware.ts` `next/headers`-i yükləmədən oxuya bilsin deyə ayrıdır. |
| `session.ts` | D1-də saxlanan sessiyalar: yaratma, uzatma, ləğv, siyahı. |
| `session-policy.ts` | Sürüşən (8 saat, hər aktivlikdə uzanır) və mütləq (7 gün) müddət hesabı. |
| `permissions.ts` | `ROLE_PERMISSIONS` matrisi üzrə `hasPermission()`. |
| `lockout.ts` / `rate-limit.ts` | 5 uğursuz cəhddən sonra 15 dəqiqəlik kilid + IP üzrə sürət limiti. |
| `guard.ts` | `requireUser()`, `requirePermission()`, `getOptionalUser()`, `currentSessionId()`. |

Qoruma **iki həlqəlidir və hər ikisi lazımdır**:

1. `src/middleware.ts` — yalnız cookie imzasını yoxlayır. Ucuzdur (D1-ə müraciət yoxdur), amma
   ləğv edilmiş sessiyanı və deaktiv istifadəçini görmür.
2. `requireUser()` / `requirePermission()` — sessiyanı bazadan oxuyur. `admin/layout.tsx`
   bütün panel səhifələrini örtür, **lakin server action-ları layout-dan keçmir**: birbaşa POST ilə
   çağırıla bilir, ona görə hər action öz guard-ını ilk sətirdə çağırmalıdır.

Cookie yalnız imzalanmış sessiya ID-si daşıyır — səlahiyyət hər sorğuda bazadan oxunur.
Stateless JWT qəsdən seçilməyib: işdən çıxan əməkdaşın girişini dərhal bağlamaq mümkün olmalıdır.

Giriş axını: parol → (2FA qurulmayıbsa) `/giris/2fa-qurulumu` → yoxsa `/giris/dogrulama` → sessiya.
Aralıq mərhələ ayrıca `subject`-li cookie ilə işarələnir, ona görə ikinci addımı keçmədən panelə
düşmək mümkün deyil. `?davam=` parametri bu cookie-nin içində daşınır və yalnız `/admin` ilə
başlayan marşrutlar qəbul edilir (açıq yönləndirmə qorunması).

### Admin panelin tərcüməsi

`/admin` locale prefiksi daşımır (`routing.ts`), ona görə `request.ts`-dəki
`getRequestConfig` axını orada işləmir — dil URL-də deyil, `User.locale`-dadır.
Panel öz yolunu işlədir:

- `src/i18n/admin.ts` — `admin` namespace-i, kataloq yükləyicisi və `createTranslator`.
  Bu namespace `MESSAGE_NAMESPACES`-ə **salınmır**: əks halda hər ictimai sorğu panel
  mesajlarını da yükləyərdi. Testlər bunu yoxlayır.
- `src/lib/admin-i18n.ts` — `getAdminI18n()` / `getAdminT()`; `cache()` sayəsində
  sessiya sorğu başına bir dəfə oxunur.
- **Server komponentlərində `useTranslations()` işlətmə** — o, mesajları ictimai request
  konfiqurasiyasından oxuyur və `/admin` üçün həmişə AZ-a düşər. `await getAdminT()` işlət.
  Client komponentləri `useTranslations("admin")` işlədir; mesajlar `admin/layout.tsx`-dəki
  `NextIntlClientProvider` vasitəsilə gəlir.
- **Etiket siyahılarını modul sabiti kimi saxlama.** `const SECTIONS = [{ label: t(...) }]`
  modul yüklənəndə hesablanır və `t`-ni görmür; onları `(t) => [...]` funksiyasına çevir.
- `*_LABELS` sabitləri domen qatının mənbəyidir, panel isə `labels.*` kataloqundan oxuyur.
  İkisinin sinxronluğunu `admin-label-sync.test.ts` qoruyur — sabitə yeni dəyər əlavə
  edəndə kataloqu da yenilə.
- Paneldən ictimai sayta gedən keçidlər `localizePath(path, locale)` ilə qurulur ki,
  redaktor öz panel dilindəki səhifəni açsın.

### Dizayn sistemi və dark mode

`src/app/globals.css` Tailwind v4 `@theme` bloku ilə brend tokenlərini elan edir
(`--color-ivory`, `--color-navy`, `--color-gold`, `--color-ink*`, `--color-line*`, semantik
`success`/`warning`/`danger`/`info`). Kontrast nisbətləri şərhlərdə qeyd olunub — token
dəyişdirilərkən WCAG uyğunluğu yoxlanmalıdır.

Dark mode `dark:` variantları ilə **deyil**, `.dark` klassı altında eyni CSS dəyişənlərinin
yenidən təyini ilə işləyir (`next-themes`, `attribute="class"`). Nəticədə komponentlərdə
`bg-ivory text-ink` kimi tək yazılış hər iki temada düzgün görünür.
**Yeni komponentdə `dark:` prefiksi yazma** — token istifadə et, əks halda dark mode-da qırılır.

Dark rejim üçün mətn və sərhəd tokenləri ayrıca təyin olunub (`--color-ink-soft`,
`--color-ink-muted`, `--color-line`, `--color-line-strong`). Bunlar açıq rejimdəki dəyərlərlə
eyni saxlanılmamalıdır — əks halda tünd fonda kontrast WCAG həddindən aşağı düşür.

Layout primitivləri: `Container` (max-width + padding) və `Section`.

`Section` şaquli boşluğu **`spacing` propu ilə** verilir (`default` | `cozy` | `compact` | `none`).
Boşluğu `className="py-10 sm:py-12"` ilə əvəzləmə — bazadakı `lg:` sinfi qüvvədə qalır və
override desktopda səssizcə işləmir. Tam əl ilə idarə lazımdırsa `spacing="none"` ver.

### Əmlak filtrləri

URL query parametrləri filtr vəziyyətinin yeganə mənbəyidir. `SearchPanel` göndərdiyi adlarla
`emlaklar/page.tsx` oxuduğu adlar **eyni olmalıdır**: `elan`, `axtaris`, `tip`, `seher`, `rayon`,
`otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `siralama`, `sehife`.
`elan` dəyəri `LISTING_TYPES` sabitindən gəlir (`SALE` / `RENT`) — azərbaycanca mətn deyil.

`SearchPanel` cari vəziyyəti `useSearchParams` ilə deyil, server komponentindən gələn `initial`
propu ilə alır — bu, ana səhifənin statik render olunmasını qoruyur.

### SEO qatı

`src/lib/seo.ts` bütün metadata və struktur datanı təmin edir:

- `buildMetadata({ title, description, path, image, type })` — canonical + Open Graph + Twitter.
  Hər səhifə `export const metadata` və ya `generateMetadata` içindən bunu çağırır.
- JSON-LD generatorları: `organizationSchema()` (root layout-da, `RealEstateAgent`),
  `propertySchema()`, `articleSchema()`, `serviceSchema()`, `breadcrumbSchema()`.
- `siteUrl(path)` — `SITE_URL` üzərindən mütləq URL qurur. Dəyər runtime-da oxunur, ona görə
  eyni build həm production, həm staging worker-inə yayımlana bilir.

`app/sitemap.ts` `getSitemapEntries()`-i çağırır və `force-dynamic`-dir (D1-dən oxuyur).
`app/robots.ts` `/admin`, `/giris` və `/favoritler` marşrutlarını indeksdən kənarlaşdırır.

### Cloudflare infrastrukturu

`wrangler.jsonc` bütün binding-ləri saxlayır. Dəyişiklikdən sonra `npm run cf-typegen`
işlədilməli, `cloudflare-env.d.ts` yenilənməlidir.

| Binding | Resurs | Təyinat |
|---|---|---|
| `DB` | D1 `luxehome-db` | Əsas verilənlər bazası (Prisma + `@prisma/adapter-d1`) |
| `MEDIA` | R2 `luxehome-media` | Admin paneldən yüklənən şəkillər |
| `NEXT_INC_CACHE_R2_BUCKET` | R2 `luxehome-next-cache` | OpenNext ISR keşi |
| `IMAGES` | Cloudflare Images | `next/image` optimizasiyası |
| `ASSETS` | Static assets | `.open-next/assets` |
| `WORKER_SELF_REFERENCE` | Worker `luxehomeestate` | ISR revalidate çağırışları |

`vars` bölməsi: `ADMIN_ENABLED` (idarə paneli qapısı), `SITE_URL`.

Yayım: `npm run deploy`. Worker adı `luxehomeestate`, ünvan
`https://luxehomeestate.amiyevbahadur.workers.dev` və `luxehomeestate.az`.

#### Staging mühiti

`wrangler.jsonc`-dəki `env.staging` bloku production-dan **tam ayrı** resurslar işlədir.
Binding-lər `env.staging` içində təkrar yazılıb; təkrar yazılmasaydı staging səssizcə prod
resurslarına bağlanardı.

| Resurs | Production | Staging |
|---|---|---|
| Worker | `luxehomeestate` | `luxehomeestate-staging` |
| D1 | `luxehome-db` | `luxehome-db-staging` |
| R2 media | `luxehome-media` | `luxehome-media-staging` |
| R2 ISR keş | `luxehome-next-cache` | `luxehome-next-cache-staging` |
| `ADMIN_ENABLED` | `"false"` | `"true"` |
| Ünvan | `luxehomeestate.az` | `luxehomeestate-staging.amiyevbahadur.workers.dev` |

Staging custom domain almır və `robots.txt`-də tam `Disallow: /` verir — indeksləşməməlidir.
Secret-lər mühit üzrə ayrıdır: `npx wrangler secret put <AD> --env staging`.
**`AUTH_SECRET` staging və production-da fərqli olmalıdır** — eyni olarsa, staging-də verilmiş
sessiya cookie-si production-da da imza yoxlamasından keçər.

### Şirkət məlumatları

Bütün əlaqə, brend və naviqasiya məlumatları `src/config/site.ts`-dədir (`siteConfig`,
`navigation`, `legalNavigation`, `whatsappLink()`). Telefon, ünvan, Instagram
kimi dəyərlər komponentlərdə hardcode edilmir.

Sayt, «Luxe Home Estate» brendi və markası hüquqi şəxs **Əmiyev Bahadur Qafar oğlu**-na məxsusdur
(`siteConfig.owner`). Bu ad footer-dəki müəllif hüququ bildirişində və `organizationSchema()`
struktur datasında göstərilir — dəyişdirilməməlidir.

### Demo kontent qoruması

`Property`, `Project`, `BlogPost` modellərində geriyə uyğunluq üçün `isDemo` boolean sahəsi var.
İctimai sorğular yalnız `isDemo: false` qeydlərini qaytarır; seed ictimai məzmun yaratmır.

## Cari vəziyyət və bilinən boşluqlar

**25 avqust 2026-dan etibarən hədəf genişlənib: hər iki PRD sənədinin (`docs/`) tam (100%)
koda köçürülməsi uzunmüddətli məqsəddir, təkcə Phase 1 MVP deyil.** Ardıcıl iş rejimi və
təsdiqlənmiş alt-layihə sırası üçün `MEMORY.md` bölmə 10-a bax.

Ətraflı siyahı və prioritetlər üçün **`MEMORY.md`** faylına bax. Qısa xülasə:

- **Admin auth və əsas CRUD hazırdır.** PBKDF2 parol, məcburi TOTP 2FA, D1 sessiyaları,
  RBAC, dashboard, əmlak/layihə/xidmət/bloq/lead/media/istifadəçi/parametr axınları və audit
  jurnalı işləyir. Panel production-da `ADMIN_ENABLED="true"` ilə açıqdır.
- **İctimai sayt və admin panel AZ/EN/RU dillərindədir.** İctimai marşrutlar locale
  prefikslidir; panel isə qəsdən prefiks daşımır və dili `User.locale`-dan götürür
  («Hesabım» → «Panel dili»). Tərcümə kataloqları parity testi ilə qorunur.
- Əlaqə və auth formaları same-origin, honeypot, IP sürət limiti və Cloudflare Turnstile ilə
  qorunur. Turnstile gizli açarı Worker secret-i kimi saxlanılır.
- Əmlak filtrlərinin bütün dəstəklənən sahələri, o cümlədən `featureSlugs`, UI-a bağlıdır.
- Media yükləmə admin və kabinet üçün R2 + Cloudflare Images axını ilə işləyir; magic-byte,
  ölçü və MIME yoxlamaları tətbiq olunur.
- Public ağacda route səviyyəli `loading.tsx` qəsdən istifadə edilmir: Suspense streaming
  başlıqları erkən göndərib `notFound()` cavablarının düzgün 404 statusunu poza bilər.
  Keçid geribildirimi `(site)/template.tsx` və `NavigationProgress` ilə, Suspense sərhədi
  yaratmadan verilir. Admin/kabinet kimi 404 semantikası tələb etməyən ağaclarda skeleton var.
- GitHub Actions CI `test + typecheck + lint + build` qapılarını hər PR və `main` push-unda
  işlədir. Cloudflare secret-ləri qoyularsa `main` push-unda remote D1 miqrasiya vəziyyəti də
  yoxlanılır. Avtomatlaşdırılmış browser E2E hələ yoxdur.

## Diqqət tələb edən məqamlar

- **Verilənlər bazası Cloudflare D1-dir (SQLite).** `mode: "insensitive"` D1-də dəstəklənmir və
  yazılmamalıdır. Azərbaycanca registrsiz axtarış `src/lib/search-normalization.ts` və
  `Property.searchText` / taksonomiya `searchName` sütunları ilə həll olunur. Əmlak və
  taksonomiya yazma axınlarında bu normallaşdırılmış sahələri doldurmağı unutma.
- Prisma client `src/lib/prisma.ts`-dəki singleton üzərindən istifadə olunur — `new PrismaClient()`
  yazma (istisna: `prisma/` altındakı standalone scriptlər).
- `next.config.ts`-də `images.remotePatterns` `images.unsplash.com` (stok şəkillər) və
  `media.luxehomeestate.az` (R2 custom domain) mənbələrinə icazə verir. Yeni mənbə əlavə
  edilərsə bu siyahı yenilənməlidir.
- `next/image` optimizasiyası Cloudflare `IMAGES` binding-i üzərindən gedir (`wrangler.jsonc`).
- Gizli dəyərlər `.env`-də deyil, Cloudflare secret-lərindədir:
  `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL`.
  Yenisi `npx wrangler secret put <AD>` ilə əlavə olunur.
- `process.env` Workers-də yalnız sorğu kontekstində doludur. Modul səviyyəsində oxunan
  konfiqurasiya boş qalır — `src/lib/email.ts`-dəki kimi lazy funksiya işlət.
- `outputFileTracingRoot: import.meta.dirname` qəsdən qoyulub — yuxarı qovluqdakı lockfile-ın
  səhvən workspace kökü kimi seçilməsinin qarşısını alır. Silinməməlidir.

## Digər agent konfiqurasiyaları

Sistemdə `~/.codex/config.toml` və `~/.gemini/settings.json` (+ `GEMINI.md`) mövcuddur.
Onları Claude Code-a köçürmək üçün `/import` yazın — skan nəticəsi nəyin köçürülə biləcəyini
(MCP serverlər, slash əmrləri, subagentlər, skill-lər, təlimatlar) və tətbiq üçün lazım olan
`/import --yes=<digest>` əmrini göstərəcək. `/import` bu mühitdə mövcud deyilsə, terminaldan
`claude import` işlədin.
