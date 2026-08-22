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

export const metadata: Metadata = { title: "Xidmətin redaktəsi" };
export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
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
    image: service.imageUrl ? [{ url: service.imageUrl, alt: "", isCover: true }] : [],
  };

  return (
    <>
      <AdminPageHeader
        title={service.title}
        description={`Son yenilənmə: ${formatDateTime(service.updatedAt)}`}
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Xidmətlər", href: "/admin/xidmetler" },
          { label: "Redaktə" },
        ]}
        actions={
          <Link
            href={`/xidmetler/${service.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Saytda bax
          </Link>
        }
      />

      <ServiceForm
        action={saveService}
        initial={initial}
        submitLabel="Dəyişiklikləri saxla"
        extraActions={
          <ConfirmAction
            action={deleteService}
            id={service.id}
            label="Xidməti sil"
            title="Xidməti silmək"
            description="Xidmət tamamilə silinəcək və bərpa edilə bilməyəcək."
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
