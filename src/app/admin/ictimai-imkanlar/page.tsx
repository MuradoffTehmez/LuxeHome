import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminForm } from "@/components/admin/form-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import {
  NEARBY_PLACE_CATEGORY_LABELS,
  PERMISSIONS,
  PREMIUM_DURATIONS_DAYS,
  PROPERTY_STATUSES,
  type NearbyPlaceCategory,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  activatePremiumListing,
  cancelPremiumListing,
  createNearbyPlace,
  deleteNearbyPlace,
  deleteNeighborhoodProfile,
} from "./actions";
import { NeighborhoodEditor, type NeighborhoodProfileValues } from "./neighborhood-editor";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getAdminT } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "İctimai imkanlar" };
export const dynamic = "force-dynamic";
const inputClass = "mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

/** `number | null` → forma sahəsinin gözlədiyi sətir. */
function numberField(value: number | null): string {
  return value == null ? "" : String(value);
}

export default async function PublicFeaturesAdminPage() {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [properties, locations, nearbyPlaces, neighborhoodProfiles, premiumProperties] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null, status: { in: [PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED] } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.location.findMany({
      where: { kind: { in: ["DISTRICT", "SETTLEMENT"] } },
      select: { id: true, name: true, parent: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.nearbyPlace.findMany({
      include: { property: { select: { title: true, slug: true } } },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    }),
    prisma.neighborhoodProfile.findMany({
      include: { location: { select: { name: true, slug: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.property.findMany({
      where: { isFeatured: true, deletedAt: null },
      select: { id: true, title: true, slug: true, featuredUntil: true },
      orderBy: [{ featuredUntil: "asc" }],
    }),
  ]);

  const profileValues: Record<string, Omit<NeighborhoodProfileValues, "locationId">> = Object.fromEntries(
    neighborhoodProfiles.map((profile) => [
      profile.locationId,
      {
        averagePrice: numberField(profile.averagePrice),
        medianPrice: numberField(profile.medianPrice),
        averagePricePerSqm: numberField(profile.averagePricePerSqm),
        annualChangePercent: numberField(profile.annualChangePercent),
        saleRentRatio: numberField(profile.saleRentRatio),
        averageRent: numberField(profile.averageRent),
        rentalYieldPercent: numberField(profile.rentalYieldPercent),
        description: profile.description ?? "",
        descriptionEn: profile.descriptionEn ?? "",
        descriptionRu: profile.descriptionRu ?? "",
        dataSource: profile.dataSource ?? "",
        measuredAt: profile.measuredAt ? profile.measuredAt.toISOString().slice(0, 10) : "",
      },
    ]),
  );

  return (
    <>
      <AdminPageHeader
        title="İctimai imkanlar"
        description="Premium müddətlər, yaxın obyektlər və mənbəli rayon analitikası."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "İctimai imkanlar" }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Premium elan" description="Yalnız uyğun nəticələr daxilində sıralama üstünlüyü verir.">
          <AdminForm action={activatePremiumListing} submitLabel="Premium aktiv et" className="gap-4">
            <label className="text-sm text-ink-soft">Elan<select className={inputClass} name="propertyId" required><option value="">Seçin</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
            <label className="text-sm text-ink-soft">Müddət<select className={inputClass} name="durationDays">{PREMIUM_DURATIONS_DAYS.map((days) => <option key={days} value={days}>{days} gün</option>)}</select></label>
          </AdminForm>
        </AdminCard>

        <AdminCard title="Yaxın obyekt">
          <AdminForm action={createNearbyPlace} submitLabel="Obyekti əlavə et" className="gap-4">
            <label className="text-sm text-ink-soft">Elan<select className={inputClass} name="propertyId" required><option value="">Seçin</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
            <label className="text-sm text-ink-soft">Kateqoriya<select className={inputClass} name="category">{Object.entries(NEARBY_PLACE_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm text-ink-soft">Ad<input className={inputClass} name="name" required /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-ink-soft">Məsafə (metr)<input className={inputClass} name="distanceMeters" type="number" min="0" /></label>
              <label className="text-sm text-ink-soft">Piyada (dəqiqə)<input className={inputClass} name="walkingMinutes" type="number" min="0" /></label>
            </div>
            <label className="text-sm text-ink-soft">Mənbə<input className={inputClass} name="source" /></label>
          </AdminForm>
        </AdminCard>
      </div>

      <AdminCard title="Aktiv premium elanlar" description="Müddət bitəndə gündəlik iş statusu avtomatik söndürür." className="mt-6" bodyClassName="p-0">
        {premiumProperties.length === 0 ? (
          <div className="p-5"><EmptyState title="Aktiv premium elan yoxdur" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {premiumProperties.map((property) => {
              const expired = property.featuredUntil != null && property.featuredUntil.getTime() < Date.now();
              return (
                <li key={property.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{property.title}</p>
                      {expired ? <Badge tone="warning">Müddəti bitib</Badge> : <Badge tone="gold">Premium</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {property.featuredUntil ? `Bitmə tarixi: ${formatDate(property.featuredUntil)}` : "Müddətsiz"}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <ConfirmAction action={cancelPremiumListing} id={property.id} label="Premium statusu dayandır" title="Premium dayandırılsın?" description="Elan adi sıralamaya qayıdacaq." confirmLabel="Dayandır"><Trash2 className="size-4" /></ConfirmAction>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Yaxın obyektlər" description="Əmlak səhifəsində göstərilən mənbəli siyahı." className="mt-6" bodyClassName="p-0">
        {nearbyPlaces.length === 0 ? (
          <div className="p-5"><EmptyState title="Yaxın obyekt əlavə edilməyib" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {nearbyPlaces.map((place) => (
              <li key={place.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{place.name}</p>
                    <Badge tone="neutral">{t(`labels.nearbyPlaceCategory.${place.category as NearbyPlaceCategory}`) ?? place.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {place.property.title}
                    {place.distanceMeters != null ? ` · ${place.distanceMeters} m` : ""}
                    {place.walkingMinutes != null ? ` · ${place.walkingMinutes} dəq piyada` : ""}
                    {place.source ? ` · ${place.source}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <ConfirmAction action={deleteNearbyPlace} id={place.id} label="Obyekti sil" title="Yaxın obyekt silinsin?" description="Obyekt əmlak səhifəsindən dərhal götürüləcək." confirmLabel="Sil"><Trash2 className="size-4" /></ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title="Rayon analitikası" description="Rayon seçiləndə saxlanmış göstəricilər forma sahələrinə yüklənir. Göstərici yoxdursa ictimai səhifədə uydurulmur." className="mt-6">
        <NeighborhoodEditor
          locations={locations.map((location) => ({
            id: location.id,
            label: `${location.parent?.name ? `${location.parent.name} · ` : ""}${location.name}`,
          }))}
          profiles={profileValues}
        />
      </AdminCard>

      <AdminCard title="Saxlanmış rayon analitikası" className="mt-6" bodyClassName="p-0">
        {neighborhoodProfiles.length === 0 ? (
          <div className="p-5"><EmptyState title="Rayon analitikası yoxdur" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {neighborhoodProfiles.map((profile) => (
              <li key={profile.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{profile.location.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {profile.dataSource ? `Mənbə: ${profile.dataSource}` : "Mənbə qeyd edilməyib"}
                    {profile.measuredAt ? ` · ${formatDate(profile.measuredAt)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={localizePath(`/rayon/${profile.location.slug}`, locale)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center px-3 text-sm text-ink-soft transition-colors hover:text-gold-deep"
                  >
                    Saytda bax
                  </Link>
                  <ConfirmAction action={deleteNeighborhoodProfile} id={profile.id} label="Analitikanı sil" title="Rayon analitikası silinsin?" description="Rayon səhifəsindəki analitika bölməsi göstərilməyəcək." confirmLabel="Sil"><Trash2 className="size-4" /></ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
