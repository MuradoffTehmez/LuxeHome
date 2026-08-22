import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireLister } from "@/lib/auth/guard";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_TONE,
  type PropertyStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

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

  return (
      <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gold-deep">Kabinet</p>
            <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Elanlarım</h1>
          </div>
          <Link
            href="/kabinet/elanlar/yeni"
            className="inline-flex min-h-11 items-center gap-2 rounded-xs bg-gold px-4 text-sm font-medium text-ink transition-colors hover:bg-gold-soft"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yeni elan
          </Link>
        </div>

        {params.yeni === "1" && (
          <p role="status" className="mt-6 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success">
            Elanınız göndərildi. Statusu aşağıdakı siyahıdan izləyə bilərsiniz.
          </p>
        )}

        {properties.length === 0 ? (
          <div className="mt-8 rounded-md border border-line bg-paper p-6 text-ink-soft">
            Hələ elan göndərməmisiniz. İlk elanınızı yaratmaq üçün «Yeni elan» düyməsindən istifadə edin.
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-line rounded-md border border-line bg-paper">
            {properties.map((property) => {
              const status = property.status as PropertyStatus;
              return (
                <li key={property.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
                  <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xs bg-beige text-xs text-ink-muted">
                    {property.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- kabinet siyahısında sabit, daxili URL
                      <img src={property.images[0].url} alt="" className="size-full object-cover" />
                    ) : (
                      "Şəkil yoxdur"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{property.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {new Intl.NumberFormat("az-AZ").format(property.price)} {property.currency}
                    </p>
                  </div>
                  <Badge tone={PROPERTY_STATUS_TONE[status] ?? "neutral"}>
                    {PROPERTY_STATUS_LABELS[status] ?? status}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </>
  );
}
