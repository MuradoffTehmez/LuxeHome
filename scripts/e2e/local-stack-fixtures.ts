/**
 * Lokal stack E2E üçün test hesabları (#87).
 *
 * CI-də hər run-da təzə lokal D1-ə yazılır; staging/production-a heç vaxt getmir.
 * Giriş formaları Turnstile ilə qorunur və test üçün bypass qəsdən yoxdur — ona görə
 * hesablar parolsuz (`passwordHash = "disabled"`) yaradılır:
 *
 * - **Admin** (`SUPER_ADMIN`) — 2FA qurulub; sirr tətbiqin öz `encryptTotpSecret()`
 *   funksiyası ilə şifrələnir. Test imzalanmış stage cookie ilə `/giris/dogrulama`
 *   addımına düşür və TOTP kodunu real yoxlamadan keçirir.
 * - **Elan sahibi** (`OWNER`) — təsdiqlənmiş e-poçt və hazır `PUBLIC` sessiyası.
 *
 * Giriş: `AUTH_SECRET` (worker-in `.dev.vars`-dakı ilə eyni) və
 * `E2E_ADMIN_TOTP_SECRET` (base32). Çıxış: stdout-a SQL.
 *
 *   AUTH_SECRET=... E2E_ADMIN_TOTP_SECRET=... npx tsx scripts/e2e/local-stack-fixtures.ts > fixtures.sql
 */
import { encryptTotpSecret } from "../../src/lib/auth/totp";
import { E2E_FIXTURES } from "../../e2e/support/fixtures";

function sql(value: string | number | null): string {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

async function main() {
  const totpSecret = process.env.E2E_ADMIN_TOTP_SECRET;
  if (!process.env.AUTH_SECRET || !totpSecret) {
    console.error("AUTH_SECRET və E2E_ADMIN_TOTP_SECRET təyin edilməlidir.");
    process.exit(1);
  }

  // Prisma D1-də DateTime ISO mətn kimi saxlanılır (`seed.sql`, demo məzmun). Epoch
  // rəqəmi yazılsa SQLite onu hər mətndən kiçik sayır: `expiresAt < now` təmizlənməsi
  // sessiyanı dərhal «vaxtı bitmiş» kimi silirdi.
  const now = new Date().toISOString();
  const inWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const encrypted = await encryptTotpSecret(totpSecret);
  const { admin, lister } = E2E_FIXTURES;

  const user = (fields: Record<string, string | number | null>) =>
    `INSERT INTO "User" (${Object.keys(fields).map((key) => `"${key}"`).join(", ")}) VALUES (${Object.values(fields).map(sql).join(", ")});`;

  console.log(
    [
      user({
        id: admin.id, name: "E2E Admin", email: admin.email, passwordHash: "disabled",
        role: "SUPER_ADMIN", accountType: "STAFF", isActive: 1, mustChangePassword: 0, failedAttempts: 0,
        locale: admin.locale, totpSecret: encrypted, totpEnabledAt: now, createdAt: now, updatedAt: now,
      }),
      user({
        id: lister.id, name: "E2E Elan Sahibi", email: lister.email, passwordHash: "disabled",
        role: "EDITOR", accountType: "OWNER", isActive: 1, mustChangePassword: 0, failedAttempts: 0,
        locale: "az", emailVerifiedAt: now, approvedAt: now, createdAt: now, updatedAt: now,
      }),
      `INSERT INTO "Session" ("id", "userId", "createdAt", "expiresAt", "lastSeenAt", "authKind") VALUES (${[
        lister.sessionId, lister.id, now, inWeek, now, "PUBLIC",
      ].map(sql).join(", ")});`,
    ].join("\n"),
  );
}

void main();
