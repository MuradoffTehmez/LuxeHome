# MEMORY.md — Luxe Home Estate layihə yaddaşı

Bu fayl layihənin cari vəziyyətini, qəbul edilmiş qərarları və gözləyən işləri saxlayır.
Kod arxitekturası üçün `CLAUDE.md`-ə bax.

Son yenilənmə: 25 avqust 2026.

---

## 0. Sahiblik

Sayt, **«Luxe Home Estate» brendi və markası** hüquqi şəxs **Əmiyev Bahadur Qafar oğlu**-na məxsusdur.
Kodda `siteConfig.owner` sahəsində saxlanılır; footer-dəki müəllif hüququ bildirişində və
`organizationSchema()` JSON-LD blokunda göstərilir.

---

## 1. Layihənin məqsədi və mərhələsi

**Əsas hədəf: saytı müştəriyə (Luxe Home Estate MMC) bəyəndirmək.** Frontend-first mərhələ və
admin auth qatı artıq tamamlanıb (canlı: `luxehomeestate.az`). **25 avqust 2026-da qərar
genişləndi: hədəf artıq təkcə frontend deyil, hər iki PRD sənədinin (bölmə 10-a bax) 100%
koda köçürülməsidir.** Bu, işin uzunmüddətli hədəfidir — qısamüddətli prioritetləşdirmə hələ
də ardıcıl, kiçik, təsdiqlənən addımlarla gedir (bax bölmə 10).

Bazar: Bakı, Azərbaycan. Şirkət: Luxe Home Estate MMC, Əliyar Əliyev 109A.

---

## 2. Təsdiqlənmiş qərarlar

| Mövzu | Qərar |
|---|---|
| Admin panel | **Tam admin panel qurulacaq.** Auth qatı 21 avqust 2026-da tamamlandı (bax bölmə 9); CRUD hələ qalır. |
| Verilənlər bazası + hosting | **Qərar verilib (20 avqust 2026): tam Cloudflare.** Workers (OpenNext), D1, R2, Images. Supabase və PostgreSQL layihədən çıxarılıb. |
| Media yükləmə | **Cloudflare R2** — `luxehome-media` bucket və `MEDIA` binding hazırdır. Upload route və admin inteqrasiyası hələ yazılmayıb. |
| Dil | **AZ + RU.** Hazırda yalnız AZ. Çoxdilliliyin gec əlavə edilməsi baha başa gəlir — arxitektura qərarları buna hazırlıqlı verilməlidir. |
| Lead bildirişi | **Telegram bot.** Yeni müraciət gələndə sistem bot vasitəsilə bildiriş göndərəcək. |
| Spam qoruma | Honeypot + rate limit **və** Cloudflare Turnstile — hər ikisi olacaq, amma frontend-dən sonra. |
| Test / CI / analitika | **İndilik yox.** `npm run typecheck` + `npm run build` yeganə qapı olaraq qalır. |

---

## 3. Frontend prioritetləri (cari mərhələ)

Müştəri təqdimatı üçün dördü də vacib sayılıb:

1. ~~**Filtr/axtarış UI-ın tamamlanması**~~ — **tamamlandı (13 avqust 2026)**, bax bölmə 5b.
   Yalnız xüsusiyyət filtri (`featureSlugs`) hələ UI-a bağlanmayıb — çoxseçimli olduğu üçün
   ayrıca komponent tələb edir.
2. **Vizual cəlbedicilik** — hover, animasiya, scroll reveal, səhifə keçidləri. Son commit-lər
   bu istiqamətdə idi (`695b769`, `a5e1895`, `558fa3c`).
3. **Mobil təcrübə** — ziyarətçilərin əksəriyyəti telefondan baxır. Drawer, sticky CTA, toxunma
   sahələri, qalereya swipe, filtr üçün bottom-sheet.
4. **Əmlak detal səhifəsi** — ən çox konversiya verən səhifə. `emlaklar/[slug]/page.tsx`-də
   4 istifadə olunmayan import var (`Link`, `Info`, `cn`, `isClosed`) — yarımçıq qalmış işə işarədir.

