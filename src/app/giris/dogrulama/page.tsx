import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { readStageCookie, verifyStageToken } from "@/lib/auth/cookies";
import { VerifyForm } from "./verify-form";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "auth.verification" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

// Ara-cookie yalnız sorğu kontekstində oxunur
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const token = await readStageCookie();
  const claims = token ? await verifyStageToken(token) : null;
  if (!claims || claims.stage !== "totp") redirect("/giris");
  const t = await getTranslations("auth.verification");

  return (
    <AuthShell
      standalone
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      aside={
        <div className="mx-auto max-w-md rounded-md border border-line bg-paper/70 p-8">
          <ShieldCheck className="size-10 text-gold-deep" aria-hidden="true" />
          <h2 className="mt-5 font-display text-3xl text-ink">{t("asideTitle")}</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            {t("asideDescription")}
          </p>
        </div>
      }
    >
      <VerifyForm />
    </AuthShell>
  );
}
