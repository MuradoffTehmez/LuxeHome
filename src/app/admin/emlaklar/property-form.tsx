"use client";

import { useState } from "react";
import { AdminForm, FormJumpNav, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { SeoFields } from "@/components/admin/seo-fields";
import {
  BUILDING_TYPE_LABELS,
  BUILDING_TYPES,
  CURRENCIES,
  CURRENCY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUSES,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  PRICE_PERIOD_LABELS,
  PRICE_PERIODS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUSES,
  RENOVATION_LABELS,
  RENOVATIONS,
  type FeatureGroup,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { PropertyFormOptions } from "@/lib/queries";
import type { PropertyFormValues } from "./form-values";
import { useTranslations } from "next-intl";

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

/** Bölmə adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
function buildPropertySections(t: ReturnType<typeof useTranslations<"admin">>) {
  return [
    { id: "esas-melumat", label: t("pages.properties.esas") },
    { id: "qiymet", label: t("pages.properties.qiymet") },
    { id: "yerlesme", label: t("pages.properties.yerlesme") },
    { id: "olculer", label: t("pages.properties.olculer") },
    { id: "sertler", label: t("pages.properties.sertler") },
    { id: "xususiyyetler", label: t("pages.properties.xususiyyetler") },
    { id: "sekiller", label: t("pages.properties.sekiller") },
    { id: "seo", label: "SEO" },
    { id: "open-graph", label: t("pages.properties.openGraph") },
  ] as const;
}

export function PropertyForm({
  action,
  options,
  initial,
  submitLabel,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
  initial: PropertyFormValues;
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const [listingType, setListingType] = useState(initial.listingType);
  const [cityId, setCityId] = useState(initial.cityId || options.cities[0]?.id || "");
  const [typeId, setTypeId] = useState(initial.typeId);
  const [districtId, setDistrictId] = useState(initial.districtId);
  const [rooms, setRooms] = useState(initial.rooms);
  const [uploadReference] = useState(() => initial.id ? `LHE${initial.id.slice(-8)}` : `LHE${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`);

  // Rayon siyahısı seçilmiş şəhərdən asılıdır — kaskad ictimai axtarışdakı ilə eynidir
  const districts = options.districts.filter((district) => district.parentId === cityId);
  const metros = options.metros.filter((metro) => metro.parentId === cityId);

  const featureGroups = options.features.reduce<Record<string, typeof options.features>>(
    (groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    },
    {},
  );

  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/emlaklar"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormJumpNav
        items={buildPropertySections(t).filter(
          (section) => section.id !== "xususiyyetler" || options.features.length > 0,
        )}
      />

      <FormSection id="esas-melumat" title={t("pages.properties.esasMelumat")} description={t("pages.properties.elaninSaytdaGorunenBasligi")}>
        <FullWidth>
          <AdminInput
            name="title"
            label={t("pages.properties.basliq")}
            required
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

        <AdminSelect
          name="status"
          label={t("pages.properties.status")}
          required
          defaultValue={initial.status}
          options={optionsOf(PROPERTY_STATUSES, PROPERTY_STATUS_LABELS)}
        />

        <FullWidth>
          <AdminTextarea
            name="description"
            label={t("pages.properties.tesvir")}
            required
            rows={8}
            defaultValue={initial.description}
            hint={t("pages.properties.elaninTamMetniEn")}
          />
        </FullWidth>
      </FormSection>

      <FormSection id="qiymet" title={t("pages.properties.elanNovuVeQiymet")}>
        <AdminSelect
          name="listingType"
          label={t("pages.properties.elanNovu")}
          required
          value={listingType}
          onChange={(event) => setListingType(event.target.value)}
          options={optionsOf(LISTING_TYPES, LISTING_TYPE_LABELS)}
        />

        <AdminSelect
          name="currency"
          label={t("pages.properties.valyuta")}
          required
          defaultValue={initial.currency}
          options={optionsOf(CURRENCIES, CURRENCY_LABELS)}
        />

        <AdminInput
          name="price"
          label={t("pages.properties.qiymet")}
          required
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.price}
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
      </FormSection>

      <FormSection id="yerlesme" title={t("pages.properties.yerlesme")}>
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
          name="cityId"
          label={t("pages.properties.seher")}
          required
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          options={options.cities.map((city) => ({ value: city.id, label: city.name }))}
        />

        <AdminSelect
          name="districtId"
          label={t("pages.properties.rayonQesebe")}
          value={districtId}
          onChange={(event) => setDistrictId(event.target.value)}
          placeholder={t("pages.properties.secilmeyib")}
          options={districts.map((district) => ({ value: district.id, label: district.name }))}
        />

        <AdminSelect
          name="metroId"
          label={t("pages.properties.metro")}
          defaultValue={initial.metroId}
          placeholder={t("pages.properties.secilmeyib")}
          options={metros.map((metro) => ({ value: metro.id, label: metro.name }))}
        />

        <AdminSelect
          name="projectId"
          label={t("pages.properties.layihe")}
          defaultValue={initial.projectId}
          placeholder={t("pages.properties.layiheyeAidDeyil")}
          options={options.projects.map((project) => ({ value: project.id, label: project.name }))}
        />

        <FullWidth>
          <AdminInput
            name="address"
            label={t("pages.properties.unvan")}
            defaultValue={initial.address}
            maxLength={240}
            hint={t("pages.properties.kuceVeBinaDeqiq")}
          />
        </FullWidth>

        <AdminInput
          name="latitude"
          label={t("pages.properties.enlikLatitude")}
          type="number"
          step="any"
          defaultValue={initial.latitude}
        />
        <AdminInput
          name="longitude"
          label={t("pages.properties.uzunluqLongitude")}
          type="number"
          step="any"
          defaultValue={initial.longitude}
        />
      </FormSection>

      <FormSection id="olculer" title={t("pages.properties.olculer")}>
        <AdminInput name="rooms" label={t("pages.properties.otaqSayi")} type="number" min={0} value={rooms} onChange={(event) => setRooms(event.target.value)} />
        <AdminInput
          name="bedrooms"
          label={t("pages.properties.yataqOtagi")}
          type="number"
          min={0}
          defaultValue={initial.bedrooms}
        />
        <AdminInput
          name="bathrooms"
          label={t("pages.properties.sanitarQovsaq")}
          type="number"
          min={0}
          defaultValue={initial.bathrooms}
        />
        <AdminInput
          name="area"
          label={t("pages.properties.saheM")}
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.area}
        />
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
        <AdminInput
          name="totalFloors"
          label={t("pages.properties.binaninMertebesi")}
          type="number"
          min={0}
          defaultValue={initial.totalFloors}
        />
      </FormSection>

      <FormSection id="sertler" title={t("pages.properties.veziyyetVeSertler")}>
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
        <AdminSelect
          name="buildingType"
          label={t("pages.properties.tikiliNovu")}
          defaultValue={initial.buildingType}
          placeholder={t("pages.properties.secilmeyib")}
          options={optionsOf(BUILDING_TYPES, BUILDING_TYPE_LABELS)}
        />
        <AdminInput
          name="videoUrl"
          label={t("pages.properties.videoUnvani")}
          type="url"
          defaultValue={initial.videoUrl}
          hint={t("pages.properties.youtubeVeYaVimeo")}
        />

        <FullWidth>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {/* İpoteka / taksit burada deyil: aşağıdakı «Ödəniş şərtləri»
                xüsusiyyət qrupundan seçilir və elanın sütunlarına oradan yazılır. */}
            <AdminCheckbox
              name="isFeatured"
              label={t("pages.properties.premiumFeaturedEt")}
              defaultChecked={initial.isFeatured}
            />
            <AdminCheckbox
              name="reservationEnabled"
              label={t("pages.properties.rezervasiyaniAktivEt")}
              defaultChecked={initial.reservationEnabled}
            />
          </div>
        </FullWidth>
        <AdminInput
          name="featuredUntil"
          label={t("pages.properties.premiumBitmeTarixi")}
          type="date"
          defaultValue={initial.featuredUntil}
          hint={t("pages.properties.bosBuraxilsaMuddetsizFeatured")}
        />
        <AdminSelect
          name="assignedAgentId"
          label={t("pages.properties.mesulAgent")}
          defaultValue={initial.assignedAgentId}
          placeholder={t("pages.properties.agentSecilmeyib")}
          options={options.agents.map((agent) => ({ value: agent.id, label: agent.name }))}
        />
      </FormSection>

      {options.features.length > 0 && (
        <FormSection id="xususiyyetler" title={t("pages.properties.xususiyyetler")} description={t("pages.properties.axtarisFiltrindeIstifadeOlunur")}>
          <FullWidth>
            <div className="flex flex-col gap-4">
              {Object.entries(featureGroups).map(([group, features]) => (
                <fieldset key={group} className="flex flex-col gap-1">
                  <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t(`labels.featureGroup.${group as FeatureGroup}`) ?? group}
                  </legend>
                  <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
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
                </fieldset>
              ))}
            </div>
          </FullWidth>
        </FormSection>
      )}

      <FormSection id="sekiller" title={t("pages.properties.sekiller")} description={t("pages.properties.birinciSekilSiyahilardaUz")}>
        <FullWidth>
          <ImageDropzone
            name="images"
            label={t("pages.properties.qalereya")}
            folder="emlaklar"
            initial={initial.images}
            hint={t("pages.properties.yuklenenSekillerAvtomatikWebp")}
            seoNamePrefix={`${options.districts.find((item) => item.id === districtId)?.slug ?? "baki"}-${options.types.find((item) => item.id === typeId)?.slug ?? "emlak"}-${rooms || "0"}-otaqli-${uploadReference}`}
          />
        </FullWidth>
      </FormSection>

      <FormSection id="seo" title="SEO" description={t("pages.properties.bosBuraxilsaBasliqVe")}>
        <SeoFields initialTitle={initial.metaTitle} initialDescription={initial.metaDescription} fallbackTitle={initial.title || t("pages.misc.emlakElani")} fallbackDescription={initial.description || t("pages.misc.emlakHaqqindaMelumat")} pathname={`/emlaklar/${initial.slug || "yeni-elan"}`} />
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
      </FormSection>
    </AdminForm>
  );
}