---

## 4. Çatışmayan səhifələr — **20 avqust 2026-da bağlandı**

- ~~`/favoritler`~~ — qurulub. Server Action (`favoritler/actions.ts`) localStorage-dəki ID-ləri
  alıb ictimai əmlakları qaytarır.
- ~~Hüquqi səhifələr~~ — `/mexfilik-siyaseti`, `/istifade-sertleri`, `/cookie-siyaseti` qurulub
  (`components/site/legal-article.tsx` ümumi çərçivə). **Mətnlər hüquqşünas təsdiqi gözləyir.**
- ~~`not-found.tsx`, `error.tsx`~~ — brendli AZ versiyaları var. `loading.tsx` hələ yoxdur.
- ~~`sitemap.ts` + `robots.ts`~~ — qurulub, `getSitemapEntries()` çağırılır.

---

## 5. Bilinən buglar

| Yer | Problem |
|---|---|
| `queries.ts` | SQLite `LIKE` Azərbaycan hərflərində (ə, ş, ç, ğ, ı, ö, ü) reqistrə həssasdır — mətn axtarışı böyük hərflə yazılmış sorğuları tapmır. |

---

## 5b. UI/UX düzəlişləri — 13 avqust 2026

`ui-ux-pro-max` üzrə audit nəticəsində düzəldilənlər:

**Funksional qırıqlar**
- `SearchPanel` `novu` / `min_qiymet` / `max_qiymet` parametrlərini göndərirdi, `emlaklar/page.tsx`
  isə `elan` / `min` / `max` oxuyurdu — **saytın əsas axtarışı elan növü və qiymət üzrə heç nə
  filtrləmirdi**. Dəyər də yanlış idi (`satilir` əvəzinə `SALE` olmalıdır). Parametr adları
  hər iki tərəfdə vahid hala gətirildi.
- Kartdakı favorit düyməsi klik qəbul etmirdi: başlıq linkinin `after:inset-0` örtüyü DOM-da
  sonra gəldiyi üçün düymənin üstünə düşürdü. Düyməyə `z-10` verildi.
- `emlaklar/[slug]` səhifəsində satılmış/kirayə verilmiş əmlak hələ də «Bu əmlakla
  maraqlanırsınız?» CTA-sı göstərirdi. İndi status bildirişi ilə əvəzlənir.

**Əlçatanlıq (WCAG)**
- `field.tsx` və `search-panel.tsx`-də `focus:outline-none` klaviatura fokus konturunu silirdi —
  bütün formaları əhatə edən pozuntu idi. Silindi, `:focus-visible` bərpa olundu.
- Dark rejimdə `--color-ink-muted` açıq rejimlə eyni idi (2.6:1 kontrast). İndi 5.1:1.
  `--color-line-strong` input sərhədi 1.7:1 idi → 3.3:1 (WCAG 1.4.11).
- Kartdakı favorit düyməsi 40px idi → 44px (toxunma hədəfi minimumu).
- Kart qiyməti açıq şəkillərdə (ağ villa, hovuz) oxunmurdu — gradient gücləndirildi.

**Struktur**
- `Section` boşluğu artıq `spacing` propu ilə verilir. Əvvəl `className="py-10 sm:py-12"`
  yazılırdı, amma bazadakı `lg:py-24` qüvvədə qalırdı — **10 çağırış yerində desktop boşluğu
  səssizcə override olunmurdu**.

**Yeni funksionallıq**
- Filtrlərin hamısı UI-a bağlandı: mətn axtarışı, rayon (şəhərdən asılı kaskad), sahə aralığı,
  təmir vəziyyəti, sənəd statusu. Ətraflı filtrlər progressive disclosure ilə gizlidir.
- Sıralama seçimi (`SortSelect`) — `SORT_OPTIONS` artıq UI-da istifadə olunur.
- Aktiv filtr nişanları (chip) — tək kliklə götürülür, «Hamısını sıfırla» linki var.
- Filtr vəziyyəti axtarışdan sonra saxlanılır (`initial` propu ilə, `useSearchParams` olmadan —
  ana səhifə statik qalır).
