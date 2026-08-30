import type { Metadata } from "next";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm } from "@/components/admin/form-shell";
import { requireAdminRead } from "@/lib/admin/guard";
import { NEARBY_PLACE_CATEGORY_LABELS, PERMISSIONS, PREMIUM_DURATIONS_DAYS, PROPERTY_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { activatePremiumListing, createNearbyPlace, upsertNeighborhoodProfile } from "./actions";

export const metadata: Metadata = { title: "İctimai imkanlar" };
export const dynamic = "force-dynamic";
const inputClass = "mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

export default async function PublicFeaturesAdminPage() {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [properties, locations] = await Promise.all([
    prisma.property.findMany({ where: { deletedAt: null, status: { in: [PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED] } }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.location.findMany({ where: { kind: { in: ["DISTRICT", "SETTLEMENT"] } }, select: { id: true, name: true, parent: { select: { name: true } } }, orderBy: { name: "asc" } }),
  ]);
  return <>
    <AdminPageHeader title="İctimai imkanlar" description="Premium müddətlər, yaxın obyektlər və mənbəli rayon analitikası." breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "İctimai imkanlar" }]} />
    <div className="grid gap-6 xl:grid-cols-2">
      <AdminCard title="Premium elan" description="Yalnız uyğun nəticələr daxilində sıralama üstünlüyü verir."><AdminForm action={activatePremiumListing} submitLabel="Premium aktiv et" className="gap-4"><label className="text-sm text-ink-soft">Elan<select className={inputClass} name="propertyId" required><option value="">Seçin</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label><label className="text-sm text-ink-soft">Müddət<select className={inputClass} name="durationDays">{PREMIUM_DURATIONS_DAYS.map((days) => <option key={days} value={days}>{days} gün</option>)}</select></label></AdminForm></AdminCard>
      <AdminCard title="Yaxın obyekt"><AdminForm action={createNearbyPlace} submitLabel="Obyekti əlavə et" className="gap-4"><label className="text-sm text-ink-soft">Elan<select className={inputClass} name="propertyId" required><option value="">Seçin</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label><label className="text-sm text-ink-soft">Kateqoriya<select className={inputClass} name="category">{Object.entries(NEARBY_PLACE_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm text-ink-soft">Ad<input className={inputClass} name="name" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-ink-soft">Məsafə (metr)<input className={inputClass} name="distanceMeters" type="number" min="0" /></label><label className="text-sm text-ink-soft">Piyada (dəqiqə)<input className={inputClass} name="walkingMinutes" type="number" min="0" /></label></div><label className="text-sm text-ink-soft">Mənbə<input className={inputClass} name="source" /></label></AdminForm></AdminCard>
    </div>
    <AdminCard title="Rayon analitikası" description="Göstərici yoxdursa ictimai səhifədə uydurulmur." className="mt-6"><AdminForm action={upsertNeighborhoodProfile} submitLabel="Analitikanı yadda saxla" className="gap-4"><label className="text-sm text-ink-soft">Rayon / qəsəbə<select className={inputClass} name="locationId" required><option value="">Seçin</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.parent?.name ? `${location.parent.name} · ` : ""}{location.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["averagePrice","Orta qiymət"],["averagePricePerSqm","m² qiyməti"],["annualChangePercent","İllik dəyişiklik %"],["averageRent","Orta icarə"],["rentalYieldPercent","İcarə gəlirliliyi %"]].map(([name,label]) => <label key={name} className="text-sm text-ink-soft">{label}<input className={inputClass} name={name} type="number" step="0.01" /></label>)}</div><div className="grid gap-4 lg:grid-cols-3"><label className="text-sm text-ink-soft">AZ təsvir<textarea className={`${inputClass} min-h-28 py-2`} name="description" /></label><label className="text-sm text-ink-soft">EN təsvir<textarea className={`${inputClass} min-h-28 py-2`} name="descriptionEn" /></label><label className="text-sm text-ink-soft">RU təsvir<textarea className={`${inputClass} min-h-28 py-2`} name="descriptionRu" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-ink-soft">Mənbə<input className={inputClass} name="dataSource" /></label><label className="text-sm text-ink-soft">Məlumat tarixi<input className={inputClass} name="measuredAt" type="date" /></label></div></AdminForm></AdminCard>
  </>;
}
