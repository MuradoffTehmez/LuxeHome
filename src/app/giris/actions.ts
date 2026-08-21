"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import {
  checkLoginLimit,
  clientIp,
  isAccountLocked,
  logRateLimited,
  registerFailure,
  registerSuccess,
} from "@/lib/auth/rate-limit";
import {
  createSession,
  isTotpStepUsed,
  pruneExpiredSessions,
  revokeSession,
} from "@/lib/auth/session";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyTotp,
} from "@/lib/auth/totp";
import type { FormState } from "@/lib/auth/types";
import { sendEmail } from "@/lib/email";

/**
 * Giriş axını.
 *
 * Səhv mesajları qəsdən generikdir: mövcud olmayan e-poçt, səhv parol və deaktiv hesab
 * eyni cavabı verir ki, hansı hesabın mövcud olduğu kənardan bilinməsin.
 *
 * D1 transaction dəstəkləmir, ona görə yazı sırası kritiklik üzrədir: əvvəl sessiya,
 * sonra sayğac, ən sonda jurnal.
 */

const GENERIC_ERROR = "E-poçt və ya parol yanlışdır.";
const DEFAULT_TARGET = "/admin";
const STAGE_TOTP_SECONDS = 5 * 60;
const STAGE_ENROLL_SECONDS = 10 * 60;

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

/**
 * Mövcud olmayan e-poçt üçün də hesablama aparılır ki, cavab vaxtı hesabın
 * varlığını sızdırmasın. Dəyər real hash formatındadır, sadəcə heç bir parola uyğun gəlmir.
 */
const DUMMY_HASH =
  "pbkdf2$sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/**
 * Girişdən sonra qayıdılacaq ünvanı təmizləyir.
 *
 * Yalnız panel daxilindəki nisbi marşrutlar qəbul edilir — `//kenar.sayt` və ya
 * tam URL verilsə, açıq yönləndirmə (open redirect) zəifliyi yaranardı.
 */
