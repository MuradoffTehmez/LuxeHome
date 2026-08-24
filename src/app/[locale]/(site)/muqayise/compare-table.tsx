"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Building2, GitCompareArrows, X } from "lucide-react";
import { EmptyState } from "@/components/ui/states";
import { ConfirmClearButton } from "@/components/site/confirm-clear-button";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { useCompareList } from "@/lib/compare";
import { fetchCompareProperties } from "./actions";
import { localizeKnownContent } from "@/i18n/dynamic-content";
import type { Locale } from "@/lib/constants";

export type CompareProperty = Awaited<ReturnType<typeof fetchCompareProperties>>[number];

type Row = {
  label: string;
  render: (property: CompareProperty) => React.ReactNode;
};

const RENOVATION_KEYS = { COSMETIC: "cosmetic", RENOVATED: "renovated", DESIGNER: "designer", UNRENOVATED: "unrenovated", NEW_BUILDING: "newBuilding" } as const;
const DOCUMENT_KEYS = { TITLE_DEED: "titleDeed", CONTRACT: "contract", MUNICIPAL: "municipal", DECREE: "decree", POWER_OF_ATTORNEY: "powerOfAttorney", EXTRACT_COMMERCIAL: "commercialExtract", NONE: "none" } as const;
const BUILDING_KEYS = { NEW: "new", OLD: "old" } as const;

function useCompareRows(): Row[] {
  const t = useTranslations("property.compareTable");
  const propertyT = useTranslations("property");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  const price = (property: CompareProperty) => {
    const currency = property.currency === "AZN" ? "₼" : property.currency;
    const period = property.pricePeriod === "MONTH" ? propertyT("pricePeriod.month") : property.pricePeriod === "DAY" ? propertyT("pricePeriod.day") : "";
    return `${number(property.price)} ${currency}${period ? ` ${period}` : ""}`;
  };

  return [
  {
    label: t("price"), render: price,
  },
  { label: t("propertyType"), render: (property) => property.type.name },
  {
    label: t("location"),
    render: (property) =>
      [property.district?.name, property.city.name].filter(Boolean).join(", "),
  },
  { label: t("rooms"), render: (property) => property.rooms ?? "—" },
  { label: t("bedrooms"), render: (property) => property.bedrooms ?? "—" },
  { label: t("bathrooms"), render: (property) => property.bathrooms ?? "—" },
  {
    label: t("area"), render: (property) => (property.area ? propertyT("area", { value: property.area }) : "—"),
  },
  {
    label: t("landArea"), render: (property) => property.landArea ? propertyT("landUnit", { value: property.landArea }) : "—",
  },
  {
    label: t("floor"),
    render: (property) =>
      property.floor
        ? `${property.floor}${property.totalFloors ? ` / ${property.totalFloors}` : ""}`
        : "—",
  },
  {
    label: t("building"),
    render: (property) =>
      property.buildingType
        ? propertyT(`building.${BUILDING_KEYS[property.buildingType as keyof typeof BUILDING_KEYS]}`)
        : "—",
  },
  {
    label: t("renovation"),
    render: (property) =>
      property.renovation
        ? propertyT(`renovation.${RENOVATION_KEYS[property.renovation as keyof typeof RENOVATION_KEYS]}`)
        : "—",
  },
  {
    label: t("document"),
    render: (property) =>
      property.documentStatus
        ? propertyT(`document.${DOCUMENT_KEYS[property.documentStatus as keyof typeof DOCUMENT_KEYS]}`)
        : "—",
  },
  {
    label: t("mortgage"), render: (property) => (property.mortgageAvailable ? t("eligible") : "—"),
  },
  {
    label: t("installment"), render: (property) => (property.installmentAvailable ? t("available") : "—"),
  },
  {
    label: t("features"),
    render: (property) =>
      property.features.length > 0 ? (
        <ul className="flex flex-col gap-1 text-left">
          {property.features.map((item) => (
            <li key={item.feature.name}>{item.feature.name}</li>
          ))}
        </ul>
      ) : (
        "—"
      ),
  },
  ];
}

type ComparePresentationProps = {
  properties: CompareProperty[];
  sourceCount: number;
  onRemove: (id: string) => void;
  onClear: () => void;
};

