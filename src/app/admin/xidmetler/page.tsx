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
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ServiceIcon } from "@/components/site/service-icon";
import { formatRelative } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminServices } from "@/lib/queries";
import { deleteService } from "./actions";

export const metadata: Metadata = { title: "Xidmətlər" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/xidmetler";

export default async function AdminServicesPage() {
  await requireAdminRead(PERMISSIONS.SERVICE_MANAGE);
  const services = await getAdminServices();

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

      <AdminCard bodyClassName="p-0">
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
          {services.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                Hələ xidmət əlavə edilməyib.
              </td>
            </tr>
          )}
          {services.map((service) => (
            <AdminTableRow key={service.id}>
              <AdminTableCell className="max-w-md">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xs bg-beige text-ink-soft">
                    <ServiceIcon name={service.icon} className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`${LIST_PATH}/${service.id}`}
                      className="font-medium text-ink transition-colors hover:text-gold-deep"
                    >
                      {service.title}
                    </Link>
                    <p className="line-clamp-1 mt-0.5 text-xs text-ink-muted">
                      {service.shortDescription}
                    </p>
                  </div>
                </div>
              </AdminTableCell>

              <AdminTableCell>
                <Badge tone={service.isActive ? "success" : "neutral"}>
                  {service.isActive ? "Aktiv" : "Gizli"}
                </Badge>
              </AdminTableCell>

              <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                {service.order}
              </AdminTableCell>

              <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                {formatRelative(service.updatedAt)}
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex items-center justify-end gap-0.5">
                  <Link
                    href={`/xidmetler/${service.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`«${service.title}» xidmətini saytda aç`}
                    title="Saytda bax"
                    className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`${LIST_PATH}/${service.id}`}
                    aria-label={`«${service.title}» xidmətini redaktə et`}
                    title="Redaktə et"
                    className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={deleteService}
                    id={service.id}
                    label={`«${service.title}» xidmətini sil`}
                    title="Xidməti silmək"
                    description="Xidmət tamamilə silinəcək və bərpa edilə bilməyəcək. Müvəqqəti gizlətmək üçün «Saytda göstərilsin» seçimini söndürün."
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
