# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Layihə haqqında

Luxe Home Estate — Luxe Home Estate MMC (Bakı) üçün daşınmaz əmlak platforması. Next.js 16 App Router (webpack),
React 19, Tailwind CSS v4, Prisma v6. İctimai sayt, kabinet və admin panel AZ/EN/RU dillərindədir;
Azərbaycan dili defoltdur. İnfrastruktur tam Cloudflare-dədir: Workers (OpenNext), D1, R2, Images,
Workers AI və Vectorize. Supabase və PostgreSQL layihədən çıxarılıb.

> Bu fayl `CLAUDE.md`-in qısa variantıdır. Ziddiyyət olduqda `CLAUDE.md` həqiqət mənbəyidir;
> dərin texniki sənəd repodakı `Wiki/` qovluğundadır (GitHub Wiki onun nüsxəsidir).

**Kod dilində konvensiya:** identifikatorlar (dəyişən, funksiya, tip adları) ingiliscədir,
şərhlər və istifadəçiyə görünən sətirlər Azərbaycan dilindədir. Yeni kod da bu qaydaya uyğun yazılır.

## Əmrlər

```bash
npm run dev          # development server (localhost:3000)
npm run build        # prisma generate + next build --webpack (lint/typecheck DAXİL DEYİL)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # Vitest (workerd + Node + real miniflare D1 integration)
npm run dead-code    # Knip: istifadə olunmayan fayl/asılılıq
npm run e2e          # Playwright, E2E_BASE_URL-dəki workerd mühitinə qarşı
npm run e2e:local:build      # lokal stack 1/3: yalnız OpenNext bundle (IS_STAGING=true, localhost:8787)
npm run e2e:local:prepare    # lokal stack 2/3: .wrangler/e2e-state-də təzə D1 + test hesabları (AUTH_SECRET, E2E_ADMIN_TOTP_SECRET)
npm run e2e:local:serve      # lokal stack 3/3: workerd :8787 — ayrı terminalda açıq saxla
E2E_BASE_URL=http://localhost:8787 npm run e2e   # E2E_BASE_URL verilməsə testlər canlı staging-ə gedir

npm run db:migrate:local # D1 miqrasiyalarını lokal tətbiq edir
npx tsx prisma/seed.ts  # sistem/taksonomiya başlanğıc məlumatları (giriş edilə bilən hesab YARATMIR)
npm run db:seed:build # lokal SQLite-dan D1 seed.sql yaradır
npm run db:studio    # Prisma Studio
npm run auth:create-admin     # ilk SUPER_ADMIN üçün INSERT ifadəsi

npm run db:locations:build    # (Python) DSK + Ünvan Reyestri + bazar massivləri → locations-data.ts
npm run db:streets:build      # (Python) rəsmi küçələr → public/data/kuceler/<kod>.json
npm run db:locations:report   # docs/erazi/baki-erazi-bolgusu.md
npm run db:taxonomy:build     # prisma/taxonomy.sql
npm run db:locations:migrations # taxonomy.sql → migrations/0050–0053

npm run preview      # OpenNext bundle + lokal workerd (production runtime-ı)
npm run deploy:staging  # staging: db:migrate:staging → db:taxonomy:staging → deploy:staging
npm run deploy          # PRODUCTION: db:migrate:remote → db:taxonomy:remote → deploy (staging üçün işlətmə)
```

Bundler qəsdən **webpack**-dır (`--webpack`): Turbopack Prisma klientini hash-lı symlink kimi
xaricləşdirir və OpenNext/workerd bundle-ında yoxlanmayıb. `"use server"` faylındakı hər ixrac
`async` olmalıdır — bu yalnız `npm run build`-də yoxlanılır.

Keyfiyyət qapısı `npm run test` + `npm run typecheck` + `npm run lint` + `npm run dead-code` +
`npm run build`-dır — dəyişiklikdən sonra hamısı işlədilməlidir.

