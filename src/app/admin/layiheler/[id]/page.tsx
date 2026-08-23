import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import { getAdminProjectById, getCityOptions } from "@/lib/queries";
import { deleteProject, updateProject } from "../actions";
import type { ProjectFormValues } from "../form-values";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "Layihənin redaktəsi" };
export const dynamic = "force-dynamic";

const num = (value: number | null): string => (value === null ? "" : String(value));

/** `<input type="date">` yalnız `YYYY-MM-DD` formatını qəbul edir. */
const day = (value: Date | null): string => (value ? value.toISOString().slice(0, 10) : "");

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRead(PERMISSIONS.PROJECT_MANAGE);

  const { id } = await params;
  const [project, cities] = await Promise.all([getAdminProjectById(id), getCityOptions()]);

  if (!project) notFound();

  const timeline = parseJsonArray<{ title: string; done: boolean }>(project.timeline);

  const initial: ProjectFormValues = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    summary: project.summary ?? "",
    projectType: project.projectType,
    status: project.status,
    cityId: project.cityId ?? "",
    address: project.address ?? "",
    latitude: num(project.latitude),
    longitude: num(project.longitude),
    startDate: day(project.startDate),
    deliveryDate: day(project.deliveryDate),
    year: num(project.year),
    totalArea: num(project.totalArea),
    floors: num(project.floors),
    unitCount: num(project.unitCount),
    highlights: parseJsonArray<string>(project.highlights).join("\n"),
    timeline: timeline.map((step) => (step.done ? `[x] ${step.title}` : step.title)).join("\n"),
    isActive: project.isActive,
    order: String(project.order),
    metaTitle: project.metaTitle ?? "",
    metaDescription: project.metaDescription ?? "",
    noIndex: project.noIndex,
    canonicalUrl: project.canonicalUrl ?? "",
    ogTitle: project.ogTitle ?? "",
    ogDescription: project.ogDescription ?? "",
    ogImage: project.ogImage ?? "",
    images: project.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      isCover: image.url === project.coverUrl,
    })),
  };

  return (
    <>
      <AdminPageHeader
        title={project.name}
        description={
          project.deletedAt
            ? `Bu layihə ${formatDateTime(project.deletedAt)} tarixində silinib.`
            : `Son yenilənmə: ${formatDateTime(project.updatedAt)}`
        }
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Layihələr", href: "/admin/layiheler" },
          { label: "Redaktə" },
        ]}
        actions={
          <Link
            href={`/layiheler/${project.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Saytda bax
          </Link>
        }
      />

      <ProjectForm
        action={updateProject}
        initial={initial}
        cities={cities}
        submitLabel="Dəyişiklikləri saxla"
        extraActions={
          project.deletedAt ? null : (
            <ConfirmAction
              action={deleteProject}
              id={project.id}
              label="Layihəni sil"
              title="Layihəni silmək"
              description="Layihə saytdan çıxarılacaq, amma zibil qutusunda qalacaq."
              redirectTo="/admin/layiheler"
              className="mr-auto"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          )
        }
      />
    </>
  );
}
