"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { PERMISSIONS, REVIEW_STATUSES } from "@/lib/constants";
import { parseSingleImage } from "@/lib/admin/images";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const agentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(100).optional(),
  userId: z.string().trim().optional(),
  agencyId: z.string().trim().optional(),
  roleTitle: z.string().trim().max(120).optional(),
  specialization: z.string().trim().max(200).optional(),
  experienceYears: z.number().int().min(0).max(80).nullable(),
  bio: z.string().trim().max(3000).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  languages: z.array(z.string()).max(20),
  areas: z.array(z.string()).max(50),
  soldCount: z.number().int().min(0).max(100000).nullable(),
  rentedCount: z.number().int().min(0).max(100000).nullable(),
  /**
   * PRD bölmə 165: metrik «yalnız kifayət qədər real məlumat varsa» göstərilir.
   * Boş sahə `null` kimi saxlanılır və ictimai səthdə heç nə çıxmır — sıfır yazmaq
   * «0 dəqiqə ərzində cavab verir» kimi yanlış vəd olardı, ona görə minimum 1 dəqiqədir.
   */
  responseMinutes: z.number().int().min(1).max(10080).nullable(),
});

function readAgentForm(formData: FormData) {
  return agentSchema.safeParse({
    name: form.text(formData, "name"),
    slug: form.text(formData, "slug"),
    userId: form.text(formData, "userId"),
    agencyId: form.text(formData, "agencyId"),
    roleTitle: form.text(formData, "roleTitle"),
    specialization: form.text(formData, "specialization"),
    experienceYears: form.integer(formData, "experienceYears"),
    bio: form.text(formData, "bio"),
    phone: form.text(formData, "phone"),
    whatsapp: form.text(formData, "whatsapp"),
    email: form.text(formData, "email"),
    languages: form.lines(formData, "languages"),
    areas: form.lines(formData, "areas"),
    soldCount: form.integer(formData, "soldCount"),
    rentedCount: form.integer(formData, "rentedCount"),
    responseMinutes: form.integer(formData, "responseMinutes"),
  });
}

/**
 * Agent profilini yaradır və ya yeniləyir.
 *
 * `id` gizli sahəsi boşdursa yeni qeyd yaradılır. Yaratma və yeniləmə eyni sxemdən
 * keçir ki, redaktədə yumşaq, yaratmada sərt qayda kimi ikili davranış yaranmasın.
 */
export async function saveAgentProfile(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  const parsed = readAgentForm(formData);
  if (!parsed.success) return invalid(parsed.error);

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return failure("Düzgün URL adı yaradılmadı.");

  const avatar = parseSingleImage(formData, "avatar");
  const data = {
    name: parsed.data.name,
    slug,
    userId: parsed.data.userId || null,
    agencyId: parsed.data.agencyId || null,
    roleTitle: parsed.data.roleTitle || null,
    specialization: parsed.data.specialization || null,
    experienceYears: parsed.data.experienceYears,
    bio: parsed.data.bio || null,
    phone: parsed.data.phone || null,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    languages: JSON.stringify(parsed.data.languages),
    areas: JSON.stringify(parsed.data.areas),
    soldCount: parsed.data.soldCount ?? 0,
    rentedCount: parsed.data.rentedCount ?? 0,
    responseMinutes: parsed.data.responseMinutes,
    avatarUrl: avatar?.url ?? null,
    isVerified: form.boolean(formData, "isVerified"),
    isPublic: form.boolean(formData, "isPublic"),
  };

  try {
    if (id) {
      const previous = await prisma.agentProfile.findUnique({ where: { id }, select: { slug: true } });
      if (!previous) return failure("Agent tapılmadı.");
      await prisma.agentProfile.update({ where: { id }, data });
      await recordAudit(actor, "UPDATE", "AgentProfile", id, parsed.data.name);
      revalidatePath("/admin/agentler");
      revalidatePath(`/admin/agentler/${id}`);
      revalidatePath("/agentler");
      revalidatePath(`/agentler/${previous.slug}`);
      if (previous.slug !== slug) revalidatePath(`/agentler/${slug}`);
      return success("Agent profili yeniləndi.");
    }

    const agent = await prisma.agentProfile.create({ data });
    await recordAudit(actor, "CREATE", "AgentProfile", agent.id, parsed.data.name);
    revalidatePath("/admin/agentler");
    revalidatePath("/agentler");
    return success("Agent profili yaradıldı.");
  } catch (error) {
    return unexpected("agent profili saxlanılmadı", error, "Agent profili saxlanıla bilmədi. URL adı və bağlı hesab təkrarsız olmalıdır.");
  }
}

