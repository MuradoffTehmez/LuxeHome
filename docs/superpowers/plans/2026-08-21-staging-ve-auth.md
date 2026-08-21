# Staging mühiti və autentifikasiya — icra planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Luxe Home Estate üçün prod-dan tam təcrid olunmuş staging mühiti qurmaq və admin panelin açılmasına imkan verən giriş sistemini (parol + TOTP 2FA + rol yoxlaması) işlək hala gətirmək.

**Architecture:** Wrangler `env.staging` bloku ayrıca worker, D1 və R2 resursları ilə prod-u toxunulmaz saxlayır. Auth qatı D1-də saxlanan sessiyalara söykənir: cookie yalnız `jose` ilə imzalanmış sessiya ID-si daşıyır, həqiqi səlahiyyət hər sorğuda bazadan oxunur. Parol hash-ı Web Crypto PBKDF2-dir; TOTP sirri `AUTH_SECRET`-dən törədilmiş açarla AES-GCM ilə şifrələnir. Middleware yalnız imza yoxlayır, əsl qoruma `requireUser()` / `requirePermission()` guard-larındadır.

**Tech Stack:** Next.js 15 App Router, React 19, Prisma 6 + `@prisma/adapter-d1`, Cloudflare Workers (OpenNext), D1 (SQLite), `jose`, `otpauth`, `qrcode-svg`, `vitest` + `@cloudflare/vitest-pool-workers`, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-20-staging-ve-auth-design.md`
**Bazar araşdırması:** `docs/research/2026-08-20-azerbaycan-emlak-bazari-arasdirmasi.md`

## Global Constraints

- İdentifikatorlar (dəyişən, funksiya, tip adları) **ingiliscə**; şərhlər və istifadəçiyə görünən sətirlər **azərbaycanca**.
- Verilənlər bazası Cloudflare D1-dir (SQLite). `mode: "insensitive"` **işlədilmir**. `$transaction` atomarlıq vermir — yazı sırası kritiklik üzrə düzülür.
- Prisma klienti yalnız `src/lib/prisma.ts`-dəki singleton üzərindən (istisna: `prisma/` altındakı standalone skriptlər).
- D1-dən oxuyan hər səhifədə `export const dynamic = "force-dynamic"`.
- Yeni komponentdə `dark:` prefiksi yazılmır — `globals.css` tokenləri işlədilir.
- Status/rol sətirləri hardcode edilmir — `src/lib/constants.ts` sabitlərindən gəlir.
- `process.env` Workers-də yalnız sorğu kontekstində doludur — modul səviyyəsində oxunmur, lazy funksiya işlədilir.
- Keyfiyyət qapısı: hər task-ın sonunda `npm run typecheck` təmiz olmalıdır. Kod task-larında `npm test` də keçməlidir.
- Cookie adları: sessiya `lhe_session`, ara-cookie `lhe_2fa`.
- PBKDF2 parametrləri: SHA-256, 210 000 iterasiya, 16 baytlıq duz, 32 baytlıq açar.
- Sessiya müddəti: sürüşən 8 saat, mütləq son həd 7 gün.
- TOTP: SHA-1, 6 rəqəm, 30 saniyə, ±1 addım tolerantlıq.
- Hesab kilidi: 5 uğursuz cəhd → 15 dəqiqə.
- Prod `ADMIN_ENABLED` bu planın sonunda da **`"false"` qalır**.

---

## Fayl strukturu

**Yaradılır:**

| Fayl | Məsuliyyət |
|---|---|
| `src/lib/auth/password.ts` | PBKDF2 hash/verify, rehash qərarı |
| `src/lib/auth/crypto.ts` | HKDF açar törəməsi, AES-GCM şifrələmə, sabit vaxtlı müqayisə, base64url |
| `src/lib/auth/totp.ts` | TOTP yaratma/yoxlama, sirrin şifrələnməsi, backup kodlar |
| `src/lib/auth/session.ts` | D1 sessiyaların yaradılması, oxunması, uzadılması, ləğvi |
| `src/lib/auth/cookies.ts` | Cookie yazma/oxuma/silmə, JWT imzalama və doğrulama |
| `src/lib/auth/guard.ts` | `requireUser`, `requirePermission`, `getOptionalUser` |
| `src/lib/auth/rate-limit.ts` | IP limiti (binding) + hesab kilidi (D1) |
| `src/lib/auth/types.ts` | `AuthUser`, `SignInResult`, `StageToken` tipləri |
| `src/app/giris/actions.ts` | `signIn`, `verifyTwoFactor`, `enrollTwoFactor`, `signOut` server action-ları |
| `src/app/giris/dogrulama/page.tsx` | TOTP kodu ekranı |
| `src/app/giris/dogrulama/verify-form.tsx` | Kod forması (client) |
| `src/app/giris/2fa-qurulumu/page.tsx` | QR + təsdiq ekranı |
| `src/app/giris/2fa-qurulumu/enroll-form.tsx` | Qurulum forması (client) |
| `src/app/admin/hesabim/page.tsx` | Parol dəyişmə, 2FA sıfırlama, aktiv sessiyalar |
| `src/app/admin/hesabim/actions.ts` | Hesab server action-ları |
| `prisma/create-admin.ts` | İlk SUPER_ADMIN üçün SQL generatoru |
| `vitest.config.ts` | Workers pool konfiqurasiyası |
| `src/lib/auth/__tests__/*.test.ts` | Auth vahid testləri |

**Dəyişdirilir:** `wrangler.jsonc`, `package.json`, `prisma/schema.prisma`, `src/config/site.ts`, `src/app/robots.ts`, `src/lib/seo.ts`, `src/middleware.ts`, `src/app/giris/page.tsx`, `src/app/giris/login-form.tsx`, `src/app/admin/layout.tsx`, `src/components/admin/admin-shell.tsx`, `.env.example`.

---

## Task 1: Staging resursları və `env.staging`

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `package.json`
- Modify: `cloudflare-env.d.ts` (avtomatik yenilənir)

**Interfaces:**
- Produces: `env.staging` mühiti; `IS_STAGING` və `SITE_URL` var-ları; `LOGIN_LIMIT` və `CONTACT_LIMIT` ratelimit binding-ləri; `deploy:staging`, `preview:staging`, `db:migrate:staging`, `db:seed:staging` skriptləri.

- [ ] **Step 1: Cloudflare resurslarını yarat**

```bash
npx wrangler d1 create luxehome-db-staging
npx wrangler r2 bucket create luxehome-media-staging
npx wrangler r2 bucket create luxehome-next-cache-staging
```

Çıxışdakı `database_id` dəyərini qeyd et — növbəti addımda lazımdır.

- [ ] **Step 2: `wrangler.jsonc`-ə ratelimit binding-lərini və staging blokunu əlavə et**

Top-level `d1_databases` blokundan sonra əlavə et:

```jsonc
  // Giriş və əlaqə formu üçün sürət limiti (Workers doğma binding-i)
  "ratelimits": [
    { "name": "LOGIN_LIMIT", "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } },
    { "name": "CONTACT_LIMIT", "namespace_id": "1002", "simple": { "limit": 5, "period": 60 } }
  ],
```

`vars` blokunu belə dəyiş (prod dəyərləri):

```jsonc
  "vars": {
    "ADMIN_ENABLED": "false",
    "SITE_URL": "https://luxehomeestate.az"
  },
```

Faylın sonuna, bağlayan `}`-dən əvvəl staging blokunu əlavə et. `<STAGING_DB_ID>` yerinə
Step 1-dəki id yazılır:

```jsonc
  // Staging — prod resurslarından tam təcrid. Wrangler-də vars, d1_databases,
  // r2_buckets, services və ratelimits irsi ötürülmür, ona görə hamısı təkrar yazılır.
  "env": {
    "staging": {
      "name": "luxehomeestate-staging",
      "workers_dev": true,
      "observability": { "enabled": true },
      "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
      "images": { "binding": "IMAGES" },
      "vars": {
        "ADMIN_ENABLED": "true",
        "IS_STAGING": "true",
        "SITE_URL": "https://luxehomeestate-staging.amiyevbahadur.workers.dev"
      },
      "ratelimits": [
        { "name": "LOGIN_LIMIT", "namespace_id": "2001", "simple": { "limit": 10, "period": 60 } },
        { "name": "CONTACT_LIMIT", "namespace_id": "2002", "simple": { "limit": 5, "period": 60 } }
      ],
      "services": [
        { "binding": "WORKER_SELF_REFERENCE", "service": "luxehomeestate-staging" }
      ],
      "d1_databases": [
        { "binding": "DB", "database_name": "luxehome-db-staging", "database_id": "<STAGING_DB_ID>" }
      ],
      "r2_buckets": [
        { "binding": "MEDIA", "bucket_name": "luxehome-media-staging" },
        { "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "luxehome-next-cache-staging" }
      ]
    }
  }
```

- [ ] **Step 3: `package.json` skriptlərini yenilə**

`deploy` skriptini açıq mühitə bağla və yenilərini əlavə et:

```json
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy -- --env \"\"",
"deploy:staging": "opennextjs-cloudflare build && opennextjs-cloudflare deploy -- --env staging",
"preview:staging": "opennextjs-cloudflare build && opennextjs-cloudflare preview -- --env staging",
"db:migrate:staging": "wrangler d1 migrations apply luxehome-db-staging --remote",
"db:seed:staging": "wrangler d1 execute luxehome-db-staging --remote --file=prisma/seed.sql",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Tipləri yenidən yarat və yoxla**

```bash
npm run cf-typegen
npm run typecheck
```

Gözlənilir: `cloudflare-env.d.ts` içində `LOGIN_LIMIT`, `CONTACT_LIMIT`, `IS_STAGING`, `SITE_URL` görünür; typecheck təmiz keçir.

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc package.json cloudflare-env.d.ts
git commit -m "feat(infra): add an isolated staging environment"
```

---

## Task 2: `SITE_URL` runtime-a keçir və staging indeksləşmədən çıxarılır

**Files:**
- Modify: `src/config/site.ts:102-107`
- Modify: `src/app/robots.ts`
- Modify: `src/lib/seo.ts`
- Modify: `.env`, `.env.example`, `.env.production`

**Interfaces:**
- Consumes: Task 1-in `IS_STAGING` və `SITE_URL` var-ları.
- Produces: `siteUrl(path?: string): string` (dəyişməmiş imza, runtime mənbə), `isStaging(): boolean`.

- [ ] **Step 1: `siteUrl()`-i runtime dəyişənə keçir**

`src/config/site.ts` sonunda:

```ts
/**
 * Saytın kök ünvanı.
 *
 * `NEXT_PUBLIC_` prefiksli dəyişənlər build zamanı koda yapışdırılır — staging və prod
 * üçün iki ayrı build tələb edərdi. Dəyər yalnız server tərəfdə lazım olduğuna görə
 * runtime-da oxunur və bir build hər iki mühitə yayımlana bilir.
 */
