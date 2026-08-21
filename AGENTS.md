# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Layihə haqqında

Luxe Home Estate — Luxe Home Estate MMC (Bakı) üçün daşınmaz əmlak platforması. Next.js 15 App Router,
React 19, Tailwind CSS v4, Prisma v6. Saytın bütün istifadəçi mətnləri Azərbaycan dilindədir.

**Kod dilində konvensiya:** identifikatorlar (dəyişən, funksiya, tip adları) ingiliscədir,
şərhlər və istifadəçiyə görünən sətirlər Azərbaycan dilindədir. Yeni kod da bu qaydaya uyğun yazılır.

## Əmrlər

```bash
npm run dev          # development server (localhost:3000)
npm run build        # production build — lint + typecheck daxildir
npm run typecheck    # tsc --noEmit
npm run lint         # eslint

npm run db:migrate:local # D1 miqrasiyalarını lokal tətbiq edir
npx tsx prisma/seed.ts  # admin/taksonomiya/xidmət başlanğıc məlumatları
npm run db:seed:build # lokal SQLite-dan D1 seed.sql yaradır
npm run db:studio    # Prisma Studio
```

Test infrastrukturu yoxdur. **Yeganə keyfiyyət qapısı `npm run typecheck` + `npm run build`-dır** —
dəyişiklikdən sonra hər ikisi işlədilməlidir.

Köhnə demo kontent `npm run db:clean-demo:local` və ya açıq production əməliyyatı kimi
`npm run db:clean-demo:remote` ilə təmizlənir.

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
Yazma əməliyyatları Server Action ilə gedir (hazırda yeganə nümunə: `(site)/elaqe/actions.ts`).

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

`getSitemapEntries()` (`queries.ts`) yazılıb, amma `app/sitemap.ts` mövcud olmadığı üçün
hazırda çağırılmır.

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

Ətraflı siyahı və prioritetlər üçün **`MEMORY.md`** faylına bax. Qısa xülasə:

- **Admin panel qismən hazırdır.** Auth, dashboard və real əmlak siyahısı mövcuddur;
  əmlak CRUD və media yükləmə axını hələ tamamlanmayıb.
- **Sınıq daxili linklər:** `/favoritler` (navbar-da 2 yerdə), `legalNavigation`-dakı 3 hüquqi
  səhifə (footer). Hamısı 404 verir.
- `not-found.tsx`, `error.tsx`, `loading.tsx`, `sitemap.ts`, `robots.ts` yoxdur.
- Contact form-da rate limit / honeypot / captcha yoxdur.
- `emlaklar/page.tsx` `queries.ts`-in dəstəklədiyi filtrlərin yalnız bir hissəsini ötürür
  (mətn axtarışı, rayon, sahə, təmir, sənəd statusu, xüsusiyyətlər bağlanmayıb).
- Test və CI yoxdur.

## Diqqət tələb edən məqamlar

- **Verilənlər bazası provayderi hələ seçilməyib** (SQLite dev-dədir, production qərarı verilməyib).
  Yeni sorğu yazarkən SQLite-a xas davranışa bel bağlama. Xüsusilə `contains` filtrləri SQLite-da
  case-insensitive işləyir, PostgreSQL-də isə `mode: "insensitive"` tələb edir.
- Prisma client `src/lib/prisma.ts`-dəki singleton üzərindən istifadə olunur — `new PrismaClient()`
  yazma (istisna: `prisma/` altındakı standalone scriptlər).
- `next.config.ts`-də `images.remotePatterns` yalnız `images.unsplash.com`-a icazə verir; stok
  şəkillər oradandır. Yeni xarici şəkil mənbəyi əlavə edilərsə bu siyahı yenilənməlidir.
- `outputFileTracingRoot: import.meta.dirname` qəsdən qoyulub — yuxarı qovluqdakı lockfile-ın
  səhvən workspace kökü kimi seçilməsinin qarşısını alır. Silinməməlidir.

## Digər agent konfiqurasiyaları

Sistemdə `~/.codex/config.toml` və `~/.gemini/settings.json` (+ `GEMINI.md`) mövcuddur.
Onları Codex-a köçürmək üçün `/import` yazın — skan nəticəsi nəyin köçürülə biləcəyini
(MCP serverlər, slash əmrləri, subagentlər, skill-lər, təlimatlar) və tətbiq üçün lazım olan
`/import --yes=<digest>` əmrini göstərəcək. `/import` bu mühitdə mövcud deyilsə, terminaldan
`Codex import` işlədin.
