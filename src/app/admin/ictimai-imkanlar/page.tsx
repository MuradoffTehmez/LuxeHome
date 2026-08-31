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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.amenities.ictimaiImkanlar") };
}
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
        title={t("pages.amenities.ictimaiImkanlar")}
        description={t("pages.amenities.premiumMuddetlerYaxinObyektler")}
        breadcrumbs={[{ label: t("pages.amenities.idarePaneli"), href: "/admin" }, { label: t("pages.amenities.ictimaiImkanlar") }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title={t("pages.amenities.premiumElan")} description={t("pages.amenities.yalnizUygunNeticelerDaxilinde")}>
          <AdminForm action={activatePremiumListing} submitLabel={t("pages.amenities.premiumAktivEt")} className="gap-4">
            <label className="text-sm text-ink-soft">{t("pages.amenities.elan")}<select className={inputClass} name="propertyId" required><option value="">{t("pages.amenities.secin")}</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
            <label className="text-sm text-ink-soft">{t("pages.amenities.muddet")}<select className={inputClass} name="durationDays">{PREMIUM_DURATIONS_DAYS.map((days) => <option key={days} value={days}>{days} gün</option>)}</select></label>
          </AdminForm>
        </AdminCard>

        <AdminCard title={t("pages.amenities.yaxinObyekt")}>
          <AdminForm action={createNearbyPlace} submitLabel={t("pages.amenities.obyektiElaveEt")} className="gap-4">
            <label className="text-sm text-ink-soft">{t("pages.amenities.elan")}<select className={inputClass} name="propertyId" required><option value="">{t("pages.amenities.secin")}</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
            <label className="text-sm text-ink-soft">{t("pages.amenities.kateqoriya")}<select className={inputClass} name="category">{Object.entries(NEARBY_PLACE_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm text-ink-soft">{t("pages.amenities.ad")}<input className={inputClass} name="name" required /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-ink-soft">{t("pages.amenities.mesafeMetr")}<input className={inputClass} name="distanceMeters" type="number" min="0" /></label>
              <label className="text-sm text-ink-soft">{t("pages.amenities.piyadaDeqiqe")}<input className={inputClass} name="walkingMinutes" type="number" min="0" /></label>
            </div>
            <label className="text-sm text-ink-soft">{t("pages.amenities.menbe")}<input className={inputClass} name="source" /></label>
          </AdminForm>
        </AdminCard>
      </div>

      <AdminCard title={t("pages.amenities.aktivPremiumElanlar")} description={t("pages.amenities.muddetBitendeGundelikIs")} className="mt-6" bodyClassName="p-0">
        {premiumProperties.length === 0 ? (
          <div className="p-5"><EmptyState title={t("pages.amenities.aktivPremiumElanYoxdur")} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {premiumProperties.map((property) => {
              const expired = property.featuredUntil != null && property.featuredUntil.getTime() < Date.now();
              return (
                <li key={property.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{property.title}</p>
                      {expired ? <Badge tone="warning">{t("pages.amenities.muddetiBitib")}</Badge> : <Badge tone="gold">{t("pages.amenities.premium")}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {property.featuredUntil ? `Bitmə tarixi: ${formatDate(property.featuredUntil)}` : "Müddətsiz"}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <ConfirmAction action={cancelPremiumListing} id={property.id} label={t("pages.amenities.premiumStatusuDayandir")} title={t("pages.amenities.premiumDayandirilsin")} description={t("pages.amenities.elanAdiSiralamayaQayidacaq")} confirmLabel={t("pages.amenities.dayandir")}><Trash2 className="size-4" /></ConfirmAction>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.amenities.yaxinObyektler")} description={t("pages.amenities.emlakSehifesindeGosterilenMenbeli")} className="mt-6" bodyClassName="p-0">
        {nearbyPlaces.length === 0 ? (
          <div className="p-5"><EmptyState title={t("pages.amenities.yaxinObyektElaveEdilmeyib")} /></div>
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
                  <ConfirmAction action={deleteNearbyPlace} id={place.id} label={t("pages.amenities.obyektiSil")} title={t("pages.amenities.yaxinObyektSilinsin")} description={t("pages.amenities.obyektEmlakSehifesindenDerhal")} confirmLabel={t("pages.amenities.sil")}><Trash2 className="size-4" /></ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={t("pages.amenities.rayonAnalitikasi")} description={t("pages.amenities.rayonSecilendeSaxlanmisGostericiler")} className="mt-6">
        <NeighborhoodEditor
          locations={locations.map((location) => ({
            id: location.id,
            label: `${location.parent?.name ? `${location.parent.name} · ` : ""}${location.name}`,
          }))}
          profiles={profileValues}
        />
      </AdminCard>

      <AdminCard title={t("pages.amenities.saxlanmisRayonAnalitikasi")} className="mt-6" bodyClassName="p-0">
        {neighborhoodProfiles.length === 0 ? (
          <div className="p-5"><EmptyState title={t("pages.amenities.rayonAnalitikasiYoxdur")} /></div>
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
                    {t("pages.amenities.saytdaBax")}
                  </Link>
                  <ConfirmAction action={deleteNeighborhoodProfile} id={profile.id} label={t("pages.amenities.analitikaniSil")} title={t("pages.amenities.rayonAnalitikasiSilinsin")} description={t("pages.amenities.rayonSehifesindekiAnalitikaBolmesi")} confirmLabel={t("pages.amenities.sil")}><Trash2 className="size-4" /></ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