export function siteUrl(path = ""): string {
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Staging mühiti — indeksləşməyə bağlıdır. */
export function isStaging(): boolean {
  return process.env.IS_STAGING === "true";
}
```

- [ ] **Step 2: `.env` fayllarını yenilə**

`.env` və `.env.example` içində `NEXT_PUBLIC_SITE_URL="http://localhost:3000"` sətrini
`SITE_URL="http://localhost:3000"` ilə əvəz et. `.env.production` faylını sil — dəyər artıq
`wrangler.jsonc` `vars` blokundadır.

- [ ] **Step 3: `robots.ts`-i staging-ə həssas et**

```ts
import type { MetadataRoute } from "next";
import { isStaging, siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Staging prod-un birə-bir dublikatıdır — indekslənsə əsas domenin sıralamasına zərər verir
  if (isStaging()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // İdarə paneli və favorit siyahısı indeksləşdirilmir
      disallow: ["/admin", "/admin/", "/giris", "/favoritler"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/"),
  };
}
```

- [ ] **Step 4: `buildMetadata()`-də staging-i noindex et**

`src/lib/seo.ts` içində `isStaging` idxal et və `robots` sətrini dəyiş:

```ts
    robots: noIndex || isStaging() ? { index: false, follow: false } : undefined,
```

- [ ] **Step 5: Yoxla və commit et**

```bash
npm run typecheck
grep -rn "NEXT_PUBLIC_SITE_URL" src .env .env.example
```

Gözlənilir: typecheck təmiz, grep heç nə tapmır.

```bash
git add src/config/site.ts src/app/robots.ts src/lib/seo.ts .env .env.example
git rm .env.production
git commit -m "refactor(seo): resolve the site URL at runtime and shut staging out of search"
```

---

## Task 3: Sxem miqrasiyası — auth cədvəlləri və bazar sahələri

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `migrations/0002_auth_and_market_fields.sql`

**Interfaces:**
- Produces: `Session`, `BackupCode`, `LoginAttempt` modelləri; `User`-də `totpSecret`, `totpEnabledAt`, `mustChangePassword`, `failedAttempts`, `lockedUntil`; `Property`-də `buildingType`, `landArea`, `mortgageAvailable`, `installmentAvailable`; `Location.kind` üçün yeni dəyərlər.

- [ ] **Step 1: `User` modelinə auth sahələrini əlavə et**

`prisma/schema.prisma`, `model User` blokunda `lastLoginAt` sətrindən sonra:

```prisma
  /// AES-GCM ilə şifrələnmiş TOTP sirri. Açıq mətn heç vaxt saxlanılmır.
  totpSecret         String?
  /// null = 2FA hələ qurulmayıb, ilk girişdə məcburi qurulum ekranı açılır
  totpEnabledAt      DateTime?
  mustChangePassword Boolean   @default(false)
  failedAttempts     Int       @default(0)
  lockedUntil        DateTime?
```

`User` modelinin relation siyahısına əlavə et:

```prisma
  sessions    Session[]
  backupCodes BackupCode[]
```

- [ ] **Step 2: Üç yeni auth modelini əlavə et**

`model User` blokundan sonra:

```prisma
/// Aktiv giriş sessiyaları. Cookie yalnız bu sətrin id-sini daşıyır,
/// beləliklə sessiya istənilən anda ləğv edilə bilir.
model Session {
  id          String    @id @default(cuid())
  userId      String
  createdAt   DateTime  @default(now())
  expiresAt   DateTime
  lastSeenAt  DateTime  @default(now())
  ip          String?
  userAgent   String?
  revokedAt   DateTime?
  /// Sessiyanı açan TOTP addımı — eyni kodun təkrar oynadılmasının qarşısını alır
  totpCounter Int?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

/// 2FA cihazı itirildikdə istifadə olunan birdəfəlik kodlar.
/// Kodlar yüksək entropiyalıdır, ona görə SHA-256 kifayətdir.
model BackupCode {
  id       String    @id @default(cuid())
  userId   String
  codeHash String
  usedAt   DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

/// Təhlükəsizlik jurnalı — uğurlu və uğursuz giriş cəhdləri.
model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  ip        String?
  success   Boolean
  /// OK | BAD_PASSWORD | BAD_TOTP | LOCKED | RATE_LIMITED | INACTIVE
  reason    String?
  createdAt DateTime @default(now())

  @@index([email, createdAt])
  @@index([createdAt])
}
```

- [ ] **Step 3: `Property`-yə bazar sahələrini əlavə et**

`model Property` blokunda, `isDemo` sətrindən əvvəl:

```prisma
  /// NEW = yeni tikili, OLD = köhnə tikili. Yerli bazarda əmlak növündən
  /// ayrı ikinci ölçüdür: qiymət, sənəd və ipoteka uyğunluğu ondan asılıdır.
  buildingType String? // NEW | OLD
  /// Torpaq sahəsi, sot (1 sot = 100 m²). Torpaq və həyət evi elanlarında
  /// m²-nin yerini tutur.
  landArea     Float?
  /// İpoteka Fondunun şərtlərinə uyğundur
  mortgageAvailable    Boolean @default(false)
  /// Tikinti şirkətinin daxili taksiti mövcuddur
  installmentAvailable Boolean @default(false)
```

- [ ] **Step 4: `Location.kind` şərhini genişləndir**

`model Location` üzərindəki şərhi dəyiş:

```prisma
/// Yerləşmə ağacı. Bakı bazarında dörd paralel açar işlədilir və istifadəçi
/// hər hansı biri ilə axtarır.
/// kind = "CITY" | "DISTRICT" | "METRO" | "SETTLEMENT" | "LANDMARK"
```

- [ ] **Step 5: Sabitləri əlavə et**

`src/lib/constants.ts`-ə, `LISTING_TYPES` blokundan sonra:

```ts
export const BUILDING_TYPES = {
  NEW: "NEW",
  OLD: "OLD",
} as const;

export type BuildingType = (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  NEW: "Yeni tikili",
  OLD: "Köhnə tikili",
};

export const LOCATION_KINDS = {
  CITY: "CITY",
  DISTRICT: "DISTRICT",
  METRO: "METRO",
  SETTLEMENT: "SETTLEMENT",
  LANDMARK: "LANDMARK",
} as const;

export type LocationKind = (typeof LOCATION_KINDS)[keyof typeof LOCATION_KINDS];
```

- [ ] **Step 6: Miqrasiyanı yarat və lokal olaraq tətbiq et**

```bash
npx prisma db push
npm run db:migrate:new -- --output migrations/0002_auth_and_market_fields.sql
```

Yaranan SQL faylını aç və `CREATE TABLE Session`, `CREATE TABLE BackupCode`,
`CREATE TABLE LoginAttempt` və `ALTER TABLE Property` sətirlərinin olduğunu təsdiq et.

- [ ] **Step 7: Miqrasiyanı staging-ə tətbiq et və commit et**

```bash
npm run db:migrate:staging
npm run typecheck
git add prisma/schema.prisma migrations/ src/lib/constants.ts
git commit -m "feat(db): add auth tables and the listing fields the local market expects"
```

---

## Task 4: Test infrastrukturu və parol hash-ı

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/auth/crypto.ts`
- Create: `src/lib/auth/password.ts`
- Create: `src/lib/auth/__tests__/password.test.ts`
- Modify: `package.json` (dependencies)

**Interfaces:**
- Produces:
  - `toBase64Url(bytes: Uint8Array): string`, `fromBase64Url(text: string): Uint8Array`
  - `timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean`
  - `deriveKey(secret: string, info: string): Promise<CryptoKey>`
  - `encryptString(plain: string, secret: string, info: string): Promise<string>`
  - `decryptString(payload: string, secret: string, info: string): Promise<string>`
  - `sha256Hex(text: string): Promise<string>`
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, stored: string): Promise<boolean>`
  - `needsRehash(stored: string): boolean`

- [ ] **Step 1: Asılılıqları qur**

```bash
npm install otpauth qrcode-svg
npm install -D vitest @cloudflare/vitest-pool-workers @types/qrcode-svg
npm uninstall bcryptjs @types/bcryptjs
```

- [ ] **Step 2: `vitest.config.ts` yarat**

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Testlər workerd runtime-ında işləyir — Web Crypto davranışı production ilə eynidir.
export default defineWorkersConfig({
  test: {
    include: ["src/**/*.test.ts"],
    poolOptions: {
      workers: {
        miniflare: {
          compatibilityDate: "2026-08-20",
          compatibilityFlags: ["nodejs_compat"],
        },
      },
    },
  },
});
```

- [ ] **Step 3: `src/lib/auth/crypto.ts` yaz**

```ts
/**
 * Auth qatının kriptoqrafik təməli.
 *
 * Hər şey Web Crypto üzərindədir: Workers-də doğma koddur, saf JavaScript
 * alternativlərindən onlarla dəfə sürətlidir və əlavə asılılıq tələb etmir.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Sabit vaxtlı müqayisə — erkən çıxış yoxdur, uzunluq fərqi də sızmır. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/** `AUTH_SECRET`-dən məqsədə görə ayrı-ayrı açarlar törədir. */
export async function deriveKey(secret: string, info: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: encoder.encode(info) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(plain: string, secret: string, info: string): Promise<string> {
  const key = await deriveKey(secret, info);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plain));
  return `v1$${toBase64Url(iv)}$${toBase64Url(new Uint8Array(cipher))}`;
}

export async function decryptString(payload: string, secret: string, info: string): Promise<string> {
  const [version, ivPart, cipherPart] = payload.split("$");
  if (version !== "v1" || !ivPart || !cipherPart) {
    throw new Error("Şifrələnmiş dəyərin formatı tanınmadı");
  }
  const key = await deriveKey(secret, info);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(cipherPart),
  );
  return decoder.decode(plain);
}

/** Yüksək entropiyalı dəyərlər üçün — backup kodlar, sessiya barmaq izləri. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

- [ ] **Step 4: Uğursuz testi yaz**

`src/lib/auth/__tests__/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyPassword } from "../password";

describe("parol hash-ı", () => {
  it("doğru parolu qəbul edir", async () => {
    const stored = await hashPassword("Luxe-2026-Test!");
    expect(await verifyPassword("Luxe-2026-Test!", stored)).toBe(true);
  });

  it("səhv parolu rədd edir", async () => {
    const stored = await hashPassword("Luxe-2026-Test!");
    expect(await verifyPassword("luxe-2026-test!", stored)).toBe(false);
  });

  it("eyni parol üçün fərqli hash verir (duz işləyir)", async () => {
    const first = await hashPassword("eyni-parol");
    const second = await hashPassword("eyni-parol");
    expect(first).not.toBe(second);
  });

  it("formatı pozulmuş dəyəri rədd edir, çökmür", async () => {
    expect(await verifyPassword("nə olursa olsun", "zibil")).toBe(false);
  });

  it("köhnə iterasiya sayını yenidən hash tələb edən kimi tanıyır", async () => {
    expect(needsRehash("pbkdf2$sha256$1000$c2FsdA$aGFzaA")).toBe(true);
    expect(needsRehash(await hashPassword("cari"))).toBe(false);
  });
});
```

- [ ] **Step 5: Testi işlət, uğursuz olduğunu təsdiqlə**

```bash
npm test -- password
```

Gözlənilir: FAIL — `Cannot find module '../password'`.

- [ ] **Step 6: `src/lib/auth/password.ts` yaz**

```ts
import { fromBase64Url, timingSafeEqual, toBase64Url } from "./crypto";

/**
 * Parol hash-ı — Web Crypto PBKDF2.
 *
 * Saf JavaScript bcrypt Workers-də bir girişə 150-400 ms CPU yeyir; doğma
 * PBKDF2 eyni təhlükəsizlik səviyyəsini onlarla dəfə ucuz verir.
 *
 * Saxlanma formatı iterasiya sayını özündə daşıyır, ona görə gələcəkdə dəyəri
 * artırmaq köhnə hash-ları sındırmır — istifadəçi növbəti girişində yenilənir.
 */

const ALGORITHM = "pbkdf2";
const DIGEST = "sha256";
const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

const encoder = new TextEncoder();

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${ALGORITHM}$${DIGEST}$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5) return false;

  const [algorithm, digest, iterationsRaw, saltPart, hashPart] = parts;
  if (algorithm !== ALGORITHM || digest !== DIGEST) return false;

  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;

  try {
    const candidate = await derive(password, fromBase64Url(saltPart), iterations);
    return timingSafeEqual(candidate, fromBase64Url(hashPart));
  } catch {
    // Formatı pozulmuş dəyər — çökmək əvəzinə sadəcə uyğunsuzluq sayılır
    return false;
  }
}

