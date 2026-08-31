import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ServiceIcon } from "@/components/site/service-icon";
import { formatRelative } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminServices } from "@/lib/queries";
import { deleteService } from "./actions";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "Xidmətlər" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/xidmetler";

export default async function AdminServicesPage() {
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.SERVICE_MANAGE);
  const services = await getAdminServices();

  function renderActions(service: (typeof services)[number]) {
    return (
      <>
        <Link
          href={localizePath(`/xidmetler/${service.slug}`, locale)}
          target="_blank"
          rel="noreferrer"
          aria-label={`«${service.title}» xidmətini saytda aç`}
          title="Saytda bax"
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href={`${LIST_PATH}/${service.id}`}
          aria-label={`«${service.title}» xidmətini redaktə et`}
          title="Redaktə et"
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
        <ConfirmAction
          action={deleteService}
          id={service.id}
          label={`«${service.title}» xidmətini sil`}
          title="Xidməti silmək"
          description="Xidmət tamamilə silinəcək və bərpa edilə bilməyəcək. Müvəqqəti gizlətmək üçün «Saytda göstərilsin» seçimini söndürün."
          className="size-11"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Xidmətlər"
        description={`${services.length} xidmət. Sıra kiçikdən böyüyə göstərilir.`}
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Xidmətlər" }]}
        actions={
          <ButtonLink href={`${LIST_PATH}/yeni`} variant="primary" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Yeni xidmət
          </ButtonLink>
        }
      />

      <AdminCard bodyClassName="p-4 lg:p-0">
        <AdminResponsiveList
          ariaLabel="Xidmətlər"
          items={services}
          getKey={(service) => service.id}
          empty={<p className="py-10 text-center text-sm text-ink-muted">Hələ xidmət əlavə edilməyib.</p>}
          renderCard={(service) => (
            <AdminListCard
              title={
                <span className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xs bg-beige text-ink-soft">
                    <ServiceIcon name={service.icon} className="size-4.5" />
                  </span>
                  <Link
                    href={`${LIST_PATH}/${service.id}`}
                    className="inline-flex min-h-11 items-center transition-colors hover:text-gold-deep"
                  >
                    {service.title}
                  </Link>
                </span>
              }
              meta={service.shortDescription}
              status={<Badge tone={service.isActive ? "success" : "neutral"}>{service.isActive ? "Aktiv" : "Gizli"}</Badge>}
              actions={renderActions(service)}
            >
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-ink-muted">Sıra</dt>
                  <dd className="tabular mt-1 text-ink">{service.order}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Yenilənib</dt>
                  <dd className="mt-1 text-ink">{formatRelative(service.updatedAt)}</dd>
                </div>
              </dl>
            </AdminListCard>
          )}
          renderTable={(items) => (
            <AdminTable
              caption="Xidmətlər"
              headers={[
                { label: "Xidmət" },
                { label: "Vəziyyət" },
                { label: "Sıra", className: "text-right" },
                { label: "Yenilənib", className: "text-right" },
                { label: "Əməliyyatlar", srOnly: true, className: "text-right" },
              ]}
            >
              {items.map((service) => (
                <AdminTableRow key={service.id}>
                  <AdminTableCell className="max-w-md">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-xs bg-beige text-ink-soft">
                        <ServiceIcon name={service.icon} className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <Link href={`${LIST_PATH}/${service.id}`} className="font-medium text-ink transition-colors hover:text-gold-deep">{service.title}</Link>
                        <p className="line-clamp-1 mt-0.5 text-xs text-ink-muted">{service.shortDescription}</p>
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <Badge tone={service.isActive ? "success" : "neutral"}>{service.isActive ? "Aktiv" : "Gizli"}</Badge>
                  </AdminTableCell>
                  <AdminTableCell align="right" className="tabular text-sm text-ink-soft">{service.order}</AdminTableCell>
                  <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">{formatRelative(service.updatedAt)}</AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex items-center justify-end gap-0.5">{renderActions(service)}</div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        />
      </AdminCard>
    </>
  );
}
