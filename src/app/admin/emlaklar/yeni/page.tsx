import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getPropertyFormOptions } from "@/lib/queries";
import { createProperty } from "../actions";
import { EMPTY_PROPERTY } from "../form-values";
import { PropertyForm } from "../property-form";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.properties.yeniElan") };
}
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const t = await getAdminT();
  // Layout guard-ı sessiyanı yoxlayır; burada əlavə olaraq səlahiyyət tələb olunur —
  // EDITOR rolu bloq idarə edir, əmlak yarada bilmir
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);

  const options = await getPropertyFormOptions();

  return (
    <>
      <AdminPageHeader
        title={t("pages.properties.yeniElan")}
        description={t("pages.properties.elanQaralamaKimiSaxlanila")}
        breadcrumbs={[
          { label: t("pages.properties.idarePaneli"), href: "/admin" },
          { label: t("pages.properties.emlaklar"), href: "/admin/emlaklar" },
          { label: t("pages.properties.yeniElan") },
        ]}
      />

      <PropertyForm
        action={createProperty}
        options={options}
        initial={{
          ...EMPTY_PROPERTY,
          typeId: options.types[0]?.id ?? "",
          cityId: options.cities[0]?.id ?? "",
        }}
        submitLabel={t("pages.properties.elaniYarat")}
      />
    </>
  );
}
