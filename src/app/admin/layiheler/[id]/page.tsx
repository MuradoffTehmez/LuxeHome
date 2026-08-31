import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import { getAdminProjectById, getAdminProjectPartnerLinks, getCityOptions, getPartnerOptions } from "@/lib/queries";
import { deleteProject, updateProject } from "../actions";
import type { ProjectFormValues } from "../form-values";
import { ProjectForm } from "../project-form";
import { ProjectPartnersManager } from "../project-partners-manager";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.projects.layiheninRedaktesi") };
}
export const dynamic = "force-dynamic";

const num = (value: number | null): string => (value === null ? "" : String(value));

/** `<input type="date">` yalnız `YYYY-MM-DD` formatını qəbul edir. */
const day = (value: Date | null): string => (value ? value.toISOString().slice(0, 10) : "");

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.PROJECT_MANAGE);

  const { id } = await params;
  const [project, cities, partnerLinks, partnerOptions] = await Promise.all([
    getAdminProjectById(id),
    getCityOptions(),
    getAdminProjectPartnerLinks(id),
    getPartnerOptions(),
  ]);

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
            ? t("pages.common.buLayiheTarixindeSilinib", { p0: formatDateTime(project.deletedAt) })
            : t("pages.common.sonYenilenme", { p0: formatDateTime(project.updatedAt) })
        }
        breadcrumbs={[
          { label: t("pages.projects.idarePaneli"), href: "/admin" },
          { label: t("pages.projects.layiheler"), href: "/admin/layiheler" },
          { label: t("pages.projects.redakte") },
        ]}
        actions={
          <Link
            href={localizePath(`/layiheler/${project.slug}`, locale)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t("pages.projects.saytdaBax")}
          </Link>
        }
      />

      <ProjectForm
        action={updateProject}
        initial={initial}
        cities={cities}
        submitLabel={t("pages.projects.deyisiklikleriSaxla")}
        extraActions={
          project.deletedAt ? null : (
            <ConfirmAction
              action={deleteProject}
              id={project.id}
              label={t("pages.projects.layiheniSil")}
              title={t("pages.projects.layiheniSilmek")}
              description={t("pages.projects.layiheSaytdanCixarilacaqAmma")}
              redirectTo="/admin/layiheler"
              className="mr-auto"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          )
        }
      />
      <ProjectPartnersManager projectId={project.id} links={partnerLinks} options={partnerOptions} />
    </>
  );
}
