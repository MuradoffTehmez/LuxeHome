import { getTranslations } from "next-intl/server";
import {
  BedDouble,
  Bath,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileCheck,
  Hash,
  Layers,
  Maximize,
  Ruler,
  TrainFront,
  Landmark,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/constants";

// Tərcümə açarları birləşmə tipidir — `t()` şablon sətrini yalnız belə qəbul edir.
const RENOVATION_KEYS: Record<string, "cosmetic" | "renovated" | "designer" | "unrenovated" | "newBuilding"> = {
  COSMETIC: "cosmetic",
  RENOVATED: "renovated",
  DESIGNER: "designer",
  UNRENOVATED: "unrenovated",
  NEW_BUILDING: "newBuilding",
};

const DOCUMENT_KEYS: Record<string, "titleDeed" | "contract" | "municipal" | "decree" | "powerOfAttorney" | "commercialExtract" | "none"> = {
  TITLE_DEED: "titleDeed",
  CONTRACT: "contract",
  MUNICIPAL: "municipal",
  DECREE: "decree",
  POWER_OF_ATTORNEY: "powerOfAttorney",
  COMMERCIAL_EXTRACT: "commercialExtract",
  NONE: "none",
};

export type PropertyKeyFactsData = {
  id: string;
  price: number;
  currency: string;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  landArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  renovation: string | null;
  documentStatus: string | null;
  buildingType: string | null;
  mortgageAvailable: boolean;
  installmentAvailable: boolean;
  viewCount: number;
  publishedAt: Date | null;
  metro: { name: string } | null;
};

type Fact = { key: string; icon: LucideIcon; label: string; value: string };

/**
 * D1-də `DateTime` sadəcə mətn sütunudur — köhnə və ya kənardan idxal edilmiş
 * qeyd oxunmayan dəyər daşıya bilər. `Intl` belə dəyərdə `RangeError` atır və
 * bir sətir bütün elan səhifəsini çökdürərdi; ona görə tarix susqun buraxılır.
 */
function formatDate(value: Date | null, locale: Locale): string | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(time);
}

/**
 * Elanın rəqəmlə ifadə olunan bütün göstəriciləri.
 *
 * **Niyə kart şəbəkəsi, `gap-px` deyil.** Əvvəlki blok `gap-px` + fon rəngi ilə
 * cədvəl xətti çəkirdi: sıra dolmayanda qalan xanalar bir parça boz sahə kimi
 * görünürdü (5 element 4 sütunda → 3 boş xana). İndi hər göstərici öz sərhədi
 * olan kartdır, ona görə natamam sıra sadəcə boşluq qoyur.
 *
 * Göstəricilərin sayı da artırılıb: m²-yə düşən qiymət, yataq/sanitar, tikili
 * növü, metro, elan kodu, dərc tarixi və baxış sayı sxemdə onsuz da var idi,
 * sadəcə səhifədə göstərilmirdi.
 */
export async function PropertyKeyFacts({
  property,
  locale,
}: {
  property: PropertyKeyFactsData;
  locale: Locale;
}) {
  const [content, propertyText] = await Promise.all([
    getTranslations({ locale, namespace: "content.propertyDetail" }),
    getTranslations({ locale, namespace: "property" }),
  ]);

  const facts: Fact[] = [];
  const push = (key: string, icon: LucideIcon, label: string, value: string | null | undefined) => {
    if (value) facts.push({ key, icon, label, value });
  };

  push("rooms", BedDouble, content("rooms"), property.rooms != null ? String(property.rooms) : null);
  push(
    "area",
    Maximize,
    content("area"),
    property.area != null ? propertyText("area", { value: property.area }) : null,
  );
  push(
    "landArea",
    Ruler,
    content("landArea"),
    property.landArea != null ? propertyText("landUnit", { value: property.landArea }) : null,
  );
  push(
    "floor",
    Layers,
    content("floor"),
    property.floor != null && property.totalFloors != null
      ? `${property.floor} / ${property.totalFloors}`
      : property.floor != null
        ? String(property.floor)
        : null,
  );
  push(
    "bedrooms",
    BedDouble,
    content("bedrooms"),
    property.bedrooms != null ? String(property.bedrooms) : null,
  );
  push(
    "bathrooms",
    Bath,
    content("bathrooms"),
    property.bathrooms != null ? String(property.bathrooms) : null,
  );
  push(
    "pricePerSqm",
    Wallet,
    content("pricePerSqm"),
    // Torpaq elanlarında sahə `landArea`-dadır və sot ilə ölçülür — m² qiyməti
    // yalnız bina sahəsi olanda mənalıdır.
    property.area != null && property.area > 0
      ? `${formatPrice(Math.round(property.price / property.area), property.currency)}/m²`
      : null,
  );
  push(
    "renovation",
    CheckCircle2,
    content("renovation"),
    property.renovation ? propertyText(`renovation.${RENOVATION_KEYS[property.renovation] ?? "renovated"}`) : null,
  );
  push(
    "documentStatus",
    FileCheck,
    content("document"),
    property.documentStatus
      ? propertyText(`document.${DOCUMENT_KEYS[property.documentStatus] ?? "none"}`)
      : null,
  );
  push(
    "buildingType",
    Building2,
    content("buildingType"),
    property.buildingType === "NEW"
      ? propertyText("building.new")
      : property.buildingType === "OLD"
        ? propertyText("building.old")
        : null,
  );
  push("metro", TrainFront, content("metroNearby"), property.metro?.name ?? null);
  push("publishedAt", CalendarDays, content("publishedAt"), formatDate(property.publishedAt, locale));
  push("views", Eye, content("views"), property.viewCount > 0 ? String(property.viewCount) : null);
  // Elan kodu — dəstəklə danışarkən istifadəçinin oxuya biləcəyi qısa istinad.
  push("code", Hash, content("listingCode"), property.id.slice(-6).toUpperCase());

  const badges = [
    property.mortgageAvailable && { key: "mortgage", label: content("mortgage") },
    property.installmentAvailable && { key: "installment", label: content("installment") },
  ].filter((item): item is { key: string; label: string } => Boolean(item));

  if (facts.length === 0 && badges.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl text-ink">{content("keyFacts")}</h2>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {facts.map((fact) => (
          <div
            key={fact.key}
            className="flex flex-col gap-1.5 rounded-xs border border-line bg-paper p-4"
          >
            <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase">
              <fact.icon className="size-4 shrink-0" aria-hidden="true" />
              {fact.label}
            </dt>
            <dd className="tabular font-medium text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {badges.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <li
              key={badge.key}
              className="inline-flex items-center gap-2 rounded-xs border border-success/30 bg-success-bg px-3 py-2 text-sm font-medium text-success"
            >
              <Landmark className="size-4" aria-hidden="true" />
              {badge.label} — {content("eligible")}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
