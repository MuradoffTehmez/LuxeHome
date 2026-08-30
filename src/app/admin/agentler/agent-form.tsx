"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveAgentProfile } from "./actions";

export type AgentFormValues = {
  id: string;
  name: string;
  slug: string;
  userId: string;
  agencyId: string;
  roleTitle: string;
  specialization: string;
  experienceYears: string;
  phone: string;
  whatsapp: string;
  email: string;
  languages: string;
  areas: string;
  bio: string;
  soldCount: string;
  rentedCount: string;
  responseMinutes: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isPublic: boolean;
};

export const EMPTY_AGENT_FORM: AgentFormValues = {
  id: "",
  name: "",
  slug: "",
  userId: "",
  agencyId: "",
  roleTitle: "",
  specialization: "",
  experienceYears: "",
  phone: "",
  whatsapp: "",
  email: "",
  languages: "",
  areas: "",
  bio: "",
  soldCount: "0",
  rentedCount: "0",
  responseMinutes: "",
  avatarUrl: null,
  isVerified: false,
  isPublic: false,
};

type Option = { id: string; label: string };

/**
 * Agent profilinin yaratma və redaktə forması.
 *
 * Tək komponent hər iki halı örtür: `initial.id` boşdursa action yeni profil yaradır.
 * Əvvəl yalnız yaratma forması vardı — səhv yazılmış telefon və ya bio-nu düzəltmək
 * mümkün deyildi, çünki heç bir yeniləmə axını yox idi.
 */
export function AgentForm({
  initial,
  users,
  agencies,
}: {
  initial: AgentFormValues;
  users: Option[];
  agencies: Option[];
}) {
  return (
    <AdminForm action={saveAgentProfile} submitLabel={initial.id ? "Dəyişiklikləri saxla" : "Agent yarat"} className="gap-4">
      <input type="hidden" name="id" value={initial.id} />

      <FormSection title="Profil" description="İctimai agent kataloqunda və əmlak kartında görünən məlumat.">
        <AdminInput name="name" label="Ad və soyad" defaultValue={initial.name} required maxLength={120} />
        <AdminInput name="slug" label="URL adı" defaultValue={initial.slug} placeholder="ad-soyad" maxLength={100} hint="Boş buraxılsa addan yaradılır." />
        <AdminSelect
          name="userId"
          label="Bağlı hesab"
          defaultValue={initial.userId}
          options={[{ value: "", label: "Bağlanmayıb" }, ...users.map((user) => ({ value: user.id, label: user.label }))]}
        />
        <AdminSelect
          name="agencyId"
          label="Agentlik"
          defaultValue={initial.agencyId}
          options={[{ value: "", label: "Müstəqil" }, ...agencies.map((agency) => ({ value: agency.id, label: agency.label }))]}
        />
        <AdminInput name="roleTitle" label="Vəzifə" defaultValue={initial.roleTitle} maxLength={120} />
        <AdminInput name="specialization" label="İxtisaslaşma" defaultValue={initial.specialization} maxLength={200} />
        <FullWidth>
          <ImageDropzone
            name="avatar"
            label="Profil şəkli"
            folder="umumi"
            mode="single"
            initial={initial.avatarUrl ? [{ url: initial.avatarUrl, alt: "", isCover: true }] : []}
          />
        </FullWidth>
        <FullWidth>
          <AdminTextarea name="bio" label="Bio" defaultValue={initial.bio} rows={5} maxLength={3000} />
        </FullWidth>
      </FormSection>

      <FormSection title="Əlaqə" description="Elan səhifəsindəki agent kartı bu nömrələri göstərir.">
        <AdminInput name="phone" label="Telefon" defaultValue={initial.phone} maxLength={40} />
        <AdminInput name="whatsapp" label="WhatsApp" defaultValue={initial.whatsapp} maxLength={40} />
        <AdminInput name="email" label="E-poçt" type="email" defaultValue={initial.email} maxLength={200} />
        <AdminTextarea name="languages" label="Dillər" defaultValue={initial.languages} rows={4} hint="Hər sətirdə biri." />
        <AdminTextarea name="areas" label="Ərazilər" defaultValue={initial.areas} rows={4} hint="Hər sətirdə biri." />
      </FormSection>

      <FormSection
        title="Göstəricilər"
        description="Yalnız təsdiqlənmiş rəqəmlər doldurulmalıdır — boş sahə ictimai səhifədə ümumiyyətlə göstərilmir."
      >
        <AdminInput name="experienceYears" label="Təcrübə ili" type="number" min={0} max={80} defaultValue={initial.experienceYears} />
        <AdminInput name="soldCount" label="Satış sayı" type="number" min={0} defaultValue={initial.soldCount} />
        <AdminInput name="rentedCount" label="İcarə sayı" type="number" min={0} defaultValue={initial.rentedCount} />
        <AdminInput
          name="responseMinutes"
          label="Orta cavab müddəti (dəqiqə)"
          type="number"
          min={1}
          max={10080}
          defaultValue={initial.responseMinutes}
          hint="PRD bölmə 165: yalnız real ölçü olduqda doldurulur, boş qalarsa metrik göstərilmir."
        />
      </FormSection>

      <FormSection title="Görünürlük" description="Profil yalnız «İctimai kataloqda göstər» seçildikdə saytda görünür.">
        <FullWidth>
          <div className="flex flex-wrap gap-5">
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="isVerified" defaultChecked={initial.isVerified} className="size-4 accent-gold-deep" /> Təsdiqlənmiş agent
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="isPublic" defaultChecked={initial.isPublic} className="size-4 accent-gold-deep" /> İctimai kataloqda göstər
            </label>
          </div>
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