Köhnə demo kontent `npm run db:clean-demo:local` və ya açıq production əməliyyatı kimi
`npm run db:clean-demo:remote` ilə təmizlənir.

## Arxitektura

### Route qrupu və marşrutlar

Bütün ictimai səhifələr `src/app/[locale]/(site)/` qrupundadır və `(site)/layout.tsx` Navbar + Footer
sarğısını verir. Marşrut adları azərbaycancadır və URL-in bir hissəsidir:
`/emlaklar`, `/xidmetler`, `/layiheler`, `/haqqimizda`, `/blog`, `/elaqe`.

Query parametrləri də azərbaycancadır və `emlaklar/page.tsx`-də əl ilə map olunur:
`?elan=` (listingType), `?tip=` (əmlak növü), `?seher=` (şəhər), `?min=`/`?max=` (qiymət),
`?otaq=` (otaq sayı), `?siralama=` (sort), `?sehife=` (səhifə).

### Data axını

Səhifələr Server Component-dir və əsasən `src/lib/queries.ts`/domen modullarından oxuyur.
Yazma əməliyyatları public, kabinet və admin Server Action-ları ilə gedir; Route Handler-lar
media, webhook, cron, monitorinq, geocode, tile və hesab köməkçi endpoint-ləri üçündür.

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
Sxem şərhləri ilə sabitlər arasında uyğunsuzluq buglara səbəb olur (məs. `pricePeriod`-un düzgün
dəyəri `MONTH`-dur, `MONTHLY` deyil). Hesab növü siyahılarını əl ilə yazma — `PUBLIC_ACCOUNT_TYPES`,
`LISTING_ACCOUNT_TYPES`, `COMPANY_ACCOUNT_TYPES`, `accountTypeKey()`. Sabitə yeni `*_LABELS` dəyəri
əlavə edəndə admin `labels.*` kataloqunu da yenilə (`admin-label-sync.test.ts`).

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

**Foto üzərində `charcoal`/`navy` tokenini işlətmə.** Tünd rejimdə bu tokenlər açığa dönür:
`bg-charcoal/55` düymə və ya `from-charcoal/90` qradiyent şəkil üzərində ağ mətni oxunmaz edirdi.
Foto üzərindəki çip/düymə üçün `on-image-chip` sinfi (və ya `Badge tone="overlay"`),
qradiyent/modal fonu üçün sabit `black/<opacity>` işlət.

