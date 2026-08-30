"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/constants";

const reviewSchema = z.object({
  agentId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(20).max(2000),
  serviceType: z.string().trim().max(80).optional(),
});

export async function submitAgentReview(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("phase2.agents");
  let user;
  try {
    user = await requirePublicAction("review", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = reviewSchema.safeParse({
    agentId: formData.get("agentId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
    serviceType: formData.get("serviceType") || undefined,
  });
  if (!parsed.success) return failure(t("loginHint"));

  try {
    const [agent, duplicate] = await Promise.all([
      prisma.agentProfile.findFirst({
        where: { id: parsed.data.agentId, isPublic: true },
        select: { id: true },
      }),
      prisma.agentReview.findFirst({
        where: { agentId: parsed.data.agentId, customerId: user.id },
        select: { id: true },
      }),
    ]);
    if (!agent) return failure(t("notFound"));
    if (duplicate) return failure(t("reviewDuplicate"));

    await prisma.agentReview.create({
      data: {
        agentId: agent.id,
        customerId: user.id,
        customerName: user.name,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        serviceType: parsed.data.serviceType || null,
      },
    });
    return success(t("reviewSuccess"));
  } catch (error) {
    return unexpected("agent rəyi yaradıla bilmədi", error);
  }
}
