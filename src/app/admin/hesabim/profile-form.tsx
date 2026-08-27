"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, FullWidth } from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveProfile } from "./actions";

export function ProfileForm({ initial }: { initial: { name: string; phone: string; locale: string; themePreference: string; avatarUrl: string | null } }) {
  return (
    <AdminForm action={saveProfile} submitLabel="Profili saxla" className="gap-4">
      <FormSection title="Şəxsi məlumatlar" description="Paneldə görünən ad, əlaqə və fərdi görünüş seçimi.">
        <AdminInput name="name" label="Ad və soyad" defaultValue={initial.name} required maxLength={120} />
        <AdminInput name="phone" label="Telefon" defaultValue={initial.phone} maxLength={30} />
        <AdminSelect name="locale" label="Panel dili" defaultValue={initial.locale} options={[
          { value: "az", label: "Azərbaycan dili" },
          { value: "en", label: "English" },
          { value: "ru", label: "Русский" },
        ]} />
        <AdminSelect name="themePreference" label="Görünüş" defaultValue={initial.themePreference} options={[
          { value: "light", label: "Açıq" },
          { value: "dark", label: "Tünd" },
          { value: "system", label: "Cihaz ayarı" },
        ]} hint="Sistem yeni istifadəçilər üçün açıq tema ilə başlayır; istədiyiniz vaxt dəyişə bilərsiniz." />
        <FullWidth>
          <ImageDropzone name="avatar" label="Profil şəkli" folder="umumi" mode="single" initial={initial.avatarUrl ? [{ url: initial.avatarUrl, alt: "", isCover: true }] : []} />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
