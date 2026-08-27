"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
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
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/terefdaslar"
      extraActions={extraActions}
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <FormSection title="Əsas məlumat" description="Tərəfdaşın adı, unikal ünvanı və biznes növü.">
        <AdminInput name="name" label="Ad" required defaultValue={initial.name} maxLength={160} />
        <AdminInput
          name="legalName"
          label="Hüquqi ad"
          defaultValue={initial.legalName}
          maxLength={200}
          hint="Yalnız rəsmi sənəddə təsdiqlənibsə doldurun."
        />
        <AdminInput
          name="slug"
          label="Slug"
          defaultValue={initial.slug}
          maxLength={90}
          hint="Boş buraxsanız addan yaradılır. Dublikat slug qəbul edilmir."
        />
        <AdminSelect
          name="partnershipType"
          label="Tərəfdaşlıq növü"
          required
          defaultValue={initial.partnershipType}
          options={optionsOf(PARTNERSHIP_TYPES, PARTNERSHIP_TYPE_LABELS)}
        />
      </FormSection>

      <FormSection title="Media" description="Loqolar kəsilmir; faylın öz aspect ratio-su qorunur.">
        <ImageDropzone
          name="logo"
          label="Əsas loqo"
          folder="terefdaslar-logo"
          mode="single"
          maxFiles={1}
          maxFileSize={MAX_PARTNER_LOGO_SIZE}
          initial={initial.logo}
          hint="JPEG, PNG, WebP və ya AVIF; maksimum 2 MB."
        />
        <ImageDropzone
          name="logoLight"
          label="Açıq tema loqosu"
          folder="terefdaslar-logo"
          mode="single"
          maxFiles={1}
          maxFileSize={MAX_PARTNER_LOGO_SIZE}
          initial={initial.logoLight}
          hint="Boş qalsa əsas loqo istifadə olunur."
        />
        <ImageDropzone
          name="logoDark"
          label="Tünd tema loqosu"
          folder="terefdaslar-logo"
          mode="single"
          maxFiles={1}
          maxFileSize={MAX_PARTNER_LOGO_SIZE}
          initial={initial.logoDark}
          hint="Boş qalsa əsas loqo istifadə olunur."
        />
        <ImageDropzone
          name="coverImage"
          label="Üz qabığı"
          folder="terefdaslar"
          mode="single"
          maxFiles={1}
          initial={initial.coverImage}
          hint="Profil və Open Graph üçün geniş şəkil."
        />
      </FormSection>

      <FormSection title="Əlaqə">
        <AdminInput
          name="websiteUrl"
          label="Website"
          type="url"
          defaultValue={initial.websiteUrl}
          placeholder="https://example.com"
        />
        <AdminInput name="email" label="E-poçt" type="email" defaultValue={initial.email} />
        <AdminInput name="phone" label="Telefon" type="tel" defaultValue={initial.phone} />
        <AdminInput name="whatsapp" label="WhatsApp" type="tel" defaultValue={initial.whatsapp} />
        <AdminInput name="country" label="Ölkə" defaultValue={initial.country} maxLength={80} />
        <AdminInput name="city" label="Şəhər" defaultValue={initial.city} maxLength={80} />
        <FullWidth>
          <AdminInput name="address" label="Ünvan" defaultValue={initial.address} maxLength={240} />
        </FullWidth>
      </FormSection>

      <FormSection
        title="Tərəfdaşlıq"
        description="Rəsmi badge yalnız ACTIVE + təsdiqlənmiş + rəsmi + public olduqda görünür."
        asFieldset
      >
        <AdminSelect
          name="status"
          label="Status"
          required
          defaultValue={initial.status}
          options={optionsOf(PARTNER_STATUSES, PARTNER_STATUS_LABELS)}
        />
        <AdminInput
          name="sortOrder"
          label="Sıra"
          type="number"
          min={0}
          max={9999}
          defaultValue={initial.sortOrder}
        />
        <AdminInput
          name="officialSince"
          label="Rəsmi tərəfdaşlıq tarixi"
          type="date"
          defaultValue={initial.officialSince}
        />
        <AdminInput
          name="partnershipEndDate"
          label="Tərəfdaşlığın bitmə tarixi"
          type="date"
          defaultValue={initial.partnershipEndDate}
        />
        <AdminCheckbox name="verified" label="Təsdiqlənib" defaultChecked={initial.verified} />
        <AdminCheckbox
          name="officialPartner"
          label="Rəsmi tərəfdaş"
          defaultChecked={initial.officialPartner}
        />
        <AdminCheckbox name="featured" label="Seçilmiş tərəfdaş" defaultChecked={initial.featured} />
        <AdminCheckbox
          name="showPublicly"
          label="Saytda göstərilsin"
          defaultChecked={initial.showPublicly}
        />
        <AdminCheckbox
          name="showOnHomepage"
          label="Ana səhifədə göstərilsin"
          defaultChecked={initial.showOnHomepage}
        />
      </FormSection>

      <FormSection title="Qısa təsvirlər" description="AZ əsas dildir; EN/RU boş qalsa AZ göstərilir.">
        <FullWidth>
          <AdminTextarea
            name="shortDescription"
            label="Qısa təsvir — AZ"
            rows={3}
            maxLength={300}
            defaultValue={initial.shortDescription}
          />
        </FullWidth>
        <AdminTextarea
          name="shortDescriptionEn"
          label="Qısa təsvir — EN"
          rows={3}
          maxLength={300}
          defaultValue={initial.shortDescriptionEn}
        />
        <AdminTextarea
          name="shortDescriptionRu"
          label="Qısa təsvir — RU"
          rows={3}
          maxLength={300}
          defaultValue={initial.shortDescriptionRu}
        />
      </FormSection>

      <FormSection title="Əməkdaşlıq haqqında" description="HTML serverdə ağ siyahı üzrə təmizlənir.">
        <FullWidth>
          <ContentEditor name="description" label="Təsvir — AZ" defaultValue={initial.description} rows={12} />
        </FullWidth>
        <FullWidth>
          <ContentEditor name="descriptionEn" label="Təsvir — EN" defaultValue={initial.descriptionEn} rows={10} />
        </FullWidth>
        <FullWidth>
          <ContentEditor name="descriptionRu" label="Təsvir — RU" defaultValue={initial.descriptionRu} rows={10} />
        </FullWidth>
      </FormSection>

      <FormSection title="Hüquqi bildiriş" description="Özbaşına mətn yaradılmır; yalnız təsdiqlənmiş mətni daxil edin.">
        <FullWidth>
          <AdminTextarea name="disclaimer" label="Bildiriş — AZ" rows={3} maxLength={600} defaultValue={initial.disclaimer} />
        </FullWidth>
        <AdminTextarea name="disclaimerEn" label="Bildiriş — EN" rows={3} maxLength={600} defaultValue={initial.disclaimerEn} />
        <AdminTextarea name="disclaimerRu" label="Bildiriş — RU" rows={3} maxLength={600} defaultValue={initial.disclaimerRu} />
      </FormSection>

      <FormSection title="SEO">
        <AdminInput name="seoTitle" label="SEO başlıq (AZ)" maxLength={70} defaultValue={initial.seoTitle} />
        <AdminInput
          name="seoDescription"
          label="SEO təsvir (AZ)"
          maxLength={180}
          defaultValue={initial.seoDescription}
        />
        <FullWidth>
          <AdminInput
            name="seoKeywords"
            label="Açar sözlər (AZ)"
            maxLength={300}
            defaultValue={initial.seoKeywords}
            hint="Vergüllə ayırın."
          />
        </FullWidth>
        <FullWidth>
          <AdminInput
            name="ogImage"
            label="Open Graph şəkli"
            defaultValue={initial.ogImage}
            hint="Boş qalsa üz qabığı və ya əsas loqo istifadə olunur."
          />
        </FullWidth>
      </FormSection>

      {canManageContract ? (
        <FormSection
          title="Müqavilə metadatası"
          description="Yalnız Super Admin görür. Bu məlumat public sorğulara daxil edilmir."
        >
          <AdminInput name="contractNumber" label="Müqavilə nömrəsi" defaultValue={initial.contractNumber} />
          <AdminInput name="contractDocument" label="Sənəd açarı / URL" defaultValue={initial.contractDocument} />
          <AdminInput name="contractStartDate" label="Başlama tarixi" type="date" defaultValue={initial.contractStartDate} />
          <AdminInput name="contractEndDate" label="Bitmə tarixi" type="date" defaultValue={initial.contractEndDate} />
          <FullWidth>
            <AdminTextarea name="internalNotes" label="Daxili qeydlər" rows={6} maxLength={4000} defaultValue={initial.internalNotes} />
          </FullWidth>
        </FormSection>
      ) : null}
    </AdminForm>
  );
}
