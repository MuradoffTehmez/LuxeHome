"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AGENCY_ACTIVITY_ACTIONS, CRM_NOTE_MAX, type Locale } from "@/lib/constants";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { localizePath } from "@/i18n/path-locale";
import type { AuthUser } from "@/lib/auth/types";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { findManageableLead } from "@/lib/accounts/listing-leads";
import {
  crmClientData,
  crmEmailKey,
  crmPhoneKey,
  crmScope,
  crmSearchText,
  getCrmContext,
  isCrmAssignee,
  parseCrmClientForm,
  type CrmContext,
} from "@/lib/accounts/crm";
import { mergeCrmClientRecords } from "@/lib/accounts/crm-matching";

/**
 * Mini CRM əməliyyatları (#226, PRD 9.1, 9.2). Hər action öz guard-ını çağırır (layout server
 * action-u qorumur) və kartı yalnız `crmScope()` daxilində tapır — başqasının id-si «tapılmadı» alır.
 */

const LIST_PATH = "/kabinet/musteriler";

/** Yeni kartdan sonra client-in keçəcəyi id. */
export type CrmActionState = ActionState & { clientId?: string };

async function guard(): Promise<{ user: AuthUser; locale: Locale; context: CrmContext } | ActionState> {
  const locale = (await getLocale()) as Locale;
  try {
    const user = await requirePublicAction("lead", locale);
    return { user, locale, context: await getCrmContext(user) };
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}

const isFailure = (value: unknown): value is ActionState => typeof value === "object" && value !== null && "status" in value;

async function formFailure(error: { issues: { path: PropertyKey[]; message: string }[] }): Promise<ActionState> {
  const t = await getTranslations("account.clients.errors");
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "name");
    const key = ["phone", "email", "contact", "range"].includes(issue.message) ? issue.message : field === "name" ? "name" : "invalid";
    const name = field === "typeSlug" ? "type" : field === "citySlug" ? "city" : field === "districtSlug" ? "district" : field;
    fieldErrors[name] ??= t(key as "phone" | "email" | "contact" | "range" | "name" | "invalid");
  }
  return failure(Object.values(fieldErrors)[0] ?? t("invalid"), fieldErrors);
}

async function findClient(context: CrmContext, id: string) {
  if (!id || id.length > 40) return null;
  return prisma.crmClient.findFirst({
    where: { AND: [{ id }, crmScope(context)] },
    select: { id: true, name: true, agencyId: true, ownerId: true },
  });
}

/** Yeni müştəri kartı: məsul — yaradan, mühit — onun agentliyi (varsa). */
export async function createClient(_state: CrmActionState, formData: FormData): Promise<CrmActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  const parsed = parseCrmClientForm(formData);
  if (!parsed.success) return formFailure(parsed.error);
  try {
    const client = await prisma.crmClient.create({
      data: { ...(await crmClientData(parsed.data)), agencyId: ctx.context.agencyId, ownerId: ctx.user.id, createdById: ctx.user.id },
      select: { id: true, name: true },
    });
    if (ctx.context.agencyId) {
      await recordAgencyActivity({
        agencyId: ctx.context.agencyId, actor: ctx.user, action: AGENCY_ACTIVITY_ACTIONS.CLIENT_CREATED,
        entityType: "CrmClient", entityId: client.id, entityLabel: client.name,
      });
    }
    revalidatePath(localizePath(LIST_PATH, ctx.locale));
    return { ...success(t("created")), clientId: client.id };
  } catch (error) {
    return unexpected("müştəri kartı yaradılmadı", error, t("errors.failed"));
  }
}

