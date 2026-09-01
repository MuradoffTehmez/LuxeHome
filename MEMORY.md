# MEMORY.md — Luxe Home Estate layihə yaddaşı

Bu fayl layihənin cari vəziyyətini, qəbul edilmiş qərarları və gözləyən işləri saxlayır.
Kod arxitekturası üçün `CLAUDE.md`-ə bax.

Son yenilənmə: 1 sentyabr 2026.

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
| Admin panel | Auth və əsas CRUD hazırdır; növbəti böyük boşluqlar Finance/CMS və panel UI-ının çoxdilliliyidir. |
| Verilənlər bazası + hosting | **Qərar verilib (20 avqust 2026): tam Cloudflare.** Workers (OpenNext), D1, R2, Images. Supabase və PostgreSQL layihədən çıxarılıb. |
| Media yükləmə | **Cloudflare R2 + Images** — admin və kabinet upload route-ları, WebP/thumbnail və magic-byte yoxlaması işləyir. |
| Dil | İctimai sayt, kabinet **və admin panel** AZ + EN + RU dillərindədir. Panel dili `User.locale`-dan gəlir (`/admin` locale prefiksi daşımır). |
| Lead bildirişi | **Telegram bot.** Yeni müraciət gələndə sistem bot vasitəsilə bildiriş göndərəcək. |
| Spam qoruma | Same-origin + honeypot + IP rate limit + Cloudflare Turnstile tətbiq olunub. |
| Test / CI / analitika | Vitest və GA/GTM işləyir; GitHub Actions `test + typecheck + lint + build` qapısını avtomatlaşdırır. **2 sentyabr 2026-dan CI həm staging, həm production-a yayım edir və hər mühitin D1 miqrasiyalarını deploy-dan əvvəl tətbiq edir.** Browser E2E hələ yoxdur. |
| Real Estate Knowledge Hub | D1 əsaslı bələdçi, hüquqi FAQ, lüğət, kalkulyator və admin CMS hazırdır. Mənbə hüquqi araşdırma DRAFT idxal edilir; yayımdan əvvəl hüquqşünas baxışı tələb olunur. |

---

## 3. Frontend vəziyyəti

İlkin təqdimat prioritetləri tamamlanıb: bütün filtrlər (xüsusiyyətlər daxil), mobil
bottom-sheet/drawer, sticky CTA-lar, qalereya və əmlak detal axını işləyir. Səhifə keçidində
düzgün 404 statusunu qorumaq üçün public route səviyyəli `loading.tsx` qəsdən yoxdur;
`(site)/template.tsx` və `NavigationProgress` Suspense yaratmadan geribildirim verir.

---

## 4. Çatışmayan səhifələr — **20 avqust 2026-da bağlandı**

- ~~`/favoritler`~~ — qurulub. Server Action (`favoritler/actions.ts`) localStorage-dəki ID-ləri
  alıb ictimai əmlakları qaytarır.
- ~~Hüquqi səhifələr~~ — `/mexfilik-siyaseti`, `/istifade-sertleri`, `/cookie-siyaseti` qurulub
  (`components/site/legal-article.tsx` ümumi çərçivə). **Mətnlər hüquqşünas təsdiqi gözləyir.**
- ~~`not-found.tsx`, `error.tsx`~~ — üçdilli brend versiyaları var. Public `loading.tsx`-in
  olmaması unudulmuş iş deyil, düzgün HTTP 404 statusu üçün qəbul edilmiş güzəştdir.
- ~~`sitemap.ts` + `robots.ts`~~ — qurulub, `getSitemapEntries()` çağırılır.

---

## 5. Bilinən boşluqlar

| Yer | Problem |
|---|---|
| Kabinet moderasiyası | Kabinet elanına koordinat əlavə olundu, lakin moderator baxışında xəritə önizləməsi yoxdur. |
| Browser axınları | Avtomatlaşdırılmış Playwright/E2E yoxdur; production smoke testi manualdır. |
| Phase 3 / AI | Semantik axtarış, Match Score, chatbot və map draw search yazılmayıb (PRD bölmə 180). Panel tərəfdə yalnız AI təsvir generatoru və foto məsləhətçisi var. Hər ikisi 1 sentyabr 2026-da düzəldildi (Workers AI JSON mode + xarici şəkil URL-ləri); production-a yayım gözləyir. |
| Finance / statik CMS | Knowledge Hub üçün domen CMS-i hazırdır; paket, ödəniş və ümumi statik səhifə redaktoru hələ yoxdur (Admin PRD). |