/** Hash cari parametrlərdən zəifdirsə, uğurlu girişdən sonra yenilənməlidir. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 5) return true;
  const iterations = Number.parseInt(parts[2], 10);
  return parts[0] !== ALGORITHM || parts[1] !== DIGEST || iterations < ITERATIONS;
}
```

- [ ] **Step 7: Testi işlət, keçdiyini təsdiqlə**

```bash
npm test -- password
npm run typecheck
```

Gözlənilir: 5 test PASS, typecheck təmiz.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts src/lib/auth package.json package-lock.json
git commit -m "feat(auth): hash passwords with Web Crypto PBKDF2 instead of pure-JS bcrypt"
```

---

## Task 5: TOTP və backup kodlar

**Files:**
- Create: `src/lib/auth/totp.ts`
- Create: `src/lib/auth/__tests__/totp.test.ts`

**Interfaces:**
- Consumes: `encryptString`, `decryptString`, `sha256Hex`, `timingSafeEqual` (Task 4).
- Produces:
  - `generateTotpSecret(): string` (base32)
  - `buildOtpauthUri(secret: string, email: string): string`
  - `renderQrSvg(uri: string): string`
  - `verifyTotp(secret: string, code: string): number | null` — uyğun addım nömrəsi, yoxsa `null`
  - `encryptTotpSecret(secret: string): Promise<string>` / `decryptTotpSecret(payload: string): Promise<string>`
  - `generateBackupCodes(): string[]` (10 ədəd, `XXXX-XXXX`)
  - `hashBackupCode(code: string): Promise<string>`
  - `normalizeBackupCode(input: string): string`

- [ ] **Step 1: Uğursuz testi yaz**

`src/lib/auth/__tests__/totp.test.ts`:

```ts
import { describe, expect, it, vi, afterEach } from "vitest";
import * as OTPAuth from "otpauth";
import {
  buildOtpauthUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  normalizeBackupCode,
  verifyTotp,
} from "../totp";

function codeFor(secret: string, at: number): string {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  return totp.generate({ timestamp: at });
}

afterEach(() => vi.useRealTimers());

describe("TOTP", () => {
  it("cari kodu qəbul edir və addım nömrəsini qaytarır", () => {
    const secret = generateTotpSecret();
    const now = 1_760_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const step = verifyTotp(secret, codeFor(secret, now));
    expect(step).toBe(Math.floor(now / 30_000));
  });

  it("tolerantlıqdan kənar kodu rədd edir", () => {
    const secret = generateTotpSecret();
    const now = 1_760_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(now);
    // 5 addım əvvəlki kod ±1 pəncərəsindən kənardadır
    expect(verifyTotp(secret, codeFor(secret, now - 5 * 30_000))).toBeNull();
  });

  it("otpauth URI-si e-poçtu və brendi daşıyır", () => {
    const uri = buildOtpauthUri("JBSWY3DPEHPK3PXP", "admin@luxehomeestate.az");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("admin%40luxehomeestate.az");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});

describe("backup kodlar", () => {
  it("10 unikal kod yaradır", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("normalizasiya boşluq, defis və registr fərqini udur", () => {
    expect(normalizeBackupCode(" ab3d-9f2k ")).toBe("AB3D9F2K");
    expect(normalizeBackupCode("AB3D9F2K")).toBe("AB3D9F2K");
  });

  it("eyni kod eyni hash verir, fərqli kod fərqli", async () => {
    const first = await hashBackupCode("AB3D-9F2K");
    expect(await hashBackupCode("ab3d9f2k")).toBe(first);
    expect(await hashBackupCode("ZZ11-2233")).not.toBe(first);
  });
});
```

- [ ] **Step 2: Testi işlət, uğursuz olduğunu təsdiqlə**

```bash
npm test -- totp
```

Gözlənilir: FAIL — `Cannot find module '../totp'`.

- [ ] **Step 3: `src/lib/auth/totp.ts` yaz**

```ts
import * as OTPAuth from "otpauth";
import QRCode from "qrcode-svg";
import { decryptString, encryptString, sha256Hex, toBase64Url } from "./crypto";
import { siteConfig } from "@/config/site";

/**
 * İki mərhələli doğrulama.
 *
 * Sirr bazada açıq saxlanılmır: `AUTH_SECRET`-dən HKDF ilə ayrıca açar törədilir
 * və sirr AES-GCM ilə şifrələnir. Bazaya oxu icazəsi əldə edən şəxs kod yarada bilmir.
 *
 * QR kodu server tərəfdə SVG kimi çəkilir — sirr heç bir kənar servisə göndərilmir.
 */

const PERIOD = 30;
const DIGITS = 6;
const ALGORITHM = "SHA1";
/** ±1 addım: saat fərqi olan cihazları kəsmir, pəncərəni də lazımsız genişlətmir. */
const WINDOW = 1;
const ENCRYPTION_INFO = "totp-secret-v1";
const BACKUP_CODE_COUNT = 10;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return secret;
}

function buildTotp(secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: siteConfig.name,
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: ALGORITHM,
    digits: DIGITS,
    period: PERIOD,
  });
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpauthUri(secret: string, email: string): string {
  const totp = buildTotp(secret);
  totp.label = email;
  return totp.toString();
}

export function renderQrSvg(uri: string): string {
  return new QRCode({ content: uri, padding: 1, width: 220, height: 220, ecl: "M" }).svg();
}

