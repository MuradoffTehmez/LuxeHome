import type { Metadata } from "next";
import { List, UserRound, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";
import { PERMISSIONS, type LeadStatus } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import { getLeadBoard, leadSla } from "@/lib/admin/lead-board";
import { formatRelative } from "@/lib/utils";
import { LeadBoard, type BoardColumnView } from "./lead-board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.leadBoard.title") };
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Müraciətlər lövhəsi (#105) — status sütunları, SLA xəbərdarlığı, «mənə təyin et». */
export default async function LeadBoardPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getAdminT();
  const user = await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const mine = (await searchParams).menim === "1";

  const columns = await getLeadBoard(mine ? { assigneeId: user.id } : {});
  const now = Date.now();
  const view: BoardColumnView[] = columns.map((column) => ({
    status: column.status,
    total: column.total,
    cards: column.items.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      subject: lead.subject,
      source: lead.source,
      status: lead.status as LeadStatus,
      ageLabel: formatRelative(lead.createdAt),
      assigneeName: lead.assignee?.name ?? null,
      propertyTitle: lead.property?.title ?? null,
      sla: leadSla(lead, now),
    })),
  }));
  const overdue = view.reduce((sum, column) => sum + column.cards.filter((card) => card.sla === "overdue").length, 0);

  return (
    <>
      <AdminPageHeader
        title={t("pages.leadBoard.title")}
        description={overdue > 0 ? t("pages.leadBoard.overdueSummary", { count: overdue }) : t("pages.leadBoard.description")}
        breadcrumbs={[
          { label: t("pages.leads.idarePaneli"), href: "/admin" },
          { label: t("pages.leads.muracietler"), href: "/admin/muracietler" },
          { label: t("pages.leadBoard.title") },
        ]}
        actions={
          <>
            <ButtonLink href={mine ? "/admin/muracietler/lovhe" : "/admin/muracietler/lovhe?menim=1"} variant="outline" size="sm">
              {mine ? <Users className="size-4" aria-hidden="true" /> : <UserRound className="size-4" aria-hidden="true" />}
              {mine ? t("pages.leadBoard.showAll") : t("pages.leadBoard.showMine")}
            </ButtonLink>
            <ButtonLink href="/admin/muracietler" variant="outline" size="sm">
              <List className="size-4" aria-hidden="true" />
              {t("pages.leadBoard.listView")}
            </ButtonLink>
          </>
        }
      />
      <LeadBoard columns={view} />
    </>
  );
}
