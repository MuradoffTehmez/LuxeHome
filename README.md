<div align="center">
  <img src="public/logo-full.png" alt="Luxe Home Estate loqosu" width="260" />
  <h1>Luxe Home Estate</h1>
  <p>Azərbaycan bazarı üçün premium daşınmaz əmlak platforması.</p>

  <p>
    <a href="https://luxehomeestate.az">Canlı sayt</a>
    ·
    <a href="https://github.com/MuradoffTehmez/LuxeHome/wiki">Texniki Wiki</a>
    ·
    <a href="SECURITY.md">Təhlükəsizlik siyasəti</a>
  </p>
</div>

---

## Layihə haqqında

Luxe Home Estate — Bakı və Azərbaycan daşınmaz əmlak bazarı üçün hazırlanmış tamölçülü veb platformadır. Sayt mənzil, villa, həyət evi, bağ evi, torpaq, ofis və kommersiya obyektlərinin satışı və icarəsini, tikinti layihələrini, xidmətləri və bloq məzmununu vahid interfeysdə təqdim edir.

İctimai sayt [Next.js App Router](https://nextjs.org/docs/app) üzərində Server Component-lərlə işləyir. Məlumat qatı [Prisma ORM](https://www.prisma.io/) vasitəsilə Cloudflare D1 bazasına qoşulur; tətbiq [OpenNext](https://opennext.js.org/cloudflare) ilə Cloudflare Workers-ə yayımlanır.

> [!IMPORTANT]
> Seed prosesi ictimai məzmun yaratmır. Əmlaklar, layihələr və bloq yazıları yalnız admin panel vasitəsilə əlavə edilir; köhnə `isDemo` qeydləri ictimai sorğularda bloklanır.

## Cari imkanlar

- Satış və kirayə elanlarının kataloqu və detal səhifələri
- Mətn, elan növü, əmlak tipi, şəhər, rayon, qiymət, otaq, sahə, təmir və sənəd üzrə filtrləmə
- Qiymət, tarix, sahə və seçilmiş status üzrə sıralama və səhifələmə
- Şəkil qalereyası, oxşar elanlar, paylaşma və cihazda saxlanan favoritlər
- Layihə, xidmət və bloq siyahıları ilə ayrıca detal səhifələri
- D1-də saxlanan müraciətlər və Resend vasitəsilə e-poçt bildirişi
- Canonical URL, Open Graph, Twitter Card, sitemap, robots.txt və JSON-LD
- Azərbaycan dilinə uyğun SEO URL-ləri və slug transliterasiyası
- Responsive interfeys, dark mode, klaviatura fokusu və reduced-motion dəstəyi
- Brendli 404 və xəta səhifələri, hüquqi səhifələr və mərkəzi şirkət konfiqurasiyası
- Rol əsaslı admin interfeysi və auth təməli: sessiya, TOTP, backup kodlar, hesab kilidi və icazə matrisi

## Texnologiya yığını

| Qat | Texnologiya |
|---|---|
| Framework | Next.js 15.5, React 19, App Router |
| Dil | TypeScript, strict mode |
| UI | Tailwind CSS v4, Lucide React, `next-themes` |
| Verilənlər bazası | Cloudflare D1 (SQLite) |
| ORM | Prisma 6 + `@prisma/adapter-d1` + WASM client |
| Hosting | Cloudflare Workers + OpenNext |
| Media və keş | Cloudflare R2, Cloudflare Images, R2 incremental cache |
| Auth | `jose`, Web Crypto PBKDF2, TOTP, AES-GCM |
| E-poçt | Resend |
| Validasiya | Zod |
| Test | Vitest + Cloudflare `workerd` runtime |

## Arxitektura

```text
Brauzer
  │
  ▼
Next.js App Router (Cloudflare Worker)
  ├── Server Components ──► src/lib/queries.ts ──► Prisma WASM ──► D1
  ├── Server Actions ─────► D1 / Resend
  ├── Auth guard ─────────► imzalanmış cookie + D1 sessiyası
  ├── next/image ─────────► Cloudflare Images
  └── media / ISR ────────► R2 bucket-ləri
```

İctimai səhifələr `src/app/(site)` route qrupundadır və ayrıca API qatı olmadan birbaşa `src/lib/queries.ts` funksiyalarını çağırır. Yazma əməliyyatları Server Action-larla aparılır. D1 binding-i yalnız sorğu kontekstində əlçatan olduğuna görə Prisma klienti `src/lib/prisma.ts` daxilində lazy `Proxy` vasitəsilə yaradılır.

### İctimai marşrutlar

| Marşrut | Təyinat |
|---|---|
| `/` | Ana səhifə |
| `/emlaklar` | Əmlak kataloqu və URL əsaslı filtrlər |
| `/emlaklar/[slug]` | Əmlak detalı |
| `/layiheler`, `/layiheler/[slug]` | Layihələr |
| `/xidmetler`, `/xidmetler/[slug]` | Xidmətlər |
| `/blog`, `/blog/[slug]` | Bloq |
| `/favoritler` | Cihazda saxlanan favoritlər |
| `/haqqimizda`, `/elaqe` | Şirkət və əlaqə məlumatları |
| `/mexfilik-siyaseti`, `/istifade-sertleri`, `/cookie-siyaseti` | Hüquqi səhifələr |

### Əsas məlumat modelləri

Prisma sxemi istifadəçi və auth modelləri (`User`, `Session`, `BackupCode`, `LoginAttempt`), əmlak domeni (`Property`, `PropertyType`, `Location`, `Feature`, `PropertyImage`), layihə və məzmun (`Project`, `Service`, `BlogPost`) və əməliyyat modellərindən (`Lead`, `Favorite`, `Media`, `Setting`) ibarətdir.

Statuslar və rollar SQLite-da `String` kimi saxlanır. İcazə verilən bütün domen dəyərlərinin həqiqət mənbəyi `src/lib/constants.ts` faylıdır.

## Qovluq quruluşu

```text
luxehome/
├── migrations/              # Cloudflare D1 SQL miqrasiyaları
├── prisma/
│   ├── schema.prisma        # Domen və auth sxemi
│   ├── seed.ts              # Sistem və taksonomiya başlanğıc məlumatları
│   ├── seed.sql             # D1 üçün yaradılmış seed
│   ├── remove-demo-content.sql # Köhnə demo kontentin təhlükəsiz təmizlənməsi
│   └── build-seed-sql.ts    # Lokal SQLite → D1 SQL çeviricisi
├── public/                  # Loqo, OG şəkli və statik fayllar
├── scripts/                 # Loqo və e-poçt köməkçi skriptləri
├── src/
│   ├── app/                 # Next.js səhifələri, layout-lar və Server Actions
│   ├── components/
│   │   ├── admin/           # Admin interfeys komponentləri
│   │   ├── site/            # İctimai sayt komponentləri
│   │   └── ui/              # Dizayn sistemi primitivləri
│   ├── config/site.ts       # Brend, əlaqə və naviqasiya məlumatları
│   └── lib/                 # Sorğular, auth, SEO, e-poçt və utilitlər
├── next.config.ts
├── open-next.config.ts
└── wrangler.jsonc           # Production və staging Cloudflare binding-ləri
```

## Lokal quraşdırma

### Tələblər

- Node.js 20 və ya daha yeni LTS versiyası
- npm
- Lokal D1 mühiti üçün Wrangler (layihənin dev dependency-si kimi quraşdırılır)

### 1. Repozitoriyanı klonlayın

```bash
git clone https://github.com/MuradoffTehmez/LuxeHome.git
cd LuxeHome
```

### 2. Asılılıqları quraşdırın

```bash
npm ci
```

### 3. Mühit dəyişənlərini hazırlayın

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Ən azı `DATABASE_URL`, `AUTH_SECRET` və `SITE_URL` dəyərlərini nəzərdən keçirin. Resend dəyişənləri olmadan müraciət bazada saxlanır, lakin e-poçt bildirişi göndərilmir.

### 4. Prisma client və lokal D1 bazasını hazırlayın

```bash
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
```

### 5. Development server-i başladın

```bash
npm run dev
```

Sayt [http://localhost:3000](http://localhost:3000) ünvanında açılacaq. `next dev` zamanı OpenNext lokal Cloudflare binding-lərini Miniflare vasitəsilə təmin edir.

## Mühit dəyişənləri

| Dəyişən | Təyinat | Məcburi |
|---|---|---|
| `DATABASE_URL` | Prisma CLI üçün lokal SQLite faylı | Lokal DB əmrləri üçün |
| `AUTH_SECRET` | JWT imzası və TOTP sirrinin açar törətməsi | Auth üçün |
| `SITE_URL` | Canonical URL, sitemap və Open Graph bazası | Bəli |
| `SEED_ADMIN_EMAIL` | Seed zamanı yaradılan super admin | Xeyr |
| `SEED_ADMIN_PASSWORD` | Seed super admin parolu | Production üçün dəyişdirilməlidir |
| `RESEND_API_KEY` | Resend API açarı | E-poçt üçün |
| `RESEND_FROM_EMAIL` | Göndərən ünvan | E-poçt üçün |
| `NOTIFICATION_EMAIL` | Müraciət bildirişinin alıcısı | E-poçt üçün |
| `ADMIN_ENABLED` | `/admin` və `/giris` marşrut qapısı | Panel üçün |

Production sirləri repozitoriyada və ya `.env` faylında saxlanmamalıdır:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
npx wrangler secret put NOTIFICATION_EMAIL
```

## npm əmrləri

### İnkişaf və keyfiyyət

| Əmr | Təyinat |
|---|---|
| `npm run dev` | Next.js development server |
| `npm run typecheck` | TypeScript yoxlaması (`tsc --noEmit`) |
| `npm run lint` | ESLint yoxlaması |
| `npm test` | Vitest testlərini `workerd` mühitində işlədir |
| `npm run build` | Prisma client yaradır və production build qurur |
| `npm run preview` | OpenNext build-i lokal `workerd` mühitində açır |

### Verilənlər bazası

| Əmr | Təyinat |
|---|---|
| `npm run db:generate` | Prisma client-i yeniləyir |
| `npm run db:migrate:local` | Miqrasiyaları lokal D1 bazasına tətbiq edir |
| `npm run db:migrate:remote` | Miqrasiyaları production D1 bazasına tətbiq edir |
| `npm run db:seed:build` | `prisma/dev.db` faylından `prisma/seed.sql` yaradır |
| `npm run db:seed:local` | Seed SQL-i lokal D1 bazasına yükləyir |
| `npm run db:seed:remote` | Seed SQL-i production D1 bazasına yükləyir |
| `npm run db:studio` | Prisma Studio-nu başladır |

### Staging və deployment

| Əmr | Təyinat |
|---|---|
| `npm run preview:staging` | Staging konfiqurasiyası ilə lokal preview |
| `npm run db:migrate:staging` | Staging D1 miqrasiyası |
| `npm run db:seed:staging` | Staging D1 seed |
| `npm run deploy:staging` | İzolyasiya olunmuş staging Worker-i yayımlayır |
| `npm run deploy` | Production Worker-i yayımlayır |
| `npm run cf-typegen` | Wrangler binding-lərindən `CloudflareEnv` tipləri yaradır |

## Verilənlər bazası iş axını

Sxem dəyişdikdə tövsiyə olunan ardıcıllıq:

```bash
# Lokal Prisma SQLite faylını sxemlə uyğunlaşdırın
npx prisma db push

# Sistem və taksonomiya məlumatlarını yaradın, sonra D1 seed SQL-ə çevirin
npx tsx prisma/seed.ts
npm run db:seed:build

# D1 miqrasiyalarını və seed-i lokal mühitdə yoxlayın
npm run db:migrate:local
npm run db:seed:local
```

Yeni D1 miqrasiyası üçün:

```bash
npm run db:migrate:new -- --output migrations/000N_deyisiklik.sql
```

> [!WARNING]
> `prisma/seed.sql` təkrar icra zamanı cədvəllərdəki mövcud məlumatları təmizləyir. Production-da `db:seed:remote` əmrini yalnız məqsədli şəkildə işlədin.

## Təhlükəsizlik modeli

- Sessiya cookie-si yalnız imzalanmış sessiya ID-si daşıyır; səlahiyyət və sessiyanın ləğv vəziyyəti hər sorğuda D1-dən yoxlanılır.
- Parollar Web Crypto PBKDF2-HMAC-SHA256 ilə 210 000 iterasiyada hash olunur.
- TOTP sirri `AUTH_SECRET`-dən HKDF ilə törədilən açarla AES-GCM vasitəsilə şifrələnir.
- İkinci mərhələ üçün TOTP və birdəfəlik backup kodlar nəzərdə tutulub.
- Sessiya 8 saatlıq sürüşən müddətə və 7 günlük mütləq son həddə malikdir.
- Beş uğursuz giriş cəhdi hesabı 15 dəqiqə kilidləyir; Cloudflare rate-limit binding-i IP səviyyəli qoruma verir.
- Rol və icazələr `src/lib/constants.ts` daxilində `SUPER_ADMIN`, `ADMIN` və `EDITOR` üçün mərkəzləşdirilib.
- Production-da admin marşrutları `ADMIN_ENABLED=false` olduğu müddətdə 404 arxasında bağlı qalır.

Təhlükəsizlik boşluğunu açıq issue kimi paylaşmayın. Məsuliyyətli bildiriş qaydası üçün [SECURITY.md](SECURITY.md) sənədinə baxın.

## Keyfiyyət qapısı

Dəyişiklik göndərməzdən əvvəl:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Auth testləri kriptoqrafiya, parol hash-i, hesab kilidi, icazə matrisi, sessiya müddəti və TOTP davranışını Cloudflare `workerd` runtime-ında yoxlayır.

## Cari məhdudiyyətlər

- Admin dashboard və əmlak siyahısı D1-dən oxuyur; əmlak CRUD və media yükləmə axını hələ tamamlanmayıb.
- R2 `MEDIA` binding-i konfiqurasiya edilib, amma upload endpoint-i və media idarəetməsi tamamlanmayıb.
- `CONTACT_LIMIT` binding-i mövcuddur; əlaqə formasında honeypot və Turnstile inteqrasiyası hələ tamamlanmayıb.
- SQLite `LIKE` Azərbaycan hərfləri üçün tam registrsiz axtarış vermir; normallaşdırılmış axtarış sütunu tələb olunur.
- İctimai interfeys hazırda yalnız Azərbaycan dilindədir; rus dili planlaşdırılır.
- Redaksiya dizaynındakı stok Unsplash şəkilləri şirkətin öz foto arxivi ilə əvəzlənməlidir.
- Hüquqi səhifələrin yekun mətni hüquqşünas təsdiqi tələb edir.

## Deployment

Production yayımından əvvəl Cloudflare hesabına daxil olun, secret-ləri əlavə edin və miqrasiyanı tətbiq edin:

```bash
npx wrangler login
npm run typecheck
npm test
npm run build
npm run db:migrate:remote
npm run deploy
```

Production Worker `luxehomeestate` adı ilə `luxehomeestate.az` və `www.luxehomeestate.az` domenlərinə bağlanır. Staging resursları ayrıca Worker, D1, R2 və rate-limit namespace-lərindən istifadə edir.

## Kod konvensiyaları

- Dəyişən, funksiya və tip adları ingiliscədir.
- Şərhlər və istifadəçiyə görünən mətnlər azərbaycancadır.
- İctimai əmlak sorğuları `deletedAt: null` və icazəli ictimai statuslarla məhdudlaşdırılmalıdır.
- Prisma klienti yalnız `src/lib/prisma.ts` singleton/Proxy qatı üzərindən istifadə edilməlidir.
- Dark mode komponent səviyyəli `dark:` sinifləri ilə deyil, semantik dizayn tokenlərinin dəyişdirilməsi ilə idarə olunur.
- `Section` şaquli boşluğu `spacing` propu ilə idarə olunur.

## Lisenziya və sahiblik

Kod [MIT License](LICENSE) şərtləri ilə yayımlanır.

“Luxe Home Estate” brendi və markası Əmiyev Bahadur Qafar oğluna məxsusdur. Kod lisenziyası brend, loqo və ticarət nişanından istifadə hüququ vermir.
