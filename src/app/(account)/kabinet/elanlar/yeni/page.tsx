import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { getPropertyFormOptions } from "@/lib/queries";
import { requireLister } from "@/lib/auth/guard";
import { buildMetadata } from "@/lib/seo";
import { createPublicProperty } from "./actions";
import { PublicPropertyForm } from "./public-property-form";
import { AnalyticsEventBeacon } from "@/components/analytics/analytics-event";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import type { Locale } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.newProperty" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/elanlar/yeni", noIndex: true, locale: locale as Locale });
}

export default async function NewPropertyPage() {
  await requireLister();
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account.newProperty");
  const sourceOptions = await getPropertyFormOptions();
  const options = {
    ...sourceOptions,
    types: sourceOptions.types.map((item) => localizeKnownContent("propertyType", item, locale)),
    cities: sourceOptions.cities.map((item) => localizeLocation(item, locale)),
    districts: sourceOptions.districts.map((item) => localizeLocation(item, locale)),
    metros: sourceOptions.metros.map((item) => localizeLocation(item, locale)),
    features: sourceOptions.features.map((item) => localizeKnownContent("feature", item, locale)),
  };

  return (
      <div className="min-w-0">
        <AnalyticsEventBeacon event="submission_start" payload={{ content_type: "property" }} />
        <PageHeader
          contained
          compact
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <div className="mt-8">
        <PublicPropertyForm action={createPublicProperty} options={options} />
        </div>
      </div>
  );
}
