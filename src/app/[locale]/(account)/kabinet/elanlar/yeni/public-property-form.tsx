"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Mail, Phone, UserRound } from "lucide-react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { Checkbox } from "@/components/ui/field";
import { FormWizard, WizardStep, type WizardLabels } from "@/components/admin/form-wizard";
import { ImageDropzone, type DropzoneImage } from "@/components/admin/image-dropzone";
import { ListingPreview } from "@/components/admin/listing-preview";
import { LocationFields } from "@/components/admin/location-fields";
import { LocationPicker } from "@/components/map/location-picker";
import type { ActionState } from "@/lib/admin/action-state";
import {
  BUILDING_TYPES,
  CURRENCIES,
  CURRENCY_LABELS,
  DOCUMENT_STATUSES,
  FEATURE_GROUPS,
  LISTING_TYPES,
  MAX_PROPERTY_IMAGES,
  PRICE_PERIODS,
  RENOVATIONS,
  type Locale,
} from "@/lib/constants";
import type { PropertyFormOptions } from "@/lib/queries";
import { draftReader, type FormDraft } from "@/lib/ui/form-wizard";
import { localizePath } from "@/i18n/path-locale";

const optionsOf = <T extends Record<string, string>>(
  values: T,
  labels: Record<string, string>,
) => Object.values(values).map((value) => ({ value, label: labels[value] }));

const RENOVATION_KEYS = {
  COSMETIC: "cosmetic",
  RENOVATED: "renovated",
  DESIGNER: "designer",
  UNRENOVATED: "unrenovated",
  NEW_BUILDING: "newBuilding",
} as const;
const DOCUMENT_KEYS = {
  TITLE_DEED: "titleDeed",
  CONTRACT: "contract",
  MUNICIPAL: "municipal",
  DECREE: "decree",
  POWER_OF_ATTORNEY: "powerOfAttorney",
  EXTRACT_COMMERCIAL: "commercialExtract",
} as const;
const FEATURE_GROUP_KEYS = {
  UTILITY: "utility",
  INDOOR: "indoor",
  OUTDOOR: "outdoor",
  SECURITY: "security",
  PAYMENT: "payment",
} as const;

export type PublicPropertyFormInitial = {
  title: string;
  description: string;
  listingType: string;
  currency: string;
  price: number | string;
  pricePeriod: string | null;
  typeId: string;
  cityId: string;
  districtId: string | null;
  address: string | null;
  street?: string | null;
  building?: string | null;
  neighborhoodName?: string | null;
  metroId?: string | null;
  landmarkId?: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  rooms: number | string | null;
  bedrooms: number | string | null;
  bathrooms: number | string | null;
  area: number | string | null;
  landArea: number | string | null;
  floor: number | string | null;
  totalFloors: number | string | null;
  renovation: string | null;
  documentStatus: string | null;
  buildingType: string | null;
  videoUrl: string | null;
  virtualTourUrl?: string | null;
  featureIds: string[];
  images: DropzoneImage[];
};

export type ListingContact = {
  name: string;
  email: string;
  phone: string | null;
};

/** Yadda saxlanmış qaralamadan formanın başlanğıc dəyərləri. */
function initialFromDraft(draft: FormDraft): PublicPropertyFormInitial {
  const read = draftReader(draft.entries);
  const optional = (name: string) => read.get(name) || null;
  return {
    title: read.get("title"),
    description: read.get("description"),
    listingType: read.get("listingType") || LISTING_TYPES.SALE,
    currency: read.get("currency") || CURRENCIES.AZN,
    price: read.get("price"),
    pricePeriod: optional("pricePeriod"),
    typeId: read.get("typeId"),
    cityId: read.get("cityId"),
    districtId: optional("districtId"),
    address: null,
    street: optional("street"),
    building: optional("building"),
    neighborhoodName: optional("neighborhoodName"),
    metroId: optional("metroId"),
    landmarkId: optional("landmarkId"),
    latitude: optional("latitude"),
    longitude: optional("longitude"),
    rooms: optional("rooms"),
    bedrooms: optional("bedrooms"),
    bathrooms: optional("bathrooms"),
    area: optional("area"),
    landArea: optional("landArea"),
    floor: optional("floor"),
    totalFloors: optional("totalFloors"),
    renovation: optional("renovation"),
    documentStatus: optional("documentStatus"),
    buildingType: optional("buildingType"),
    videoUrl: optional("videoUrl"),
    virtualTourUrl: optional("virtualTourUrl"),
    featureIds: read.all("featureIds"),
    images: read.json<DropzoneImage>("images"),
  };
}