Azərbaycan hərfləri ilə registrsiz axtarış 28 avqustda `searchText` / `searchName`
sütunları və `normalizeSearchText()` ilə həll olunub.

---

## 5c. Nümunə (demo) məzmun rejimi — 1 sentyabr 2026

Test və müştəri təqdimatı üçün saytı dolu göstərən məzmun dəsti qurulub.

**Həcm:** 15 əmlak kateqoriyasının hər biri üçün 20 elan (cəmi 300), 12 yaşayış
kompleksi, 6 agentlik, 12 agent, 12 tərəfdaş, 20 bloq yazısı. Elan mətnləri reklam
üslubundadır; hər təsvirin sonunda nümunə bildirişi var və slug-lar `demo-` prefikslidir.

**İdarəetmə:** `/admin/demo-mezmun` səhifəsindəki açar (`demo.content_enabled`).
Rejim bağlı olanda nümunə qeydlər saytda görünmür, real məzmun isə hər iki halda görünür.

**Qəbul edilmiş qərarlar:**

- Görünürlük **yalnız sorğu şərtindədir** — `isDemo` bayrağı heç vaxt dəyişmir.
  Toplu status yeniləməsi D1-də tranzaksiya olmadığı üçün yarımçıq qala bilərdi və
  nümunə qeydi real qeyddən ayırd etmək imkanını itirərdi.
- `publicPropertyWhere()` və `publicPartnerWhere()` **async edildi**. Şərti hər çağırış
  yerinə əl ilə əlavə etmək variantı rədd edildi: bir yerdə unudulsa, rejim saytın
  yalnız bir hissəsində işləyərdi.
- Sitemap və SEO auditi ayrıca `indexable*Where()` funksiyalarından keçir və nümunə
  məzmunu **heç vaxt** daxil etmir. Səbəb: rejim söndürüləndən sonra indeksdə qırıq
  URL-lər qalardı.
- Nümunə agentliklər sahib istifadəçi tələb edir; onlar `.test` domenində və
  `passwordHash = 'disabled'` ilə yaradılır — giriş mümkün deyil.

**Nümunə məzmun yalnız staging bazasındadır** (2 sentyabr 2026 qərarı). Production-a
bir dəfə yüklənib dərhal geri silindi; orada yalnız `isDemo` sütunları qalır.

Açar heç yazılmayıbsa mühit defoltu işləyir: staging-də açıq (`IS_STAGING=true`),
production-da bağlı. Paneldəki açar defoltdan üstündür. Səbəb: staging test və
təqdimat mühitidir (robots-da tam `Disallow: /`), orada nümunə məzmunu görmək üçün
əlavə addım tələb etmək mənasızdır; production-da isə səhvən görünməsi ciddi xətadır.

Miqrasiya `0027_demo_content_flags.sql` — hər iki mühitdə tətbiq olunub. Eyni yayımda
`0025_serp_ecosystem` (staging) və `0026_normalize_theme_preference` (hər ikisi) də
tətbiq edildi; onlar əvvəldən gözləyirdi. **Staging bazası o vaxta qədər tamamilə boş
idi** — `db:seed:staging` + `db:taxonomy:staging` ilk dəfə orada işlədildi.

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
- [x] Admin CRUD: əmlak, layihə, xidmət, bloq, lead, media, istifadəçi, parametr və tərəfdaşlar.
- [x] Dashboard səhifəsi real D1 statistikalarını göstərir.
- [x] Media yükləmə: admin və kabinet R2 upload route-ları, `Media` yazması və `ImageDropzone`.
- [ ] Telegram bot inteqrasiyası — yeni lead bildirişi. **Hələ yazılmayıb**: kodda `TELEGRAM` izi yoxdur.
- [x] Contact/auth form spam qoruması: origin + honeypot + rate limit + Turnstile.
- [x] `prisma/remove-demo-content.sql` və lokal/remote təmizləmə scriptləri əlavə edildi.
- [x] Azərbaycanca axtarış üçün normallaşdırılmış `searchText` / `searchName` sütunları.

