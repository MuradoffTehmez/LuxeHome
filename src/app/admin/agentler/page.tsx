import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Eye, EyeOff, Pencil, Star, Trash2, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminForm } from "@/components/admin/form-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import { AgentForm, EMPTY_AGENT_FORM } from "./agent-form";
import {
  approveAgentReview,
  createTestimonial,
  deleteAgentProfile,
  deleteTestimonial,
  rejectAgentReview,
  toggleAgentVisibility,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.agents.agentlerVeReyler") };
}
export const dynamic = "force-dynamic";

const inputClass = "min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

export default async function AdminAgentsPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [agents, reviews, testimonials, users, agencies] = await Promise.all([
    prisma.agentProfile.findMany({
      include: { agency: { select: { name: true } }, _count: { select: { properties: true, reviews: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.agentReview.findMany({ where: { status: "PENDING" }, include: { agent: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.testimonial.findMany({ include: { agent: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.user.findMany({ where: { isActive: true, agentProfile: null }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const userOptions = users.map((user) => ({ id: user.id, label: `${user.name} · ${user.email}` }));
  const agencyOptions = agencies.map((agency) => ({ id: agency.id, label: agency.name }));

  return (
    <>
      <AdminPageHeader
        title={t("pages.agents.agentlerVeReyler")}
        description={t("pages.agents.ictimaiAgentProfilleriAgent")}
        breadcrumbs={[{ label: t("pages.agents.idarePaneli"), href: "/admin" }, { label: t("pages.agents.agentlerVeReyler") }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title={t("pages.agents.yeniAgentProfili")} bodyClassName="p-0">
          <div className="p-4 sm:p-5">
            <AgentForm initial={EMPTY_AGENT_FORM} users={userOptions} agencies={agencyOptions} />
          </div>
        </AdminCard>

        <AdminCard title={t("pages.agents.yeniMusteriReyi")} description={t("pages.agents.adminTerefindenElaveEdilen")}>
          <AdminForm action={createTestimonial} submitLabel={t("pages.agents.reyiDercEt")} className="gap-4">
            <label className="text-sm text-ink-soft">{t("pages.agents.musterininAdi")}<input className={`${inputClass} mt-1`} name="customerName" required /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-ink-soft">{t("pages.agents.qiymet")}<select className={`${inputClass} mt-1`} name="rating" defaultValue="5">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-sm text-ink-soft">{t("pages.agents.xidmetNovu")}<input className={`${inputClass} mt-1`} name="serviceType" /></label></div>
            <label className="text-sm text-ink-soft">{t("pages.agents.agent")}<select className={`${inputClass} mt-1`} name="agentId"><option value="">{t("pages.agents.sirketReyi")}</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label className="text-sm text-ink-soft">{t("pages.agents.rey")}<textarea className={`${inputClass} mt-1 min-h-32 py-2`} name="review" required /></label>
          </AdminForm>
        </AdminCard>
      </div>

      <AdminCard title={t("pages.agents.agentProfilleri")} className="mt-6" bodyClassName="p-0">
        {agents.length === 0 ? <div className="p-5"><EmptyState title={t("pages.agents.agentProfiliYoxdur")} /></div> : <ul className="divide-y divide-line">{agents.map((agent) => (
          <li key={agent.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{agent.name}</p>
                {agent.isVerified ? <Badge tone="success">{t("pages.agents.tesdiqlenib")}</Badge> : null}
                {agent.isPublic ? <Badge tone="gold">{t("pages.agents.ictimai")}</Badge> : <Badge tone="neutral">{t("pages.agents.gizli")}</Badge>}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {agent.agency?.name ?? t("pages.misc.musteqil")} · {t("pages.misc.elanRey", { p0: agent._count.properties, p1: agent._count.reviews })} ·{" "}
                {agent.responseMinutes != null ? t("pages.common.deqCavab", { p0: agent.responseMinutes }) : t("pages.misc.cavabMuddetiYoxdur")} ·{" "}
                {parseJsonArray(agent.languages).join(", ") || t("pages.misc.dilQeydEdilmeyib")}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <Link
                href={`/admin/agentler/${agent.id}`}
                aria-label={t("pages.common.profiliniRedakteEt", { p0: agent.name })}
                className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep"
              >
                <Pencil className="size-4" />
              </Link>
              <ConfirmAction action={toggleAgentVisibility} id={agent.id} label={t("pages.agents.gorunurluguDeyis")} title={agent.isPublic ? t("pages.misc.agentGizledilsin") : t("pages.misc.agentDercEdilsin")} description={t("pages.agents.ictimaiAgentKataloqundakiGorunurluk")} confirmLabel={agent.isPublic ? t("pages.misc.gizlet") : t("pages.misc.dercEt")} tone="neutral">{agent.isPublic ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</ConfirmAction>
              <ConfirmAction action={deleteAgentProfile} id={agent.id} label={t("pages.agents.agentiSil")} title={t("pages.agents.agentProfiliSilinsin")} description={t("pages.agents.profilReyleriVeTestimonial")} confirmLabel={t("pages.agents.sil")}><Trash2 className="size-4" /></ConfirmAction>
            </div>
          </li>
        ))}</ul>}
      </AdminCard>

      <AdminCard title={t("pages.agents.moderasiyaGozleyenAgentReyleri")} className="mt-6" bodyClassName="p-0">
        {reviews.length === 0 ? <div className="p-5"><EmptyState title={t("pages.agents.moderasiyaNovbesiBosdur")} /></div> : <ul className="divide-y divide-line">{reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><div className="flex items-center gap-2"><p className="font-medium text-ink">{review.customerName} → {review.agent.name}</p><span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" /> {review.rating}</span></div><p className="mt-1 max-w-3xl text-sm text-ink-soft">{review.comment}</p><p className="mt-1 text-xs text-ink-muted">{formatDateTime(review.createdAt)}</p></div><div className="flex shrink-0"><ConfirmAction action={approveAgentReview} id={review.id} label={t("pages.agents.reyiTesdiqle")} title={t("pages.agents.reyTesdiqlensin")} description={t("pages.agents.reyAgentProfilindeIctimai")} confirmLabel={t("pages.agents.tesdiqle")} tone="neutral"><Check className="size-4" /></ConfirmAction><ConfirmAction action={rejectAgentReview} id={review.id} label={t("pages.agents.reyiReddEt")} title={t("pages.agents.reyReddEdilsin")} description={t("pages.agents.reyIctimaiGosterilmeyecek")} confirmLabel={t("pages.agents.reddEt")}><X className="size-4" /></ConfirmAction></div></li>
        ))}</ul>}
      </AdminCard>

      <AdminCard title={t("pages.agents.musteriReyleri")} description={t("pages.agents.anaSehifedeGosterilenSirket")} className="mt-6" bodyClassName="p-0">
        {testimonials.length === 0 ? <div className="p-5"><EmptyState title={t("pages.agents.musteriReyiYoxdur")} /></div> : <ul className="divide-y divide-line">{testimonials.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{item.customerName}</p>
                <span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" /> {item.rating}</span>
                {item.status === "APPROVED" ? <Badge tone="success">{t("pages.agents.dercEdilib")}</Badge> : <Badge tone="warning">{t("pages.agents.gozleyir")}</Badge>}
              </div>
              <p className="mt-1 max-w-3xl text-sm text-ink-soft">{item.review}</p>
              <p className="mt-1 text-xs text-ink-muted">{item.agent?.name ?? t("pages.misc.sirketReyi")} · {formatDateTime(item.createdAt)}</p>
            </div>
            <div className="flex shrink-0">
              <ConfirmAction action={deleteTestimonial} id={item.id} label={t("pages.agents.reyiSil")} title={t("pages.agents.musteriReyiSilinsin")} description={t("pages.agents.reyAnaSehifedenDerhal")} confirmLabel={t("pages.agents.sil")}><Trash2 className="size-4" /></ConfirmAction>
            </div>
          </li>
        ))}</ul>}
      </AdminCard>
    </>
  );
}