- Mobil ekranda filtrlər yığılmış gəlir.

Bütün lint warning-ləri təmizləndi: `npm run typecheck`, `npx eslint .` və `next build` — 0 xəta,
0 xəbərdarlıq.

---

## 6. TODO backlog (frontend bitdikdən sonra)

### Backend / infrastruktur
- [x] Admin panel auth — **tamamlandı 21 avqust 2026**, bax bölmə 9.
- [ ] Admin CRUD: əmlak, layihə, xidmət, blog, lead, media, istifadəçi, parametrlər.
- [ ] Dashboard səhifəsi — `getDashboardStats()` hazırdır, çağıran yoxdur.
- [ ] Media yükləmə: R2 (`MEDIA` binding) hazırdır. Upload route (`/api/upload`), `Media` modelinə
      yazma və admin `ImageDropzone` inteqrasiyası qalır.
- [ ] Telegram bot inteqrasiyası — yeni lead bildirişi.
- [ ] **Contact form spam qoruması: honeypot + rate limit, sonra Cloudflare Turnstile.**
      Hazırda `elaqe/actions.ts` heç bir qorumaya malik deyil.
- [x] `prisma/remove-demo-content.sql` və lokal/remote təmizləmə scriptləri əlavə edildi.
- [ ] Azərbaycanca axtarış üçün normallaşdırılmış (kiçik hərfli) sütun əlavə etmək —
      `mode: "insensitive"` D1-də yoxdur.

### Çoxdillilik (AZ + RU)
- [ ] Routing strategiyası seç (`[locale]` seqmenti və ya domen/subdomen).
- [ ] Sxemə tərcümə sahələri və ya tərcümə cədvəlləri əlavə et (`Property`, `Project`, `Service`,
      `BlogPost`, `PropertyType`, `Location`, `Feature`).
- [ ] UI mətnlərini kodun içindən çıxar (hazırda hamısı hardcode olunub).

### Keyfiyyət
- [ ] Xüsusiyyət filtri (`featureSlugs`) — çoxseçimli komponent, hovuz/qaraj/lift və s.
- [ ] GitHub Actions CI: test + typecheck + build + lint.
- [ ] Vitest — `queries.ts` filtr məntiqi üçün unit testlər (auth qatı artıq örtülüb, 40 test).
- [ ] Playwright — kritik axın (axtarış → detal → müraciət) üçün e2e.
- [ ] Analitika (GA4 / Plausible) + Google Search Console.

### Kontent
- [ ] `siteConfig.geo` — ofisin dəqiq koordinatları şirkətdən alınmalıdır (hazırkı dəyər təxminidir).
- [ ] `siteConfig.workingHours` — real iş qrafiki təsdiqlənməlidir.
- [x] Təsdiqlənməmiş statistika və demo məzmun saytdan çıxarıldı.
- [ ] Unsplash stok şəkilləri şirkətin öz foto arxivi ilə əvəzlənməlidir
      (`next.config.ts`-dəki `remotePatterns` qaydası sonra silinə bilər).

---

## 7. Layihənin texniki sağlamlığı (13 avqust 2026)

- `npx tsc --noEmit` → 0 error.
- `npx next build` → uğurlu, 13 route (7 statik, 6 dinamik), First Load JS 103 kB shared.
- `npx eslint .` → 0 error, 6 warning (istifadə olunmayan importlar).
- Mənbə kodu: ~6 700 sətir (`src/`).
- Git: `main` branch, 27 commit.
- `.env` düzgün şəkildə `.gitignore`-dadır; yalnız `.env.example` izlənir.


---

## 8. Cloudflare yayımı — 20 avqust 2026

**Vəziyyət: ictimai sayt canlıdır.**

- Worker: `luxehomeestate` → `https://luxehomeestate.az` və `https://www.luxehomeestate.az`
- D1: `luxehome-db` (`86d5f7e0-ffe6-48d8-bd84-d88163550b2a`) — `migrations/0001_init.sql`
  tətbiq olunub; demo məzmun 21 avqust 2026 tarixində təmizlənib