### Çoxdillilik (AZ + EN + RU)
- [x] `[locale]` routing, middleware və locale cookie-si.
- [x] İctimai kontent üçün tərcümə sahələri/cədvəlləri və admin tərcümə modulu.
- [x] İctimai sayt və kabinet mətnləri `next-intl` kataloqlarına çıxarılıb.
- [x] Admin panel UI mətnləri tərcümə qatına qoşuldu (`src/i18n/admin.ts`, `getAdminT()`).

### Keyfiyyət
- [x] Xüsusiyyət filtri (`featureSlugs`) — çoxseçimli komponent, hovuz/qaraj/lift və s.
- [x] GitHub Actions CI: test + typecheck + lint + build; secret olduqda remote D1 statusu.
- [x] Vitest — filtr birləşməsi və axtarış normallaşdırması üçün regresiya testləri.
- [ ] Playwright — kritik axın (axtarış → detal → müraciət) üçün e2e.
- [x] GA/GTM consent qapısı və Web Vitals/brauzer xəta monitorinqi.

### Kontent
- [x] Ofis koordinatı — `Parametrlər → Ofisin xəritədəki yeri` bölməsindən xəritədən seçilir
      (`site.contact_latitude` / `site.contact_longitude`). Kodda təxmini defolt qəsdən yoxdur.
- [ ] İş saatları — `SERP → Local SEO` formasında doldurulur və JSON-LD `openingHours`-a düşür,
      lakin real qrafik hələ şirkət tərəfindən təsdiqlənməyib (sahə boşdur).
- [x] Təsdiqlənməmiş statistika və demo məzmun saytdan çıxarıldı.
- [ ] Unsplash stok şəkilləri şirkətin öz foto arxivi ilə əvəzlənməlidir
      (`next.config.ts`-dəki `remotePatterns` qaydası sonra silinə bilər).

---

## 6b. Xəritə, geokodlaşdırma və Zero Trust — 1 sentyabr 2026

### Xəritə qatı

Bütün xəritələr `src/components/map/leaflet-map.tsx` üzərindən gedir: elan detalı,
layihə detalı, «Əlaqə» səhifəsi, `/emlaklar?gorunus=xerite` nəticə xəritəsi və
panelin koordinat seçicisi.

| Qərar | Səbəb |
|---|---|
| Tile provayderi **Geoapify** | CARTO açarsız basemap istifadəsini dayandırıb — tile-ların üstünə «API KEY REQUIRED» yazısı basılır. OSM standart tile-ları isə POI ilə doludur və OSMF siyasəti kommersiya yükünü məhdudlaşdırır. |
| Tile-lar **proxy** üzərindən (`/api/map-tiles/...`) | Tile `<img>` ilə yüklənir; birbaşa istifadə `GEOAPIFY_API_KEY`-i hər ziyarətçiyə göstərərdi. Proxy həm də panel CSP-sini (`img-src 'self'`) toxunulmaz saxlayır. |
| Ehtiyat mənbə | Dörd tile ardıcıl uğursuz olarsa xəritə açarsız `tile.openstreetmap.org`-a keçir — kvota bitəndə xəritə boz düzbucaqlıya çevrilməməlidir. |
| Geokodlaşdırma `/api/geocode` | Geoapify açarı serverdə qalır; sessiya, same-origin və sürət limiti tətbiq olunur. |

**Bilinən tələ (bir dəfə baş verib):** proxy-dəki `y` şablonu `\d{1,3}` idi, ona görə
9-dan yuxarı zoom-da bütün tile-lar 404 alırdı və xəritə tam boş görünürdü. Şablon
zoom 20-yə uyğun `\d{1,7}`-dir; dəyişdirilməməlidir.

Secret: `npx wrangler secret put GEOAPIFY_API_KEY` (staging üçün `--env staging`).
Açar `https://myprojects.geoapify.com` üzərindən alınır.

### Cloudflare Access (Zero Trust)

