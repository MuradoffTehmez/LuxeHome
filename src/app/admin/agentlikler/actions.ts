"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  AGENCY_EMPLOYEE_STATUSES,
  MAX_AGENCY_EMPLOYEES,
  MAX_AGENCY_OFFICES,
  PERMISSIONS,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
} from "@/lib/constants";
import {
  type ActionState,
  failure,
  success,
  toFieldErrors,
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
import { noticeAccountReview, noticeAgencyDecision } from "@/lib/accounts/account-notices";
import { checkLogoFile, logoFromForm, storeAgencyLogo } from "@/lib/accounts/agency-logo";
import { isPhoneLike, normalizeTaxId } from "@/lib/accounts/profile-fields";
import { isAgencyTaxIdTaken } from "@/lib/accounts/agency-tax-id";
import { parseSingleImage } from "@/lib/admin/images";
import { createAgencyOffice, deleteAgencyOffice, parseOfficeForm } from "@/lib/accounts/agency-offices";
import { approveAndPublishAgent } from "../agentler/actions";
import { z } from "zod";

const LIST_PATH = "/admin/agentlikler";
const QUEUE_PATH = "/admin/agentlikler/tesdiq";

/** Rədd səbəbi (#157): bildiriş və e-poçta gedir, ona görə boş və ya həddən uzun ola bilməz. */
function parseRejectionReason(reason: unknown): string | null {
  const text = typeof reason === "string" ? reason.trim().replace(/\s+/g, " ") : "";
  return text.length >= REJECTION_REASON_MIN && text.length <= REJECTION_REASON_MAX ? text : null;
}

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
      select: { id: true, userId: true, name: true, slug: true, isVerified: true },
    });
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));

    const next = !agency.isVerified;
    const decidedAt = new Date();

    await prisma.agency.update({
      where: { id },
      // Təsdiq əvvəlki rəddi bağlayır — kabinetdə köhnə səbəb görünməsin (#157).
      data: next
        ? { isVerified: true, verifiedAt: decidedAt, rejectedAt: null, rejectionReason: null }
        : { isVerified: false, verifiedAt: null },
    });
    if (next) {
      await prisma.user.update({ where: { id: agency.userId }, data: { approvedAt: decidedAt } });
      await noticeAccountReview({
        userId: agency.userId,
        kind: "agency",
        subjectId: agency.id,
        name: agency.name,
        approved: true,
        decidedAt,
      });
    }

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      id,
      `${agency.name} — ${next ? "təsdiqləndi" : "təsdiqi ləğv edildi"}`,
    );

    revalidatePath(LIST_PATH);
    revalidatePath(QUEUE_PATH);
    revalidatePath("/agentlikler");
    revalidatePublicContent("agency", agency.slug);
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

/** Rədd səbəbi (#157) istəyə bağlıdır — yazılıbsa agentə bildirişdə göstərilir. */
export async function rejectAgencyEmployee(id: string, reason?: string): Promise<ActionState> {
  const note = typeof reason === "string" && reason.trim() ? parseRejectionReason(reason) : null;
  if (typeof reason === "string" && reason.trim() && !note) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }
  return reviewAgencyEmployee(id, AGENCY_EMPLOYEE_STATUSES.REJECTED, note);
}

/** Agentlik komandasına dəvət olunan əməkdaşı təsdiqləyir və ya rədd edir. */
async function reviewAgencyEmployee(
  id: string,
  decision: typeof AGENCY_EMPLOYEE_STATUSES.APPROVED | typeof AGENCY_EMPLOYEE_STATUSES.REJECTED,
  note: string | null = null,
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
    await prisma.agencyEmployee.update({ where: { id }, data: { decisionNote: approved ? null : note } });
    await noticeAgencyDecision({
      userId: employee.userId,
      employeeId: id,
      attemptAt: employee.invitedAt,
      agencyName: employee.agency.name,
      approved,
      reason: note,
    });

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      employee.agency.id,
      `${employee.user.email} — komanda dəvəti ${decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "təsdiqləndi" : "rədd edildi"}${note ? ` (${note})` : ""}`,
    );
    await recordDomainEvent(
      decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "agency.employee_approved" : "agency.employee_rejected",
      "AgencyEmployee",
      id,
      { agencyId: employee.agency.id, userEmail: employee.user.email },
    );

    revalidatePath(LIST_PATH);
    revalidatePath(QUEUE_PATH);
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

/**
 * Agentlik müraciətini səbəblə rədd edir (#157). Agentlik təsdiqsiz qalır və növbədən
 * çıxır (`rejectedAt`); sahib profili yeniləyəndə növbəyə qayıdır. Səbəb sahibə
 * kabinet bildirişi və e-poçt kimi gedir.
 */
