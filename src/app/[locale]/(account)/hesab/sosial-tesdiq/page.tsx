import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { peekSocialSignup } from "@/lib/auth/social-login";
import { SocialConfirmForm } from "./social-confirm-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "auth.social.confirm" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/hesab/sosial-tesdiq", noIndex: true, locale });
}

/** Facebook ilə qeydiyyatın təsdiqi. GET tokeni istifadə etmir (poçt skanerləri), hesab yalnız düymə ilə yaranır. */
export default async function SocialConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("auth.social.confirm");
  const token = (await searchParams).token ?? "";
  const pending = token ? await peekSocialSignup(token).catch(() => null) : null;
  if (!pending) {
    return (
      <AuthShell eyebrow={t("eyebrow")} title={t("invalidTitle")} description={t("invalid")}>
        <div className="flex flex-col items-center gap-5 text-center">
          <XCircle className="size-12 text-danger" aria-hidden="true" />
          <ButtonLink href={localizePath("/daxil-ol", locale)}>{t("backToLogin")}</ButtonLink>
        </div>
      </AuthShell>
    );
  }
  return (
    <AuthShell eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <SocialConfirmForm token={token} email={pending.email} />
    </AuthShell>
  );
}
