import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { getOptionalUser } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
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
      aside={
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
            {t("asideEyebrow")}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink">
            {t("asideTitle")}
          </h2>
          <ul className="mt-7 flex flex-col gap-4 text-sm text-ink-soft">
            {benefits.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
