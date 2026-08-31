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
import { getAdminServiceById } from "@/lib/queries";
import { deleteService, saveService } from "../actions";
import type { ServiceFormValues } from "../form-values";
import { ServiceForm } from "../service-form";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.services.xidmetinRedaktesi") };
}
export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.SERVICE_MANAGE);

  const { id } = await params;
  const service = await getAdminServiceById(id);
  if (!service) notFound();

  const initial: ServiceFormValues = {
    id: service.id,
    title: service.title,
    slug: service.slug,
    shortDescription: service.shortDescription,
    description: service.description,
    icon: service.icon,
    bullets: parseJsonArray<string>(service.bullets).join("\n"),
    order: String(service.order),
    isActive: service.isActive,
    metaTitle: service.metaTitle ?? "",
    metaDescription: service.metaDescription ?? "",
    noIndex: service.noIndex,
    canonicalUrl: service.canonicalUrl ?? "",
    ogTitle: service.ogTitle ?? "",
    ogDescription: service.ogDescription ?? "",
    ogImage: service.ogImage ?? "",
    image: service.imageUrl ? [{ url: service.imageUrl, alt: "", isCover: true }] : [],
  };

  return (
    <>
      <AdminPageHeader
        title={service.title}
        description={`Son yenilənmə: ${formatDateTime(service.updatedAt)}`}
        breadcrumbs={[
          { label: t("pages.services.idarePaneli"), href: "/admin" },
          { label: t("pages.services.xidmetler"), href: "/admin/xidmetler" },
          { label: t("pages.services.redakte") },
        ]}
        actions={
          <Link
            href={localizePath(`/xidmetler/${service.slug}`, locale)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t("pages.services.saytdaBax")}
          </Link>
        }
      />

      <ServiceForm
        action={saveService}
        initial={initial}
        submitLabel={t("pages.services.deyisiklikleriSaxla")}
        extraActions={
          <ConfirmAction
            action={deleteService}
            id={service.id}
            label={t("pages.services.xidmetiSil")}
            title={t("pages.services.xidmetiSilmek")}
            description={t("pages.services.xidmetTamamileSilinecekVe")}
            redirectTo="/admin/xidmetler"
            className="mr-auto"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </ConfirmAction>
        }
      />
    </>
  );
}