/**
 * Kodu yoxlayır. Uyğun gələrsə addım nömrəsini qaytarır — çağıran onu sessiyaya
 * yazıb eyni kodun ikinci dəfə işlədilməsinin qarşısını alır.
 */
export function verifyTotp(secret: string, code: string): number | null {
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length !== DIGITS) return null;

  const delta = buildTotp(secret).validate({ token: cleaned, window: WINDOW });
  if (delta === null) return null;

  return Math.floor(Date.now() / (PERIOD * 1000)) + delta;
}

export function encryptTotpSecret(secret: string): Promise<string> {
  return encryptString(secret, authSecret(), ENCRYPTION_INFO);
}

export function decryptTotpSecret(payload: string): Promise<string> {
  return decryptString(payload, authSecret(), ENCRYPTION_INFO);
}

/** Oxunaqlı əlifba — 0/O və 1/I qarışıqlığı çıxarılıb. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBackupCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < BACKUP_CODE_COUNT) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const raw = [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return [...codes];
}

/** İstifadəçi kodu boşluqla, kiçik hərflə və ya defissiz yaza bilər. */
export function normalizeBackupCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashBackupCode(code: string): Promise<string> {
  return sha256Hex(`backup:${normalizeBackupCode(code)}`);
}

/** Şifrələnmiş sirrin barmaq izi — jurnalda sirri açmadan istinad üçün. */
export function secretFingerprint(secret: string): string {
  return toBase64Url(new TextEncoder().encode(secret)).slice(0, 8);
}
```

- [ ] **Step 4: Testi işlət, keçdiyini təsdiqlə**

```bash
npm test -- totp
npm run typecheck
```

Gözlənilir: 6 test PASS.

- [ ] **Step 5: Şifrələmə testini əlavə et**

`src/lib/auth/__tests__/crypto.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { decryptString, encryptString, timingSafeEqual } from "../crypto";

const SECRET = "test-auth-secret-32-bytes-minimum-length";

describe("AES-GCM şifrələmə", () => {
  it("şifrələyib açanda ilkin dəyəri verir", async () => {
    const payload = await encryptString("JBSWY3DPEHPK3PXP", SECRET, "totp-secret-v1");
    expect(payload.startsWith("v1$")).toBe(true);
    expect(await decryptString(payload, SECRET, "totp-secret-v1")).toBe("JBSWY3DPEHPK3PXP");
  });

  it("başqa açarla açıla bilmir", async () => {
    const payload = await encryptString("gizli", SECRET, "totp-secret-v1");
    await expect(decryptString(payload, "başqa-secret", "totp-secret-v1")).rejects.toThrow();
  });

  it("hər şifrələmə fərqli IV işlədir", async () => {
    const first = await encryptString("eyni", SECRET, "totp-secret-v1");
    const second = await encryptString("eyni", SECRET, "totp-secret-v1");
    expect(first).not.toBe(second);
  });
});

describe("sabit vaxtlı müqayisə", () => {
  it("eyni baytları uyğun sayır", () => {
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
  });

  it("fərqli uzunluğu rədd edir", () => {
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });
});
```

- [ ] **Step 6: Bütün testləri işlət və commit et**

```bash
npm test
git add src/lib/auth
git commit -m "feat(auth): add TOTP with encrypted secrets and single-use backup codes"
```

---

## Task 6: Sessiya qatı

**Files:**
- Create: `src/lib/auth/types.ts`
- Create: `src/lib/auth/cookies.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/__tests__/session-policy.test.ts`

**Interfaces:**
- Consumes: `prisma` (`src/lib/prisma.ts`), `ROLES`/`Role` (`src/lib/constants.ts`).
- Produces:
  - `AuthUser` tipi: `{ id, name, email, role, mustChangePassword, totpEnabled }`
  - `signSessionToken(payload)` / `verifySessionToken(token)` / `signStageToken` / `verifyStageToken`
  - `setSessionCookie(token)`, `clearSessionCookie()`, `readSessionCookie()`
  - `setStageCookie(token, maxAgeSeconds)`, `clearStageCookie()`, `readStageCookie()`
  - `createSession({ userId, totpCounter, ip, userAgent })`, `resolveSession(sid)`, `touchSession(sid)`, `revokeSession(sid)`, `revokeAllSessions(userId)`, `listSessions(userId)`
  - `isSessionUsable(session, now)` — saf funksiya, test olunur

- [ ] **Step 1: Uğursuz testi yaz**

`src/lib/auth/__tests__/session-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ABSOLUTE_LIFETIME_MS, SLIDING_LIFETIME_MS, isSessionUsable } from "../session-policy";

const base = {
  createdAt: new Date("2026-08-21T10:00:00Z"),
  expiresAt: new Date("2026-08-21T18:00:00Z"),
  revokedAt: null as Date | null,
};

describe("sessiya siyasəti", () => {
  it("müddət bitməmiş sessiyanı qəbul edir", () => {
    expect(isSessionUsable(base, new Date("2026-08-21T12:00:00Z"))).toBe(true);
  });

  it("müddəti bitmiş sessiyanı rədd edir", () => {
    expect(isSessionUsable(base, new Date("2026-08-21T18:00:01Z"))).toBe(false);
  });

  it("ləğv edilmiş sessiyanı dərhal rədd edir", () => {
    const revoked = { ...base, revokedAt: new Date("2026-08-21T11:00:00Z") };
    expect(isSessionUsable(revoked, new Date("2026-08-21T12:00:00Z"))).toBe(false);
  });

  it("7 günlük mütləq həddi aşan sessiyanı rədd edir", () => {
    const old = {
      ...base,
      createdAt: new Date("2026-08-10T10:00:00Z"),
      expiresAt: new Date("2026-08-21T18:00:00Z"),
    };
    expect(isSessionUsable(old, new Date("2026-08-21T12:00:00Z"))).toBe(false);
  });

  it("sürüşən və mütləq müddətlər spec-lə üst-üstə düşür", () => {
    expect(SLIDING_LIFETIME_MS).toBe(8 * 60 * 60 * 1000);
    expect(ABSOLUTE_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
```

- [ ] **Step 2: Testi işlət, uğursuz olduğunu təsdiqlə**

```bash
npm test -- session-policy
```

Gözlənilir: FAIL — `Cannot find module '../session-policy'`.

- [ ] **Step 3: `src/lib/auth/session-policy.ts` yaz**

Siyasət D1-dən asılı olmayan saf funksiya kimi ayrılır ki, test edilə bilsin.

```ts
/** Sürüşən müddət: hər aktivlikdə uzadılır. */
export const SLIDING_LIFETIME_MS = 8 * 60 * 60 * 1000;
/** Mütləq son həd: yaradılmadan bu qədər sonra uzatma işləmir. */
export const ABSOLUTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionLifetime = {
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export function isSessionUsable(session: SessionLifetime, now: Date): boolean {
  if (session.revokedAt) return false;
  if (session.expiresAt.getTime() <= now.getTime()) return false;
  if (now.getTime() - session.createdAt.getTime() >= ABSOLUTE_LIFETIME_MS) return false;
  return true;
}

/** Uzadılmış son tarix — mütləq həddi heç vaxt aşmır. */
export function nextExpiry(createdAt: Date, now: Date): Date {
  const sliding = now.getTime() + SLIDING_LIFETIME_MS;
  const absolute = createdAt.getTime() + ABSOLUTE_LIFETIME_MS;
  return new Date(Math.min(sliding, absolute));
}
```

- [ ] **Step 4: Testi işlət, keçdiyini təsdiqlə**

```bash
npm test -- session-policy
```

Gözlənilir: 5 test PASS.

- [ ] **Step 5: `src/lib/auth/types.ts` yaz**

```ts
import type { Role } from "@/lib/constants";

/** Guard-ların qaytardığı istifadəçi — parol hash-ı və TOTP sirri daxil deyil. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  totpEnabled: boolean;
};

/** Girişin ara mərhələsi: parol keçib, ikinci addım gözlənilir. */
export type AuthStage = "totp" | "enroll";

export type SignInResult =
  | { status: "ok" }
  | { status: "totp" }
  | { status: "enroll" }
  | { status: "error"; message: string };
```

- [ ] **Step 6: `src/lib/auth/cookies.ts` yaz**

```ts
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AuthStage } from "./types";

/**
 * Cookie qatı.
 *
 * Sessiya cookie-si yalnız imzalanmış sessiya ID-si daşıyır — səlahiyyət hər sorğuda
 * bazadan oxunur. Ara-cookie ayrıca `stage` sahəsi ilə işarələnir və guard tərəfindən
 * sessiya kimi qəbul edilmir.
 */

export const SESSION_COOKIE = "lhe_session";
export const STAGE_COOKIE = "lhe_2fa";

const ISSUER = "luxehomeestate";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET təyin edilməyib");
  return new TextEncoder().encode(secret);
}

export type SessionClaims = { sid: string; uid: string; role: string };
export type StageClaims = { uid: string; stage: AuthStage; secret?: string };

export async function signSessionToken(claims: SessionClaims, expiresAt: Date): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject("session")
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER, subject: "session" });
    const { sid, uid, role } = payload as Record<string, unknown>;
    if (typeof sid !== "string" || typeof uid !== "string" || typeof role !== "string") return null;
    return { sid, uid, role };
  } catch {
    return null;
  }
}

export async function signStageToken(claims: StageClaims, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject("stage")
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secretKey());
}

export async function verifyStageToken(token: string): Promise<StageClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER, subject: "stage" });
    const { uid, stage, secret } = payload as Record<string, unknown>;
    if (typeof uid !== "string") return null;
    if (stage !== "totp" && stage !== "enroll") return null;
    return { uid, stage, secret: typeof secret === "string" ? secret : undefined };
  } catch {
    return null;
  }
}

