"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { SameOriginError, assertSameOrigin } from "@/lib/request-origin";
import { checkLoginLimit, clientIp, registerFailure } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { isSmsConfigured } from "@/lib/sms";
import { normalizeAzMobile } from "@/lib/auth/phone-otp-policy";
import { OTP_PURPOSES, consumePhoneOtp, issuePhoneOtp } from "@/lib/auth/phone-otp";
import { canUsePublicSignIn, safePublicTarget } from "@/lib/auth/public-account-policy";
import { openPublicSession } from "@/lib/auth/public-session";

/**
 * Telefonla giriş (#109). Yalnız kabinetdə **təsdiqlənmiş** nömrəsi olan ictimai hesab
 * daxil ola bilər; nömrə ilə yeni hesab yaranmır. Cavab nömrənin qeydiyyatda olub-olmadığını
 * bildirmir, SMS isə yalnız belə hesab varsa göndərilir (xərc və fırıldaqdan qoruma).
 */

export type PhoneLoginState = { step: "phone" | "code"; phone?: string; error?: string; notice?: string };

async function guard(): Promise<boolean> {
  try {
    await assertSameOrigin();
    return isSmsConfigured();
  } catch (error) {
    if (error instanceof SameOriginError) return false;
    throw error;
  }
}

export async function requestLoginCode(_previous: PhoneLoginState, formData: FormData): Promise<PhoneLoginState> {
  const t = await getTranslations("auth.phoneLogin");
  if (!(await guard())) return { step: "phone", error: t("unavailable") };
  const ip = clientIp(await headers());
  if (!(await checkLoginLimit(ip))) return { step: "phone", error: t("rateLimited") };
  if (!(await verifyTurnstile(formData, "phone_login", ip))) return { step: "phone", error: t("securityCheck") };

  const phone = normalizeAzMobile(String(formData.get("phone") ?? ""));
  if (!phone) return { step: "phone", error: t("invalidPhone") };

  const user = await prisma.user.findUnique({ where: { verifiedPhone: phone }, select: { id: true, accountType: true, isActive: true } });
  if (user && user.isActive && canUsePublicSignIn(user.accountType)) {
    const result = await issuePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, userId: user.id, locale: await getLocale() });
    if (result.decision === "COOLDOWN") return { step: "code", phone, error: t("cooldown") };
    if (result.decision === "LIMIT") return { step: "phone", error: t("tooManyCodes") };
    if (!result.sent) return { step: "phone", error: t("sendFailed") };
  }
  // Hesab olmasa da eyni cavab — nömrənin qeydiyyatda olduğu bilinmir.
  return { step: "code", phone, notice: t("codeSent") };
}

export async function verifyLoginCode(_previous: PhoneLoginState, formData: FormData): Promise<PhoneLoginState> {
  const t = await getTranslations("auth.phoneLogin");
  const locale = await getLocale() as Locale;
  const phone = normalizeAzMobile(String(formData.get("phone") ?? ""));
  if (!(await guard()) || !phone) return { step: "phone", error: t("unavailable") };
  const ip = clientIp(await headers());
  if (!(await checkLoginLimit(ip))) return { step: "code", phone, error: t("rateLimited") };

  const result = await consumePhoneOtp({ phone, purpose: OTP_PURPOSES.LOGIN, code: String(formData.get("code") ?? "") });
  if (!result.ok || !result.userId) {
    await registerFailure(null, phone, ip, "BAD_TOTP");
    return { step: "code", phone, error: result.ok ? t("invalidCode") : result.reason === "expired" ? t("expiredCode") : t("invalidCode") };
  }

  // Kod verildiyi andan bəri nömrə başqa hesaba keçibsə və ya hesab bağlanıbsa giriş yoxdur.
  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { verifiedPhone: true, isActive: true, lockedUntil: true, accountType: true },
  });
  if (!user || user.verifiedPhone !== phone || !user.isActive || (user.lockedUntil && user.lockedUntil > new Date())) {
    return { step: "phone", error: t("unavailable") };
  }
  if (!(await openPublicSession(result.userId))) return { step: "phone", error: t("unavailable") };
  redirect(safePublicTarget(formData.get("davam")) ?? localizePath("/kabinet", locale));
}
