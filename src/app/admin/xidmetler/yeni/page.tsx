import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { saveService } from "../actions";
import { EMPTY_SERVICE } from "../form-values";
import { ServiceForm } from "../service-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.services.yeniXidmet") };
}
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.SERVICE_MANAGE);

  return (
    <>
      <AdminPageHeader
        title={t("pages.services.yeniXidmet")}
        breadcrumbs={[
          { label: t("pages.services.idarePaneli"), href: "/admin" },
          { label: t("pages.services.xidmetler"), href: "/admin/xidmetler" },
          { label: t("pages.services.yeniXidmet") },
        ]}
      />

      <ServiceForm action={saveService} initial={EMPTY_SERVICE} submitLabel={t("pages.services.xidmetiYarat")} />
    </>
  );
}
