import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { History } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDateTime } from "@/i18n/date";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { formatPrice, cn } from "@/lib/utils";
import { getAgencyForOwner } from "@/lib/queries";
import { getAgencyActivity, isAgencyActivityGroup } from "@/lib/accounts/agency-activity";
import { isAgencyEmployeeRole, isAgencyMemberPermission } from "@/lib/accounts/agency-access";
import { isAgencyTaskStatus } from "@/lib/accounts/agency-tasks";
import {
  ACCOUNT_TYPES,
  AGENCY_ACTIVITY_ACTIONS,
  AGENCY_ACTIVITY_GROUPS,
  LEAD_ROUTING_MODES,
  type AgencyActivityAction,
  type AgencyActivityGroup,
  type Locale,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.activity" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/fealiyyet", noIndex: true, locale: locale as Locale });
}

const GROUPS = Object.keys(AGENCY_ACTIVITY_GROUPS) as AgencyActivityGroup[];
const ACTIONS = new Set<string>(Object.values(AGENCY_ACTIVITY_ACTIONS));
const ROUTING_KEYS = { [LEAD_ROUTING_MODES.ROUND_ROBIN]: "roundRobin", [LEAD_ROUTING_MODES.AREA]: "area", [LEAD_ROUTING_MODES.OFF]: "off" } as const;

type Details = Record<string, string | number | boolean | null>;

/**
 * Agentlik daxili fəaliyyət jurnalı (#214, PRD 7.4) — yalnız agentlik sahibi görür.
 * Filtr və səhifə URL-dədir (`?qrup=`, `?kim=`, `?sehife=`), ona görə link paylaşıla bilir.
 */
