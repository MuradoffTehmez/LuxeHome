import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthAside } from "@/components/auth/auth-aside";
import { getOptionalUser } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { RegisterForm } from "./register-form";
import { localizePath } from "@/i18n/path-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.registration" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/qeydiyyat", indexPolicy: "noindex-follow", locale: locale as Locale });
}

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale() as Locale;
  const user = await getOptionalUser();
  if (user) {
    redirect(user.accountType === ACCOUNT_TYPES.STAFF ? "/admin" : localizePath("/kabinet", locale));
  }

  const params = await searchParams;
  const next = typeof params.davam === "string" ? params.davam : undefined;
  const t = await getTranslations("auth.registration");
  const benefits = [t("benefits.type"), t("benefits.secure"), t("benefits.track")];

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      aside={<AuthAside eyebrow={t("asideEyebrow")} title={t("asideTitle")} items={benefits} />}
    >
      <div className="flex flex-col gap-5">
        <GoogleSignIn next={next} placement="before" />
        <RegisterForm next={next} />
      </div>
    </AuthShell>
  );
}
