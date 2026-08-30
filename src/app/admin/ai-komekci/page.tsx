import type { Metadata } from "next";
import { Check, ImageIcon, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { AdminForm } from "@/components/admin/form-shell";
import { Badge } from "@/components/ui/badge";
import { requireAdminRead } from "@/lib/admin/guard";
import { AI_CONTENT_DRAFT_STATUSES, PERMISSIONS } from "@/lib/constants";
import { aiProviderLabel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import { analyzePropertyPhotos, applyDescriptionDraft, discardDescriptionDraft, generatePropertyDescription } from "./actions";

export const metadata: Metadata = { title: "AI köməkçi" };
export const dynamic = "force-dynamic";
const inputClass = "mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

export default async function AiAssistantPage() {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [properties, drafts, analyzedImages] = await Promise.all([
    prisma.property.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 300 }),
    prisma.aiContentDraft.findMany({ where: { outputJson: { contains: "description" } }, include: { property: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.propertyImage.findMany({ where: { analyzedAt: { not: null } }, include: { property: { select: { title: true } } }, orderBy: { analyzedAt: "desc" }, take: 30 }),
  ]);
  const propertySelect = <>{<option value="">Elan seçin</option>}{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</>;
  return <>
    <AdminPageHeader title="AI köməkçi" description={`Faktlara əsaslanan mətn qaralaması və foto keyfiyyəti məsləhətləri. Heç bir mətn insan təsdiqi olmadan dərc edilmir. Provayder: ${aiProviderLabel()}`} breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "AI köməkçi" }]} />
    <div className="grid gap-6 xl:grid-cols-2">
      <AdminCard title="Elan təsviri yarat" description="Nəticə əvvəlcə qaralama kimi saxlanılır."><AdminForm action={generatePropertyDescription} submitLabel="Qaralama yarat" className="gap-4"><label className="text-sm text-ink-soft">Elan<select name="propertyId" className={inputClass}>{propertySelect}</select></label><label className="text-sm text-ink-soft">Dil<select name="locale" className={inputClass}><option value="az">Azərbaycan</option><option value="en">English</option><option value="ru">Русский</option></select></label></AdminForm></AdminCard>
      <AdminCard title="Foto məsləhətçisi" description="İşıq, kadr, bulanıqlıq və məxfilik problemlərini qiymətləndirir."><AdminForm action={analyzePropertyPhotos} submitLabel="Şəkilləri analiz et" className="gap-4"><label className="text-sm text-ink-soft">Elan<select name="propertyId" className={inputClass}>{propertySelect}</select></label><p className="flex items-start gap-2 text-sm text-ink-muted"><ImageIcon className="mt-0.5 size-4 shrink-0" />Analiz nəticəsi şəkillərin yanında bal və problemlər kimi saxlanılır.</p></AdminForm></AdminCard>
    </div>
    <AdminCard title="Mətn qaralamaları" className="mt-6" bodyClassName="p-0"><ul className="divide-y divide-line">{drafts.map((draft) => { let output: { title?: string; description?: string } = {}; try { output = JSON.parse(draft.outputJson); } catch {} return <li key={draft.id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{draft.property?.title ?? "Silinmiş elan"}</p><Badge tone={draft.status === AI_CONTENT_DRAFT_STATUSES.APPLIED ? "success" : "warning"}>{draft.status}</Badge></div>{output.title ? <p className="mt-2 font-display text-lg text-ink">{output.title}</p> : null}<p className="mt-1 max-w-4xl whitespace-pre-line text-sm text-ink-soft">{output.description}</p><p className="mt-2 text-xs text-ink-muted">{draft.model} · {formatDateTime(draft.createdAt)}</p></div>{draft.status === AI_CONTENT_DRAFT_STATUSES.DRAFT && output.description ? <div className="flex shrink-0"><ConfirmAction action={applyDescriptionDraft} id={draft.id} label="Qaralamanı tətbiq et" title="AI qaralaması elana tətbiq edilsin?" description="Cari başlıq və təsvir dəyişəcək. Mətni oxuyub təsdiq etdiyinizə əmin olun." confirmLabel="Tətbiq et" tone="neutral"><Check className="size-4" /></ConfirmAction><ConfirmAction action={discardDescriptionDraft} id={draft.id} label="Qaralamanı rədd et" title="Qaralama rədd edilsin?" description="Qaralama siyahıda «rədd edilib» kimi qalır, elana tətbiq edilmir." confirmLabel="Rədd et"><X className="size-4" /></ConfirmAction></div> : null}</li>; })}</ul></AdminCard>
    <AdminCard title="Son foto analizləri" className="mt-6" bodyClassName="p-0"><ul className="divide-y divide-line">{analyzedImages.map((image) => <li key={image.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{image.property.title}</p><Badge tone={(image.qualityScore ?? 0) >= 75 ? "success" : (image.qualityScore ?? 0) >= 50 ? "warning" : "danger"}>{image.qualityScore ?? 0}/100</Badge></div><p className="mt-1 text-sm text-ink-muted">{parseJsonArray(image.qualityIssues).join(" · ") || "Problem qeyd edilməyib"}</p></li>)}</ul></AdminCard>
  </>;
}
