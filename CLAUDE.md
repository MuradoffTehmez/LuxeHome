# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layihə haqqında

Luxe Home Estate — Luxe Home Estate MMC (Bakı) üçün daşınmaz əmlak platforması. Next.js 16 App Router (webpack),
React 19, Tailwind CSS v4, Prisma v6. İctimai sayt, kabinet və admin panel AZ/EN/RU dillərindədir;
Azərbaycan dili defoltdur.

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
npm run dead-code    # Knip: istifadə olunmayan fayl və asılılıqlar
npm run test         # vitest (workerd runtime, auth qatının unit testləri)
npm run e2e          # canlı/konfiqurasiya edilmiş workerd mühitinə qarşı Playwright
npm run e2e:local:build    # lokal stack üçün OpenNext bundle (IS_STAGING=true, localhost)
npm run e2e:local:prepare  # .wrangler/e2e-state-də təzə D1 + test hesabları (AUTH_SECRET, E2E_ADMIN_TOTP_SECRET)
npm run e2e:local:serve    # lokal workerd :8787; sonra E2E_BASE_URL=http://localhost:8787 npm run e2e

npm run preview      # OpenNext bundle + lokal workerd (production ilə eyni runtime)
npm run deploy:staging  # staging worker-ə yayım (luxehomeestate-staging)
npm run deploy       # OpenNext bundle + Cloudflare Workers-ə yayım (production)
npm run cf-typegen   # wrangler.jsonc-dən CloudflareEnv tiplərini yenidən yaradır

npm run auth:create-admin  # ilk SUPER_ADMIN üçün INSERT ifadəsi çap edir
npm run db:locations:build    # rəsmi inzibati-ərazi JSON-undan locations-data.ts yaradır
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

Keyfiyyət qapısı: `npm run test` + `npm run typecheck` + `npm run lint` + `npm run dead-code` +
`npm run build` — dəyişiklikdən sonra beşi də işlədilməlidir. Testlər `@cloudflare/vitest-plugin` vasitəsilə
workerd runtime-ında (domen qatı) və Node layihəsində (SSR komponentləri) işləyir.

Bu beşlikdən **ayrı** olaraq CI `npm audit --audit-level=high` işlədir. O, kod keyfiyyətini
deyil, asılılıqları yoxlayır, ona görə lokalda yalnız `package.json`/`package-lock.json`
dəyişdikdə işlətmək lazımdır.

`.github/dependabot.yml` üç major-u upstream uyğunsuzluğuna görə `versions` ilə saxlayır:
`typescript >=7` (typescript-eslint TS `<6.1` tələb edir), `eslint >=10` (`eslint-plugin-react`
çökür), `vitest >=5` (`@cloudflare/vitest-plugin` peer `^4`). Plugin dəstək verəndə sətri sil.
CI build-də `next/font` Google Fonts-dan keçici xəta verə bilər — job-u bir dəfə yenidən işlət.

**Bundler webpack-dır.** Next 16 defolt olaraq Turbopack işlədir, lakin `build` və `dev`
skriptləri `--webpack` bayrağı ilə qəsdən webpack-da saxlanılır: Turbopack Prisma klientini
hash-lı `@prisma/client-<hash>` symlink-i kimi xaricləşdirir, bu isə OpenNext/workerd bundle-ında
`@prisma/client/wasm.js` idxal qaydası ilə yoxlanmayıb (Windows-da symlink `EPERM` ilə düşür).
Turbopack-a keçid ayrıca, `npm run preview` + staging E2E ilə sınanmalıdır.

`revalidateTag()` Next 16-da ikinci arqument tələb edir. `revalidatePublicContent()` Next 15
davranışını (teq dərhal bitir) `{ expire: 0 }` ilə saxlayır — `"max"` stale-while-revalidate
verir və redaktor dəyişikliyi gecikmə ilə görərdi.

**`npm run build`-i buraxma.** Digər üç qapı təmiz olsa da build sınıq qala bilər: Server
Action qaydaları yalnız webpack mərhələsində yoxlanılır. `"use server"` faylındakı **hər
ixrac** Server Action-dır və **`async` olmalıdır** — Promise qaytaran sinxron sarğı belə
build-i saxlayır (`fix(build): agent rəy action-larını async et`).

Yayımdan əvvəl `npm run preview` ilə workerd runtime-ında yoxlamaq tövsiyə olunur, çünki bəzi
problemlər yalnız orada üzə çıxır.

**Miqrasiyalar CI tərəfindən tətbiq olunur.** `main`-ə push zamanı hər deploy job-u
öz mühitinin miqrasiyalarını **bundle-dan əvvəl** tətbiq edir (`d1 migrations apply`),
sonra worker-i yayımlayır. Sıra məcburidir: əvvəlcə worker getsə, sxem gəlincəyə qədər
sorğular çökür və xəta çox vaxt `try/catch` içində səssizcə udulur.

Lokal və ya təcili yayımda eyni sıra əl ilə saxlanmalıdır — əvvəlcə
`npm run db:migrate:remote` (və ya `:staging`), sonra `npm run deploy`.

### GitHub development workflow

Standart axın `Issue → Branch → Commit → Pull Request → CI → Review → Merge → Issue close`-dur.
Birbaşa `main`-də işləmə. Branch adı `<tip>/<issue-id>-<qisa-tesvir>` formatındadır; icazəli
prefikslər `feat`, `fix`, `perf`, `docs`, `refactor`, `test`, `chore`, `security`-dir.
Commit-lər Conventional Commits formatında, kiçik və atomic olmalıdır. PR təsvirində
`Closes #<issue-id>` yazılır.