/** Yüklənmiş müqayisə datasının breakpoint-ə uyğun iki təqdimatı. */
export function ComparePresentation({
  properties: sourceProperties,
  sourceCount,
  onRemove,
  onClear,
}: ComparePresentationProps) {
  const locale = useLocale() as Locale;
  const properties = sourceProperties.map((sourceProperty) => {
    const property = localizeKnownContent("property", sourceProperty, locale);
    return {
      ...property,
      type: localizeKnownContent("propertyType", property.type, locale),
      features: property.features.map((item) => ({
        ...item,
        feature: localizeKnownContent("feature", item.feature, locale),
      })),
    };
  });
  const t = useTranslations("property.compareTable");
  const compareT = useTranslations("property.compare");
  const rows = useCompareRows();
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? "");
  const selected =
    properties.find((property) => property.id === selectedId) ?? properties[0];

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          {t("count", { count: properties.length })}
        </p>
        <ConfirmClearButton
          title={compareT("clearTitle")}
          description={compareT("clearDescription")}
          onConfirm={onClear}
        />
      </div>

      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label={t("tabs")}
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {properties.map((property) => (
            <button
              key={property.id}
              type="button"
              role="tab"
              aria-selected={property.id === selected.id}
              onClick={() => setSelectedId(property.id)}
              className={cn(
                "min-h-11 max-w-44 shrink-0 snap-start truncate rounded-xs border px-3 text-sm font-medium transition-colors",
                property.id === selected.id
                  ? "border-gold bg-gold/10 text-ink"
                  : "border-line-strong bg-paper text-ink-soft",
              )}
            >
              {property.title}
            </button>
          ))}
        </div>

        <article className="overflow-hidden rounded-sm border border-line bg-paper">
          <div className="grid grid-cols-[6rem_1fr] gap-4 border-b border-line p-4">
            <div className="relative aspect-4/3 overflow-hidden rounded-xs bg-beige">
              {selected.images[0] ? (
                <Image
                  src={selected.images[0].url}
                  alt={selected.images[0].alt || selected.title}
                  fill
                  unoptimized={isUnoptimizedImage(selected.images[0].url)}
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-ink-muted">
                  <Building2 className="size-6" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-2">
              <Link
                href={`/emlaklar/${selected.slug}`}
                className="font-display text-lg leading-snug text-ink hover:text-gold-deep"
              >
                {selected.title}
              </Link>
              <button
                type="button"
                onClick={() => onRemove(selected.id)}
                className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-danger"
              >
                <X className="size-4" aria-hidden="true" />
                {t("remove")}
              </button>
            </div>
          </div>

          <dl className="divide-y divide-line">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-1 px-4 py-3">
                <dt className="text-xs font-medium text-ink-muted">{row.label}</dt>
                <dd className="text-sm text-ink">{row.render(selected)}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <div className="hidden overflow-x-auto rounded-sm border border-line lg:block">
        <table className="w-full min-w-160 border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-beige">
              <th className="w-40 shrink-0 px-4 py-3 text-left text-xs font-medium tracking-wide text-ink-muted uppercase">
                {t("property")}
              </th>
              {properties.map((property) => (
                <th key={property.id} className="min-w-52 px-4 py-3 text-left align-top">
                  <div className="flex flex-col gap-2">
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xs bg-ivory">
                      {property.images[0] ? (
                        <Image
                          src={property.images[0].url}
                          alt={property.images[0].alt || property.title}
                          fill
                          unoptimized={isUnoptimizedImage(property.images[0].url)}
                          sizes="240px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <Link
                      href={`/emlaklar/${property.slug}`}
                      className="line-clamp-2 font-display text-sm leading-snug text-ink hover:text-gold-deep"
                    >
                      {property.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(property.id)}
                      className="inline-flex min-h-11 w-fit items-center gap-1 text-xs text-ink-muted hover:text-danger"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      {t("removeShort")}
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.label}
                className={cn(
                  "border-b border-line last:border-0",
                  rowIndex % 2 === 1 && "bg-beige/40",
                )}
              >
                <th className="w-40 shrink-0 px-4 py-3 text-left text-xs font-medium text-ink-muted">
                  {row.label}
                </th>
                {properties.map((property) => (
                  <td key={property.id} className="px-4 py-3 align-top text-ink">
                    {row.render(property)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {properties.length < sourceCount ? (
        <p role="status" className="text-sm text-ink-muted">
          {t("missingNotice")}
        </p>
      ) : null}
    </div>
  );
}

export function CompareTable() {
  const t = useTranslations("property.compareTable");
  const compareT = useTranslations("property.compare");
  const { ids, ready, remove, clear } = useCompareList();
  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;

    if (ids.length === 0) {
      setProperties([]);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    startTransition(async () => {
      const result = await fetchCompareProperties(ids);
      const byId = new Map(result.map((item) => [item.id, item]));
      setProperties(
        ids.map((id) => byId.get(id)).filter((item): item is CompareProperty => Boolean(item)),
      );
      setLoaded(true);
    });
  }, [ids, ready]);

  if (!ready || (!loaded && pending)) {
    return (
      <div
        className="animate-pulse rounded-sm border border-line bg-beige/50"
        style={{ height: 420 }}
      />
    );
  }

  if (properties.length === 0) {
    if (ids.length > 0) {
      return (
        <div className="flex flex-col items-center gap-4">
          <EmptyState
            icon={<GitCompareArrows className="size-6" aria-hidden="true" />}
            title={t("unavailableTitle")}
            description={t("unavailableDescription")}
            action={{ href: "/emlaklar", label: t("chooseNew") }}
            className="w-full"
          />
          <ConfirmClearButton
            title={compareT("clearTitle")}
            description={t("unavailableClear")}
            onConfirm={clear}
          />
        </div>
      );
    }

    return (
      <EmptyState
        icon={<GitCompareArrows className="size-6" aria-hidden="true" />}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={{ href: "/emlaklar", label: t("view") }}
      />
    );
  }

  return (
    <ComparePresentation
      properties={properties}
      sourceCount={ids.length}
      onRemove={remove}
      onClear={clear}
    />
  );
}
