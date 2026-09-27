"use client";

import { useState } from "react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { FormWizard, WizardStep, type WizardLabels } from "@/components/admin/form-wizard";
import { ImageDropzone, type DropzoneImage } from "@/components/admin/image-dropzone";
import { ListingPreview } from "@/components/admin/listing-preview";
import { LocationFields } from "@/components/admin/location-fields";
import { AdminLocationPicker } from "@/components/admin/location-picker-field";
import { SeoFields } from "@/components/admin/seo-fields";
import {
  BUILDING_TYPE_LABELS,
  BUILDING_TYPES,
  CURRENCIES,
  CURRENCY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUSES,
  FEATURE_GROUPS,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  PRICE_PERIOD_LABELS,
  PRICE_PERIODS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUSES,
  RENOVATION_LABELS,
  RENOVATIONS,
  type FeatureGroup,
  type Locale,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { PropertyFormOptions } from "@/lib/queries";
import { draftReader, type FormDraft } from "@/lib/ui/form-wizard";
import { EMPTY_PROPERTY, type PropertyFormValues } from "./form-values";
import { useLocale, useTranslations } from "next-intl";

/**
 * Əmlak elanının forması.
 *
 * Yaratma və redaktə eyni komponentdir: fərq yalnız `action` və `initial` propundadır.
 * İki ayrı forma saxlanılsaydı, yeni sahə əlavə edəndə birini yeniləməyi unutmaq
 * qaçılmaz olardı.
 */

const optionsOf = <T extends Record<string, string>>(
  values: T,
  labels: Record<string, string>,
) => Object.values(values).map((value) => ({ value, label: labels[value] }));

/** Qaralamadan (FormData girişləri) forma dəyərləri. */
function valuesFromDraft(draft: FormDraft, base: PropertyFormValues): PropertyFormValues {
  const read = draftReader(draft.entries);
  const values = { ...EMPTY_PROPERTY, id: base.id };
  for (const key of Object.keys(EMPTY_PROPERTY) as Array<keyof PropertyFormValues>) {
    const current = EMPTY_PROPERTY[key];
    if (typeof current === "string" && read.has(key)) (values as Record<string, unknown>)[key] = read.get(key);
    if (typeof current === "boolean") (values as Record<string, unknown>)[key] = read.get(key) === "on";
  }
  values.featureIds = read.all("featureIds");
  values.images = read.json<DropzoneImage>("images");
  values.floorPlans = read.json<DropzoneImage>("floorPlans");
  return values;
}

type PropertyFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
  initial: PropertyFormValues;
  submitLabel: string;
  extraActions?: React.ReactNode;
};

/**
 * Qaralama bərpa ediləndə forma yeni başlanğıc dəyərlərlə yenidən qurulur (`key`).
 * Yalnız yeni elanda qaralama saxlanılır — redaktədə bazadakı qeyd əsasdır.
 */
export function PropertyForm(props: PropertyFormProps) {
  const [restored, setRestored] = useState<{ values: PropertyFormValues; step: number } | null>(null);
  return (
    <PropertyWizard
      key={restored ? "restored" : "initial"}
      {...props}
      initial={restored?.values ?? props.initial}
      restoredStep={restored?.step ?? null}
      onRestore={(draft) => setRestored({ values: valuesFromDraft(draft, props.initial), step: draft.step })}
    />
  );
}

