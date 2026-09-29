# Test və keyfiyyət

Bu səhifə layihənin test qatlarını, keyfiyyət qapısını, CI-də hansı yoxlamanın harada işlədiyini və yeni kod üçün hansı testin yazılmalı olduğunu izah edir. Vəziyyət: 29 sentyabr 2026 — **173 Vitest faylı / 889 test**, **15 Playwright spec / 190 test icrası**.

## Test piramidası

| Qat | Alət | Harada işləyir | Say | Nəyi tutur |
|---|---|---|---:|---|
| Domen unit testləri | Vitest + `@cloudflare/vitest-plugin` | **workerd** (production ilə eyni Web Crypto) | 112 fayl | Auth, kripto, siyasətlər, parser-lər, sorğu formaları, sabitlər |
| SSR komponent testləri | Vitest | Node (`ui-node`) | 51 fayl (`src/components/**`) | Render, əlçatanlıq atributları, i18n mətnləri |
| D1 integration | Vitest + miniflare D1 | workerd, real D1, miqrasiyalar tətbiq olunmuş | 8 fayl (`*.integration.test.ts`) | 100 bound parametr həddi, nested relation ilişməsi, real SQL |
| Repo səviyyəli testlər | Vitest | Node (`repo-node`) | 2 fayl (`prisma/__tests__`) | Miqrasiya və generasiya olunan SQL/seed faylları (`migration-0031`, `seed-dates`) |
| Browser E2E | Playwright + axe-core | Lokal workerd stack (PR) və canlı staging (`main`) | 190 icra | İstifadəçi axınları, SEO, təhlükəsizlik başlıqları, a11y, performans, mobil |
| Canlı SEO smoke | Node skriptləri | Production | — | Marşrut statusları, SERP qəbulu |

Vitest dörd layihəyə bölünür (`vitest.config.mts`), hamısı eyni `npm run test` əmrinə daxildir:

| Layihə | Runtime | `include` | Nə üçün |
|---|---|---|---|
| `workerd` | workerd | `src/**/*.test.{ts,tsx}` (komponentlər və `*.integration.test.ts` xaric) | Domen qatı production ilə eyni Web Crypto-da |
| `integration` | workerd + real miniflare D1 | `src/**/*.integration.test.ts` | `readD1Migrations()` ilə `migrations/` tətbiq olunur; D1 hədləri yalnız burada görünür |
| `repo-node` | Node | `prisma/**/*.test.ts`, `scripts/**/*.test.ts` | Repo fayllarını (miqrasiya, generasiya olunan SQL) oxuyan testlər — workerd sandbox-ında `node:fs` layihə qovluğunu görmür |
| `ui-node` | Node | `src/components/**/*.test.{ts,tsx}` | React SSR komponentləri (`src/test/setup-ui.ts`) |

Miqrasiya, seed və ya generator çıxışını fayl sistemindən oxuyan yeni test `prisma/__tests__/` və ya `scripts/` altına yazılmalıdır — `src/` altında workerd-də işləyər və faylı tapmaz. Wrangler konfiqurasiyası domen testlərinə qəsdən qoşulmayıb — binding lazım deyil və testləri yavaşladardı.

Paylanma (fayl sayı): `src/lib/__tests__` 70, `src/components/site` 22, `src/lib/auth` 17, `src/components/admin` 16, `src/lib/admin` 10, `src/i18n` 7, digərləri 1–5.

## Keyfiyyət qapısı

Hər dəyişiklikdən sonra beşi də:

```bash
npm run test        # vitest run — 173 fayl / 889 test, ~65 s
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run dead-code   # knip --include files,dependencies
npm run build       # prisma generate + next build --webpack
```

**`npm run build`-i buraxma.** Server Action qaydaları yalnız webpack mərhələsində yoxlanılır: `"use server"` faylındakı hər ixrac `async` olmalıdır, Promise qaytaran sinxron sarğı belə build-i saxlayır.

Ayrıca: `npm audit --audit-level=high` — CI-də hər dəfə, lokalda yalnız `package.json` / `package-lock.json` dəyişəndə.

## Qoruyucu testlər — sındırsanız niyə sındığını bilin

| Test | Qoruduğu qayda |
|---|---|
| `public-cache-safety.test.ts` | Sessiya oxuyan ictimai marşrut `SESSION_DEPENDENT_PUBLIC_ROUTES`-da olmalıdır — əks halda bir istifadəçinin HTML-i kənar keşdən başqasına verilər |
| `admin-label-sync.test.ts` | `constants.ts`-dəki `*_LABELS` ilə admin `labels.*` kataloqu sinxrondur |
| i18n kataloq parity testləri | AZ/EN/RU kataloqlarının açarları eynidir; `admin` namespace-i `MESSAGE_NAMESPACES`-ə salınmayıb |
| `locations-tree.test.ts` | Ərazi ağacının struktur qaydaları (səviyyələr, kodlar, alias, nişangah, slug) |
| `az-collation.test.ts` | Azərbaycan əlifbası ilə sıralama (`localeCompare("az")` workerd-də etibarsızdır) |
| `d1-limits.integration.test.ts`, `map-query.integration.test.ts` | D1-in 100 parametr həddi və `take`-li nested əlaqənin 98+ valideyndə ilişməsi |
| `admin-typography.test.ts` | Admin başlıqlarında `font-display` işlədilmir |
| Auth testləri (`src/lib/auth/__tests__`) | PBKDF2 formatı və `needsRehash`, TOTP replay, sessiya siyasəti, lockout, cookie proyeksiyası, passkey/Google/telefon siyasətləri |

