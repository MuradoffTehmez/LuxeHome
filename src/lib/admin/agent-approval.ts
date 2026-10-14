import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { msg } from "@/lib/admin/server-message";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { noticeAccountReview } from "@/lib/accounts/account-notices";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Agent profilini təsdiqləyir və dərc edir (#155, #157) — **guard-sız** daxili addım.
 *
 * Yalnız artıq `requireAdminAction` keçmiş `actor` ilə çağırılır: tək action
 * (`approveAndPublishAgent`) və təsdiq növbəsinin toplu əməliyyatı. Burada guard
 * yoxdur ki, toplu əməliyyat hər qeyd üçün yazma limitindən ayrıca vahid yeməsin.
 * Bu modul `"use server"` deyil — birbaşa POST ilə çağırıla bilməz.
 */
export async function approveAndPublishAgentAs(actor: AuthUser, id: string): Promise<ActionState> {
  try {
    const current = await prisma.agentProfile.findUnique({
      where: { id },
      select: { name: true, slug: true, userId: true, isVerified: true },
    });
    if (!current) return failure(msg("server.agentler.agentTapilmadi"));
    await prisma.agentProfile.update({
      where: { id },
      data: { isVerified: true, isPublic: true, rejectedAt: null, rejectionReason: null },
    });
    // Bildiriş yalnız ilk təsdiqdə — gizlədilib yenidən dərc edilən profil üçün təkrar getmir.
    if (!current.isVerified && current.userId) {
      await noticeAccountReview({
        userId: current.userId,
        kind: "agent",
        subjectId: id,
        name: current.name,
        approved: true,
        decidedAt: new Date(),
      });
    }
    await recordAudit(actor, "UPDATE", "AgentProfile", id, `${current.name} — təsdiqləndi və dərc edildi`);
    revalidatePath("/admin/agentler");
    revalidatePath("/admin/agentlikler/tesdiq");
    revalidatePublicContent("agent", current.slug);
    revalidatePublicContent("agency");
    return success(msg("server.agentler.tesdiqlendiVeDercEdildi"));
  } catch (error) {
    return unexpected("agent təsdiqlənmədi", error, msg("server.common.unexpected"));
  }
}