/**
 * Agent profilini silir.
 *
 * Elana təyin edilmiş agent varsa silinməyə icazə verilmir: silinmə elanın agent
 * kartını səssizcə boşaldardı və ziyarətçi əlaqə nöqtəsini itirərdi. Belə halda
 * əvvəlcə elanlar başqa agentə keçirilməlidir.
 */
export async function deleteAgentProfile(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const agent = await prisma.agentProfile.findUnique({
      where: { id },
      select: { name: true, slug: true, _count: { select: { properties: true } } },
    });
    if (!agent) return failure("Agent tapılmadı.");
    if (agent._count.properties > 0) {
      return failure(`Bu agentə ${agent._count.properties} elan təyin edilib. Əvvəlcə elanları başqa agentə keçirin.`);
    }

    await prisma.agentProfile.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "AgentProfile", id, agent.name);
    revalidatePath("/admin/agentler");
    revalidatePath("/agentler");
    revalidatePath(`/agentler/${agent.slug}`);
    return success("Agent profili silindi.");
  } catch (error) {
    return unexpected("agent profili silinmədi", error);
  }
}

async function moderateReview(id: string, status: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const review = await prisma.agentReview.update({
      where: { id },
      data: { status, moderatedAt: new Date() },
      select: { id: true, customerName: true, agent: { select: { slug: true } } },
    });
    await recordAudit(actor, "STATUS_CHANGE", "AgentReview", id, `${review.customerName} — ${status}`);
    revalidatePath("/admin/agentler");
    revalidatePath(`/agentler/${review.agent.slug}`);
    return success(status === REVIEW_STATUSES.APPROVED ? "Rəy təsdiqləndi." : "Rəy rədd edildi.");
  } catch (error) {
    return unexpected("agent rəyi moderasiya edilmədi", error);
  }
}

// `"use server"` faylındakı hər ixrac Server Action-dır və **async olmalıdır**.
// Sinxron sarğı Promise qaytarsa da Next.js build-i webpack mərhələsində saxlayır.
export async function approveAgentReview(id: string): Promise<ActionState> {
  return moderateReview(id, REVIEW_STATUSES.APPROVED);
}

export async function rejectAgentReview(id: string): Promise<ActionState> {
  return moderateReview(id, REVIEW_STATUSES.REJECTED);
}

export async function toggleAgentVisibility(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const current = await prisma.agentProfile.findUnique({ where: { id }, select: { name: true, slug: true, isPublic: true } });
    if (!current) return failure("Agent tapılmadı.");
    await prisma.agentProfile.update({ where: { id }, data: { isPublic: !current.isPublic } });
    await recordAudit(actor, "UPDATE", "AgentProfile", id, `${current.name} — ${current.isPublic ? "gizlədildi" : "dərc edildi"}`);
    revalidatePath("/admin/agentler");
    revalidatePath("/agentler");
    revalidatePath(`/agentler/${current.slug}`);
    return success(current.isPublic ? "Agent ictimai kataloqdan gizlədildi." : "Agent ictimai kataloqda dərc edildi.");
  } catch (error) {
    return unexpected("agent görünürlüğü dəyişmədi", error);
  }
}

const testimonialSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  review: z.string().trim().min(10).max(2000),
  rating: z.number().int().min(1).max(5),
  serviceType: z.string().trim().max(120).optional(),
  agentId: z.string().trim().optional(),
});

export async function createTestimonial(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const parsed = testimonialSchema.safeParse({
    customerName: form.text(formData, "customerName"),
    review: form.text(formData, "review"),
    rating: form.integer(formData, "rating"),
    serviceType: form.text(formData, "serviceType"),
    agentId: form.text(formData, "agentId"),
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const item = await prisma.testimonial.create({
      data: {
        ...parsed.data,
        agentId: parsed.data.agentId || null,
        serviceType: parsed.data.serviceType || null,
        status: REVIEW_STATUSES.APPROVED,
        approvedAt: new Date(),
      },
    });
    await recordAudit(actor, "CREATE", "Testimonial", item.id, parsed.data.customerName);
    revalidatePath("/admin/agentler");
    revalidatePath("/");
    return success("Müştəri rəyi dərc edildi.");
  } catch (error) {
    return unexpected("testimonial yaradılmadı", error);
  }
}

export async function deleteTestimonial(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const item = await prisma.testimonial.findUnique({ where: { id }, select: { customerName: true } });
    if (!item) return failure("Rəy tapılmadı.");
    await prisma.testimonial.delete({ where: { id } });
    await recordAudit(actor, "DELETE", "Testimonial", id, item.customerName);
    revalidatePath("/admin/agentler");
    revalidatePath("/");
    return success("Müştəri rəyi silindi.");
  } catch (error) {
    return unexpected("müştəri rəyi silinmədi", error);
  }
}
