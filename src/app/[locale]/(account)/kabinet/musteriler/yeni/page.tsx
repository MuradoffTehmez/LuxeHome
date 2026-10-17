import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { requireLister } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { getCrmFormOptions } from "@/lib/accounts/crm";
import type { Locale } from "@/lib/constants";
import { ClientForm, EMPTY_CLIENT } from "../client-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.clients" });
  return buildManagedMetadata({ title: t("newTitle"), description: t("metaDescription"), path: "/kabinet/musteriler/yeni", noIndex: true, locale: locale as Locale });
}

/** Yeni müştəri kartı (#226, PRD 9.1, 9.2). */
export default async function NewClientPage() {
  const locale = (await getLocale()) as Locale;
  await requireLister(locale);
  const t = await getTranslations("account.clients");
  const options = await getCrmFormOptions();
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("newTitle")} description={t("newDescription")} />
      <section className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-6">
        <ClientForm options={options} initial={EMPTY_CLIENT} />
      </section>
    </div>
  );
}
