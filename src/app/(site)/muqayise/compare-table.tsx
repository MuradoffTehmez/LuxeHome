"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, GitCompareArrows, X } from "lucide-react";
import { EmptyState } from "@/components/ui/states";
import { ConfirmClearButton } from "@/components/site/confirm-clear-button";
import { cn, formatArea, formatNumber, formatPrice } from "@/lib/utils";
import {
  BUILDING_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  PRICE_PERIOD_LABELS,
  RENOVATION_LABELS,
  type BuildingType,
  type DocumentStatus,
  type PricePeriod,
  type Renovation,
} from "@/lib/constants";
import { useCompareList } from "@/lib/compare";
import { fetchCompareProperties } from "./actions";

export type CompareProperty = Awaited<ReturnType<typeof fetchCompareProperties>>[number];

type Row = {
  label: string;
  render: (property: CompareProperty) => React.ReactNode;
};

const ROWS: Row[] = [
  {
    label: "Qiymət",
    render: (property) =>
      `${formatPrice(property.price, property.currency)}${property.pricePeriod ? ` / ${PRICE_PERIOD_LABELS[property.pricePeriod as PricePeriod]}` : ""}`,
  },
  { label: "Əmlak növü", render: (property) => property.type.name },
  {
    label: "Yerləşmə",
    render: (property) =>
      [property.district?.name, property.city.name].filter(Boolean).join(", "),
  },
  { label: "Otaq sayı", render: (property) => property.rooms ?? "—" },
  { label: "Yataq otağı", render: (property) => property.bedrooms ?? "—" },
  { label: "Hamam", render: (property) => property.bathrooms ?? "—" },
  {
    label: "Sahə",
    render: (property) => (property.area ? formatArea(property.area) : "—"),
  },
  {
    label: "Torpaq sahəsi",
    render: (property) =>
      property.landArea ? `${formatNumber(property.landArea)} sot` : "—",
  },
  {
    label: "Mərtəbə",
    render: (property) =>
      property.floor
        ? `${property.floor}${property.totalFloors ? ` / ${property.totalFloors}` : ""}`
        : "—",
  },
  {
    label: "Tikili növü",
    render: (property) =>
      property.buildingType
        ? BUILDING_TYPE_LABELS[property.buildingType as BuildingType]
        : "—",
  },
  {
    label: "Təmir",
    render: (property) =>
      property.renovation
        ? RENOVATION_LABELS[property.renovation as Renovation]
        : "—",
  },
  {
    label: "Sənəd",
    render: (property) =>
      property.documentStatus
        ? DOCUMENT_STATUS_LABELS[property.documentStatus as DocumentStatus]
        : "—",
  },
  {
    label: "İpoteka",
    render: (property) => (property.mortgageAvailable ? "Uyğundur" : "—"),
  },
  {
    label: "Taksit",
    render: (property) => (property.installmentAvailable ? "Mövcuddur" : "—"),
  },
  {
    label: "Xüsusiyyətlər",
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

type ComparePresentationProps = {
  properties: CompareProperty[];
  sourceCount: number;
  onRemove: (id: string) => void;
  onClear: () => void;
};

/** Yüklənmiş müqayisə datasının breakpoint-ə uyğun iki təqdimatı. */
export function ComparePresentation({
  properties,
  sourceCount,
  onRemove,
  onClear,
}: ComparePresentationProps) {
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? "");
  const selected =
    properties.find((property) => property.id === selectedId) ?? properties[0];

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          {properties.length} əmlak müqayisə edilir
        </p>
        <ConfirmClearButton
          title="Müqayisə siyahısı təmizlənsin?"
          description="Seçdiyiniz bütün əmlaklar müqayisə siyahısından çıxarılacaq."
          onConfirm={onClear}
        />
      </div>

      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Müqayisə edilən əmlaklar"
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
                Müqayisədən çıxar
              </button>
            </div>
          </div>

          <dl className="divide-y divide-line">
            {ROWS.map((row) => (
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
                Əmlak
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
                      Çıxar
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIndex) => (
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
          Bəzi elanlar artıq mövcud deyil və ya arxivə salınıb, ona görə göstərilmir.
        </p>
      ) : null}
    </div>
  );
}

export function CompareTable() {
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
            title="Seçilmiş elanlar artıq əlçatan deyil"
            description="Elanlar silinib və ya arxivə salınıb. Siyahını təmizləyib yeni əmlaklar seçə bilərsiniz."
            action={{ href: "/emlaklar", label: "Yeni əmlak seç" }}
            className="w-full"
          />
          <ConfirmClearButton
            title="Müqayisə siyahısı təmizlənsin?"
            description="Əlçatan olmayan bütün seçimlər siyahıdan çıxarılacaq."
            onConfirm={clear}
          />
        </div>
      );
    }

    return (
      <EmptyState
        icon={<GitCompareArrows className="size-6" aria-hidden="true" />}
        title="Müqayisə siyahınız boşdur"
        description="Əmlak kartlarındakı müqayisə düyməsi ilə elanları buraya əlavə edin."
        action={{ href: "/emlaklar", label: "Əmlaklara bax" }}
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
