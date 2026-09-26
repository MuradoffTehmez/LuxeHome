"use client";

import { useTranslations } from "next-intl";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { FullWidth } from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { saveSiteImages } from "./actions";

type SiteImagesFormProps = { hero: string; about: string; cta: string };

const initialOf = (url: string) => (url ? [{ url, alt: "", isCover: true }] : []);

/**
 * Saytın brend şəkilləri (#103). Boş sahə stok fotonu saxlayır — şəkli silmək
 * parametri sıfırlayır və stok foto geri qayıdır.
 */
export function SiteImagesForm({ hero, about, cta }: SiteImagesFormProps) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveSiteImages} submitLabel={t("pages.settings.siteImages.save")} className="gap-4">
      <FormSection title={t("pages.settings.siteImages.title")} description={t("pages.settings.siteImages.hint")}>
        <FullWidth>
          <ImageDropzone name="heroImage" label={t("pages.settings.siteImages.hero")} folder="umumi" mode="single" initial={initialOf(hero)} />
        </FullWidth>
        <FullWidth>
          <ImageDropzone name="aboutImage" label={t("pages.settings.siteImages.about")} folder="umumi" mode="single" initial={initialOf(about)} />
        </FullWidth>
        <FullWidth>
          <ImageDropzone name="ctaImage" label={t("pages.settings.siteImages.cta")} folder="umumi" mode="single" initial={initialOf(cta)} />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