/** Kartın əlaqə məlumatı və ehtiyacları. */
export async function updateClient(_state: CrmActionState, formData: FormData): Promise<CrmActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  const id = String(formData.get("id") ?? "");
  const parsed = parseCrmClientForm(formData);
  if (!parsed.success) return formFailure(parsed.error);
  try {
    const client = await findClient(ctx.context, id);
    if (!client) return failure(t("errors.notFound"));
    await prisma.crmClient.update({ where: { id: client.id }, data: await crmClientData(parsed.data) });
    revalidatePath(localizePath(`${LIST_PATH}/${client.id}`, ctx.locale));
    return success(t("saved"));
  } catch (error) {
    return unexpected("müştəri kartı saxlanmadı", error, t("errors.failed"));
  }
}

/** Agentin daxili qeydi — müştəriyə görünmür. */
export async function addClientNote(id: string, text: string): Promise<ActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  const note = typeof text === "string" ? text.trim().slice(0, CRM_NOTE_MAX) : "";
  if (note.length < 2) return failure(t("errors.noteEmpty"));
  try {
    const client = await findClient(ctx.context, String(id));
    if (!client) return failure(t("errors.notFound"));
    // Siyahı «son yenilənən» üzrə düzülür — qeyd də kartı yuxarı qaldırır. Sıra qəsdəndir: əvvəl zərərsiz
    // tarix yeniləməsi, sonra qeyd — qeyd yazılıb tarix alınmasaydı, təkrar cəhd ikinci qeyd yaradardı.
    await prisma.crmClient.update({ where: { id: client.id }, data: { updatedAt: new Date() } });
    await prisma.crmClientNote.create({
      data: { clientId: client.id, authorId: ctx.user.id, authorName: ctx.user.name.slice(0, 200), text: note },
    });
    revalidatePath(localizePath(`${LIST_PATH}/${client.id}`, ctx.locale));
    return success(t("noteSaved"));
  } catch (error) {
    return unexpected("müştəri qeydi yazılmadı", error, t("errors.failed"));
  }
}

/** Məsulun dəyişməsi — yalnız agentlik sahibi və `LEADS_MANAGE` menecer, agentlik kartında. */
export async function reassignClient(id: string, userId: string): Promise<ActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  const { context } = ctx;
  if (!context.canManage || !context.access) return failure(t("errors.forbidden"));
  try {
    const client = await findClient(context, String(id));
    if (!client || client.agencyId !== context.access.agencyId) return failure(t("errors.notFound"));
    const agency = { id: context.access.agencyId, name: context.access.agencyName, ownerUserId: context.access.ownerUserId };
    const target = String(userId).slice(0, 40);
    if (!(await isCrmAssignee(agency, target))) return failure(t("errors.invalidAssignee"));
    if (target === client.ownerId) return success(t("reassigned"));
    await prisma.crmClient.update({ where: { id: client.id }, data: { ownerId: target } });
    const targetUser = await prisma.user.findUnique({ where: { id: target }, select: { name: true } });
    await recordAgencyActivity({
      agencyId: context.access.agencyId, actor: ctx.user, action: AGENCY_ACTIVITY_ACTIONS.CLIENT_REASSIGNED,
      entityType: "CrmClient", entityId: client.id, entityLabel: client.name, details: { to: targetUser?.name ?? "—" },
    });
    revalidatePath(localizePath(`${LIST_PATH}/${client.id}`, ctx.locale));
    return success(t("reassigned"));
  } catch (error) {
    return unexpected("müştəri kartının məsulu dəyişmədi", error, t("errors.failed"));
  }
}

/** Kartın silinməsi: bağlı müraciətlər qalır, yalnız əlaqə boşaldılır. */
export async function deleteClient(id: string): Promise<ActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  try {
    const client = await findClient(ctx.context, String(id));
    if (!client) return failure(t("errors.notFound"));
    // Agentlik kartını yalnız məsul və ya idarəçi silir (agent başqasının kartını onsuz da görmür).
    await prisma.lead.updateMany({ where: { clientId: client.id }, data: { clientId: null } });
    await prisma.crmClient.delete({ where: { id: client.id } });
    if (client.agencyId) {
      await recordAgencyActivity({
        agencyId: client.agencyId, actor: ctx.user, action: AGENCY_ACTIVITY_ACTIONS.CLIENT_DELETED,
        entityType: "CrmClient", entityId: client.id, entityLabel: client.name,
      });
    }
    revalidatePath(localizePath(LIST_PATH, ctx.locale));
    return success(t("deleted"));
  } catch (error) {
    return unexpected("müştəri kartı silinmədi", error, t("errors.failed"));
  }
}

