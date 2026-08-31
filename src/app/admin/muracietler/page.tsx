import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Phone, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatPhone, formatRelative } from "@/lib/utils";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PERMISSIONS,
  type LeadSource,
  type LeadStatus,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminLeads } from "@/lib/queries";
import { deleteLead } from "./actions";
import { LeadQuickStatus } from "./lead-quick-status";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.leads.muracietler") };
}
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/muracietler";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);

  const params = await searchParams;
  const filters = {
    q: one(params, "q"),
    status: one(params, "status"),
    source: one(params, "menbe"),
    page: Number(one(params, "sehife")) || 1,
  };

  const { rows, total, page, totalPages } = await getAdminLeads(filters);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.source) query.set("menbe", filters.source);
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  function renderActions(lead: (typeof rows)[number]) {
    return (
      <>
        <Link
          href={`${LIST_PATH}/${lead.id}`}
          aria-label={`«${lead.name}» müraciətini aç`}
          title={t("pages.leads.etrafli")}
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
        <ConfirmAction
          action={deleteLead}
          id={lead.id}
          label={`«${lead.name}» müraciətini sil`}
          title={t("pages.leads.muracietiSilmek")}
          description={t("pages.leads.muracietTamamileSilinecekVe")}
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
        title={t("pages.leads.muracietler")}
        description={`Ümumilikdə ${total} müraciət tapıldı.`}
        breadcrumbs={[{ label: t("pages.leads.idarePaneli"), href: "/admin" }, { label: t("pages.leads.muracietler") }]}
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.q}
          searchPlaceholder={t("pages.leads.adTelefonEPoct")}
          resultLabel={`${total} müraciət tapıldı`}
          selects={[
            {
              name: "status",
              label: t("pages.leads.status"),
              value: filters.status,
              options: [
                { value: "", label: t("pages.leads.butunStatuslar") },
                ...Object.values(LEAD_STATUSES).map((value) => ({
                  value,
                  label: t(`labels.leadStatus.${value}`),
                })),
              ],
            },
            {
              name: "menbe",
              label: t("pages.leads.menbe"),
              value: filters.source,
              options: [
                { value: "", label: t("pages.leads.butunMenbeler") },
                ...Object.values(LEAD_SOURCES).map((value) => ({
                  value,
                  label: t(`labels.leadSource.${value}`),
                })),
              ],
            },
          ]}
        />

        <div className="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel={t("pages.leads.muracietler")}
            items={rows}
            getKey={(lead) => lead.id}
            empty={
              <p className="py-10 text-center text-sm text-ink-muted">
                {filters.q || filters.status || filters.source
                  ? "Bu filtrlərə uyğun müraciət tapılmadı."
                  : "Hələ müraciət yoxdur."}
              </p>
            }
            renderCard={(lead) => (
              <AdminListCard
                title={
                  <Link href={`${LIST_PATH}/${lead.id}`} className="transition-colors hover:text-gold-deep">
                    {lead.name}
                  </Link>
                }
                meta={
                  <a href={`tel:${lead.phone}`} className="tabular inline-flex min-h-11 items-center gap-1 transition-colors hover:text-gold-deep">
                    <Phone className="size-3" aria-hidden="true" />
                    {formatPhone(lead.phone)}
                  </a>
                }
                status={<LeadQuickStatus id={lead.id} status={lead.status as LeadStatus} name={lead.name} />}
                actions={renderActions(lead)}
              >
                <p className="[overflow-wrap:anywhere]">{lead.subject ?? lead.property?.title ?? "Mövzu yoxdur"}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.leads.menbe")}</dt>
                    <dd className="mt-1 text-ink">{t(`labels.leadSource.${lead.source as LeadSource}`)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.leads.mesul")}</dt>
                    <dd className="mt-1 text-ink">{lead.assignee?.name ?? "Təyin edilməyib"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-ink-muted">{t("pages.leads.vaxt")}</dt>
                    <dd className="mt-1 text-ink">{formatRelative(lead.createdAt)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption={t("pages.leads.muracietler")}
                headers={[
                  { label: t("pages.leads.musteri") },
                  { label: t("pages.leads.movzu") },
                  { label: t("pages.leads.menbe") },
                  { label: t("pages.leads.mesul") },
                  { label: t("pages.leads.status") },
                  { label: t("pages.leads.vaxt"), className: "text-right" },
                  { label: t("pages.leads.emeliyyatlar"), srOnly: true, className: "text-right" },
                ]}
              >
                {items.map((lead) => (
                  <AdminTableRow key={lead.id}>
                    <AdminTableCell>
                      <Link href={`${LIST_PATH}/${lead.id}`} className="font-medium text-ink transition-colors hover:text-gold-deep">{lead.name}</Link>
                      <a href={`tel:${lead.phone}`} className="tabular mt-0.5 flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-gold-deep">
                        <Phone className="size-3" aria-hidden="true" />{formatPhone(lead.phone)}
                      </a>
                    </AdminTableCell>
                    <AdminTableCell className="max-w-xs"><span className="line-clamp-1 text-sm text-ink-soft">{lead.subject ?? lead.property?.title ?? "—"}</span></AdminTableCell>
                    <AdminTableCell className="text-sm text-ink-soft">{t(`labels.leadSource.${lead.source as LeadSource}`)}</AdminTableCell>
                    <AdminTableCell className="text-sm text-ink-soft">{lead.assignee?.name ?? <span className="text-ink-muted">{t("pages.leads.teyinEdilmeyib")}</span>}</AdminTableCell>
                    <AdminTableCell><LeadQuickStatus id={lead.id} status={lead.status as LeadStatus} name={lead.name} /></AdminTableCell>
                    <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">{formatRelative(lead.createdAt)}</AdminTableCell>
                    <AdminTableCell align="right"><div className="flex items-center justify-end gap-0.5">{renderActions(lead)}</div></AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {total === 0 ? "0 müraciət göstərilir" : `${total} müraciətdən ${rows.length} göstərilir`}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
