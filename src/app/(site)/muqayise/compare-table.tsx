"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { GitCompareArrows, X } from "lucide-react";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
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

type Property = Awaited<ReturnType<typeof fetchCompareProperties>>[number];

type Row = {
  label: string;
  render: (property: Property) => React.ReactNode;
};

const ROWS: Row[] = [
  {
    label: "Qiymət",
    render: (p) =>
      `${formatPrice(p.price, p.currency)}${p.pricePeriod ? ` / ${PRICE_PERIOD_LABELS[p.pricePeriod as PricePeriod]}` : ""}`,
  },
  { label: "Əmlak növü", render: (p) => p.type.name },
  { label: "Yerləşmə", render: (p) => [p.district?.name, p.city.name].filter(Boolean).join(", ") },
  { label: "Otaq sayı", render: (p) => p.rooms ?? "—" },
  { label: "Yataq otağı", render: (p) => p.bedrooms ?? "—" },
  { label: "Hamam", render: (p) => p.bathrooms ?? "—" },
  { label: "Sahə", render: (p) => (p.area ? formatArea(p.area) : "—") },
  { label: "Torpaq sahəsi", render: (p) => (p.landArea ? `${formatNumber(p.landArea)} sot` : "—") },
  {
    label: "Mərtəbə",
    render: (p) => (p.floor ? `${p.floor}${p.totalFloors ? ` / ${p.totalFloors}` : ""}` : "—"),
  },
  {
    label: "Tikili növü",
    render: (p) => (p.buildingType ? BUILDING_TYPE_LABELS[p.buildingType as BuildingType] : "—"),
  },
  {
    label: "Təmir",
    render: (p) => (p.renovation ? RENOVATION_LABELS[p.renovation as Renovation] : "—"),
  },
  {
    label: "Sənəd",
    render: (p) => (p.documentStatus ? DOCUMENT_STATUS_LABELS[p.documentStatus as DocumentStatus] : "—"),
  },
  {
    label: "İpoteka",
    render: (p) => (p.mortgageAvailable ? "Uyğundur" : "—"),
  },
  {
    label: "Taksit",
    render: (p) => (p.installmentAvailable ? "Mövcuddur" : "—"),
  },
  {
    label: "Xüsusiyyətlər",
    render: (p) =>
      p.features.length > 0 ? (
        <ul className="flex flex-col gap-1 text-left">
          {p.features.map((f) => (
            <li key={f.feature.name}>{f.feature.name}</li>
          ))}
        </ul>
      ) : (
        "—"
      ),
  },
];

export function CompareTable() {
  const { ids, ready, remove, clear } = useCompareList();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;

    if (ids.length === 0) {
      setProperties([]);
      setLoaded(true);
      return;
    }

    startTransition(async () => {
      const result = await fetchCompareProperties(ids);
      const byId = new Map(result.map((item) => [item.id, item]));
      setProperties(ids.map((id) => byId.get(id)).filter((item): item is Property => Boolean(item)));
      setLoaded(true);
    });
  }, [ids, ready]);

  if (!ready || (!loaded && pending)) {
    return (
      <div className="animate-pulse rounded-sm border border-line bg-beige/50" style={{ height: 420 }} />
    );
  }

  if (properties.length === 0) {
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">{properties.length} əmlak müqayisə edilir</p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Siyahını təmizlə
        </Button>
      </div>

      <div className="overflow-x-auto rounded-sm border border-line">
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
                      onClick={() => remove(property.id)}
                      className="inline-flex w-fit items-center gap-1 text-xs text-ink-muted hover:text-danger"
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
            {ROWS.map((row, index) => (
              <tr
                key={row.label}
                className={cn("border-b border-line last:border-0", index % 2 === 1 && "bg-beige/40")}
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

      {properties.length < ids.length && (
        <p className="text-sm text-ink-muted">
          Bəzi elanlar artıq mövcud deyil və ya arxivə salınıb, ona görə göstərilmir.
        </p>
      )}
    </div>
  );
}