`src/lib/auth/cloudflare-access.ts` + `middleware.ts` `/admin` və `/giris` üçün
Access token-ini **imza səviyyəsində** yoxlayır. Qapı defolt **bağlıdır**:
`ACCESS_ENFORCED="true"` yalnız Cloudflare tərəfdə Access tətbiqi qurulub
yoxlanandan sonra qoyulmalıdır, əks halda panel heç kimə açılmır.

Tələb olunan `vars`: `ACCESS_ENFORCED`, `ACCESS_TEAM_DOMAIN` (`<team>.cloudflareaccess.com`),
`ACCESS_AUD` (Application Audience tag).

**`/api/*` yollarına Access qoyulmamalıdır** — kabinet, geokod və tile proxy-si sınar.

### Bu sessiyada bağlanan «panel doldurur, sayt göstərmir» boşluqları

| Boşluq | Nə edildi |
|---|---|
| `Property.videoUrl` | Admin və kabinet formasında doldurulurdu, ictimai səhifədə heç yerdə göstərilmirdi. `PropertyVideo` YouTube/Vimeo-nu embed edir (nocookie), naməlum ünvanı keçid kimi verir. |
| `seo.local` (NAP) | Koordinat, iş saatları, xidmət bölgələri və sosial profillər D1-ə yazılırdı, `organizationSchema()` isə yalnız `siteConfig`-dən oxuyurdu. `src/lib/local-business.ts` tək oxu nöqtəsidir; JSON-LD indi `geo`, `openingHours`, `areaServed`, `hasMap` daşıyır. |
| Ofis koordinatının duplikatı | Eyni fakt həm `seo.local`, həm `site.contact_*` açarlarında idi. Redaktə tək yerdədir (`Parametrlər`), SERP forması yalnız istiqamətləndirici qeyd göstərir. |
| Kabinet elanında koordinat | `publicPropertySchema` `latitude`/`longitude`-u onsuz da qəbul edirdi, formada sahə yox idi — istifadəçinin elanı heç vaxt xəritədə görünmürdü. `LocationPicker` əlavə olundu (sxem dəyişmədi, miqrasiya lazım olmadı). |
| İpoteka kalkulyatoru | `MortgageCalculator` `defaultPrice`/`compact` proplarını dəstəkləyirdi, amma yalnız `/kalkulyator` səhifəsində istifadə olunurdu. İndi satılıq elan detalında qiymətlə əvvəlcədən doldurulur. |

---

## 7. Layihənin texniki sağlamlığı (30 avqust 2026)

- Mənbə kodu: 51 900 sətir / 508 fayl (`src/` altında `.ts` + `.tsx`).
- 88 Vitest faylı, 369 test; 30 avqust tam icrasında hamısı keçib.
- 53 Prisma modeli, 25 D1 miqrasiya faylı və 382 commit.
- GitHub Actions hər PR və `main` push-unda test, typecheck, lint və build işlədir.
- Avtomatlaşdırılmış browser E2E yoxdur.
- `.env` düzgün şəkildə `.gitignore`-dadır; yalnız `.env.example` izlənir.


---

## 8. Cloudflare yayımı — 20 avqust 2026

**Vəziyyət: ictimai sayt canlıdır.**

- Worker: `luxehomeestate` → `https://luxehomeestate.az` və `https://www.luxehomeestate.az`
- D1: `luxehome-db` (`86d5f7e0-ffe6-48d8-bd84-d88163550b2a`) — miqrasiyalar ayrıca
  production/staging əmrləri ilə idarə olunur; demo məzmun 21 avqustda təmizlənib
- R2: `luxehome-media`, `luxehome-next-cache`
- Secret-lər: auth, Resend, cron və Turnstile açarları Cloudflare secret-lərində saxlanılır

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
- [x] Kod və nümunə konfiqurasiya `notifications@luxehomeestate.az` korporativ göndəricisinə
      keçirilib; `onboarding@resend.dev` fallback-i silinib. Resend panelində domenin faktiki
      təsdiqi deployment smoke yoxlamasının bir hissəsidir.
- [ ] Cloudflare Images transformations-u zone səviyyəsində aktivləşdirmək.
- [x] Panel staging-də yoxlanandan sonra prod `vars`-ında `ADMIN_ENABLED="true"` edildi
      (27 avqust 2026) — `/admin` və `/giris` artıq production-da açıqdır.
