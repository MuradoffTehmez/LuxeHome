"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  PARTNER_STATUSES,
  PERMISSIONS,
  type Permission,
} from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { sanitizeRichText } from "@/lib/admin/html";
import { parseImages } from "@/lib/admin/images";
import {
  partnerContractSchema,
  partnerRelationSchema,
  partnerSchema,
  type PartnerContractInput,
  type PartnerInput,
} from "@/lib/admin/schemas";
import * as form from "@/lib/admin/form";
import { hasPermission } from "@/lib/auth/permissions";
import { partnerDomain } from "@/lib/partners";
import { slugify } from "@/lib/utils";
import { getExpiredActivePartners } from "@/lib/queries";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import type { AuthUser } from "@/lib/auth/types";

const LIST_PATH = "/admin/terefdaslar";

function readPartnerForm(formData: FormData): PartnerInput {
  return {
    name: form.text(formData, "name"),
    legalName: form.optionalText(formData, "legalName"),
    slug: form.text(formData, "slug"),
    partnershipType: form.text(formData, "partnershipType"),
    status: form.text(formData, "status"),
    shortDescription: form.optionalText(formData, "shortDescription"),
    shortDescriptionEn: form.optionalText(formData, "shortDescriptionEn"),
    shortDescriptionRu: form.optionalText(formData, "shortDescriptionRu"),
    description: form.optionalText(formData, "description"),
    descriptionEn: form.optionalText(formData, "descriptionEn"),
    descriptionRu: form.optionalText(formData, "descriptionRu"),
    disclaimer: form.optionalText(formData, "disclaimer"),
    disclaimerEn: form.optionalText(formData, "disclaimerEn"),
    disclaimerRu: form.optionalText(formData, "disclaimerRu"),
    websiteUrl: form.optionalText(formData, "websiteUrl"),
    email: form.optionalText(formData, "email"),
    phone: form.optionalText(formData, "phone"),
    whatsapp: form.optionalText(formData, "whatsapp"),
    country: form.optionalText(formData, "country"),
    city: form.optionalText(formData, "city"),
    address: form.optionalText(formData, "address"),
    verified: form.boolean(formData, "verified"),
    officialPartner: form.boolean(formData, "officialPartner"),
    featured: form.boolean(formData, "featured"),
    showPublicly: form.boolean(formData, "showPublicly"),
    showOnHomepage: form.boolean(formData, "showOnHomepage"),
    officialSince: form.date(formData, "officialSince"),
    partnershipEndDate: form.date(formData, "partnershipEndDate"),
    sortOrder: form.integer(formData, "sortOrder") ?? 0,
    seoTitle: form.optionalText(formData, "seoTitle"),
    seoDescription: form.optionalText(formData, "seoDescription"),
    seoKeywords: form.optionalText(formData, "seoKeywords"),
    ogImage: form.optionalText(formData, "ogImage"),
  } as PartnerInput;
}

function readContractForm(formData: FormData): PartnerContractInput {
  return {
    contractNumber: form.optionalText(formData, "contractNumber"),
    contractStartDate: form.date(formData, "contractStartDate"),
    contractEndDate: form.date(formData, "contractEndDate"),
    contractDocument: form.optionalText(formData, "contractDocument"),
    internalNotes: form.optionalText(formData, "internalNotes"),
  };
}

function firstImage(formData: FormData, name: string): string | null {
  return parseImages(formData, name)[0]?.url ?? null;
}

function can(user: AuthUser, permission: Permission): boolean {
  return hasPermission(user.role, permission);
}

function publicSnapshot(value: PartnerInput) {
  return {
    name: value.name,
    slug: value.slug,
    partnershipType: value.partnershipType,
    status: value.status,
    verified: value.verified,
    officialPartner: value.officialPartner,
    featured: value.featured,
    showPublicly: value.showPublicly,
    showOnHomepage: value.showOnHomepage,
    officialSince: value.officialSince,
    partnershipEndDate: value.partnershipEndDate,
    sortOrder: value.sortOrder,
  };
}

