<div align="center">
  <img src="public/logo-full.png" alt="Luxe Home Estate loqosu" width="260" />
  <h1>Luxe Home Estate</h1>
  <p>Azərbaycan bazarı üçün daşınmaz əmlak, agentlik və məzmun platforması.</p>

  <p>
    <a href="https://luxehomeestate.az">Canlı sayt</a>
    ·
    <a href="https://github.com/MuradoffTehmez/LuxeHome/wiki">Texniki Wiki</a>
    ·
    <a href="CONTRIBUTING.md">Töhfə vermə bələdçisi</a>
    ·
    <a href="CODE_OF_CONDUCT.md">Davranış Kodeksi</a>
    ·
    <a href="SECURITY.md">Təhlükəsizlik siyasəti</a>
    ·
    <a href="LICENSE">MIT lisenziyası</a>
  </p>
</div>

---

> [!NOTE]
> Bu sənəd 29 sentyabr 2026 tarixli `main@199f8409` auditi (#128 ərazi bölgüsündən sonra), tam keçən
> keyfiyyət qapısı (173 test faylı / 889 test, 190 Playwright test icrası) və avtomatik CI/CD əsasında yenilənib. Dərin texniki
> məlumat üçün [GitHub Wiki](https://github.com/MuradoffTehmez/LuxeHome/wiki)-yə baxın.

## Layihə haqqında

Luxe Home Estate Bakı və Azərbaycan daşınmaz əmlak bazarı üçün hazırlanmış tamölçülü veb platformadır. Platforma satış və kirayə elanlarını, yaşayış layihələrini, agentlikləri, rəsmi tərəfdaşları, xidmətləri və bloq məzmununu Azərbaycan, ingilis və rus dilli interfeysdə birləşdirir.

Tətbiq [Next.js App Router](https://nextjs.org/docs/app) və React Server Components üzərində işləyir. Məlumat qatı Prisma vasitəsilə Cloudflare D1-ə qoşulur; tətbiq OpenNext ilə Cloudflare Workers-ə yayımlanır. Media R2-də, şəkil çevirmələri Cloudflare Images üzərindən idarə olunur.

## Cari imkanlar

### İctimai sayt

- Satış və kirayə elanlarının kataloqu, səhifələmə, sıralama və siyahı/xəritə görünüşü
- Mətn, əmlak növü, şəhər, rayon/qəsəbə/kənd/massiv, metro, nişangah, qiymət, otaq, sahə, təmir, sənəd, tikili növü, mərtəbə, kirayə dövrü və xüsusiyyətlər üzrə filtr; xəritədə sahə çəkmə
- Alternativ yazılışları tanıyan registrsiz yer axtarışı («Müşfiqabad», «8 km», «Kirov qəsəbəsi»)
- Boş nəticədə hər filtri çıxaranda neçə elan qaldığını göstərən təkliflər
- Əmlak detalı: tam ekran lightbox qalereya, plan, 360° tur, qiymət göstəricisi (rayon medianı ilə müqayisə), ən yaxın metro, açıq qapı günləri, rezervasiya, oxşar elanlar və Leaflet xəritəsi
- Elan üçün 1200×630 OG paylaşım kartı və QR kod
- Hesabla sinxron favoritlər və ən çox 4 elanın müqayisəsi
- `/emlakimi-sat` satıcı səhifəsi və «Evimi qiymətləndir» aləti
- Yaşayış kompleksləri (mənzil şahmatı ilə), agentlik, xidmət və bloq siyahıları ilə detal səhifələri
- Rəsmi tərəfdaş kataloqu, çoxdilli profil, elan/layihə/agentlik əlaqələri və izlənən xarici keçidlər
- Ölkə üzrə rəsmi inzibati-ərazi bölgüsü (DSK 2024 + Ünvan Reyestri): rəsmi kodlu 75 şəhər/rayon, 266 qəsəbə, 3 605 kənd; 136 bazar massivi, 27 metro və 214 nişangah
- Rayon, qəsəbə, kənd, massiv və metro landing səhifələri; paneldən idarə olunan landing runtime-ı
- Bilik Mərkəzi: hüquqi bələdçi kataloqu, kateqoriya səhifələri, əmlak lüğəti və CMS FAQ-ı
- İpoteka, büdcə və tikintiçi hissə-hissə ödəniş kalkulyatoru; `/investisiya` gəlirlilik kalkulyatoru
- Cloudflare Workers AI ilə işləyən public AI axtarışı, Vectorize semantik axtarışı, Match Score və «Mənə əmlak tap» sehrbazı
- Bilik Mərkəzi AI məsləhətçisi — yalnız dərc olunmuş məzmundan, hər iddia istinadlı
- İctimai agent kataloqu, agent profili və moderasiyadan keçən rəylər
- Çoxdilli bazar analitikası hesabatları
- Əlaqə forması: same-origin + honeypot + `CONTACT_LIMIT` + Turnstile, D1 müraciəti, Resend və Telegram bildirişi
- Sayt haqqında `/suallar` və Bilik Mərkəzinin `/bilik-merkezi/suallar` FAQ səthləri (ayrı məhsullar)
- Hüquqi səhifələr
- AZ/EN/RU locale prefiksi, hreflang, canonical URL, Open Graph, Twitter Card, JSON-LD, sitemap, robots.txt və `llms.txt`
- Responsive interfeys (mobil alt naviqasiya, safe area), dark mode, görünən klaviatura fokusu və reduced-motion dəstəyi
- PWA manifesti; anonim ziyarətçi üçün kənar HTML keşi (60 s)

### İctimai hesab və kabinet

- `USER`, `OWNER`, `AGENT`, `AGENCY` və `CORPORATE` hesabları üçün qeydiyyat
- Parol (Turnstile), Google ilə (OIDC) və təsdiqlənmiş telefonla OTP girişi; son ikisi secret verilənə qədər söndürülüdür
- D1-də saxlanan və dərhal ləğv edilə bilən sessiyalar
- Profil, parol, e-poçt və telefon təsdiqi, parol bərpası, şəxsi data ixracı və iki mərhələli hesab silinməsi
- 8 addımlı elan sehrbazı (qaralama bərpası ilə), iyerarxik ünvan (region → şəhər/rayon → … → massiv → metro → nişangah → küçə → bina), rəsmi küçə təklifləri (~63 000), su nişanlı şəkillər, avtomatik SEO və ALT
- Elanın 60 günlük müddəti, bitməyə 7 gün qalmış xatırlatma və «Yenilə»
- Premium paket sifarişi (ödəniş ofisdə/köçürmə ilə)
- Mülk sahibi və təsdiqlənməmiş agentlik elanları üçün `PENDING` təsdiq axını
- Təsdiqlənmiş agentlik elanlarının birbaşa dərc edilməsi
- Təsdiqlənmiş agentliklərin açıq kataloqu və profil səhifəsi
- Hesablar arasında sinxron favoritlər, saxlanmış axtarışlar, gündəlik/həftəlik e-poçt digest-i,
  panel bildirişləri və son baxılan elanlar
- Agentlik sahibi üçün ən çox 3 menecer/agent üzvlü komanda və təsdiq axını
- Əmlak rezervasiyası axını və kabinet paneli
- Qiymət dəyişikliyi izləmə, Web Push bildirişləri, kanal seçimləri və sakit saatlar
- Fərdi tövsiyələr

### İdarə paneli

- Məcburi TOTP 2FA, passkey (TOTP-a alternativ ikinci mərhələ), backup kodlar, hesab kilidi və sessiya idarəetməsi
- Panel AZ/EN/RU dillərindədir (`User.locale`)
- `SUPER_ADMIN`, `ADMIN`, `EDITOR` rolları üçün icazə matrisi
- Dashboard və real D1 statistikaları
- Əmlak, layihə, xidmət, bloq və kateqoriya CRUD axınları; siyahılarda toplu seçim və silmə
- CSV-dən toplu elan idxalı (həmişə DRAFT, dublikat yoxlaması, `metro`/`landmark` sütunları, kənar şəkillərin R2-yə köçürülməsi)
- Müraciətlərin siyahıda sürətli statusu, status lövhəsi (SLA, «mənə təyin et»), konversiya hunisi, məsul əməkdaşı və daxili qeydi
- Rezervasiya təqvimi (Bakı vaxtı) və şəxsi ICS abunəsi
- Premium paketlər və ödəniş uçotu (`billing:manage`)
- Mənzil şahmatı generatoru
- Sistem rejimi (`MAINTENANCE` / `READ_ONLY`), nümunə məzmun açarı və inteqrasiya hazırlığı
- R2 media yükləmə, WebP çevirmə, thumbnail, alt mətn və silmə
- Əməkdaş hesabları, parol/2FA sıfırlama və sessiyaların ləğvi
- İctimai hesabların ayrıca təsdiqi və bloklanması; çatışmayan agentlik profilinin paneldən yaradılması
- Redaktə olunan staff profili, avatar, telefon, locale, tema və backup kodlarının yenilənməsi
- Runtime əlaqə/tema parametrləri, cədvəlli audit jurnalı və yalnız Super Admin üçün sıfırlama
- Tərəfdaş CRUD-u, silmədən public görünürlük, müqavilə metadatası və elan/layihə/agentlik əlaqələri
- SEO auditı, 301/302 yönləndirmələr, 404 izləmə, trafik analitikası və moderasiya növbəsi
- SERP idarəetmə mərkəzi: metadata redaktoru və SERP preview, açar söz/entity idarəsi, idarə olunan
  landing menecceri, audit kontent və media iş siyahıları, monitorinq/alert, Search Console və
  indeksləmə nəzarəti, schema/sitemap və daxili link diaqnostikası, robots və lokal SEO parametrləri
- Bilik Mərkəzi CMS-i: məqalə, kateqoriya, lüğət termini və FAQ CRUD-u ilə tərcümə axını
- Rezervasiya idarəetməsi, agent profilləri, rəy moderasiyası və ictimai imkanlar paneli
- AI köməkçi paneli və foto məsləhətçisi (Cloudflare Workers AI, vision)
- Resend imzalı webhook-u ilə korporativ e-poçt çatdırılma/qəbul metadata jurnalı
- Server Action-larda origin, icazə və sürət limiti yoxlaması

> [!IMPORTANT]
> Seed prosesi ictimai kontent və giriş edilə bilən hesab yaratmır. Nümunə (demo) məzmun ayrıca
> `npm run db:demo:*` ilə yalnız staging-ə yüklənir; görünürlüyü `/admin/demo-mezmun` açarı idarə
> edir (staging-də açıq, production-da bağlı).

## Texnologiya yığını

| Qat | Texnologiya |
|---|---|
| Framework | Next.js 16.3.6 (webpack), React 19.3, App Router |
| Dil | TypeScript 5, strict mode |
| UI | Tailwind CSS v4, Lucide React, `next-themes`, Leaflet |
| Verilənlər bazası | Cloudflare D1 / SQLite |
| ORM | Prisma 6.19.3, `@prisma/adapter-d1`, WASM client |
| Hosting | Cloudflare Workers, OpenNext (`worker.ts` sarğısı + kənar HTML keşi) |
| Media və keş | Cloudflare R2, Cloudflare Images, R2 incremental cache |
| Auth | `jose`, Web Crypto PBKDF2, TOTP, AES-GCM, `@simplewebauthn/server`, Google OIDC, Turnstile |
| E-poçt | Resend |
| AI | Cloudflare Workers AI (mətn + vision), Vectorize (`bge-m3`) |
| Bildiriş | Web Push, Telegram, SMS (istəyə bağlı), panel bildirişləri, e-poçt digest-i |
| Lokallaşdırma | `next-intl`, AZ/EN/RU, həmişə locale prefiksi |
| Validasiya və sanitizasiya | Zod, UltraHTML |
| Test | Vitest 4 + `@cloudflare/vitest-plugin` (workerd, real D1), Playwright |

## Arxitektura

```text
Brauzer
  │
  ▼
Cloudflare Worker / Next.js App Router
  ├── Server Components ──► src/lib/queries.ts ──► Prisma WASM ──► D1
  ├── Server Actions ─────► auth/permission/origin guard ───────► D1
  ├── Media API ──────────► magic-byte yoxlaması ─► Images ─────► R2
  ├── Sessiya yoxlaması ──► imzalanmış cookie + D1 sessiyası
  ├── Bildiriş/webhook ───► Resend
  ├── AI / semantik ──────► Workers AI + Vectorize
  ├── Digest cron ────────► ayrıca scheduled Worker (digest + maintenance + reindeks)
  ├── Kənar HTML keşi ────► Cache API (worker.ts)
  └── ISR cache ──────────► R2
```

Əsas qaydalar:

- İctimai səhifələr `src/app/[locale]/(site)`, kabinet isə `src/app/[locale]/(account)` route qrupundadır; məlumatı birbaşa `src/lib/queries.ts`-dən oxuyur.
- Yazma əməliyyatları Server Action-lar və qorunan media Route Handler-ları ilə aparılır.
- İctimai əmlak sorğuları `publicPropertyWhere()`-dən başlayır: `deletedAt: null`, `PUBLIC_PROPERTY_STATUSES` və demo rejim şərti.
- D1 transaction dəstəkləmir və bir sorğuda ən çox 100 bound parametr qəbul edir — kompensasiya, şərti `updateMany` və `findManyInChunks()` işlədilir.
- Kart komponentlərinin data müqaviləsi `propertyCardSelect`, `projectCardSelect` və `postCardSelect` ilə mərkəzləşdirilib.
- Runtime Prisma klienti yalnız `src/lib/prisma.ts` daxilindəki lazy `Proxy` üzərindən yaradılır.
- Domen statusları, rollar və label-lər `src/lib/constants.ts` faylından gəlir.

## Marşrutlar

| Qrup | Marşrutlar |
|---|---|
| Əsas | `/{locale}`, `/{locale}/emlaklar`, `/{locale}/emlaklar/[slug]`, `/{locale}/layiheler/[slug]`, `/{locale}/emlakimi-sat`, `/{locale}/investisiya` |
| Məzmun | `/{locale}/xidmetler`, `/{locale}/blog`, `/{locale}/suallar`, `/{locale}/bazar-analitikasi`, SEO/rayon/metro landing-ləri |
| Bilik Mərkəzi | `/{locale}/bilik-merkezi`, `/{locale}/bilik-merkezi/kateqoriya/[slug]`, `/{locale}/bilik-merkezi/suallar`, `/{locale}/lugat`, `/{locale}/kalkulyator` |
| Kəşf və AI | `/{locale}/ai-axtaris`, `/{locale}/mene-emlak-tap`, `/{locale}/agentler`, `/{locale}/agentler/[slug]` |
| Tərəfdaş və seçim | `/{locale}/agentlikler`, `/{locale}/terefdaslar`, `/{locale}/favoritler`, `/{locale}/muqayise` |
| Şirkət və hüquqi | `/{locale}/haqqimizda`, `/{locale}/elaqe`, `/{locale}/mexfilik-siyaseti`, `/{locale}/istifade-sertleri`, `/{locale}/cookie-siyaseti` |
| İctimai hesab | `/{locale}/qeydiyyat`, `/{locale}/daxil-ol`, kabinet, profil, komanda, elan, paket, rezervasiya, axtarış və bildiriş səhifələri; qısa ünvanlar `/elan-yerlesdir`, `/elanlarim`, `/profilim` |
| Əməkdaş auth | `/{locale}/giris`, doğrulama və 2FA qurulumu |
| Admin | `/admin` və kontent, idxal, CRM (lövhə, huni), rezervasiya təqvimi, paketlər, tərəfdaş, SEO, AI, tərcümə, analitika, təhlükəsizlik və sistem alt marşrutları |
| Admin SERP | `/admin/serp` və metadata, açar söz, entity, landing, audit, məzmun, media, monitorinq, indeksləmə, Search Console, schema, sitemap, link, robots, parametrlər alt marşrutları |
| Texniki | media API-ləri, `/api/yerler/kendler`, Google OAuth, ICS təqvim, OG kartı, geocode/tile, monitorinq, saved-search cron, Resend webhook, `/media/[...key]`, `/sitemap.xml`, `/sitemap-index.xml`, `/sitemaps/[feed]`, `/robots.txt`, `/llms.txt`, `manifest.webmanifest` |

Tam marşrut inventarı və istifadəçi axınları Wiki-dəki [Funksiyalar və marşrutlar](https://github.com/MuradoffTehmez/LuxeHome/wiki/Features-and-Routes) səhifəsindədir.

## Qovluq quruluşu

```text
luxehome/
├── e2e/                        # Playwright testləri və fixture-lar
├── docs/                       # PRD-lər, auditlər, SEO, ərazi hesabatı və mənbə snapshot-ları
├── migrations/                 # Cloudflare D1 SQL miqrasiyaları (0001–0053)
├── prisma/
│   ├── schema.prisma           # 68 domen, auth və əməliyyat modeli
│   ├── seed.ts                 # Sistem/taksonomiya başlanğıc məlumatları
│   ├── seed.sql                # D1 üçün yaradılmış seed
│   ├── taxonomy-data.ts        # Əmlak taksonomiyası
│   ├── az-admin-divisions.json # DSK 2024 inzibati-ərazi bölgüsü snapshot-u
│   ├── unvanportali-*.json     # Ünvan Reyestri: rəsmi vahidlər və küçələr
│   ├── baku-market-locations.json # Massiv, metro, nişangah, alias (mənbə kodları ilə)
│   ├── locations-data.ts       # Generasiya olunur (db:locations:build)
│   ├── taxonomy.sql            # Generasiya olunur (db:taxonomy:build)
│   ├── demo-content-data.ts    # Staging nümunə məzmunu
│   └── remove-demo-content.sql # Demo qeydlərinin təmizlənməsi
├── public/                     # Loqo, OG şəkli, statik fayllar və data/kuceler/ (3 476 rəsmi küçə faylı)
├── scripts/                    # Loqo, ərazi generatorları (Python), E2E stack və SEO smoke skriptləri
├── Wiki/                       # GitHub Wiki-nin mənbə faylları
├── workers/saved-search-cron/  # Gündəlik cron Worker-i
├── src/
│   ├── app/                    # Səhifələr, layout-lar, actions və route handler-lar
│   ├── components/
│   │   ├── admin/              # Admin interfeysi
│   │   ├── site/               # İctimai sayt komponentləri
│   │   └── ui/                 # Dizayn sistemi primitivləri
│   ├── config/site.ts          # Brend, əlaqə və naviqasiya məlumatları
│   └── lib/                    # Sorğular, auth, admin, media, SEO və utilitlər
├── worker.ts                   # OpenNext sarğısı + kənar HTML keşi
├── next.config.ts
├── open-next.config.ts
└── wrangler.jsonc              # Production və staging Cloudflare resursları
```

## Lokal quraşdırma

### Tələblər

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` (`.nvmrc`: 24)
- Python 3 — yalnız ərazi bölgüsü generatorları (`db:locations:*`, `db:streets:build`) üçün
- Bash (Windows-da Git Bash) — lokal E2E stack hazırlığı üçün
- npm 12 (`package.json` → `packageManager: "npm@12.0.1"`)
- Remote D1 və deployment üçün Cloudflare hesabı

> [!IMPORTANT]
> `package-lock.json`-un formatı npm major versiyasından asılıdır. npm 12 opsional peer
> qeydlərini (məsələn `@swc/helpers`) lock faylından çıxarır, npm 10 və 11 isə həmin qeydləri
> tələb edir — nəticədə fərqli npm ilə `npm ci` `EUSAGE` xətası verir. Ona görə lokal mühit və
> GitHub Actions eyni npm versiyasını işlədir; CI həmin dəyəri `packageManager` sahəsindən oxuyur.
> npm versiyanızı dəyişdirsəniz `packageManager` sahəsini də yeniləyin və lock faylını yenidən yaradın.

### 1. Repozitoriyanı hazırlayın

```bash
git clone https://github.com/MuradoffTehmez/LuxeHome.git
cd LuxeHome
npm ci
```

### 2. Mühit dəyişənlərini yaradın

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

`AUTH_SECRET` üçün uzun, təsadüfi və hər mühitdə fərqli dəyər istifadə edin. Production secret-lərini repozitoriyaya və ya commit olunan fayla yazmayın.

### 3. Prisma və lokal D1-i hazırlayın

```bash
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
```

### 4. Development server-i başladın

```bash
npm run dev
```

Sayt [http://localhost:3000](http://localhost:3000) ünvanında açılır. `next dev` zamanı OpenNext Miniflare vasitəsilə lokal Cloudflare binding-lərini təqdim edir.

## Mühit dəyişənləri

| Dəyişən | Təyinat | Məcburilik |
|---|---|---|
| `DATABASE_URL` | Prisma CLI üçün lokal SQLite faylı | Lokal schema/seed əmrləri üçün |
| `AUTH_SECRET` | Sessiya JWT-si və TOTP şifrələmə açarının əsası | Auth üçün məcburi |
| `SITE_URL` | Canonical URL, sitemap və Open Graph bazası | Bəli |
| `IS_STAGING` | Staging-də `noindex` və robots bloklaması | Staging üçün |
| `ADMIN_ENABLED` | `/admin` və `/giris` feature flag-i | Admin üçün |
| `SEED_ADMIN_EMAIL` | Seed/bootstrap admin ünvanı | Lokal/bootstrap üçün |
| `SEED_ADMIN_PASSWORD` | Seed/bootstrap admin parolu | Lokal/bootstrap üçün |
| `RESEND_API_KEY` | Resend API açarı | E-poçt bildirişi üçün |
| `GEOAPIFY_API_KEY` | Geoapify geokod açarı | Paneldə ünvan axtarışı və xəritədən ünvan seçimi üçün |
| `RESEND_FROM_EMAIL` | Göndərən ünvan | E-poçt bildirişi üçün |
| `NOTIFICATION_EMAIL` | Müraciət bildirişinin alıcısı | E-poçt bildirişi üçün |
| `RESEND_WEBHOOK_SECRET` | Resend/Svix webhook imzasının doğrulanması | Korporativ e-poçt jurnalı üçün |
| `CRON_SECRET` | Saved-search digest endpoint Bearer sirri | Digest cron üçün |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` (və ya köhnə `TURNSTILE_SECRET_KEY`), `TURNSTILE_HOSTNAMES` | Cloudflare Turnstile | Formalar üçün |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Ofis çatına lead bildirişi | İstəyə bağlı |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google ilə giriş; yoxdursa söndürülüdür | İstəyə bağlı |
| `SMS_PROVIDER_URL`, `SMS_PROVIDER_TOKEN`, `SMS_SENDER` | Telefonla OTP girişi; yoxdursa söndürülüdür | İstəyə bağlı |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push | Push bildirişi üçün |
| `NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` | Cloudflare Web Analytics beacon-u (build dəyişəni) | İstəyə bağlı |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare GraphQL analitika sorğusu (`Zone` → `Analytics Read`; `Account Analytics Read` deyil) | Admin analitika üçün |
| `GSC_SITE_URL` | Search Console property-si (`sc-domain:luxehomeestate.az`) | Admin GSC üçün |
| `GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON` | Google service account JSON key; access token runtime-da avtomatik alınır | Admin GSC üçün tövsiyə olunur |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_ID`, `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET`, `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` | Service account əvəzinə OAuth refresh credential dəsti | Admin GSC üçün alternativ |
| `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` | Qısaömürlü legacy token | Yalnız diaqnostika üçün |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `GOOGLE_SITE_VERIFICATION` | Google Analytics / Tag Manager və Search Console təsdiqi | İstəyə bağlı |
| `AI_TEXT_MODEL`, `AI_VISION_MODEL` | Workers AI modelinin əvəzlənməsi | İstəyə bağlı |
| `ACCESS_ENFORCED`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | Panel üçün Cloudflare Access (Zero Trust) qapısı | İstəyə bağlı |
| `SYSTEM_MODE`, `FORCE_MAINTENANCE`, `EDGE_HTML_CACHE_TTL` | Worker vars: defolt sistem rejimi, təcili texniki xidmət, kənar keş TTL-i | `wrangler.jsonc`-dədir |

Cloudflare secret nümunələri:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put GEOAPIFY_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put NOTIFICATION_EMAIL
npx wrangler secret put RESEND_WEBHOOK_SECRET
npx wrangler secret put CRON_SECRET
npx wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
npx wrangler secret put GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON
npx wrangler secret put CRON_SECRET --config workers/saved-search-cron/wrangler.jsonc
```

Search Console service account e-poçtu `sc-domain:luxehomeestate.az` property-sinə
Owner və ya Full user kimi əlavə olunmalıdır. JSON key heç vaxt repozitoriyaya,
`.env`-ə və terminal tarixçəsinə yazılmır; dəyər birbaşa `wrangler secret put`
prompt-una verilir.

## npm əmrləri

### İnkişaf və keyfiyyət

| Əmr | Təyinat |
|---|---|
| `npm run dev` | Next.js development server |
| `npm run build` | Prisma client və production Next.js build |
| `npm run start` | Hazır build üçün Next.js server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run dead-code` | Knip: istifadə olunmayan fayl və asılılıqlar |
| `npm test` | Vitest suite-i `workerd` və Node mühitində işlədir (real D1 integration daxil) |
| `npm run test:watch` | Vitest watch rejimi |
| `npm run test:seo:routes` | Production SEO route status smoke testi |
| `npm run test:seo:live` | Production SERP qəbul (acceptance) testi |
| `npm run e2e` | Konfiqurasiya edilmiş workerd mühitinə qarşı Playwright |
| `npm run e2e:local:build` / `:prepare` / `:serve` | Lokal workerd stack (bundle, təzə D1 + test hesabları, `:8787`) |
| `npm run e2e:chromium` / `:mobile` / `:ui` / `:report` / `:install` | Playwright layihələri, UI rejimi, hesabat və brauzer quraşdırılması |
| `npm run assets:maintenance-logo` | Texniki xidmət səhifəsinin daxili loqosunu yenidən qurur |
| `npm run assets:blog-covers` | Bloq üz qabığı şəkillərini (`public/images/blog`) kateqoriya fotolarından yenidən qurur |
| `npm run preview` | OpenNext build və lokal Worker preview |
| `npm run cf-typegen` | Wrangler binding tiplərini yeniləyir |

### Verilənlər bazası və taksonomiya

| Əmr | Təyinat |
|---|---|
| `npm run db:generate` | Prisma client yaradır |
| `npm run db:migrate:new` | Cari D1 ilə Prisma sxemi arasındakı SQL fərqini stdout-a çıxarır |
| `npm run db:migrate:local` | Miqrasiyaları lokal D1-ə tətbiq edir |
| `npm run db:migrate:staging` | Miqrasiyaları staging D1-ə tətbiq edir |
| `npm run db:migrate:remote` | Miqrasiyaları production D1-ə tətbiq edir |
| `npm run db:seed:build` | Lokal SQLite məlumatından `prisma/seed.sql` yaradır |
| `npm run db:seed:local` | Seed-i lokal D1-ə tətbiq edir |
| `npm run db:seed:staging` | Seed-i staging D1-ə tətbiq edir |
| `npm run db:seed:remote` | Seed-i production D1-ə tətbiq edir |
| `npm run db:demo:build` | Nümunə məzmun SQL-ini yaradır |
| `npm run db:demo:local` / `:staging` | Nümunə məzmunu tətbiq edir |
| `npm run db:demo:remote` | Nümunə məzmunu **production** D1-ə yazır — qərara görə production-a yüklənmir, işlətməyin |
| `npm run db:clean-demo:local` / `:staging` / `:remote` | Bütün `isDemo` qeydlərini silir və açarı söndürür |
| `npm run db:studio` | Prisma Studio |
| `npm run db:locations:build` | DSK + Ünvan Reyestri + bazar massivləri JSON-undan `locations-data.ts` yaradır; ziddiyyətdə dayanır |
| `npm run db:streets:build` | Ünvan Reyestri küçələrindən `public/data/kuceler/<kod>.json` və `official-street-codes.ts` yaradır |
| `npm run db:locations:report` | `docs/erazi/baki-erazi-bolgusu.md` hesabatını qurur |
| `npm run db:locations:migrations` | `taxonomy.sql`-in yerləşmə bölməsini `migrations/0050`–`0053` hissələrinə bölür |
| `npm run db:taxonomy:build` | Taksonomiya SQL-i yaradır |
| `npm run db:taxonomy:local` | Taksonomiyanı lokal D1-ə tətbiq edir |
| `npm run db:taxonomy:staging` | Taksonomiyanı staging D1-ə tətbiq edir |
| `npm run db:taxonomy:remote` | Taksonomiyanı production D1-ə tətbiq edir |
| `npm run db:knowledge:build` | Hüquqi mənbə sənədindən DRAFT Bilik Mərkəzi SQL-i yaradır |
| `npm run db:knowledge:local` | Bilik Mərkəzi SQL-ini lokal D1-ə tətbiq edir |
| `npm run db:knowledge:staging` | Bilik Mərkəzi SQL-ini staging D1-ə tətbiq edir |
| `npm run db:knowledge:remote` | Bilik Mərkəzi SQL-ini production D1-ə tətbiq edir |
| `npm run auth:create-admin` | İlk əməkdaş üçün təhlükəsiz bootstrap SQL-i yaradır |

### Deployment

| Əmr | Təyinat |
|---|---|
| `npm run preview:staging` | Staging konfiqurasiyası ilə lokal preview |
| `npm run deploy:staging` | İzolyasiya olunmuş staging Worker-i yayımlayır |
| `npm run deploy` | Production Worker-i yayımlayır |
| `npm run deploy:cron` | Production saved-search scheduled Worker-i yayımlayır |
| `npm run deploy:cron:staging` | Staging scheduled Worker-i yayımlayır |

> [!WARNING]
> Remote miqrasiya, seed, taksonomiya, demo yükləmə (`db:demo:remote`) və demo-təmizləmə əmrləri production məlumatını dəyişir. Hədəf mühiti, backup-u və SQL məzmununu ayrıca yoxlamadan bu əmrləri işlətməyin.

## Verilənlər bazası iş axını

Prisma sxemi dəyişdikdə:

1. Dəyişikliyi `prisma/schema.prisma`-da edin.
2. `npm run db:migrate:local`, sonra `npm run db:migrate:new -- --output migrations/000N_ad.sql`.
3. Yaradılmış SQL-i nəzərdən keçirin və yenidən `npm run db:migrate:local` ilə tətbiq edin.
4. Seed/taksonomiya təsirlənirsə generatorları işlədin.
5. Keyfiyyət qapısını keçirin.
6. `main`-ə merge-dən sonra CI miqrasiyanı hər mühitdə bundle-dan **əvvəl** tətbiq edir (staging → production).

D1 üçün destruktiv dəyişikliklər geri dönüş planı olmadan production-a tətbiq edilməməlidir.

## Təhlükəsizlik xülasəsi

- İşçi hesabları üçün TOTP 2FA məcburidir, passkey alternativ ikinci mərhələdir; ictimai hesab axını panel axınından ayrıdır.
- Formalar Cloudflare Turnstile ilə qorunur; test bypass-ı qəsdən yoxdur.
- Google girişi OIDC + PKCE + nonce ilə, əməkdaş hesabına heç vaxt bağlanmır; telefon OTP kodu HMAC-lə saxlanılır.
- Parollar Web Crypto PBKDF2-HMAC-SHA256, 100 000 iterasiya və təsadüfi salt ilə hash olunur.
- TOTP sirri `AUTH_SECRET`-dən HKDF ilə törədilən AES-GCM açarı ilə şifrələnir.
- Sessiyalar D1-də saxlanılır: 8 saat sürüşən müddət, 7 gün mütləq son hədd və dərhal revoke imkanı var.
- Beş uğursuz cəhddən sonra hesab 15 dəqiqə kilidlənir; login və admin yazıları ayrıca Cloudflare rate-limit binding-ləri ilə qorunur.
- Admin mutation-ları origin, canlı sessiya, rol/icazə (25 permission) və yazı sürəti yoxlamasından keçir; hesab, agentlik, müraciət, bloq, layihə, tərəfdaş və xidmət siyahılarında toplu əməliyyat (`guardedBulk`) hər id üçün eyni tək action-dan keçir; əmlakların toplu yeniləməsi (`bulkUpdateProperties`) isə öz guard-ı və tək ümumi audit qeydi ilə ayrıca yoldur.
- AI, xəritə tile, qiymətləndirmə və monitorinq ayrıca rate-limit binding-ləri ilə kvota drenajından qorunur.
- Media upload fayl adına etibar etmir, ölçünü və magic byte-ları yoxlayır, SVG qəbul etmir və təhlükəsiz təsadüfi R2 açarı yaradır.
- Admin route-ları CSP, `no-store`, clickjacking və referrer başlıqları ilə sərtləşdirilib.

Zəifliyi açıq issue kimi paylaşmayın. Bildiriş qaydası üçün [SECURITY.md](SECURITY.md)-yə baxın.

## Sənədlər

| Sənəd | Məzmun |
|---|---|
| [Wiki — Arxitektura](https://github.com/MuradoffTehmez/LuxeHome/wiki/Architecture) | Sistem sərhədləri, data axını, kənar keş, media, binding-lər |
| [Wiki — Funksiyalar və marşrutlar](https://github.com/MuradoffTehmez/LuxeHome/wiki/Features-and-Routes) | 133 səhifə, 21 Route Handler, filtr parametrləri, icazələr |
| [Wiki — Məlumat modeli](https://github.com/MuradoffTehmez/LuxeHome/wiki/Data-Model) | 68 model, domen sabitləri, miqrasiya tarixçəsi |
| [Wiki — Ərazi bölgüsü və ünvan](https://github.com/MuradoffTehmez/LuxeHome/wiki/Location-Taxonomy) | Rəsmi ağac, massiv/metro/nişangah, rəsmi küçələr, yeniləmə runbook-u |
| [Wiki — Təhlükəsizlik](https://github.com/MuradoffTehmez/LuxeHome/wiki/Security-and-Authentication) | Staff/public auth, RBAC, middleware, başlıqlar |
| [Wiki — İdarə paneli bələdçisi](https://github.com/MuradoffTehmez/LuxeHome/wiki/Admin-Panel-Guide) | Redaktor və menecerlər üçün panel iş axınları |
| [Wiki — Test və keyfiyyət](https://github.com/MuradoffTehmez/LuxeHome/wiki/Testing-and-Quality) | Test piramidası, qoruyucu testlər, E2E |
| [Wiki — İnkişaf](https://github.com/MuradoffTehmez/LuxeHome/wiki/Development-Guide) / [Deployment](https://github.com/MuradoffTehmez/LuxeHome/wiki/Deployment-and-Operations) | Quraşdırma, əmrlər, CI/CD, runbook-lar |
| [Wiki — Lüğət](https://github.com/MuradoffTehmez/LuxeHome/wiki/Glossary) | Termin və qısaltmalar |
| [`docs/erazi/baki-erazi-bolgusu.md`](docs/erazi/baki-erazi-bolgusu.md) | Ərazi bölgüsünün generasiya olunan hesabatı |
| [`docs/github-governance.md`](docs/github-governance.md) | GitHub UI parametrləri və branch qoruması |
| [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) / [`MEMORY.md`](MEMORY.md) | AI agent qaydaları və layihə yaddaşı |

Wiki-nin mənbəyi repozitoriyadakı `Wiki/` qovluğudur.

## Töhfə vermək

Töhfələr açığız — nasazlıq bildirişi, funksiya təklifi və ya sənəd düzəlişi olsun.

1. Uyğun [Issue Form](https://github.com/MuradoffTehmez/LuxeHome/issues/new/choose) seçib
   problemi strukturlaşdırılmış şəkildə bildirin.
2. Təhlükəsizlik zəifliyini açıq issue kimi paylaşmayın — [SECURITY.md](SECURITY.md)-dəki məxfi
   kanaldan istifadə edin.
3. Issue təsdiqindən sonra branch yaradıb dəyişikliyi edin və `Closes #issue` olan pull request
   açın.
4. Tam axın, branch adlandırma, commit qaydaları və keyfiyyət qapısı üçün
   [CONTRIBUTING.md](CONTRIBUTING.md)-ə baxın.

İştirak edərkən [Davranış Kodeksi](CODE_OF_CONDUCT.md)-nə əməl olunur.

## Keyfiyyət qapısı

Dəyişiklik göndərməzdən əvvəl:

```bash
npm run test
npm run typecheck
npm run lint
npm run dead-code
npm run build
```

Cari qapı **173 Vitest faylındakı 889 testi** əhatə edir (workerd domen qatı, Node SSR komponentləri
və real miniflare D1 integration testləri). GitHub Actions hər PR-da `Quality gate` (əlavə olaraq
`npm audit --audit-level=high`) və məcburi `Local stack E2E` (lokal workerd + real D1/R2 üzərində
Playwright) işlədir. `main` push-unda axın: **quality → deploy-staging → e2e-staging →
deploy-production**; hər deploy job-u əvvəlcə öz D1 miqrasiyalarını tətbiq edir. Staging E2E sınarsa
production toxunulmur.

**`npm run build`-i buraxmayın:** Server Action qaydaları yalnız webpack mərhələsində yoxlanılır —
`"use server"` faylındakı hər ixrac `async` olmalıdır.

CI iş axını asılılıqları quraşdırmazdan əvvəl `package.json`-dakı `packageManager` dəyərini oxuyub
eyni npm versiyasını qurur, Node versiyasını isə `.nvmrc`-dən götürür. Bu, lock faylı formatının
npm major versiyasına görə fərqlənməsindən yaranan `npm ci` `EUSAGE` xətasının qarşısını alır.

## Cari məhdudiyyətlər və yol xəritəsi

- İctimai hesab şəxsi data ixracı və self-service silinmə verir. D1 transaction dəstəkləmədiyi
  üçün silinmə davamlı marker və gündəlik idempotent retry ilə qorunur: hesab əvvəl deaktiv
  edilir, əlaqəli təmizlik yarımçıq qalarsa maintenance işi onu avtomatik tamamlayır.
- Admin panel dili `User.locale` ilə AZ/EN/RU arasında saxlanılır; yeni admin mətnləri hər üç
  kataloqda parity testi ilə qorunmalıdır.
- Playwright E2E PR-da (lokal stack) və staging-də deployment qapısıdır. Production üçün tam
  post-deploy brauzer smoke hələ manualdır (`npm run test:seo:routes` / `test:seo:live` var).
- Real ödəniş provayderi qəsdən yoxdur: premium paket ödənişi ofisdə/köçürmə ilə alınır və paneldə qeyd olunur.
- Google və telefonla giriş, Telegram bildirişi və Web Analytics secret/token verilənə qədər söndürülüdür.
- TypeScript 7, ESLint 10 və Vitest 5 upstream uyğunsuzluğuna görə `dependabot.yml`-də ignore edilib.
- Avtomatlaşdırılmış D1 backup/restore drill hələ qurulmayıb.
- Bilik Mərkəzinin idxal paketi DRAFT yaradır; hüquqşünas/redaktor təsdiqi olmadan PUBLISHED edilmir.
- Korporativ e-poçt hadisələri yalnız `RESEND_WEBHOOK_SECRET` və Resend endpoint abunəliyi qurulduqdan sonra dolur; məzmun deyil, metadata saxlanılır.
- Turnstile əlaqə, qeydiyyat, ictimai/staff giriş, telefon OTP, açıq qapı və hesab təhlükəsizliyi
  formalarına bağlıdır; gizli açar və hostname allowlist Cloudflare mühitində düzgün saxlanmalıdır.
- Hüquqi mətnlər, ofis koordinatları və iş saatları şirkət/hüquqşünas təsdiqi tələb edir.
- Nişangahlar hazırda yalnız Bakıdadır; EN/RU adları transliterasiyadır. Taksonomiya SQL-i sətir silmir — yer birləşdirmə/silmə ayrıca miqrasiya tələb edir.
- Prisma 7 major yeniləməsi (Dependabot #126) D1 adapteri və WASM client ilə ayrıca sınanmalıdır.

Ətraflı prioritetlər Wiki-dəki [Cari vəziyyət və yol xəritəsi](https://github.com/MuradoffTehmez/LuxeHome/wiki/Status-and-Roadmap) səhifəsində saxlanılır.

## Kod konvensiyaları

- Dəyişən, funksiya və tip adları ingiliscədir; şərhlər və istifadəçiyə görünən mətnlər azərbaycancadır.
- Status, rol və domen dəyərləri hardcode edilmir; `src/lib/constants.ts` istifadə olunur.
- İctimai əmlak sorğuları yalnız public predicate ilə qurulur.
- Runtime kodunda ayrıca `new PrismaClient()` yaradılmır.
- Şirkət məlumatları `src/config/site.ts` xaricində təkrarlanmır.
- Dark mode komponent `dark:` sinifləri ilə deyil, semantik CSS tokenləri ilə idarə olunur.
- `Section` şaquli boşluğu `spacing` propu ilə verilir.
- Admin server komponentləri `await getAdminT()` işlədir; panel JSX-də xam mətn yazılmır.
- Yeni elan yazma yolu `queuePropertyVectorSync()` və `queueListingEnrichment()` çağırmalıdır.
- Server tərəfdə sessiya oxuyan yeni ictimai səhifə `SESSION_DEPENDENT_PUBLIC_ROUTES`-a əlavə olunur.
- Yer adları `compareAzerbaijani()` / `byAzerbaijaniName` ilə sıralanır; `locations-data.ts`, `taxonomy.sql` və `public/data/kuceler/` əl ilə redaktə edilmir.

## Müəllif hüquqları, şirkət və lisenziya

- Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur.
- **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur.
- Mənbə kodu [MIT License](LICENSE) ilə yayımlanır.
- MIT lisenziyası brend, şirkət adı, loqo və ticarət nişanından istifadə hüququ vermir.