/**
 * Müraciətdən kart (PRD 9.1): ad, əlaqə və maraqlandığı elan müraciətdən, ehtiyacın başlanğıcı
 * (alış/kirayə, növ, şəhər, rayon) elandan götürülür; müraciət karta bağlanır. Müraciət artıq
 * görünən karta bağlıdırsa yeni kart yaradılmır.
 */
export async function createClientFromLead(leadId: string): Promise<CrmActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  try {
    const lead = await findManageableLead(ctx.user.id, String(leadId));
    if (!lead) return failure(t("errors.notFound"));
    const full = await prisma.lead.findUnique({
      where: { id: lead.id },
      select: {
        name: true, phone: true, email: true, clientId: true, propertyId: true,
        property: { select: { listingType: true, typeId: true, cityId: true, districtId: true } },
      },
    });
    if (!full) return failure(t("errors.notFound"));
    if (full.clientId) {
      if (await findClient(ctx.context, full.clientId)) return { ...success(t("alreadyLinked")), clientId: full.clientId };
      // Müraciət başqa agentin kartına bağlıdır (məs. müraciət sonradan bu agentə verilib): bağlantının
      // üzərinə yazılmır və dublikat yaradılmır — müştəri tarixçəsi köhnə kartda qalır.
      if (await prisma.crmClient.findUnique({ where: { id: full.clientId }, select: { id: true } })) return failure(t("errors.linkedElsewhere"));
    }

    const client = await prisma.crmClient.create({
      data: {
        agencyId: ctx.context.agencyId,
        ownerId: ctx.user.id,
        createdById: ctx.user.id,
        name: full.name.slice(0, 120),
        phone: full.phone,
        phoneKey: crmPhoneKey(full.phone),
        email: full.email,
        emailKey: crmEmailKey(full.email),
        searchText: crmSearchText(full),
        interestedPropertyId: full.propertyId,
        listingType: full.property?.listingType ?? null,
        typeId: full.property?.typeId ?? null,
        cityId: full.property?.cityId ?? null,
        districtId: full.property?.districtId ?? null,
      },
      select: { id: true, name: true },
    });
    // Bağlantı şərti yazılır (müraciət hələ eyni vəziyyətdədir); alınmasa yeni kart silinir — təkrar
    // cəhd yetim kart və dublikat yaratmasın (D1-də tranzaksiya yoxdur).
    const linked = await prisma.lead
      .updateMany({ where: { id: lead.id, clientId: full.clientId }, data: { clientId: client.id } })
      .catch(async (error: unknown) => {
        await prisma.crmClient.delete({ where: { id: client.id } }).catch(() => undefined);
        throw error;
      });
    if (linked.count === 0) {
      await prisma.crmClient.delete({ where: { id: client.id } });
      return failure(t("errors.linkedElsewhere"));
    }
    if (ctx.context.agencyId) {
      await recordAgencyActivity({
        agencyId: ctx.context.agencyId, actor: ctx.user, action: AGENCY_ACTIVITY_ACTIONS.CLIENT_CREATED,
        entityType: "CrmClient", entityId: client.id, entityLabel: client.name,
      });
    }
    revalidatePath(localizePath(`/kabinet/muracietler/${lead.id}`, ctx.locale));
    revalidatePath(localizePath(LIST_PATH, ctx.locale));
    return { ...success(t("created")), clientId: client.id };
  } catch (error) {
    return unexpected("müraciətdən müştəri kartı yaradılmadı", error, t("errors.failed"));
  }
}

/**
 * Təkrar müraciət (#228, PRD 9.4): məsul şəxs müraciəti mövcud karta təsdiqlə bağlayır — sistem
 * özü bağlamır. Müraciət artıq baxanın görə bildiyi başqa karta bağlıdırsa üzərinə yazılmır.
 */