export async function rejectAgencyApplication(id: string, reason: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const note = parseRejectionReason(reason);
  if (!note) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true, isVerified: true },
    });
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));
    if (agency.isVerified) return failure(msg("server.agentlikler.artiqTesdiqlenib"));

    const decidedAt = new Date();
    // Şərti yeniləmə: başqa admin eyni anda təsdiqləyibsə rədd üzərinə yazılmır.
    const { count } = await prisma.agency.updateMany({
      where: { id, isVerified: false },
      data: { rejectedAt: decidedAt, rejectionReason: note },
    });
    if (count === 0) return failure(msg("server.agentlikler.artiqTesdiqlenib"));

    await noticeAccountReview({
      userId: agency.userId,
      kind: "agency",
      subjectId: agency.id,
      name: agency.name,
      approved: false,
      decidedAt,
      reason: note,
    });
    await recordAudit(actor, "UPDATE", "Agency", id, `${agency.name} — müraciət rədd edildi: ${note}`);
    await recordDomainEvent("agency.application_rejected", "Agency", id, { reason: note });

    revalidatePath(LIST_PATH);
    revalidatePath(QUEUE_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return success(msg("server.agentlikler.muracietReddEdildi"));
  } catch (error) {
    return unexpected("agentlik müraciəti rədd edilmədi", error, msg("server.common.unexpected"));
  }
}

const QUEUE_BULK_INTENTS = ["agency", "agent", "employee"] as const;

/**
 * Təsdiq növbəsində toplu təsdiq (#157). Hər kart öz intent-i ilə gəlir (agentlik,
 * agent profili, komanda sorğusu) və hər id mövcud tək action-dan keçir — guard,
 * yer limiti, «bir aktiv agentlik» qaydası, bildiriş və audit onun içindədir.
 * Rədd toplu edilmir: hər rəddin öz səbəbi olmalıdır.
 */
export async function bulkApproveQueue(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const selection = readBulkSelection(formData, QUEUE_BULK_INTENTS);
  if (isBulkFailure(selection)) return selection;
  const { ids, intent } = selection;

  if (intent === "agent") return runBulk(ids, approveAndPublishAgent);
  if (intent === "employee") return runBulk(ids, approveAgencyEmployee);

  const agencies = await findManyInChunks(ids, 0, (chunk) =>
    prisma.agency.findMany({ where: { id: { in: chunk } }, select: { id: true, isVerified: true } }),
  );
  return runBulk(ids, async (id) => {
    const agency = agencies.find((item) => item.id === id);
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));
    // Təsdiq açarı «toggle»-dur — artıq təsdiqlənmiş agentliyin təsdiqi ləğv olunmamalıdır.
    return agency.isVerified ? success("") : toggleAgencyVerification(agency.id);
  });
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

const optionalText = (max: number) => z.string().trim().max(max).nullable();

/**
 * Paneldən agentlik profilinin tam redaktəsi (#155): ad, təsvir, əlaqə, iş saatları.
 * Telefon və WhatsApp telefon formatında olmalıdır — kartda telefon yerində e-poçt
 * görünürdü. Ad dəyişəndə slug toqquşmasız yenilənir.
 */