- R2: `luxehome-media`, `luxehome-next-cache`
- Secret-lər: `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL`

### Yayım zamanı həll edilən problemlər

| Problem | Həll |
|---|---|
| Prisma Workers-də `debian-openssl-1.1.x` binary engine axtarırdı | `@prisma/client/wasm.js`-dən idxal. `exports` xəritəsində `node` açarı `workerd`-dən əvvəl gəlir, esbuild isə `platform: "node"` işlədir. |
| Module səviyyəsində `new PrismaClient()` binding tapmırdı | `src/lib/prisma.ts` Proxy arxasında lazy qurma. |
| Səhifələr build zamanı D1-ə müraciət edib çökürdü | D1 oxuyan 9 səhifədə `dynamic = "force-dynamic"`. |
| `process.env.RESEND_API_KEY` modul yüklənərkən boş idi | `src/lib/email.ts` konfiqurasiyası lazy funksiyalara köçürüldü. |
| Remote D1-də köhnə boş sxem miqrasiyanı bloklayırdı | `prisma/reset-d1.sql` ilə cədvəllər silindi (0 sətir itirilməyib). |

### Yayımdan sonra qalan işlər

- [x] `luxehomeestate.az` və `www.luxehomeestate.az` Worker-ə bağlandı (20 avqust 2026).
      Canonical URL-lər, sitemap və robots.txt production ünvanını göstərir.
      `workers.dev` alt domeni custom domain əlavə olunduqdan sonra söndü.
- [ ] R2 üçün `media.luxehomeestate.az` public custom domain qurmaq.
- [ ] Resend-də `luxehomeestate.az` domenini təsdiqləmək (hazırda `onboarding@resend.dev`
      göndərici ünvanı işlədilir — production üçün uyğun deyil).
- [ ] Cloudflare Images transformations-u zone səviyyəsində aktivləşdirmək.
- [x] Panel staging-də yoxlanandan sonra prod `vars`-ında `ADMIN_ENABLED="true"` edildi
      (27 avqust 2026) — `/admin` və `/giris` artıq production-da açıqdır.
- [ ] `npm run preview` (workerd) ilə lokal test axını qurmaq — `next dev` Node-da wasm
      engine-i yükləyə bilmir.

---

## 9. Admin auth qatı — 21 avqust 2026

**Vəziyyət: kod hazırdır və `feat/cloudflare-workers-d1-deployment` branch-ındadır.
Staging yayımı və əl ilə yoxlama hələ icra olunmayıb.**

Plan: `docs/superpowers/plans/2026-08-21-staging-ve-auth.md` (10 task).
Dizayn: `docs/superpowers/specs/2026-08-20-staging-ve-auth-design.md`.

### Nə quruldu

| Task | Nəticə |
|---|---|
| 1-2 | `env.staging` bloku (ayrı worker, D1, R2); `SITE_URL` runtime-a keçdi; staging `noindex` |
| 3 | Miqrasiya `0002_auth_and_market_fields.sql` — `Session`, `BackupCode`, `LoginAttempt` cədvəlləri + `User` auth sahələri |
| 4 | Vitest (`@cloudflare/vitest-plugin`, workerd runtime); PBKDF2 parol hash-ı |
| 5 | TOTP + AES-GCM ilə şifrələnmiş sirr + 10 birdəfəlik ehtiyat kod |
| 6 | D1-də saxlanan, dərhal ləğv edilə bilən sessiyalar |
| 7 | `hasPermission()` RBAC, hesab kilidi, IP sürət limiti, guard-lar |
| 8 | Giriş ekranları: parol → 2FA qurulumu / doğrulama → sessiya |
| 9 | `middleware.ts` imza yoxlaması, `admin/layout.tsx` guard-ı, `/admin/hesabim`, `forbidden.tsx` |
| 10 | `prisma/create-admin.ts` — ilk SUPER_ADMIN üçün SQL generatoru |

Keyfiyyət qapısı: 40 test, `typecheck` və `build` təmiz.

