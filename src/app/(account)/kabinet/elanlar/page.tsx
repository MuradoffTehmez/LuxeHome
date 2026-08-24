import type { Metadata } from "next";
import Image from "next/image";
import { Plus } from "lucide-react";
import { AdaptiveDataList } from "@/components/ui/adaptive-data-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireLister } from "@/lib/auth/guard";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_TONE,
  type PropertyStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { formatPrice, isUnoptimizedImage } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Elanlarım",
  description: "Luxe Home Estate kabinetinizdəki elanlar.",
  path: "/kabinet/elanlar",
  noIndex: true,
});

export default async function CabinetPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ yeni?: string }>;
}) {
  const user = await requireLister();
  const [properties, params] = await Promise.all([
    prisma.property.findMany({
      where: { authorId: user.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        status: true,
        images: { select: { url: true }, where: { isCover: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    searchParams,
  ]);

  type CabinetProperty = (typeof properties)[number];

  function propertyStatus(property: CabinetProperty) {
    return property.status as PropertyStatus;
  }

  function PropertyThumbnail({ property }: { property: CabinetProperty }) {
    return (
      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xs bg-beige text-center text-[0.65rem] leading-tight text-ink-muted">
        {property.images[0]?.url ? (
          <Image
            src={property.images[0].url}
            alt=""
            fill
            unoptimized={isUnoptimizedImage(property.images[0].url)}
            sizes="64px"
            className="object-cover"
          />
        ) : (
          "Şəkil yoxdur"
        )}
      </div>
    );
  }

  function renderPropertyCard(property: CabinetProperty) {
    const status = propertyStatus(property);
    return (
      <article className="min-w-0 rounded-md border border-line bg-paper p-4 shadow-sm">
        <div className="flex min-w-0 items-start gap-3">
          <PropertyThumbnail property={property} />
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-ink [overflow-wrap:anywhere]">{property.title}</h2>
            <p className="mt-2 text-sm font-medium text-ink-soft tabular-nums">
              {formatPrice(property.price, property.currency)}
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <Badge tone={PROPERTY_STATUS_TONE[status] ?? "neutral"}>
            {PROPERTY_STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
      </article>
    );
  }

  function renderPropertyList(items: readonly CabinetProperty[]) {
    return (
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-paper">
        {items.map((property) => {
          const status = propertyStatus(property);
          return (
            <li key={property.id} className="flex min-w-0 items-center gap-4 p-5">
              <PropertyThumbnail property={property} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{property.title}</p>
                <p className="mt-1 text-sm text-ink-soft tabular-nums">
                  {formatPrice(property.price, property.currency)}
                </p>
              </div>
              <Badge tone={PROPERTY_STATUS_TONE[status] ?? "neutral"}>
                {PROPERTY_STATUS_LABELS[status] ?? status}
              </Badge>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="min-w-0">
        <PageHeader
          contained
          compact
          eyebrow="Kabinet"
          title="Elanlarım"
          description={`${properties.length} elan`}
          actions={
            <ButtonLink href="/kabinet/elanlar/yeni" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Yeni elan
            </ButtonLink>
          }
        />

        {params.yeni === "1" && (
          <p role="status" className="mt-6 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success">
            Elanınız göndərildi. Statusu aşağıdakı siyahıdan izləyə bilərsiniz.
          </p>
        )}

        <div className="mt-8">
          <AdaptiveDataList
            items={properties}
            getKey={(property) => property.id}
            renderCard={renderPropertyCard}
            renderTable={renderPropertyList}
            empty={
              <EmptyState
                title="Hələ elan göndərməmisiniz"
                description="İlk elanınızı yaratdıqdan sonra statusunu bu səhifədən izləyə bilərsiniz."
                action={{ label: "Yeni elan yarat", href: "/kabinet/elanlar/yeni" }}
              />
            }
          />
        </div>
    </div>
  );
}
