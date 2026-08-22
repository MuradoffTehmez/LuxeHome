import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getPropertyFormOptions } from "@/lib/queries";
import { createProperty } from "../actions";
import { EMPTY_PROPERTY } from "../form-values";
import { PropertyForm } from "../property-form";

export const metadata: Metadata = { title: "Yeni elan" };
export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  // Layout guard-ı sessiyanı yoxlayır; burada əlavə olaraq səlahiyyət tələb olunur —
  // EDITOR rolu bloq idarə edir, əmlak yarada bilmir
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);

  const options = await getPropertyFormOptions();

  return (
    <>
      <AdminPageHeader
        title="Yeni elan"
        description="Elan qaralama kimi saxlanıla və sonra dərc edilə bilər."
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Əmlaklar", href: "/admin/emlaklar" },
          { label: "Yeni elan" },
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
        submitLabel="Elanı yarat"
      />
    </>
  );
}