const BASE_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, { ...BASE_COOKIE, expires: expiresAt });
}

export async function readSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function setStageCookie(token: string, maxAgeSeconds: number): Promise<void> {
  (await cookies()).set(STAGE_COOKIE, token, { ...BASE_COOKIE, maxAge: maxAgeSeconds });
}

export async function readStageCookie(): Promise<string | null> {
  return (await cookies()).get(STAGE_COOKIE)?.value ?? null;
}

export async function clearStageCookie(): Promise<void> {
  (await cookies()).delete(STAGE_COOKIE);
}
```

- [ ] **Step 7: `src/lib/auth/session.ts` yaz**

```ts
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";
import type { AuthUser } from "./types";
import { isSessionUsable, nextExpiry, SLIDING_LIFETIME_MS } from "./session-policy";

/**
 * D1-də saxlanan sessiyalar.
 *
 * Stateless JWT seçilməyib: 2FA-lı sistemdə oğurlanmış cookie-ni dərhal ləğv etmək
 * imkanı mütləqdir. Admin trafiki azdır, sorğu başına bir D1 oxunuşu nəzərə çarpmır.
 */

type CreateSessionInput = {
  userId: string;
  totpCounter?: number | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function createSession(input: CreateSessionInput) {
  const now = new Date();
  return prisma.session.create({
    data: {
      userId: input.userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + SLIDING_LIFETIME_MS),
      lastSeenAt: now,
      totpCounter: input.totpCounter ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/** Sessiyanı və sahibini birlikdə oxuyur; etibarsızdırsa `null`. */
export async function resolveSession(sid: string): Promise<{ user: AuthUser } | null> {
  const session = await prisma.session.findUnique({
    where: { id: sid },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          totpEnabledAt: true,
        },
      },
    },
  });

  if (!session || !session.user.isActive) return null;
  if (!isSessionUsable(session, new Date())) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as Role,
      mustChangePassword: session.user.mustChangePassword,
      totpEnabled: session.user.totpEnabledAt !== null,
    },
  };
}

/** Aktivlikdə müddəti uzadır. Mütləq həddi aşmır. */
export async function touchSession(sid: string): Promise<Date | null> {
  const session = await prisma.session.findUnique({
    where: { id: sid },
    select: { createdAt: true, expiresAt: true, revokedAt: true },
  });
  if (!session || !isSessionUsable(session, new Date())) return null;

  const now = new Date();
  const expiresAt = nextExpiry(session.createdAt, now);
  await prisma.session.update({ where: { id: sid }, data: { lastSeenAt: now, expiresAt } });
  return expiresAt;
}

export async function revokeSession(sid: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string, exceptSid?: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSid ? { id: { not: exceptSid } } : {}) },
    data: { revokedAt: new Date() },
  });
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, createdAt: true, lastSeenAt: true, ip: true, userAgent: true },
  });
}

/** Müddəti bitmiş sətirlərin təmizlənməsi — girişdə fürsətçi çağırılır. */
export async function pruneExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}
```

- [ ] **Step 8: Yoxla və commit et**

```bash
npm test
npm run typecheck
git add src/lib/auth
git commit -m "feat(auth): store sessions in D1 so they can be revoked on the spot"
```

---

## Task 7: Guard və sürət limiti

**Files:**
- Create: `src/lib/auth/guard.ts`
- Create: `src/lib/auth/rate-limit.ts`
- Create: `src/lib/auth/__tests__/permissions.test.ts`
- Create: `src/lib/auth/__tests__/lockout.test.ts`

**Interfaces:**
- Consumes: `resolveSession`, `touchSession`, cookie funksiyaları, `ROLE_PERMISSIONS`.
- Produces:
  - `hasPermission(role: Role, permission: Permission): boolean`
  - `getOptionalUser(): Promise<AuthUser | null>`
  - `requireUser(): Promise<AuthUser>`
  - `requirePermission(permission: Permission): Promise<AuthUser>`
  - `shouldLock(failedAttempts: number): boolean`, `lockUntil(now: Date): Date`
  - `checkIpLimit(key: string): Promise<boolean>`
  - `registerFailure(userId, email, ip)`, `registerSuccess(userId, email, ip)`, `isLocked(user)`

- [ ] **Step 1: Uğursuz testləri yaz**

`src/lib/auth/__tests__/permissions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLES } from "@/lib/constants";
import { hasPermission } from "../permissions";

describe("icazə matrisi", () => {
  it("SUPER_ADMIN bütün icazələri alır", () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(hasPermission(ROLES.SUPER_ADMIN, permission)).toBe(true);
    }
  });

  it("ADMIN istifadəçi idarəsini ala bilmir", () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.PROPERTY_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.USER_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it("EDITOR yalnız blog və media idarə edir", () => {
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.BLOG_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.MEDIA_MANAGE)).toBe(true);
    expect(hasPermission(ROLES.EDITOR, PERMISSIONS.PROPERTY_MANAGE)).toBe(false);
  });
});
```

`src/lib/auth/__tests__/lockout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS, isLockActive, lockUntil, shouldLock } from "../lockout";

describe("hesab kilidi", () => {
  it("hədd altında kilidləmir", () => {
    expect(shouldLock(4)).toBe(false);
  });

  it("5-ci uğursuz cəhddə kilidləyir", () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5);
    expect(shouldLock(5)).toBe(true);
    expect(shouldLock(9)).toBe(true);
  });

  it("kilid 15 dəqiqə davam edir", () => {
    const now = new Date("2026-08-21T10:00:00Z");
    expect(LOCK_DURATION_MS).toBe(15 * 60 * 1000);
    expect(lockUntil(now).toISOString()).toBe("2026-08-21T10:15:00.000Z");
  });

  it("kilid müddəti bitəndə hesab açılır", () => {
    const until = new Date("2026-08-21T10:15:00Z");
    expect(isLockActive(until, new Date("2026-08-21T10:14:59Z"))).toBe(true);
    expect(isLockActive(until, new Date("2026-08-21T10:15:00Z"))).toBe(false);
    expect(isLockActive(null, new Date())).toBe(false);
  });
});
```

- [ ] **Step 2: Testləri işlət, uğursuz olduğunu təsdiqlə**

```bash
npm test -- permissions lockout
```

Gözlənilir: FAIL — modullar tapılmır.

- [ ] **Step 3: `src/lib/auth/permissions.ts` və `src/lib/auth/lockout.ts` yaz**

`src/lib/auth/permissions.ts`:

```ts
import { ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/constants";

/** İcazə mənbəyi `constants.ts`-dəki matrisdir — burada ikinci sistem qurulmur. */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
```

`src/lib/auth/lockout.ts`:

```ts
/**
 * Hesab səviyyəsində kilid.
 *
 * IP limiti bot selini kəsir, amma IP dəyişən hədəflənmiş parol sınağını yalnız
 * hesaba bağlı sayğac dayandırır.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export function shouldLock(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

export function lockUntil(now: Date): Date {
  return new Date(now.getTime() + LOCK_DURATION_MS);
}

export function isLockActive(lockedUntil: Date | null, now: Date): boolean {
  if (!lockedUntil) return false;
  return lockedUntil.getTime() > now.getTime();
}
```

- [ ] **Step 4: Testləri işlət, keçdiyini təsdiqlə**

```bash
npm test -- permissions lockout
```

Gözlənilir: 7 test PASS.

- [ ] **Step 5: `src/lib/auth/rate-limit.ts` yaz**

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/prisma";
import { isLockActive, lockUntil, shouldLock } from "./lockout";

/**
 * İki qatlı müdafiə: IP üzrə Workers binding-i (ucuz, DB-yə toxunmur) və
 * hesab üzrə D1 kilidi (IP dəyişən hücumu kəsir).
 */

export type FailureReason = "BAD_PASSWORD" | "BAD_TOTP" | "LOCKED" | "RATE_LIMITED" | "INACTIVE";

/** Sorğunun mənbə IP-si — Cloudflare-in doğma başlığı. */
export function clientIp(headers: Headers): string {
  return headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** `true` = limit aşılmayıb, davam etmək olar. */
export async function checkLoginLimit(ip: string): Promise<boolean> {
  const limiter = getCloudflareContext().env.LOGIN_LIMIT;
  if (!limiter) return true; // lokal dev-də binding olmaya bilər
  const { success } = await limiter.limit({ key: `login:${ip}` });
  return success;
}

export function isAccountLocked(lockedUntil: Date | null): boolean {
  return isLockActive(lockedUntil, new Date());
}

/**
 * Uğursuz cəhdi qeyd edir və lazım gələrsə hesabı kilidləyir.
 * Qaytarır: hesab bu cəhddən sonra kilidləndimi.
 */
export async function registerFailure(
  userId: string | null,
  email: string,
  ip: string,
  reason: FailureReason,
): Promise<boolean> {
  let locked = false;

  if (userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
      select: { failedAttempts: true },
    });

    if (shouldLock(user.failedAttempts)) {
      await prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: lockUntil(new Date()) },
      });
      locked = true;
    }
  }

  // Jurnal kritik yol deyil — D1-də transaction olmadığı üçün ən sonda yazılır
  await prisma.loginAttempt.create({ data: { email, ip, success: false, reason } });
  return locked;
}

export async function registerSuccess(userId: string, email: string, ip: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await prisma.loginAttempt.create({ data: { email, ip, success: true, reason: "OK" } });
}
```

- [ ] **Step 6: `src/lib/auth/guard.ts` yaz**

```ts
import { forbidden, redirect } from "next/navigation";
import type { Permission } from "@/lib/constants";
import { readSessionCookie, verifySessionToken } from "./cookies";
import { resolveSession, touchSession } from "./session";
import { hasPermission } from "./permissions";
import type { AuthUser } from "./types";