export async function updateAgencyByAdmin(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const phoneRule = z.string().trim().max(30).refine(isPhoneLike, msg("server.agentlikler.telefonFormati")).nullable();
  const parsed = z
    .object({
      id: z.string().trim().min(1),
      name: z.string().trim().min(2, msg("server.agentlikler.agentlikAdi2160Simvol")).max(160, msg("server.agentlikler.agentlikAdi2160Simvol")),
      description: optionalText(2000),
      phone: phoneRule,
      whatsapp: phoneRule,
      email: z.string().trim().toLowerCase().max(200).pipe(z.email(msg("server.agentlikler.epoctFormati"))).nullable(),
      address: optionalText(240),
      workingHours: optionalText(120),
      website: z.string().trim().url(msg("server.agentlikler.saytFormati")).refine((value) => value.startsWith("https://"), msg("server.agentlikler.saytFormati")).nullable(),
      instagram: z
        .string()
        .trim()
        .regex(/^@?[A-Za-z0-9._]{1,30}$/, msg("server.agentlikler.instagramFormati"))
        .transform((value) => value.replace(/^@/, ""))
        .nullable(),
      companyTaxId: z.string().nullable(),
    })
    .safeParse({
      id: form.text(formData, "id"),
      name: form.text(formData, "name"),
      description: form.optionalText(formData, "description"),
      phone: form.optionalText(formData, "phone"),
      whatsapp: form.optionalText(formData, "whatsapp"),
      email: form.optionalText(formData, "email"),
      address: form.optionalText(formData, "address"),
      workingHours: form.optionalText(formData, "workingHours"),
      website: form.optionalText(formData, "website"),
      instagram: form.optionalText(formData, "instagram"),
      companyTaxId: form.optionalText(formData, "companyTaxId"),
    });
  if (!parsed.success) return failure(msg("server.common.formInvalid"), toFieldErrors(parsed.error));
  const data = parsed.data;
  const companyTaxId = normalizeTaxId(data.companyTaxId);
  if (companyTaxId === false) {
    return failure(msg("server.common.formInvalid"), { companyTaxId: msg("server.agentlikler.voenFormati") });
  }
  // Örtük şəkli paneldən yüklənir (`/media/umumi/...`) və ya kabinetdən gələn dəyər saxlanılır.
  const cover = parseSingleImage(formData, "cover");

  try {
    const current = await prisma.agency.findUnique({
      where: { id: data.id },
      select: { id: true, name: true, slug: true, userId: true, coverUrl: true },
    });
    if (!current) return failure(msg("server.agentlikler.agentlikTapilmadi"));
    if (companyTaxId && (await isAgencyTaxIdTaken(companyTaxId, current.userId))) {
      return failure(msg("server.common.formInvalid"), { companyTaxId: msg("server.agentlikler.voenTekrar") });
    }
    // Dəyişməyən örtük yoxlanılmır; yeni şəkil media kitabxanasında olmalıdır.
    if (cover && cover.url !== current.coverUrl) {
      const known = await prisma.media.findFirst({ where: { url: cover.url }, select: { id: true } });
      if (!known) return failure(msg("server.common.formInvalid"), { cover: msg("server.agentlikler.ortukXetasi") });
    }
    const slug = current.name === data.name
      ? current.slug
      : await uniqueSlug(data.name, (candidate) =>
          prisma.agency.findUnique({ where: { slug: candidate }, select: { id: true } }), current.id);

    await prisma.agency.update({
      where: { id: current.id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        address: data.address,
        workingHours: data.workingHours,
        website: data.website,
        instagram: data.instagram,
        coverUrl: cover?.url ?? null,
      },
    });
    await prisma.user.update({ where: { id: current.userId }, data: { companyTaxId } });
    await recordAudit(actor, "UPDATE", "Agency", current.id, `${data.name} — profil redaktə edildi`);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${current.id}`);
    revalidatePublicContent("agency", current.slug);
    if (slug !== current.slug) revalidatePublicContent("agency", slug);
    revalidatePublicContent("property");
    return success(msg("server.agentlikler.profilYenilendi"));
  } catch (error) {
    return unexpected("agentlik profili yenilənmədi", error, msg("server.common.unexpected"));
  }
}

/** Panel: agentliyə filial əlavə edir (#157) — kabinetlə eyni yoxlama (`agency-offices.ts`). */
export async function addAgencyOfficeByAdmin(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = parseOfficeForm(formData, {
    name: msg("server.agentlikler.filialAdi"),
    address: msg("server.agentlikler.filialUnvani"),
    phone: msg("server.agentlikler.telefonFormati"),
    city: msg("server.agentlikler.filialSeheri"),
    invalid: msg("server.common.formInvalid"),
  });
  if (!parsed.ok) return failure(msg("server.common.formInvalid"), parsed.fieldErrors);

  try {
    const agency = await prisma.agency.findUnique({
      where: { id: form.text(formData, "agencyId") },
      select: { id: true, name: true, slug: true },
    });
    if (!agency) return failure(msg("server.agentlikler.agentlikTapilmadi"));
    const result = await createAgencyOffice(agency.id, parsed.data);
    if (result === "limit") return failure(msg("server.agentlikler.filialLimiti", { count: MAX_AGENCY_OFFICES }));
    if (result === "city") return failure(msg("server.common.formInvalid"), { officeCityId: msg("server.agentlikler.filialSeheri") });

    await recordAudit(actor, "UPDATE", "Agency", agency.id, `${agency.name} — filial əlavə edildi: ${parsed.data.name}`);
    revalidatePath(`${LIST_PATH}/${agency.id}`);
    revalidatePublicContent("agency", agency.slug);
    return success(msg("server.agentlikler.filialElaveEdildi"));
  } catch (error) {
    return unexpected("filial əlavə olunmadı", error, msg("server.common.unexpected"));
  }
}

/** Panel: filialı silir (#157). */
export async function removeAgencyOfficeByAdmin(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const office = await prisma.agencyOffice.findUnique({
      where: { id },
      select: { id: true, name: true, agency: { select: { id: true, name: true, slug: true } } },
    });
    if (!office || !(await deleteAgencyOffice(office.agency.id, office.id))) {
      return failure(msg("server.agentlikler.filialTapilmadi"));
    }
    await recordAudit(actor, "UPDATE", "Agency", office.agency.id, `${office.agency.name} — filial silindi: ${office.name}`);
    revalidatePath(`${LIST_PATH}/${office.agency.id}`);
    revalidatePublicContent("agency", office.agency.slug);
    return success(msg("server.agentlikler.filialSilindi"));
  } catch (error) {
    return unexpected("filial silinmədi", error, msg("server.common.unexpected"));
  }
}