- [ ] `npm run preview` (workerd) ilə lokal test axını qurmaq — `next dev` Node-da wasm
      engine-i yükləyə bilmir.

---

## 9. Admin auth qatı — 21 avqust 2026

**Vəziyyət: main branch-a birləşdirilib, staging yoxlanıb və panel production-da açıqdır.**

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

### Əməliyyat qeydi

Staging və production ayrı secret, D1 və R2 resursları işlədir. Yeni miqrasiya yayımdan əvvəl
hər iki mühitə tətbiq edilməli, sonra cron/API smoke yoxlaması aparılmalıdır. CI-də Cloudflare
secret-ləri olduqda `main` push-u remote production miqrasiya siyahısını da yoxlayır.

---

## 10. Tam PRD tamamlama yol xəritəsi — 25 avqust 2026

**Qərar: hər iki PRD sənədi (`docs/LuxeHomeEstate — Full Platform & Advanced Admin Panel
PRD.md`, `docs/LuxeHomeEstate — Geniş Miqyaslı Public Platform PRD.md`) uzunmüddətdə 100%
koda köçürülməlidir.** 25 avqust 2026 tarixli audit: Phase 1 MVP üzrə hər iki sənəd ~75% və
~74% tamamlanıb; sənədlərin tam əhatəsinə görə (Finance/CRM, AI, reservation və s. daxil) isə
~30-35%.

İş rejimi **ardıcıldır** — hər maddə tamamlanıb təsdiqlənəndən sonra növbətiyə keçilir,
paralel deyil. Təsdiqlənmiş sıra:

1. ~~**Saved Search + Recently Viewed + Notification Center**~~ — tamamlanıb; immediate və
   gündəlik/həftəlik digest zənciri production/staging-də işləyir.
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

---

## 11. Rəsmi tərəfdaşlıq sistemi — 27 avqust 2026

Master prompt üzrə tərəfdaşlıq modulu tam platformaya inteqrasiya edildi:

- `Partner`, `PropertyPartner`, `ProjectPartner`, `AgencyPartner` və lead atribusiyası;
- status, tarix və Bakı vaxt qurşağına görə rəsmi nişan/ictimai görünürlük qaydaları;
- AZ/EN/RU tərəfdaş siyahısı, profil, ana səhifə vitrini, SEO/JSON-LD və analitika;
- granular RBAC-li admin CRUD, müqavilə sahələri, relation manager, soft-delete və audit snapshot-ları;
- təhlükəsiz logo yükləmə (2 MB, MIME/magic-byte yoxlaması) və TREVA başlanğıc qeydi;
- `0013_partners.sql` və tətbiq edilmiş sxemə toxunmadan əlavə olunan
  `0014_partner_audit_snapshots.sql` miqrasiyaları.

Keyfiyyət qapısı: 324 test, typecheck, ESLint, Next production build və OpenNext Workerd build
təmizdir. İctimai siyahı/profil 320–1920 px enlərində horizontal overflow olmadan yoxlanıb.

Kontent addımları: TREVA-nın real logo faylı, hüquqi/müqavilə rekvizitləri və geniş AZ/EN/RU
mətnləri etibarlı mənbə təqdim ediləndən sonra admin paneldən əlavə edilməlidir. Uydurma məlumat
seed edilməyib.

---

## 12. Phase 2 zəncirlərinin bağlanması — 30 avqust 2026

Phase 2 modulları (bildiriş, agent, rezervasiya, premium, rayon analitikası) sxemdə və
paneldə mövcud idi, lakin bir neçə zəncir uca qədər bağlanmamışdı: sütun və ya tərcümə
açarı var idi, onu yazan/oxuyan kod yox idi. Bu sessiyada bağlananlar:

| Boşluq | Nə edildi |
|---|---|
| `NotificationPreference` kanal açarları (PRD 57) | Kabinetdə tam seçim matrisi (Saxlanmış axtarış / Qiymət endirimi / Rezervasiya × E-poçt / Sayt / Push). `savedSearchEmail`, `savedSearchWeb`, `reservationEmail`, `reservationWeb` indi göndərmə qatında oxunur. |
| `quietHoursStart` / `quietHoursEnd` (PRD 168) | Sütunlar heç yerdən oxunmurdu. `src/lib/notification-preferences.ts` + `sendPushToUser` sakit saatlara hörmət edir (Bakı vaxtı, gecə yarısını keçən aralıq daxil). E-poçt və sayt bildirişi kəsilmir. |
| `AgentProfile.responseMinutes` (PRD 165) | Sütun və hər üç dildə `responseTime` açarı var idi, heç yerdə göstərilmirdi. Paneldən doldurulur, agent profilində və kataloq kartında yalnız dəyər varsa göstərilir. |
| Agent profilinin redaktəsi | Modul yalnız yaratma + görünürlük açarı verirdi. İndi tam CRUD: `/admin/agentler/[id]` redaktə səhifəsi (avatar, WhatsApp, satış/icarə sayı, cavab müddəti daxil) və elan yoxlaması ilə silmə. |
| Müştəri rəyləri (testimonial) | Yalnız yaradılırdı; siyahı və silmə əlavə olundu. |
| Yaxın obyektlər | Yalnız yaradılırdı — səhv qeyd əmlak səhifəsində qalırdı. Siyahı + silmə əlavə olundu. |
| Rayon analitikası | `upsert` forması həmişə boş açılırdı, ona görə bir göstəricini dəyişmək qalanlarını silirdi. İndi rayon seçiləndə saxlanmış dəyərlər yüklənir; siyahı və silmə var. `medianPrice` və `saleRentRatio` sütunları da forma və ictimai səthə bağlandı. |
| Premium elanlar | Yalnız aktivləşdirilirdi. Aktiv premium siyahısı və vaxtından əvvəl dayandırma əlavə olundu. |
| Rayon səhifəsi (PRD 49-50) | `NeighborhoodProfile` yalnız əmlak detalında görünürdü. `/rayon/[slug]` səhifəsinə lokallaşdırılmış təsvir + göstərici bloku əlavə olundu; boş göstərici uydurulmur. |
| Rəy bütövlüyü (PRD 166) | Agent özünə, agentlik sahibi/əməkdaşı isə öz agentliyinin agentinə rəy yaza bilmir. Yoxlama serverdədir. |
| QR kod (PRD 61-63) | Phase 1 MVP bəndi idi, ümumiyyətlə yox idi. `src/lib/property-qr.ts` canonical URL üçün SVG-ni server tərəfdə çəkir (kənar servis yoxdur), əmlak detalında PNG/SVG yükləmə düymələri var. |
| `NotFoundHit.firstSeenAt` | Yazılırdı, göstərilmirdi. 404 monitorunda «İlk / Son» kimi görünür. |

Bu sessiyada tapılan və düzəldilən iki qırıq:

- `cabinet-navigation.test.ts` köhnəlmişdi — Phase 2 kabinetə iki bənd əlavə etmişdi, test
  yenilənməmişdi, ona görə `npm run test` **qırmızı** idi (yerli olaraq).
- `npm run lint` yerli maşında 1569 xəta verirdi: `tmp/` altındakı OpenNext bundle snapshot-u
  ESLint ignore siyahısında yox idi (git onu `tmp/.gitignore` ilə buraxır, ESLint flat config
  isə git-ignore oxumur). CI-də qovluq olmadığı üçün problem yalnız yerli işdə görünürdü və
  layihənin öz xəbərdarlıqlarını gizlədirdi. `tmp/**` və `archive-*/**` ignore-a əlavə edildi,
  ortaya çıxan üç xəbərdarlıq təmizləndi.
- SSR komponent testləri hər işləmədə stderr-ə `getCloudflareContext` xətası tökürdü
  (davranış düzgün idi — `getAllSettings()` boş obyektə qayıdır), Vitest onu «unhandled
  error» kimi sayırdı. `setup-ui.ts`-də yalnız oxuma funksiyaları mock edildi.

Keyfiyyət qapısı: 368 test / 88 fayl, typecheck, ESLint (0 xəta, 0 xəbərdarlıq) və
production build təmizdir.

---

## 13. Kod auditi izləməsi — 30 avqust 2026

`docs/audits/2026-08-27-kod-auditi.html` üzrə lokal bağlanan işlər:

