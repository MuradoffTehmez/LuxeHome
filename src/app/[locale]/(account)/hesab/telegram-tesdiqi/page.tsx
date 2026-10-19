import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ButtonLink } from "@/components/ui/button";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { peekTelegramSignup } from "@/lib/telegram-bot/signup";
import { TelegramConfirmForm } from "./telegram-confirm-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "auth.telegram.confirm" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/hesab/telegram-tesdiqi", noIndex: true, locale });
}

/**
 * E-poçtdakı link bu səhifəni açır, amma tokeni **istifadə etmir**: poçt skanerləri linki GET ilə açsa da hesab yaranmır.
 * Hesab yalnız düymə (POST) ilə yaranır.
 */
export default async function TelegramConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("auth.telegram.confirm");
  const token = (await searchParams).token ?? "";
  const pending = token ? await peekTelegramSignup(token).catch(() => null) : null;
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
      <TelegramConfirmForm token={token} email={pending.email} />
    </AuthShell>
  );
}
