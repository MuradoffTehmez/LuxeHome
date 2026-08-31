import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { buildManagedMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { VerificationRequestForm } from "../account-security-forms";
import { AnalyticsEventBeacon } from "@/components/analytics/analytics-event";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.accountSecurity" });
  return buildManagedMetadata({ title: t("verificationSentTitle"), description: t("verificationSentDescription"), path: "/hesab/e-poct-gonderildi", noIndex: true, locale: locale as Locale });
}

export default async function VerificationSentPage({ searchParams }: { searchParams: Promise<{ yeni?: string }> }) {
  const t = await getTranslations("auth.accountSecurity");
  const { yeni } = await searchParams;
  return <><AuthShell eyebrow={t("eyebrow")} title={t("verificationSentTitle")} description={t("verificationSentDescription")}><VerificationRequestForm /></AuthShell>{yeni === "1" && <AnalyticsEventBeacon event="register" payload={{ status: "success" }} />}</>;
}