export async function linkLeadToClient(leadId: string, clientId: string): Promise<CrmActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  try {
    const [lead, client] = await Promise.all([findManageableLead(ctx.user.id, String(leadId)), findClient(ctx.context, String(clientId))]);
    if (!lead || !client) return failure(t("errors.notFound"));
    const current = await prisma.lead.findUnique({ where: { id: lead.id }, select: { clientId: true, agencyId: true } });
    // Müraciət və kart eyni mühitdə olmalıdır: agentlik müraciəti şəxsi karta bağlansa, komandanın
    // qalanı (`crmScope` kartı görmür) müraciəti bağlanmamış sayıb ikinci karta bağlayardı.
    if ((current?.agencyId ?? null) !== client.agencyId) return failure(t("errors.differentScope"));
    // Başqa (baxanın görmədiyi kartı da daxil olmaqla) mövcud bağlantının üzərinə yazılmır.
    if (current?.clientId && current.clientId !== client.id && (await prisma.crmClient.findUnique({ where: { id: current.clientId }, select: { id: true } }))) {
      return failure(t("errors.alreadyLinked"));
    }
    await prisma.lead.update({ where: { id: lead.id }, data: { clientId: client.id } });
    await prisma.crmClient.update({ where: { id: client.id }, data: { updatedAt: new Date() } });
    revalidatePath(localizePath(`/kabinet/muracietler/${lead.id}`, ctx.locale));
    revalidatePath(localizePath(`${LIST_PATH}/${client.id}`, ctx.locale));
    return { ...success(t("linked")), clientId: client.id };
  } catch (error) {
    return unexpected("müraciət müştəri kartına bağlanmadı", error, t("errors.failed"));
  }
}

/**
 * Dublikat kartların birləşdirilməsi (#228, PRD 9.4) — yalnız təsdiq dialoqundan. Mənbənin qeydləri
 * və müraciətləri hədəfə keçir, hədəfin boş sahələri mənbədən doldurulur, sonra mənbə silinir.
 * D1-də tranzaksiya yoxdur: addımlar təkrar edilə bilər (yarımçıq qalsa ikinci cəhd qalanı köçürür).
 */
export async function mergeClients(targetId: string, sourceId: string): Promise<CrmActionState> {
  const ctx = await guard();
  if (isFailure(ctx)) return ctx;
  const t = await getTranslations("account.clients");
  if (String(targetId) === String(sourceId)) return failure(t("errors.invalid"));
  try {
    const scope = crmScope(ctx.context);
    const [target, source] = await Promise.all([
      prisma.crmClient.findFirst({ where: { AND: [{ id: String(targetId).slice(0, 40) }, scope] } }),
      prisma.crmClient.findFirst({ where: { AND: [{ id: String(sourceId).slice(0, 40) }, scope] } }),
    ]);
    if (!target || !source) return failure(t("errors.notFound"));
    // Fərqli mühitlərin (şəxsi və agentlik, iki agentlik) kartı birləşmir — müştəri məlumatı mühitdən çıxmasın.
    if (target.agencyId !== source.agencyId) return failure(t("errors.differentScope"));

    await mergeCrmClientRecords(target, source);
    if (target.agencyId) {
      await recordAgencyActivity({
        agencyId: target.agencyId, actor: ctx.user, action: AGENCY_ACTIVITY_ACTIONS.CLIENT_MERGED,
        entityType: "CrmClient", entityId: target.id, entityLabel: target.name, details: { from: source.name },
      });
    }
    revalidatePath(localizePath(`${LIST_PATH}/${target.id}`, ctx.locale));
    revalidatePath(localizePath(LIST_PATH, ctx.locale));
    return { ...success(t("merged")), clientId: target.id };
  } catch (error) {
    return unexpected("müştəri kartları birləşdirilmədi", error, t("errors.failed"));
  }
}
