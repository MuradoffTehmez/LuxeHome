/**
 * İlk SUPER_ADMIN üçün SQL generatoru.
 *
 * Parol heç vaxt fayla və ya git tarixçəsinə düşmür: skript yalnız hash-lənmiş
 * dəyəri olan INSERT ifadəsini çap edir, onu isə wrangler ilə tətbiq edirsiniz.
 *
 * Standalone skriptdir — `src/lib/prisma.ts` singleton-una toxunmur, çünki D1
 * binding-i yalnız Worker sorğu kontekstində mövcuddur. Hash alqoritmi
 * `src/lib/auth/password.ts` ilə eyni olmalıdır; dəyişdirilərsə hər ikisi yenilənir.
 *
 * İstifadə:
 *   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run auth:create-admin
 */

import { webcrypto } from "node:crypto";

const crypto = webcrypto as unknown as Crypto;
// Cloudflare Workers production Web Crypto bu həddən böyük PBKDF2 dəyərini rədd edir.
const ITERATIONS = 100_000;

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

/** SQL sətir literalı üçün tək dırnaq qoşalaşdırılır. */
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
  // Prisma D1-də DateTime epoch millisaniyə kimi saxlanılır (bax: prisma/seed.sql).
  // ISO sətri yazılsa, sətir oxunarkən çevrilmə pozulur.
  const now = Date.now();

  // `mustChangePassword = 1` — ilk girişdə parol dəyişdirilməlidir.
  // 2FA hələ qurulmayıb; ilk giriş istifadəçini qurulum ekranına aparır.
  console.log(
    `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", ` +
      `"mustChangePassword", "failedAttempts", "createdAt", "updatedAt") VALUES ` +
      `('${id}', '${escape(name)}', '${escape(email)}', '${hash}', 'SUPER_ADMIN', 1, 1, 0, ` +
      `${now}, ${now});`,
  );
}

void main();
