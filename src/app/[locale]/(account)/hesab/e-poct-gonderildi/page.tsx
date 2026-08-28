import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { VerificationRequestForm } from "../account-security-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.accountSecurity" });
  return buildMetadata({ title: t("verificationSentTitle"), description: t("verificationSentDescription"), path: "/hesab/e-poct-gonderildi", noIndex: true, locale: locale as Locale });
}

export default async function VerificationSentPage() {
  const t = await getTranslations("auth.accountSecurity");
  return <AuthShell eyebrow={t("eyebrow")} title={t("verificationSentTitle")} description={t("verificationSentDescription")}><VerificationRequestForm /></AuthShell>;
}
