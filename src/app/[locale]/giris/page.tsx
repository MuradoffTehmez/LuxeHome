import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.staffLogin" });
  return { title: t("metaTitle"), description: t("metaDescription"), robots: { index: false, follow: false } };
}

// Giriş marşrutu `?davam=` parametrini oxuyur — statik render mümkün deyil
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ davam?: string }>;
}) {
  const { davam } = await searchParams;
  const t = await getTranslations("auth.staffLogin");

  return (
    <AuthShell
      standalone
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      aside={
        <div className="on-dark relative min-h-[34rem] overflow-hidden rounded-md">
          <Image
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80"
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/60 to-charcoal/35" />
          <div className="relative flex min-h-[34rem] flex-col justify-end p-10 xl:p-14">
            <p className="max-w-md font-display text-3xl leading-tight text-white xl:text-4xl">
              {t("asideTitle")}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
              {t("asideDescription")}
            </p>
          </div>
        </div>
      }
    >
          <Link
            href="/"
            className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xs text-sm text-ink-soft transition-colors duration-200 hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("back")}
          </Link>

          <LoginForm davam={davam} />

          <div className="mt-8 flex items-start gap-2.5 rounded-xs border border-line bg-beige px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-soft">
              {t("security")}
            </p>
          </div>

          <p className="mt-7 text-xs text-ink-muted [overflow-wrap:anywhere]">
            © {new Date().getFullYear()} {siteConfig.legalName}. {t("owner", { owner: siteConfig.owner.name })}
          </p>
    </AuthShell>
  );
}
