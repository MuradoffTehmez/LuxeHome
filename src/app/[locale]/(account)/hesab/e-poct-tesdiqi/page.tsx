import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { consumeEmailVerificationToken } from "@/lib/auth/account-tokens";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations({ locale, namespace: "auth.accountSecurity" });
  return buildManagedMetadata({ title: t("verificationMetaTitle"), description: t("verificationMetaDescription"), path: "/hesab/e-poct-tesdiqi", noIndex: true, locale });
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("auth.accountSecurity");
  const token = (await searchParams).token ?? "";
  const verified = token ? await consumeEmailVerificationToken(token) : false;
  const Icon = verified ? CheckCircle2 : XCircle;
  return (
    <AuthShell eyebrow={t("eyebrow")} title={verified ? t("verifiedTitle") : t("invalidVerificationTitle")} description={verified ? t("verifiedDescription") : t("invalidVerificationDescription")}>
      <div className="flex flex-col items-center gap-5 text-center">
        <Icon className={`size-12 ${verified ? "text-success" : "text-danger"}`} aria-hidden="true" />
        <ButtonLink href={localizePath(verified ? "/daxil-ol" : "/hesab/e-poct-gonderildi", locale)}>{verified ? t("login") : t("requestAgain")}</ButtonLink>
      </div>
    </AuthShell>
  );
}