/**
 * Səlahiyyət yoxlaması.
 *
 * Middleware yalnız cookie imzasını yoxlayır — ucuzdur, amma ləğv edilmiş sessiyanı
 * görmür. Həqiqi yoxlama buradadır və **hər server action-ın ilk sətrində** çağırılmalıdır:
 * action-lar layout-dan keçmir və birbaşa çağırıla bilər.
 */

export async function getOptionalUser(): Promise<AuthUser | null> {
  const token = await readSessionCookie();
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const resolved = await resolveSession(claims.sid);
  if (!resolved) return null;

  await touchSession(claims.sid);
  return resolved.user;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getOptionalUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) forbidden();
  return user;
}
```

- [ ] **Step 7: Yoxla və commit et**

```bash
npm test
npm run typecheck
git add src/lib/auth
git commit -m "feat(auth): guard admin routes by permission and throttle login attempts"
```

---

## Task 8: Giriş axını — server action-ları və ekranlar

**Files:**
- Create: `src/app/giris/actions.ts`
- Create: `src/app/giris/dogrulama/page.tsx`
- Create: `src/app/giris/dogrulama/verify-form.tsx`
- Create: `src/app/giris/2fa-qurulumu/page.tsx`
- Create: `src/app/giris/2fa-qurulumu/enroll-form.tsx`
- Modify: `src/app/giris/page.tsx`
- Modify: `src/app/giris/login-form.tsx`

**Interfaces:**
- Consumes: Task 4-7-nin hamısı.
- Produces: `signIn(prevState, formData)`, `verifyTwoFactor(prevState, formData)`, `completeEnrollment(prevState, formData)`, `signOut()` server action-ları.

- [ ] **Step 1: `src/app/giris/actions.ts` yaz**

```ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  clearStageCookie,
  readSessionCookie,
  readStageCookie,
  setSessionCookie,
  setStageCookie,
  signSessionToken,
  signStageToken,
  verifySessionToken,
  verifyStageToken,
} from "@/lib/auth/cookies";
import { createSession, pruneExpiredSessions, revokeSession } from "@/lib/auth/session";
import {
  checkLoginLimit,
  clientIp,
  isAccountLocked,
  registerFailure,
  registerSuccess,
} from "@/lib/auth/rate-limit";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  normalizeBackupCode,
  verifyTotp,
} from "@/lib/auth/totp";
import { sendEmail } from "@/lib/email";

/**
 * Giriş axını.
 *
 * Mesajlar qəsdən generikdir: mövcud olmayan e-poçt, səhv parol və deaktiv hesab
 * eyni cavabı verir ki, hansı hesabın mövcud olduğu bilinməsin.
 */

const GENERIC_ERROR = "E-poçt və ya parol yanlışdır.";
const STAGE_TOTP_SECONDS = 5 * 60;
const STAGE_ENROLL_SECONDS = 10 * 60;

export type FormState = { error?: string; ok?: boolean };

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Mövcud olmayan e-poçtda da hesablama aparılır ki, cavab vaxtı fərqlənməsin. */
const DUMMY_HASH = "pbkdf2$sha256$210000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC_ERROR };

  const ip = clientIp(await headers());
  if (!(await checkLoginLimit(ip))) {
    await prisma.loginAttempt.create({
      data: { email: parsed.data.email, ip, success: false, reason: "RATE_LIMITED" },
    });
    return { error: "Çox sayda cəhd oldu. Bir dəqiqə sonra yenidən yoxlayın." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    await verifyPassword(parsed.data.password, DUMMY_HASH);
    await registerFailure(null, parsed.data.email, ip, "BAD_PASSWORD");
    return { error: GENERIC_ERROR };
  }

  if (!user.isActive) {
    await registerFailure(null, user.email, ip, "INACTIVE");
    return { error: GENERIC_ERROR };
  }

  if (isAccountLocked(user.lockedUntil)) {
    await registerFailure(null, user.email, ip, "LOCKED");
    return { error: "Hesab müvəqqəti olaraq bağlanıb. 15 dəqiqə sonra yenidən cəhd edin." };
  }

  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    const locked = await registerFailure(user.id, user.email, ip, "BAD_PASSWORD");
    if (locked) {
      await sendEmail({
        to: user.email,
        subject: "Luxe Home Estate — hesabınız müvəqqəti bağlandı",
        text:
          `Hesabınıza ardıcıl 5 uğursuz giriş cəhdi oldu və hesab 15 dəqiqəlik bağlandı.\n` +
          `Cəhd sizin deyilsə, parolunuzu dəyişin.\nIP: ${ip}`,
      });
    }
    return { error: GENERIC_ERROR };
  }

  if (needsRehash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });
  }

  // 2FA hələ qurulmayıbsa, panelə keçid məcburi qurulum ekranından keçir
  if (!user.totpEnabledAt) {
    const secret = generateTotpSecret();
    await setStageCookie(
      await signStageToken({ uid: user.id, stage: "enroll", secret }, STAGE_ENROLL_SECONDS),
      STAGE_ENROLL_SECONDS,
    );
    redirect("/giris/2fa-qurulumu");
  }

  await setStageCookie(
    await signStageToken({ uid: user.id, stage: "totp" }, STAGE_TOTP_SECONDS),
    STAGE_TOTP_SECONDS,
  );
  redirect("/giris/dogrulama");
}

async function startSession(userId: string, totpCounter: number | null): Promise<never> {
  const requestHeaders = await headers();
  const session = await createSession({
    userId,
    totpCounter,
    ip: clientIp(requestHeaders),
    userAgent: requestHeaders.get("user-agent"),
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, role: true },
  });

  await setSessionCookie(
    await signSessionToken({ sid: session.id, uid: userId, role: user.role }, session.expiresAt),
    session.expiresAt,
  );
  await clearStageCookie();
  await registerSuccess(userId, user.email, clientIp(requestHeaders));
  await pruneExpiredSessions();

  redirect("/admin");
}

export async function verifyTwoFactor(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "totp") {
    return { error: "Doğrulama müddəti bitdi. Yenidən daxil olun." };
  }

  const user = await prisma.user.findUnique({ where: { id: claims.uid } });
  if (!user?.totpSecret || !user.isActive) {
    return { error: "Doğrulama müddəti bitdi. Yenidən daxil olun." };
  }

  const input = String(formData.get("code") ?? "");
  const ip = clientIp(await headers());

  // Backup kod formatı: hərf daşıyır, TOTP isə yalnız rəqəm
  if (/[A-Za-z]/.test(input)) {
    const codeHash = await hashBackupCode(input);
    const match = await prisma.backupCode.findFirst({
      where: { userId: user.id, codeHash, usedAt: null },
    });
    if (!match) {
      await registerFailure(user.id, user.email, ip, "BAD_TOTP");
      return { error: "Kod yanlışdır." };
    }
    await prisma.backupCode.update({ where: { id: match.id }, data: { usedAt: new Date() } });
    await startSession(user.id, null);
  }

  const secret = await decryptTotpSecret(user.totpSecret);
  const step = verifyTotp(secret, input);
  if (step === null) {
    await registerFailure(user.id, user.email, ip, "BAD_TOTP");
    return { error: "Kod yanlışdır." };
  }

  // Eyni addımın təkrar oynadılmasının qarşısı
  const replayed = await prisma.session.findFirst({
    where: { userId: user.id, totpCounter: step, revokedAt: null },
  });
  if (replayed) {
    await registerFailure(user.id, user.email, ip, "BAD_TOTP");
    return { error: "Bu kod artıq istifadə olunub. Yeni kodu gözləyin." };
  }

  await startSession(user.id, step);
}

export async function completeEnrollment(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "enroll" || !claims.secret) {
    return { error: "Qurulum müddəti bitdi. Yenidən daxil olun." };
  }

  const step = verifyTotp(claims.secret, String(formData.get("code") ?? ""));
  if (step === null) return { error: "Kod yanlışdır. Tətbiqdəki cari kodu yazın." };

  const codes = generateBackupCodes();
  await prisma.user.update({
    where: { id: claims.uid },
    data: {
      totpSecret: await encryptTotpSecret(claims.secret),
      totpEnabledAt: new Date(),
    },
  });
  await prisma.backupCode.deleteMany({ where: { userId: claims.uid } });
  for (const code of codes) {
    await prisma.backupCode.create({
      data: { userId: claims.uid, codeHash: await hashBackupCode(code) },
    });
  }

  await startSession(claims.uid, step);
}

export async function signOut(): Promise<void> {
  const token = await readSessionCookie();
  const claims = token ? await verifySessionToken(token) : null;
  if (claims) await revokeSession(claims.sid);
  await clearSessionCookie();
  await clearStageCookie();
  redirect("/giris");
}

/** Qurulum ekranı üçün — sirr yalnız ara-cookie-dən oxunur, bazaya hələ yazılmayıb. */
export async function readEnrollmentSecret(): Promise<{ uid: string; secret: string } | null> {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "enroll" || !claims.secret) return null;
  return { uid: claims.uid, secret: claims.secret };
}
```

- [ ] **Step 2: `login-form.tsx`-i real action-a bağla**

`"use client"` saxlanılır. `useState`/`useRouter` çıxarılır, `useActionState` gəlir:

```tsx
import { useActionState, useState } from "react";
import { signIn, type FormState } from "./actions";
```

`handleSubmit` funksiyası silinir, komponentin gövdəsi:

```tsx
  const [state, formAction, pending] = useActionState<FormState, FormData>(signIn, {});
