"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { failure, toFieldErrors, unexpected, type ActionState } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { verifyTurnstile } from "@/lib/auth/turnstile";
import { clearPendingTelegramSignup, readPendingTelegramSignup } from "@/lib/auth/telegram-oidc";
import { openPublicSession } from "@/lib/auth/public-session";
import { safePublicTarget } from "@/lib/auth/public-account-policy";
import { sendTelegramSignupEmail } from "@/lib/account-email";
import { systemModeBlock } from "@/lib/admin/guard";
import { completeTelegramSignup, issueTelegramSignup } from "@/lib/telegram-bot/signup";
import { completeSocialSignup } from "@/lib/auth/social-login";

/**
 * Telegram ilə yeni hesab: OIDC callback-indən sonra ad + e-poçt formasıdır. Hesab burada **yaranmır** — e-poçta
 * birdəfəlik link gedir və hesab yalnız ünvan sahibi təsdiq səhifəsində düyməni seçəndə yaranır (`signup.ts`).
 */
export async function startTelegramSignup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await systemModeBlock();
  if (blocked) return blocked;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("auth.telegram");
  const pending = await readPendingTelegramSignup();
  if (!pending) return failure(t("signup.expired"));

  const ip = clientIp(await headers());
  if (!(await checkLoginLimit(ip))) return failure(t("errors.rateLimited"));
  if (!(await verifyTurnstile(formData, "registration", ip))) return failure(t("signup.securityCheck"));

  const schema = z.object({
    firstName: z.string().trim().min(2, t("signup.firstNameRequired")).max(60, t("signup.invalidField")),
    lastName: z.string().trim().min(2, t("signup.lastNameRequired")).max(60, t("signup.invalidField")),
    email: z.string().trim().toLowerCase().pipe(z.email(t("signup.invalidEmail"))),
  });
  const parsed = schema.safeParse({ firstName: form.text(formData, "firstName"), lastName: form.text(formData, "lastName"), email: form.text(formData, "email") });
  if (!parsed.success) return failure(t("signup.invalidForm"), toFieldErrors(parsed.error));

  try {
    const result = await issueTelegramSignup({
      telegramUserId: pending.telegramUserId,
      sub: pending.sub,
      username: pending.username,
      botAccess: pending.botAccess,
      ...parsed.data,
      locale,
      next: pending.next,
    });
    if (!result.ok) {
      return failure(result.reason === "email-taken" ? t("signup.emailTaken") : t("signup.telegramTaken"), result.reason === "email-taken" ? { email: t("signup.emailTaken") } : undefined);
    }
    await sendTelegramSignupEmail(parsed.data.email, result.token, locale);
    await clearPendingTelegramSignup();
  } catch (error) {
    return unexpected("telegram qeydiyyatı başlamadı", error, t("signup.failed"));
  }
  redirect(`${localizePath("/hesab/e-poct-gonderildi", locale)}?telegram=1`);
}

/** Təsdiq səhifəsindəki düymə — token yalnız burada (POST) istifadə olunur. */
export async function confirmTelegramSignup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await systemModeBlock();
  if (blocked) return blocked;
  const t = await getTranslations("auth.telegram");
  if (!(await checkLoginLimit(clientIp(await headers())))) return failure(t("errors.rateLimited"));
  const result = await completeTelegramSignup(form.text(formData, "token"));
  if (!result.ok) {
    return failure(result.reason === "email-taken" ? t("signup.emailTaken") : result.reason === "telegram-taken" ? t("signup.telegramTaken") : result.reason === "failed" ? t("signup.failed") : t("confirm.invalid"));
  }
  if (!(await openPublicSession(result.userId))) return failure(t("signup.failed"));
  const locale = (result.locale === "en" || result.locale === "ru" ? result.locale : "az") as Locale;
  redirect(safePublicTarget(result.next) ?? localizePath("/kabinet/bildirisler", locale));
}

/** Facebook ilə qeydiyyatın e-poçt təsdiqi (təsdiqsiz e-poçtlu provayder) — token yalnız bu POST-da istifadə olunur. */
export async function confirmSocialSignup(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const blocked = await systemModeBlock();
  if (blocked) return blocked;
  const t = await getTranslations("auth.social");
  if (!(await checkLoginLimit(clientIp(await headers())))) return failure(t("errors.rateLimited"));
  const result = await completeSocialSignup(form.text(formData, "token"));
  if (!result.ok) {
    return failure(result.reason === "email-taken" ? t("errors.movcud") : result.reason === "expired" ? t("confirm.invalid") : t("errors.xeta"));
  }
  redirect(result.target);
}
