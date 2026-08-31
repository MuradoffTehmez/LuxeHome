import { getAdminT } from "@/lib/admin-i18n";
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
import { analyzePropertyPhotos, applyDescriptionDraft, discardDescriptionDraft, generatePropertyDescription, testAiProvider } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.ops.aiKomekci") };
}
export const dynamic = "force-dynamic";
const inputClass = "mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

export default async function AiAssistantPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [properties, drafts, analyzedImages] = await Promise.all([
    prisma.property.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 300 }),
    prisma.aiContentDraft.findMany({ where: { outputJson: { contains: "description" } }, include: { property: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.propertyImage.findMany({ where: { analyzedAt: { not: null } }, include: { property: { select: { title: true } } }, orderBy: { analyzedAt: "desc" }, take: 30 }),
  ]);
  const propertySelect = <>{<option value="">{t("pages.ops.elanSecin")}</option>}{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</>;
  return <>
    <AdminPageHeader title={t("pages.ops.aiKomekci")} description={t("pages.common.faktlaraEsaslananMetnQaralamasi", { p0: aiProviderLabel() })} breadcrumbs={[{ label: t("pages.ops.idarePaneli"), href: "/admin" }, { label: t("pages.ops.aiKomekci") }]} />
    <AdminCard title={t("pages.ops.workersAiSagliqYoxlamasi")} description={t("pages.ops.bindingIVeModel")} className="mb-6"><AdminForm action={testAiProvider} submitLabel={t("pages.ops.provayderiYoxla")}><p className="text-sm text-ink-muted">{t("pages.ops.neticeSaxtaKonfiqurasiyaStatusu")}</p></AdminForm></AdminCard>
    <div className="grid gap-6 xl:grid-cols-2">
      <AdminCard title={t("pages.ops.elanTesviriYarat")} description={t("pages.ops.neticeEvvelceQaralamaKimi")}><AdminForm action={generatePropertyDescription} submitLabel={t("pages.ops.qaralamaYarat")} className="gap-4"><label className="text-sm text-ink-soft">{t("pages.ops.elan")}<select name="propertyId" className={inputClass}>{propertySelect}</select></label><label className="text-sm text-ink-soft">{t("pages.ops.dil")}<select name="locale" className={inputClass}><option value="az">{t("pages.ops.azerbaycan")}</option><option value="en">{t("pages.ops.english")}</option><option value="ru">{t("pages.ops.item")}</option></select></label></AdminForm></AdminCard>
      <AdminCard title={t("pages.ops.fotoMeslehetcisi")} description={t("pages.ops.isiqKadrBulaniqliqVe")}><AdminForm action={analyzePropertyPhotos} submitLabel={t("pages.ops.sekilleriAnalizEt")} className="gap-4"><label className="text-sm text-ink-soft">{t("pages.ops.elan")}<select name="propertyId" className={inputClass}>{propertySelect}</select></label><p className="flex items-start gap-2 text-sm text-ink-muted"><ImageIcon className="mt-0.5 size-4 shrink-0" />{t("pages.ops.analizNeticesiSekillerinYaninda")}</p></AdminForm></AdminCard>
    </div>
    <AdminCard title={t("pages.ops.metnQaralamalari")} className="mt-6" bodyClassName="p-0"><ul className="divide-y divide-line">{drafts.map((draft) => { let output: { title?: string; description?: string } = {}; try { output = JSON.parse(draft.outputJson); } catch {} return <li key={draft.id} className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{draft.property?.title ?? t("pages.misc.silinmisElan")}</p><Badge tone={draft.status === AI_CONTENT_DRAFT_STATUSES.APPLIED ? "success" : "warning"}>{draft.status}</Badge></div>{output.title ? <p className="mt-2 font-display text-lg text-ink">{output.title}</p> : null}<p className="mt-1 max-w-4xl whitespace-pre-line text-sm text-ink-soft">{output.description}</p><p className="mt-2 text-xs text-ink-muted">{draft.model} · {formatDateTime(draft.createdAt)}</p></div>{draft.status === AI_CONTENT_DRAFT_STATUSES.DRAFT && output.description ? <div className="flex shrink-0"><ConfirmAction action={applyDescriptionDraft} id={draft.id} label={t("pages.ops.qaralamaniTetbiqEt")} title={t("pages.ops.aiQaralamasiElanaTetbiq")} description={t("pages.ops.cariBasliqVeTesvir")} confirmLabel={t("pages.ops.tetbiqEt")} tone="neutral"><Check className="size-4" /></ConfirmAction><ConfirmAction action={discardDescriptionDraft} id={draft.id} label={t("pages.ops.qaralamaniReddEt")} title={t("pages.ops.qaralamaReddEdilsin")} description={t("pages.ops.qaralamaSiyahidaReddEdilib")} confirmLabel={t("pages.ops.reddEt")}><X className="size-4" /></ConfirmAction></div> : null}</li>; })}</ul></AdminCard>
    <AdminCard title={t("pages.ops.sonFotoAnalizleri")} className="mt-6" bodyClassName="p-0"><ul className="divide-y divide-line">{analyzedImages.map((image) => <li key={image.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{image.property.title}</p><Badge tone={(image.qualityScore ?? 0) >= 75 ? "success" : (image.qualityScore ?? 0) >= 50 ? "warning" : "danger"}>{image.qualityScore ?? 0}/100</Badge></div><p className="mt-1 text-sm text-ink-muted">{parseJsonArray(image.qualityIssues).join(" · ") || t("pages.misc.problemQeydEdilmeyib")}</p></li>)}</ul></AdminCard>
  </>;
}