async function sanitizePartnerData(input: PartnerInput, formData: FormData) {
  const [description, descriptionEn, descriptionRu] = await Promise.all([
    input.description ? sanitizeRichText(input.description) : null,
    input.descriptionEn ? sanitizeRichText(input.descriptionEn) : null,
    input.descriptionRu ? sanitizeRichText(input.descriptionRu) : null,
  ]);

  return {
    ...input,
    description,
    descriptionEn,
    descriptionRu,
    logoUrl: firstImage(formData, "logo"),
    logoLight: firstImage(formData, "logoLight"),
    logoDark: firstImage(formData, "logoDark"),
    coverImage: firstImage(formData, "coverImage"),
  };
}

async function duplicateErrors(input: PartnerInput, excludeId?: string) {
  const desiredSlug = slugify(input.slug || input.name);
  const domain = partnerDomain(input.websiteUrl);
  const legalName = input.legalName?.trim().toLocaleLowerCase("az") ?? null;

  const candidates = await prisma.partner.findMany({
    where: { deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true, legalName: true, websiteUrl: true },
  });

  const errors: Record<string, string> = {};
  if (candidates.some((candidate) => candidate.slug === desiredSlug)) {
    errors.slug = "Bu slug ilə tərəfdaş artıq mövcuddur";
  }
  if (domain && candidates.some((candidate) => partnerDomain(candidate.websiteUrl) === domain)) {
    errors.websiteUrl = "Bu sayt domeni başqa tərəfdaşda istifadə olunur";
  }
  if (
    legalName &&
    candidates.some(
      (candidate) => candidate.legalName?.trim().toLocaleLowerCase("az") === legalName,
    )
  ) {
    errors.legalName = "Bu hüquqi adla tərəfdaş artıq mövcuddur";
  }

  return { slug: desiredSlug || "terefdas", errors };
}

function permissionError(message: string): ActionState {
  return failure(message);
}

function assertSensitivePermissions(
  user: AuthUser,
  input: PartnerInput,
  previous?: { verified: boolean; status: string; showPublicly: boolean },
): ActionState | null {
  if (
    (!previous && input.verified) ||
    (previous && previous.verified !== input.verified)
  ) {
    if (!can(user, PERMISSIONS.PARTNER_VERIFY)) {
      return permissionError("Tərəfdaşı təsdiqləmək üçün icazəniz yoxdur.");
    }
  }

  const publishChanged = previous
    ? previous.status !== input.status || previous.showPublicly !== input.showPublicly
    : input.status === PARTNER_STATUSES.ACTIVE || input.showPublicly;
  if (publishChanged && !can(user, PERMISSIONS.PARTNER_PUBLISH)) {
    return permissionError("Tərəfdaşın yayımlanma vəziyyətini dəyişmək üçün icazəniz yoxdur.");
  }

  return null;
}

export async function createPartner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_CREATE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = partnerSchema.safeParse(readPartnerForm(formData));
  if (!parsed.success) return invalid(parsed.error);
  const sensitiveError = assertSensitivePermissions(user, parsed.data);
  if (sensitiveError) return sensitiveError;

  const duplicate = await duplicateErrors(parsed.data);
  if (Object.keys(duplicate.errors).length > 0) {
    return failure("Eyni tərəfdaşa bənzəyən qeyd artıq mövcuddur.", duplicate.errors);
  }

  let contract: PartnerContractInput | null = null;
  if (can(user, PERMISSIONS.PARTNER_CONTRACT_MANAGE)) {
    const parsedContract = partnerContractSchema.safeParse(readContractForm(formData));
    if (!parsedContract.success) return invalid(parsedContract.error);
    contract = parsedContract.data;
  }

  let partnerId: string;
  try {
    const data = await sanitizePartnerData(parsed.data, formData);
    const partner = await prisma.partner.create({
      data: {
        ...data,
        ...contract,
        slug: duplicate.slug,
        verifiedAt: data.verified ? new Date() : null,
        createdById: user.id,
        updatedById: user.id,
      },
      select: { id: true },
    });
    partnerId = partner.id;

    await recordAudit(user, "CREATE", "Partner", partner.id, data.name, {
      newValue: publicSnapshot({ ...parsed.data, slug: duplicate.slug }),
    });
  } catch (error) {
    return unexpected("tərəfdaş yaradıla bilmədi", error);
  }

  revalidatePath(LIST_PATH);
  revalidatePublicContent("partner", duplicate.slug);
  redirect(`${LIST_PATH}/${partnerId}`);
}

