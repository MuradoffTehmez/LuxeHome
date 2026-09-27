"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, PUBLIC_ACCOUNT_TYPES } from "@/lib/constants";
import { revokeAllSessions } from "@/lib/auth/session";
import { requestAccountDeletion } from "@/lib/account-deletion";
import { findManyInChunks } from "@/lib/d1-chunks";
import { isBulkFailure, readBulkSelection, runBulk } from "@/lib/admin/bulk";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import {
  type ActionState,
  failure,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";

const LIST_PATH = "/admin/hesablar";

/** İctimai hesabları (STAFF xaric) deaktiv/aktiv edir. */
export async function togglePublicAccountActive(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const account = await prisma.user.findFirst({
      where: {
        id,
        accountType: { in: PUBLIC_ACCOUNT_TYPES },
      },
      select: { id: true, email: true, isActive: true },
    });
    if (!account) return failure(msg("server.hesablar.hesabTapilmadi"));

    const nextActive = !account.isActive;
    await prisma.user.update({ where: { id }, data: { isActive: nextActive } });
    if (!nextActive) await revokeAllSessions(id);

    await recordAudit(actor, "UPDATE", "User", id, `${account.email} — ${nextActive ? "aktivləşdirildi" : "deaktiv edildi"}`);
    revalidatePath(LIST_PATH);
    return success(nextActive ? msg("server.hesablar.hesabAktivlesdirildi") : msg("server.hesablar.hesabDeaktivEdildi"));
  } catch (error) {
    return unexpected("hesab yenilənmədi", error, msg("server.common.unexpected"));
  }
}

/** İctimai hesabın biznes yoxlamasını təsdiqləyir və ya geri götürür. */
export async function togglePublicAccountApproval(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const account = await prisma.user.findFirst({
      where: {
        id,
        accountType: { in: PUBLIC_ACCOUNT_TYPES },
      },
      select: { id: true, email: true, approvedAt: true },
    });
    if (!account) return failure(msg("server.hesablar.hesabTapilmadi"));

    const approvedAt = account.approvedAt ? null : new Date();
    await prisma.user.update({ where: { id }, data: { approvedAt } });

    await recordAudit(
      actor,
      "UPDATE",
      "User",
      id,
      `${account.email} — ${approvedAt ? "hesab təsdiqləndi" : "hesab təsdiqi ləğv edildi"}`,
    );
    revalidatePath(LIST_PATH);
    revalidatePath("/admin/agentlikler");
    return success(approvedAt ? msg("server.hesablar.hesabTesdiqlendi") : msg("server.hesablar.hesabTesdiqiLegvEdildi"));
  } catch (error) {
    return unexpected("hesab təsdiqi yenilənmədi", error, msg("server.common.unexpected"));
  }
}

/**
 * İctimai hesabı (agentlik daxil) silir.
 *
 * Kabinetdəki özünü silmə ilə **eyni yol** işlənir — `requestAccountDeletion()`:
 * əvvəl deaktiv + `deletionRequestedAt` marker-i, sonra elanların arxivi və hesabın
 * silinməsi. İkinci mərhələ alınmasa gündəlik maintenance onu tamamlayır. Agentlik
 * profili, favoritlər və sessiyalar `onDelete: Cascade` ilə gedir. STAFF heç vaxt
 * buradan silinmir — onun üçün «İstifadəçilər» bölməsi var.
 */
export async function deletePublicAccount(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const account = await prisma.user.findFirst({
      where: { id, accountType: { in: PUBLIC_ACCOUNT_TYPES } },
      select: { id: true, email: true },
    });
    if (!account) return failure(msg("server.hesablar.hesabTapilmadi"));

    const { finalized } = await requestAccountDeletion(id);
    await revokeAllSessions(id);

    await recordAudit(actor, "DELETE", "User", id, `${account.email} — hesab silindi${finalized ? "" : " (maintenance növbəsində)"}`);
    revalidatePath(LIST_PATH);
    revalidatePath("/admin/agentlikler");
    revalidatePublicContent("property");
    return success(finalized ? msg("server.hesablar.hesabSilindi") : msg("server.hesablar.hesabSilinmeNovbesinde"));
  } catch (error) {
    return unexpected("hesab silinmədi", error, msg("server.common.unexpected"));
  }
}

const ACCOUNT_BULK_INTENTS = ["approve", "activate", "deactivate", "delete"] as const;

/** «Hesablar» siyahısında toplu təsdiq, aktivləşdirmə, deaktivasiya və silmə. */
export async function bulkPublicAccounts(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const selection = readBulkSelection(formData, ACCOUNT_BULK_INTENTS);
  if (isBulkFailure(selection)) return selection;
  const { ids, intent } = selection;

  if (intent === "delete") return runBulk(ids, deletePublicAccount);

  // Açar-bağlayan tək action-lar toplu əməliyyatda istiqaməti tərsinə çevirərdi —
  // yalnız hədəf vəziyyətdə olmayan hesablar dəyişdirilir.
  // D1 100-parametr həddi: `accountType IN (…)` də parametr sayılır (#85)
  const accounts = await findManyInChunks(ids, PUBLIC_ACCOUNT_TYPES.length, (chunk) =>
    prisma.user.findMany({
      where: { id: { in: chunk }, accountType: { in: PUBLIC_ACCOUNT_TYPES } },
      select: { id: true, isActive: true, approvedAt: true },
    }),
  );
  return runBulk(ids, async (id) => {
    const account = accounts.find((item) => item.id === id);
    if (!account) return failure(msg("server.hesablar.hesabTapilmadi"));
    if (intent === "approve") return account.approvedAt ? success("") : togglePublicAccountApproval(id);
    if (intent === "activate") return account.isActive ? success("") : togglePublicAccountActive(id);
    return account.isActive ? togglePublicAccountActive(id) : success("");
  });
}
