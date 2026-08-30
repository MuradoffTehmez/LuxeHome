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

export const metadata: Metadata = { title: "Agentlər və rəylər" };
export const dynamic = "force-dynamic";

const inputClass = "min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

export default async function AdminAgentsPage() {
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
        title="Agentlər və rəylər"
        description="İctimai agent profilləri, agent rəylərinin moderasiyası və ana səhifə müştəri rəyləri."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Agentlər və rəylər" }]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Yeni agent profili" bodyClassName="p-0">
          <div className="p-4 sm:p-5">
            <AgentForm initial={EMPTY_AGENT_FORM} users={userOptions} agencies={agencyOptions} />
          </div>
        </AdminCard>

        <AdminCard title="Yeni müştəri rəyi" description="Admin tərəfindən əlavə edilən təsdiqlənmiş şirkət rəyi.">
          <AdminForm action={createTestimonial} submitLabel="Rəyi dərc et" className="gap-4">
            <label className="text-sm text-ink-soft">Müştərinin adı<input className={`${inputClass} mt-1`} name="customerName" required /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-ink-soft">Qiymət<select className={`${inputClass} mt-1`} name="rating" defaultValue="5">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-sm text-ink-soft">Xidmət növü<input className={`${inputClass} mt-1`} name="serviceType" /></label></div>
            <label className="text-sm text-ink-soft">Agent<select className={`${inputClass} mt-1`} name="agentId"><option value="">Şirkət rəyi</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label className="text-sm text-ink-soft">Rəy<textarea className={`${inputClass} mt-1 min-h-32 py-2`} name="review" required /></label>
          </AdminForm>
        </AdminCard>
      </div>

      <AdminCard title="Agent profilləri" className="mt-6" bodyClassName="p-0">
        {agents.length === 0 ? <div className="p-5"><EmptyState title="Agent profili yoxdur" /></div> : <ul className="divide-y divide-line">{agents.map((agent) => (
          <li key={agent.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{agent.name}</p>
                {agent.isVerified ? <Badge tone="success">Təsdiqlənib</Badge> : null}
                {agent.isPublic ? <Badge tone="gold">İctimai</Badge> : <Badge tone="neutral">Gizli</Badge>}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {agent.agency?.name ?? "Müstəqil"} · {agent._count.properties} elan · {agent._count.reviews} rəy ·{" "}
                {agent.responseMinutes != null ? `${agent.responseMinutes} dəq cavab` : "cavab müddəti yoxdur"} ·{" "}
                {parseJsonArray(agent.languages).join(", ") || "Dil qeyd edilməyib"}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <Link
                href={`/admin/agentler/${agent.id}`}
                aria-label={`${agent.name} profilini redaktə et`}
                className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep"
              >
                <Pencil className="size-4" />
              </Link>
              <ConfirmAction action={toggleAgentVisibility} id={agent.id} label="Görünürlüğü dəyiş" title={agent.isPublic ? "Agent gizlədilsin?" : "Agent dərc edilsin?"} description="İctimai agent kataloqundakı görünürlük dəyişəcək." confirmLabel={agent.isPublic ? "Gizlət" : "Dərc et"} tone="neutral">{agent.isPublic ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</ConfirmAction>
              <ConfirmAction action={deleteAgentProfile} id={agent.id} label="Agenti sil" title="Agent profili silinsin?" description="Profil, rəyləri və testimonial bağlantıları ilə birlikdə silinir. Elan təyin edilibsə silinmə bloklanır." confirmLabel="Sil"><Trash2 className="size-4" /></ConfirmAction>
            </div>
          </li>
        ))}</ul>}
      </AdminCard>

      <AdminCard title="Moderasiya gözləyən agent rəyləri" className="mt-6" bodyClassName="p-0">
        {reviews.length === 0 ? <div className="p-5"><EmptyState title="Moderasiya növbəsi boşdur" /></div> : <ul className="divide-y divide-line">{reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><div className="flex items-center gap-2"><p className="font-medium text-ink">{review.customerName} → {review.agent.name}</p><span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" /> {review.rating}</span></div><p className="mt-1 max-w-3xl text-sm text-ink-soft">{review.comment}</p><p className="mt-1 text-xs text-ink-muted">{formatDateTime(review.createdAt)}</p></div><div className="flex shrink-0"><ConfirmAction action={approveAgentReview} id={review.id} label="Rəyi təsdiqlə" title="Rəy təsdiqlənsin?" description="Rəy agent profilində ictimai görünəcək." confirmLabel="Təsdiqlə" tone="neutral"><Check className="size-4" /></ConfirmAction><ConfirmAction action={rejectAgentReview} id={review.id} label="Rəyi rədd et" title="Rəy rədd edilsin?" description="Rəy ictimai göstərilməyəcək." confirmLabel="Rədd et"><X className="size-4" /></ConfirmAction></div></li>
        ))}</ul>}
      </AdminCard>

      <AdminCard title="Müştəri rəyləri" description="Ana səhifədə göstərilən şirkət rəyləri." className="mt-6" bodyClassName="p-0">
        {testimonials.length === 0 ? <div className="p-5"><EmptyState title="Müştəri rəyi yoxdur" /></div> : <ul className="divide-y divide-line">{testimonials.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink">{item.customerName}</p>
                <span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" /> {item.rating}</span>
                {item.status === "APPROVED" ? <Badge tone="success">Dərc edilib</Badge> : <Badge tone="warning">Gözləyir</Badge>}
              </div>
              <p className="mt-1 max-w-3xl text-sm text-ink-soft">{item.review}</p>
              <p className="mt-1 text-xs text-ink-muted">{item.agent?.name ?? "Şirkət rəyi"} · {formatDateTime(item.createdAt)}</p>
            </div>
            <div className="flex shrink-0">
              <ConfirmAction action={deleteTestimonial} id={item.id} label="Rəyi sil" title="Müştəri rəyi silinsin?" description="Rəy ana səhifədən dərhal götürüləcək." confirmLabel="Sil"><Trash2 className="size-4" /></ConfirmAction>
            </div>
          </li>
        ))}</ul>}
      </AdminCard>
    </>
  );
}
