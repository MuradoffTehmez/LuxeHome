"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_STATUSES, MAX_AGENCY_EMPLOYEES, PERMISSIONS } from "@/lib/constants";
import {
  type ActionState,
  failure,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { recordDomainEvent } from "@/lib/admin/events";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";
import { msg } from "@/lib/admin/server-message";
import { isBulkFailure, readBulkSelection, runBulk } from "@/lib/admin/bulk";
import { findManyInChunks } from "@/lib/d1-chunks";
import { deletePublicAccount } from "../hesablar/actions";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { commitMembershipDecision, hasFreeApprovedSeat, hasOtherApprovedMembership } from "@/lib/accounts/agency-membership";
import { noticeAgencyDecision } from "@/lib/accounts/account-notices";
import { checkLogoFile, logoFromForm, storeAgencyLogo } from "@/lib/accounts/agency-logo";

const LIST_PATH = "/admin/agentlikler";

/**
 * Agentlik təsdiqi açar-bağlayır.
 *
 * `Agency.isVerified` ictimai `/agentlikler` səhifəsində göstərilmə şərtidir —
 * təsdiqlənməyən agentlik saytda görünmür.
 */
export async function toggleAgencyVerification(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true, isVerified: true },
    });
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));

    const next = !agency.isVerified;

    await prisma.agency.update({
      where: { id },
      data: { isVerified: next, verifiedAt: next ? new Date() : null },
    });
    if (next) {
      await prisma.user.update({ where: { id: agency.userId }, data: { approvedAt: new Date() } });
    }

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      id,
      `${agency.name} — ${next ? "təsdiqləndi" : "təsdiqi ləğv edildi"}`,
    );

    revalidatePath(LIST_PATH);
    revalidatePath("/agentlikler");
    return success(next ? msg("server.agentlikler.agentlikTesdiqlendi") : msg("server.agentlikler.agentliyinTesdiqiLegvEdildi"));
  } catch (error) {
    return unexpected("agentlik yenilənmədi", error, msg("server.common.unexpected"));
  }
}

/** Köhnə və ya yarımçıq agentlik hesabı üçün admin tərəfindən profil yaradır. */
export async function createAgencyProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const userId = form.text(formData, "userId");
  const name = form.text(formData, "name").trim();
  if (!userId || name.length < 2 || name.length > 160) {
    return failure(msg("server.agentlikler.agentlikAdi2160Simvol"), {
      name: msg("server.agentlikler.duzgunAgentlikAdiYazin"),
    });
  }

  try {
    const account = await prisma.user.findFirst({
      where: { id: userId, accountType: "AGENCY" },
      select: { id: true, email: true, phone: true, agency: { select: { id: true } } },
    });
    if (!account) return failure(msg("server.agentlikler.agentlikHesabiTapilmadi"));
    if (account.agency) return failure(msg("server.agentlikler.buHesabinAgentlikProfiliArtiq"));

    const slug = await uniqueSlug(name, (candidate) =>
      prisma.agency.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );
    const agency = await prisma.agency.create({
      data: {
        userId,
        name,
        slug,
        phone: account.phone,
        isVerified: false,
      },
      select: { id: true },
    });

    await recordAudit(actor, "CREATE", "Agency", agency.id, `${name} · ${account.email}`);
    revalidatePath(LIST_PATH);
    return success(msg("server.agentlikler.agentlikProfiliYaradildiIndiOnu"));
  } catch (error) {
    return unexpected("agentlik profili yaradılmadı", error, msg("server.common.unexpected"));
  }
}

export async function approveAgencyEmployee(id: string): Promise<ActionState> {
  return reviewAgencyEmployee(id, AGENCY_EMPLOYEE_STATUSES.APPROVED);
}

export async function rejectAgencyEmployee(id: string): Promise<ActionState> {
  return reviewAgencyEmployee(id, AGENCY_EMPLOYEE_STATUSES.REJECTED);
}