### Qərarlar

- **Sessiya D1-dədir, stateless JWT deyil.** Cookie yalnız imzalanmış sessiya ID-si daşıyır.
  Səbəb: işdən çıxan əməkdaşın və ya oğurlanmış cookie-nin girişini dərhal bağlamaq lazımdır.
- **2FA məcburidir.** 2FA qurmamış istifadəçi ilk girişdə qurulum ekranından keçir; panelə
  bundan əvvəl düşə bilmir.
- **Parol PBKDF2-dir, bcrypt deyil.** Saf JS bcrypt Workers-də bir girişə 150-400 ms CPU yeyir.
- **`seed.ts` artıq giriş edilə bilən hesab yaratmır** — `seed.sql` git-ə commit olunur,
  orada işlək hash saxlamaq repoya parol yerləşdirmək deməkdir.

### Qalan addımlar (Task 10, əl ilə icra)

1. Staging secret-ləri: `AUTH_SECRET` (prod-dan **fərqli**), `RESEND_API_KEY`,
   `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL` — `npx wrangler secret put <AD> --env staging`.
2. `npm run db:migrate:staging` və `npm run db:seed:staging`.
3. `npm run auth:create-admin` → çıxan INSERT-i `npx wrangler d1 execute luxehome-db-staging
   --remote --env staging --command "<INSERT>"` ilə tətbiq et.
4. `npm run deploy:staging`, sonra prod-un toxunulmadığını yoxla.
5. Spec bölmə 7-dəki 13 bəndlik əl ilə yoxlama siyahısı.

---

## 10. Tam PRD tamamlama yol xəritəsi — 25 avqust 2026

**Qərar: hər iki PRD sənədi (`docs/LuxeHomeEstate — Full Platform & Advanced Admin Panel
PRD.md`, `docs/LuxeHomeEstate — Geniş Miqyaslı Public Platform PRD.md`) uzunmüddətdə 100%
koda köçürülməlidir.** 25 avqust 2026 tarixli audit: Phase 1 MVP üzrə hər iki sənəd ~75% və
~74% tamamlanıb; sənədlərin tam əhatəsinə görə (Finance/CRM, AI, reservation və s. daxil) isə
~30-35%.

İş rejimi **ardıcıldır** — hər maddə tamamlanıb təsdiqlənəndən sonra növbətiyə keçilir,
paralel deyil. Təsdiqlənmiş sıra:

1. **Saved Search + Recently Viewed + Notification Center** — cari iş.
2. AI axtarış + Reservation (görüş sistemi) — təqvim inteqrasiyalı (Google Calendar). AI
   provider hələ qəti deyil, namizəd: **Cloudflare Workers AI**.
3. Telegram bot qurulumu (lead bildirişi) — bot token/chat ID hələ yoxdur, əvvəlcə yaradılmalıdır.
4. Agent (əmlakçı) ictimai profili — **ayrıca entity** kimi, agentlik əməkdaşı modelindən asılı
   olmayaraq: foto+əlaqə+bio, aktiv elanlar siyahısı, reytinq/rəy sistemi, statistika (satış
   sayı və s.).
5. CMS statik səhifə redaktoru — Haqqımızda, Xidmətlər, Ana səhifə blok/bannerlər.
6. Watermark (şəkil qorunması) — aşağı prioritet, media/upload işi ilə bundle olunacaq.
7. Finance/CRM/Ödəniş sistemi — **yalnız struktur/UI**, real ödəniş provider inteqrasiyası yox
   (bu mərhələdə).
8. Backup / system health / cron monitoring — ən sonda, funksional modullar bitdikdən sonra.

Bu sıra `AskUserQuestion` vasitəsilə istifadəçi ilə birbaşa təsdiqlənib (bax
`.claude` yaddaş faylı `luxehome-prd-full-scope-goal.md`). Hər maddə brainstorming
skill-inin architectural yolu ilə gedir: kontekst araşdırması → suallar → yanaşmalar →
dizayn → spec (`docs/superpowers/specs/`) → təsdiq → `writing-plans`.
