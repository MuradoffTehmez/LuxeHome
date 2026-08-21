import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { saveService } from "../actions";
import { EMPTY_SERVICE, ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Yeni xidmət" };
export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requireAdminRead(PERMISSIONS.SERVICE_MANAGE);

  return (
    <>
      <AdminPageHeader
        title="Yeni xidmət"
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Xidmətlər", href: "/admin/xidmetler" },
          { label: "Yeni xidmət" },
        ]}
      />

      <ServiceForm action={saveService} initial={EMPTY_SERVICE} submitLabel="Xidməti yarat" />
    </>
  );
}
