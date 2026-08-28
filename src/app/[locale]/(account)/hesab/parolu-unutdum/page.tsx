import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { ForgotPasswordForm } from "../account-security-forms";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.accountSecurity" });
  return buildMetadata({ title: t("forgotTitle"), description: t("forgotDescription"), path: "/hesab/parolu-unutdum", noIndex: true, locale: locale as Locale });
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.accountSecurity");
  return <AuthShell eyebrow={t("eyebrow")} title={t("forgotTitle")} description={t("forgotDescription")}><ForgotPasswordForm /></AuthShell>;
}