/** Agentlik komandasına dəvət olunan əməkdaşı təsdiqləyir və ya rədd edir. */
async function reviewAgencyEmployee(
  id: string,
  decision: typeof AGENCY_EMPLOYEE_STATUSES.APPROVED | typeof AGENCY_EMPLOYEE_STATUSES.REJECTED,
): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const employee = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        invitedAt: true,
        agency: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!employee) return failure(msg("server.agentlikler.devetTapilmadi"));
    const approved = decision === AGENCY_EMPLOYEE_STATUSES.APPROVED;
    // Artıq təsdiqlənmiş qeydin təkrar təsdiqi yarımçıq qalmış profil bağlantısını tamamlayır.
    const reviewable = employee.status === AGENCY_EMPLOYEE_STATUSES.PENDING
      || (approved && employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED);
    if (!reviewable) {
      return failure(msg("server.agentlikler.buDevetArtiqNezerdenKecirilib"));
    }
    if (approved && employee.status === AGENCY_EMPLOYEE_STATUSES.PENDING) {
      if (!(await hasFreeApprovedSeat(employee.agency.id))) {
        return failure(msg("server.agentlikler.emekdasLimiti", { count: MAX_AGENCY_EMPLOYEES }));
      }
      if (await hasOtherApprovedMembership(employee.userId, employee.agency.id)) {
        return failure(msg("server.agentlikler.basqaAgentlikdedir"));
      }
    }

    // Şərti yeniləmə + kompensasiya — sahib eyni sorğunu kabinetdə eyni anda təsdiqləyə bilər.
    const result = await commitMembershipDecision({
      id,
      userId: employee.userId,
      agencyId: employee.agency.id,
      approved,
      currentStatus: employee.status,
    });
    if (result === "conflict") return failure(msg("server.agentlikler.buDevetArtiqNezerdenKecirilib"));
    if (result === "resumed") {
      revalidatePath(LIST_PATH);
      revalidatePublicContent("agency", employee.agency.slug);
      return success(msg("server.agentlikler.emekdasTesdiqlendi"));
    }
    await noticeAgencyDecision({
      userId: employee.userId,
      employeeId: id,
      attemptAt: employee.invitedAt,
      agencyName: employee.agency.name,
      approved,
    });

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      employee.agency.id,
      `${employee.user.email} — komanda dəvəti ${decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "təsdiqləndi" : "rədd edildi"}`,
    );
    await recordDomainEvent(
      decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "agency.employee_approved" : "agency.employee_rejected",
      "AgencyEmployee",
      id,
      { agencyId: employee.agency.id, userEmail: employee.user.email },
    );

    revalidatePath(LIST_PATH);
    revalidatePath("/kabinet/komanda");
    revalidatePublicContent("agency", employee.agency.slug);
    revalidatePublicContent("property");
    return success(
      decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? msg("server.agentlikler.emekdasTesdiqlendi") : msg("server.agentlikler.devetReddEdildi"),
    );
  } catch (error) {
    return unexpected("dəvət yenilənmədi", error, msg("server.common.unexpected"));
  }
}

const AGENCY_BULK_INTENTS = ["approve", "revoke", "delete"] as const;

/**
 * «Agentliklər» siyahısında toplu təsdiq, təsdiqin ləğvi və silmə.
 *
 * Siyahının sətri agentlik hesabıdır (`User.id`); silmə hesabı «Hesablar»dakı eyni
 * iki mərhələli yolla silir, agentlik profili isə kaskadla gedir.
 */
export async function bulkAgencies(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const selection = readBulkSelection(formData, AGENCY_BULK_INTENTS);
  if (isBulkFailure(selection)) return selection;
  const { ids, intent } = selection;

  if (intent === "delete") return runBulk(ids, deletePublicAccount);

  const agencies = await findManyInChunks(ids, 0, (chunk) =>
    prisma.agency.findMany({ where: { userId: { in: chunk } }, select: { id: true, userId: true, isVerified: true } }),
  );
  const target = intent === "approve";
  return runBulk(ids, async (userId) => {
    const agency = agencies.find((item) => item.userId === userId);
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));
    return agency.isVerified === target ? success("") : toggleAgencyVerification(agency.id);
  });
}

/**
 * Agentliyin loqosunu paneldən yeniləyir. Fayl agentlik hesabının adına yazılır
 * (`Media.uploaderId` = agentlik sahibi): kabinet profili loqonu sahibin öz faylı kimi
 * yoxlayır və əks halda sahibin növbəti profil saxlaması «şəkil sizə aid deyil» xətası verərdi.
 */
export async function updateAgencyLogo(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const agencyId = form.text(formData, "agencyId");
  const logo = logoFromForm(formData);
  if (!logo || (await checkLogoFile(logo)) !== "ok") {
    return failure(msg("server.agentlikler.loqoXetasi"), { logo: msg("server.agentlikler.loqoXetasi") });
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, slug: true, userId: true },
    });
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));

    const url = await storeAgencyLogo(agency.userId, logo, agency.name);
    if (!url) return failure(msg("server.agentlikler.loqoXetasi"));

    await recordAudit(actor, "UPDATE", "Agency", agency.id, `${agency.name} — loqo yeniləndi`);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("agency", agency.slug);
    revalidatePublicContent("property");
    return success(msg("server.agentlikler.loqoYenilendi"));
  } catch (error) {
    return unexpected("agentlik loqosu yenilənmədi", error, msg("server.common.unexpected"));
  }
}

export async function removeAgencyLogo(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, userId: true, logoUrl: true },
    });
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));

    await prisma.agency.update({ where: { id }, data: { logoUrl: null } });
    if (agency.logoUrl) {
      // Loqo hesabın profil şəkli ilə eynidirsə o da təmizlənir — profil saxlananda geri yazılmasın.
      await prisma.user.updateMany({
        where: { id: agency.userId, avatarUrl: agency.logoUrl },
        data: { avatarUrl: null },
      });
    }

    await recordAudit(actor, "UPDATE", "Agency", agency.id, `${agency.name} — loqo silindi`);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("agency", agency.slug);
    revalidatePublicContent("property");
    return success(msg("server.agentlikler.loqoSilindi"));
  } catch (error) {
    return unexpected("agentlik loqosu silinmədi", error, msg("server.common.unexpected"));
  }
}
