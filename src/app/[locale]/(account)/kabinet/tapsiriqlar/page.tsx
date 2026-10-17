import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarClock, ClipboardList, Link2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { bakuDay } from "@/lib/listing-stats";
import { getAgencyAccess } from "@/lib/accounts/agency-access";
import { canManageTasks, getTaskFormOptions, isTaskOverdue, isTaskView, listAgencyTasks, type TaskView } from "@/lib/accounts/agency-tasks";
import {
  ACCOUNT_TYPES,
  AGENCY_TASK_STATUSES,
  PUBLIC_PROPERTY_STATUSES,
  type AgencyTaskStatus,
  type AgencyTaskType,
  type Locale,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TaskCreateForm, TaskStatusSelect } from "./task-forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.tasks" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/tapsiriqlar", noIndex: true, locale: locale as Locale });
}

const VIEWS: TaskView[] = ["open", "done", "cancelled", "all"];
const STATUS_TONE: Record<AgencyTaskStatus, "info" | "warning" | "success" | "neutral" | "danger"> = {
  NEW: "info",
  IN_PROGRESS: "warning",
  ON_HOLD: "neutral",
  DONE: "success",
  CANCELLED: "neutral",
};

/**
 * Agentlik → Tapşırıqlar (#220, PRD 7.3). İdarəçi (sahib, `TASKS_MANAGE`) bütün tapşırıqları görür və
 * icraçı üzrə süzür; digər üzv ona təyin olunanları və özünün yaratdıqlarını görür.
 */
export default async function AgencyTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY && user.accountType !== ACCOUNT_TYPES.AGENT) forbidden();
  const t = await getTranslations("account.tasks");
  const access = await getAgencyAccess(user);
  if (!access || access.suspended) {
    return (
      <div className="min-w-0">
        <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-8">
          <EmptyState title={access?.suspended ? t("suspendedTitle") : t("noAgencyTitle")} description={access?.suspended ? t("suspendedDescription") : t("noAgencyDescription")} />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const view: TaskView = isTaskView(params.gorunus) ? params.gorunus : "open";
  const manage = canManageTasks(access);
  const assigneeFilter = manage && typeof params.icraci === "string" && params.icraci.length <= 40 ? params.icraci : null;
  const now = new Date();
  const [tasks, options] = await Promise.all([
    listAgencyTasks({ access, userId: user.id, view, assigneeId: assigneeFilter }),
    getTaskFormOptions(access),
  ]);

  const href = (next: { gorunus?: TaskView; icraci?: string | null }) => {
    const query = new URLSearchParams();
    const nextView = next.gorunus ?? view;
    const nextAssignee = next.icraci === undefined ? assigneeFilter : next.icraci;
    if (nextView !== "open") query.set("gorunus", nextView);
    if (nextAssignee) query.set("icraci", nextAssignee);
    const text = query.toString();
    return text ? `/kabinet/tapsiriqlar?${text}` : "/kabinet/tapsiriqlar";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
      active ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
    );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={access.agencyName} title={t("title")} description={manage ? t("descriptionManager") : t("description")} />

      <section className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-6">
        <h2 className="mb-4 font-sans text-lg font-semibold text-ink">{t("form.heading")}</h2>
        <TaskCreateForm assignees={manage ? options.assignees : null} properties={options.properties} leads={options.leads} today={bakuDay(now)} />
      </section>

      <div className="flex flex-col gap-3">
        <nav aria-label={t("viewLabel")} className="flex flex-wrap gap-2">
          {VIEWS.map((value) => (
            <Link key={value} href={href({ gorunus: value })} className={chip(view === value)} aria-current={view === value ? "page" : undefined}>
              {t(`views.${value}`)}
            </Link>
          ))}
        </nav>
        {manage && options.assignees.length > 1 && (
          <nav aria-label={t("assigneeFilter")} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-muted">{t("assigneeFilter")}:</span>
            <Link href={href({ icraci: null })} className={chip(!assigneeFilter)}>{t("everyone")}</Link>
            {options.assignees.map((assignee) => (
              <Link key={assignee.value} href={href({ icraci: assignee.value })} className={chip(assigneeFilter === assignee.value)}>{assignee.label}</Link>
            ))}
          </nav>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => {
            const status = task.status as AgencyTaskStatus;
            const overdue = isTaskOverdue(task, now);
            const isAssignee = task.assigneeId === user.id;
            const isCreator = task.createdById === user.id;
            const propertyPublic = task.property && !task.property.deletedAt && (PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(task.property.status);
            return (
              <li key={task.id} className={cn("rounded-xl border bg-paper p-4 shadow-xs", overdue ? "border-danger/40" : "border-line")}>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <ClipboardList className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink [overflow-wrap:anywhere]">{task.title}</span>
                      <Badge tone={STATUS_TONE[status] ?? "neutral"}>{t(`statuses.${status}`)}</Badge>
                      <Badge tone="neutral">{t(`types.${task.type as AgencyTaskType}`)}</Badge>
                      {overdue && <Badge tone="danger">{t("overdue")}</Badge>}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                      <span>{t("assignee", { name: task.assigneeName ?? "—" })}</span>
                      {task.creatorName && task.createdById !== task.assigneeId && <span>{t("creator", { name: task.creatorName })}</span>}
                      {task.dueAt && (
                        <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-danger")}>
                          <CalendarClock className="size-3.5" aria-hidden="true" />
                          {t("due", { date: formatLocalizedDate(task.dueAt, locale, "short") ?? "" })}
                        </span>
                      )}
                      {status === AGENCY_TASK_STATUSES.DONE && task.completedAt && (
                        <span>{t("completed", { date: formatLocalizedDate(task.completedAt, locale, "short") ?? "" })}</span>
                      )}
                    </p>
                    {(task.property || task.lead) && (
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                        {task.property && (
                          <span className="inline-flex items-center gap-1">
                            <Link2 className="size-3.5" aria-hidden="true" />
                            {propertyPublic ? <Link href={`/emlaklar/${task.property.slug}`} className="underline-offset-4 hover:text-gold-deep hover:underline">{task.property.title}</Link> : task.property.title}
                          </span>
                        )}
                        {task.lead && (
                          <Link href="/kabinet/muracietler" className="inline-flex items-center gap-1 underline-offset-4 hover:text-gold-deep hover:underline">
                            <MessageSquare className="size-3.5" aria-hidden="true" />
                            {task.lead.name}
                          </Link>
                        )}
                      </p>
                    )}
                    {task.description && <p className="mt-2 text-sm text-ink-soft whitespace-pre-line [overflow-wrap:anywhere]">{task.description}</p>}
                  </div>
                  <TaskStatusSelect id={task.id} status={status} canProgress={manage || isAssignee} canCancel={manage || isCreator} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
