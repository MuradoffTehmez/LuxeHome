"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit } from "@/lib/admin/audit";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import * as form from "@/lib/admin/form";
import { PERMISSIONS, REVIEW_STATUSES } from "@/lib/constants";
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
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  languages: z.array(z.string()).max(20),
  areas: z.array(z.string()).max(50),
});

export async function createAgentProfile(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = agentSchema.safeParse({
    name: form.text(formData, "name"),
    slug: form.text(formData, "slug"),
    userId: form.text(formData, "userId"),
    agencyId: form.text(formData, "agencyId"),
    roleTitle: form.text(formData, "roleTitle"),
    specialization: form.text(formData, "specialization"),
    experienceYears: form.integer(formData, "experienceYears"),
    bio: form.text(formData, "bio"),
    phone: form.text(formData, "phone"),
    email: form.text(formData, "email"),
    languages: form.lines(formData, "languages"),
    areas: form.lines(formData, "areas"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return failure("Düzgün URL adı yaradılmadı.");

  try {
    const agent = await prisma.agentProfile.create({
      data: {
        name: parsed.data.name,
        slug,
        userId: parsed.data.userId || null,
        agencyId: parsed.data.agencyId || null,
        roleTitle: parsed.data.roleTitle || null,
        specialization: parsed.data.specialization || null,
        experienceYears: parsed.data.experienceYears,
        bio: parsed.data.bio || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        languages: JSON.stringify(parsed.data.languages),
        areas: JSON.stringify(parsed.data.areas),
        isVerified: form.boolean(formData, "isVerified"),
        isPublic: form.boolean(formData, "isPublic"),
      },
    });
    await recordAudit(actor, "CREATE", "AgentProfile", agent.id, parsed.data.name);
    revalidatePath("/admin/agentler");
    revalidatePath("/agentler");
    return success("Agent profili yaradıldı.");
  } catch (error) {
    return unexpected("agent profili yaradılmadı", error, "Agent profili yaradıla bilmədi. URL adı və bağlı hesab təkrarsız olmalıdır.");
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
