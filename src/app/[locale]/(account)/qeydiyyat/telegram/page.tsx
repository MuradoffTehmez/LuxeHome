import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth/guard";
import { readPendingTelegramSignup } from "@/lib/auth/telegram-oidc";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { localizePath } from "@/i18n/path-locale";
import { TelegramSignupForm } from "./telegram-signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.telegram.signup" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("description"), path: "/qeydiyyat/telegram", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

/** Telegram ilə ilk giriş: təsdiqlənmiş Telegram kimliyi imzalı cookie-dədir, burada ad və e-poçt istənilir. */
export default async function TelegramSignupPage() {
  const locale = (await getLocale()) as Locale;
  const user = await getOptionalUser();
  if (user) redirect(user.accountType === ACCOUNT_TYPES.STAFF ? "/admin" : localizePath("/kabinet", locale));
  const t = await getTranslations("auth.telegram.signup");
  const pending = await readPendingTelegramSignup();
  if (!pending) {
    return (
      <AuthShell eyebrow={t("eyebrow")} title={t("expiredTitle")} description={t("expired")}>
        <ButtonLink href={localizePath("/daxil-ol", locale)}>{t("backToLogin")}</ButtonLink>
      </AuthShell>
    );
  }
  const [firstName = "", ...rest] = (pending.name ?? "").split(/\s+/);
  return (
    <AuthShell eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <TelegramSignupForm defaults={{ firstName, lastName: rest.join(" ") }} username={pending.username} />
    </AuthShell>
  );
}
