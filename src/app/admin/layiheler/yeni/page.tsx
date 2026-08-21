import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getCityOptions } from "@/lib/queries";
import { createProject } from "../actions";
import { EMPTY_PROJECT, ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "Yeni layihə" };
export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdminRead(PERMISSIONS.PROJECT_MANAGE);
  const cities = await getCityOptions();

  return (
    <>
      <AdminPageHeader
        title="Yeni layihə"
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Layihələr", href: "/admin/layiheler" },
          { label: "Yeni layihə" },
        ]}
      />

      <ProjectForm
        action={createProject}
        initial={{ ...EMPTY_PROJECT, cityId: cities[0]?.id ?? "" }}
        cities={cities}
        submitLabel="Layihəni yarat"
      />
    </>
  );
}
