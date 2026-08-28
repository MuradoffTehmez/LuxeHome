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
> Bu sənəd `main@ed93ba4` və 28 avqust 2026 production smoke yoxlaması əsasında yenilənib. Aktiv Worker versiyası `11ade039-1f72-4777-b1e7-33df3376aef9`-dur. Dərin texniki məlumat üçün [GitHub Wiki](https://github.com/MuradoffTehmez/LuxeHome/wiki)-yə baxın.

## Layihə haqqında

Luxe Home Estate Bakı və Azərbaycan daşınmaz əmlak bazarı üçün hazırlanmış tamölçülü veb platformadır. Platforma satış və kirayə elanlarını, yaşayış layihələrini, agentlikləri, rəsmi tərəfdaşları, xidmətləri və bloq məzmununu Azərbaycan, ingilis və rus dilli interfeysdə birləşdirir.

Tətbiq [Next.js App Router](https://nextjs.org/docs/app) və React Server Components üzərində işləyir. Məlumat qatı Prisma vasitəsilə Cloudflare D1-ə qoşulur; tətbiq OpenNext ilə Cloudflare Workers-ə yayımlanır. Media R2-də, şəkil çevirmələri Cloudflare Images üzərindən idarə olunur.

## Cari imkanlar

### İctimai sayt

- Satış və kirayə elanlarının kataloqu, səhifələmə və sıralama
- Mətn, əmlak növü, şəhər, rayon, qiymət, otaq, sahə, təmir, sənəd, tikili növü, mərtəbə, kirayə dövrü və xüsusiyyətlər üzrə filtr
- Əmlak detalı, qalereya, oxşar elanlar, Leaflet xəritəsi və agentlik nişanı
- Brauzerdə saxlanan favoritlər və ən çox 4 elanın cookie əsaslı müqayisəsi
- Layihə, agentlik, xidmət və bloq siyahıları ilə detal səhifələri
- Rəsmi tərəfdaş kataloqu, çoxdilli profil, elan/layihə/agentlik əlaqələri və izlənən xarici keçidlər
- Rayon, metro və axtarış niyyətli SEO landing səhifələri
- Əlaqə forması, same-origin + honeypot + `CONTACT_LIMIT`, D1 müraciəti və Resend bildirişi
- Tez-tez verilən suallar və hüquqi səhifələr
- AZ/EN/RU locale prefiksi, hreflang, canonical URL, Open Graph, Twitter Card, JSON-LD, sitemap, robots.txt və `llms.txt`
- Responsive interfeys, dark mode, görünən klaviatura fokusu və reduced-motion dəstəyi

### İctimai hesab və kabinet

- `USER`, `OWNER` və `AGENCY` hesabları üçün qeydiyyat və giriş
- D1-də saxlanan və dərhal ləğv edilə bilən sessiyalar
- Profil və parol idarəetməsi
- Mülk sahibi və agentlik üçün şəkilli elan göndərmə
- Mülk sahibi və təsdiqlənməmiş agentlik elanları üçün `PENDING` təsdiq axını
- Təsdiqlənmiş agentlik elanlarının birbaşa dərc edilməsi
- Təsdiqlənmiş agentliklərin açıq kataloqu və profil səhifəsi
- Saxlanmış axtarışlar, gündəlik/həftəlik e-poçt digest-i, panel bildirişləri və son baxılan elanlar
- Agentlik sahibi üçün ən çox 3 menecer/agent üzvlü komanda və təsdiq axını

### İdarə paneli

- Məcburi TOTP 2FA, backup kodlar, hesab kilidi və sessiya idarəetməsi
- `SUPER_ADMIN`, `ADMIN`, `EDITOR` rolları üçün icazə matrisi
- Dashboard və real D1 statistikaları
- Əmlak, layihə, xidmət, bloq və kateqoriya CRUD axınları
- Müraciətlərin siyahıda sürətli statusu, məsul əməkdaşı, daxili qeydi və silinməsi
- R2 media yükləmə, WebP çevirmə, thumbnail, alt mətn və silmə
- Əməkdaş hesabları, parol/2FA sıfırlama və sessiyaların ləğvi
- İctimai hesabların ayrıca təsdiqi və bloklanması; çatışmayan agentlik profilinin paneldən yaradılması
- Redaktə olunan staff profili, avatar, telefon, locale, tema və backup kodlarının yenilənməsi
- Runtime əlaqə/tema parametrləri, cədvəlli audit jurnalı və yalnız Super Admin üçün sıfırlama
- Tərəfdaş CRUD-u, silmədən public görünürlük, müqavilə metadatası və elan/layihə/agentlik əlaqələri
- SEO auditı, 301/302 yönləndirmələr, 404 izləmə, trafik analitikası və moderasiya növbəsi
- Resend imzalı webhook-u ilə korporativ e-poçt çatdırılma/qəbul metadata jurnalı
- Server Action-larda origin, icazə və sürət limiti yoxlaması

> [!IMPORTANT]
> Seed prosesi ictimai demo kontent yaratmır. `Property`, `Project` və `BlogPost` üçün `isDemo: true` qeydləri ictimai sorğularda görünmür.

## Texnologiya yığını

| Qat | Texnologiya |
|---|---|
| Framework | Next.js 15.5.23, React 19.1, App Router |
| Dil | TypeScript 5, strict mode |
| UI | Tailwind CSS v4, Lucide React, `next-themes`, Leaflet |
| Verilənlər bazası | Cloudflare D1 / SQLite |
| ORM | Prisma 6.19.3, `@prisma/adapter-d1`, WASM client |
| Hosting | Cloudflare Workers, OpenNext |
| Media və keş | Cloudflare R2, Cloudflare Images, R2 incremental cache |
| Auth | `jose`, Web Crypto PBKDF2, TOTP, AES-GCM |
| E-poçt | Resend |
| Lokallaşdırma | `next-intl`, AZ/EN/RU, həmişə locale prefiksi |
| Validasiya və sanitizasiya | Zod, UltraHTML |
| Test | Vitest, Cloudflare `workerd` runtime |

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
  ├── Digest cron ────────► ayrıca Cloudflare scheduled Worker
  └── ISR cache ──────────► R2
```

Əsas qaydalar:

- İctimai səhifələr `src/app/[locale]/(site)`, kabinet isə `src/app/[locale]/(account)` route qrupundadır; məlumatı birbaşa `src/lib/queries.ts`-dən oxuyur.
- Yazma əməliyyatları Server Action-lar və qorunan media Route Handler-ları ilə aparılır.
- İctimai əmlak sorğuları `deletedAt: null`, `isDemo: false` və `PUBLIC_PROPERTY_STATUSES` qaydalarını daşıyır.
- Kart komponentlərinin data müqaviləsi `propertyCardSelect`, `projectCardSelect` və `postCardSelect` ilə mərkəzləşdirilib.
- Runtime Prisma klienti yalnız `src/lib/prisma.ts` daxilindəki lazy `Proxy` üzərindən yaradılır.
- Domen statusları, rollar və label-lər `src/lib/constants.ts` faylından gəlir.

## Marşrutlar

| Qrup | Marşrutlar |
|---|---|
| Əsas | `/{locale}`, `/{locale}/emlaklar`, `/{locale}/emlaklar/[slug]`, `/{locale}/layiheler/[slug]` |
| Məzmun | `/{locale}/xidmetler`, `/{locale}/blog`, `/{locale}/suallar`, SEO/rayon/metro landing-ləri |
| Tərəfdaş və seçim | `/{locale}/agentlikler`, `/{locale}/terefdaslar`, `/{locale}/favoritler`, `/{locale}/muqayise` |
| Şirkət və hüquqi | `/{locale}/haqqimizda`, `/{locale}/elaqe`, `/{locale}/mexfilik-siyaseti`, `/{locale}/istifade-sertleri`, `/{locale}/cookie-siyaseti` |
| İctimai hesab | `/{locale}/qeydiyyat`, `/{locale}/daxil-ol`, kabinet, profil, komanda, elan, axtarış və bildiriş səhifələri |
| Əməkdaş auth | `/{locale}/giris`, doğrulama və 2FA qurulumu |
| Admin | `/admin` və kontent, CRM, tərəfdaş, SEO, analitika, təhlükəsizlik və sistem alt marşrutları |
| Texniki | media API-ləri, saved-search cron, Resend webhook, `/media/[...key]`, `/sitemap.xml`, `/robots.txt`, `/llms.txt` |

Tam marşrut inventarı və istifadəçi axınları Wiki-dəki [Funksiyalar və marşrutlar](https://github.com/MuradoffTehmez/LuxeHome/wiki/Features-and-Routes) səhifəsindədir.

## Qovluq quruluşu

```text
luxehome/
├── migrations/                 # Cloudflare D1 SQL miqrasiyaları
├── prisma/
│   ├── schema.prisma           # 33 domen, auth və əməliyyat modeli
│   ├── seed.ts                 # Sistem/taksonomiya başlanğıc məlumatları
│   ├── seed.sql                # D1 üçün yaradılmış seed
│   ├── taxonomy-data.ts        # Əmlak və yerləşmə taksonomiyası
│   └── remove-demo-content.sql # Köhnə demo qeydlərinin təmizlənməsi
├── public/                     # Loqo, OG şəkli və statik fayllar
├── scripts/                    # Loqo və e-poçt köməkçi skriptləri
├── src/
│   ├── app/                    # Səhifələr, layout-lar, actions və route handler-lar
│   ├── components/
│   │   ├── admin/              # Admin interfeysi
│   │   ├── site/               # İctimai sayt komponentləri
│   │   └── ui/                 # Dizayn sistemi primitivləri
│   ├── config/site.ts          # Brend, əlaqə və naviqasiya məlumatları
│   └── lib/                    # Sorğular, auth, admin, media, SEO və utilitlər
├── next.config.ts
├── open-next.config.ts
└── wrangler.jsonc              # Production və staging Cloudflare resursları
```

## Lokal quraşdırma

### Tələblər

- Node.js 20 və ya daha yeni LTS versiyası
- npm
- Remote D1 və deployment üçün Cloudflare hesabı

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
| `RESEND_FROM_EMAIL` | Göndərən ünvan | E-poçt bildirişi üçün |
| `NOTIFICATION_EMAIL` | Müraciət bildirişinin alıcısı | E-poçt bildirişi üçün |
| `RESEND_WEBHOOK_SECRET` | Resend/Svix webhook imzasının doğrulanması | Korporativ e-poçt jurnalı üçün |
| `CRON_SECRET` | Saved-search digest endpoint Bearer sirri | Digest cron üçün |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare GraphQL analitika sorğusu (`Analytics:Read`) | Admin analitika üçün |

Cloudflare secret nümunələri:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put NOTIFICATION_EMAIL
npx wrangler secret put RESEND_WEBHOOK_SECRET
npx wrangler secret put CRON_SECRET
npx wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
npx wrangler secret put CRON_SECRET --config workers/saved-search-cron/wrangler.jsonc
```

## npm əmrləri

### İnkişaf və keyfiyyət

| Əmr | Təyinat |
|---|---|
| `npm run dev` | Next.js development server |
| `npm run build` | Prisma client və production Next.js build |
| `npm run start` | Hazır build üçün Next.js server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest suite-i `workerd` mühitində işlədir |
| `npm run test:watch` | Vitest watch rejimi |
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
| `npm run db:clean-demo:local` | Lokal D1-də demo kontenti təmizləyir |
| `npm run db:clean-demo:remote` | Production D1-də demo kontenti təmizləyir |
| `npm run db:studio` | Prisma Studio |
| `npm run db:taxonomy:build` | Taksonomiya SQL-i yaradır |
| `npm run db:taxonomy:local` | Taksonomiyanı lokal D1-ə tətbiq edir |
| `npm run db:taxonomy:staging` | Taksonomiyanı staging D1-ə tətbiq edir |
| `npm run db:taxonomy:remote` | Taksonomiyanı production D1-ə tətbiq edir |
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
> Remote miqrasiya, seed, taksonomiya və demo-təmizləmə əmrləri production məlumatını dəyişir. Hədəf mühiti, backup-u və SQL məzmununu ayrıca yoxlamadan bu əmrləri işlətməyin.

## Verilənlər bazası iş axını

Prisma sxemi dəyişdikdə:

1. Dəyişikliyi `prisma/schema.prisma`-da edin.
2. `npm run db:migrate:new` çıxışını yeni, nömrələnmiş `migrations/*.sql` faylı kimi nəzərdən keçirin.
3. `npm run db:migrate:local` ilə lokal D1-də tətbiq edin.
4. Seed/taksonomiya təsirlənirsə generatorları işlədin.
5. Keyfiyyət qapısını keçirin.
6. Əvvəl staging, sonra backup-dan sonra production miqrasiyası edin.

D1 üçün destruktiv dəyişikliklər geri dönüş planı olmadan production-a tətbiq edilməməlidir.

## Təhlükəsizlik xülasəsi

- İşçi hesabları üçün TOTP 2FA məcburidir; ictimai hesab axını panel axınından ayrıdır.
- Parollar Web Crypto PBKDF2-HMAC-SHA256, 100 000 iterasiya və təsadüfi salt ilə hash olunur.
- TOTP sirri `AUTH_SECRET`-dən HKDF ilə törədilən AES-GCM açarı ilə şifrələnir.
- Sessiyalar D1-də saxlanılır: 8 saat sürüşən müddət, 7 gün mütləq son hədd və dərhal revoke imkanı var.
- Beş uğursuz cəhddən sonra hesab 15 dəqiqə kilidlənir; login və admin yazıları ayrıca Cloudflare rate-limit binding-ləri ilə qorunur.
- Admin mutation-ları origin, canlı sessiya, rol/icazə və yazı sürəti yoxlamasından keçir.
- Media upload fayl adına etibar etmir, ölçünü və magic byte-ları yoxlayır, SVG qəbul etmir və təhlükəsiz təsadüfi R2 açarı yaradır.
- Admin route-ları CSP, `no-store`, clickjacking və referrer başlıqları ilə sərtləşdirilib.

Zəifliyi açıq issue kimi paylaşmayın. Bildiriş qaydası üçün [SECURITY.md](SECURITY.md)-yə baxın.

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
npm run typecheck
npm run lint
npm test
npm run build
```

Cari qapı 81 Vitest faylında 335 testi əhatə edir. Auth, sessiya, lokallaşdırma, SEO, saved-search, tərəfdaşlıq, admin responsive siyahıları, media rollback-i və public-content sərhədləri yoxlanır. D1 integration və avtomatlaşdırılmış browser E2E/CI hazırda yoxdur; production browser smoke testi manual aparılır.

## Cari məhdudiyyətlər və yol xəritəsi

- İctimai kabinet elan yaratma və status izləmə verir; mövcud elanı redaktə/silmə axını yoxdur.
- Qeydiyyatda e-poçt təsdiqi və “parolu unutdum” bərpa axını yoxdur.
- SQLite `LIKE` Azərbaycan hərflərində tam registrsiz axtarış vermir; normallaşdırılmış axtarış sahəsi tələb olunur.
- CI və avtomatlaşdırılmış browser E2E yoxdur; deploy və canlı smoke prosesi manualdır.
- Korporativ e-poçt hadisələri yalnız `RESEND_WEBHOOK_SECRET` və Resend endpoint abunəliyi qurulduqdan sonra dolur; məzmun deyil, metadata saxlanılır.
- Turnstile yoxdur; əlaqə forması hazırda same-origin, görünməz honeypot və `CONTACT_LIMIT` ilə qorunur.
- Hüquqi mətnlər, ofis koordinatları və iş saatları şirkət/hüquqşünas təsdiqi tələb edir.

Ətraflı prioritetlər Wiki-dəki [Cari vəziyyət və yol xəritəsi](https://github.com/MuradoffTehmez/LuxeHome/wiki/Status-and-Roadmap) səhifəsində saxlanılır.

## Kod konvensiyaları

- Dəyişən, funksiya və tip adları ingiliscədir; şərhlər və istifadəçiyə görünən mətnlər azərbaycancadır.
- Status, rol və domen dəyərləri hardcode edilmir; `src/lib/constants.ts` istifadə olunur.
- İctimai əmlak sorğuları yalnız public predicate ilə qurulur.
- Runtime kodunda ayrıca `new PrismaClient()` yaradılmır.
- Şirkət məlumatları `src/config/site.ts` xaricində təkrarlanmır.
- Dark mode komponent `dark:` sinifləri ilə deyil, semantik CSS tokenləri ilə idarə olunur.
- `Section` şaquli boşluğu `spacing` propu ilə verilir.

## Müəllif hüquqları, şirkət və lisenziya

- Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur.
- **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur.
- Mənbə kodu [MIT License](LICENSE) ilə yayımlanır.
- MIT lisenziyası brend, şirkət adı, loqo və ticarət nişanından istifadə hüququ vermir.