export async function updatePartner(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_UPDATE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Tərəfdaş tapılmadı.");

  const parsed = partnerSchema.safeParse(readPartnerForm(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    const existing = await prisma.partner.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verified: true,
        officialPartner: true,
        featured: true,
        showPublicly: true,
        showOnHomepage: true,
        officialSince: true,
        partnershipEndDate: true,
        partnershipType: true,
        sortOrder: true,
      },
    });
    if (!existing) return failure("Tərəfdaş tapılmadı və ya silinib.");

    const sensitiveError = assertSensitivePermissions(user, parsed.data, existing);
    if (sensitiveError) return sensitiveError;

    const duplicate = await duplicateErrors(parsed.data, id);
    if (Object.keys(duplicate.errors).length > 0) {
      return failure("Eyni tərəfdaşa bənzəyən qeyd artıq mövcuddur.", duplicate.errors);
    }

    const data = await sanitizePartnerData(parsed.data, formData);
    const contractResult = can(user, PERMISSIONS.PARTNER_CONTRACT_MANAGE)
      ? partnerContractSchema.safeParse(readContractForm(formData))
      : null;
    if (contractResult && !contractResult.success) return invalid(contractResult.error);

    await prisma.partner.update({
      where: { id },
      data: {
        ...data,
        ...(contractResult?.success ? contractResult.data : {}),
        slug: duplicate.slug,
        verifiedAt: data.verified ? (existing.verified ? undefined : new Date()) : null,
        updatedById: user.id,
      },
    });

    const previousSnapshot = {
      name: existing.name,
      slug: existing.slug,
      partnershipType: existing.partnershipType,
      status: existing.status,
      verified: existing.verified,
      officialPartner: existing.officialPartner,
      featured: existing.featured,
      showPublicly: existing.showPublicly,
      showOnHomepage: existing.showOnHomepage,
      officialSince: existing.officialSince,
      partnershipEndDate: existing.partnershipEndDate,
      sortOrder: existing.sortOrder,
    };
    const nextSnapshot = publicSnapshot({ ...parsed.data, slug: duplicate.slug });
    await recordAudit(user, "UPDATE", "Partner", id, data.name, {
      oldValue: previousSnapshot,
      newValue: nextSnapshot,
    });
    if (existing.verified !== data.verified) {
      await recordAudit(user, "VERIFY", "Partner", id, data.name, {
        oldValue: { verified: existing.verified },
        newValue: { verified: data.verified },
      });
    }
    if (existing.status !== data.status) {
      await recordAudit(user, "STATUS_CHANGE", "Partner", id, data.name, {
        oldValue: { status: existing.status },
        newValue: { status: data.status },
      });
    }
    if (existing.showPublicly !== data.showPublicly) {
      await recordAudit(
        user,
        data.showPublicly ? "PUBLISH" : "UNPUBLISH",
        "Partner",
        id,
        data.name,
      );
    }

    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    revalidatePublicContent("partner", existing.slug);
    revalidatePublicContent("partner", duplicate.slug);
    return success("Tərəfdaş yeniləndi.");
  } catch (error) {
    return unexpected("tərəfdaş yenilənmədi", error);
  }
}

export async function deletePartner(id: string): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_DELETE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
        showPublicly: false,
        showOnHomepage: false,
      },
      select: { name: true, slug: true },
    });
    await recordAudit(user, "DELETE", "Partner", id, partner.name);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("partner", partner.slug);
    return success("Tərəfdaş silindi. Qeyd audit və əlaqələr üçün saxlanıldı.");
  } catch (error) {
    return unexpected("tərəfdaş silinmədi", error);
  }
}

