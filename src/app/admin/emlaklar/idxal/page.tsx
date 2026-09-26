import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import { PropertyImportClient } from "./import-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.propertyImport.title") };
}

export const dynamic = "force-dynamic";

/** CSV ilə toplu elan idxalı (#103) — elanlar qaralama kimi yaranır. */
export default async function PropertyImportPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);

  return (
    <>
      <AdminPageHeader
        title={t("pages.propertyImport.title")}
        description={t("pages.propertyImport.description")}
        breadcrumbs={[
          { label: t("pages.properties.idarePaneli"), href: "/admin" },
          { label: t("pages.properties.emlaklar"), href: "/admin/emlaklar" },
          { label: t("pages.propertyImport.title") },
        ]}
      />
      <PropertyImportClient />
    </>
  );
}
