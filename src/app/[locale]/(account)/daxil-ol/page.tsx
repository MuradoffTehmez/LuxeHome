import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthAside } from "@/components/auth/auth-aside";
import { buildManagedMetadata } from "@/lib/seo";
import { getOptionalUser } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { LoginForm } from "./login-form";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { PhoneLogin } from "./phone-login";
import { isSmsConfigured } from "@/lib/sms";
import { localizePath } from "@/i18n/path-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.publicLogin" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/daxil-ol", indexPolicy: "noindex-follow", locale: locale as Locale });
}

// Sessiya D1-dən oxunur — statik render mümkün deyil
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale() as Locale;
  const user = await getOptionalUser();
  // Əməkdaş hesabı bura düşməməlidir — onun yeri paneldir
  if (user) {
    redirect(user.accountType === ACCOUNT_TYPES.STAFF ? "/admin" : localizePath("/kabinet", locale));
  }

  const params = await searchParams;
  const next = typeof params.davam === "string" ? params.davam : undefined;
  const t = await getTranslations("auth.publicLogin");
  const benefits = [t("benefits.favorites"), t("benefits.requests"), t("benefits.listings")];

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      aside={<AuthAside eyebrow={t("asideEyebrow")} title={t("asideTitle")} items={benefits} />}
    >
      <div className="flex flex-col gap-5">
        <LoginForm next={next} />
        <GoogleSignIn next={next} error={typeof params.google === "string" ? params.google : undefined} />
        {isSmsConfigured() ? <PhoneLogin next={next} /> : null}
      </div>
    </AuthShell>
  );
}
