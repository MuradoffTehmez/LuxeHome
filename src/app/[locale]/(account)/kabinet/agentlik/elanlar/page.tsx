import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { ACTIVE_MEMBER_WHERE, getAgencyAccess, hasAgencyPermission } from "@/lib/accounts/agency-access";
import { AGENCY_MEMBER_PERMISSIONS, PUBLIC_PROPERTY_STATUSES, type Locale, type PropertyStatus } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { LISTING_STATUS_KEYS } from "@/lib/accounts/listing-status-keys";
import { AssignListingForm } from "./assign-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.assignments" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/agentlik/elanlar", noIndex: true, locale: locale as Locale });
}

const PAGE_SIZE = 30;

/**
 * Elan təyinatları (#218, PRD 7.2): agentlik elanlarının məsul agenti. Sahib və `LISTINGS_ASSIGN`
 * səlahiyyətli aktiv üzv görür. Filtr `?agent=<userId>` və `?sehife=` URL-dədir.
 */
export default async function AgencyAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  const access = await getAgencyAccess(user);
  if (!hasAgencyPermission(access, AGENCY_MEMBER_PERMISSIONS.LISTINGS_ASSIGN)) forbidden();
  const t = await getTranslations("account.assignments");
  const statusT = await getTranslations("account.listings.status");

  const params = await searchParams;
  const [owner, employees] = await Promise.all([
    prisma.user.findUnique({ where: { id: access.ownerUserId }, select: { name: true } }),
    prisma.agencyEmployee.findMany({
      where: { agencyId: access.agencyId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
      select: { userId: true, user: { select: { name: true } } },
      orderBy: { approvedAt: "asc" },
    }),
  ]);
  const members = [
    { userId: access.ownerUserId, name: t("agencyOption", { name: owner?.name ?? access.agencyName }) },
    ...employees.map((employee) => ({ userId: employee.userId, name: employee.user.name })),
  ];
  const memberIds = new Set(members.map((member) => member.userId));
  const agentFilter = typeof params.agent === "string" && params.agent.length <= 40 ? params.agent : null;
  const where = { agencyId: access.agencyId, deletedAt: null, ...(agentFilter ? { authorId: agentFilter } : {}) };
  const total = await prisma.property.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.parseInt(typeof params.sehife === "string" ? params.sehife : "1", 10) || 1), pages);
  const listings = await prisma.property.findMany({
    where,
    select: { id: true, title: true, slug: true, status: true, price: true, currency: true, authorId: true, author: { select: { name: true } } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const href = (next: { agent?: string | null; sehife?: number }) => {
    const query = new URLSearchParams();
    const agent = next.agent === undefined ? agentFilter : next.agent;
    if (agent) query.set("agent", agent);
    if (next.sehife && next.sehife > 1) query.set("sehife", String(next.sehife));
    const text = query.toString();
    return text ? `/kabinet/agentlik/elanlar?${text}` : "/kabinet/agentlik/elanlar";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
      active ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
    );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={access.agencyName} title={t("title")} description={t("description")} />

      <nav aria-label={t("agentFilter")} className="flex flex-wrap gap-2">
        <Link href={href({ agent: null, sehife: 1 })} className={chip(!agentFilter)}>{t("all")}</Link>
        {members.map((member) => (
          <Link key={member.userId} href={href({ agent: member.userId, sehife: 1 })} className={chip(agentFilter === member.userId)}>{member.name}</Link>
        ))}
      </nav>

      {listings.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => {
            const isPublic = (PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(listing.status);
            // Ayrılmış və ya dayandırılmış agentin elanı «məsulsuz» kimi göstərilir — yeni məsul seçilməlidir.
            const currentId = listing.authorId && memberIds.has(listing.authorId) ? listing.authorId : null;
            return (
              <li key={listing.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-paper p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink [overflow-wrap:anywhere]">
                    {isPublic ? <Link href={`/emlaklar/${listing.slug}`} className="hover:text-gold-deep">{listing.title}</Link> : listing.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                    <Badge tone={isPublic ? "success" : "neutral"}>{statusT(LISTING_STATUS_KEYS[listing.status as PropertyStatus] ?? "draft")}</Badge>
                    <span className="tabular">{formatPrice(listing.price, listing.currency)}</span>
                    <span>· {currentId ? t("owner", { name: listing.author?.name ?? "—" }) : t("unassigned")}</span>
                  </p>
                </div>
                <AssignListingForm propertyId={listing.id} title={listing.title} currentUserId={currentId} members={members} />
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={t("pagination")} className="flex items-center justify-between gap-3 text-sm">
          {page > 1 ? <Link href={href({ sehife: page - 1 })} className={chip(false)}>{t("previous")}</Link> : <span />}
          <span className="text-ink-muted">{t("pageOf", { page, pages })}</span>
          {page < pages ? <Link href={href({ sehife: page + 1 })} className={chip(false)}>{t("next")}</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
