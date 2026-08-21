"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { deleteImage } from "@/lib/media/storage";
import * as form from "@/lib/admin/form";

const LIST_PATH = "/admin/media";

export async function updateMediaAlt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.MEDIA_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Fayl tapılmadı.");

  const alt = form.text(formData, "alt").slice(0, 160);

  try {
    const media = await prisma.media.update({
      where: { id },
      data: { alt },
      select: { originalName: true },
    });

    await recordAudit(user, "UPDATE", "Media", id, media.originalName);
    revalidatePath(LIST_PATH);
    return success("Alt mətn yeniləndi.");
  } catch (error) {
    return unexpected("alt mətn yenilənmədi", error);
  }
}

/**
 * Faylın silinməsi.
 *
 * Əvvəlcə baza sətri, sonra R2 obyekti silinir. Tərsinə olsaydı və baza silinməsi
 * uğursuz olsaydı, kitabxanada mövcud olmayan fayla işarə edən sətir qalardı.
 * İndiki sırada ən pis hal R2-də sahibsiz obyektdir — o, heç nəyi sındırmır.
 *
 * Qeyd: fayl elanda və ya məqalədə istifadə oluna bilər. `Media` cədvəli ilə
 * `PropertyImage`/`BlogPost.coverUrl` arasında xarici açar yoxdur, ona görə
 * redaktora xəbərdarlıq edilir, avtomatik yoxlama aparılmır.
 */
export async function deleteMedia(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.MEDIA_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const media = await prisma.media.delete({
      where: { id },
      select: { url: true, originalName: true },
    });

    await deleteImage(media.url);
    await recordAudit(user, "DELETE", "Media", id, media.originalName);

    revalidatePath(LIST_PATH);
    return success("Fayl silindi.");
  } catch (error) {
    return unexpected("fayl silinmədi", error);
  }
}
