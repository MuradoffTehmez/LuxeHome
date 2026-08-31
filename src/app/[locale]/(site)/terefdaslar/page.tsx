import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/ui/pagination";
import { buttonClassName } from "@/components/ui/button";
import { PartnerGrid } from "@/components/site/partner-grid";
import { PartnerTypeFilter } from "@/components/site/partner-type-filter";
import { buildManagedMetadata, breadcrumbSchema, itemListSchema, jsonLd } from "@/lib/seo";
import { getCachedPartnerTypeCounts, getCachedPublicPartners } from "@/lib/public-cache";
import { parsePartnerFilterGroup, partnershipTypesForGroup } from "@/lib/partners";
import type { Locale } from "@/lib/constants";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tip?: string; sehife?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners.list" });

  return buildManagedMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/terefdaslar",
    locale: locale as Locale,
  });
}

export default async function PartnersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const resolvedLocale = locale as Locale;

  const [t, navigationText] = await Promise.all([
    getTranslations({ locale, namespace: "partners" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const group = parsePartnerFilterGroup(query.tip);
  const page = Math.max(1, Number(query.sehife) || 1);

  const [result, counts] = await Promise.all([
    getCachedPublicPartners({ types: partnershipTypesForGroup(group), page }),
    getCachedPartnerTypeCounts(),
  ]);

  const totalPartners = Object.values(counts).reduce((sum, value) => sum + value, 0);
  // Seçilmişlər yalnız filtrsiz ilk səhifədə ayrıca blok kimi göstərilir —
  // filtrlənmiş nəticədə eyni kartın iki dəfə çıxması qarışıqlıq yaradardı.
  const showFeaturedBlock = !group && page === 1;
  const featured = showFeaturedBlock ? result.items.filter((item) => item.featured) : [];
  const rest = showFeaturedBlock
    ? result.items.filter((item) => !item.featured)
    : result.items;

  function buildHref(target: number) {
    const params = new URLSearchParams();
    if (group) params.set("tip", group);
    if (target > 1) params.set("sehife", String(target));
    const search = params.toString();
    return search ? `/terefdaslar?${search}` : "/terefdaslar";
  }

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigationText("home"), path: "/" },
              { name: t("navLabel"), path: "/terefdaslar" },
            ],
            resolvedLocale,
          ),
        )}
      />
      {result.items.length > 0 ? (
        <script
          {...jsonLd(
            itemListSchema(
              result.items.map((partner) => ({
                name: partner.name,
                path: `/terefdaslar/${partner.slug}`,
              })),
              resolvedLocale,
            ),
          )}
        />
      ) : null}

      <PageHeader
        eyebrow={t("list.eyebrow")}
        title={t("list.title")}
        description={t("list.description")}
        breadcrumbs={[
          { label: navigationText("home"), href: "/" },
          { label: t("navLabel") },
        ]}
      />

      <Section tone="ivory" spacing="cozy">
        <Container size="wide">
          <div className="flex flex-col gap-8">
            <p className="max-w-[65ch] text-base leading-7 text-ink-soft">{t("list.intro")}</p>

            <PartnerTypeFilter counts={counts} total={totalPartners} />
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              className="mt-10"
              title={t("list.emptyTitle")}
              description={t("list.emptyDescription")}
            />
          ) : (
            <div className="mt-10 flex flex-col gap-14">
              {featured.length > 0 ? (
                <div className="flex flex-col gap-6">
                  <SectionHeader title={t("list.featuredTitle")} />
                  <PartnerGrid partners={featured} locale={resolvedLocale} />
                </div>
              ) : null}

              {rest.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {featured.length > 0 ? (
                    <SectionHeader title={t("list.allTitle")} />
                  ) : null}
                  <PartnerGrid partners={rest} locale={resolvedLocale} />
                </div>
              ) : null}

              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                buildHref={buildHref}
              />
            </div>
          )}
        </Container>
      </Section>

      <Section tone="beige" spacing="cozy">
        <Container>
          <div className="flex flex-col items-start gap-5 sm:items-center sm:text-center">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">{t("list.ctaTitle")}</h2>
            <p className="max-w-xl text-base leading-relaxed text-ink-soft">
              {t("list.ctaDescription")}
            </p>
            <Link href="/elaqe" className={buttonClassName("primary")}>
              {t("list.ctaAction")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
