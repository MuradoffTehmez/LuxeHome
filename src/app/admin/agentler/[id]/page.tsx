import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS, type ReviewStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import { AgentForm, type AgentFormValues } from "../agent-form";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.agents.agentProfilininRedaktesi") };
}
export const dynamic = "force-dynamic";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.USER_MANAGE);

  const { id } = await params;
  const [agent, users, agencies] = await Promise.all([
    prisma.agentProfile.findUnique({
      where: { id },
      include: { reviews: { orderBy: { createdAt: "desc" }, take: 20 } },
    }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!agent) notFound();

  const initial: AgentFormValues = {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    userId: agent.userId ?? "",
    agencyId: agent.agencyId ?? "",
    roleTitle: agent.roleTitle ?? "",
    specialization: agent.specialization ?? "",
    experienceYears: agent.experienceYears != null ? String(agent.experienceYears) : "",
    phone: agent.phone ?? "",
    whatsapp: agent.whatsapp ?? "",
    email: agent.email ?? "",
    languages: parseJsonArray<string>(agent.languages).join("\n"),
    areas: parseJsonArray<string>(agent.areas).join("\n"),
    bio: agent.bio ?? "",
    soldCount: String(agent.soldCount),
    rentedCount: String(agent.rentedCount),
    responseMinutes: agent.responseMinutes != null ? String(agent.responseMinutes) : "",
    avatarUrl: agent.avatarUrl,
    isVerified: agent.isVerified,
    isPublic: agent.isPublic,
  };

  return (
    <>
      <AdminPageHeader
        title={agent.name}
        description={t("pages.common.sonYenilenme", { p0: formatDateTime(agent.updatedAt) })}
        breadcrumbs={[
          { label: t("pages.agents.idarePaneli"), href: "/admin" },
          { label: t("pages.agents.agentlerVeReyler"), href: "/admin/agentler" },
          { label: t("pages.agents.redakte") },
        ]}
        actions={
          agent.isPublic ? (
            <Link
              href={localizePath(`/agentler/${agent.slug}`, locale)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t("pages.agents.saytdaBax")}
            </Link>
          ) : null
        }
      />

      <AgentForm
        initial={initial}
        users={users.map((user) => ({ id: user.id, label: `${user.name} · ${user.email}` }))}
        agencies={agencies.map((agency) => ({ id: agency.id, label: agency.name }))}
      />

      <AdminCard title={t("pages.agents.butunReyler")} description={t("pages.agents.moderasiyaNovbesiSiyahiSehifesindedir")} className="mt-6" bodyClassName="p-0">
        {agent.reviews.length === 0 ? (
          <div className="p-5"><EmptyState title={t("pages.agents.reyYoxdur")} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {agent.reviews.map((review) => (
              <li key={review.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{review.customerName}</p>
                  <span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" /> {review.rating}</span>
                  <Badge tone={review.status === "APPROVED" ? "success" : review.status === "PENDING" ? "warning" : "neutral"}>
                    {t(`labels.reviewStatus.${review.status as ReviewStatus}`) ?? review.status}
                  </Badge>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-ink-soft">{review.comment}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatDateTime(review.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
