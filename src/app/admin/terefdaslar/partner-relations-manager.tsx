"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { PARTNER_RELATION_ROLE_LABELS, PARTNER_RELATION_ROLES } from "@/lib/constants";
import type { getAdminPartnerRelations, getPartnerRelationOptions } from "@/lib/queries";
import { addPartnerRelation, removePartnerRelation } from "./actions";
import { useTranslations } from "next-intl";

type Relations = Awaited<ReturnType<typeof getAdminPartnerRelations>>;
type Options = Awaited<ReturnType<typeof getPartnerRelationOptions>>;
type EntityType = "property" | "project" | "agency";

const fieldClass =
  "min-h-11 w-full rounded-xs border border-line bg-paper px-3 text-sm text-ink focus:border-gold";

export function PartnerRelationsManager({
  partnerId,
  relations,
  options,
}: {
  partnerId: string;
  relations: Relations;
  options: Options;
}) {
  const t = useTranslations("admin");
  const [entityType, setEntityType] = useState<EntityType>("property");
  const [addState, addAction] = useActionState(addPartnerRelation, IDLE_STATE);
  const [removeState, removeAction] = useActionState(removePartnerRelation, IDLE_STATE);

  const entityOptions =
    entityType === "property"
      ? options.properties.map((item) => ({ value: item.id, label: item.title }))
      : entityType === "project"
        ? options.projects.map((item) => ({ value: item.id, label: item.name }))
        : options.agencies.map((item) => ({ value: item.id, label: item.name }));

  return (
    <div className="flex flex-col gap-6">
      <form action={addAction} className="grid gap-4 rounded-md border border-line bg-paper p-4 sm:grid-cols-2 sm:p-5">
        <input type="hidden" name="partnerId" value={partnerId} />
        <label className="flex flex-col gap-1.5 text-sm text-ink-soft">
          {t("pages.partners.elaqeNovu")}
          <select
            name="entityType"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value as EntityType)}
            className={fieldClass}
          >
            <option value="property">{t("pages.partners.elan")}</option>
            <option value="project">{t("pages.partners.layihe")}</option>
            <option value="agency">{t("pages.partners.agentlik")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-soft">
          {t("pages.partners.qeyd")}
          <select name="entityId" required className={fieldClass} defaultValue="">
            <option value="" disabled>{t("pages.partners.secin")}</option>
            {entityOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-soft">
          {t("pages.partners.rol")}
          <select name="role" className={fieldClass} defaultValue={PARTNER_RELATION_ROLES.SOURCE}>
            {Object.values(PARTNER_RELATION_ROLES).map((role) => (
              <option key={role} value={role}>{t(`labels.partnerRelationRole.${role}`)}</option>
            ))}
          </select>
        </label>
        {entityType === "property" || entityType === "project" ? (
          <label className="flex flex-col gap-1.5 text-sm text-ink-soft">
            {entityType === "project" ? t("pages.misc.layiheninTerefdasSehifesi") : t("pages.misc.menbeUrl")}
            <input name="sourceUrl" type="url" className={fieldClass} placeholder="https://…" />
          </label>
        ) : <div />}
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
          <input name="isPublic" type="checkbox" defaultChecked className="size-4 accent-gold" />
          {t("pages.partners.publicSehifedeGosterilsin")}
        </label>
        {entityType !== "agency" ? (
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input name="isPrimary" type="checkbox" className="size-4 accent-gold" />
            {t("pages.partners.esasTerefdasKimiGosterilsin")}
          </label>
        ) : null}
        <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <ActionMessage state={addState} />
          <SubmitRelationButton />
        </div>
      </form>

      <ActionMessage state={removeState} />
      <RelationList
        title={t("pages.partners.elaqeliElanlar")}
        entityType="property"
        partnerId={partnerId}
        action={removeAction}
        items={relations.properties.map((link) => ({
          id: link.id,
          label: link.property.title,
          href: `/admin/emlaklar/${link.property.id}`,
          role: link.role,
          isPublic: link.isPublic,
          isPrimary: link.isPrimary,
        }))}
      />
      <RelationList
        title={t("pages.partners.elaqeliLayiheler")}
        entityType="project"
        partnerId={partnerId}
        action={removeAction}
        items={relations.projects.map((link) => ({
          id: link.id,
          label: link.project.name,
          href: `/admin/layiheler/${link.project.id}`,
          role: link.role,
          isPublic: link.isPublic,
          isPrimary: link.isPrimary,
        }))}
      />
      <RelationList
        title={t("pages.partners.elaqeliAgentlikler")}
        entityType="agency"
        partnerId={partnerId}
        action={removeAction}
        items={relations.agencies.map((link) => ({
          id: link.id,
          label: link.agency.name,
          href: "/admin/agentlikler",
          role: link.role,
          isPublic: link.isPublic,
          isPrimary: false,
        }))}
      />
    </div>
  );
}

function SubmitRelationButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-xs bg-gold px-4 text-sm font-medium text-ink disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      Əlaqə əlavə et
    </button>
  );
}

function ActionMessage({ state }: { state: typeof IDLE_STATE & { message?: string } }) {
  if (!state.message) return null;
  return (
    <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>
      {state.message}
    </p>
  );
}

function RelationList({
  title,
  entityType,
  partnerId,
  action,
  items,
}: {
  title: string;
  entityType: EntityType;
  partnerId: string;
  action: (formData: FormData) => void;
  items: Array<{ id: string; label: string; href: string; role: string; isPublic: boolean; isPrimary: boolean }>;
}) {
  const t = useTranslations("admin");
  return (
    <section className="overflow-hidden rounded-md border border-line bg-paper">
      <header className="border-b border-line px-4 py-3 sm:px-5">
        <h3 className="font-display text-base text-ink">{title}</h3>
      </header>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-ink-muted sm:p-5">{t("pages.partners.elaqeYoxdur")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <Link href={item.href} className="font-medium text-ink hover:text-gold-deep">{item.label}</Link>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {t(`labels.partnerRelationRole.${item.role as keyof typeof PARTNER_RELATION_ROLE_LABELS}`) ?? item.role}
                  {item.isPrimary ? t("pages.misc.esas") : ""}{item.isPublic ? " · public" : " · gizli"}
                </p>
              </div>
              <form action={action}>
                <input type="hidden" name="partnerId" value={partnerId} />
                <input type="hidden" name="entityType" value={entityType} />
                <input type="hidden" name="relationId" value={item.id} />
                <button type="submit" className="grid size-11 place-items-center rounded-xs text-danger hover:bg-danger-bg" aria-label={t("pages.common.elaqesiniSil", { p0: item.label })}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
