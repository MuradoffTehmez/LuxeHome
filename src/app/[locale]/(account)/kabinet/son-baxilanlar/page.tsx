import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { requireAccount } from "@/lib/auth/guard";
import type { Locale } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { RecentlyViewedList } from "./recently-viewed-list";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.recentlyViewed" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/son-baxilanlar", noIndex: true, locale: locale as Locale });
}

export default async function RecentlyViewedPage() {
  const locale = (await getLocale()) as Locale;
  await requireAccount(locale);
  const t = await getTranslations("account.recentlyViewed");

  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <div className="mt-8">
        <RecentlyViewedList />
      </div>
    </div>
  );
}