## Hansı dəyişikliyə hansı test

| Dəyişiklik | Yazılmalı test |
|---|---|
| Yeni saf funksiya, siyasət, parser | Workerd unit testi (`src/lib/**/__tests__`) |
| Sorğu formasının dəyişməsi (uzun `IN`, nested relation, böyük cədvəl) | `*.integration.test.ts` — lokal SQLite D1 həddini tutmur |
| Yeni ictimai marşrut sessiya oxuyur | `SESSION_DEPENDENT_PUBLIC_ROUTES` + mövcud cache-safety testi |
| Yeni admin mətni | Üç kataloqa açar (parity testi keçməlidir) |
| Yeni `*_LABELS` dəyəri | Admin `labels.*` kataloqu (label-sync testi) |
| Yeni istifadəçi axını | Playwright spec (`e2e/specs/`), lazım olsa fixture (`scripts/e2e/local-stack-fixtures.ts`) |
| Ərazi datası | `locations-tree.test.ts` keçməlidir; yeni qayda varsa ora əlavə |

## Browser E2E

Testlər `next dev`-ə deyil, **workerd-ə** qarşı yazılıb: `next dev`-də Prisma wasm engine yüklənmir və D1 oxuyan hər səhifə 500 verir.

### Lokal stack

```bash
npm run e2e:install        # bir dəfə: Chromium + sistem asılılıqları
npm run e2e:local:build    # OpenNext bundle, IS_STAGING=true, SITE_URL=http://localhost:8787
npm run e2e:local:prepare  # .wrangler/e2e-state: təzə D1 (miqrasiya, seed, taksonomiya, demo) + test hesabları
npm run e2e:local:serve    # workerd :8787
```

Sonra ayrı terminalda:

```bash
E2E_BASE_URL=http://localhost:8787 npm run e2e
```

`prepare` addımı `AUTH_SECRET` və `E2E_ADMIN_TOTP_SECRET` tələb edir (CI onları hər run üçün efemer yaradır).

### Auth və Turnstile

Turnstile üçün test bypass-ı **qəsdən yoxdur**. Admin stage cookie ilə TOTP addımından real keçir (`auth-setup` layihəsi bir dəfə daxil olur və sessiyanı paylaşır — TOTP replay qoruması eyni 30 s addımda ikinci girişi rədd edir). Elan sahibi fixture sessiyası ilə daxil olur (`scripts/e2e/`, `e2e/support/auth.ts`).

### Layihələr və spec-lər

| Layihə | Cihaz | Spec-lər |
|---|---|---|
| `auth-setup` | Desktop Chrome | `auth.setup.ts` |
| `chromium` | Desktop Chrome | `mobile.spec.ts` xaric hamısı |
| `mobile` | Pixel 7 | `mobile.spec.ts`, `smoke.spec.ts` |

Spec-lər: `smoke`, `listings`, `property-detail`, `favorites-compare`, `content`, `i18n`, `api`, `seo`, `security`, `performance`, `a11y`, `mobile`, `admin-panel`, `kabinet-listing`, `projects-section`.

E2E dəsti ilk qurulanda iki real baq tapdı: `not-found.tsx` AZ üçün locale prefiksi vermirdi və `--color-ink-muted` ivory fonda 4.47:1 kontrastda idi (WCAG AA 4.5:1).

## CI-də keyfiyyət

| Yoxlama | Nə vaxt | Uğursuz olanda |
|---|---|---|
| `Quality gate` (audit, test, typecheck, lint, dead-code, build) | Hər PR və `main` push | PR merge olunmur, yayım başlamır |
| `Local stack E2E` | Hər PR (məcburi yoxlama) və `main` push | PR merge olunmur |
| `Browser E2E (staging)` | `main` push, staging yayımından sonra | Production yayımı dayanır |
| CodeQL | `main`-ə PR, `main` push, həftəlik (bazar ertəsi 03:17 UTC) | Kod təhlükəsizliyi xəbərdarlığı |
| Dependency review | PR | `high` və yuxarı zəifliyi olan yeni asılılıq PR-ı sındırır (`fail-on-severity: high`) |

## Bilinən keyfiyyət borcları

- Production üçün tam post-deploy brauzer smoke yoxdur (`test:seo:routes`, `test:seo:live` var).
- Admin panel JSX-ində 2 sentyabr auditindən qalan legacy xam mətn sətirləri — parity testi xam JSX mətnini tutmur (`MEMORY.md` bölmə 5).
- TypeScript 7, ESLint 10 və Vitest 5 upstream uyğunsuzluğuna görə saxlanılır (`dependabot.yml`).