```

`<form onSubmit={handleSubmit}>` → `<form action={formAction}>`.

Formun içində, `Button`-dan əvvəl səhv blokunu əlavə et:

```tsx
      {state.error && (
        <p
          role="alert"
          className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
```

«Şifrəni unutmusunuz?» düyməsini sil — bərpa axını bu fazada yoxdur və işləməyən düymə
istifadəçini çaşdırır. «Məni xatırla» checkbox-u da silinir: sessiya müddəti serverdə
təyin olunur.

- [ ] **Step 3: `giris/page.tsx`-dən dizayn mərhələsi xəbərdarlığını çıxar**

`ShieldCheck` blokunun mətnini dəyiş:

```tsx
            <p className="text-xs leading-relaxed text-ink-soft">
              Giriş iki mərhələlidir: parolunuzdan sonra doğrulama tətbiqindəki kod
              soruşulacaq.
            </p>
```

- [ ] **Step 4: Doğrulama ekranını yarat**

`src/app/giris/dogrulama/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readStageCookie, verifyStageToken } from "@/lib/auth/cookies";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Doğrulama",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "totp") redirect("/giris");

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-ivory px-5 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-display text-xl tracking-[0.18em] text-ink">LUXE HOME ESTATE</span>
          <h1 className="font-display text-3xl text-ink">Doğrulama kodu</h1>
          <p className="text-sm text-ink-soft">
            Doğrulama tətbiqindəki 6 rəqəmli kodu yazın. Cihazınız əlinizdə deyilsə,
            ehtiyat kodlarınızdan birini istifadə edin.
          </p>
        </div>
        <VerifyForm />
      </div>
    </main>
  );
}
```

`src/app/giris/dogrulama/verify-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { verifyTwoFactor } from "../actions";
import type { FormState } from "../actions";

export function VerifyForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(verifyTwoFactor, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Kod" htmlFor="totp-code" required>
        <input
          id="totp-code"
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456"
          className="w-full min-h-12 rounded-xs border border-line-strong bg-paper px-4 py-3 text-center text-lg tracking-[0.4em] text-ink placeholder:tracking-normal placeholder:text-ink-muted focus:border-gold"
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <ShieldCheck className="size-4.5" aria-hidden="true" />}
        Təsdiqlə
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: 2FA qurulum ekranını yarat**

`src/app/giris/2fa-qurulumu/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildOtpauthUri, renderQrSvg } from "@/lib/auth/totp";
import { readEnrollmentSecret } from "../actions";
import { EnrollForm } from "./enroll-form";

export const metadata: Metadata = {
  title: "İki mərhələli doğrulamanın qurulması",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  const enrollment = await readEnrollmentSecret();
  if (!enrollment) redirect("/giris");

  const user = await prisma.user.findUnique({
    where: { id: enrollment.uid },
    select: { email: true },
  });
  if (!user) redirect("/giris");

  const qrSvg = renderQrSvg(buildOtpauthUri(enrollment.secret, user.email));

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-ivory px-5 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex flex-col gap-2">
          <span className="font-display text-xl tracking-[0.18em] text-ink">LUXE HOME ESTATE</span>
          <h1 className="font-display text-3xl text-ink">İki mərhələli doğrulama</h1>
          <p className="text-sm text-ink-soft">
            Panelə giriş üçün doğrulama tətbiqi tələb olunur. QR kodu Google Authenticator,
            Microsoft Authenticator və ya oxşar tətbiqlə skan edin, sonra tətbiqdəki kodu yazın.
          </p>
        </div>

        <div className="mb-6 flex justify-center rounded-xs border border-line bg-paper p-6">
          <div
            aria-label="QR kod"
            // Server tərəfdə çəkilir — sirr kənar servisə göndərilmir
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <details className="mb-6 rounded-xs border border-line bg-beige px-4 py-3">
          <summary className="cursor-pointer text-sm text-ink-soft">
            QR skan edilmirsə, açarı əl ilə yazın
          </summary>
          <code className="mt-2 block font-mono text-sm break-all text-ink">
            {enrollment.secret}
          </code>
        </details>

        <EnrollForm />
      </div>
    </main>
  );
}
```

`src/app/giris/2fa-qurulumu/enroll-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { completeEnrollment, type FormState } from "../actions";

export function EnrollForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(completeEnrollment, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Tətbiqdəki kod" htmlFor="enroll-code" required>
        <input
          id="enroll-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456"
          className="w-full min-h-12 rounded-xs border border-line-strong bg-paper px-4 py-3 text-center text-lg tracking-[0.4em] text-ink placeholder:tracking-normal placeholder:text-ink-muted focus:border-gold"
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <ShieldCheck className="size-4.5" aria-hidden="true" />}
        Doğrulamanı aktivləşdir
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: Yoxla və commit et**

```bash
npm run typecheck
npm run build
git add src/app/giris
git commit -m "feat(auth): wire the login screens to real credentials and TOTP"
```

---

## Task 9: Marşrut qoruması və hesab səhifəsi

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/admin/admin-shell.tsx`
- Create: `src/app/admin/hesabim/page.tsx`
- Create: `src/app/admin/hesabim/actions.ts`
- Create: `src/app/forbidden.tsx`

**Interfaces:**
- Consumes: `requireUser`, `signOut`, `listSessions`, `revokeSession`, `revokeAllSessions`.
- Produces: qorunan `/admin` ağacı; `changePassword`, `revokeOtherSessions`, `revokeOne` action-ları.

- [ ] **Step 1: `middleware.ts`-i yenilə**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * İdarə paneli qapısı və ucuz sessiya yoxlaması.
 *
 * Burada yalnız cookie imzası doğrulanır — D1-ə müraciət edilmir, çünki middleware
 * hər sorğuda işləyir. Sessiyanın həqiqətən diri olduğu `admin/layout.tsx` və hər
 * server action içindəki guard tərəfindən yoxlanılır.
 */

const SESSION_COOKIE = "lhe_session";

