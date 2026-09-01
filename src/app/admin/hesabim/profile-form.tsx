"use client";

import { useTranslations } from "next-intl";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, FullWidth } from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { LOCALES } from "@/lib/constants";
import { saveProfile } from "./actions";

export function ProfileForm({ initial }: { initial: { name: string; phone: string; locale: string; themePreference: string; avatarUrl: string | null } }) {
  const t = useTranslations("admin");

  // Dil adları hər zaman öz dilində göstərilir (endonim) — seçim panelin cari
  // dilindən asılı olmamalıdır, əks halda tanımadığı dilə keçmək çətinləşir.
  const localeOptions = Object.values(LOCALES).map((value) => ({
    value,
    label: t(`labels.locale.${value}`),
  }));

  return (
    <AdminForm action={saveProfile} submitLabel={t("profile.submit")} className="gap-4">
      <FormSection title={t("profile.section")} description={t("profile.sectionHint")}>
        <AdminInput name="name" label={t("profile.name")} defaultValue={initial.name} required maxLength={120} />
        <AdminInput name="phone" label={t("profile.phone")} defaultValue={initial.phone} maxLength={30} />
        <AdminSelect
          name="locale"
          label={t("profile.language")}
          defaultValue={initial.locale}
          options={localeOptions}
          hint={t("profile.languageHint")}
        />
        <AdminSelect name="themePreference" label={t("profile.theme")} defaultValue={initial.themePreference === "dark" ? "dark" : "light"} options={[
          { value: "light", label: t("profile.themeLight") },
          { value: "dark", label: t("profile.themeDark") },
        ]} hint={t("profile.themeHint")} />
        <FullWidth>
          <ImageDropzone name="avatar" label={t("profile.avatar")} folder="umumi" mode="single" initial={initial.avatarUrl ? [{ url: initial.avatarUrl, alt: "", isCover: true }] : []} />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