/**
 * İstifadəçi üçün elan forması — 8 addımlı sehrbaz.
 *
 * Status və SEO yalnız paneldə idarə olunur; SEO sahələri elan göndəriləndən
 * sonra avtomatik yaradılır. Qaralama bərpa ediləndə forma `key` dəyişərək
 * yeni başlanğıc dəyərlərlə yenidən qurulur — idarə olunmayan sahələrə DOM
 * üzərindən dəyər yazmaq kaskad seçimləri (şəhər → rayon) sındırardı.
 */
export function PublicPropertyForm({
  action,
  options,
  initial: sourceInitial,
  submitLabel,
  contact,
  draftKey,
  editing = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
  initial?: PublicPropertyFormInitial;
  submitLabel?: string;
  contact: ListingContact;
  /** Yalnız yeni elanda verilir — redaktədə qaralama saxlanmır. */
  draftKey?: string;
  editing?: boolean;
}) {
  const [initial, setInitial] = useState(sourceInitial);
  const [version, setVersion] = useState(0);
  const [restoredStep, setRestoredStep] = useState(0);
  return (
    <PublicPropertyWizard
      key={version}
      action={action}
      options={options}
      initial={initial}
      submitLabel={submitLabel}
      contact={contact}
      draftKey={draftKey}
      editing={editing}
      restoredStep={version > 0 ? restoredStep : null}
      onRestore={(draft) => {
        setInitial(initialFromDraft(draft));
        setRestoredStep(draft.step);
        setVersion((value) => value + 1);
      }}
    />
  );
}