2026 yenilənməsi (#91–#94) konvensiyaları:

- Radius şkalası `globals.css`-dədir (xs 6 · sm 10 · md 12 · lg 16 · xl 20 · 2xl 28 px).
  Düymə və input `rounded-sm`, kart `rounded-lg`/`rounded-xl`, badge və çip `rounded-full`.
- İctimai kart səthi üçün `card-surface` sinfi (hover-də qalxma + kölgə). O və
  `on-image-chip` `@layer components` içindədir — laysız qayda Tailwind utility-lərini
  üstələyirdi, ona görə yeni komponent sinfini də oraya yaz.
- Serif (Playfair) yalnız səhifə/bölmə başlıqlarındadır: qlobal qayda h3/h4-ü sans edir.
  Kiçik **h2** başlığa `font-sans` açıq yazılmalıdır, çünki h1/h2 qlobal olaraq serif-dir.
  Başlıq bazası `@layer base`-dədir ki, utility sinifləri onu üstələyə bilsin — laysız
  yazılsa `font-sans`/`leading-*` başlıqda səssizcə işləmir. Admin paneldə h1–h4
  `admin-surface` ilə sans-dır; admin başlıqlarında `font-display` işlətmə (test qoruyur).
- Tailwind v4 px vahidli arbitrary breakpoint-i (`min-[1360px]:`) rem əsaslı `sm:`/`lg:`-dən
  əvvəl sıralayır və o, səssizcə üstələnir — `min-[85rem]:` kimi rem işlət.

**Responsive qaydalar** (#101 auditi, 49 səhifə × 18 viewport):

- Yalnız breakpoint-də sütun verən grid-ə baza `grid-cols-1` yaz (`grid grid-cols-1 lg:grid-cols-…`).
  Baza olmadan mobil sütun `auto` olur və uşaqdakı üfüqi scroller (qalereya miniatürləri)
  onu min-content enə qədər böyüdüb səhifəni daşdırır.
- `overflow-x-auto` konteyneri `relative` olmalıdır: içindəki `sr-only` (absolute) element
  əks halda kəsilmədən qaçır və sənədi üfüqi daşdırır (admin cədvəli 1024px-də +264px).
- Safe area işləkdir (`viewportFit: "cover"`): fixed/sticky zolaq `--safe-bottom`,
  kənar boşluq `--safe-left/right` işlədir; `Container` bunu özü edir. Kənardan-kənara
  yeni fixed səth (drawer, toast, banner, tam ekran xəritə) də `max(boşluq, --safe-*)` almalıdır.
- Toxunma cihazında input/select/textarea ≥16px-dir (`globals.css`, `pointer: coarse`) —
  iOS fokusda zoom etməsin. Desktop üçün `sm:text-sm` yazmaq təhlükəsizdir.
- Turnstile konteyner eni 300px-dən az olanda `compact` ölçüyə keçir və `ResizeObserver`
  ilə fırlanma/split-screen-də yenidən render olunur; kök `overflow-hidden` saxlanmalıdır —
  əks halda 300px-lik widget öz konteynerini genişləndirir və keçid heç vaxt baş vermir.
- Interaktiv element mobil ekranda ≥44px; mətn linkini böyütmək lazımdırsa layout-u
  dəyişməyən `after:absolute after:-inset-y-3` toxunma sahəsi işlət.

Layout primitivləri: `Container` (max-width + padding) və `Section`.

`Section` şaquli boşluğu **`spacing` propu ilə** verilir (`default` | `cozy` | `compact` | `none`).
Boşluğu `className="py-10 sm:py-12"` ilə əvəzləmə — bazadakı `lg:` sinfi qüvvədə qalır və
override desktopda səssizcə işləmir. Tam əl ilə idarə lazımdırsa `spacing="none"` ver.

### Əmlak filtrləri

URL query parametrləri filtr vəziyyətinin yeganə mənbəyidir. `SearchPanel` göndərdiyi adlarla
`emlaklar/page.tsx` oxuduğu adlar **eyni olmalıdır**: `elan`, `axtaris`, `tip`, `seher`, `rayon`,
`metro`, `metro_yaxin`, `nisangah`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`,
`tikili`, `dovr`, `mertebe_min`, `mertebe_max`, `ilk_mertebe_yox`, `son_mertebe_yox`, `sekilli`,
`xususiyyet`, `sahe` (xəritə poliqonu), `gorunus`, `siralama`, `sehife` (`src/lib/property-search.ts`).
Boş nəticədə `EmptySearchSuggestions` hər çipi çıxaranda qalan elan sayını göstərir — yeni filtr
`CHIP_FIELDS`-ə (`search-relaxation.ts`) də yazılmalıdır.
`elan` dəyəri `LISTING_TYPES` sabitindən gəlir (`SALE` / `RENT`) — azərbaycanca mətn deyil.

`SearchPanel` cari vəziyyəti `useSearchParams` ilə deyil, server komponentindən gələn `initial`
propu ilə alır — bu, ana səhifənin statik render olunmasını qoruyur.

### SEO qatı

`src/lib/seo.ts` bütün metadata və struktur datanı təmin edir:

- `buildMetadata({ title, description, path, image, type })` — canonical + Open Graph + Twitter.
  Hər səhifə `export const metadata` və ya `generateMetadata` içindən bunu çağırır.
- JSON-LD generatorları: `organizationSchema()` (root layout-da, `RealEstateAgent`),
  `propertySchema()`, `articleSchema()`, `serviceSchema()`, `breadcrumbSchema()`.
- `siteUrl(path)` — production-da sabit kanonik hostu, staging/lokal mühitdə `SITE_URL` dəyərini
  işlədir; staging və production bundle-ları buna görə ayrı qurulur. `IS_STAGING=true` hər
  metadata-nı noindex edir.

`getSitemapEntries()` (`queries.ts`) `app/sitemap.ts` və parçalanmış sitemap feed-ləri tərəfindən
istifadə olunur.

### Şirkət məlumatları

Bütün əlaqə, brend və naviqasiya məlumatları `src/config/site.ts`-dədir (`siteConfig`,
`navigation`, `legalNavigation`, `whatsappLink()`). Telefon, ünvan, Instagram
kimi dəyərlər komponentlərdə hardcode edilmir.

Sayt, «Luxe Home Estate» brendi və markası hüquqi şəxs **Əmiyev Bahadur Qafar oğlu**-na məxsusdur
(`siteConfig.owner`). Bu ad footer-dəki müəllif hüququ bildirişində və `organizationSchema()`
struktur datasında göstərilir — dəyişdirilməməlidir.

### Nümunə (demo) məzmun

`Property`, `Project`, `BlogPost`, `Agency`, `AgentProfile` və `Partner` modellərində `isDemo` var.
Görünürlük `/admin/demo-mezmun` açarı (`demo.content_enabled`) ilə idarə olunur: `demoWhere()`
rejim bağlı olanda `{ isDemo: false }`, açıq olanda `{}` qaytarır. Açar yazılmayıbsa staging-də açıq,
production-da bağlıdır. Buna görə `publicPropertyWhere()`, `buildPropertyWhere()` və
`publicPartnerWhere()` **async-dir**. Sitemap/SEO üçün sinxron `indexablePropertyWhere()` /
`indexablePartnerWhere()` həmişə `isDemo: false` daşıyır. Qeydlərin `isDemo` bayrağı heç vaxt
dəyişmir. Nümunə məzmun yalnız staging-ə yüklənir (`npm run db:demo:*`).

### Yerləşmə ağacı və ünvan

Mənbə DSK-nın «İnzibati Ərazi Bölgüsü Təsnifatı, 2024» və Ünvan Reyestridir; `locations-data.ts`,
`taxonomy.sql`, `public/data/kuceler/` və `migrations/0050`–`0053` **generasiya olunur**.

| kind | Məna | Say |
|---|---|---:|
| `CITY` | 11 respublika tabeli şəhər və 64 rayon | 75 |
| `DISTRICT` | Yalnız şəhərdaxili rayon (Bakı 12, Gəncə 2) | 14 |
| `SETTLEMENT` | Rəsmi qəsəbə və rayon tabeli şəhər | 266 |
| `VILLAGE` | Kənd (Bakıda yoxdur) | 3 605 |
| `NEIGHBORHOOD` | Massiv — rəsmi vahid deyil (Bakı 62, Sumqayıt 67, Abşeron 5, Gəncə 2) | 136 |
| `METRO` | Bakı metrosu | 27 |
| `LANDMARK` | Nişangah (`landmarkId`, `?nisangah=`) | 214 |

- Rəsmi status yalnız DSK/Ünvan Reyestrindən gəlir; alternativ yazılış ayrıca yer yaratmır
  (`searchName`-də ` | ` ilə).
- Yer adlarını `compareAzerbaijani()` / `byAzerbaijaniName` ilə sırala — `localeCompare("az")`
  workerd-də etibarsızdır.
- ~3 600 kəndi heç vaxt client-ə birdən göndərmə: filtrdə `villagesWithListings()`, formada
  `/api/yerler/kendler?seher=<id>`. `METRO` və `LANDMARK` `LOCATION_CHILD_KINDS`-ə salınmır.
- Şəhərə aidlik `locationBelongsToCity()` / `landmarkBelongsToCity()` ilə yoxlanılır (ağac iki dərinlikdədir).
- Elanda bir yer yazılır — ən dərin seçim `districtId`; küçə sərbəst mətndir, rəsmi siyahı təklifdir.

Ətraflı: `CLAUDE.md` → «Yerləşmə ağacı» və `Wiki/Location-Taxonomy.md`.

## Cari vəziyyət və bilinən boşluqlar

Ətraflı siyahı və prioritetlər üçün **`MEMORY.md`** faylına bax. Qısa xülasə:

- Admin CRUD, media, moderasiya, təhlükəsizlik, audit, SERP, CRM (lövhə, huni), CSV idxalı,
  premium paketlər (ödəniş uçotu, provayder yoxdur), təqvim + ICS və üçdilli UI hazırdır.
- İctimai sayt: kataloq (metro, nişangah, xəritədə sahə), detal (plan, 360° tur, qiymət göstəricisi),
  `/emlakimi-sat`, `/investisiya`, AI + semantik axtarış (Vectorize), Bilik Mərkəzi AI məsləhətçisi.
- Kabinet: 5 hesab növü, 8 addımlı elan sehrbazı, 60 günlük elan müddəti, paketlər, bildirişlər.
- Auth: staff TOTP (məcburi) + passkey; ictimai parol, Google OIDC və telefon OTP (secret-siz söndürülü).
- Contact/auth formalarında same-origin, honeypot, rate limit və Turnstile qoruması var.
- Açıq boşluqlar: avtomatlaşdırılmış D1 backup/restore, production post-deploy brauzer smoke,
  admin JSX-də legacy xam mətn borcu, Prisma 7 / TS 7 / ESLint 10 / Vitest 5 keçidləri.
- Self-service hesab silinməsi D1 üçün davamlı marker + maintenance retry ilə işləyir;
  `deletionRequestedAt` invariantını yan keçən ayrıca silmə axını yaratma.

## Diqqət tələb edən məqamlar

- **`(site)/template.tsx` sarğısı (`.page-transition`) heç vaxt `transform`/`filter`/`will-change` saxlamamalıdır.**
  Animasiya `both` ilə `translate3d(0,0,0)`-da qalanda sarğı `position: fixed` nəslin containing block-u olur: əmlak
  detalındakı mobil «Zəng et / WhatsApp» zolağı sənədin sonuna düşürdü. İndi yalnız `opacity` + `backwards`
  (`page-transition.test.ts` qoruyur). Səhifə məzmununa sarğı əlavə edəndə də eyni qayda keçərlidir.
- **Analitika razılığı** (`src/components/analytics/`): seçim `analytics_consent` cookie-sindədir və **yalnız brauzerdə**
  oxunur (`consent-store.ts`, `useSyncExternalStore` — server snapshot-ı `pending`). Server cookie-ni oxusa anonim HTML-in
  kənar keşi pozulardı, ona görə `ConsentBanner` server HTML-inə heç vaxt düşmür; bunu `consent-banner.test.tsx` qoruyur.
  Banner `AnalyticsProvider` ilə **DOM-un əvvəlində** render olunur (klaviatura ilk fokus nöqtəsi), qeyri-modal dialoqdur və
  alt kənara yapışan digər səthlərlə eyni ofsetləri işlədir: `--bottom-nav-offset` (mobil alt naviqasiya) və
  `--sticky-bar-offset` (əmlak detalındakı `StickyActionBar`, `body:has([data-sticky-action-bar])`). Footer-dakı və cookie
  siyasətindəki «Cookie parametrləri» düyməsi (`CookiePreferencesButton`) seçimi yenidən açır; razılıq geri çəkiləndə GA
  `ga-disable-<ID>` ilə susdurulur və `_ga*`/`_gid` cookie-ləri silinir. Yeni analitika/izləmə vasitəsi əlavə edəndə onu da
  yalnız `consent === "granted"` şərtində yüklə və geri çəkmədə söndür. Konfiqurasiya olunmuş bundle ilə yoxlamaq üçün:
  `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST npm run e2e:local:build` (staging/lokal bundle-da GA ID yoxdur, `consent.spec.ts` orada atlanır).
- **Tarixi yalnız `src/i18n/date.ts`-dəki köməkçilərlə yaz** (`formatLocalizedDate`, `formatLocalizedDateTime`,
  `formatLocalizedTime`, `formatLocalizedRelative`; üslublar: `long` «29 sentyabr 2026», `short`, `numeric`,
  `monthYear`, `weekday`, `full`). Workers-in yığcam ICU datasında `az` tarix şablonları yoxdur: `Intl.DateTimeFormat("az", …)`,
  `toLocaleDateString` və `next-intl`-in `format.dateTime()` səssizcə kök şablona düşür və saytda «2026 M09 29»
  çıxır. Köməkçilər rəqəmi `en-US` formatter-i ilə **Bakı vaxtında** götürür, ay/həftə günü adı isə öz lüğətindən
  gəlir — server (UTC) və brauzer eyni mətni verir. `scripts/__tests__/date-format-source.test.ts` `src/`-də yeni
  `Intl.DateTimeFormat` / `toLocaleDateString` yazılsa testi yıxır.
- **Bloq üz qabığı** `resolveBlogCover()` (`src/lib/blog-covers.ts`) ilədir: paneldən yüklənmiş `/media/...` şəkli
  həmişə üstündür; yoxdursa ilk 10 bloq yazısı üçün `public/images/blog/<slug>.webp`, yeni yazılar üçün slug-a görə sabit
  seçilən `public/images/categories/*` fotosu göstərilir (`coverUrl` bazaya yazılmır, admin forması şəkli silməz). Hazır
  üz qabıqları `npm run assets:blog-covers` (`scripts/build-blog-covers.mjs`) ilə kateqoriya fotolarından kəsilib
  qurulur; yeni seed yazısı əlavə edəndə `BLOG_COVER_SLUGS`-ə də yaz (`scripts/__tests__/blog-covers-assets.test.ts` yoxlayır).
  Bilik Mərkəzi bələdçilərinin şəkli yoxdursa `KnowledgeCover` (qızılı şəbəkə + auditoriya ikonu) göstərilir.
- Bloq/Bilik Mərkəzi səhifələri ortaq `PageHeader` (`footer` propu — məqalə meta sətri), `ArticleTrustMeta`
  (başlıqlı blok-lar), `FilterChip`/`FilterChipRow` və `SectionHeading` komponentlərini paylaşır; kart `PostCard` /
  `KnowledgeCard` eyni sıra ilə düzülür (şəkil → tarix/kateqoriya → başlıq → xülasə → «Oxu»).
- Production bazası Cloudflare D1-dir. D1 transaction dəstəkləmir; çoxaddımlı yazıları
  idempotent marker/retry və ya kompensasiya ilə dizayn et.
- **D1 bir sorğuda ən çox 100 bound parametr qəbul edir.** Prisma `IN (…)` siyahısını
  98-lik hissələrə bölür, amma `where`-dəki digər şərtləri saymır; nested `children`/`parent`
  relation yüklənməsi də `IN (…)` yaradır. Böyük cədvəldə nested relation əvəzinə düz sorğu +
  JS-də ağac (`location-tree.ts`), uzun id siyahısında `findManyInChunks()` (`d1-chunks.ts`)
  işlət və `*.integration.test.ts` (real miniflare D1) yaz (#74, #85).
- Prisma client `src/lib/prisma.ts`-də D1 binding-i üçün lazy Proxy və WASM client istifadə edir —
  `new PrismaClient()` yazma (istisna: `prisma/` altındakı standalone lokal scriptlər).
- `next.config.ts`-də `images.remotePatterns` `images.unsplash.com` (stok), `media.luxehomeestate.az`
  (R2 custom domain) və `treva.realestate` (rəsmi tərəfdaş) mənbələrinə icazə verir. Yeni xarici
  şəkil mənbəyi əlavə edilərsə bu siyahı və middleware CSP-si (`img-src`) yenilənməlidir.
- Server action-lar layout-dan keçmir: hər action ilk sətirdə öz guard-ını çağırır
  (`requireAdminAction(permission)`, `requirePublicAction(scope)`).
- Admin paneldə dil `User.locale`-dadır: server komponentində `await getAdminT()`, client-də
  `useTranslations("admin")`; `useTranslations()`-ı server komponentində işlətmə.
- Dark mode üçün `dark:` prefiksi yazma — token işlət; foto üzərində `charcoal`/`navy` yox.
- Elan sehrbazı (#113): 8 addım, bütün sahələr DOM-da qalır; elan yazan hər action
  `queuePropertyVectorSync()` və `queueListingEnrichment()` çağırır. Elan şəkli yalnız
  `/media/emlaklar/`-dan qəbul olunur (su nişanı). Qısa ünvan əlavə edəndə `NEVER_CACHED_PREFIXES`-ə yaz.
- `outputFileTracingRoot: import.meta.dirname` qəsdən qoyulub — yuxarı qovluqdakı lockfile-ın
  səhvən workspace kökü kimi seçilməsinin qarşısını alır. Silinməməlidir.
- Yol xəritəsi 1-ci mərhələ (#103) modulları: Telegram lead bildirişi (`src/lib/telegram.ts`,
  secret-lər `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, heç vaxt atmır), elan OG kartı
  (`/api/og/property/[slug]`, WebP → JPEG `IMAGES` ilə), CSV idxalı (`/admin/emlaklar/idxal`,
  həmişə DRAFT, 10 sətirlik partiya), sayt şəkilləri (`site.image_*`, yalnız `/media/...`) və
  boş axtarış təklifləri (`search-relaxation.ts` — yeni filtr `CHIP_FIELDS`-ə də yazılmalıdır).
  Ətraflı qaydalar `CLAUDE.md`-dədir.
- 2-ci mərhələ (#105): `worker.ts` OpenNext-i sarıb anonim ictimai HTML-i 60 s kənarda keşləyir
  (staging/lokal E2E-də söndürülü) — server tərəfdə sessiya oxuyan yeni ictimai marşrut
  `SESSION_DEPENDENT_PUBLIC_ROUTES`-a yazılmalıdır. Qiymət göstəricisi median + ən azı 5 nümunə,
  `/emlakimi-sat` (lead mənbəyi `OWNER`), müraciət lövhəsi və konversiya hunisi.
- 3-cü mərhələ (#107): **`take`-li nested əlaqə 98-dən çox valideyndə D1 sorğusunu ilişdirir** —
  böyük sorğuda şəkilləri `findManyInChunks` ilə ayrıca yüklə. Semantik axtarış Vectorize
  (`PROPERTY_VECTORS`) ilə; elan yazan yeni action `queuePropertyVectorSync()` çağırmalıdır.
  Alt naviqasiya `--bottom-nav-offset` dəyişəni ilə digər sabit səthləri qaldırır.
- 4-cü mərhələ (#109): elan müddəti, açıq qapı, təqvim + ICS, premium paketlər (ödəniş yalnız
  uçotdur, provayder yoxdur; `billing:manage`), Bilik Mərkəzi AI məsləhətçisi (istinadsız cavab
  göstərilmir), admin passkey (TOTP-a alternativ, onu əvəz etmir), Google və telefonla giriş
  (secret-lər olmayanda tam söndürülü). İctimai sessiya yalnız `openPublicSession()` ilə açılır.

## Digər agent konfiqurasiyaları

Sistemdə `~/.codex/config.toml` və `~/.gemini/settings.json` (+ `GEMINI.md`) mövcuddur.
Onları Codex-a köçürmək üçün `/import` yazın — skan nəticəsi nəyin köçürülə biləcəyini
(MCP serverlər, slash əmrləri, subagentlər, skill-lər, təlimatlar) və tətbiq üçün lazım olan
`/import --yes=<digest>` əmrini göstərəcək. `/import` bu mühitdə mövcud deyilsə, terminaldan
`Codex import` işlədin.