export async function restorePartner(id: string): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_DELETE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const partner = await prisma.partner.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, status: PARTNER_STATUSES.ARCHIVED },
      select: { name: true, slug: true },
    });
    await recordAudit(user, "RESTORE", "Partner", id, partner.name);
    revalidatePath(LIST_PATH);
    return success("Tərəfdaş arxiv statusunda bərpa edildi.");
  } catch (error) {
    return unexpected("tərəfdaş bərpa edilmədi", error);
  }
}

/** Siyahıdan tərəfdaş profilini silmədən saytda göstərir və ya gizlədir. */
export async function togglePartnerVisibility(id: string): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_PUBLISH);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const partner = await prisma.partner.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true, status: true, showPublicly: true },
    });
    if (!partner) return failure("Tərəfdaş tapılmadı.");
    if (!partner.showPublicly && partner.status !== PARTNER_STATUSES.ACTIVE) {
      return failure("Saytda göstərmək üçün tərəfdaşın statusu əvvəlcə «Aktiv» olmalıdır.");
    }

    const showPublicly = !partner.showPublicly;
    await prisma.partner.update({
      where: { id },
      data: {
        showPublicly,
        showOnHomepage: showPublicly ? undefined : false,
        updatedById: user.id,
      },
    });
    await recordAudit(user, showPublicly ? "PUBLISH" : "UNPUBLISH", "Partner", id, partner.name);
    revalidatePath(LIST_PATH);
    revalidatePublicContent("partner", partner.slug);
    return success(showPublicly ? "Tərəfdaş silinmədən saytda göstərildi." : "Tərəfdaş saytdan gizlədildi; məlumatları saxlanıldı.");
  } catch (error) {
    return unexpected("tərəfdaş görünüşü dəyişmədi", error);
  }
}

/** Cron-un sonradan eyni service məntiqini çağırması üçün toplu expiration əməliyyatı. */
export async function expireOverduePartners(): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_PUBLISH);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const expired = await getExpiredActivePartners();
    for (const partner of expired) {
      await prisma.partner.update({
        where: { id: partner.id },
        data: {
          status: PARTNER_STATUSES.EXPIRED,
          showOnHomepage: false,
          updatedById: user.id,
        },
      });
      await recordAudit(user, "EXPIRE", "Partner", partner.id, partner.name, {
        oldValue: { status: PARTNER_STATUSES.ACTIVE },
        newValue: { status: PARTNER_STATUSES.EXPIRED },
      });
    }
    revalidatePath(LIST_PATH);
    revalidatePublicContent("partner");
    return success(
      expired.length > 0
        ? `${expired.length} tərəfdaşın müddəti bitmiş kimi işarələndi.`
        : "Müddəti bitmiş aktiv tərəfdaş tapılmadı.",
    );
  } catch (error) {
    return unexpected("tərəfdaş müddətləri yoxlanmadı", error);
  }
}

type RelationEntity = "property" | "project" | "agency";

function relationEntity(value: string): RelationEntity | null {
  return value === "property" || value === "project" || value === "agency" ? value : null;
}

