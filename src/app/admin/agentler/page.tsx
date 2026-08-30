import type { Metadata } from "next";
import { Check, Eye, EyeOff, Star, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminForm } from "@/components/admin/form-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import { approveAgentReview, createAgentProfile, createTestimonial, rejectAgentReview, toggleAgentVisibility } from "./actions";

export const metadata: Metadata = { title: "Agentlər və rəylər" };
export const dynamic = "force-dynamic";

const inputClass = "min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

export default async function AdminAgentsPage() {
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [agents, reviews, users, agencies] = await Promise.all([
    prisma.agentProfile.findMany({ include: { agency: { select: { name: true } }, _count: { select: { properties: true, reviews: true } } }, orderBy: { name: "asc" } }),
    prisma.agentReview.findMany({ where: { status: "PENDING" }, include: { agent: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { isActive: true, agentProfile: null }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.agency.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Agentlər və rəylər" description="İctimai agent profilləri, agent rəylərinin moderasiyası və ana səhifə müştəri rəyləri." breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Agentlər və rəylər" }]} />

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Yeni agent profili">
          <AdminForm action={createAgentProfile} submitLabel="Agent yarat" className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-ink-soft">Ad və soyad<input className={`${inputClass} mt-1`} name="name" required /></label>
              <label className="text-sm text-ink-soft">URL adı<input className={`${inputClass} mt-1`} name="slug" placeholder="ad-soyad" /></label>
              <label className="text-sm text-ink-soft">Bağlı hesab<select className={`${inputClass} mt-1`} name="userId"><option value="">Bağlanmayıb</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label>
              <label className="text-sm text-ink-soft">Agentlik<select className={`${inputClass} mt-1`} name="agencyId"><option value="">Müstəqil</option>{agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}</select></label>
              <label className="text-sm text-ink-soft">Vəzifə<input className={`${inputClass} mt-1`} name="roleTitle" /></label>
              <label className="text-sm text-ink-soft">İxtisaslaşma<input className={`${inputClass} mt-1`} name="specialization" /></label>
              <label className="text-sm text-ink-soft">Təcrübə ili<input className={`${inputClass} mt-1`} name="experienceYears" type="number" min="0" max="80" /></label>
              <label className="text-sm text-ink-soft">Telefon<input className={`${inputClass} mt-1`} name="phone" /></label>
              <label className="text-sm text-ink-soft sm:col-span-2">E-poçt<input className={`${inputClass} mt-1`} name="email" type="email" /></label>
              <label className="text-sm text-ink-soft">Dillər (hər sətirdə biri)<textarea className={`${inputClass} mt-1 min-h-24 py-2`} name="languages" /></label>
              <label className="text-sm text-ink-soft">Ərazilər (hər sətirdə biri)<textarea className={`${inputClass} mt-1 min-h-24 py-2`} name="areas" /></label>
              <label className="text-sm text-ink-soft sm:col-span-2">Bio<textarea className={`${inputClass} mt-1 min-h-28 py-2`} name="bio" /></label>
            </div>
            <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="isVerified" /> Təsdiqlənmiş agent</label><label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="isPublic" /> İctimai kataloqda göstər</label></div>
          </AdminForm>
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
            <div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{agent.name}</p>{agent.isVerified ? <Badge tone="success">Təsdiqlənib</Badge> : null}{agent.isPublic ? <Badge tone="gold">İctimai</Badge> : <Badge tone="neutral">Gizli</Badge>}</div><p className="mt-1 text-xs text-ink-muted">{agent.agency?.name ?? "Müstəqil"} · {agent._count.properties} elan · {agent._count.reviews} rəy · {parseJsonArray(agent.languages).join(", ") || "Dil qeyd edilməyib"}</p></div>
            <ConfirmAction action={toggleAgentVisibility} id={agent.id} label="Görünürlüğü dəyiş" title={agent.isPublic ? "Agent gizlədilsin?" : "Agent dərc edilsin?"} description="İctimai agent kataloqundakı görünürlük dəyişəcək." confirmLabel={agent.isPublic ? "Gizlət" : "Dərc et"} tone="neutral">{agent.isPublic ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</ConfirmAction>
          </li>
        ))}</ul>}
      </AdminCard>

      <AdminCard title="Moderasiya gözləyən agent rəyləri" className="mt-6" bodyClassName="p-0">
        {reviews.length === 0 ? <div className="p-5"><EmptyState title="Moderasiya növbəsi boşdur" /></div> : <ul className="divide-y divide-line">{reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><div className="flex items-center gap-2"><p className="font-medium text-ink">{review.customerName} → {review.agent.name}</p><span className="flex items-center gap-1 text-sm text-gold-deep"><Star className="size-4 fill-current" /> {review.rating}</span></div><p className="mt-1 max-w-3xl text-sm text-ink-soft">{review.comment}</p><p className="mt-1 text-xs text-ink-muted">{formatDateTime(review.createdAt)}</p></div><div className="flex shrink-0"><ConfirmAction action={approveAgentReview} id={review.id} label="Rəyi təsdiqlə" title="Rəy təsdiqlənsin?" description="Rəy agent profilində ictimai görünəcək." confirmLabel="Təsdiqlə" tone="neutral"><Check className="size-4" /></ConfirmAction><ConfirmAction action={rejectAgentReview} id={review.id} label="Rəyi rədd et" title="Rəy rədd edilsin?" description="Rəy ictimai göstərilməyəcək." confirmLabel="Rədd et"><X className="size-4" /></ConfirmAction></div></li>
        ))}</ul>}
      </AdminCard>
    </>
  );
}
