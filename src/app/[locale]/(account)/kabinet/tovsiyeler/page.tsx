import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Power } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PropertyCard } from "@/components/site/property-card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import type { Locale } from "@/lib/constants";
import { getPersonalizedRecommendations } from "@/lib/phase2";
import { buildMetadata } from "@/lib/seo";
import { toggleRecommendations } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations({ locale, namespace: "phase2.recommendations" });
  return buildMetadata({ title: t("title"), description: t("description"), path: "/kabinet/tovsiyeler", noIndex: true, locale });
}

export default async function RecommendationsPage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  const t = await getTranslations("phase2.recommendations");
  const result = await getPersonalizedRecommendations(user.id);
  return (
    <div className="min-w-0">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={result.disabled ? t("disabled") : t("description")} />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ButtonLink href="/mene-emlak-tap" size="sm">{t("wizard")}</ButtonLink>
        <ConfirmAction action={toggleRecommendations} id="preference" label="Tövsiyə seçimini dəyiş" title={result.disabled ? "Tövsiyələr aktiv edilsin?" : "Tövsiyələr söndürülsün?"} description="Bu seçim fərdi tövsiyə mühərrikini idarə edir." confirmLabel={result.disabled ? "Aktiv et" : "Söndür"} tone="neutral" className="w-auto px-4">
          <Power className="mr-2 size-4" aria-hidden="true" />{result.disabled ? "Aktiv et" : "Söndür"}
        </ConfirmAction>
      </div>
      <div className="mt-8">
        {result.items.length === 0 ? <EmptyState title={result.disabled ? t("disabled") : t("empty")} action={{ label: t("wizard"), href: "/mene-emlak-tap" }} /> : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{result.items.map((property) => <PropertyCard key={property.id} property={property} />)}</div>
        )}
      </div>
    </div>
  );
}