export async function addPartnerRelation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user: AuthUser;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_RELATION_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const entity = relationEntity(form.text(formData, "entityType"));
  const entityId = form.text(formData, "entityId");
  if (!entity || !entityId) return failure("Əlaqələndiriləcək qeyd seçilməyib.");

  const parsed = partnerRelationSchema.safeParse({
    partnerId: form.text(formData, "partnerId"),
    role: form.text(formData, "role"),
    sourceUrl: form.optionalText(formData, "sourceUrl"),
    isPublic: form.boolean(formData, "isPublic"),
    isPrimary: form.boolean(formData, "isPrimary"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const partner = await prisma.partner.findFirst({
      where: { id: parsed.data.partnerId, deletedAt: null },
      select: { id: true, name: true, slug: true },
    });
    if (!partner) return failure("Tərəfdaş tapılmadı.");

    if (entity === "property") {
      const property = await prisma.property.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, slug: true },
      });
      if (!property) return failure("Elan tapılmadı.");
      if (parsed.data.isPrimary) {
        await prisma.propertyPartner.updateMany({
          where: { propertyId: entityId },
          data: { isPrimary: false },
        });
      }
      await prisma.propertyPartner.create({
        data: { propertyId: entityId, ...parsed.data },
      });
      revalidatePublicContent("property", property.slug);
    } else if (entity === "project") {
      const project = await prisma.project.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true, slug: true },
      });
      if (!project) return failure("Layihə tapılmadı.");
      if (parsed.data.isPrimary) {
        await prisma.projectPartner.updateMany({
          where: { projectId: entityId },
          data: { isPrimary: false },
        });
      }
      await prisma.projectPartner.create({
        data: {
          projectId: entityId,
          partnerId: parsed.data.partnerId,
          role: parsed.data.role,
          sourceUrl: parsed.data.sourceUrl,
          isPublic: parsed.data.isPublic,
          isPrimary: parsed.data.isPrimary,
        },
      });
      revalidatePath(`/admin/layiheler/${entityId}`);
      revalidatePublicContent("project", project.slug);
    } else {
      const agency = await prisma.agency.findUnique({
        where: { id: entityId },
        select: { id: true, slug: true },
      });
      if (!agency) return failure("Agentlik tapılmadı.");
      await prisma.agencyPartner.create({
        data: {
          agencyId: entityId,
          partnerId: parsed.data.partnerId,
          role: parsed.data.role,
          isPublic: parsed.data.isPublic,
        },
      });
      revalidatePublicContent("agency", agency.slug);
    }

    await recordAudit(user, "RELATION_CHANGE", "Partner", partner.id, partner.name, {
      newValue: { entity, entityId, role: parsed.data.role },
    });
    revalidatePath(`${LIST_PATH}/${partner.id}`);
    revalidatePublicContent("partner", partner.slug);
    return success("Əlaqə əlavə edildi.");
  } catch (error) {
    return unexpected(
      "tərəfdaş əlaqəsi əlavə edilmədi",
      error,
      "Əlaqə əlavə edilmədi. Eyni rol artıq mövcud ola bilər.",
    );
  }
}

export async function removePartnerRelation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let user: AuthUser;
  let relatedProjectId: string | null = null;
  try {
    user = await requireAdminAction(PERMISSIONS.PARTNER_RELATION_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const entity = relationEntity(form.text(formData, "entityType"));
  const relationId = form.text(formData, "relationId");
  const partnerId = form.text(formData, "partnerId");
  if (!entity || !relationId || !partnerId) return failure("Əlaqə tapılmadı.");

  try {
    if (entity === "property") {
      await prisma.propertyPartner.deleteMany({ where: { id: relationId, partnerId } });
    } else if (entity === "project") {
      const relation = await prisma.projectPartner.findFirst({
        where: { id: relationId, partnerId },
        select: { projectId: true },
      });
      relatedProjectId = relation?.projectId ?? null;
      await prisma.projectPartner.deleteMany({ where: { id: relationId, partnerId } });
    } else {
      await prisma.agencyPartner.deleteMany({ where: { id: relationId, partnerId } });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { name: true, slug: true },
    });
    await recordAudit(user, "RELATION_CHANGE", "Partner", partnerId, partner?.name, {
      oldValue: { entity, relationId },
    });
    revalidatePath(`${LIST_PATH}/${partnerId}`);
    if (relatedProjectId) revalidatePath(`/admin/layiheler/${relatedProjectId}`);
    if (partner) revalidatePublicContent("partner", partner.slug);
    return success("Əlaqə silindi.");
  } catch (error) {
    return unexpected("tərəfdaş əlaqəsi silinmədi", error);
  }
}
