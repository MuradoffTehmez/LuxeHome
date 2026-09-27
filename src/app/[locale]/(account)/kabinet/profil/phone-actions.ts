"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { clientIp } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { isSmsConfigured } from "@/lib/sms";
import { formatPhone } from "@/lib/utils";
import { normalizeAzMobile } from "@/lib/auth/phone-otp-policy";
import { OTP_PURPOSES, consumePhoneOtp, issuePhoneOtp } from "@/lib/auth/phone-otp";

/**
 * Nömrənin SMS kodu ilə təsdiqi (#109) — telefonla girişin ilkin şərti. Təsdiq kodu
 * yalnız həmin hesab üçün etibarlıdır; eyni nömrəni iki hesab təsdiqləyə bilmir.
 */

export type PhoneVerifyState = { step: "phone" | "code"; phone?: string; error?: string; success?: string };

async function account(locale: Locale) {
  try {
    return await requirePublicAction("preferences", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return null;
    throw error;
  }
}

export async function requestPhoneVerification(_previous: PhoneVerifyState, formData: FormData): Promise<PhoneVerifyState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.phoneVerification");
  const user = await account(locale);
  if (!user || !isSmsConfigured()) return { step: "phone", error: t("unavailable") };
  const ip = clientIp(await headers());
  if (!(await verifyTurnstile(formData, "phone_verify", ip))) return { step: "phone", error: t("securityCheck") };

  const phone = normalizeAzMobile(String(formData.get("phone") ?? ""));
  if (!phone) return { step: "phone", error: t("invalidPhone") };
  const owner = await prisma.user.findUnique({ where: { verifiedPhone: phone }, select: { id: true } });
  if (owner && owner.id !== user.id) return { step: "phone", error: t("taken") };

  const result = await issuePhoneOtp({ phone, purpose: OTP_PURPOSES.VERIFY, userId: user.id, locale });
  if (result.decision === "COOLDOWN") return { step: "code", phone, error: t("cooldown") };
  if (result.decision === "LIMIT") return { step: "phone", error: t("tooManyCodes") };
  if (!result.sent) return { step: "phone", error: t("sendFailed") };
  return { step: "code", phone };
}

export async function confirmPhoneVerification(_previous: PhoneVerifyState, formData: FormData): Promise<PhoneVerifyState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.phoneVerification");
  const user = await account(locale);
  const phone = normalizeAzMobile(String(formData.get("phone") ?? ""));
  if (!user || !phone || !isSmsConfigured()) return { step: "phone", error: t("unavailable") };

  const result = await consumePhoneOtp({ phone, purpose: OTP_PURPOSES.VERIFY, code: String(formData.get("code") ?? "") });
  // Kod başqa hesab üçün verilibsə qəbul olunmur.
  if (!result.ok || result.userId !== user.id) {
    return { step: "code", phone, error: result.ok ? t("invalidCode") : result.reason === "expired" ? t("expiredCode") : t("invalidCode") };
  }
  try {
    await prisma.user.update({ where: { id: user.id }, data: { verifiedPhone: phone, phone: formatPhone(phone) } });
  } catch {
    // Unikal açar: nömrəni bu arada başqa hesab təsdiqləyib.
    return { step: "phone", error: t("taken") };
  }
  revalidatePath(localizePath("/kabinet/profil", locale));
  return { step: "phone", success: t("verified") };
}

export async function removeVerifiedPhone(): Promise<PhoneVerifyState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.phoneVerification");
  const user = await account(locale);
  if (!user) return { step: "phone", error: t("unavailable") };
  await prisma.user.update({ where: { id: user.id }, data: { verifiedPhone: null } });
  revalidatePath(localizePath("/kabinet/profil", locale));
  return { step: "phone", success: t("removed") };
}