function safeTarget(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^\/admin(?:[/?#]|$)/.test(value) ? value : undefined;
}

/** İkinci mərhələni keçmiş istifadəçi üçün sessiya açır və panelə yönləndirir. */
async function startSession(
  userId: string,
  totpCounter: number | null,
  target?: string,
): Promise<never> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, role: true },
  });

  const session = await createSession({
    userId,
    totpCounter,
    ip,
    userAgent: requestHeaders.get("user-agent"),
  });

  await setSessionCookie(
    await signSessionToken({ sid: session.id, uid: userId, role: user.role }, session.expiresAt),
    session.expiresAt,
  );
  await clearStageCookie();
  await registerSuccess(userId, user.email, ip);
  await pruneExpiredSessions();

  redirect(target ?? DEFAULT_TARGET);
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC_ERROR };

  const { email, password } = parsed.data;
  const next = safeTarget(formData.get("davam"));
  const ip = clientIp(await headers());

  if (!(await checkLoginLimit(ip))) {
    await logRateLimited(email, ip);
    return { error: "Çox sayda cəhd oldu. Bir dəqiqə sonra yenidən yoxlayın." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await verifyPassword(password, DUMMY_HASH);
    await registerFailure(null, email, ip, "BAD_PASSWORD");
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

  if (!(await verifyPassword(password, user.passwordHash))) {
    const locked = await registerFailure(user.id, user.email, ip, "BAD_PASSWORD");
    if (locked) {
      await sendEmail({
        to: user.email,
        subject: "Luxe Home Estate — hesabınız müvəqqəti bağlandı",
        html:
          "<p>Hesabınıza ardıcıl 5 uğursuz giriş cəhdi oldu və hesab 15 dəqiqəlik bağlandı.</p>" +
          "<p>Cəhd sizin deyilsə, kilid açılan kimi parolunuzu dəyişin.</p>" +
          `<p>Cəhdin gəldiyi IP: <strong>${ip}</strong></p>`,
      });
    }
    return { error: GENERIC_ERROR };
  }

  // Hash köhnə parametrlərlə yaradılıbsa, cari parolla səssizcə yenilənir
  if (needsRehash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  // 2FA hələ qurulmayıbsa, panelə keçid məcburi qurulum ekranından keçir.
  // Sirr bu mərhələdə yalnız imzalanmış ara-cookie-də yaşayır, bazaya hələ yazılmır.
  if (!user.totpEnabledAt) {
    const secret = generateTotpSecret();
    await setStageCookie(
      await signStageToken({ uid: user.id, stage: "enroll", secret, next }, STAGE_ENROLL_SECONDS),
      STAGE_ENROLL_SECONDS,
    );
    redirect("/giris/2fa-qurulumu");
  }

  await setStageCookie(
    await signStageToken({ uid: user.id, stage: "totp", next }, STAGE_TOTP_SECONDS),
    STAGE_TOTP_SECONDS,
  );
  redirect("/giris/dogrulama");
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

  // Backup kodda hərf var, TOTP isə yalnız rəqəmdən ibarətdir
  if (/[A-Za-z]/.test(input)) {
    const codeHash = await hashBackupCode(input);
    const match = await prisma.backupCode.findFirst({
      where: { userId: user.id, codeHash, usedAt: null },
      select: { id: true },
    });
    if (!match) {
      await registerFailure(user.id, user.email, ip, "BAD_TOTP");
      return { error: "Kod yanlışdır." };
    }
    await prisma.backupCode.update({ where: { id: match.id }, data: { usedAt: new Date() } });
    // `startSession` yönləndirmə atır və heç vaxt qayıtmır
    return startSession(user.id, null, claims.next);
  }

  const secret = await decryptTotpSecret(user.totpSecret);
  const step = verifyTotp(secret, input);
  if (step === null) {
    await registerFailure(user.id, user.email, ip, "BAD_TOTP");
    return { error: "Kod yanlışdır." };
  }

  if (await isTotpStepUsed(user.id, step)) {
    await registerFailure(user.id, user.email, ip, "BAD_TOTP");
    return { error: "Bu kod artıq istifadə olunub. Növbəti kodu gözləyin." };
  }

  return startSession(user.id, step, claims.next);
}

/**
 * Qurulumu tamamlayır: kod düzgündürsə sirr şifrələnib bazaya yazılır,
 * backup kodlar yaradılır və sessiya açılır.
 */
export async function completeEnrollment(
  _prev: EnrollmentState,
  formData: FormData,
): Promise<EnrollmentState> {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "enroll" || !claims.secret) {
    return { error: "Qurulum müddəti bitdi. Yenidən daxil olun." };
  }

  if (verifyTotp(claims.secret, String(formData.get("code") ?? "")) === null) {
    return { error: "Kod yanlışdır. Tətbiqdəki cari kodu yazın." };
  }

  const codes = generateBackupCodes();

  await prisma.user.update({
    where: { id: claims.uid },
    data: {
      totpSecret: await encryptTotpSecret(claims.secret),
      totpEnabledAt: new Date(),
    },
  });

  // Yenidən qurulumda köhnə kodlar etibarsız olur
  await prisma.backupCode.deleteMany({ where: { userId: claims.uid } });
  for (const code of codes) {
    await prisma.backupCode.create({
      data: { userId: claims.uid, codeHash: await hashBackupCode(code) },
    });
  }

  // Kodlar yalnız bir dəfə göstərilir — istifadəçi onları saxlamalıdır
  return { backupCodes: codes };
}

export type EnrollmentState = { error?: string; backupCodes?: string[] };

/** Backup kodlar göstərildikdən sonra sessiyanı açır. */
export async function finishEnrollment(): Promise<void> {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "enroll") redirect("/giris");

  await startSession(claims.uid, null, claims.next);
}

export async function signOut(): Promise<void> {
  const token = await readSessionCookie();
  const claims = token ? await verifySessionToken(token) : null;
  if (claims) await revokeSession(claims.sid);

  await clearSessionCookie();
  await clearStageCookie();
  redirect("/giris");
}
