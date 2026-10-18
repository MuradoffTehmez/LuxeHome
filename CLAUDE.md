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
npm run assets:blog-covers # bloq üz qabıqlarını (public/images/blog) kateqoriya fotolarından yenidən qurur
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

Bu beşlikdən **ayrı** olaraq CI `npm run audit:gate` işlədir (`npm audit --audit-level=high` +
`audit-allowlist.json`). O, kod keyfiyyətini deyil, asılılıqları yoxlayır, ona görə lokalda yalnız
`package.json`/`package-lock.json` dəyişdikdə işlətmək lazımdır. Yamağı olmayan advisory yalnız
səbəb və bitmə tarixi ilə istisnaya yazılır; müddət bitəndə qapı yenidən yıxılır.

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

Lokal və ya təcili yayımda eyni sıra əl ilə saxlanmalıdır, **hər mühit öz əmrləri ilə**:
staging — `db:migrate:staging` → `db:taxonomy:staging` → `deploy:staging`; production —
`db:migrate:remote` → `db:taxonomy:remote` → `deploy`. `npm run deploy` production URL-i və
`--env=""` ilə qurulur — staging miqrasiyasından sonra işlədilsə production-a yayımlayır.

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
  **Sorğu bitəndə klient `$disconnect()` ilə bağlanır** (#270): hər klient ortaq wasm yaddaşında ~1,6 MB engine
  qurur və workerd onu özü azad etmir — ~2 500 klientdən sonra yaddaş 4 GB-a çatır, `RuntimeError: unreachable` ilə
  bütün D1 marşrutları 500 verir. Sonu `worker.ts` (`trackRequestLifetime`) müəyyən edir; sarğını yan keçmə.
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
- **Axtarış tam mətnlidir** (#134): `searchText` başlıq, xülasə, məzmun, tag, kateqoriya adı və
  hüquqi blokları daxil edir (`knowledgeSearchText()`, `src/lib/knowledge-text.ts` — Prisma-sız,
  generator da onu işlədir). Sorğu sözlərə bölünür və hər söz `AND` şərtidir. Hub `?kateqoriya=`,
  `?teq=` (slug) və `?kim=` filtrlərini, axtarışda lüğət terminləri və FAQ nəticələrini göstərir.
  Tag bazada oxunaqlı adla saxlanılır (`cleanKnowledgeTags()`), URL-də slug işlənir.
- **Keşlənmiş sorğunu `unstable_cache` ilə birbaşa sarma** — `public-cache.ts`-dəki `cachedQuery()`
  `reviveDates()` ilə tarixləri bərpa edir. Keş dəyəri JSON-dur: `Date` sahələri keş dolandan sonra
  sətir qayıdırdı və `Intl.DateTimeFormat().format()` bütün məqalələri 500-ə salırdı (#132).
- Praktiki bələdçilər, əlavə lüğət terminləri və bloq yazıları kodda saxlanılır
  (`prisma/knowledge-guides/`) və `npm run db:guides:build` ilə özü-yetərli miqrasiyaya
  (`migrations/0054_knowledge_guides_and_blog.sql`) çevrilir; `INSERT OR IGNORE` redaktorun
  düzəlişinin üzərinə yazmır. Mənbə URL-ləri yalnız `src/lib/official-sources.ts`-dəki yoxlanmış
  siyahıdan olmalıdır; daxili keçidlərin 404 verməməsini `prisma/__tests__/knowledge-guides.test.ts`
  yoxlayır. Məzmun HTML-i sanitizer-in ağ siyahısına uyğun olmalıdır (məs. `<ol start>` atılır).
- **Redaktor təsdiq axını (#266, PRD 24.2):** məqalə `DRAFT` → `IN_REVIEW` («Təsdiq gözləyir», `submittedById`) →
  `PUBLISHED` (`approvedById`). Qaydalar saf `lib/knowledge-review.ts`-dədir (`knowledgeTransition`): təsdiqə göndərən özü dərc
  edə bilməz (Super Admin istisnadır — tək işçili rejim, yenə `approvedById` yazılır); `riskLevel = LEGAL_REVIEW` məqalə
  `legalReviewedAt` olmadan **heç kim** tərəfindən dərc olunmur; dərc olunmuş məqalənin redaktəsi yenidən təsdiq tələb etmir.
  Təsdiqdə `reviewAfter` `KNOWLEDGE_REVIEW_INTERVAL_DAYS` (180) sonraya qoyulur (gələcəkdədirsə saxlanılır); admin siyahısında
  «Təsdiq gözləyir» və «Yenilənməli» (`KNOWLEDGE_STALE_FILTER`) növbələri. Termin və FAQ təsdiq mərhələsiz işləyir
  (`KNOWLEDGE_SIMPLE_STATUSES`). «Beh və ilkin ödəniş» bölməsi və bələdçisi `0085`-dədir — bələdçi hüquqi yoxlamadan keçmədiyi
  üçün `IN_REVIEW` + `LEGAL_REVIEW` yaranır; hub dərc olunmuş məzmunu olmayan bölməni göstərmir.
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

### Telegram inteqrasiyası və sosial giriş (Telegram, Apple, Facebook)

Əməliyyat (secret-lər, BotFather/Apple/Meta, webhook, rollback): `docs/telegram-and-social-login.md`. Kod `src/lib/telegram-bot/`-dadır
(`src/lib/telegram.ts` köhnə `notifyLeadOnTelegram`/`sendTelegramMessage` imzasını saxlayır və oraya ötürür).

- **Kimlik `User.telegram` deyil.** O, profil əlaqəsidir (istifadəçi adı). Təsdiqlənmiş kimlik `TelegramAccount.telegramUserId`-dir
  (webhook `from.id` = OIDC `id`, mətn kimi); OIDC `sub` ayrıca. İstifadəçi adı/ad/şəkil ilə hesab birləşdirmə yazma.
- **Telegram Login** OIDC + PKCE + state + nonce (`auth/telegram-oidc.ts`, qərarlar saf `telegram-login-policy.ts`). Telegram e-poçt
  vermir: tanınmayan kimlik `/qeydiyyat/telegram` → e-poçt linki → `/hesab/telegram-tesdiqi` (POST) ilə hesab yaranır; mövcud hesab
  Telegram-ı kabinetdən deep-link ilə bağlayır (`linking.ts`: 10 dəq, birdəfəlik, yalnız heş, kimlik webhook hadisəsindən).
- **Apple/Facebook** `AuthIdentity` (provayder + `sub`) üzərindədir, qərarlar `social-login-policy.ts`. Apple e-poçtu təsdiqli sayılır
  (Google qaydası: bağlama, təsdiqsiz hesabın parolu ləğv olunur); Facebook təsdiq bayrağı vermir — mövcud e-poçta bağlanmır, yeni
  hesab `/hesab/sosial-tesdiq` linkindən sonra yaranır. Apple callback `form_post` POST-dur, flow cookie-si `SameSite=None`.
  Yeni sosial provayder əlavə edəndə də e-poçt təsdiq vəziyyətinə görə bu iki yoldan birini seç; GET linki token istifadə etməməlidir.
- **Bağlı giriş üsulları** (kabinet → Profil, `linked-logins*.ts`, sessiya köməkçiləri `linked-login-session.ts`): bağlama
  `start?bagla=1` ilə, hədəf hesab imzalı flow cookie-sindədir və callback-də cari sessiya ilə yoxlanılır — sorğudan gələn
  id-yə etibar etmə. Apple bağlaması POST → imzalı nəticə cookie-si → GET (`?bagla=tamamla`), çünki sessiya cookie-si `Lax`-dır.
  Son giriş yolu ayrılmır (`canUnlinkLogin`).
- **Webhook** `POST /api/telegram/webhook` (`webhook.ts`): secret başlığı sabit vaxtla, 64 KB limit, Zod sxemi, `TelegramUpdate`
  idempotentliyi (emal xətasında qeyd silinir → Telegram təkrarlayır), göndərən üzrə limit. Bot komandaları `bot.ts`, mətnlər `copy.ts`.
- **Bildirişlər:** `notifyAccount` Telegram kanalını da çağırır (`notifyTelegramUser`); qiymət endirimi və «dərhal» saxlanmış axtarış
  da. Göndəriş üç şərtə tabedir: bağlı hesab + `notificationsEnabled` (açıq razılıq; Telegram ilə giriş razılıq deyil) + kateqoriya
  `telegram` sütunu. `SECURITY` kateqoriyadan və sakit saatdan azaddır, razılıqdan yox. Sakit saatda mesaj **səssiz** gedir.
  Çatdırılma `TelegramDelivery` növbəsidir: 429/5xx → `PENDING` + 10 dəqiqəlik cron retry, 403/«chat not found» → hədəf bağlanır.
- **Admin xəbərdarlıqları** `admin-alerts.ts` (ofis çatı + təsdiqlənmiş «ADMIN_ALERTS» qrupları), növlər paneldə ayrıca söndürülür
  (`SETTING_KEYS.TELEGRAM_CONFIG`). Xəbərdarlıqda şikayətçi/dəstək mətni olmur; link panelə aparır, rol yoxlamasını keçmir.
- **Qrup/kanal** yalnız `my_chat_member` hadisəsindən `PENDING` qeydə alınır; admin təsdiqləyib kateqoriya seçmədən göndəriş yoxdur.
  Şəxsi bildirişi qrupa göndərmə. Panel `/admin/telegram` (`settings:manage`), dəstək `/admin/destek` (`lead:manage`).

### Klientə gedən mesajlar (#183)

Kök layout `NextIntlClientProvider`-ə bütün kataloqu deyil, yalnız `src/i18n/client-messages.ts`-dəki
`PUBLIC_CLIENT_MESSAGE_PATHS` yollarını ötürür (AZ-da ~99 KB → ~39 KB hər HTML-də). `account` və `auth` yalnız
`(account)` və `giris` layout-larında `ExtendedMessagesProvider` ilə əlavə olunur (dərin birləşmə). Server komponentləri
mesajları request konfiqurasiyasından oxuyur və siyahıdan asılı deyil. **Client komponentində yeni namespace/açar
işlədəndə siyahıya əlavə et** — `client-messages.test.ts` mənbədəki `useTranslations("…")` çağırışlarını yoxlayır;
siyahıda olmayan açar ekranda adı ilə görünərdi.

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

### Naviqasiya strukturu (UX konsolidasiyası, 2026-10)

- **Admin menyusu** `components/admin/admin-nav.ts`: 11 modul dörd qrupda (Ümumi · Əməliyyatlar · Məzmun və böyümə ·
  Maliyyə və sistem). **Hər səhifənin bir giriş nöqtəsi var** — eyni `href`-i iki modula yazma; `admin-nav.test.ts` həm təkrarı,
  həm də konsolidasiyadan əvvəlki marşrutların menyuda qaldığını yoxlayır. Uzun alt menyuda `section` sahəsi bölmə başlığı verir
  (SERP: monitorinq / məzmun / texniki). Breadcrumb `findAdminNavLocation()`-dan qurulur (`AdminShell`). Marşrutlar dəyişməyib.
- **Menyu rola görə süzülür** (`adminNavForRole`): hər alt bəndin `permission` sahəsi səhifənin guard-ı ilə eyni olmalıdır —
  `scripts/__tests__/admin-nav-permissions.test.ts` mənbədə `requireAdminRead(PERMISSIONS.X)`-i (səhifə və ya layout) yoxlayır.
  Modul linki ilk icazəli alt bəndə yönəlir; breadcrumb da süzülmüş menyudan qurulur. Dashboard blokları (`/admin`) eyni
  icazələrə tabedir — müraciət məlumatını `lead:manage`-siz, elanları `property:manage`-siz göstərmə.
- **Modul tab zolağı** `AdminSectionTabs` (`serp/layout.tsx`, `seo/` və `redirects/` layout-ları, `maliyye/layout.tsx`) menyudan
  qurulur; yeni alət menyuya yazılanda zolaqda da görünür.
- **Elanların təşviqi** `/admin/tesviq` yalnız oxuyan ümumi baxışdır (VIP, irəli çəkmə, paketlər); qərar modulların öz
  səhifəsindədir — VIP/irəli çəkmə/paket məntiqini birləşdirmə.
- **Kabinet menyusu** bölmələrdədir (`groupCabinetItems()` → `CABINET_ITEM_SECTION`); yeni bənd əlavə edəndə bölməsini də yaz
  (`Record` typecheck-də yıxılır). Aktiv bənd ən uzun prefiksdir (`activeCabinetHref`). «Bildirişlər»də oxunmamış sayğac var.
  `CABINET_COLLAPSE_THRESHOLD`-dan çox bənddə passiv bölmələr qatlanmış başlayır (`defaultOpenCabinetSections`).
- **Əməkdaş ictimai saytda:** kabinet yalnız ictimai sessiyanı qəbul edir — header-in «Elan yerləşdir» və mobil alt
  naviqasiyanın «Hesab» düyməsi əməkdaşı panelə (`<a>`, tam yükləmə) aparır. Kabinetə link yazanda bunu nəzərə al.
- «Elanlarım» status tabları `lib/accounts/listing-status-groups.ts`-dədir (`?status=aktiv|yoxlamada|diqqet|baglanmis`).
- **Telegram bildiriş kanalı** — `src/lib/telegram-bot/` (bax «Telegram inteqrasiyası və sosial giriş»). #277-dəki sadə
  `User.telegramChatId` kanalı `0088`-də `TelegramAccount`-a köçürülüb (razılıq açıq qalıb) və sütunlar silinib — bir
  kimlik mənbəyi var. Kabinetin «Parametrlər» tabında `TelegramCard`; bağlanmamış hesabda Telegram sütunu deaktivdir və
  saxlanmış seçim üzərinə yazılmır. Webhook-u panel → Telegram → «Webhook-u qur» quraşdırır (`docs/telegram-and-social-login.md`).
- **Bildiriş mərkəzi** `/kabinet/bildirisler`: əsas görünüş siyahıdır, seçimlər `?gorunus=parametrler` tabındadır; filtr
  vəziyyəti URL-dədir (`lib/notification-filters.ts`, saf). Link əsaslı tab/seqment üçün `components/ui/segmented-tabs.tsx`.

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
  dəyişməyən `after:absolute after:-inset-y-3` toxunma sahəsi işlət. Kiçik checkbox (16–20px) `<label className="inline-grid
  size-11 place-items-center">` ilə sarılır; sıx siyahıda vizual yeri saxlamaq üçün `-m-3.5` (#271 — toplu seçim, bildiriş matrisi).
- **Mobil audit (#271, PRD Modul 24):** yeni modul səhifələri 375/768/1280/1440 px-də üfüqi daşmasız; `e2e/specs/mobile.spec.ts`
  yeni ictimai səhifələri, elan səhifəsinin PRD 26.2 elementlərini (qiymət, əlaqə, şikayət, seçilmişlər) və mobil kabinet
  bölmələrini (auth fixture ilə) yoxlayır. Yeni ictimai səhifəni oradakı `paths` siyahısına əlavə et.

**Seçim sahələri vahid `Combobox`-dur** (`components/ui/combobox.tsx`, #136): ARIA 1.2 combobox +
listbox, diakritikasız axtarış («seki» → «Şəki»), klaviatura (↑↓, PageUp/Down, Enter, Esc, Tab),
loading, boş nəticə mesajı, qrup başlıqları, `mode="free"` + `allowCreate` (küçə, massiv — «“…” əlavə
et»). Forma dəyəri gizli `name` sahəsindədir; `required` görünən sahədə işləyir (sehrbazın «Növbəti»
yoxlaması). Qaydalar:

- `Select` (`ui/field.tsx`) `SEARCHABLE_MIN_OPTIONS` (8) və daha çox variantda özü ComboBox olur;
  qısa siyahı native qalır, görünüş eynidir. Uzun siyahı üçün xam `<select>` və ya `<datalist>` yazma.
- Mətnlər `src/i18n/combobox-messages.ts`-dədir (`useLocale()`): panel client-ə yalnız `admin`
  kataloqunu ötürür, ona görə ortaq UI komponenti JSON kataloqundan oxuya bilməz.
- ComboBox Enter-i seçim üçün işlədəndə `preventDefault` edir; formanın öz Enter emalı
  (`form-wizard.tsx`) `event.defaultPrevented`-ə baxmalıdır, əks halda addım dəyişir.
- Nəzarətsiz rejimdə dəyər siyahıdan çıxanda (şəhər dəyişdi) sıfırlanır — native select kimi.
- `LocationFields` zənciri: Ölkə (sabit) → Region → Şəhər/rayon → Şəhər rayonu → Qəsəbə → Kənd →
  Massiv → Metro/Nişangah → Küçə → Bina. Şəhər seçiləndə region özü dolur; qaralamadan bərpa olunan
  kənd asinxron yüklənən siyahı gələnə qədər `pendingLeafId`-də saxlanılır.

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
prisma/unvanportali-admin-units.json  # Ünvan Reyestri: 76 kök (bütün şəhər/rayonlar), rəsmi kodlar
prisma/baku-market-locations.json     # massiv, metro, nişangah, alias (mənbə kodları ilə)
  → npm run db:locations:build        # scripts/build-locations-data.py — ziddiyyətdə dayanır
prisma/locations-data.ts              # generasiya olunur
  → npm run db:taxonomy:build
prisma/taxonomy.sql                   # db:taxonomy:local / :staging / :remote

prisma/unvanportali-streets.json      # Ünvan Reyestrinin rəsmi küçələri (~63 000)
  → npm run db:streets:build          # public/data/kuceler/<rəsmi kod>.json
  → npm run db:locations:report       # docs/erazi/baki-erazi-bolgusu.md
taxonomy.sql
  → npm run db:locations:migrations   # yerləşmə bölməsi → migrations/0050–0053 (~500 KB-lıq hissələr)
```

Tam mənbə siyahısı, ziddiyyətlərin həlli və hər rayonun siyahısı:
`docs/erazi/baki-erazi-bolgusu.md` (generasiya olunur). Taksonomiya dəyişikliyi özü-yetərli
miqrasiya ilə çatdırılır (`0031`, `0050`–`0053`; ~8 000 ifadə ~500 KB-lıq ardıcıl hissələrə
bölünüb — valideyn uşaqdan əvvəl gəlir). CI hər deploy-da `db:taxonomy:*`-i də işlədir
(`INSERT OR IGNORE` + slug üzrə `UPDATE`, idempotent). **D1 miqrasiyanı fayl adı ilə izləyir:**
`db:locations:migrations` `0050`–`0053`-ü yerində yenidən yazır, amma tətbiq olunmuş faylın
dəyişməsi mövcud bazada yenidən işləmir — mövcud mühitə dəyişiklik taksonomiya addımı ilə çatır.
Taksonomiya SQL-i sətir silmir və slug dəyişikliyini görmür: yer silmə/birləşdirmə, slug dəyişikliyi
və elan köçürmə yeni nömrəli miqrasiya tələb edir.

`Location.kind` səviyyələri (`src/lib/constants.ts` → `LOCATION_KINDS`):

| kind | Məna | Say |
|---|---|---|
| `CITY` | 11 respublika tabeli şəhər **və** 64 rayon — istifadəçinin birinci seçimi | 75 |
| `DISTRICT` | **Yalnız şəhərdaxili** inzibati rayon: Bakının 12, Gəncənin 2 rayonu | 14 |
| `SETTLEMENT` | Rəsmi qəsəbə və rayon tabeli şəhər (Xırdalan, Xudat, Horadiz, Liman) | 266 |
| `VILLAGE` | Kənd — bütün rayonlarda Ünvan Reyestrinin tam siyahısı | 3 605 |
| `NEIGHBORHOOD` | Massiv/mikrorayon/məhəllə — **rəsmi inzibati vahid deyil** (Bakı 62, Sumqayıt 67, Abşeron 5, Gəncə 2) | 136 |
| `METRO` | Bakı metrosunun stansiyası (Memar Əcəmi-2 daxil); valideyni Bakıdır | 27 |
| `LANDMARK` | Nişangah (ticarət mərkəzi, park, universitet…); valideyni şəhərdir (hazırda hamısı Bakı), slug `nisangah-<ad>`, elanda `landmarkId` | 214 |

Qaydalar:

- **Rəsmi status yalnız DSK/Ünvan Reyestrindən gəlir.** Elan saytlarının «qəs.» yazması qəsəbə
  statusu vermir — belə adlar `NEIGHBORHOOD`-dur. Rəsmi rayon/qəsəbə/kənd `Location.officialCode`
  (8 rəqəm) daşıyır; massiv, metro və nişangahda kod yoxdur.
- **Alternativ yazılış ayrıca yer yaratmır.** «Müşfiqabad», «Kirov qəsəbəsi», «8 km» kimi adlar
  `baku-market-locations.json` → `aliases`-dədir və `searchName`-ə yazılır (` | ` ilə).
- **Yer adlarını `compareAzerbaijani()` / `byAzerbaijaniName` (`lib/az-collation.ts`) ilə sırala.**
  `localeCompare(…, "az")` workerd-də etibarsızdır (ICU-da `az` collation-u tam deyil), SQLite-in
  binar `ORDER BY`-ı isə «Ç», «Ə», «Ş» ilə başlayanları sona atır. Generator `order`-i eyni
  `az_key` sırası ilə yazır.
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
- **Kənd siyahısı tamdır (~3 600), amma heç vaxt bir yerdə yüklənmir.** Filtr ağacına
  (`getFilterOptions`) yalnız ictimai elanı olan kəndlər düşür (`villagesWithListings()`);
  forma kəndləri seçilmiş rayon üçün `/api/yerler/kendler?seher=<id>`-dən yükləyir, redaktə
  olunan elanın kəndi `getPropertyFormOptions({ propertyId })` ilə gəlir. AI axtarışının
  promptuna və admin «ictimai imkanlar» siyahısına kənd salınmır. Yeni yer siyahısı yazanda
  `kind: { in: LOCATION_CHILD_KINDS }` ilə bütün kəndləri client-ə göndərmə.
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

**Ərazi səhifələri (#240, PRD 12.4/12.5):** `/rayon/<slug>` (rayon, qəsəbə, kənd, massiv), `/metro/<slug>` və
`/seher/<slug>` (`CITY` — şəhər və rayon; etiket neytral «X üzrə», çünki səviyyə ikisini də əhatə edir) eyni
`getTaxonomyLandingProperties()` + `buildTaxonomyLandingDescriptor()` kontraktındadır: meta, canonical, breadcrumb, FAQ və
ItemList JSON-LD, az məzmunda `seoLandingIndexPolicy` noindex, sitemap `getIndexableTaxonomyLandings(kind)`. İlk səhifədə
«Ərazi haqqında» bloku (`getAreaInsights`, `components/site/area-insights.tsx`): yalnız aktiv təkliflər (`ACTIVE_OFFER_STATUSES`) üzrə satış/kirayə sayı, median
(satış m², aylıq kirayə; `MIN_COMPARABLES`-dən az nümunədə «—»), növ/elan tipi filtr keçidləri, xəritə (`?gorunus=xerite`)
və elanı olan əlaqəli ərazilər (rayonun sayına birbaşa uşaqları da düşür, `districtSlug` filtri kimi). Uydurulmuş bazar rəqəmi göstərilmir — say və median yalnız saytdakı ictimai elanlardandır.

### Funksiya bayraqları (#242, PRD 23, 16.6)

- Açarlar `src/lib/feature-flags-policy.ts`-dədir (saf modul): modul bayraqları (`REPORTS`, `AUTO_MODERATION`,
  `AGENCY_ANALYTICS`, `RATINGS`, `CRM`, `VIP_REQUESTS`, `PROMOTION`, `SUBSCRIPTIONS`, `PAYMENTS`, `NOTIFICATIONS`,
  `LISTING_FRESHNESS`, `EXTRA_VERIFICATION`) və PRD 16.6 monetizasiya açarları. Hamısı tək JSON parametrdə
  (`SETTING_KEYS.FEATURE_FLAGS`); pozulmuş dəyər və naməlum açar defolta qayıdır. Defolt: modullar açıq, ödəniş/monetizasiya/
  özünəxidmət bağlı, `ADMIN_APPROVAL_FOR_VIP` açıq. Asılı açar (`effectiveFeatureFlags`) öz modulu olmadan işləmir.
- Oxu `getFeatureFlags()` / `isFeatureEnabled()` (`lib/feature-flags.ts`, sorğu başına bir dəfə); action üçün hazır xəta
  `featureDisabledFailure()` (`lib/feature-guard.ts` — domen modulları next-intl yükləməsin deyə ayrıdır).
- **Söndürülmüş modul yalnız UI-da gizlənmir:** action, səhifə (404) və API də bağlanır. Hazırda: şikayət (elan + rəy
  action-ları, düymələr), reytinq (rəy yazma/cavab, forma, `/kabinet/reyler`), CRM (`/kabinet/musteriler` layout-u + bütün
  action-lar), agentlik analitikası (səhifə + ixrac API), avtomatik moderasiya (`hold` → `review`, siqnallar yazılır),
  əlavə doğrulamalar (`EXTRA_VERIFICATION`, #268 — sənəd yükləmə action-u və kabinet səhifəsi 404, siyahıdakı «Sənədlər» düyməsi,
  ictimai «Sənədlər/Məlumatlar yoxlanılıb» nişanları; hesab nişanları qalır), e-poçt bildirişləri (`sendEmail({ notification: true })` — hesab bildirişi, uyğun elan, qiymət düşməsi, elan müddəti və
  açıq qapı xatırlatması; tranzaksion məktub buraxılmır, kabinet bildirişi yenə yazılır), elan aktuallığı (gündəlik müddət işi dayanır). Kabinet menyusu
  `hiddenItems` ilə süzülür. Yeni modul yazanda bayrağını da yoxla.
- Mövcud premium paket sifarişi (ofisdə ödəniş) monetizasiya bayrağına bağlanmayıb — Basic/Pro/Premium (Modul 14) onu üstələyəcək.
- **Abunə planları (#244, PRD 16.1–16.5):** `SubscriptionPlan` (kod `BASIC|PRO|PREMIUM` × auditoriya
  `INDIVIDUAL|AGENCY`, unikal) + `SubscriptionPlanPrice` (1/3/6/12 ay, qəpiklə). Planlar `0077`-də PRD 16.2 imkan cədvəli ilə
  yaradılır, qiymət yazılmır. Saf qaydalar `lib/subscriptions/plan-policy.ts` (imkan səviyyələri `CAPABILITY_LEVELS`,
  limitlər `PLAN_LIMITS`, `pricingMode()`), oxu `lib/subscriptions/plans.ts`. Plan adı kataloqdan (kod) gəlir — bazada ad
  yoxdur. İctimai `/paketler` tanıtım mərhələsində (monetizasiya və ya ödənişli abunə bağlı) qiymət göstərmir, PRD 16.4
  mesajını çıxarır və heç bir ödəniş düyməsi yoxdur; ödənişli rejimdə tariflər görünür, checkout hələ yoxdur (provayder
  adapteri ayrıca hissədir). Kabinet paket səhifəsi də tanıtım mesajını göstərir. Panel «Maliyyə və Monetizasiya»
  `/admin/maliyye` (`billing:manage`): plan başına imkan, limit, tarif, sınaq günləri, aktivlik; audit olunur. Limitlər
  tanıtım mərhələsində tətbiq olunmur. Plan təsviri dil üzrə JSON-dur (`parsePlanDescription`; boş dil kataloq şüarına
  qalır). `SUBSCRIPTIONS` söndürüləndə `/paketler` 404 verir, menyu/footer (`getHiddenPublicPaths`) və sitemap onu göstərmir.
  Plan saxlaması yarımçıq qalsa plan və tariflər əvvəlki vəziyyətə bərpa olunur (`restorePlan`).
- **Abunə və ödəniş arxitekturası (#246, PRD 16.5/16.7):** `Subscription` (statuslar `SUBSCRIPTION_STATUSES`, effektiv status
  vaxtdan hesablanır — `effectiveSubscriptionStatus`; plan kodu/müddət kopyalanır), `PaymentTransaction` (`idempotencyKey`
  unikal, faktura nömrəsi, uğursuz səbəb, geri ödəniş), `DiscountCode`, `PromoCampaign` (`0078`). Saf qaydalar
  `lib/subscriptions/subscription-policy.ts`. **Real ödəniş yoxdur:** `lib/payments/provider.ts`-də `getPaymentProvider()`
  `null` qaytarır; `startSubscriptionCheckout()` (`lib/payments/checkout.ts`) bayraq (`pricingMode().checkout`) və provayder
  olmadan heç nə yazmır. Provayder nəticəsi `recordPaymentResult()` ilə — keçid şərti `updateMany` (`canTransitionPayment`),
  uğurlu ödəniş abunəni aktivləşdirir və endirim istifadəsini artırır, geri ödəniş abunəni ləğv edir. Provayder qoşmaq
  ayrıca təsdiq və test tələb edir. Panel: `/admin/maliyye/abuneler` (hesabat + ödənişsiz təyin, köhnə aktiv abunə ləğv
  olunur; agentlik planı yalnız agentlik hesabına), `/endirimler`, `/kampaniyalar` (aktiv kampaniya `/paketler`-də göstərilir),
  `/odenisler` (yalnız oxu).
- **VIP elanlar (#248, PRD Modul 12):** ictimai VIP görünüşü mövcud `Property.isFeatured` + `featuredUntil`-dir (kartda
  «VIP» nişanı, ana səhifənin ayrıca VIP bölməsi — `getHomeVipProperties()`, vitrin VIP-ləri təkrarlamır). Dövr və qərar
  tarixçəsi `VipRequest`-dədir (`0079`, `lib/vip.ts`): sahib kabinetdən dərc olunmuş elanı üçün sorğu göndərir (elan başına
  bir açıq sorğu, yazılışdan sonra yoxlanılır), admin `/admin/vip`-də (`property:manage`) müddətlə təsdiqləyir, səbəblə rədd
  edir, uzadır, dayandırır və ya sorğusuz verir; hamısı audit olunur və sahibə `VIP` bildirişi gedir. Təsdiq şərti
  `updateMany`-dir, elan yazılmasa sorğu `PENDING`-ə qayıdır; hələ aktiv dövr varsa yenisi onun sonundan başlayır.
  `VIP_REQUESTS` bağlıdırsa sorğu qəbul olunmur; `VIP_SELF_SERVICE_ENABLED` açıq və `ADMIN_APPROVAL_FOR_VIP` bağlıdırsa
  dərhal təsdiqlənir. Bitən dövr gündəlik baxımda `EXPIRED` olur (`expireVipGrants`). Panel performansı dövr günləri üzrə
  `PropertyDailyStat` + müraciətlərdən toplu oxuyur (dövr başına sorğu yazma — subrequest limiti).
- **Elanı irəli çəkmə (#250, PRD Modul 13):** `PromotionCampaign` (`0080`, `lib/promotion.ts`) + `Property.promotedUntil`.
  Defolt (aktuallıq) sıralaması `promotedUntil desc nulls last`, sonra `publishedAt` — irəli çəkilmiş elan kartda «İrəli
  çəkilib» nişanı ilə işarələnir (`propertyCardSelect`-də sahə var). Ödənişsizdir, kart məlumatı istənmir: sahib kabinetdən
  sorğu göndərir, admin `/admin/irelicekme`-də (`property:manage`) başladır/rədd edir (səbəb)/dayandırır və ya sorğusuz
  başladır; `PROMOTION_SELF_SERVICE_ENABLED` açıqdırsa sorğu dərhal başlayır. Təkrar qaydası: elan başına bir açıq
  sorğu/aktiv kampaniya, bitəndən sonra `PROMOTION_COOLDOWN_DAYS` fasilə. Bitmə 10 dəqiqəlik cron-dadır (`expirePromotions`
  — `escalate` işi) ki, sıralama üstünlüyü gecikməsin. Statistika VIP kimi dövr günləri üzrə toplu oxunur.
- **Bildiriş mərkəzi (#252, PRD Modul 15):** hər `NotificationType` PRD 17.3 kateqoriyasına düşür
  (`NOTIFICATION_TYPE_CATEGORY`, `lib/notification-categories.ts` — `Record` olduğu üçün yeni tip typecheck-də yıxılır).
  İstifadəçi `/kabinet/bildirisler`-də kateqoriya × kanal (sayt, e-poçt; SMS/Telegram «tezliklə», deaktiv) seçir —
  `NotificationPreference.categoryChannels` JSON (`0081`). `notifyAccount()` seçimə tabedir: saytdaxili söndürülübsə sətir
  yazılmır, e-poçt söndürülübsə məktub getmir. **`SECURITY` kritikdir** — seçim ona tətbiq olunmur və saxlanmır
  (`noticePasswordChanged` — kabinetdə parol dəyişəndə). Yeni hadisələr: `noticeNewReview` (agent/agentlik rəyi təsdiqlənəndə),
  `noticeSubscriptionStatus` (abunə təyini/ləğvi). Köhnə saxlanmış axtarış/qiymət/rezervasiya matrisi ayrıca qalır.
- **Əmlak və profil doğrulaması (#256, PRD Modul 17):** nişanlar ayrı səviyyələrdir (`VERIFICATION_BADGES`:
  telefon, e-poçt, agentlik, sənədlər, məlumatlar; `getListingVerification()` yalnız boolean oxuyur, nömrə/e-poçt seçmir)
  və elan detalında mənası ilə göstərilir — telefon təsdiqi hüquqi status demək deyil. Sahib `/kabinet/elanlar/<id>/senedler`-dən
  sənəd şəkli yükləyir (`putPrivateImage`, R2 `private/`, `PropertyDocument`); yalnız `property:manage` moderator
  `/admin/senedler`-də görür, fayl `/api/admin/senedler/<id>`-dən verilir və hər baxış/qərar/silmə `DocumentAccessLog`-a
  yazılır. Qərar elanın `documentsVerifiedAt`-ını qoyur/götürür; «Məlumatlar yoxlanılıb» (`dataVerifiedAt`) ayrıca açardır.
  Qərardan `PROPERTY_DOCUMENT_RETENTION_DAYS` sonra gündəlik baxım faylı və sətri silir (tarixçə qalır). İctimai səhifəyə
  sənədin özü və növü çıxmır.
- **Hesab etibarlılığı (#258, PRD Modul 18):** davranış siqnalları (`lib/moderation/trust-signals.ts` saf, `lib/account-trust.ts`
  D1): 24 saatda eyni başlıqlı elanlar, 30 gündə rədd/dayandırma, 90 gündə təsdiqlənmiş şikayət, saatda ≥15 elan, başqa
  hesabla eyni uzun təsvir, şübhəli rəylər → `User.trustScore`/`trustFlags` (gündəlik baxım fəal hesabları yeniləyir).
  **Bal yalnız tövsiyədir** — tədbiri (`AccountRestriction`, `0083`) moderator `/admin/etibarliliq`-də əsaslandırma ilə tətbiq
  edir; `BLOCK` yalnız `user:manage`. Qapılar: `TEMP_SUSPENSION`/`BLOCK` `requirePublicAction`-da yazmanı bağlayır
  (`accountWriteBlock`; yalnız `preferences` və `appeal` scope-ları istisnadır, telefon təsdiqi `profile`-dadır; `requirePublicAction`-dan keçməyən `updateProfile` `accountRestrictionBlock()` çağırır), yeni elan `postingGate()`-dən keçir (limit, əlavə təsdiq, moderator yoxlaması →
  `PENDING`). Tədbir silinmir (`liftedAt`), bildiriş `ACCOUNT_RESTRICTION` (təhlükəsizlik kateqoriyası). İstifadəçi
  `/kabinet/mehdudiyyetler`-dən etiraz edir (blokdan keçən ayrıca action); **etirazı tədbiri verəndən başqa əməkdaş həll edir**
  (`sameReviewer`), qəbul tədbiri götürür.
- **Admin panelinin genişləndirilməsi (#260, PRD Modul 19):** dashboard-da platforma/risk göstəriciləri
  (`getPlatformIndicators()` — yeni istifadəçi və elan 7 gün, təsdiqlənmiş agentlik, açıq şikayət/etiraz, şübhəli elan
  `riskScore ≥ hold`, riskli hesab `trustScore ≥ 60`, VIP/irəli çəkmə/sənəd növbələri; hər göstərici öz bölməsinə aparır).
  `/admin/emlaklar?gorunus=subheli|vip|irelicekilmis|arxiv` görünüşləri (silinmişlər `?silinmis=1`). Menyuda «Təhlükəsizlik»
  qrupu: şikayətlər, hesab etibarlılığı, sənəd yoxlaması, etirazlar və `/admin/moderasiya-tarixcesi` (moderator status
  keçidləri + son hesab tədbirləri). Qalan PRD 21 bölmələri (istifadəçilər, agentliklər, analitika, monetizasiya, SEO, sistem) əvvəldən var.
- **Hesabatlar və biznes analitikası (#262, PRD Modul 20)** `/admin/hesabatlar` (`billing:manage`, menyuda «Analitika»
  altında), `lib/admin/business-reports.ts` + saf `business-reports-math.ts`. Ay sərhədləri **Bakı vaxtı** ilədir
  (`monthWindows`), dövr `REPORT_MONTHS` (6). DAU/WAU/MAU ictimai sessiyaların `lastSeenAt`-ındandır (təxminidir — sessiya
  yalnız son aktivliyi saxlayır). Təsdiqlənmiş saxta elan = `RESOLVED` + `NO_ACTION` olmayan `resolution` (`resolvedAt` ayı).
  Demo qeydlər sayılmır. **Gəlir yalnız `pricingMode().checkout` açıqdırsa hesablanır** — əks halda `revenueActive = false`
  və panel «aktiv deyil» yazır (MRR = aktiv ödənişli abunənin son uğurlu ödənişi ÷ ay, ARR = MRR × 12); VIP/irəli çəkmə
  hələ ödənişsizdir, gəliri `0`. Axtarılan ərazilər saxlanılmış axtarışların `citySlug`/`districtSlug`-ındandır, növ marağı
  `PropertyDailyStat` baxışlarından, qiymət trendi satış (AZN) elanlarının yaradıldığı ay üzrə m² medianıdır
  (`PRICE_TREND_MIN_SAMPLES`-dən az nümunədə «—»). Kataloq namespace-i `pages.businessReports`-dur (`pages.reports` şikayətlərdir).
- **Təhlükəsizlik və audit (#264, PRD Modul 21):** `SecurityEvent` (`0084`) — `recordSecurityEvent()` (`lib/security/
  security-events.ts`) **heç vaxt atmır**; növlər saf `security-event-kinds.ts`-dədir (auth qatı dövri asılılıqsız yazsın deyə
  `registerFailure` kilidi birbaşa yazır). Yazılan hadisələr: yeni cihazdan giriş, hesab kilidi, `requirePermission` rəddi,
  `assertSameOrigin` rəddi, yazma limiti, parol dəyişikliyi. **Yeni cihaz xəbərdarlığı** `alertOnNewDevice()` hər sessiya
  açan axında (`openPublicSession`, əməkdaşın 2FA addımı) çağırılır: tarixçə **sessiyalardan ayrı** `KnownLoginDevice`-dadır
  (`0086`; sessiya sətirləri təmizlənir) — cihaz etiketi (brauzer + OS, `deviceLabel`) və `AUTH_SECRET` ilə duzlanmış IP heşi,
  `KNOWN_DEVICE_RETENTION_DAYS` (365) saxlanılır. Son `KNOWN_DEVICE_WINDOW_DAYS` (90) gündə ikisi də tanınmırsa hadisə; heç
  tarixçə yoxdursa ilk giriş sayılır (xəbərdarlıqsız), tarixçə var, amma pəncərədə boşdursa giriş yenidir + ictimai hesaba `SECURITY` bildirişi
  (`noticeNewDeviceLogin`), əməkdaşa birbaşa e-poçt. Sessiya açan yeni axın da onu çağırmalıdır. Saxlama müddətləri
  `lib/security/retention-policy.ts`-dədir (panel cədvəli də oradan qurulur); `purgeSecurityLogs()` gündəlik baxımdadır.
  `/admin/tehlukesizlik` (`user:manage`, «Təhlükəsizlik» qrupu). D1 Time Travel bərpa proseduru Wiki-dədir.
- Panel `/admin/funksiyalar` (`settings:manage`): kritik açar (ödəniş, abunə, monetizasiya, avtomatik moderasiya) dəyişəndə
  təsdiq qutusu məcburidir (server də yoxlayır); dəyişiklik audit jurnalına əvvəl/sonra dəyəri ilə yazılır.

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
  xatırlatma, bitəndə `EXPIRED` + `expiredAt` (#202-yə qədər `ARCHIVED` idi). Şirkət (STAFF) elanlarına
  toxunulmur. Kabinetdə «Yenilə» 60 gün əlavə edir. Gündəlik iş `runPhase2Maintenance()`-dədir və idempotentdir.
- **Elanın həyat dövrü (#202, PRD Modul 03):** `PROPERTY_STATUSES`-ə `NEEDS_INFO` (moderator düzəliş istəyib),
  `SUSPENDED` (moderator dayandırıb — şikayət qərarı), `EXPIRED` və `REJECTED` əlavə olunub; hamısı qeyri-ictimaidir,
  `PUBLIC_PROPERTY_STATUSES` dəyişməyib. Səbəb `moderationNote`-dadır və kabinetdə göstərilir. Moderasiya rəddi və
  «Düzəliş tələb et» sahibə `noticeListingModeration()` (`LISTING_MODERATION`) göndərir; qərar şərti `updateMany` ilə
  yalnız `PENDING` elana yazılır. **`MODERATION_HOLD_STATUSES`-dəki elanı sahib redaktə edəndə status həmişə
  `PENDING` olur** — `submissionPolicy()` (təsdiqlənmiş agentliyin birbaşa dərci) burada işləmir. Sahib aktiv təklifi
  «Satıldı / Kirayəyə verildi» ilə bağlayır (`closePublicProperty`); bağlanmış elan ictimai qalır, amma
  `resolveLeadProperty().closed` müraciəti rədd edir (ofisə yönəltmir) və detal səhifəsi əlaqə/formanı gizlədir.
  Köhnə qeydlər `migrations/0062`-də köçürülüb (`ARCHIVED`+`expiredAt` → `EXPIRED`, `ARCHIVED`+qeyd → `SUSPENDED`,
  `DRAFT`+qeyd → `REJECTED`). Yeni status əlavə edəndə `Record<PropertyStatus, …>` xəritələri typecheck-də yıxılır —
  kataloqlarda (`property.status`, `account.listings.status`, `labels.propertyStatus`) da yaz.
- **Status tarixçəsi və aktuallıq intervalı (#204, PRD 5.2/5.4):** hər status keçidi `recordPropertyStatusChange()`
  (`lib/property-status-history.ts`, **heç vaxt atmır**) ilə `PropertyStatusHistory`-yə yazılır: mənbə
  `PROPERTY_STATUS_SOURCES` (panel, sahib, moderasiya, sistem, idxal), moderatorun səbəbi `note`-da. Yeni status
  dəyişdirən yol yazanda tarixçəni də çağır. Admin elan səhifəsi status və qiymət dəyişikliklərini `getPropertyHistory()`
  ilə bir xətdə göstərir. Elanın ömrü və xatırlatma günü `Parametrlər → Elan müddəti`-dən gəlir
  (`SETTING_KEYS.LISTING_EXPIRY_CONFIG`, tək JSON, `getListingExpiryConfig()`; 7–365 / 1–30 gün, pozulmuş dəyər 60/7
  defoltudur). Saf funksiyalar (`renewedExpiry`, `publicationExpiryReset`, `expiryState`, `propertyLifecycleData`) günü
  istəyə bağlı parametr kimi alır — dərc edən yeni yolda konfiqurasiyanı ötür, sabiti birbaşa işlətmə.
- **Etiraz (#206, PRD 20.4):** sahib `APPEALABLE_STATUSES` (`REJECTED`, `SUSPENDED`) elanına kabinetdən etiraz edir
  (`ListingAppeal`, elan başına bir açıq etiraz). `/admin/etirazlar`-da etirazı **qərarı verən moderatordan başqa**
  şəxs həll edir — qərarverən status tarixçəsinin son keçidindən (`decidedById`) götürülür, server `sameReviewer` qaytarır.
  Qəbulda elan əvvəlki statusa (`PUBLISHED`/`RESERVED`) və ya moderasiya növbəsinə (`PENDING`) qayıdır, tarixçəyə yazılır;
  rəddə status dəyişmir, səbəb məcburidir. **Etiraz konkret qərara bağlıdır** (`decisionHistoryId` — o keçidin tarixçə
  qeydi): elan redaktə edilib yenidən rədd olunubsa köhnə etiraz `CLOSED` olur (`stale`), yoxsa yeni qərarverən onun
  üzərindən öz qərarına baxa bilərdi. «Bir açıq etiraz» yazılışdan sonra yoxlanılır (ən köhnəsi qalır); növbə əlaqələri
  iç-içə deyil, `findManyInChunks` ilə yüklənir. Bu axında status tarixçəsi qərarverənin mənbəyidir — moderasiya
  yollarında tarixçəni yazmağı unutma.
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

### Elanı yerləşdirən, agentlik komandası və müraciət yönləndirməsi (2026-10)

- **Əlaqə elanı yerləşdirənə gedir** (`lib/accounts/listing-publisher.ts`, Prisma-sız): STAFF və ya
  müəllifsiz elanda şirkətin nömrəsi; agentlik hesabında agentliyin adı, loqosu və ofis nömrəsi;
  agentliyin təsdiqlənmiş əməkdaşında agentin öz nömrəsi + agentlik adı; digərlərində hesabın ad
  soyadı/telefonu/e-poçtu. Kart (`listingPublisherBadge`) və detal (`resolveListingPublisher`) eyni
  qaydanı işlədir; kart sorğusu yalnız növ + agentliyi seçir, əlaqə məlumatı kart payload-ına düşmür.
- **İctimai hesabın nömrəsi və e-poçtu HTML-ə yazılmır.** Detal maskalı nömrə (`maskPhone`) göstərir,
  tam əlaqə «Nömrəni göstər» ilə `POST /api/emlaklar/<id>/elaqe`-dən gəlir (same-origin + IP limiti
  `checkContactRevealLimit`). Bu əlaqəni server komponentindən client-ə prop kimi ötürmə.
- **Elan səhifəsindəki müraciət elana bağlanır** (`propertyId`, `source = PROPERTY`). İctimai hesabın
  elanında müraciət ofis kanallarına (e-poçt/Telegram) getmir — sahibə bildiriş + e-poçt
  (`noticeListingLead`) gedir və `/kabinet/muracietler`-də görünür. ID yalnız ictimai elana uyğun
  gəlsə qəbul olunur (`resolveLeadProperty`).
- **Agentlik komandası:** limit `MAX_AGENCY_EMPLOYEES` (50). `AgencyEmployee.source`: `INVITE` (sahib
  dəvət edir, admin təsdiqləyir) və `REQUEST` (agent qeydiyyatda və ya profildə agentliyi seçir,
  sahib `/kabinet/komanda`-da və ya admin təsdiqləyir). Yer limiti təsdiqlənmişlərə + gözləyən
  dəvətlərə aiddir; sorğu yer tutmur, təsdiqdə yoxlanılır, gözləyən sorğu sayı
  `MAX_PENDING_AGENCY_REQUESTS` ilə məhduddur. Qaydalar `lib/accounts/agency-membership.ts`-dədir;
  təsdiqdə `AgentProfile.agencyId` bağlanır, çıxarılanda ayrılır — bunu yan keçən axın yazma.
  Qərar yalnız `commitMembershipDecision()` ilə yazılır: şərti `updateMany` (sahib və admin eyni
  anda baxa bilər), profil bağlantısı alınmasa status `PENDING`-ə qaytarılır, təsdiqlənmiş qeydin
  təkrar təsdiqi qalan addımı tamamlayır. **Bir aktiv agentlik:** başqa agentlikdə təsdiqlənmiş
  istifadəçi dəvət/təsdiq olunmur (`hasOtherApprovedMembership`) — kart `agencyEmployments[0]`-ə
  buna görə etibar edir. Komanda bildirişinin `dedupeKey`-i cəhd vaxtını (`invitedAt`) daşıyır,
  çünki rədd edilmiş sorğu eyni id ilə yenidən açılır. Agentin öz action-ları da
  `requirePublicAction("team")`-dən keçir.
- **Deaktiv hesabın elanı** ictimai qala bilər, amma əlaqəsi, müraciəti və satıcı filtri şirkətə aiddir
  (`isActive` həm `resolveListingPublisher`, həm `resolveLeadProperty`, həm `sellerWhere`-dədir).
- **Agentlik loqosu** profil şəkli ilə eynidir (`User.avatarUrl` = `Agency.logoUrl`, `avatarlar`
  qovluğu). Qeydiyyatda loqo Server Action-un özündə saxlanılır (`storeAgencyLogo`) — client onu
  512 px WebP-yə kiçildir, çünki action gövdəsinin Next limiti 1 MB-dır. Paneldən dəyişəndə də
  fayl agentlik hesabının adına yazılır, əks halda sahibin profil saxlaması «şəkil sizə aid deyil» verir.
- **Satıcı filtri** `?satici=OWNER|AGENCY|COMPANY` (`SELLER_FILTERS`, `sellerWhere()`); satıcı səhifəsi
  `/satici/<userId>` (noindex, təsdiqlənmiş agentlikdə agentlik səhifəsinə 308).

### Agentlik profili, sayma qaydası və admin təsdiq mərkəzi (#155)

- **Sayma qaydası `lib/agency-profile.ts`-dədir — başqa yerdə yenidən yazma.** Agentliyin **təklifi**
  = agentliyin mühitinə aid ictimai elanlar (`Property.agencyId`, #210 — `countAgencyOffers`, profil, ərazi,
  sövdələşmələr); agentin şəxsi elanı agentlikdə sayılmır. Agentin **elanı** =
  öz yerləşdirdiyi (`authorId = userId`) + ona təyin edilmiş (`assignedAgentId`), təkrarsız
  (`countAgentListings`, `agentListingWhere`). Əlaqənin `_count.properties`-i yalnız təyin
  edilmişləri sayırdı: kartda «0 elan», səhifədə 1 elan görünürdü. UI-da agentlik üçün «təklif»,
  agent üçün «elan» sözü işlənir.
- **Agentlik profili** `/agentlikler/<slug>` (bina.az + Property Finder + Zillow sintezi): qızılı
  şəbəkəli örtük, statistika zolağı (təklif/satış/kirayə/agent/baxış), `?elan=`/`?tip=`/`?siralama=`/
  `?sehife=` ilə təkliflər, elanlardan çıxarılan «Fəaliyyət əraziləri», agentlər, yapışqan əlaqə
  paneli. Ofis nömrəsi/WhatsApp/e-poçt `POST /api/agentlikler/<slug>/elaqe`-dən «Nömrəni göstər» ilə
  gəlir (elan əlaqəsi ilə eyni qayda). **Hesabın giriş e-poçtu heç vaxt açılmır** — yalnız `Agency.email`.
  `Agency.viewCount` `recordView("agency")` ilə artır, ona görə profil `SIDE_EFFECT_ROUTES`-dadır
  (kənar keşdən yan keçir; keş hit-i sayğacı işə salmazdı).
- **Telefon sahəsi telefon olmalıdır** (`isPhoneLike`, qeydiyyat/profil/panel). Köhnə qeyddə telefon
  yerində e-poçt varsa, o telefon kimi göstərilmir.
- **Panel:** «Agentliklər və agentlər» ayrıca menyu bəndidir, sayğac `getApprovalCounts()`-dəndir
  (`PENDING_AGENCY_WHERE`/`PENDING_AGENT_WHERE` — növbə səhifəsi ilə eyni şərt). `/admin/agentlikler/tesdiq`
  — təsdiq növbəsi; `/admin/agentlikler/<id>` — agentlik profilinin tam redaktəsi; siyahılarda status
  tabları və «Təsdiqlə və dərc et» (`approveAndPublishAgent`). Növbədə yalnız heç təsdiqlənməmiş
  agent var (`isVerified: false`); təsdiqlənib qəsdən gizlədilən profil növbəyə qayıtmır.

### Agentlik profilinin genişlənməsi, rədd səbəbi, dəvət linki və məlumat ixracı (#157)

- **Rədd səbəbi:** agentlik/agent `rejectedAt` + `rejectionReason`, komanda qeydi `decisionNote`. Rədd
  edilən müraciət növbədən çıxır (`PENDING_*_WHERE`-də `rejectedAt: null`); sahib kabinetdə profili
  saxlayanda sahələr sıfırlanır və müraciət geri qayıdır. Səbəb `noticeAccountReview()` ilə bildiriş +
  e-poçt kimi gedir (`ACCOUNT_REVIEW`); təsdiq də bildirilir. Rədd şərti `updateMany` ilədir — eyni anda
  təsdiq edilən agentliyin üzərinə yazılmır. Uzunluq `REJECTION_REASON_MIN/MAX`, dialoq `ReasonAction`.
- **Toplu təsdiq** `bulkApproveQueue` — guard **bir dəfə**, sonra hər id tək action-un guard-sız daxili
  addımından keçir (`*As(actor, id)`, agent üçün `lib/admin/agent-approval.ts`): hər qeyd üçün
  `requireAdminAction` yazma limitindən (60/dəq) vahid yeyirdi və 60-cı qeyd kəsilirdi. Yeni toplu
  əməliyyatı da belə yaz. SLA `lib/admin/approval-sla.ts` (24 saat sarı, 72 saat qırmızı) son göndərilmədən
  sayılır: rədd edilib düzəldilən müraciətdə `reviewRequestedAt`, yoxdursa `createdAt`.
- Dəvət linki ilə qeydiyyatda token hesab yarandıqdan sonra, qoşulmadan dərhal əvvəl **yenidən** oxunur —
  qeydiyyat davam edərkən söndürülən link işləməməlidir.
- **VÖEN** (`normalizeTaxId`): 10 rəqəm, sonuncu 1 və ya 2, təkrar rəqəm rədd olunur; eyni VÖEN ilə ikinci
  aktiv agentlik hesabı açılmır (`isAgencyTaxIdTaken`). Nəzarət rəqəminin alqoritmi dərc olunmayıb — yoxlanılmır.
- **Dəvət linki** `/qosul/<token>` (`lib/accounts/agency-invite.ts`): sahib kabinetdə yaradır/yeniləyir/
  söndürür, linklə gələn agent `source = LINK` ilə **dərhal APPROVED** olur — qərar yenə
  `commitMembershipDecision()`-dən keçir. Qeydiyyat `?devet=<token>` ilə agent növündə açılır.
  `/qosul` `NEVER_CACHED_PREFIXES`-dədir (sessiya oxuyur, token daşıyır).
- **Filiallar** `AgencyOffice` (`lib/accounts/agency-offices.ts`, ən çox `MAX_AGENCY_OFFICES`): kabinet və
  panel eyni yoxlamanı işlədir; nömrə HTML-ə yazılmır, `POST /api/agentlikler/<slug>/elaqe?ofis=<id>`-dən açılır.
- **Örtük şəkli** `Agency.coverUrl`: kabinetdən `avatarlar`, paneldən `umumi`; dəyişməyən dəyər mülkiyyət
  yoxlamasından keçmir (panelin qoyduğu şəkil sahibin növbəti saxlamasını sındırmasın).
- **Paylaşım kartı** `/api/og/agency/<slug>` — şəkil köməkçiləri `lib/og-image.ts`-dədir (elan kartı da
  işlədir). Satori `textTransform`-u dilə həssas deyil: böyük hərf `toLocaleUpperCase("az-AZ")` ilə.
- **Profil tamlığı** `lib/accounts/profile-completeness.ts` (saf modul, çəkilərin cəmi 100) — kabinet ana
  səhifəsi və profil kartı.
- **«Məlumatlarımı yüklə»** `lib/accounts/data-export.ts`: yalnız şəxsin öz məlumatı, gizli dəyər yoxdur
  (parol heşi, TOTP, tokenlər, push açarları); başqasının əlaqəsi (müraciət, rəy yazan) düşmür. Hesab üzrə
  limit (`checkDataExportLimit`). `scripts/__tests__/data-export-source.test.ts` gizli sahə adlarını yoxlayır.
- **Loqo lövhəsində padding yazma:** kvadrat loqo (fonu rəngli) lövhəni tam doldurmalıdır — `object-contain` padding-siz.

### Şikayət, avtomatik moderasiya, elan təhvili və bağlanmış sövdələşmələr (#159)

- **Elan şikayəti** (`lib/listing-reports.ts`, `ListingReport`): ictimai elanın detalında «Elandan şikayət et»
  — PRD-nin 15 səbəbindən bir neçəsi birlikdə seçilir (`REPORT_REASONS`; `reason` əsas səbəb, `reasons` JSON
  siyahı; köhnə `WRONG_INFO`/`NOT_OWNER` yalnız `LEGACY_REPORT_REASONS`-dadır və göstərilir, qəbul olunmur),
  «Digər səbəb»də izah məcburi. Same-origin + honeypot + `checkReportLimit` (IP) + Turnstile;
  xam IP saxlanmır — `reporterKey` = `AUTH_SECRET` ilə duzlanmış IP + elan heşi, yalnız 24 saatlıq təkrarı süzür.
- **Şikayət iş axını (#195):** `OPEN` (yeni) → `IN_REVIEW` (moderator götürüb, `assigneeId`) → `NEEDS_INFO`
  (sahibdən izahat, `noticeListingInfoRequested`) → qərar `RESOLVED` | `DISMISSED` | `CLOSED`; elana təsiri ayrıca
  `resolution`-dadır (`ARCHIVED`, `MARKED_CLOSED`, `LISTING_FIXED`, `NO_ACTION`). **«Açıq» = `ACTIVE_REPORT_STATUSES`**
  (üç mərhələ) — risk siqnalı, menyu sayğacı, moderasiya növbəsi və qərarın «götürmə» şərti bu dəstə baxır, yalnız
  `OPEN`-ə baxmaq yoxlanılan şikayəti itirərdi. Yoxlanılan elana gələn yeni şikayət mərhələ və moderatoru miras alır.
  Admin növbəsi `/admin/sikayetler` elan üzrə qruplaşdırır; beh tələbi/dələduzluq (`HIGH_PRIORITY_REPORT_REASONS`) və
  `REPORT_URGENT_THRESHOLD`+ şikayət yüksək prioritetdir; göstəricilər `getReportQueueStats()`. Elanı dəyişən qərar
  əvvəl aktiv şikayətləri şərti `updateMany` ilə **götürür**; heç nə götürməyən (gecikmiş, eyni anda gələn) sorğu
  elana toxunmur, elan yazılmasa götürülən şikayətlər `IN_REVIEW`-a qaytarılır. «Yenidən bax» son qərarı açır, elana
  görülmüş tədbiri geri almır. Hər qərar audit + sahibə `noticeListingReportDecision()` + daxil olmuş şikayətçiyə
  `noticeReportOutcome()`; sayğac menyuda `openReports`.
- **Şikayət sübutu (#195):** yalnız daxil olmuş istifadəçidən, ən çox `REPORT_EVIDENCE_MAX_FILES` şəkil; brauzer
  `prepareImageForUpload(…, { maxDimension })` ilə ≤ `REPORT_EVIDENCE_MAX_BYTES` WebP-yə kiçildir (action gövdəsi 1 MB).
  Elan səhifəsi kənar keşdədir — forma giriş vəziyyətini dialoq açılanda `/api/hesab/elaqe`-dən oxuyur. Fayl
  `putPrivateImage()` ilə R2-nin **`private/`** prefiksinə yazılır (`ListingReportEvidence`); `mediaKeyFromPath()`
  bu prefiksi rədd edir, ona görə ictimai `/media/...` və worker keşi onu vermir. Moderator faylı yalnız
  `/api/admin/sikayetler/subut/<id>`-dən görür (`property:manage`, `no-store`, icazəsizə 404). Məxfi fayla ictimai
  URL qurma və onu `next/image`-dən keçirmə.
- **Daxili qeydlər və «Şikayətlərim» (#197):** moderator qrupa (elan üzrə) `ListingReportNote` yazır — yalnız
  paneldə görünür, audit jurnalına düşür. `/kabinet/sikayetlerim` istifadəçinin öz şikayətlərini `getUserReports()` ilə
  göstərir; o funksiya moderatoru, izahat mətnini, qeydləri və `reporterKey`-i **seçmir** (test açar dəstini yoxlayır) —
  səhifəyə yeni sahə əlavə edəndə məxfilik qaydasını saxla. Şikayətçiyə nəticə bildirişi bu səhifəyə aparır.
- **Avtomatik risk siqnalları** (`lib/moderation/risk-signals.ts` saf, `listing-risk.ts` D1): bazardan
  ≥35% ucuz qiymət, mətndə telefon/e-poçt/link, başqa müəllifin elanındakı eyni foto (`Media.checksum`),
  köçürülmüş mətn, 3 gündən təzə hesab, açıq şikayət. Bal `Property.riskScore` (0–100) + `riskFlags` (JSON).
  Kabinetdən yaradılan/redaktə edilən elan `hold` həddində (≥50) dərc olunmur, `PENDING`-ə düşür; şirkət
  (STAFF) elanı yoxlanmır. `refreshListingRisk()` heç vaxt atmır — siqnal xətası elan yazmasını sındırmamalıdır,
  amma nəticəsi bilinməyən yoxlama `hold` sayılır (keçici D1 xətası moderasiyanı yan keçməsin).
  Moderasiya növbəsi riskli elanları rozetlə göstərir.
- **Elan sahibliyi və təhvil (#210, PRD Modul 04):** agentlik adından yaradılan elan agentliyin mühitinə aiddir
  (`Property.agencyId`), `createdById` ilk yaradandır, `authorId` hazırkı idarəçi. Sahibin elanı həmişə agentlikdir;
  təsdiqlənmiş agent sehrbazın «Əlaqə» addımında «agentlik adından» (defolt) və ya «şəxsi» seçir
  (`resolveNewListingAgencyId()`, `lib/accounts/agency-ownership.ts`; redaktədə dəyişmir). Agent ayrılanda **yalnız
  agentlik elanları** (silinməmiş, bütün statuslar) sahibə və ya başqa təsdiqlənmiş agentə keçir — agentdə qala bilməz,
  köhnə `KEEP` `AGENCY` sayılır; agentə təyinat (`assignedAgentId`) da götürülür. Şəxsi elanlar agentdə qalır. Təhvil
  üzvlük silinməzdən **əvvəl** gedir (alınmasa üzvlük qalır, təkrar cəhd mümkündür); agent özü çıxanda agentlik elanları
  avtomatik sahibə keçir. Hədəf `resolveHandoverTarget()` ilə yoxlanır — kənar id qəbul olunmur. Müraciət, şəkil, paket
  elana bağlıdır, elanla keçir. Agentin hesabı silinəndə də (`finalizeAccountDeletion`) agentlik elanları sahibə keçir,
  yalnız şəxsi elanlar arxivlənir. Sahibin analitikası da yalnız agentlik elanlarını göstərir. Mövcud elanlar `0066`-da
  agentlik sayılıb (sahibin və təsdiqlənmiş agentin elanı) — əvvəl fərq saxlanmırdı.
- **Üzvlük tarixçəsi** `AgencyMembershipHistory` (PRD 6.6): hər təsdiqlənmiş üzvlük dövrü bir sətir — agentlik adı
  (snapshot), rol, qoşulma/ayrılma, səbəb (`MEMBERSHIP_END_REASONS`: `LEFT`/`REMOVED`), təhvil sayı. Təsdiqdə
  `commitMembershipDecision()` `openMembershipPeriod()`-u (idempotent), ayrılmada action-lar `closeMembershipPeriod()`-u
  çağırır; ikisi də heç vaxt atmır. Agent özününkünü (kabinet profili, data ixracı), sahib öz agentliyininkini
  (`/kabinet/komanda` → «Keçmiş üzvlər»), admin agentlik səhifəsində görür — agentin başqa agentlikdəki dövrləri
  sahibə göstərilmir. Üzvlüyü bitirən yeni axın da dövrü bağlamalıdır.
- **Agentliklər arası köçürmə (#212, PRD 6.4)** `ListingTransfer` (`lib/listing-transfers.ts`): B agentliyinin sahibi və ya
  təsdiqlənmiş agenti A-nın elanını elan linki, səbəb və **məcburi** əmlak sahibi razılığı ilə istəyir (`/kabinet/kocurmeler`;
  agent yalnız özünə istəyir). Axın `PENDING_SOURCE` (A sahibi) → `PENDING_ADMIN` (`/admin/kocurmeler`, `property:manage`)
  → `COMPLETED`; rədd `REJECTED`, geri çəkmə `CANCELLED`. Elan başına bir açıq sorğu (yazılışdan sonra yoxlanılır), hər keçid
  şərti `updateMany`. Təsdiqdə təhvil alanın hələ B-də olması yoxlanılır, sonra elan **yalnız `agencyId = A` olduqca** B-yə keçir
  (`authorId` = təhvil alan, təyinat götürülür); yazılmasa sorğu `CANCELLED` olur. **Məxfilik:** elanın köhnə müraciətləri
  `Lead.agencyId = A` ilə bağlanır və `leadScope()` elan müəllifinə başqa agentliyə bağlı müraciəti göstərmir — müştəri
  məlumatı yeni agentliyə keçmir. Bildirişlər `LISTING_TRANSFER` tipidir (`noticeTransferRequested/Decision`).
- **Agentlik fəaliyyət jurnalı (#214, PRD 7.4)** `AgencyActivity` (`lib/accounts/agency-activity.ts`): elan əlavə/redaktə/
  qiymət/silmə/bağlama/yeniləmə, müraciətin başqa agentə verilməsi, komanda (dəvət, qəbul, rədd, dayandırma, ayrılma,
  hüquq və bölgü dəyişikliyi), premium paket təqdimatı və köçürmələr. `recordAgencyActivity()` **heç vaxt atmır** və
  `agencyId` boşdursa yazmır — elan əməliyyatı yalnız agentlik elanında (`Property.agencyId`) jurnala düşür. İcraçı və
  obyekt adı snapshot-dur; panel işçisinin qərarı `actor: null` ilə yazılır və «Platforma administratoru» görünür.
  Sahib `/kabinet/fealiyyet`-də (`?qrup=`, `?kim=`, `?sehife=`), admin agentlik səhifəsində son qeydləri görür.
  Agentlik mühitini dəyişən yeni action yazanda jurnalı da çağır; yeni əməliyyat üçün `AGENCY_ACTIVITY_ACTIONS`,
  `AGENCY_ACTIVITY_GROUPS` və hər iki kataloqu (`account.activity.actions`, `admin…activityActions`) yenilə.
- **Agentlik paneli (#216, PRD 7.1)** `/kabinet/agentlik` (yalnız sahib, menyuda «Ümumi baxış»dan sonra), `getAgencyDashboard()`
  (`lib/accounts/agency-dashboard.ts`), dövr `?dovr=7|30|90`: aktiv/yeni/satılmış/kirayəyə verilmiş elan, aktiv agent, yeni və
  cavabsız müraciət, baxış və əlaqə klikləri, ən çox baxılan elanlar, reytinq və son rəylər, moderasiya xəbərdarlıqları
  (düzəliş/rədd/dayandırma, açıq şikayət, 7 gün içində bitən elan) və agentlərin aktivliyi (son jurnal qeydi ilə). Hamısı
  **yalnız `Property.agencyId`** üzrədir; agentlik müraciəti `Lead.agencyId` və ya elanın agentliyi ilə müəyyən olunur
  (`agencyLeadWhere`). Cavabsız = `respondedAt` boş və status `NEW|CONTACTED|IN_PROGRESS`. Deaktiv agent cədvələ düşmür.
- **Agentlərin idarəsi (#218, PRD 7.2)** — `lib/accounts/agency-access.ts`: rol `AGENT`/`MANAGER`, səlahiyyətlər
  `AGENCY_MEMBER_PERMISSIONS` (`LEADS_MANAGE`, `LISTINGS_ASSIGN`, `TASKS_MANAGE`); `AgencyEmployee.permissions` `null`-dursa
  rolun defoltu (`AGENCY_ROLE_DEFAULT_PERMISSIONS`), defoltla eyni seçim `null` saxlanılır. Sahib həmişə hamısına malikdir;
  yoxlama `getAgencyAccess()` + `hasAgencyPermission()`. `LEADS_MANAGE` `leadScope()`-da agentliyin bütün müraciətlərini açır,
  `findManageableLead().canManage` müraciətin verilməsinə icazədir. **Girişin dayandırılması** (`suspendedAt`): üzvlük qalır,
  amma agentlik adından elan (`listingAgencyFor`), müraciət növbəsi, agentlik müraciətləri (`ACTIVE_MEMBER_WHERE`), təyinat/
  köçürmə hədəfi və agentlik elanının redaktəsi (`notSuspendedAgencyListing()` — kabinet siyahısı, redaktə səhifəsi və
  action-lar) bağlanır; açıq agentlik müraciətləri sahibə qayıdır. Şəxsi hesab və şəxsi elanlar toxunulmazdır. Agentlik
  mühitində "aktiv üzv" lazım olan yeni sorğu `ACTIVE_MEMBER_WHERE` işlətməlidir. Elan təyinatı `/kabinet/agentlik/elanlar`
  (`assignAgencyListing`, şərti `updateMany` `agencyId` ilə). Action-lar `kabinet/komanda/member-actions.ts`-dədir.
- **Agentlik analitikası (#234, PRD 11.1/11.2/11.4/11.5)** `/kabinet/agentlik/analitika` (sahib və `LEADS_MANAGE`),
  `getAgencyAnalytics()` (`lib/accounts/agency-analytics.ts`): interval `?dovr=7|30|90` və ya `?dan=&ad=` (`parseAnalyticsRange`,
  ən çox `ANALYTICS_MAX_RANGE_DAYS`, mövcud olmayan tarix defolta düşür). Metriklər ayrıdır (PRD 11.7): baxış/klik
  `PropertyDailyStat`, müraciət `Lead` (agentlik qaydası `agencyLeadWhere` panel ilə eyni), **tamamlanmış əməliyyat yalnız
  `closedAt` + `SOLD`/`RENTED`** — statusu admin yazıb bağlanma tarixi olmayan elan sayılmır. Agent performansı: yerləşdirdiyi
  (`createdById`), aktiv, aldığı/cavablandırdığı müraciət, median cavab, görüş (`LeadActivity` → `VIEWING_SCHEDULED`),
  əməliyyat, təsdiqlənmiş rəylər. Ərazi = `districtId ?? cityId`; qiymət marağı `PRICE_BUCKETS` (satış/kirayə ayrı).
  Qrafiklər asılılıqsız SVG-dir (`components/charts/simple-charts.tsx`, ekran oxuyucu üçün gizli cədvəl ilə).
- **Elan performansı (#236, PRD 11.3):** unikal baxış baxış beacon-unda (`/api/emlaklar/<id>/baxis`, bot süzgəci və IP
  limitindən sonra) `recordUniqueView()` ilə yazılır — açar `AUTH_SECRET` ilə duzlanmış IP + brauzer + elan + gün heşidir
  (xam IP yoxdur), `PropertyUniqueView`-ə `INSERT OR IGNORE`, yalnız yeni sətirdə `PropertyDailyStat.uniqueViews` artır;
  açarlar `UNIQUE_VIEW_RETENTION_DAYS` sonra `runPhase2Maintenance()`-də silinir. `/kabinet/analitika` unikal baxış və qiymət
  dəyişikliyini (`PropertyPriceHistory`) göstərir; `/kabinet/analitika/<id>` (`getListingPerformance`, giriş siyahı ilə eyni)
  7/30/90 günlük dinamika və qiymət tarixçəsidir.
- **Hesabat ixracı (#238, PRD 11.6):** `/api/hesab/hesabat/agentlik` (sahib və `LEADS_MANAGE`) və `/api/hesab/hesabat/elanlar`
  (elan yerləşdirən hesab) — `?format=csv|xlsx`, interval/dövr və `?l=` dil; giriş səhifə ilə eynidir, icazəsizə 404,
  `no-store`. Yazıcılar asılılıqsızdır (`lib/export/tabular.ts`): CSV UTF-8 BOM ilə və düstur inyeksiyasına qarşı (`=+-@`
  ilə başlayan mətn `'` alır), XLSX sıxılmamış ZIP + OOXML (`inlineStr`, CRC32). Cədvəllər `lib/export/analytics-reports.ts`.
  PDF — səhifənin çap üslubu ilə brauzerin «PDF kimi saxla» funksiyası: başlıq, footer, kabinet menyusu və alt naviqasiya
  `.no-print`-dir; yeni sabit səth əlavə edəndə onu da çapdan gizlət.
- **Daxili tapşırıqlar (#220, PRD 7.3)** `AgencyTask` (`lib/accounts/agency-tasks.ts`), `/kabinet/tapsiriqlar` (sahib və agent):
  növ `AGENCY_TASK_TYPES`, status `AGENCY_TASK_STATUSES` (açıq = `OPEN_AGENCY_TASK_STATUSES`). Sahib və `TASKS_MANAGE`
  hər aktiv üzvə yaradır və hamısını görür (`?icraci=`), digər üzv yalnız özünə yaradır və ona təyin olunanı/özünün
  yaratdığını görür. İcraçı icra statuslarını, idarəçi və ya yaradan ləğvi dəyişir; keçid şərti `updateMany` (cari status).
  Elan/müraciət bağlantısı eyni agentlikdə yoxlanılır; son tarix `YYYY-MM-DD` → Bakı günü sonu, keçmiş qəbul olunmur.
  Gecikən açıq tapşırıqlar paneldə (#216) xəbərdarlıqdır. Təyin olunanda icraçıya, tamamlananda yaradana bildiriş
  (`AGENCY_TASK`); yaratma və status jurnala yazılır. Dayandırılmış üzv tapşırıqlara daxil olmur. Bununla Modul 05 bağlanır.
- **Bağlanmış sövdələşmələr:** «təklif»/«elan» sayı yalnız `ACTIVE_OFFER_STATUSES` (PUBLISHED + RESERVED) —
  `activeOfferWhere()`. Satılmış/icarəyə verilmiş elan «Uğurlu sövdələşmələr» bölməsindədir (`getClosedDeals`,
  son `DEAL_STATS_WINDOW_DAYS` gün, **yalnız `closedAt`** — `updatedAt` baxış sayğacı ilə də dəyişir; köhnə
  qeydlər `0058`-də bir dəfə doldurulub). Agentin admin tərəfindən yazılan
  `soldCount`/`rentedCount` ayrıca ömürlük göstəricidir və toxunulmur.
- **Təhlükəsizlik məsləhətləri** (`components/site/safety-tips.tsx`): ictimai hesabın elanında və agentlik
  profilində; Bilik Mərkəzinin saxta elan bələdçisinə keçid (`SCAM_GUIDE_PATH`).
- **Beh xəbərdarlığı (#199, PRD Modul 11):** `ContactSafetyWarning` hər elanın (şirkət elanı daxil) və agentlik
  profilinin əlaqə panelində, telefon/WhatsApp düymələrinin **bilavasitə üstündədir** və onları gizlətmir. Mətn
  `/admin/xeberdarliqlar`-dan AZ/EN/RU dəyişir (`knowledge:manage` — PRD-yə görə Redaktor), tək JSON parametrdə
  (`SETTING_KEYS.SAFETY_CONTACT_WARNING`) saxlanılır və `getCachedSafetyWarnings()` ilə `public:safety` teqi altında
  keşlənir — saxlananda teq dərhal bitir, amma kənar HTML keşi teqi görmür: anonim ziyarətçi dəyişikliyi
  `EDGE_HTML_CACHE_TTL` (60 s) + bir köhnə cavab sonra görür, panel mətni də «dərhal» vəd etmir. Boş dil və ya oxuma xətası kataloqdakı `property.safety.contactWarning`-ə
  qayıdır: xəbərdarlıq heç vaxt itməməlidir. Komponent sessiya oxumur (elan detalının kənar keşi).
- next-intl tipli açarlarında namespace birliyi çox böyükdür: `getTranslations("property.safety")` kimi yeni
  dərin namespace tip xətası verə bilər — üst namespace + nöqtəli açar (`t("safety.title")`) işlət.

### Kabinet analitikası, müraciət bölgüsü, cavab nişanı, agentlik reytinqi və ərazi agentlikləri (#161)

- **Gündəlik elan statistikası** `PropertyDailyStat` (elan + Bakı günü): baxış (`recordView("property")`),
  «Nömrəni göstər» (`/api/emlaklar/<id>/elaqe`), WhatsApp və Telegram kliki (`POST /api/emlaklar/<id>/klik`,
  Telegram `?kanal=telegram` ilə ayrıca `telegramClicks`-ə; `keepalive`, IP limiti, bot filtri).
  **Telegram (#208):** `User.telegram` / `Agency.telegram` yalnız istifadəçi adıdır (`@`-sız) — `@ad`, `t.me/ad` və
  tam link `normalizeTelegramUsername()` (`lib/accounts/telegram.ts`) ilə eyni dəyərə gəlir, telefon qəbul edilmir.
  Ad nömrə kimi HTML-ə yazılmır — `.../elaqe` cavabındakı `telegram` ilə «Nömrəni göstər»dən sonra düymə çıxır. Artım `INSERT … ON CONFLICT DO UPDATE` ilə atomikdir (`lib/listing-stats.ts`) — oxu-yaz
  ilə yazma (D1-də tranzaksiya yoxdur). Müraciət və favorit öz cədvəllərindən sayılır, burada təkrarlanmır.
  `/kabinet/analitika` (`lib/accounts/listing-analytics.ts`): 7/30/90 gün, agentlik sahibi komandanın elanlarını agent
  filtri ilə görür; bazar müqayisəsi eyni növ + şəhərdə elan başına orta baxışdır (xam SQL, parametr sayı məhdud).
- **Müraciət ünvanı** `Lead.handlerId` (ictimai hesab; ofis işçisi `assigneeId` ilə qarışdırma) + `Lead.agencyId`.
  `lib/accounts/lead-routing.ts`: agentliyin (sahibin) elanına və agentlik profilindəki formaya (`ContactForm
  agencySlug`, `source = AGENCY`) gələn müraciət `Agency.leadRouting` ilə agentə düşür (PRD 8.4, #224) — `DIRECT`
  (elanın `assignedAgentId`-si, aktiv üzvdürsə; «növbədən kənar» olsa da, yoxsa sahibə), `ROUND_ROBIN`
  (`AgencyEmployee.lastLeadAt`), `LOAD` (ən az açıq — bağlanmamış mərhələdə — müraciəti olan agent, bərabərlikdə növbə),
  `OFF` (manual: sahibə, sahib/menecer özü təyin edir), `AREA` (rayonda ən çox elanı olan agent). Agentin öz elanı həmişə
  agentə gedir, amma agentliyə bağlanır. `receivesLeads = false` agent növbədən kənardır. Elansız agentlik
  müraciəti ofis sayğaclarına düşmür (`OFFICE_LEAD_WHERE`). Kabinetdə «Əlaqə saxladım» ilk cavabı (`respondedAt`,
  bir dəfə) yazır, sahib müraciəti agentə verə bilir. Agentlik müraciəti yalnız agentliyin hazırkı təsdiqlənmiş
  üzvünə görünür (`currentHandlerWhere`); agent komandadan çıxanda açıq müraciətləri sahibə qayıdır (`releaseAgentLeads`).
- **Cron `worker.ts`-dədir:** `wrangler.jsonc` → `triggers.crons` + `scheduled()` işi `openNext.fetch` ilə
  `/api/cron/leads?is=…` marşrutuna ötürür; açar `AUTH_SECRET`-dən törədilir (`lib/cron-auth.ts`), `CRON_SECRET`
  lazım deyil. İfadələr `CRON_JOBS` ilə eyni olmalıdır (`scripts/__tests__/cron-triggers.test.ts`). İşlər:
  10 dəqiqədən bir cavabsız müraciət pillələri (`processUnansweredLeads`, #224 — aşağıya bax) və gündəlik
  cavab göstəriciləri (`refreshResponseStats`). Lokal yoxlama: `wrangler dev --test-scheduled` + `/__scheduled?cron=…`.
- **Müraciət mərhələləri və kartı (#222, PRD 8.2/8.3/8.6)** — `lib/accounts/lead-pipeline.ts`: kabinet `Lead.stage` ilə
  işləyir (`LEAD_STAGES`, 11 mərhələ), ofis lövhəsi və huni `Lead.status` ilə qalır; mərhələ **həmişə** `stageData()` ilə
  yazılır ki, qaba status da uyğunlaşsın (`leadStatusForStage`). Bölgü ilə agentə düşən müraciət `ASSIGNED` başlayır.
  Kart `/kabinet/muracietler/<id>` (`getLeadCard`, giriş `findManageableLead`): mərhələ, növbəti əlaqə (`nextContactAt`,
  Bakı vaxtı), qeydlər və tarixçə `LeadActivity`-dədir (`recordLeadActivity()` heç vaxt atmır). Elan formasında məqsəd
  `intent` → `LEAD_SOURCES.PROPERTY|VIEWING|INFO` (`leadIntentSource`). Kliklər təsdiqlənmiş müraciətlərdən ayrıca
  göstərilir (`getLeadEngagementSummary`). Müraciəti dəyişən yeni axın da tarixçəni yazmalıdır.
- **Cavabsız müraciət pillələri (#224, PRD 8.5)** — müddətlər agentlikdədir (`leadReminderMinutes` /
  `leadAlertMinutes` / `leadReassignMinutes`, defolt 30 dəq / 2 saat / 24 saat, hədlər `LEAD_ALERT_LIMITS`, artan
  sıra), `/kabinet/komanda`-da yalnız sahib dəyişir. Saf qaydalar `lib/accounts/lead-alerts.ts`-dədir. Pillələr:
  xatırlatma məsula (`reminderSentAt`), bildiriş sahibə + `LEADS_MANAGE` menecerlərə məsulun özündən başqa
  (`escalatedAt`), təkrar təyinat təklifi eyni alıcılara (`reassignSuggestedAt`; kartda/siyahıda nişan). Marker şərti
  `updateMany` ilə götürülür, heç bir alıcıya yazılmasa geri qaytarılır; `dedupeKey` pillə + müraciət + alıcıdır.
  Bir neçə pillə birdən çatanda yalnız sonuncusu göndərilir; həddən `LEAD_ALERT_GRACE_HOURS` sonra pillə bildirişsiz
  bağlanır (köhnə müraciət hər cron-da taranmasın). Tarama kursorla səhifələnir (`SCAN_PAGE` × `SCAN_PAGES`), çağırış
  başına ən çox `ALERT_BATCH` pillə. «Tez cavab verir» ölçüsünün 30 dəqiqəlik güzəşti (`LEAD_ESCALATION_MINUTES`) bu
  parametrlərdən asılı deyil.
- **Mini CRM (#226, PRD 9.1/9.2)** — `lib/accounts/crm.ts`, `/kabinet/musteriler` (siyahı, `?q=`/`?mesul=`/`?sehife=`),
  `/yeni`, `/<id>`. `CrmClient`: ad, əlaqə, maraqlandığı elan, ehtiyaclar (alış/kirayə, növ, şəhər/ərazi, qiymət və sahə
  intervalı, otaq, təmir, üstünlüklər) + `CrmClientNote`; taksonomiya/elan id-ləri FK-sızdır (`AgencyTask` kimi), forma
  slug göndərir və `resolveCrmTaxonomy()` ərazinin seçilmiş şəhərin ağacında olduğunu yoxlayır. **Görünmə `crmScope()`-dadır:**
  agentlik üzvünün kartı agentliyin mühitinə aiddir (`agencyId`); sahib və `LEADS_MANAGE` hamısını görür və məsulu dəyişir,
  agent yalnız özününkünü, dayandırılmış üzv agentlik kartlarını görmür; şəxsi kartda `agencyId` boşdur. Agent komandadan
  çıxanda kartları sahibə keçir (`releaseAgentClients` — hər iki çıxış action-unda), hesab silinəndə də; şəxsi kartlar
  hesabla silinir. `phoneKey` (son 9 rəqəm) / `emailKey` təkrar aşkarlanması üçündür, axtarış `searchText`-dədir.
  Müraciət kartından «Müştəri kartı yarat» (`createClientFromLead`) kartı müraciətdən və elandan doldurur və `Lead.clientId`
  bağlayır. Kart məlumatı üçüncü şəxsin əlaqəsidir — data ixracına düşmür.
- **Uyğun elanlar və təkrar müraciətlər (#228, PRD 9.3/9.4)** — `lib/accounts/crm-matching.ts`: ehtiyacdan
  `PropertyFilters` qurulur və ictimai axtarışın `buildPropertyWhere()`-dən keçir (`getCrmMatches`, ən çox
  `CRM_MATCH_LIMIT`, «Hamısı» eyni filtrli `/emlaklar` linkidir); meyar yoxdursa təklif göstərilmir. Dublikat
  `findDuplicateClients()` — yalnız baxanın `crmScope()`-u daxilində, telefon açarı / e-poçt / diakritikasız eyni ad;
  ehtimal `duplicateScore()` = `1 − Π(1 − p)` (telefon 0,9, e-poçt 0,85, ad 0,5), `DUPLICATE_MIN_SCORE` 50.
  **Heç vaxt avtomatik birləşdirilmir:** müraciət kartında «Karta bağla» (`linkLeadToClient`), müştəri kartında
  «Birləşdir» (`mergeClients` → `mergeCrmClientRecords`) təsdiq dialoqundandır; fərqli mühitlərin kartı birləşmir.
- **«Tez cavab verir»** (`lib/accounts/response-stats.ts`, saf): son 90 gün, ≥3 müraciət, median ≤60 dəq, ≥80%
  cavab. Hələ 30 dəqiqəsi keçməmiş cavabsız müraciət nümunəyə düşmür. Ölçülmüş göstərici `AgentProfile.measured*` və
  `Agency.response*`-dədir; admin yazdığı `AgentProfile.responseMinutes` yalnız ehtiyatdır və nişan vermir.
- **Agentlik reytinqi** `lib/agency-ratings.ts`: ictimai agentlərin təsdiqlənmiş rəyləri + agentliyə birbaşa rəylər
  (`AgencyReview`, #230) + `Testimonial.agencyId`, rəy sayı ilə çəkili; profil, kart və `agencySchema` `aggregateRating`-ində.
- **Rəylər (#230, PRD 10.2–10.5)** — ortaq qaydalar `lib/reviews.ts`-dədir (agent və agentlik action-ları eyni yolu işlədir):
  beş meyar (`REVIEW_CRITERIA`; `rating` = ümumi məmnunluq, ictimai orta ondan, meyarlar `ratingCommunication…` profildə
  `ReviewCriteriaSummary` ilə), hesab yoxlanışı (`isVerifiedReviewer` — e-poçt və ya telefon təsdiqli), hədəf başına bir rəy,
  agent/agentlik özünü qiymətləndirmir, «Təsdiqlənmiş əlaqə» (`hasVerifiedInteraction` — rəy yazanın e-poçtu/təsdiqli
  telefonu ilə bu agentə və ya agentliyə müraciət). Şübhə siqnalları (`REVIEW_SUSPICION_FLAGS`: təzə hesab, 24 saatda çox rəy,
  təkrar mətn, müraciətsiz ifrat qiymət) `suspicionFlags`-a yazılır və **yalnız moderatora** göstərilir — rəyi avtomatik
  rədd etmir. Agent öz rəylərinə, agentlik sahibi agentlik rəylərinə `/kabinet/reyler`-də ictimai cavab yazır (yalnız təsdiqlənmiş
  rəy, `saveReviewReply` şərti `updateMany`). İctimai reytinq yalnız `APPROVED` rəylərdən qurulur; admin növbəsi
  `/admin/agentler#reyler` və `#agentlik-reyleri`, menyu sayğacı hər ikisini sayır.
- **Rəydən şikayət (#232, PRD 10.5)** `ReviewReport` (`lib/review-reports.ts`): rəy kartındakı «Şikayət et»
  (`ReviewReportButton`, mətnlər server komponentindən prop kimi — ictimai client kataloqu məhduddur) → `reportReview`
  action. Hədəf FK-sızdır (`reviewKind` `agent`|`agency` + `reviewId`), yalnız `APPROVED` rəyə, istifadəçi başına bir dəfə
  (unikal indeks), öz rəyinə yox, `OTHER` izahsız yox. Admin `/admin/agentler#rey-sikayetleri` rəy üzrə qruplaşdırır:
  «Rəyi gizlət» → `HIDDEN` (reytinqdən çıxır), «Şikayəti rədd et» → rəy qalır; qərar açıq şikayətləri şərti `updateMany`
  ilə götürür (təkrar qərar heç nə etmir), rəy yazılmasa geri `OPEN` olur, şikayətçilərə `REVIEW_REPORT` bildirişi gedir.
  Menyu sayğacı açıq şikayətləri də sayır.
- **Ərazi agentlikləri:** `/rayon/<slug>` altında blok və `/rayon/<slug>/agentlikler` landing-i
  (`getPublicAgencyCatalog({ area })`, ərazi qaydası rayon səhifəsi ilə eynidir). 2-dən az agentlik varsa noindex.

### Kənar HTML keşi (#105)

`wrangler.jsonc` `main`-i `worker.ts`-dir: OpenNext worker-ini sarır və anonim ictimai
HTML-i Cloudflare Cache API-də saxlayır: `EDGE_HTML_CACHE_TTL` saniyə (production-da 60) təzə,
sonra `EDGE_HTML_STALE_TTL` (defolt 1 gün) ərzində köhnə nüsxə dərhal verilir və fonda yenilənir
(stale-while-revalidate, #175). Açar Worker versiyasını (`version_metadata` → `CF_VERSION_METADATA`)
daşıyır — deploy-dan sonra köhnə HTML artıq olmayan JS chunk-larına istinad etməsin.
Qaydalar `src/lib/edge-html-cache.ts`-dədir və `public-cache-policy.ts`-ə söykənir:
sessiya/2FA/preview cookie-li sorğu, sessiya oxuyan marşrut, panel, auth və API keçir;
açar RSC/router başlıqlarını daxil edir; `Set-Cookie` saxlanmır; `IS_STAGING` olan
mühitdə (staging, lokal E2E) keş söndürülüdür. Nəticə: admin dəyişikliyindən sonra həmin data
mərkəzində **ilk** anonim ziyarətçi köhnə nüsxəni bir dəfə görə bilər (60 s-dən köhnədirsə), sonrakılar
yenisini; daxil olmuş istifadəçi həmişə təzəsini. Lokalda SWR-i yoxlamaq üçün stack-i `IS_STAGING:false`
ilə qaldır və sorğuya `Host: luxehomeestate.az` + `x-forwarded-proto: https` əlavə et (yoxsa kanonik host 308 verir). **Yeni ictimai səhifə server tərəfdə
sessiya oxuyursa `SESSION_DEPENDENT_PUBLIC_ROUTES`-a əlavə olunmalıdır** — əks halda
bir istifadəçinin HTML-i başqasına verilə bilər (`public-cache-safety.test.ts` qoruyur).
**Elan detalı (#177) keşlənir:** baxış sayğacı render-də deyil, `PropertyViewBeacon` →
`POST /api/emlaklar/<id>/baxis` ilə yazılır (same-origin, bot filtri, `checkListingViewLimit`);
rezervasiya formasının ad/e-poçtu `GET /api/hesab/elaqe` (`no-store`) ilə brauzerdə doldurulur.
Detal səhifəsinə `recordView`, `headers()`/`cookies()` və ya sessiya oxunuşu əlavə etmə — test yıxılır.
Durable Object sinifləri `worker.ts`-dən yenidən ixrac olunur — sarğını dəyişəndə saxla.

`/media/<açar>` şəkilləri də `worker.ts`-də OpenNext-dən **əvvəl** verilir (`src/lib/media-response.ts`,
#165): Worker cavabı CDN-də öz-özünə keşlənmir, ona görə R2 nəticəsi Cache API-də saxlanılır (açar
yol + `w`/`q`-dur, qalan query string atılır). `src/app/media/[...key]/route.ts` eyni modulu işlədir — qaydanı bir yerdə dəyiş.
Kənar nüsxə 1 gün yaşayır (brauzer bir il); `deleteImage()` bütün ölçüləri `purgeMediaCache()` ilə bu data
mərkəzində təmizləyir. Kiçiltmə alınmayanda orijinal keşə yazılmadan verilir — növbəti sorğu yenidən sınayır.

**Ölçmə (#173):** worker hər HTML/RSC cavabına `Server-Timing` yazır (`app;dur=` — OpenNext başlıqlarına
qədər server vaxtı, `edge;desc=HIT|MISS|BYPASS`). Prisma klienti `$extends` ilə sarılıb: 200 ms-dən uzun sorğu
Workers Logs-a `[db] yavaş sorğu <Model>.<əməliyyat> <ms> ms` kimi yazılır (parametrsiz). Paneldə LCP/INP
orta deyil, p75-dir (`lib/web-vitals-stats.ts`, 60 s-dən böyük fon tabı ölçüləri atılır).

Kanonik `https://luxehomeestate.az/` → `/az` yönləndirməsini də `worker.ts` verir (`src/lib/root-redirect.ts`,
#169): 307 + 1 saatlıq keş, query string saxlanılır. Bu, yalnız `routing.ts`-də `localeDetection: false` olduqca
doğrudur — dil təyinini açsan qısa yol özü söndürülür, amma testi də yenilə.

Cloudflare Web Analytics beacon-u (cookie-siz, razılıq tələb etmir) `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN`
build dəyişəni olanda ictimai səhifələrə əlavə olunur (`analytics-provider.tsx`).

### Əmlak filtrləri

URL query parametrləri filtr vəziyyətinin yeganə mənbəyidir. `SearchPanel` göndərdiyi adlarla
`emlaklar/page.tsx` oxuduğu adlar **eyni olmalıdır**: `elan`, `axtaris`, `tip`, `seher`, `rayon`,
`metro`, `nisangah`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `tarix`, `siralama`, `sehife`.
`tarix` — yerləşdirilmə tarixi (#254, `POSTED_WITHIN_DAYS` 1/3/7/30 gün, `publishedAt` üzrə; saxlanmış axtarışda `postedWithinDays`).
**Oxşar elanlar** (#254, PRD 18.3) `getSimilarProperties()` — eyni elan tipi + şəhərdəki aktiv elanlardan (çatmasa eyni növ) ən çox
60 namizəd, bal `lib/similarity.ts`-də (rayon 25, növ 25, qiymət 25, otaq 15, sahə 10; fərqli valyutada qiymət müqayisə olunmur).
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

Ətraflı siyahı və prioritetlər üçün **`MEMORY.md`** faylına bax. Texniki Wiki-nin mənbəyi
repodakı `Wiki/` qovluğudur (12 səhifə, o cümlədən `Location-Taxonomy`, `Admin-Panel-Guide`,
`Testing-and-Quality`, `Glossary`); GitHub Wiki həmin fayllardan yenilənir. Kod davranışı dəyişəndə
uyğun Wiki səhifəsi, README, AGENTS.md və MEMORY.md eyni PR-da yenilənir. Qısa xülasə:

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
  `ga-disable-<ID>` ilə susdurulur və `_ga*`/`_gid` cookie-ləri silinir; yalnız GTM ilə qoşulubsa və konteyner yüklənibsə
  səhifə yenilənir — **cookie-lərin sayından asılı olmayaraq** (başqa tab onları əvvəlcədən silmiş ola bilər), məntiq `withdrawAnalytics()`-dədir. Yeni analitika/izləmə vasitəsi əlavə edəndə onu da
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
- **D1-də Prisma `include` əlaqələrini ardıcıl yükləyir** — hər əlaqə (və iç-içə əlaqə) EEUR-dakı D1-ə ayrıca
  gediş-gəlişdir (~50–90 ms). Elan detalının ~19 əlaqəli `findFirst`-ü keşsiz render-də 1,7 s çəkirdi; indi hər əlaqə
  ayrıca `findFirst` ilə paralel oxunur (`getPropertyBySlug()`, #179). Ayrı Prisma sorğuları `Promise.all`-da üst-üstə
  düşür. Forma testi və gecikmə testi: `property-detail-query.integration.test.ts`.
  Elan kartları (`propertyCardSelect`) üçün eyni qayda `findPropertyCards()`-dədir (#181) — siyahı, vitrin və oxşar elanlar
  onu işlədir; yeni kart siyahısı yazanda `findMany({ select: propertyCardSelect })` əvəzinə onu çağır.
- Prisma client `src/lib/prisma.ts`-dəki singleton üzərindən istifadə olunur — `new PrismaClient()`
  yazma (istisna: `prisma/` altındakı standalone scriptlər).
- `next.config.ts`-də `images.remotePatterns` `images.unsplash.com` (stok şəkillər),
  `media.luxehomeestate.az` (R2 custom domain) və `treva.realestate` (rəsmi tərəfdaş media-sı)
  mənbələrinə icazə verir. Yeni mənbə əlavə edilərsə bu siyahı yenilənməlidir.
- `next/image` optimizasiyası Cloudflare `IMAGES` binding-i üzərindən gedir (`wrangler.jsonc`). Qlobal loader
  (`src/lib/image-loader.ts`, #167) `/media/...` şəklini `?w=&q=` ilə worker-ə göndərir — worker onu R2-dən
  kiçildib WebP verir və keşləyir; qalan ünvanlar `/_next/image`-ə gedir (worker o cavabı da keşləyir).
  En/keyfiyyət siyahısı `src/lib/image-sizes.ts`-dədir — `next.config` də oradan oxuyur; siyahıdan kənar en 400 alır.
  `/media` şəklinə `unoptimized` yazma — `isUnoptimizedImage()` yalnız `blob:` və SVG üçündür.
- Gizli dəyərlər `.env`-də deyil, Cloudflare secret-lərindədir:
  `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL`,
  `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; istəyə bağlı `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `SMS_PROVIDER_URL`, `SMS_PROVIDER_TOKEN`, `SMS_SENDER` (#109); Telegram bot/Login `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_CLIENT_ID`,
  `TELEGRAM_CLIENT_SECRET`, `TELEGRAM_BOT_USERNAME`; Apple `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`;
  Facebook `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` (`docs/telegram-and-social-login.md`). Yenisi `npx wrangler secret put <AD>` ilə əlavə olunur.
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
