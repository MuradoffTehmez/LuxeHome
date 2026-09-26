import { expect, type BrowserContext, type Page } from "@playwright/test";
import { SignJWT } from "jose";
import * as OTPAuth from "otpauth";
import {
  SESSION_COOKIE,
  SESSION_SUBJECT,
  STAGE_COOKIE,
  STAGE_SUBJECT,
  TOKEN_ISSUER,
} from "../../src/lib/auth/cookie-names";
import type { AuthStage } from "../../src/lib/auth/types";
import { E2E_FIXTURES } from "./fixtures";

/**
 * Lokal stack E2E-də giriş (#87).
 *
 * Giriş formaları Turnstile ilə qorunur və test üçün bypass qəsdən yoxdur. Buna
 * görə:
 * - admin üçün parol addımından sonrakı vəziyyət (imzalanmış `lhe_2fa` stage
 *   cookie-si) qurulur və **2FA doğrulaması real keçilir** — TOTP kodu fixture
 *   sirrindən hesablanır, server onu şifrəli sirrlə tutuşdurur və sessiya açır;
 * - elan sahibi üçün D1-də hazır `PUBLIC` sessiyası üçün cookie imzalanır.
 *
 * Tələb olunan mühit: `AUTH_SECRET` (worker-dəki ilə eyni) və
 * `E2E_ADMIN_TOTP_SECRET`. Staging-ə qarşı run-da bunlar yoxdur və auth testləri
 * atlanır.
 */
export const authFixturesEnabled = Boolean(process.env.AUTH_SECRET && process.env.E2E_ADMIN_TOTP_SECRET);

/** `auth.setup.ts`-in yazdığı admin sessiyası. */
export const ADMIN_STORAGE_STATE = "playwright/.auth/admin.json";

function key(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

function cookieFor(context: BrowserContext, name: string, value: string, baseURL: string) {
  const url = new URL(baseURL);
  return context.addCookies([
    { name, value, domain: url.hostname, path: "/", httpOnly: true, secure: url.protocol === "https:", sameSite: "Lax" },
  ]);
}

/** Admin: stage cookie → `/giris/dogrulama` → TOTP kodu → `/admin`. */
export async function signInAsAdmin(page: Page, baseURL: string): Promise<void> {
  const stage: AuthStage = "totp";
  const token = await new SignJWT({ uid: E2E_FIXTURES.admin.id, stage, next: "/admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(STAGE_SUBJECT)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key());
  await cookieFor(page.context(), STAGE_COOKIE, token, baseURL);

  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(process.env.E2E_ADMIN_TOTP_SECRET ?? ""),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  await page.goto("/az/giris/dogrulama");
  await page.locator('input[name="code"]').fill(totp.generate());
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin(?:[/?#]|$)/);
}

/** Elan sahibi: fixture-dakı `PUBLIC` sessiyası üçün cookie. */
export async function signInAsLister(context: BrowserContext, baseURL: string): Promise<void> {
  const { lister } = E2E_FIXTURES;
  const token = await new SignJWT({
    sid: lister.sessionId,
    uid: lister.id,
    role: lister.role,
    accountType: lister.accountType,
    authKind: lister.authKind,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(key());
  await cookieFor(context, SESSION_COOKIE, token, baseURL);
}

/** Səhifədə xam tərcümə açarı (`admin.components.…`) görünmür (#81). */
export async function expectNoRawMessageKeys(page: Page): Promise<void> {
  const text = await page.locator("body").innerText();
  expect(text, "xam tərcümə açarı").not.toMatch(/\badmin\.(?:components|actions|pages|labels)\.[\w.]+/);
}

/** Toplu yükləmə üçün etibarlı JPEG-lər — brauzer canvas-ı ilə yaradılır. */
export async function makeJpegFiles(page: Page, count: number, width = 3200, height = 2400) {
  const encoded = await page.evaluate(
    async ({ count, width, height }) => {
      const files: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d")!;
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, `hsl(${index * 40}, 70%, 55%)`);
        gradient.addColorStop(1, `hsl(${index * 40 + 120}, 70%, 35%)`);
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), "image/jpeg", 0.95));
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        files.push(btoa(binary));
      }
      return files;
    },
    { count, width, height },
  );
  return encoded.map((base64, index) => ({
    name: `e2e-foto-${index + 1}.jpg`,
    mimeType: "image/jpeg",
    buffer: Buffer.from(base64, "base64"),
  }));
}
