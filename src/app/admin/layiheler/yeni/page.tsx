import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getCityOptions } from "@/lib/queries";
import { createProject } from "../actions";
import { EMPTY_PROJECT } from "../form-values";
import { ProjectForm } from "../project-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.projects.yeniLayihe") };
}
export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.PROJECT_MANAGE);
  const cities = await getCityOptions();

  return (
    <>
      <AdminPageHeader
        title={t("pages.projects.yeniLayihe")}
        breadcrumbs={[
          { label: t("pages.projects.idarePaneli"), href: "/admin" },
          { label: t("pages.projects.layiheler"), href: "/admin/layiheler" },
          { label: t("pages.projects.yeniLayihe") },
        ]}
      />

      <ProjectForm
        action={createProject}
        initial={{ ...EMPTY_PROJECT, cityId: cities[0]?.id ?? "" }}
        cities={cities}
        submitLabel={t("pages.projects.layiheniYarat")}
      />
    </>
  );
}