async function hasValidSignature(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), {
      issuer: "luxehomeestate",
      subject: "session",
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Panel bağlıdırsa varlığı kənara bildirilmir — 404 göstərilir
  if (process.env.ADMIN_ENABLED !== "true") {
    return NextResponse.rewrite(new URL("/__baglidir", request.url));
  }

  const signedIn = await hasValidSignature(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin") && !signedIn) {
    const target = new URL("/giris", request.url);
    target.searchParams.set("davam", `${pathname}${search}`);
    return NextResponse.redirect(target);
  }

  if (pathname === "/giris" && signedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/giris/:path*", "/giris"],
};
```

- [ ] **Step 2: `admin/layout.tsx`-ə guard qoş**

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: {
    default: "İdarə paneli",
    template: "%s | Luxe Home Estate idarə paneli",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Müvəqqəti parolla gələn istifadəçi əvvəlcə onu dəyişməlidir
  if (user.mustChangePassword) redirect("/admin/hesabim?parol=deyis");

  const [newLeads, draftProperties] = await Promise.all([
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.property.count({ where: { status: "DRAFT", deletedAt: null } }),
  ]);

  return (
    <AdminShell user={user} counters={{ newLeads, draftProperties }}>
      {children}
    </AdminShell>
  );
}
```

- [ ] **Step 3: `AdminShell`-ə istifadəçi və çıxış düyməsi əlavə et**

`src/components/admin/admin-shell.tsx` props tipinə əlavə et:

```tsx
import type { AuthUser } from "@/lib/auth/types";
import { signOut } from "@/app/giris/actions";
```

Props: `user: AuthUser` əlavə olunur. Sidebar-ın altına, mövcud naviqasiyadan sonra:

```tsx
        <div className="mt-auto border-t border-line-dark px-4 py-4">
          <p className="truncate text-sm text-ink-invert">{user.name}</p>
          <p className="truncate text-xs text-ink-invert-soft">{user.email}</p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="min-h-11 w-full cursor-pointer rounded-xs border border-line-dark px-3 text-sm text-ink-invert-soft transition-colors duration-200 hover:border-gold hover:text-gold-soft"
            >
              Çıxış
            </button>
          </form>
        </div>
```

Mövcud mock istifadəçi bloku varsa silinir.

- [ ] **Step 4: `src/app/forbidden.tsx` yarat**

```tsx
import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-5">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ink">İcazəniz yoxdur</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Bu bölmə sizin rolunuz üçün açıq deyil. Səhv olduğunu düşünürsünüzsə,
          panel administratoru ilə əlaqə saxlayın.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex min-h-11 items-center rounded-xs bg-gold px-5 text-sm text-ink"
        >
          Panelə qayıt
        </Link>
      </div>
    </main>
  );
}
```

`next.config.ts`-ə `experimental: { authInterrupts: true }` əlavə et — `forbidden()` funksiyası
bu bayraq olmadan işləmir.

- [ ] **Step 5: Hesab səhifəsini yarat**

`src/app/admin/hesabim/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions, revokeSession } from "@/lib/auth/session";
import { readSessionCookie, verifySessionToken } from "@/lib/auth/cookies";

export type AccountState = { error?: string; success?: string };

const passwordSchema = z
  .object({
    current: z.string().min(1),
    next: z.string().min(10, "Yeni parol ən azı 10 simvol olmalıdır."),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, {
    message: "Yeni parol təkrarı uyğun gəlmir.",
  });

export async function changePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil." };
  }

  const record = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { error: "Cari parol yanlışdır." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.next),
      mustChangePassword: false,
    },
  });

  // Parol dəyişəndə digər cihazlardakı sessiyalar qapanır
  const token = await readSessionCookie();
  const claims = token ? await verifySessionToken(token) : null;
  await revokeAllSessions(user.id, claims?.sid);

  revalidatePath("/admin/hesabim");
  return { success: "Parol dəyişdirildi və digər cihazlardakı sessiyalar bağlandı." };
}

export async function revokeOne(formData: FormData): Promise<void> {
  const user = await requireUser();
  const sid = String(formData.get("sid") ?? "");

  // Yalnız öz sessiyasını ləğv edə bilir
  const owned = await prisma.session.findFirst({ where: { id: sid, userId: user.id } });
  if (owned) await revokeSession(sid);

  revalidatePath("/admin/hesabim");
}
```

`src/app/admin/hesabim/page.tsx` — parol forması, aktiv sessiya siyahısı və qalan backup
kod sayı göstərilir:

```tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { listSessions } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";
import { revokeOne } from "./actions";

export const metadata: Metadata = { title: "Hesabım" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const [sessions, remainingCodes] = await Promise.all([
    listSessions(user.id),
    prisma.backupCode.count({ where: { userId: user.id, usedAt: null } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl text-ink">Hesabım</h1>
        <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
      </header>

      <section className="rounded-xs border border-line bg-paper p-6">
        <h2 className="font-display text-lg text-ink">Parolu dəyiş</h2>
        <div className="mt-4 max-w-md">
          <PasswordForm />
        </div>
      </section>

      <section className="rounded-xs border border-line bg-paper p-6">
        <h2 className="font-display text-lg text-ink">İki mərhələli doğrulama</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Aktivdir. İşlənməmiş ehtiyat kod sayı: <strong>{remainingCodes}</strong>
        </p>
        {remainingCodes < 3 && (
          <p className="mt-2 rounded-xs border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning">
            Ehtiyat kodlarınız azalıb. Yenilərini yaratmaq üçün administratora müraciət edin.
          </p>
        )}
      </section>

      <section className="rounded-xs border border-line bg-paper p-6">
        <h2 className="font-display text-lg text-ink">Aktiv sessiyalar</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{session.userAgent ?? "Naməlum cihaz"}</p>
                <p className="text-xs text-ink-muted">
                  {session.ip ?? "IP yoxdur"} · son aktivlik{" "}
                  {session.lastSeenAt.toLocaleString("az-AZ")}
                </p>
              </div>
              <form action={revokeOne}>
                <input type="hidden" name="sid" value={session.id} />
                <button
                  type="submit"
                  className="min-h-11 cursor-pointer text-sm text-danger underline-offset-4 hover:underline"
                >
                  Bağla
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

`src/app/admin/hesabim/password-form.tsx` — `useActionState` ilə `changePassword`-i çağıran
client komponent; üç `Field` (`current`, `next`, `confirm`), səhv və uğur mesajı blokları,
`Button` ilə göndərmə. Struktur `verify-form.tsx` ilə eynidir.

- [ ] **Step 6: Naviqasiyaya «Hesabım» əlavə et**

`src/components/admin/admin-nav.ts` siyahısına:

```ts
  { label: "Hesabım", href: "/admin/hesabim", icon: "UserCog" },
```

- [ ] **Step 7: Yoxla və commit et**

```bash
npm test
npm run typecheck
npm run build
git add src middleware next.config.ts
git commit -m "feat(auth): close the admin routes behind a live session"
```

---

## Task 10: İlk admin hesabı, staging yayımı və doğrulama

**Files:**
- Create: `prisma/create-admin.ts`
- Modify: `package.json`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `hashPassword`.
- Produces: `npm run auth:create-admin` skripti; staging-də işlək giriş.

- [ ] **Step 1: `prisma/create-admin.ts` yaz**

Standalone skriptdir — Prisma singleton-undan istifadə etmir, yalnız SQL çap edir.

```ts
/**
 * İlk SUPER_ADMIN üçün SQL generatoru.
 *
 * Parol heç vaxt fayla və ya git tarixçəsinə düşmür: skript yalnız hash-lənmiş
 * dəyəri olan INSERT ifadəsini çap edir, onu isə wrangler ilə tətbiq edirsiniz.
 *
 * İstifadə:
 *   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npx tsx prisma/create-admin.ts
 */

import { webcrypto } from "node:crypto";

const crypto = webcrypto as unknown as Crypto;
const ITERATIONS = 210_000;

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    256,
  );
  return `pbkdf2$sha256$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(new Uint8Array(bits))}`;
}

function escape(value: string): string {
  return value.replace(/'/g, "''");
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    console.error("ADMIN_EMAIL, ADMIN_NAME və ADMIN_PASSWORD təyin edilməlidir.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Parol ən azı 12 simvol olmalıdır.");
    process.exit(1);
  }

  const id = `usr_${Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("hex")}`;
  const hash = await hashPassword(password);
  const now = new Date().toISOString();

  console.log(
    `INSERT INTO User (id, name, email, passwordHash, role, isActive, mustChangePassword, ` +
      `failedAttempts, createdAt, updatedAt) VALUES ('${id}', '${escape(name)}', ` +
      `'${escape(email)}', '${hash}', 'SUPER_ADMIN', 1, 1, 0, '${now}', '${now}');`,
  );
}

void main();
```

`package.json`-a əlavə et:

```json
"auth:create-admin": "tsx prisma/create-admin.ts"
```

- [ ] **Step 2: Staging secret-lərini yaz**

`AUTH_SECRET` üçün təsadüfi dəyər yarat:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npx wrangler secret put AUTH_SECRET --env staging
npx wrangler secret put RESEND_API_KEY --env staging
npx wrangler secret put RESEND_FROM_EMAIL --env staging
npx wrangler secret put NOTIFICATION_EMAIL --env staging
```

Prod `AUTH_SECRET`-i **fərqli** dəyərlə ayrıca yaz:

```bash
npx wrangler secret put AUTH_SECRET --env ""
```

- [ ] **Step 3: İlk admini staging bazasına yaz**

```bash
ADMIN_EMAIL=admin@luxehomeestate.az ADMIN_NAME="Bahadur Əmiyev" ADMIN_PASSWORD='<güclü-parol>' npm run auth:create-admin
```

Çıxan SQL-i fayla yazmadan birbaşa tətbiq et:

```bash
npx wrangler d1 execute luxehome-db-staging --remote --command "<yuxarıdakı INSERT>"
```

- [ ] **Step 4: Staging-ə yayımla və doğru worker-ə düşdüyünü təsdiqlə**

```bash
npm run deploy:staging
npx wrangler deployments list --env staging
```

Gözlənilir: siyahıda `luxehomeestate-staging` görünür. `luxehomeestate` **görünmür**.

- [ ] **Step 5: Prod-un toxunulmadığını yoxla**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://luxehomeestate.az/
curl -s https://luxehomeestate.az/robots.txt | head -5
curl -s https://luxehomeestate-staging.amiyevbahadur.workers.dev/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://luxehomeestate.az/admin
```

Gözlənilir: prod `200`, prod robots `Allow: /`, staging robots `Disallow: /`,
prod `/admin` → `404`.

- [ ] **Step 6: Spec-dəki əl ilə yoxlama siyahısını icra et**

`docs/superpowers/specs/2026-08-20-staging-ve-auth-design.md` bölmə 7-dəki 13 bəndin
hamısını staging-də keç. Uğursuz olan hər bənd üçün düzəliş et və yenidən yayımla.

- [ ] **Step 7: `CLAUDE.md`-ni yenilə və commit et**

`CLAUDE.md`-də dəyişənlər:
- «Cari vəziyyət və bilinən boşluqlar» bölməsindən «Admin panel hazır deyil və bağlıdır»
  bəndini yenilə: auth hazırdır, CRUD hələ mock-dur.
- Əmrlər bölməsinə `npm run deploy:staging`, `npm run test`, `npm run auth:create-admin` əlavə et.
- Cloudflare bölməsinə staging cədvəlini əlavə et.
- `NEXT_PUBLIC_SITE_URL` istinadını `SITE_URL` ilə əvəz et.

```bash
git add prisma/create-admin.ts package.json CLAUDE.md
git commit -m "feat(auth): bootstrap the first admin and document the staging workflow"
```

---

## Self-review qeydləri

**Spec örtüyü.** Spec-in 4.1-4.5 bəndləri Task 1-2-də; 5.1 Task 3-də; 5.2 Task 4-də;
5.4 Task 5-də; 5.3 Task 6-da; 5.5-5.6 Task 7-də; 5.7 və 5.9 Task 8-də; 5.6-nın middleware
hissəsi və `/admin/hesabim` Task 9-da; 5.8 Task 10-da. Bölmə 6 (test planı) Task 4-7-yə
paylanıb: 15 halın 14-ü örtülür. Örtülməyən tək hal — «6-cı cəhd doğru parolla da rədd edilir» —
D1 tələb etdiyi üçün vahid testi deyil, Task 10 Step 6-dakı əl ilə yoxlama siyahısındadır.

**Bazar araşdırmasının dörd blokerı.** `buildingType`, metro/qəsəbə/nişangah üçün
`Location.kind` genişlənməsi, `landArea` və ipoteka/taksit bayraqları — hamısı Task 3-dədir.
Qalan altı boşluq (hesablanmış `AZN/m²`, mərtəbə filtrləri, elan nömrəsi ilə axtarış, şəkil
say limiti, təsvir limiti, telefonun gizlədilməsi) Faza 2 və 3-ün işidir; bu planda deyil.

**Tip uyğunluğu.** `AuthUser` Task 6-da təyin olunur, Task 7 və 9-da eyni sahə adları ilə
işlədilir. `FormState` Task 8-də bir dəfə təyin olunur və hər üç formada eynidir.
`verifyTotp` hər yerdə `number | null` qaytarır. `isSessionUsable` yalnız `SessionLifetime`
formasını qəbul edir və `resolveSession` ona tam uyğun `select` verir.
