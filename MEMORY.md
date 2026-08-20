# MEMORY.md — Luxe Home Estate layihə yaddaşı

Bu fayl layihənin cari vəziyyətini, qəbul edilmiş qərarları və gözləyən işləri saxlayır.
Kod arxitekturası üçün `CLAUDE.md`-ə bax.

Son yenilənmə: 20 avqust 2026.

---

## 0. Sahiblik

Sayt, **«Luxe Home Estate» brendi və markası** hüquqi şəxs **Əmiyev Bahadur Qafar oğlu**-na məxsusdur.
Kodda `siteConfig.owner` sahəsində saxlanılır; footer-dəki müəllif hüququ bildirişində və
`organizationSchema()` JSON-LD blokunda göstərilir.

---

## 1. Layihənin məqsədi və mərhələsi

**Əsas hədəf: saytı müştəriyə (Luxe Home Estate MMC) bəyəndirmək.** Bu səbəbdən cari mərhələdə
diqqət **frontend**-dədir. Müştəri tam razılıq verdikdən sonra backend qatı yığılacaq.

Bu, işin prioritetləşdirilməsində həlledici meyardır: vizual nəticə verən iş backend
mükəmməlliyindən üstündür. Frontend-i sürətləndirmək üçün sadə/standart JavaScript həlləri
qəbul edilir.

Bazar: Bakı, Azərbaycan. Şirkət: Luxe Home Estate MMC, Əliyar Əliyev 109A.

---

## 2. Təsdiqlənmiş qərarlar

| Mövzu | Qərar |
|---|---|
| Admin panel | **Tam admin panel qurulacaq** — jose ilə JWT sessiya, middleware qoruma, rol əsaslı icazə, əmlak/layihə/blog/lead CRUD, media yükləmə. Frontend bitdikdən sonra. |
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
| `add-mocks.ts:73` | `pricePeriod: "MONTHLY"` — düzgün dəyər `"MONTH"` (`constants.ts:145`). Kirayə qiymət periodu UI-da düzgün göstərilmir. |
| `add-mocks.ts` | Elanlar `status: "PUBLISHED"` ilə yaradılır, amma `publishedAt` set olunmur. Default sıralama `publishedAt desc, createdAt desc`-dir — bu elanlar sıralamada aşağı düşür. |
| `add-mocks.ts:48` | Slug generatoru `[^a-z0-9]+` istifadə edir; Azərbaycan hərfləri (ə, ş, ç, ğ, ı, ö, ü) silinir → `gənclik` yerinə `g-nclik`. `lib/utils.ts`-dəki slugify istifadə olunmalıdır. |
| `package.json` | `db:clean-demo` scripti silinib — `prisma/clean-demo.ts` heç vaxt yazılmamışdı. Demo təmizləmə hələ də lazımdır. |
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
- [ ] Admin panel: auth (jose JWT + httpOnly cookie), `middleware.ts` route qoruma,
      rol əsaslı icazə yoxlaması (`ROLE_PERMISSIONS` artıq hazırdır).
- [ ] Admin CRUD: əmlak, layihə, xidmət, blog, lead, media, istifadəçi, parametrlər.
- [ ] Dashboard səhifəsi — `getDashboardStats()` hazırdır, çağıran yoxdur.
- [ ] Media yükləmə: R2 (`MEDIA` binding) hazırdır. Upload route (`/api/upload`), `Media` modelinə
      yazma və admin `ImageDropzone` inteqrasiyası qalır.
- [ ] Telegram bot inteqrasiyası — yeni lead bildirişi.
- [ ] **Contact form spam qoruması: honeypot + rate limit, sonra Cloudflare Turnstile.**
      Hazırda `elaqe/actions.ts` heç bir qorumaya malik deyil.
- [ ] `prisma/clean-demo.ts` yaz — `isDemo: true` qeydləri təmizləyən script.
- [ ] Azərbaycanca axtarış üçün normallaşdırılmış (kiçik hərfli) sütun əlavə etmək —
      `mode: "insensitive"` D1-də yoxdur.

### Çoxdillilik (AZ + RU)
- [ ] Routing strategiyası seç (`[locale]` seqmenti və ya domen/subdomen).
- [ ] Sxemə tərcümə sahələri və ya tərcümə cədvəlləri əlavə et (`Property`, `Project`, `Service`,
      `BlogPost`, `PropertyType`, `Location`, `Feature`).
- [ ] UI mətnlərini kodun içindən çıxar (hazırda hamısı hardcode olunub).

### Keyfiyyət
- [ ] Xüsusiyyət filtri (`featureSlugs`) — çoxseçimli komponent, hovuz/qaraj/lift və s.
- [ ] GitHub Actions CI: typecheck + build + lint.
- [ ] Vitest — `queries.ts` filtr məntiqi üçün unit testlər.
- [ ] Playwright — kritik axın (axtarış → detal → müraciət) üçün e2e.
- [ ] Analitika (GA4 / Plausible) + Google Search Console.

### Kontent
- [ ] `siteConfig.geo` — ofisin dəqiq koordinatları şirkətdən alınmalıdır (hazırkı dəyər təxminidir).
- [ ] `siteConfig.workingHours` — real iş qrafiki təsdiqlənməlidir.
- [ ] `demoStats` — rəqəmlər şirkət tərəfindən təsdiqlənməyib; real rəqəm gələnə qədər `isDemo: true` qalır.
- [ ] Unsplash demo şəkilləri şirkətin öz foto arxivi ilə əvəzlənməlidir
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

- Worker: `luxehomeestate` → `https://luxehomeestate.amiyevbahadur.workers.dev`
- Hədəf domen: `luxehomeestate.az` (zone artıq Cloudflare-dədir)
- D1: `luxehome-db` (`86d5f7e0-ffe6-48d8-bd84-d88163550b2a`) — `migrations/0001_init.sql`
  tətbiq olunub, `prisma/seed.sql` (212 sətir demo məzmun) yüklənib
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

- [ ] `luxehomeestate.az` custom domain-ini Worker-ə bağlamaq və `NEXT_PUBLIC_SITE_URL`-i yoxlamaq.
- [ ] R2 üçün `media.luxehomeestate.az` public custom domain qurmaq.
- [ ] Resend-də `luxehomeestate.az` domenini təsdiqləmək (hazırda `onboarding@resend.dev`
      göndərici ünvanı işlədilir — production üçün uyğun deyil).
- [ ] Cloudflare Images transformations-u zone səviyyəsində aktivləşdirmək.
- [ ] Admin panel auth-u yazıb `ADMIN_ENABLED="true"` etmək.
- [ ] `npm run preview` (workerd) ilə lokal test axını qurmaq — `next dev` Node-da wasm
      engine-i yükləyə bilmir.
