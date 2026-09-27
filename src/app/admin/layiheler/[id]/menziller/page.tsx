import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { EmptyState } from "@/components/ui/states";
import { PERMISSIONS, type ProjectUnitStatus } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import { prisma } from "@/lib/prisma";
import { groupUnitsForGrid, unitSummary } from "@/lib/project-units";
import { deleteProjectBlock } from "./actions";
import { UnitGeneratorForm, UnitRow } from "./units-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.projectUnits.title") };
}

export const dynamic = "force-dynamic";

/** Layihənin mənzil şahmatı (#107): generator və mənzil üzrə status/qiymət. */
export default async function ProjectUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.PROJECT_MANAGE);
  const { id } = await params;

  const [project, units] = await Promise.all([
    prisma.project.findUnique({ where: { id }, select: { id: true, name: true } }),
    prisma.projectUnit.findMany({ where: { projectId: id }, orderBy: [{ block: "asc" }, { floor: "desc" }, { number: "asc" }] }),
  ]);
  if (!project) notFound();

  const views = units.map((unit) => ({ ...unit, status: unit.status as ProjectUnitStatus }));
  const grid = groupUnitsForGrid(views);
  const summary = unitSummary(views);

  return (
    <>
      <AdminPageHeader
        title={t("pages.projectUnits.title")}
        description={t("pages.projectUnits.summary", { name: project.name, total: summary.total, available: summary.available, reserved: summary.reserved, sold: summary.sold })}
        breadcrumbs={[
          { label: t("pages.projects.idarePaneli"), href: "/admin" },
          { label: t("pages.projects.layiheler"), href: "/admin/layiheler" },
          { label: project.name, href: `/admin/layiheler/${project.id}` },
          { label: t("pages.projectUnits.title") },
        ]}
      />

      <div className="mb-6">
        <UnitGeneratorForm projectId={project.id} />
      </div>

      {grid.length === 0 ? (
        <AdminCard>
          <EmptyState title={t("pages.projectUnits.empty")} description={t("pages.projectUnits.emptyHint")} />
        </AdminCard>
      ) : (
        <div className="flex flex-col gap-6">
          {grid.map((block) => (
            <AdminCard
              key={block.block}
              title={t("pages.projectUnits.block", { block: block.block })}
              actions={
                <ConfirmAction
                  action={deleteProjectBlock}
                  id={`${project.id}::${block.block}`}
                  label={t("pages.projectUnits.deleteBlock", { block: block.block })}
                  title={t("pages.projectUnits.deleteBlock", { block: block.block })}
                  description={t("pages.projectUnits.deleteBlockHint")}
                  className="size-11"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </ConfirmAction>
              }
            >
              <div className="flex flex-col gap-5">
                {block.floors.map((floor) => (
                  <section key={floor.floor} aria-label={t("pages.projectUnits.floor", { floor: floor.floor })}>
                    <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      {t("pages.projectUnits.floor", { floor: floor.floor })}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {floor.units.map((unit) => <UnitRow key={unit.id} unit={unit} />)}
                    </div>
                  </section>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </>
  );
}
