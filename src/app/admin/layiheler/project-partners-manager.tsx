"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { PARTNER_RELATION_ROLE_LABELS, PARTNER_RELATION_ROLES } from "@/lib/constants";
import type { getAdminProjectPartnerLinks, getPartnerOptions } from "@/lib/queries";
import { addPartnerRelation, removePartnerRelation } from "../terefdaslar/actions";
import { useTranslations } from "next-intl";

type Links = Awaited<ReturnType<typeof getAdminProjectPartnerLinks>>;
type Options = Awaited<ReturnType<typeof getPartnerOptions>>;
const fieldClass = "min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink outline-none focus:border-gold";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xs bg-gold px-4 text-sm font-medium text-ink disabled:opacity-50">
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      Tərəfdaş əlavə et
    </button>
  );
}

export function ProjectPartnersManager({ projectId, links, options }: { projectId: string; links: Links; options: Options }) {
  const t = useTranslations("admin");
  const [addState, addAction] = useActionState(addPartnerRelation, IDLE_STATE);
  const [removeState, removeAction] = useActionState(removePartnerRelation, IDLE_STATE);
  const linkedIds = new Set(links.map((link) => link.partnerId));

  return (
    <section className="mt-8 overflow-hidden rounded-md border border-line bg-paper">
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <h2 className="font-display text-lg text-ink">{t("pages.projects.layiheninTerefdaslari")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("pages.projects.developerSatisTerefdasiBroker")}</p>
      </header>
      <form action={addAction} className="grid gap-4 border-b border-line p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        <input type="hidden" name="entityType" value="project" />
        <input type="hidden" name="entityId" value={projectId} />
        <label className="text-sm text-ink-soft">{t("pages.projects.terefdas")}
          <select name="partnerId" required defaultValue="" className={`${fieldClass} mt-1`}>
            <option value="" disabled>{t("pages.projects.secin")}</option>
            {options.filter((option) => !linkedIds.has(option.id)).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-ink-soft">{t("pages.projects.rol")}
          <select name="role" defaultValue={PARTNER_RELATION_ROLES.DEVELOPER} className={`${fieldClass} mt-1`}>
            {Object.values(PARTNER_RELATION_ROLES).map((role) => <option key={role} value={role}>{t(`labels.partnerRelationRole.${role}`)}</option>)}
          </select>
        </label>
        <label className="text-sm text-ink-soft">{t("pages.projects.terefdasinLayiheSehifesi")}
          <input name="sourceUrl" type="url" placeholder="https://…" className={`${fieldClass} mt-1`} />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink"><input name="isPublic" type="checkbox" defaultChecked className="size-4 accent-gold" />{t("pages.projects.saytdaGosterilsin")}</label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink"><input name="isPrimary" type="checkbox" className="size-4 accent-gold" />{t("pages.projects.esasTerefdasdir")}</label>
        <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-3">
          {addState.message ? <p className={addState.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>{addState.message}</p> : <span />}
          <SubmitButton />
        </div>
      </form>
      {removeState.message ? <p className={removeState.status === "error" ? "px-4 pt-4 text-sm text-danger" : "px-4 pt-4 text-sm text-success"}>{removeState.message}</p> : null}
      {links.length === 0 ? <p className="p-6 text-sm text-ink-muted">{t("pages.projects.buLayiheyeTerefdasBaglanmayib")}</p> : (
        <ul className="divide-y divide-line">
          {links.map((link) => (
            <li key={link.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <Link href={`/admin/terefdaslar/${link.partnerId}`} className="font-medium text-ink hover:text-gold-deep">{link.partner.name}</Link>
                <p className="mt-1 text-xs text-ink-muted">{t(`labels.partnerRelationRole.${link.role as keyof typeof PARTNER_RELATION_ROLE_LABELS}`) ?? link.role}{link.isPrimary ? " · əsas" : ""}{link.isPublic ? " · saytda görünür" : " · gizli"}</p>
                {link.sourceUrl ? <a href={link.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-gold-deep underline-offset-4 hover:underline">{link.sourceUrl}</a> : null}
              </div>
              <form action={removeAction}>
                <input type="hidden" name="entityType" value="project" /><input type="hidden" name="relationId" value={link.id} /><input type="hidden" name="partnerId" value={link.partnerId} />
                <button type="submit" className="grid size-11 place-items-center rounded-xs text-danger hover:bg-danger-bg" aria-label={`${link.partner.name} əlaqəsini sil`}><Trash2 className="size-4" aria-hidden="true" /></button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