- B1–B8 və B14 audit sessiyasında bağlanmışdı;
- B10 Azərbaycan axtarış normallaşdırması ilə, B12 korporativ göndərici fallback-i ilə bağlandı;
- B13 istifadə olunmayan `SAVED_SEARCH_FREQUENCY_LABELS` ixracının silinməsi ilə bağlandı;
- GitHub Actions CI əlavə edildi və public `loading.tsx` güzəşti sənədləşdirildi;
- B9 (admin UI-ının AZ/EN/RU lokallaşdırılması) ayrıca böyük modul kimi açıqdır;
- P5 (`force-dynamic` public HTML render-i) ölçmə və arxitektura işi olaraq açıqdır;
- avtomatlaşdırılmış browser E2E və Resend/Cloudflare kimi xarici sistemlərin canlı smoke
  yoxlamaları repository daxilində tam əvəz edilə bilmir.

---

## 14. Real Estate Knowledge Hub və FAQ ayrımı — 30 avqust 2026

İstifadəçinin `docs/Real Estate Knowledge Hub/Real Estate Knowledge Hub.md` araşdırması mənbə
sənəd kimi saxlanılıb. Sistem həmin sənədi birbaşa public HTML kimi göstərmir: məzmun DRAFT
statusunda idarə olunan strukturlaşdırılmış domen qeydlərinə çevrilir və hüquqi baxışdan sonra
yayımlanır.

### Public səthlər

| Ünvan | Məsuliyyət |
|---|---|
| `/[locale]/bilik-merkezi` | Bələdçi kataloqu, kateqoriyalar və axtarış |
| `/[locale]/bilik-merkezi/[slug]` | Hüquqi status, risk, mənbələr, sənədlər, prosedur, xərclər və checklist ilə məqalə |
| `/[locale]/bilik-merkezi/suallar` | Əmlak və qanunlar üzrə CMS əsaslı FAQ |
| `/[locale]/suallar` | Sayt/platforma haqqında ayrıca 20 əsas sual-cavab |
| `/[locale]/lugat` | Daşınmaz əmlak terminləri lüğəti |
| `/[locale]/kalkulyator` | İpoteka ödənişi və alış büdcəsi hesablaması |

### İdarəetmə və məlumat axını

- `KnowledgeCategory`, `KnowledgeArticle`, `KnowledgeTerm`, `KnowledgeFaq` modelləri və
  `migrations/0024_knowledge_hub.sql` əlavə edilib.
- `/admin/bilik-merkezi` altında məqalə, kateqoriya, termin və FAQ CRUD-u var; yazma əməliyyatları
  `KNOWLEDGE_MANAGE` icazəsi, audit jurnalı, Zod validasiyası, HTML sanitizasiyası və public keş
  invalidasiyası ilə qorunur.
- Dinamik məqalə, termin və FAQ məzmunu mövcud tərcümə panelinə qoşulub; public UI AZ/EN/RU-dur.
- Article və DefinedTerm struktur datası, sitemap girişləri, footer və admin naviqasiyası qoşulub.
- `prisma/build-knowledge-hub-sql.ts` mənbə sənədindəki `Mövzu —` bölmələrindən idempotent
  DRAFT SQL yaradır. Əmrlər: `db:knowledge:build`, `db:knowledge:local`,
  `db:knowledge:staging`, `db:knowledge:remote`.

### Yayım və hüquqi qəbul qapısı

- `0024_knowledge_hub.sql` staging və production D1-ə ayrıca tətbiq edilməlidir.
- Generatorun çıxardığı qeydlər avtomatik yayımlanmır. Hüquqi əsas, mənbə URL-ləri,
  `legalReviewedAt` və risk səviyyəsi redaktor/hüquqşünas tərəfindən təsdiqlənməlidir.
- Cari hostda import generatorunun icrası Node-un `uv_os_get_passwd ENOMEM` xətası ilə bloklanıb;
  generator typecheck-dən keçir, lakin `prisma/knowledge-hub.sql` sağlam Node mühitində yaradılmalıdır.
- Bu sessiyada Vitest 369/369 keçib. `next build` kod xətasına görə deyil, qeyri-interaktiv
  Cloudflare remote proxy üçün `CLOUDFLARE_API_TOKEN` olmadığına görə tamamlanmayıb.
