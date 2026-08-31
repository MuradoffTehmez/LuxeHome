"use client";

import { useTranslations } from "next-intl";
import { AdminForm, FormJumpNav, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ContentEditor } from "@/components/admin/content-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import {
  MAX_PARTNER_LOGO_SIZE,
  PARTNER_STATUS_LABELS,
  PARTNER_STATUSES,
  PARTNERSHIP_TYPE_LABELS,
  PARTNERSHIP_TYPES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { PartnerFormValues } from "./form-values";

const optionsOf = <T extends Record<string, string>>(
  values: T,
  labels: Record<string, string>,
) => Object.values(values).map((value) => ({ value, label: labels[value] }));

/** Bölmə adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const partnerSections = (t: ReturnType<typeof useTranslations<"admin">>) =>
  [
    { id: "esas-melumat", label: t("pages.partners.esas") },
    { id: "media", label: t("pages.partners.media") },
    { id: "elaqe", label: t("pages.partners.elaqe") },
    { id: "terefdasliq", label: t("pages.partners.terefdasliq") },
    { id: "qisa-tesvirler", label: t("pages.partners.qisaTesvirler") },
    { id: "emekdasliq-haqqinda", label: t("pages.partners.emekdasliq") },
    { id: "huquqi-bildiris", label: t("pages.partners.huquqiBildiris") },
    { id: "seo", label: "SEO" },
    { id: "muqavile", label: t("pages.partners.muqavile") },
  ] as const;

export function PartnerForm({
  action,
  initial,
  submitLabel,
  canManageContract,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: PartnerFormValues;
  submitLabel: string;
  canManageContract: boolean;
  extraActions?: React.ReactNode;
}) {
  const t = useTranslations("admin");
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/terefdaslar"
      extraActions={extraActions}
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <FormJumpNav
        items={partnerSections(t).filter(
          (section) => section.id !== "muqavile" || canManageContract,
        )}
      />

      <FormSection id="esas-melumat" title={t("pages.partners.esasMelumat")} description={t("pages.partners.terefdasinAdiUnikalUnvani")}>
        <AdminInput name="name" label={t("pages.partners.ad")} required defaultValue={initial.name} maxLength={160} />
        <AdminInput
          name="legalName"
          label={t("pages.partners.huquqiAd")}
          defaultValue={initial.legalName}
          maxLength={200}
          hint={t("pages.partners.yalnizResmiSeneddeTesdiqlenibse")}
        />
        <AdminInput
          name="slug"
          label={t("pages.partners.slug")}
          defaultValue={initial.slug}
          maxLength={90}
          hint={t("pages.partners.bosBuraxsanizAddanYaradilir")}
        />
        <AdminSelect
          name="partnershipType"
          label={t("pages.partners.terefdasliqNovu")}
          required
          defaultValue={initial.partnershipType}
          options={optionsOf(PARTNERSHIP_TYPES, PARTNERSHIP_TYPE_LABELS)}
        />
      </FormSection>

      <FormSection id="media" title={t("pages.partners.media")} description={t("pages.partners.loqolarKesilmirFaylinOz")}>
        <ImageDropzone
          name="logo"
          label={t("pages.partners.esasLoqo")}
          folder="terefdaslar-logo"
          mode="single"
          maxFiles={1}
          maxFileSize={MAX_PARTNER_LOGO_SIZE}
          initial={initial.logo}
          hint={t("pages.partners.jpegPngWebpVe")}
        />
        <ImageDropzone
          name="logoLight"
          label={t("pages.partners.aciqTemaLoqosu")}
          folder="terefdaslar-logo"
          mode="single"
          maxFiles={1}
          maxFileSize={MAX_PARTNER_LOGO_SIZE}
          initial={initial.logoLight}
          hint={t("pages.partners.bosQalsaEsasLoqo")}
        />
        <ImageDropzone
          name="logoDark"
          label={t("pages.partners.tundTemaLoqosu")}
          folder="terefdaslar-logo"
          mode="single"
          maxFiles={1}
          maxFileSize={MAX_PARTNER_LOGO_SIZE}
          initial={initial.logoDark}
          hint={t("pages.partners.bosQalsaEsasLoqo")}
        />
        <ImageDropzone
          name="coverImage"
          label={t("pages.partners.uzQabigi")}
          folder="terefdaslar"
          mode="single"
          maxFiles={1}
          initial={initial.coverImage}
          hint={t("pages.partners.profilVeOpenGraph")}
        />
      </FormSection>

      <FormSection id="elaqe" title={t("pages.partners.elaqe")}>
        <AdminInput
          name="websiteUrl"
          label={t("pages.partners.website")}
          type="url"
          defaultValue={initial.websiteUrl}
          placeholder="https://example.com"
        />
        <AdminInput name="email" label={t("pages.partners.ePoct")} type="email" defaultValue={initial.email} />
        <AdminInput name="phone" label={t("pages.partners.telefon")} type="tel" defaultValue={initial.phone} />
        <AdminInput name="whatsapp" label={t("pages.partners.whatsapp")} type="tel" defaultValue={initial.whatsapp} />
        <AdminInput name="country" label={t("pages.partners.olke")} defaultValue={initial.country} maxLength={80} />
        <AdminInput name="city" label={t("pages.partners.seher")} defaultValue={initial.city} maxLength={80} />
        <FullWidth>
          <AdminInput name="address" label={t("pages.partners.unvan")} defaultValue={initial.address} maxLength={240} />
        </FullWidth>
      </FormSection>

      <FormSection
        id="terefdasliq"
        title={t("pages.partners.terefdasliq")}
        description={t("pages.partners.resmiBadgeYalnizActive")}
        asFieldset
      >
        <AdminSelect
          name="status"
          label={t("pages.partners.status")}
          required
          defaultValue={initial.status}
          options={optionsOf(PARTNER_STATUSES, PARTNER_STATUS_LABELS)}
        />
        <AdminInput
          name="sortOrder"
          label={t("pages.partners.sira")}
          type="number"
          min={0}
          max={9999}
          defaultValue={initial.sortOrder}
        />
        <AdminInput
          name="officialSince"
          label={t("pages.partners.resmiTerefdasliqTarixi")}
          type="date"
          defaultValue={initial.officialSince}
        />
        <AdminInput
          name="partnershipEndDate"
          label={t("pages.partners.terefdasliginBitmeTarixi")}
          type="date"
          defaultValue={initial.partnershipEndDate}
        />
        <AdminCheckbox name="verified" label={t("pages.partners.tesdiqlenib")} defaultChecked={initial.verified} />
        <AdminCheckbox
          name="officialPartner"
          label={t("pages.partners.resmiTerefdas")}
          defaultChecked={initial.officialPartner}
        />
        <AdminCheckbox name="featured" label={t("pages.partners.secilmisTerefdas")} defaultChecked={initial.featured} />
        <AdminCheckbox
          name="showPublicly"
          label={t("pages.partners.saytdaGosterilsin")}
          defaultChecked={initial.showPublicly}
        />
        <AdminCheckbox
          name="showOnHomepage"
          label={t("pages.partners.anaSehifedeGosterilsin")}
          defaultChecked={initial.showOnHomepage}
        />
      </FormSection>

      <FormSection id="qisa-tesvirler" title={t("pages.partners.qisaTesvirler")} description={t("pages.partners.azEsasDildirEn")}>
        <FullWidth>
          <AdminTextarea
            name="shortDescription"
            label={t("pages.partners.qisaTesvirAz")}
            rows={3}
            maxLength={300}
            defaultValue={initial.shortDescription}
          />
        </FullWidth>
        <AdminTextarea
          name="shortDescriptionEn"
          label={t("pages.partners.qisaTesvirEn")}
          rows={3}
          maxLength={300}
          defaultValue={initial.shortDescriptionEn}
        />
        <AdminTextarea
          name="shortDescriptionRu"
          label={t("pages.partners.qisaTesvirRu")}
          rows={3}
          maxLength={300}
          defaultValue={initial.shortDescriptionRu}
        />
      </FormSection>

      <FormSection id="emekdasliq-haqqinda" title={t("pages.partners.emekdasliqHaqqinda")} description={t("pages.partners.htmlServerdeAgSiyahi")}>
        <FullWidth>
          <ContentEditor name="description" label={t("pages.partners.tesvirAz")} defaultValue={initial.description} rows={12} />
        </FullWidth>
        <FullWidth>
          <ContentEditor name="descriptionEn" label={t("pages.partners.tesvirEn")} defaultValue={initial.descriptionEn} rows={10} />
        </FullWidth>
        <FullWidth>
          <ContentEditor name="descriptionRu" label={t("pages.partners.tesvirRu")} defaultValue={initial.descriptionRu} rows={10} />
        </FullWidth>
      </FormSection>

      <FormSection id="huquqi-bildiris" title={t("pages.partners.huquqiBildiris")} description={t("pages.partners.ozbasinaMetnYaradilmirYalniz")}>
        <FullWidth>
          <AdminTextarea name="disclaimer" label={t("pages.partners.bildirisAz")} rows={3} maxLength={600} defaultValue={initial.disclaimer} />
        </FullWidth>
        <AdminTextarea name="disclaimerEn" label={t("pages.partners.bildirisEn")} rows={3} maxLength={600} defaultValue={initial.disclaimerEn} />
        <AdminTextarea name="disclaimerRu" label={t("pages.partners.bildirisRu")} rows={3} maxLength={600} defaultValue={initial.disclaimerRu} />
      </FormSection>

      <FormSection id="seo" title="SEO">
        <AdminInput name="seoTitle" label={t("pages.partners.seoBasliqAz")} maxLength={70} defaultValue={initial.seoTitle} />
        <AdminInput
          name="seoDescription"
          label={t("pages.partners.seoTesvirAz")}
          maxLength={180}
          defaultValue={initial.seoDescription}
        />
        <FullWidth>
          <AdminInput
            name="seoKeywords"
            label={t("pages.partners.acarSozlerAz")}
            maxLength={300}
            defaultValue={initial.seoKeywords}
            hint={t("pages.partners.vergulleAyirin")}
          />
        </FullWidth>
        <FullWidth>
          <AdminInput
            name="ogImage"
            label={t("pages.partners.openGraphSekli")}
            defaultValue={initial.ogImage}
            hint={t("pages.partners.bosQalsaUzQabigi")}
          />
        </FullWidth>
      </FormSection>

      {canManageContract ? (
        <FormSection
          id="muqavile"
          title={t("pages.partners.muqavileMetadatasi")}
          description={t("pages.partners.yalnizSuperAdminGorur")}
        >
          <AdminInput name="contractNumber" label={t("pages.partners.muqavileNomresi")} defaultValue={initial.contractNumber} />
          <AdminInput name="contractDocument" label={t("pages.partners.senedAcariUrl")} defaultValue={initial.contractDocument} />
          <AdminInput name="contractStartDate" label={t("pages.partners.baslamaTarixi")} type="date" defaultValue={initial.contractStartDate} />
          <AdminInput name="contractEndDate" label={t("pages.partners.bitmeTarixi")} type="date" defaultValue={initial.contractEndDate} />
          <FullWidth>
            <AdminTextarea name="internalNotes" label={t("pages.partners.daxiliQeydler")} rows={6} maxLength={4000} defaultValue={initial.internalNotes} />
          </FullWidth>
        </FormSection>
      ) : null}
    </AdminForm>
  );
}
