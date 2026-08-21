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

npm run preview      # OpenNext bundle + lokal workerd (production ilə eyni runtime)
npm run deploy       # OpenNext bundle + Cloudflare Workers-ə yayım
npm run cf-typegen   # wrangler.jsonc-dən CloudflareEnv tiplərini yenidən yaradır
```

Verilənlər bazası (D1) axını:

```bash
npx prisma db push                # lokal prisma/dev.db faylını sxemlə sinxronlaşdırır
npx tsx prisma/seed.ts            # demo məzmunu lokal fayla yazır
npm run db:seed:build             # lokal fayldan prisma/seed.sql qurur
npm run db:migrate:remote         # migrations/ qovluğunu remote D1-ə tətbiq edir
npm run db:seed:remote            # prisma/seed.sql-i remote D1-ə yükləyir
```

Yeni miqrasiya: `npm run db:migrate:new -- --output migrations/000N_ad.sql`
(`prisma migrate diff --from-local-d1` işlədir, ona görə əvvəlcə `npm run db:migrate:local`).

Test infrastrukturu yoxdur. **Yeganə keyfiyyət qapısı `npm run typecheck` + `npm run build`-dır** —
dəyişiklikdən sonra hər ikisi işlədilməlidir. Yayımdan əvvəl `npm run preview` ilə workerd
runtime-ında yoxlamaq tövsiyə olunur, çünki bəzi problemlər yalnız orada üzə çıxır.

## Arxitektura

### Route qrupu və marşrutlar

Bütün ictimai səhifələr `src/app/(site)/` qrupundadır və `(site)/layout.tsx` Navbar + Footer
sarğısını verir. Marşrut adları azərbaycancadır və URL-in bir hissəsidir:
`/emlaklar`, `/xidmetler`, `/layiheler`, `/haqqimizda`, `/blog`, `/elaqe`.

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

### Domen sabitləri

SQLite native enum dəstəkləmir, buna görə bütün status/rol/kateqoriya dəyərləri `String`-dir və
icazə verilən dəyərlər **yalnız** `src/lib/constants.ts`-də toplanıb: `PROPERTY_STATUSES`,
`LISTING_TYPES`, `RENOVATIONS`, `DOCUMENT_STATUSES`, `PRICE_PERIODS`, `PROJECT_STATUSES`,
`POST_STATUSES`, `LEAD_STATUSES`, `ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`.

Hər dəyər dəsti üçün `*_LABELS` (azərbaycanca göstərilən mətn) və bəziləri üçün `*_TONE`
(badge rəngi) cütü var. **Status sətirini heç vaxt hardcode etmə** — sabitdən istifadə et.
Sxem şərhləri ilə sabitlər arasında uyğunsuzluq buglara səbəb olur (məs. `add-mocks.ts`-də
`pricePeriod: "MONTHLY"` yazılıb, düzgün dəyər `MONTH`-dur).

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
- `siteUrl(path)` — `NEXT_PUBLIC_SITE_URL` üzərindən mütləq URL qurur.

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

`vars` bölməsi: `ADMIN_ENABLED` (idarə paneli qapısı), `NEXT_PUBLIC_SITE_URL`.

Yayım: `npm run deploy`. Worker adı `luxehomeestate`, ünvan
`https://luxehomeestate.amiyevbahadur.workers.dev` və `luxehomeestate.az`.

### Şirkət məlumatları

Bütün əlaqə, brend və naviqasiya məlumatları `src/config/site.ts`-dədir (`siteConfig`,
`navigation`, `legalNavigation`, `demoStats`, `whatsappLink()`). Telefon, ünvan, Instagram
kimi dəyərlər komponentlərdə hardcode edilmir.

Sayt, «Luxe Home Estate» brendi və markası hüquqi şəxs **Əmiyev Bahadur Qafar oğlu**-na məxsusdur
(`siteConfig.owner`). Bu ad footer-dəki müəllif hüququ bildirişində və `organizationSchema()`
struktur datasında göstərilir — dəyişdirilməməlidir.

`demoStats` — **şirkət tərəfindən təsdiqlənməmiş rəqəmlərdir**, `isDemo: true` ilə işarələnib.

### Demo kontent modeli

`Property`, `Project`, `BlogPost` modellərində `isDemo` boolean sahəsi var. Nümunə kontent bu
bayraqla işarələnir və UI-da `DemoBadge` göstərilir. Real məlumat gələndə bayraq `false` olur.

## Cari vəziyyət və bilinən boşluqlar

Ətraflı siyahı və prioritetlər üçün **`MEMORY.md`** faylına bax. Qısa xülasə:

- **Admin panel hazır deyil və bağlıdır.** `src/app/admin` və `src/app/giris` yalnız mock data ilə
  işləyən UI-dır; auth yoxdur. `src/middleware.ts` `ADMIN_ENABLED !== "true"` olduqda hər iki
  marşrutu 404-ə yönləndirir. Panel işə salınmazdan əvvəl jose JWT sessiyası, rol yoxlaması və
  real CRUD yazılmalıdır.
- Contact form-da rate limit / honeypot / Turnstile yoxdur.
- `emlaklar/page.tsx` `queries.ts`-in dəstəklədiyi filtrlərin hamısını ötürmür
  (xüsusiyyət filtri `featureSlugs` bağlanmayıb).
- Media yükləmə axını yoxdur: R2 bucket (`MEDIA` binding) hazırdır, upload route və admin
  inteqrasiyası yazılmayıb.
- `loading.tsx` fayl(lar)ı yoxdur — səhifə keçidlərində skeleton göstərilmir.
- Test və CI yoxdur.

## Diqqət tələb edən məqamlar

- **Verilənlər bazası Cloudflare D1-dir (SQLite).** `mode: "insensitive"` D1-də dəstəklənmir və
  yazılmamalıdır. SQLite `LIKE` yalnız ASCII hərflərində reqistrdən asılı deyil — `ə`, `ş`, `ç`,
  `ğ`, `ı`, `ö`, `ü` hərfləri **reqistrə həssasdır**. Azərbaycanca mətn axtarışı buna görə
  natamamdır; həll yolu axtarış üçün əvvəlcədən kiçik hərfə salınmış ayrıca sütun saxlamaqdır.
- Prisma client `src/lib/prisma.ts`-dəki singleton üzərindən istifadə olunur — `new PrismaClient()`
  yazma (istisna: `prisma/` altındakı standalone scriptlər).
- `next.config.ts`-də `images.remotePatterns` `images.unsplash.com` (demo şəkillər) və
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