function PropertyWizard({
  action,
  options,
  initial,
  submitLabel,
  extraActions,
  restoredStep,
  onRestore,
}: PropertyFormProps & { restoredStep: number | null; onRestore: (draft: FormDraft) => void }) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const [previewEntries, setPreviewEntries] = useState<Array<[string, string]>>([]);
  const [listingType, setListingType] = useState(initial.listingType);
  const [cityId, setCityId] = useState(initial.cityId || options.cities[0]?.id || "");
  const [typeId, setTypeId] = useState(initial.typeId);
  const [districtId, setDistrictId] = useState(initial.districtId);
  const editing = Boolean(initial.id);
  const [rooms, setRooms] = useState(initial.rooms);
  const [uploadReference] = useState(() => initial.id ? `LHE${initial.id.slice(-8)}` : `LHE${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`);

  const metros = options.metros.filter((metro) => metro.parentId === cityId);

  const paymentFeatures = options.features.filter((feature) => feature.group === FEATURE_GROUPS.PAYMENT);
  const featureGroups = options.features
    .filter((feature) => feature.group !== FEATURE_GROUPS.PAYMENT)
    .reduce<Record<string, typeof options.features>>((groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    }, {});

  const wizardLabels: WizardLabels = {
    progress: (values) => t("components.wizard.progress", values),
    stepOf: (values) => t("components.wizard.stepOf", values),
    back: t("components.wizard.back"),
    next: t("components.wizard.next"),
    cancel: t("components.wizard.cancel"),
    submit: submitLabel,
    stepsNav: t("components.wizard.stepsNav"),
    draftSaved: (time) => t("components.wizard.draftSaved", { time }),
    draftFound: (time) => t("components.wizard.draftFound", { time }),
    draftRestore: t("components.wizard.draftRestore"),
    draftDiscard: t("components.wizard.draftDiscard"),
  };

  const featureCheckboxes = (features: typeof options.features) => (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <AdminCheckbox
          key={feature.id}
          name="featureIds"
          value={feature.id}
          label={feature.name}
          defaultChecked={initial.featureIds.includes(feature.id)}
        />
      ))}
    </div>
  );

  const locationLabels = {
    region: t("components.location.region"),
    allRegions: t("components.location.allRegions"),
    city: t("components.location.city"),
    urbanDistrict: t("components.location.urbanDistrict"),
    settlement: t("components.location.settlement"),
    village: t("components.location.village"),
    neighborhood: t("components.location.neighborhood"),
    neighborhoodHint: t("components.location.neighborhoodHint"),
    street: t("components.location.street"),
    streetHint: t("components.location.streetHint"),
    building: t("components.location.building"),
    buildingHint: t("components.location.buildingHint"),
    select: t("components.location.select"),
    notSelected: t("components.location.notSelected"),
  };

  return (
    <AdminForm action={action} hideActions>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormWizard
        labels={wizardLabels}
        cancelHref="/admin/emlaklar"
        extraActions={extraActions}
        draftKey={editing ? undefined : "lhe:admin-property-draft"}
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
        <WizardStep id="tip" title={t("pages.properties.steps.type")}>
          <FormSection title={t("pages.properties.steps.type")} description={t("pages.properties.steps.typeDescription")}>
            <AdminSelect
              name="listingType"
              label={t("pages.properties.elanNovu")}
              required
              value={listingType}
              onChange={(event) => setListingType(event.target.value)}
              options={optionsOf(LISTING_TYPES, LISTING_TYPE_LABELS)}
            />
            <AdminSelect
              name="typeId"
              label={t("pages.properties.emlakNovu")}
              required
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              placeholder={t("pages.properties.secin")}
              options={options.types.map((type) => ({ value: type.id, label: type.name }))}
            />
            <AdminSelect
              name="buildingType"
              label={t("pages.properties.tikiliNovu")}
              defaultValue={initial.buildingType}
              placeholder={t("pages.properties.secilmeyib")}
              options={optionsOf(BUILDING_TYPES, BUILDING_TYPE_LABELS)}
            />
            <AdminSelect
              name="projectId"
              label={t("pages.properties.layihe")}
              defaultValue={initial.projectId}
              placeholder={t("pages.properties.layiheyeAidDeyil")}
              options={options.projects.map((project) => ({ value: project.id, label: project.name }))}
            />
          </FormSection>
        </WizardStep>

        <WizardStep id="unvan" title={t("pages.properties.steps.location")}>
          <FormSection title={t("pages.properties.steps.location")} description={t("pages.properties.steps.locationDescription")}>
            <LocationFields
              cities={options.cities}
              places={options.districts}
              locale={locale}
              labels={locationLabels}
              initial={{
                cityId,
                districtId: initial.districtId || null,
                street: initial.street,
                building: initial.building,
                neighborhoodName: initial.neighborhoodName,
                address: initial.address,
              }}
              onChange={(value) => {
                setCityId(value.cityId);
                setDistrictId(value.districtId);
              }}
            />
            <AdminSelect
              name="metroId"
              label={t("pages.properties.metro")}
              defaultValue={initial.metroId}
              placeholder={t("pages.properties.secilmeyib")}
              options={metros.map((metro) => ({ value: metro.id, label: metro.name }))}
            />
            <FullWidth>
              <AdminLocationPicker
                defaultLatitude={initial.latitude}
                defaultLongitude={initial.longitude}
                initialQuery={initial.street || initial.address || ""}
              />
            </FullWidth>
          </FormSection>
        </WizardStep>

        <WizardStep id="xususiyyetler" title={t("pages.properties.steps.details")}>
          <FormSection title={t("pages.properties.esasMelumat")} description={t("pages.properties.elaninSaytdaGorunenBasligi")}>
            <FullWidth>
              <AdminInput
                name="title"
                label={t("pages.properties.basliq")}
                required
                minLength={5}
                defaultValue={initial.title}
                maxLength={160}
                hint={t("pages.properties.meselenXetaiRayonunda3")}
              />
            </FullWidth>
            <AdminInput
              name="slug"
              label={t("pages.properties.slug")}
              defaultValue={initial.slug}
              maxLength={90}
              hint={t("pages.properties.bosBuraxsanizBasliqdanAvtomatik")}
            />
            <FullWidth>
              <AdminTextarea
                name="description"
                label={t("pages.properties.tesvir")}
                required
                minLength={20}
                rows={8}
                defaultValue={initial.description}
                hint={t("pages.properties.elaninTamMetniEn")}
              />
            </FullWidth>
          </FormSection>

          <FormSection title={t("pages.properties.olculer")}>
            <AdminInput name="rooms" label={t("pages.properties.otaqSayi")} type="number" min={0} value={rooms} onChange={(event) => setRooms(event.target.value)} />
            <AdminInput name="bedrooms" label={t("pages.properties.yataqOtagi")} type="number" min={0} defaultValue={initial.bedrooms} />
            <AdminInput name="bathrooms" label={t("pages.properties.sanitarQovsaq")} type="number" min={0} defaultValue={initial.bathrooms} />
            <AdminInput name="area" label={t("pages.properties.saheM")} type="number" min={0} step="0.01" defaultValue={initial.area} />
            <AdminInput
              name="landArea"
              label={t("pages.properties.torpaqSahesiSot")}
              type="number"
              min={0}
              step="0.01"
              defaultValue={initial.landArea}
              hint={t("pages.properties.1Sot100M")}
            />
            <AdminInput name="floor" label={t("pages.properties.mertebe")} type="number" min={0} defaultValue={initial.floor} />
            <AdminInput name="totalFloors" label={t("pages.properties.binaninMertebesi")} type="number" min={0} defaultValue={initial.totalFloors} />
          </FormSection>

          <FormSection title={t("pages.properties.veziyyetVeSertler")}>
            <AdminSelect
              name="renovation"
              label={t("pages.properties.temirVeziyyeti")}
              defaultValue={initial.renovation}
              placeholder={t("pages.properties.secilmeyib")}
              options={optionsOf(RENOVATIONS, RENOVATION_LABELS)}
            />
            <AdminSelect
              name="documentStatus"
              label={t("pages.properties.sened")}
              defaultValue={initial.documentStatus}
              placeholder={t("pages.properties.secilmeyib")}
              options={optionsOf(DOCUMENT_STATUSES, DOCUMENT_STATUS_LABELS)}
            />
          </FormSection>

          {Object.keys(featureGroups).length > 0 && (
            <FormSection title={t("pages.properties.xususiyyetler")} description={t("pages.properties.axtarisFiltrindeIstifadeOlunur")}>
              <FullWidth>
                <div className="flex flex-col gap-4">
                  {Object.entries(featureGroups).map(([group, features]) => (
                    <fieldset key={group} className="flex flex-col gap-1">
                      <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                        {t(`labels.featureGroup.${group as FeatureGroup}`) ?? group}
                      </legend>
                      {featureCheckboxes(features)}
                    </fieldset>
                  ))}
                </div>
              </FullWidth>
            </FormSection>
          )}
        </WizardStep>

        <WizardStep id="qiymet" title={t("pages.properties.steps.price")}>
          <FormSection title={t("pages.properties.steps.price")} description={t("pages.properties.steps.priceDescription")}>
            <AdminInput
              name="price"
              label={t("pages.properties.qiymet")}
              required
              type="number"
              min={0.01}
              step="0.01"
              defaultValue={initial.price}
            />
            <AdminSelect
              name="currency"
              label={t("pages.properties.valyuta")}
              required
              defaultValue={initial.currency}
              options={optionsOf(CURRENCIES, CURRENCY_LABELS)}
            />
            {listingType === LISTING_TYPES.RENT && (
              <AdminSelect
                name="pricePeriod"
                label={t("pages.properties.qiymetDovru")}
                required
                defaultValue={initial.pricePeriod || PRICE_PERIODS.MONTH}
                options={optionsOf(PRICE_PERIODS, PRICE_PERIOD_LABELS)}
              />
            )}
            {paymentFeatures.length > 0 && (
              <FullWidth>
                <fieldset className="flex flex-col gap-1">
                  <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t("labels.featureGroup.PAYMENT")}
                  </legend>
                  {featureCheckboxes(paymentFeatures)}
                </fieldset>
              </FullWidth>
            )}
          </FormSection>
        </WizardStep>

        <WizardStep id="media" title={t("pages.properties.steps.media")}>
          <FormSection title={t("pages.properties.sekiller")} description={t("pages.properties.steps.mediaDescription")}>
            <FullWidth>
              <ImageDropzone
                name="images"
                label={t("pages.properties.qalereya")}
                folder="emlaklar"
                initial={initial.images}
                hint={t("pages.properties.yuklenenSekillerAvtomatikWebp")}
                seoNamePrefix={`${options.districts.find((item) => item.id === districtId)?.slug ?? options.cities.find((item) => item.id === cityId)?.slug ?? "baki"}-${options.types.find((item) => item.id === typeId)?.slug ?? "emlak"}-${rooms || "0"}-otaqli-${uploadReference}`}
              />
            </FullWidth>
            <FullWidth>
              <ImageDropzone
                name="floorPlans"
                label={t("pages.properties.floorPlans")}
                folder="emlaklar"
                maxFiles={6}
                initial={initial.floorPlans}
                hint={t("pages.properties.floorPlansHint")}
              />
            </FullWidth>
            <AdminInput
              name="videoUrl"
              label={t("pages.properties.videoUnvani")}
              type="url"
              defaultValue={initial.videoUrl}
              hint={t("pages.properties.youtubeVeYaVimeo")}
            />
            <AdminInput
              name="virtualTourUrl"
              label={t("pages.properties.virtualTour")}
              type="url"
              defaultValue={initial.virtualTourUrl}
              hint={t("pages.properties.virtualTourHint")}
            />
          </FormSection>
        </WizardStep>

        <WizardStep id="elaqe" title={t("pages.properties.steps.contact")}>
          <FormSection title={t("pages.properties.steps.contact")} description={t("pages.properties.steps.contactDescription")}>
            <AdminSelect
              name="assignedAgentId"
              label={t("pages.properties.mesulAgent")}
              defaultValue={initial.assignedAgentId}
              placeholder={t("pages.properties.agentSecilmeyib")}
              options={options.agents.map((agent) => ({ value: agent.id, label: agent.name }))}
            />
            <FullWidth>
              <AdminCheckbox
                name="reservationEnabled"
                label={t("pages.properties.rezervasiyaniAktivEt")}
                defaultChecked={initial.reservationEnabled}
              />
            </FullWidth>
          </FormSection>
        </WizardStep>

        <WizardStep id="on-baxis" title={t("pages.properties.steps.preview")}>
          <FormSection title={t("pages.properties.steps.preview")} description={t("pages.properties.steps.previewDescription")}>
            <FullWidth>
              <ListingPreview
                entries={previewEntries}
                locale={locale}
                types={options.types}
                cities={options.cities}
                places={options.districts}
                features={options.features}
                labels={{
                  noImage: t("components.listingPreview.noImage"),
                  noTitle: t("components.listingPreview.noTitle"),
                  noPrice: t("components.listingPreview.noPrice"),
                  images: (count) => t("components.listingPreview.images", { count }),
                  rooms: (count) => t("components.listingPreview.rooms", { count }),
                  area: (value) => t("components.listingPreview.area", { value }),
                  floor: (floor) => t("components.listingPreview.floor", { floor }),
                  description: t("components.listingPreview.description"),
                  features: t("components.listingPreview.features"),
                  listingType: (value) => LISTING_TYPE_LABELS[value as keyof typeof LISTING_TYPE_LABELS] ?? value,
                  pricePeriod: (value) => PRICE_PERIOD_LABELS[value as keyof typeof PRICE_PERIOD_LABELS] ?? value,
                }}
              />
            </FullWidth>
          </FormSection>

          <FormSection id="seo" title="SEO" description={t("pages.properties.bosBuraxilsaBasliqVe")}>
            <SeoFields aiKind="property" initialTitle={initial.metaTitle} initialDescription={initial.metaDescription} fallbackTitle={initial.title || t("pages.misc.emlakElani")} fallbackDescription={initial.description || t("pages.misc.emlakHaqqindaMelumat")} pathname={`/emlaklar/${initial.slug || "yeni-elan"}`} />
            <AdminInput
              name="canonicalUrl"
              label={t("pages.properties.canonicalUrl")}
              defaultValue={initial.canonicalUrl}
              placeholder={t("pages.properties.bosBuraxilsaOzUnvanina")}
            />
            <FullWidth>
              <AdminCheckbox
                name="noIndex"
                label={t("pages.properties.axtarisMotorlarindaGizletNoindex")}
                defaultChecked={initial.noIndex}
              />
            </FullWidth>
          </FormSection>

          <FormSection
            id="open-graph"
            title={t("pages.properties.openGraph")}
            description={t("pages.properties.sosialSebekedePaylasilandaGorunen")}
          >
            <AdminInput name="ogTitle" label={t("pages.properties.ogBasliq")} defaultValue={initial.ogTitle} maxLength={70} />
            <AdminInput
              name="ogDescription"
              label={t("pages.properties.ogTesvir")}
              defaultValue={initial.ogDescription}
              maxLength={200}
            />
            <AdminInput
              name="ogImage"
              label={t("pages.properties.ogSekilUrl")}
              defaultValue={initial.ogImage}
              placeholder={t("pages.properties.bosBuraxilsaQalereyaninUz")}
            />
            <FullWidth>
              <AdminInput
                name="metaKeywords"
                label={t("components.seo.keywords")}
                defaultValue={initial.metaKeywords}
                maxLength={600}
                hint={t("components.seo.keywordsHint")}
              />
            </FullWidth>
            <FullWidth>
              <AdminTextarea
                name="socialText"
                label={t("components.seo.socialText")}
                defaultValue={initial.socialText}
                maxLength={300}
                rows={3}
                hint={t("components.seo.socialTextHint")}
              />
            </FullWidth>
          </FormSection>
        </WizardStep>

        <WizardStep id="tesdiq" title={t("pages.properties.steps.confirm")}>
          <FormSection title={t("pages.properties.steps.confirm")} description={t("pages.properties.steps.confirmDescription")}>
            <AdminSelect
              name="status"
              label={t("pages.properties.status")}
              required
              defaultValue={initial.status}
              options={optionsOf(PROPERTY_STATUSES, PROPERTY_STATUS_LABELS)}
            />
            <AdminInput
              name="featuredUntil"
              label={t("pages.properties.premiumBitmeTarixi")}
              type="date"
              defaultValue={initial.featuredUntil}
              hint={t("pages.properties.bosBuraxilsaMuddetsizFeatured")}
            />
            <FullWidth>
              <AdminCheckbox
                name="isFeatured"
                label={t("pages.properties.premiumFeaturedEt")}
                defaultChecked={initial.isFeatured}
              />
            </FullWidth>
          </FormSection>
        </WizardStep>
      </FormWizard>
    </AdminForm>
  );
}
