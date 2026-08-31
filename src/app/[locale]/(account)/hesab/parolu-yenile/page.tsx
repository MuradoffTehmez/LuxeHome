import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { ResetPasswordForm } from "../account-security-forms";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations({ locale, namespace: "auth.accountSecurity" });
  return buildManagedMetadata({ title: t("resetTitle"), description: t("resetDescription"), path: "/hesab/parolu-yenile", noIndex: true, locale });
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const t = await getTranslations("auth.accountSecurity");
  const token = (await searchParams).token ?? "";
  return (
    <AuthShell eyebrow={t("eyebrow")} title={t("resetTitle")} description={t("resetDescription")}>
      {token ? <ResetPasswordForm token={token} /> : <div className="flex flex-col gap-4"><p className="text-sm text-danger">{t("resetTokenMissing")}</p><ButtonLink href="/hesab/parolu-unutdum">{t("requestAgain")}</ButtonLink></div>}
    </AuthShell>
  );
}