export default async function AgencyActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) forbidden();
  const t = await getTranslations("account.activity");
  const routingT = await getTranslations("account.team.routing");
  const agency = await getAgencyForOwner(user.id);
  if (!agency) {
    return (
      <div className="min-w-0">
        <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-8"><EmptyState title={t("noAgency")} description={t("noAgencyDescription")} /></div>
      </div>
    );
  }

  const params = await searchParams;
  const group = isAgencyActivityGroup(params.qrup) ? params.qrup : null;
  const actorId = typeof params.kim === "string" && params.kim.length <= 40 ? params.kim : null;
  const page = Number.parseInt(typeof params.sehife === "string" ? params.sehife : "1", 10) || 1;
  const data = await getAgencyActivity({ agencyId: agency.id, group, actorId, page });

  const href = (next: { qrup?: string | null; kim?: string | null; sehife?: number }) => {
    const query = new URLSearchParams();
    const nextGroup = next.qrup === undefined ? group : next.qrup;
    const nextActor = next.kim === undefined ? actorId : next.kim;
    if (nextGroup) query.set("qrup", nextGroup);
    if (nextActor) query.set("kim", nextActor);
    if (next.sehife && next.sehife > 1) query.set("sehife", String(next.sehife));
    const text = query.toString();
    return text ? `/kabinet/fealiyyet?${text}` : "/kabinet/fealiyyet";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
      active ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
    );

  const detailText = (action: string, details: Details): string | null => {
    if (action === AGENCY_ACTIVITY_ACTIONS.PRICE_CHANGED && typeof details.from === "number" && typeof details.to === "number") {
      const currency = typeof details.currency === "string" ? details.currency : undefined;
      return t("details.price", { from: formatPrice(details.from, currency), to: formatPrice(details.to, currency) });
    }
    if ((action === AGENCY_ACTIVITY_ACTIONS.MEMBER_REMOVED || action === AGENCY_ACTIVITY_ACTIONS.MEMBER_LEFT) && typeof details.handedOver === "number" && details.handedOver > 0) {
      return t("details.handedOver", { count: details.handedOver });
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.MEMBER_RIGHTS_CHANGED && typeof details.receivesLeads === "boolean") {
      return details.receivesLeads ? t("details.leadsOn") : t("details.leadsOff");
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.MEMBER_RIGHTS_CHANGED && typeof details.permissions === "string") {
      const list = details.permissions.split(",").filter(isAgencyMemberPermission).map((permission) => t(`permissionNames.${permission}`));
      return list.length ? t("details.permissions", { list: list.join(", ") }) : t("details.noPermissions");
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.MEMBER_ROLE_CHANGED && isAgencyEmployeeRole(details.from) && isAgencyEmployeeRole(details.to)) {
      return t("details.role", { from: t(`roleNames.${details.from}`), to: t(`roleNames.${details.to}`) });
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.MEMBER_SUSPENDED) {
      const parts = [
        typeof details.releasedLeads === "number" && details.releasedLeads > 0 ? t("details.releasedLeads", { count: details.releasedLeads }) : null,
        typeof details.reason === "string" ? t("details.reason", { reason: details.reason }) : null,
      ].filter(Boolean);
      return parts.length ? parts.join(" · ") : null;
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.TASK_STATUS_CHANGED && isAgencyTaskStatus(details.from) && isAgencyTaskStatus(details.to)) {
      return t("details.taskStatus", { from: t(`taskStatusNames.${details.from}`), to: t(`taskStatusNames.${details.to}`) });
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.LISTING_ASSIGNED && typeof details.to === "string") {
      return typeof details.from === "string" ? t("details.assigned", { from: details.from, to: details.to }) : t("details.to", { name: details.to });
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.LEAD_ROUTING_CHANGED && typeof details.mode === "string" && Object.hasOwn(ROUTING_KEYS, details.mode)) {
      return t("details.routing", { mode: routingT(ROUTING_KEYS[details.mode as keyof typeof ROUTING_KEYS]) });
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.LEAD_REASSIGNED && typeof details.to === "string") return t("details.to", { name: details.to });
    if (action === AGENCY_ACTIVITY_ACTIONS.PACKAGE_REQUESTED && typeof details.packageName === "string") return t("details.package", { name: details.packageName });
    if (action === AGENCY_ACTIVITY_ACTIONS.TRANSFER_REQUESTED && typeof details.from === "string" && typeof details.to === "string") {
      return t("details.transfer", { from: details.from, to: details.to });
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.TRANSFER_DECIDED && typeof details.approved === "boolean") {
      return t(`details.transfer${details.stage === "admin" ? "Admin" : "Source"}${details.approved ? "Approved" : "Rejected"}`);
    }
    if (action === AGENCY_ACTIVITY_ACTIONS.MEMBER_APPROVED && details.source === "LINK") return t("details.viaLink");
    return null;
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <nav aria-label={t("filters")} className="flex flex-wrap gap-2">
        <Link href={href({ qrup: null, sehife: 1 })} className={chip(!group)} aria-current={!group ? "page" : undefined}>{t("groups.all")}</Link>
        {GROUPS.map((value) => (
          <Link key={value} href={href({ qrup: value, sehife: 1 })} className={chip(group === value)} aria-current={group === value ? "page" : undefined}>
            {t(`groups.${value}`)}
          </Link>
        ))}
      </nav>

      {data.actors.length > 1 && (
        <nav aria-label={t("actorFilter")} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">{t("actorFilter")}:</span>
          <Link href={href({ kim: null, sehife: 1 })} className={chip(!actorId)}>{t("everyone")}</Link>
          {data.actors.map((actor) => (
            <Link key={actor.id} href={href({ kim: actor.id, sehife: 1 })} className={chip(actorId === actor.id)}>{actor.name}</Link>
          ))}
        </nav>
      )}

      {data.items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <section className="rounded-xl border border-line bg-paper shadow-xs">
          <ol className="divide-y divide-line">
            {data.items.map((item) => {
              const known = ACTIONS.has(item.action);
              const detail = known ? detailText(item.action, item.details) : null;
              return (
                <li key={item.id} className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <History className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm text-ink [overflow-wrap:anywhere]">
                        <span className="font-medium">{item.actorId ? item.actorName : t("platform")}</span>{" "}
                        {known ? t(`actions.${item.action as AgencyActivityAction}`, { entity: item.entityLabel ?? "—" }) : item.action}
                      </p>
                      {detail && <p className="mt-0.5 text-xs text-ink-muted [overflow-wrap:anywhere]">{detail}</p>}
                    </div>
                  </div>
                  <time dateTime={item.createdAt.toISOString()} className="shrink-0 pl-7 text-xs text-ink-muted sm:pl-0">
                    {formatLocalizedDateTime(item.createdAt, locale, "short")}
                  </time>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {data.pages > 1 && (
        <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 text-sm">
          {data.page > 1 ? <Link href={href({ sehife: data.page - 1 })} className={chip(false)}>{t("previous")}</Link> : <span />}
          <span className="text-ink-muted">{t("pageOf", { page: data.page, pages: data.pages })}</span>
          {data.page < data.pages ? <Link href={href({ sehife: data.page + 1 })} className={chip(false)}>{t("next")}</Link> : <span />}
        </nav>
      )}

      <p className="text-xs text-ink-muted">{t("privacy")}</p>
    </div>
  );
}