GitHub Actions üçüncü tərəf action-ları tam commit SHA ilə pin edir. CI/CD, CodeQL,
dependency review, Dependabot, CODEOWNERS və labeler qaydaları `.github/` altındadır;
GitHub UI parametrlərinin authoritative sənədi `docs/github-governance.md`-dir. Solo maintainer
rejimində məcburi approval qoyulmur, çünki müəllif öz PR-ını təsdiqləyə bilmir.

## Arxitektura

### Route qrupu və marşrutlar

Bütün ictimai səhifələr `src/app/[locale]/(site)/` qrupundadır və `(site)/layout.tsx` Navbar + Footer
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

Səhifələr Server Component-dir və əsasən `src/lib/queries.ts` və domen kitabxanalarından oxuyur.
Public JSON API qatı əsas data oxu mənbəyi deyil; yazmalar public, kabinet və admin ağaclarındakı
Server Action-larla gedir. Route Handler-lar media, webhook, cron, monitorinq, geocode, tile və
hesab köməkçi endpoint-ləri üçündür.

**D1 binding yalnız sorğu kontekstində əlçatandır.** Buna görə:

- `src/lib/prisma.ts` klienti Proxy arxasında lazy qurur (`getCloudflareContext().env.DB`).
  **Klient sorğu başına yaradılır** (OpenNext `ctx`-i açarı ilə `WeakMap`). İzolyat boyu
  paylaşılan klient yarımçıq kəsilmiş sorğuda ilişəndə sonrakı bütün sorğular workerd
  tərəfindən «hung» kimi 500-ə çevrilirdi (#96) — modul səviyyəsində klient/promise saxlama.
  Modul səviyyəsində `new PrismaClient()` yazmaq olmaz — build zamanı çökür.
- Prisma klienti `@prisma/client/wasm.js`-dən idxal olunur. Sadəcə `@prisma/client` yazılsa,
  esbuild `node` şərtini seçir və Workers-də mövcud olmayan binary engine-i yükləməyə çalışır.
- D1-dən oxuyan hər səhifədə `export const dynamic = "force-dynamic"` var — binding build
  vaxtı olmadığı üçün statik prerender mümkün deyil.
- **D1 transaction dəstəkləmir.** `$transaction` ayrı-ayrı sorğulara bölünür, atomarlıq yoxdur.
- Self-service hesab silinməsi buna görə iki mərhələlidir: əvvəl `isActive = false` və
  `deletionRequestedAt` eyni `User.update`-da yazılır, sonra elanlar arxivlənib hesab silinir.
  İkinci mərhələ alınmasa `runPhase2Maintenance()` marker-li hesabı idempotent yenidən sınayır.
  Bu marker-i və maintenance retry-sini yan keçən ayrıca silmə axını yazmaq olmaz.

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
| `password.ts` | Web Crypto PBKDF2-SHA256, **100 000 iterasiya** — Workers runtime-ının yuxarı həddi; daha böyük dəyər `deriveBits()`-də `NotSupportedError` atır və düzgün parolu da rədd edir. Format iterasiya sayını daşıyır, `needsRehash()` köhnə hash-ı uğurlu girişdə səssizcə yeniləyir. Hədd OWASP tövsiyəsindən (600 000) aşağı olduğu üçün kompensasiya parol uzunluğundadır: `STAFF_PASSWORD_MIN = 12`, `PUBLIC_PASSWORD_MIN = 10`. |
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
- Panel JSX-ində istifadəçiyə görünən AZ/EN mətnini xam string kimi yazma; say, status və
  diaqnostika suffix-ləri də kataloqdan gəlməlidir. Kataloq parity testi yalnız üç JSON
  kataloqunun açarlarını müqayisə edir, xam JSX mətnini tutmur. 2 sentyabr auditində qalan
  legacy sətirlər `MEMORY.md` bölmə 5-də ayrıca borc kimi qeyd olunub.
- `*_LABELS` sabitləri domen qatının mənbəyidir, panel isə `labels.*` kataloqundan oxuyur.
  İkisinin sinxronluğunu `admin-label-sync.test.ts` qoruyur — sabitə yeni dəyər əlavə
  edəndə kataloqu da yenilə.
- Paneldən ictimai sayta gedən keçidlər `localizePath(path, locale)` ilə qurulur ki,
  redaktor öz panel dilindəki səhifəni açsın.

### Admin siyahıları: silmə və toplu seçim

- Toplu seçim `components/admin/bulk-selection.tsx`-dir: `BulkSelectionForm` (zolaq, say, təsdiq
  dialoqu) + sətirdə `BulkRowCheckbox` (kartda `AdminListCard select={…}`, cədvəldə ilk sütun).
  Checkbox-lar forma `form="<id>"` ilə bağlanır — siyahı formun içində deyil, çünki sətirlərdə öz
  `<form>`-u olan elementlər var. Server tərəfi `lib/admin/bulk.ts`: `guardedBulk(permission, formData,
  { delete: deleteX })` hər id üçün mövcud tək action-u çağırır (guard, audit, keş onun içindədir),
  bir sorğuda ən çox 100 id. Silmə intent-i həmişə `confirm` ilə verilir.
- İctimai hesab/agentlik silinməsi `deletePublicAccount()`-dur və kabinetdəki özünü silmə ilə eyni
  `requestAccountDeletion()` yolundan keçir — ayrıca `user.delete` yazma.
- Tərəfdaş şəkilləri (`logoUrl/logoLight/logoDark/coverImage`) kənar ünvan ola bilər (TREVA).
  `parseImages()` yalnız `/media/...` qəbul edir, ona görə tərəfdaş action-u formadakı dəyər bazadakı
  ilə eynidirsə kənar ünvanı saxlayır — bunu silsən, ilk saxlamada loqo `null` olur (`migrations/0049`).
- Bazada saxlanan `msg()` markeri (məs. `SeoAlert.message`) server komponentində
  `translateServerMessage(t, text)` ilə göstərilir, xam yazılmır.

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

### Yerləşmə ağacı (şəhər / rayon / qəsəbə / kənd / massiv / metro / nişangah)

Mənbə **Azərbaycanın rəsmi inzibati-ərazi bölgüsüdür**: «İnzibati Ərazi Bölgüsü Təsnifatı, 2024»
(Dövlət Statistika Komitəsi kollegiyasının 16.02.2024 tarixli 2/2 nömrəli qərarı, Milli Məclisin
Aparatı ilə razılaşdırılıb) — <https://e-qanun.az/framework/57325>.

Data axını **generasiyalıdır**, `locations-data.ts` əl ilə redaktə edilmir:

```
prisma/az-admin-divisions.json        # DSK təsnifatından snapshot
prisma/unvanportali-admin-units.json  # Ünvan Reyestri: Bakı + 11 iri şəhər/rayon, rəsmi kodlar
prisma/baku-market-locations.json     # massiv, metro, nişangah, alias (mənbə kodları ilə)
  → npm run db:locations:build        # scripts/build-locations-data.py — ziddiyyətdə dayanır
prisma/locations-data.ts              # generasiya olunur
  → npm run db:taxonomy:build
prisma/taxonomy.sql                   # db:taxonomy:local / :staging / :remote

prisma/unvanportali-streets.json      # Ünvan Reyestrinin rəsmi küçələri (~20 000)
  → npm run db:streets:build          # public/data/kuceler/<rəsmi kod>.json
  → npm run db:locations:report       # docs/erazi/baki-erazi-bolgusu.md
```

Tam mənbə siyahısı, ziddiyyətlərin həlli və hər rayonun siyahısı:
`docs/erazi/baki-erazi-bolgusu.md` (generasiya olunur). CI yalnız `migrations/`-ı tətbiq etdiyi
üçün taksonomiya dəyişikliyi production-a özü-yetərli miqrasiya ilə çatdırılır (`0031`, `0050`).

`Location.kind` səviyyələri (`src/lib/constants.ts` → `LOCATION_KINDS`):

| kind | Məna | Say |
|---|---|---|
| `CITY` | 11 respublika tabeli şəhər **və** 64 rayon — istifadəçinin birinci seçimi | 75 |
| `DISTRICT` | **Yalnız şəhərdaxili** inzibati rayon: Bakının 12, Gəncənin 2 rayonu | 14 |
| `SETTLEMENT` | Rəsmi qəsəbə və rayon tabeli şəhər (Xırdalan, Xudat, Horadiz, Liman) | 266 |
| `VILLAGE` | Kənd (iri şəhərlərdə Ünvan Reyestrinin tam siyahısı) | 455 |
| `NEIGHBORHOOD` | Yaşayış massivi/mikrorayon — **rəsmi inzibati vahid deyil** | 66 |
| `METRO` | Bakı metrosunun stansiyası (Memar Əcəmi-2 daxil); valideyni Bakıdır | 27 |
| `LANDMARK` | Nişangah (ticarət mərkəzi, park, universitet…); valideyni şəhərdir, elanda `landmarkId` | 214 |

Qaydalar:

- **Rəsmi status yalnız DSK/Ünvan Reyestrindən gəlir.** Elan saytlarının «qəs.» yazması qəsəbə
  statusu vermir — belə adlar `NEIGHBORHOOD`-dur. Rəsmi rayon/qəsəbə/kənd `Location.officialCode`
  (8 rəqəm) daşıyır; massiv, metro və nişangahda kod yoxdur.
- **Alternativ yazılış ayrıca yer yaratmır.** «Müşfiqabad», «Kirov qəsəbəsi», «8 km» kimi adlar
  `baku-market-locations.json` → `aliases`-dədir və `searchName`-ə yazılır (` | ` ilə).
- **Nişangah (`LANDMARK`) `LOCATION_CHILD_KINDS`-ə salınmır** — öz sahəsi (`landmarkId`,
  `?nisangah=`) var; validasiya `landmarkBelongsToCity()` ilə növü və şəhəri yoxlayır.
- **Küçə sahəsi sərbəst mətndir**, rəsmi siyahı yalnız təklifdir: `LocationFields` seçimdən yuxarı
  qalxıb kodu olan ilk vahidin `public/data/kuceler/<kod>.json` faylını yükləyir.
- **Rayon `CITY` səviyyəsindədir, `DISTRICT` deyil.** Quba ilə Bakı axtarışda eyni açılan
  siyahıdan seçilir; `DISTRICT` yalnız şəhərin daxilindəki rayon deməkdir.
- **Xırdalan, Novxanı, Masazır, Görədil Abşeron rayonunun altındadır** — nə Bakının rayonu,
  nə ayrıca şəhər. 2026 auditinə qədər belə idi və `migrations/0031` onu düzəldir.
- Rəsmi təsnifatda **Nərimanov, Nəsimi və Yasamal rayonlarında qəsəbə yoxdur.** Orada işlənən
  adlar (mikrorayonlar, Yeni Yasamal) `NEIGHBORHOOD`-dur və rəsmi qəsəbə siyahısına qarışmır.
- Slug valideynin slug-ı ilə prefikslənir (`quba-xinaliq`, `abseron-xirdalan`); Bakı ağacında
  konvensiya ilk seed-dən `baki-<ad>`-dır və dəyişdirilmir. Generator təkrar slug tapanda
  **dayanır** — səssizcə atmaq valideyn əlaqəsini korlayardı.
- Şəhər/rayonla eyniadlı qəsəbə ayrıca qeyd yaratmır: «Binəqədi qəsəbəsi» Binəqədi rayonunun
  mərkəzidir və seçim siyahısında iki dəfə görünməməlidir.
- Kənd siyahısı **seçmədir**: rəsmi 4 244 kənddən Bakıya yaxın rayonlarda tam, turizm və bağ
  bölgələrində bazarda tanınanlar. Tam siyahı açılan menyunu yararsız edərdi.
- Filtr açılışında seçilə bilən səviyyələr `LOCATION_CHILD_KINDS`-dədir. **`METRO` oraya
  salınmamalıdır** — metro Bakının uşağıdır, amma öz filtr sahəsi var; süzülməsə rayon
  açılışında 26 stansiya görünür.
- `/rayon/<slug>` landing-i `DISTRICT`-lə yanaşı qəsəbə, kənd və massivi də açır: hamısı
  `Property.districtId`-də saxlanılır. Səhifə etiketi `kind`-dən qurulur
  (`placeLabelAz()`) — «Maştağa rayonunda» yazmaq yanlış olardı. Sitemap üzrə
  `getIndexableTaxonomyLandings("DISTRICT")` də eyni səviyyə dəstini işlədir.
- **Ağac iki dərinlikdədir.** Rayon şəhərin uşağı, Bakı və Gəncədə qəsəbə isə rayonun
  uşağıdır. Şəhərə aidlik yoxlaması buna görə `locationBelongsToCity()` üzərindən gedir —
  yalnız `parentId`-yə baxmaq Maştağanı səhvən rədd edir. Forma açılışlarında `cityId`
  `getPropertyFormOptions()`-da hesablanır.

Struktur qaydalarını `src/lib/__tests__/locations-tree.test.ts` qoruyur.

### Toplu idxal və sayt şəkilləri

- `/admin/emlaklar/idxal` CSV-dən elan yaradır (#103). Hər sətir `propertySchema`-dan keçir,
  taksonomiya slug və ya adla (diakritiksiz) tapılır, elan **həmişə DRAFT** yaranır.
  `commitPropertyImport` sətirləri `IMPORT_BATCH_SIZE` (10) partiya ilə işləyir — şəkillər
  kənar linkdən yüklənib `putImage()` ilə R2-yə yazılır və Worker subrequest limitinə sığmalıdır.
  Hər sətrin məzmun heşi `Property.importKey`-ə yazılır, bütün əlaqələr yazılandan sonra
  `importCompletedAt` qoyulur (D1-də tranzaksiya yoxdur). Təkrar idxalda marker dolu və ya
  dərc olunmuş qeyd «dublikat», marker boş qaralama isə **davam etdirilir** (qalereya yenidən
  qurulur). Əl ilə yaradılmış eyni başlıq + şəhər + qiymətli elan da dublikatdır. Kənar şəkil
  `readLimited()` ilə axın oxunarkən ölçü limitinə tabedir.
- Ana səhifənin hero/«Haqqımızda»/CTA fotoları `site.image_*` parametrlərindədir
  (`Parametrlər → Saytın şəkilləri`, `getSiteImages()`). Yalnız `/media/...` qəbul olunur;
  boşdursa stok foto göstərilir. Koda yeni sabit Unsplash linki yazma.
- Ana səhifə vitrini `getHomeShowcaseProperties()`-dir: seçilmişlər, çatmayan yer son elanlarla.
  Vitrində 3-dən az elan olanda sahib müraciəti bloku (`OwnerLeadBanner`) çıxır; boş kateqoriya
  «0 elan» yazmır.

### Satıcı axını, qiymət göstəricisi və CRM (#105)

- **Qiymət göstəricisi** (`src/lib/price-benchmark.ts`): elanın m² qiyməti eyni rayon
  (çatmasa şəhər) + növ + elan tipi + valyuta + dövrdəki elanların m² **medianı** ilə
  müqayisə olunur; ən azı `MIN_COMPARABLES` (5) nümunə lazımdır, yoxsa göstərici çıxmır
  (satışda son ehtiyat `NeighborhoodProfile.averagePricePerSqm`). ±10% «bazara uyğun».
  Kartda yalnız «Sərfəli qiymət» (median-dan aşağı) göstərilir; tam müqayisə detaldadır.
  Kart bu üçün `propertyCardSelect`-dəki `typeId/cityId/districtId`-dən istifadə edir.
- **`/emlakimi-sat`**: satıcı səhifəsi + «Evimi qiymətləndir» (`estimateOwnerProperty`,
  öz `VALUATION_LIMIT` limiti, lead yaratmır). Dəqiq qiymətləndirmə müraciəti əlaqə
  formasından `source = OWNER` ilə gedir — forma mənbəni allowlist-dən keçirir
  (`CONTACT` | `OWNER`), başqa dəyər `CONTACT` olur.
- **Müraciət lövhəsi** `/admin/muracietler/lovhe`: status sütunları, sürüşdürmə + kartdakı
  status menyusu (hover/drag olmadan da işləyir), SLA (`leadSla()`: yeni > 24 saat,
  işdə > 3 gün yenilənməyib), «mənə təyin et» (`updateMany` + `assigneeId: null` şərti —
  eyni anda götürmə səssizcə üzərinə yazmır).
- **Konversiya hunisi** `/admin/huni`: dövr üzrə müraciət mərhələləri (kumulyativ), mənbə
  bölgüsü və ən çox baxılan elanlar üzrə baxış → favorit → müraciət. `viewCount` kumulyativdir.

### 3-cü mərhələ modulları (#107)

- **Plan və tur:** `PropertyFloorPlan` (qalereyadan ayrı, kart/qalereya sorğularına düşmür) və
  `Property.virtualTourUrl` — yalnız Kuula/Matterport/Momento360 embed olunur (`tourEmbedUrl`,
  CSP `frame-src`), iframe kliklə yüklənir.
- **Mobil alt naviqasiya** (`mobile-bottom-nav.tsx`): `lg`-dən kiçikdə, detal səhifəsindən başqa.
  Görünəndə `--bottom-nav-offset` təyin olunur; alt kənara yapışan yeni sabit səth
  `bottom-[calc(…+var(--bottom-nav-offset)+var(--bottom-safe-rest))]` işlətməlidir.
- **Metro:** ən yaxın metro `NearbyPlace` (METRO) cədvəlindəndir — kartda çip (≤1,5 km),
  detalda sətir, `?metro_yaxin=1` filtri (≤1 km). Stansiya koordinatı kodda saxlanmır.
- **Xəritədə sahə** (`?sahe=lat,lng;…`, `geo-polygon.ts`): SQL sərhəd qutusunu süzür, dəqiq
  yoxlama JS-də; siyahıda ən çox 1000 namizəd. Server komponentindən client-ə funksiya
  ötürülmür — `areaBaseHref` sətri verilir.
- **Mənzil şahmatı:** `ProjectUnit` (blok/mərtəbə/nömrə/status), admin
  `/admin/layiheler/[id]/menziller` generatoru mövcud blok+nömrəni üzərinə yazmır.
- **Kalkulyatorlar:** `calculateInstallment` (tikintiçi krediti) və investor
  `calculateYield`/`computeDistrictYields` saf modullardadır (`mortgage.ts`,
  `investment-math.ts`, `stats.ts`) — brauzer kalkulyatoru Prisma idxal edən fayla toxunmamalıdır.
- **Workers AI vision** (`runAiVision`, `lib/ai.ts`): `@cf/mistralai/mistral-small-3.1-24b-instruct`,
  ehtiyat `llama-4-scout`; şəkil OpenAI formatlı `image_url` data URL-idir. `llama-3.2-11b-vision`
  işlətmə — Meta lisenziyası hesabda `"agree"` ilə qəbul edilməyibsə hər çağırış `5016` verir və
  foto məsləhətçisi «heç bir şəkil analiz edilə bilmədi» yazırdı.
- **Semantik axtarış** (`semantic-search.ts`): Workers AI `bge-m3` + Vectorize
  (`PROPERTY_VECTORS`, indekslər `luxehome-properties[-staging]`, 1024/cosine). Elan yazan
  hər action `queuePropertyVectorSync()` çağırır (fon, xəta action-u sındırmır); gündəlik cron
  tam yenidən indeksləyir. Binding yoxdursa (lokal E2E) axtarış leksik rejimə düşür.
  Yeni elan yazma yolu əlavə edəndə sinxronizasiyanı da çağır.

### 4-cü mərhələ modulları (#109)

- **Elan müddəti** (`listing-expiry.ts`): sahib/agentlik elanı 60 gün yaşayır, 7 gün qalmış
  xatırlatma, bitəndə `ARCHIVED` + `expiredAt`. Şirkət (STAFF) elanlarına toxunulmur. Kabinetdə
  «Yenilə» 60 gün əlavə edir. Gündəlik iş `runPhase2Maintenance()`-dədir və idempotentdir.
- **Açıq qapı** (`OpenHouse` + `OpenHouseRegistration`): qeydiyyat lead yaradır, tutum və
  qeydiyyatın bağlanma vaxtı `open-house-availability.ts`-dədir (client də işlədir — Prisma yoxdur).
- **Təqvim** `/admin/rezervasiyalar/teqvim` (Bakı vaxtı, UTC+4) və şəxsi ICS abunəsi
  `/api/calendar/<token>` — token «Hesabım»da yaradılır, yenidən yaradılanda köhnə link ölür.
- **Premium paketlər və ödəniş uçotu** (`ListingPackage`, `PackageOrder`, `packages.ts`):
  real ödəniş provayderi **yoxdur** — sifariş kabinetdən və ya paneldən, ödəniş ofisdə/köçürmə
  ilə alınır və `/admin/paketler`-də qeyd olunur. Məbləğ qəpiklə (`*Minor`, tam ədəd), paketin
  adı/müddəti/qiyməti sifarişə kopyalanır. Status keçidləri şərti `updateMany` ilədir (D1-də
  tranzaksiya yoxdur) — ikinci təsdiq premiumu təkrar uzatmır. Geri qaytarma müddəti çıxır.
  İcazə: `billing:manage` (SUPER_ADMIN + ADMIN).
- **Bilik Mərkəzi AI məsləhətçisi** (`knowledge-advisor.ts`): yalnız dərc olunmuş məqalə və
  suallardan leksik seçim → Workers AI → hər iddia `[n]` istinadlı. İstinadsız və ya mövcud
  olmayan mənbəyə istinad edən cavab göstərilmir; mənbə tapılmayanda model çağırılmır.
  Limit `AI_LIMIT` namespace-i, `ai-advisor:` açarı ilə.
- **Passkey (WebAuthn, admin)** — `@simplewebauthn/server` (workerd-də test olunub):
  girişin ikinci mərhələsində TOTP-a **alternativdir**, onu əvəz etmir (TOTP məcburi qalır).
  RP ID `Host`-dan, amma yalnız bizim domenlərdən (`passkey-policy.ts`); challenge imzalı,
  birdəfəlik `lhe_webauthn` cookie-sindədir. `userVerification: "required"`. Passkey domenə
  bağlıdır — `luxehomeestate.az`-da yaradılan workers.dev-də işləmir.
- **Google ilə giriş (ictimai hesab)** — `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` olmayanda
  tam söndürülüdür (düymə yox, marşrut 404). OIDC + PKCE + nonce, state imzalı `lhe_oauth`
  cookie-sində. Bağlama qaydaları `google-login-policy.ts`-dədir: əməkdaş heç vaxt, yalnız
  `email_verified`, təsdiqlənməmiş mövcud hesaba bağlananda parol ləğv olunur (pre-hijacking).
  Yönləndirmə ünvanı: `<SITE_URL>/api/auth/google/callback`.
- **Telefonla OTP girişi** — `SMS_PROVIDER_URL`/`SMS_PROVIDER_TOKEN` olmayanda söndürülüdür.
  Yalnız kabinetdə SMS ilə **təsdiqlənmiş** nömrə (`User.verifiedPhone`, unikal) ilə giriş;
  nömrə ilə hesab yaranmır, cavab nömrənin qeydiyyatda olduğunu bildirmir. Kod HMAC-lə saxlanılır,
  5 dəq / 5 cəhd, 60 s fasilə, saatda 5 kod; göndəriş Turnstile ilə qorunur. Profildə nömrə
  dəyişəndə təsdiq sıfırlanır. Provayder API-si fərqlidirsə yalnız `src/lib/sms.ts` dəyişir.
- **Sessiya açma** `openPublicSession()` (`public-session.ts`) — parol, Google və telefon
  girişi eyni yoldan keçir; ictimai sessiya açan yeni axın da onu işlətməlidir.

### Elan sehrbazı, iyerarxik ünvan, su nişanı, AI SEO və profillər (2026-09)

- **Elan forması 8 addımlı sehrbazdır** (`components/admin/form-wizard.tsx`) — kabinet və admin
  eyni komponenti işlədir. Bütün addımların sahələri DOM-da qalır (yalnız `hidden`), ona görə
  forma son addımda hamısını göndərir. «Növbəti» cari addımı, «Göndər» bütün addımları brauzer
  qaydaları ilə yoxlayır; server xətasında sehrbaz xətalı sahənin addımına keçir. Yeni elanda
  qaralama `localStorage`-a yazılır (`lib/ui/form-wizard.ts`), bərpa formanı `key` ilə yenidən
  qurur — idarə olunmayan sahələrə DOM üzərindən dəyər yazma (kaskad seçimlər sınır).
- **Ünvan pillələri:** Region (kodda, `lib/regions.ts` — 14 iqtisadi rayon, Naxçıvan MR) →
  şəhər/rayon → şəhər rayonu → qəsəbə → kənd → massiv → küçə → bina (`location-fields.tsx`).
  Bazaya yenə **bir** yer yazılır — ən dərin seçim `districtId`; siyahıda olmayan massiv
  `Property.neighborhoodName`, küçə/bina `street`/`building`-dədir və `address` onlardan qurulur
  (CSV idxalında sərbəst qalır). Tam ünvan `formatFullAddress()` (`lib/location-path.ts`) ilə
  göstərilir; kart `shortLocation()` işlədir («Əliabad qəsəbəsi, Naxçıvan»).
- **Su nişanı** (`lib/media/watermark.ts`): ölçü və məsafə şəkil eninə nisbətdir. Təkrar yüklənən
  nişanlı şəkil bayt izi (`Media.checksum`) və ya piksel korrelyasiyası ilə tanınır və ikinci
  dəfə nişanlanmır. Production-da nişan çəkilə bilməsə yükləmə 503 ilə təkrar cəhdə qaytarılır;
  `IS_STAGING` mühitində (lokal E2E) nişansız qəbul olunur. Elan şəkli **yalnız**
  `/media/emlaklar/` qovluğundan qəbul olunur (`isListingMediaUrl`) — profil şəkli (`avatarlar`)
  nişansızdır və elana qoşulmamalıdır.
- **Avtomatik SEO və ALT** (`lib/listing-enrichment.ts`): elan yazan hər action
  `queueListingEnrichment()` çağırır (`queuePropertyVectorSync` kimi — fon, xəta action-u
  sındırmır). AI yoxdursa deterministik mətn yazılır (`lib/seo-copy.ts`). Redaktor SEO sahəsini
  dəyişəndə `seoGeneratedAt = null` olur və generator yalnız boş sahələri doldurur. ALT cümləsi
  faktlardan qurulur, AI yalnız fotodakı sahəni sabit siyahıdan seçir (`lib/image-alt.ts`).
  CSV idxalı `enrichListing(id, { useAi: false })` çağırır — AI-sız, faktlardan dərhal
  (Worker limiti); AI versiyası elan paneldə saxlananda yaranır.
- **Hesab növləri:** USER, OWNER, AGENT, AGENCY, CORPORATE (+ STAFF). Siyahıları əl ilə yazma —
  `PUBLIC_ACCOUNT_TYPES`, `LISTING_ACCOUNT_TYPES`, `COMPANY_ACCOUNT_TYPES`, `accountTypeKey()`.
  Doğum tarixi istəyə bağlıdır və yalnız 18 yaş yoxlaması üçündür (`accounts/profile-fields.ts`).
- Qısa ünvanlar `/elan-yerlesdir`, `/elanlarim`, `/profilim` (`accounts/short-links.ts`) —
  yenisini əlavə edəndə `NEVER_CACHED_PREFIXES`-ə də yaz.

### Kənar HTML keşi (#105)

`wrangler.jsonc` `main`-i `worker.ts`-dir: OpenNext worker-ini sarır və anonim ictimai
HTML-i Cloudflare Cache API-də `EDGE_HTML_CACHE_TTL` saniyə (production-da 60) saxlayır.
Qaydalar `src/lib/edge-html-cache.ts`-dədir və `public-cache-policy.ts`-ə söykənir:
sessiya/2FA/preview cookie-li sorğu, sessiya oxuyan marşrut, panel, auth və API keçir;
açar RSC/router başlıqlarını daxil edir; `Set-Cookie` saxlanmır; `IS_STAGING` olan
mühitdə (staging, lokal E2E) keş söndürülüdür. Nəticə: admin dəyişikliyi anonim
ziyarətçiyə ən çox 60 saniyə gecikmə ilə çatır. **Yeni ictimai səhifə server tərəfdə
sessiya oxuyursa `SESSION_DEPENDENT_PUBLIC_ROUTES`-a əlavə olunmalıdır** — əks halda
bir istifadəçinin HTML-i başqasına verilə bilər (`public-cache-safety.test.ts` qoruyur).
Durable Object sinifləri `worker.ts`-dən yenidən ixrac olunur — sarğını dəyişəndə saxla.

Cloudflare Web Analytics beacon-u (cookie-siz, razılıq tələb etmir) `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`
build dəyişəni olanda ictimai səhifələrə əlavə olunur (`analytics-provider.tsx`).

### Əmlak filtrləri

URL query parametrləri filtr vəziyyətinin yeganə mənbəyidir. `SearchPanel` göndərdiyi adlarla
`emlaklar/page.tsx` oxuduğu adlar **eyni olmalıdır**: `elan`, `axtaris`, `tip`, `seher`, `rayon`,
`metro`, `nisangah`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `siralama`, `sehife`.
`elan` dəyəri `LISTING_TYPES` sabitindən gəlir (`SALE` / `RENT`) — azərbaycanca mətn deyil.

Boş nəticədə `EmptySearchSuggestions` hər aktiv çipi çıxaranda neçə elan qaldığını göstərir
(`search-relaxation.ts`; çip açarı → `PropertyFilters` sahəsi). Yeni filtr əlavə edəndə
`CHIP_FIELDS`-ə də yaz, əks halda təklif siyahısında görünməz.

`SearchPanel` cari vəziyyəti `useSearchParams` ilə deyil, server komponentindən gələn `initial`
propu ilə alır — bu, ana səhifənin statik render olunmasını qoruyur.

### SEO qatı

`src/lib/seo.ts` bütün metadata və struktur datanı təmin edir:

- `buildMetadata({ title, description, path, image, type })` — canonical + Open Graph + Twitter.
  Hər səhifə `export const metadata` və ya `generateMetadata` içindən bunu çağırır.
- JSON-LD generatorları: `organizationSchema()` (root layout-da, `RealEstateAgent`),
  `propertySchema()`, `articleSchema()`, `serviceSchema()`, `breadcrumbSchema()`.
- `siteUrl(path)` — production-da sabit canonical hostu, staging/lokal mühitdə isə `SITE_URL`
  dəyərini istifadə edir. Dəyər həm build, həm request vaxtında işlənə bildiyi üçün staging və
  production bundle-ları ayrı qurulur.

**Elan paylaşım kartı** (`/api/og/property/[slug]?l=az`, #103): foto + qiymət + yer ilə
1200×630 OG şəkli. Media WebP-dir, satori isə WebP-ni etibarlı oxumur — foto `IMAGES` ilə
JPEG-ə çevrilib data URI kimi yerləşir, nəticə də JPEG-ə çevrilir (PNG ~800 KB olur,
WhatsApp ~300 KB-dan böyük önizləməni göstərmir). OG şrifti (Geist) «₼» daşımır — valyuta
kodu `formatOgPrice()` ilə yazılır. Marşrut `/api` altındadır ki, locale middleware-i keçməsin.

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
| `ADMIN_ENABLED` | `"true"` | `"true"` |
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

### Nümunə (demo) məzmun

`Property`, `Project`, `BlogPost`, `Agency`, `AgentProfile` və `Partner` modellərində
`isDemo` boolean sahəsi var. Seed ictimai məzmun yaratmır.

Görünürlük **paneldən idarə olunur** — `/admin/demo-mezmun` səhifəsindəki açar
`demo.content_enabled` parametrini yazır. Məntiq `src/lib/demo-content.ts`-dədir:

- `demoWhere()` — rejim bağlı olanda `{ isDemo: false }`, açıq olanda `{}` qaytarır.
  Hər ictimai sorğu bu şərti spread edir.
- `isDemoContentEnabled()` — `cache()` ilə sorğu başına bir dəfə oxunur. Açar heç
  yazılmayıbsa mühit defoltu işləyir: **staging-də açıq, production-da bağlı**
  (`IS_STAGING`). Paneldəki açar defoltdan üstündür — bazada `"0"` varsa staging-də
  də söndürülü qalır.
- **Qeydlərin `isDemo` bayrağı heç vaxt dəyişmir.** Görünürlük yalnız sorğu şərtindədir;
  toplu status yeniləməsi D1-də tranzaksiya olmadığı üçün yarımçıq qala bilərdi.

Buna görə `publicPropertyWhere()`, `buildPropertyWhere()` və `publicPartnerWhere()`
**async-dir**. Şərti çağıran tərəfə buraxmaq təhlükəli olardı: bir yerdə unudulsa,
rejim saytın yalnız bir hissəsində işləyərdi.

`indexablePropertyWhere()` və `indexablePartnerWhere()` isə sinxrondur və **həmişə**
`isDemo: false` daşıyır. Sitemap, SEO auditi və landing indeksləşdirmə qərarı bunları
işlədir: rejim təqdimat üçün açıldıqda nümunə URL-lərin indeksləşməsi, rejim
söndürüləndən sonra qırıq indeks qeydləri qoyardı.

Məzmun dəsti — 15 kateqoriyanın hər biri üçün 20 elan, 12 yaşayış kompleksi,
6 agentlik, 12 agent, 12 tərəfdaş, 20 bloq yazısı:

```bash
npm run db:demo:build    # prisma/demo-content-data.ts → prisma/demo-content.sql
npm run db:demo:local    # SQL-i lokal D1-ə tətbiq edir (:staging / :remote də var)
npm run db:clean-demo:local  # bütün isDemo qeydlərini silir və açarı söndürür
```

`prisma/demo-content.sql` generasiya olunur — əl ilə redaktə edilməməlidir. Xarici
açarlar ID ilə deyil, `(SELECT id FROM ... WHERE slug = ...)` alt-sorğusu ilə bağlanır,
ona görə eyni fayl hər üç mühitdə işləyir. Faylı tətbiq etməzdən əvvəl həmin bazada
taksonomiya olmalıdır (`db:seed:*` + `db:taxonomy:*`), əks halda FK xətası verir.

**Nümunə məzmun yalnız staging-dədir.** Production bazasına yüklənmir; orada rejim
həm də defolt bağlıdır. Bu, 2 sentyabr 2026-da qəbul edilmiş qərardır.

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
  işlədir. `main` push-unda yayım axını: **quality → deploy-staging → e2e-staging → deploy-production**.
  Hər deploy job-u əvvəlcə öz mühitinin D1 miqrasiyalarını tətbiq edir, sonra bundle qurub
  worker-i yayımlayır. Staging production-dan əvvəl gedir — orada sınarsa production
  toxunulmur. Bundle hər mühit üçün ayrıca qurulur, çünki `SITE_URL` statik səhifələrin
  içinə build vaxtı yazılır.
- **PR-da `Local stack E2E` məcburi yoxlamadır** (#87): bundle lokal workerd-də real D1/R2
  ilə qaldırılır, bütün Playwright dəsti + auth ssenariləri (admin 2FA doğrulaması, toplu
  şəkil yükləmə, kabinet forması, layihələr açarı) işləyir. Giriş formaları Turnstile ilə
  qorunur və test bypass-ı **qəsdən yoxdur** — admin stage cookie ilə TOTP addımından real
  keçir, elan sahibi fixture sessiyası ilə daxil olur (`scripts/e2e/`, `e2e/support/auth.ts`).
- **Browser E2E qurulub** (Playwright, `e2e/`): 190+ test — smoke, filtrlər, detal axını,
  favoritlər, məzmun, i18n, API, SEO, təhlükəsizlik, performans, əlçatanlıq (axe-core) və
  mobil. CI-də staging yayımından sonra işləyir və uğursuz olarsa production yayımını
  saxlayır. Testlər `next dev`-ə deyil, canlı workerd mühitinə qarşı qurulub.

## Diqqət tələb edən məqamlar

- **Verilənlər bazası Cloudflare D1-dir (SQLite).** `mode: "insensitive"` D1-də dəstəklənmir və
  yazılmamalıdır. Azərbaycanca registrsiz axtarış `src/lib/search-normalization.ts` və
  `Property.searchText` / taksonomiya `searchName` sütunları ilə həll olunur. Əmlak və
  taksonomiya yazma axınlarında bu normallaşdırılmış sahələri doldurmağı unutma.
- **D1 bir sorğuda ən çox 100 bound parametr qəbul edir.** Prisma `IN (…)` siyahısını
  98-lik hissələrə bölür, amma `where`-dəki digər şərtləri saymır; nested `children`/`parent`
  relation yüklənməsi də `IN (…)` yaradır. Böyük cədvəldə (yerləşmə ağacı ~700 sətir)
  nested relation əvəzinə düz sorğu + JS-də ağac (`location-tree.ts`), uzun id siyahısında
  `findManyInChunks()` (`d1-chunks.ts`) işlət. Lokal SQLite bunu tutmur — sorğu formasını
  dəyişəndə `*.integration.test.ts` (real miniflare D1, `npm run test`-ə daxildir) yaz (#74, #85).
- **`take`/`orderBy`-li nested əlaqə 98-dən çox valideyndə sorğunu ilişdirir** (xəta atmır,
  workerd «hung» kimi 500 qaytarır). Xəritə görünüşü (200 marker) staging-də buna görə sınırdı
  (#107). 12-24 kartlıq siyahıda `propertyCardSelect` təhlükəsizdir, amma 98-dən çox sətir
  qaytaran sorğuda şəkil kimi əlaqələri əlaqəsiz oxu, sonra `findManyInChunks` ilə ayrıca
  yüklə (`withMapImages()`, `getSeoAuditItems()`; test: `map-query.integration.test.ts`).
- Prisma client `src/lib/prisma.ts`-dəki singleton üzərindən istifadə olunur — `new PrismaClient()`
  yazma (istisna: `prisma/` altındakı standalone scriptlər).
- `next.config.ts`-də `images.remotePatterns` `images.unsplash.com` (stok şəkillər),
  `media.luxehomeestate.az` (R2 custom domain) və `treva.realestate` (rəsmi tərəfdaş media-sı)
  mənbələrinə icazə verir. Yeni mənbə əlavə edilərsə bu siyahı yenilənməlidir.
- `next/image` optimizasiyası Cloudflare `IMAGES` binding-i üzərindən gedir (`wrangler.jsonc`).
- Gizli dəyərlər `.env`-də deyil, Cloudflare secret-lərindədir:
  `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL`,
  `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; istəyə bağlı `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `SMS_PROVIDER_URL`, `SMS_PROVIDER_TOKEN`, `SMS_SENDER` (#109). Yenisi `npx wrangler secret put <AD>` ilə əlavə olunur.
- **Telegram lead bildirişi** (`src/lib/telegram.ts`, #103): əlaqə müraciəti və baxış
  sorğusu ofis çatına gedir. Secret yoxdursa səssizcə buraxılır, `notifyLeadOnTelegram()`
  heç vaxt atmır — müraciət artıq yazılıb, bildiriş xətası onu uğursuz göstərməməlidir.
  Ziyarətçi mətni `escapeHtml()`-dən keçir (HTML `parse_mode`). Hazırlıq `/admin/sistem`-də görünür.
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