function PublicPropertyWizard({
  action,
  options,
  initial,
  submitLabel,
  contact,
  draftKey,
  editing,
  restoredStep,
  onRestore,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
  initial?: PublicPropertyFormInitial;
  submitLabel?: string;
  contact: ListingContact;
  draftKey?: string;
  editing: boolean;
  /** Qaralamadan bərpa olunubsa — həmin addımdan davam edilir. */
  restoredStep: number | null;
  onRestore: (draft: FormDraft) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("account.newProperty");
  const searchT = useTranslations("listings.search");
  const propertyT = useTranslations("property");
  const [listingType, setListingType] = useState<string>(initial?.listingType ?? LISTING_TYPES.SALE);
  const [previewEntries, setPreviewEntries] = useState<Array<[string, string]>>([]);
  const paymentFeatures = options.features.filter((feature) => feature.group === FEATURE_GROUPS.PAYMENT);
  const featureGroups = options.features
    .filter((feature) => feature.group !== FEATURE_GROUPS.PAYMENT)
    .reduce<Record<string, typeof options.features>>((groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    }, {});

  const wizardLabels: WizardLabels = {
    progress: (values) => t("wizard.progress", values),
    stepOf: (values) => t("wizard.stepOf", values),
    back: t("wizard.back"),
    next: t("wizard.next"),
    cancel: t("wizard.cancel"),
    submit: submitLabel ?? t("submit"),
    stepsNav: t("wizard.stepsNav"),
    draftSaved: (time) => t("wizard.draftSaved", { time }),
    draftFound: (time) => t("wizard.draftFound", { time }),
    draftRestore: t("wizard.draftRestore"),
    draftDiscard: t("wizard.draftDiscard"),
  };

  const featureCheckboxes = (features: typeof options.features) => (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <AdminCheckbox
          key={feature.id}
          name="featureIds"
          value={feature.id}
          label={feature.name}
          defaultChecked={initial?.featureIds.includes(feature.id)}
        />
      ))}
    </div>
  );

  return (
    <AdminForm action={action} hideActions>
      <FormWizard
        labels={wizardLabels}
        cancelHref={localizePath("/kabinet/elanlar", locale)}
        draftKey={draftKey}
        allStepsReachable={editing || restoredStep !== null}
        initialStep={restoredStep ?? 0}
        offerDraft={restoredStep === null}
        onRestoreDraft={onRestore}
        onStepChange={(stepId, form) => {
          if (stepId === "on-baxis" && form) {
            setPreviewEntries(
              Array.from(new FormData(form).entries()).flatMap(([name, value]) =>
                typeof value === "string" ? [[name, value] as [string, string]] : [],
              ),
            );
          }
        }}
      >
        <WizardStep id="tip" title={t("steps.type")}>
          <FormSection asFieldset title={t("steps.type")} description={t("steps.typeDescription")}>
            <AdminSelect
              name="listingType"
              label={t("listingType")}
              required
              value={listingType}
              onChange={(event) => setListingType(event.target.value)}
              options={[{ value: LISTING_TYPES.SALE, label: searchT("sale") }, { value: LISTING_TYPES.RENT, label: searchT("rent") }]}
            />
            <AdminSelect
              name="typeId"
              label={t("propertyType")}
              required
              placeholder={t("select")}
              defaultValue={initial?.typeId}
              options={options.types.map((type) => ({ value: type.id, label: type.name }))}
            />
            <AdminSelect
              name="buildingType"
              label={t("building")}
              placeholder={t("notSelected")}
              defaultValue={initial?.buildingType ?? ""}
              options={Object.values(BUILDING_TYPES).map((value) => ({ value, label: propertyT(`building.${value === "NEW" ? "new" : "old"}`) }))}
            />
          </FormSection>
        </WizardStep>

        <WizardStep id="unvan" title={t("steps.location")}>
          <FormSection asFieldset title={t("steps.location")} description={t("steps.locationDescription")}>
            <LocationFields
              cities={options.cities}
              places={options.districts}
              metros={options.metros}
              landmarks={options.landmarks}
              locale={locale}
              labels={{
                region: t("location.region"),
                allRegions: t("location.allRegions"),
                city: t("location.city"),
                urbanDistrict: t("location.urbanDistrict"),
                settlement: t("location.settlement"),
                village: t("location.village"),
                neighborhood: t("location.neighborhood"),
                neighborhoodHint: t("location.neighborhoodHint"),
                street: t("location.street"),
                streetHint: t("location.streetHint"),
                building: t("location.building"),
                buildingHint: t("location.buildingHint"),
                select: t("location.select"),
                notSelected: t("location.notSelected"),
                metro: t("location.metro"),
                landmark: t("location.landmark"),
                landmarkHint: t("location.landmarkHint"),
                streetOfficialHint: t("location.streetOfficialHint"),
              }}
              initial={{
                cityId: initial?.cityId ?? "",
                districtId: initial?.districtId ?? null,
                street: initial?.street,
                building: initial?.building,
                neighborhoodName: initial?.neighborhoodName,
                address: initial?.address,
                metroId: initial?.metroId,
                landmarkId: initial?.landmarkId,
              }}
            />
          </FormSection>

          {/* Koordinat sxemdə və server sxemində onsuz da var idi (`publicPropertySchema`
              `latitude`/`longitude`-u omit etmir) — sadəcə formada sahə yox idi, ona görə
              istifadəçinin öz elanı heç vaxt xəritədə görünmürdü. */}
          <FormSection asFieldset title={t("mapPoint")} description={t("mapPointDescription")}>
            <FullWidth>
              <LocationPicker
                defaultLatitude={initial?.latitude != null && initial.latitude !== "" ? Number(initial.latitude) : null}
                defaultLongitude={initial?.longitude != null && initial.longitude !== "" ? Number(initial.longitude) : null}
                initialQuery={initial?.street ?? initial?.address ?? ""}
                language={locale}
                labels={{
                  latitude: t("latitude"),
                  longitude: t("longitude"),
                  searchLabel: t("mapSearch"),
                  searchPlaceholder: t("mapSearchPlaceholder"),
                  searchAction: t("mapSearchAction"),
                  searching: t("mapSearching"),
                  noResults: t("mapNoResults"),
                  searchError: t("mapSearchError"),
                  useMyLocation: t("mapUseMyLocation"),
                  locationDenied: t("mapLocationDenied"),
                  clear: t("mapClear"),
                  hint: t("mapHint"),
                  providerAttribution: t("mapProviderAttribution"),
                  map: {
                    region: t("mapRegion"),
                    zoomIn: t("mapZoomIn"),
                    zoomOut: t("mapZoomOut"),
                    expand: t("mapExpand"),
                    collapse: t("mapCollapse"),
                    recenter: t("mapRecenter"),
                    scrollHint: t("mapScrollHint"),
                  },
                }}
              />
            </FullWidth>
          </FormSection>
        </WizardStep>

        <WizardStep id="xususiyyetler" title={t("steps.details")}>
          <FormSection asFieldset title={t("main")} description={t("steps.detailsDescription")}>
            <FullWidth>
              <AdminInput
                name="title"
                label={t("titleField")}
                required
                minLength={5}
                maxLength={160}
                hint={t("titleHint")}
                defaultValue={initial?.title}
              />
            </FullWidth>
            <FullWidth>
              <AdminTextarea
                name="description"
                label={t("descriptionField")}
                required
                minLength={20}
                rows={8}
                maxLength={8000}
                hint={t("descriptionHint")}
                defaultValue={initial?.description}
              />
            </FullWidth>
          </FormSection>

          <FormSection asFieldset title={t("planning")}>
            <AdminInput name="rooms" label={t("rooms")} type="number" min={0} defaultValue={initial?.rooms ?? ""} />
            <AdminInput name="bedrooms" label={t("bedrooms")} type="number" min={0} defaultValue={initial?.bedrooms ?? ""} />
            <AdminInput name="bathrooms" label={t("bathrooms")} type="number" min={0} defaultValue={initial?.bathrooms ?? ""} />
            <AdminInput name="area" label={t("area")} type="number" min={0} step="0.01" defaultValue={initial?.area ?? ""} />
            <AdminInput name="landArea" label={t("landArea")} type="number" min={0} step="0.01" defaultValue={initial?.landArea ?? ""} />
            <AdminInput name="floor" label={t("floor")} type="number" min={0} defaultValue={initial?.floor ?? ""} />
            <AdminInput name="totalFloors" label={t("totalFloors")} type="number" min={0} defaultValue={initial?.totalFloors ?? ""} />
          </FormSection>

          <FormSection asFieldset title={t("condition")}>
            <AdminSelect
              name="renovation"
              label={t("renovation")}
              placeholder={t("notSelected")}
              defaultValue={initial?.renovation ?? ""}
              options={Object.values(RENOVATIONS).map((value) => ({ value, label: propertyT(`renovation.${RENOVATION_KEYS[value as keyof typeof RENOVATION_KEYS] ?? "newBuilding"}`) }))}
            />
            <AdminSelect
              name="documentStatus"
              label={t("document")}
              placeholder={t("notSelected")}
              defaultValue={initial?.documentStatus ?? ""}
              options={Object.values(DOCUMENT_STATUSES).map((value) => ({ value, label: propertyT(`document.${DOCUMENT_KEYS[value as keyof typeof DOCUMENT_KEYS] ?? "none"}`) }))}
            />
          </FormSection>

          {Object.keys(featureGroups).length > 0 && (
            <FormSection asFieldset title={t("features")} description={t("featuresDescription")}>
              <FullWidth>
                <div className="flex flex-col gap-4">
                  {Object.entries(featureGroups).map(([group, features]) => (
                    <fieldset key={group} className="flex flex-col gap-1">
                      <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                        {propertyT(`featureGroup.${FEATURE_GROUP_KEYS[group as keyof typeof FEATURE_GROUP_KEYS] ?? "general"}`)}
                      </legend>
                      {featureCheckboxes(features)}
                    </fieldset>
                  ))}
                </div>
              </FullWidth>
            </FormSection>
          )}
        </WizardStep>

        <WizardStep id="qiymet" title={t("steps.price")}>
          <FormSection asFieldset title={t("steps.price")} description={t("steps.priceDescription")}>
            <AdminInput name="price" label={t("price")} required type="number" min={0.01} step="0.01" defaultValue={initial?.price} />
            <AdminSelect
              name="currency"
              label={t("currency")}
              required
              defaultValue={initial?.currency ?? CURRENCIES.AZN}
              options={optionsOf(CURRENCIES, CURRENCY_LABELS)}
            />
            {listingType === LISTING_TYPES.RENT && (
              <AdminSelect
                name="pricePeriod"
                label={t("pricePeriod")}
                required
                defaultValue={initial?.pricePeriod ?? PRICE_PERIODS.MONTH}
                options={[{ value: PRICE_PERIODS.MONTH, label: searchT("monthly") }, { value: PRICE_PERIODS.DAY, label: searchT("daily") }]}
              />
            )}
            {paymentFeatures.length > 0 && (
              <FullWidth>
                <fieldset className="flex flex-col gap-1">
                  <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {propertyT("featureGroup.payment")}
                  </legend>
                  {featureCheckboxes(paymentFeatures)}
                </fieldset>
              </FullWidth>
            )}
          </FormSection>
        </WizardStep>

        <WizardStep id="media" title={t("steps.media")}>
          <FormSection asFieldset title={t("images")} description={t("steps.mediaDescription")}>
            <FullWidth>
              <ImageDropzone
                name="images"
                label={t("gallery")}
                folder="emlaklar"
                uploadUrl="/api/hesab/media"
                maxFiles={MAX_PROPERTY_IMAGES}
                initial={initial?.images}
                hint={t("imageHint", { count: MAX_PROPERTY_IMAGES })}
              />
            </FullWidth>
            <AdminInput name="videoUrl" label={t("video")} type="url" hint={t("videoHint")} defaultValue={initial?.videoUrl ?? ""} />
            <AdminInput name="virtualTourUrl" label={t("virtualTour")} type="url" hint={t("virtualTourHint")} defaultValue={initial?.virtualTourUrl ?? ""} />
          </FormSection>
        </WizardStep>

        <WizardStep id="elaqe" title={t("steps.contact")}>
          <FormSection asFieldset title={t("steps.contact")} description={t("steps.contactDescription")}>
            <FullWidth>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-ivory p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    <UserRound className="size-4" aria-hidden="true" />
                    {t("contact.name")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">{contact.name}</dd>
                </div>
                <div className="rounded-lg border border-line bg-ivory p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    <Phone className="size-4" aria-hidden="true" />
                    {t("contact.phone")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-ink">{contact.phone || "—"}</dd>
                </div>
                <div className="rounded-lg border border-line bg-ivory p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    <Mail className="size-4" aria-hidden="true" />
                    {t("contact.email")}
                  </dt>
                  <dd className="mt-1 text-sm font-medium break-all text-ink">{contact.email}</dd>
                </div>
              </dl>
            </FullWidth>
            <FullWidth>
              {!contact.phone && (
                <p role="note" className="mb-2 rounded-sm border border-warning/30 bg-warning-bg px-3 py-2 text-sm text-ink">
                  {t("contact.phoneMissing")}
                </p>
              )}
              <p className="text-sm text-ink-muted">
                {t("contact.note")}{" "}
                <Link href={localizePath("/kabinet/profil", locale)} className="font-medium text-gold-deep underline-offset-4 hover:underline">
                  {t("contact.editProfile")}
                </Link>
              </p>
            </FullWidth>
          </FormSection>
        </WizardStep>

        <WizardStep id="on-baxis" title={t("steps.preview")}>
          <FormSection asFieldset title={t("steps.preview")} description={t("steps.previewDescription")}>
            <FullWidth>
              <ListingPreview
                entries={previewEntries}
                locale={locale}
                types={options.types}
                cities={options.cities}
                places={options.districts}
                features={options.features}
                labels={{
                  noImage: t("preview.noImage"),
                  noTitle: t("preview.noTitle"),
                  noPrice: t("preview.noPrice"),
                  images: (count) => t("preview.images", { count }),
                  rooms: (count) => t("preview.rooms", { count }),
                  area: (value) => t("preview.area", { value }),
                  floor: (floor) => t("preview.floor", { floor }),
                  description: t("preview.description"),
                  features: t("preview.features"),
                  listingType: (value) => (value === LISTING_TYPES.RENT ? searchT("rent") : searchT("sale")),
                  pricePeriod: (value) => (value === PRICE_PERIODS.DAY ? searchT("daily") : searchT("monthly")),
                }}
              />
            </FullWidth>
          </FormSection>
        </WizardStep>

        <WizardStep id="tesdiq" title={t("steps.confirm")}>
          <FormSection asFieldset title={t("steps.confirm")} description={t("steps.confirmDescription")}>
            <FullWidth>
              <div className="flex flex-col gap-3 text-sm text-ink-soft">
                <p>{t("confirm.checklist")}</p>
                <p>{t("confirm.moderation")}</p>
                <Checkbox name="confirmAccuracy" value="1" required label={t("confirm.accept")} />
              </div>
            </FullWidth>
          </FormSection>
        </WizardStep>
      </FormWizard>
    </AdminForm>
  );
}
