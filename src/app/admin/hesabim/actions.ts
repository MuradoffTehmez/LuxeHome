"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentSessionId, requireStaff } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions, revokeSession } from "@/lib/auth/session";

/**
 * Hesab əməliyyatları.
 *
 * Hər action `requireStaff()` ilə başlayır: server action-ları layout-dan keçmir,
 * birbaşa POST ilə çağırıla bilir, ona görə qoruma burada təkrarlanmalıdır.
 */

export type AccountState = { error?: string; success?: string };

const passwordSchema = z
  .object({
    current: z.string().min(1),
    next: z.string().min(10, "Yeni parol ən azı 10 simvol olmalıdır."),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, {
    message: "Yeni parol təkrarı uyğun gəlmir.",
  })
  .refine((value) => value.next !== value.current, {
    message: "Yeni parol köhnəsindən fərqli olmalıdır.",
  });

export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await requireStaff();

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil." };
  }

  const record = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { error: "Cari parol yanlışdır." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.next),
      mustChangePassword: false,
    },
  });

  // Parol dəyişəndə digər cihazlardakı sessiyalar bağlanır — oğurlanmış cookie
  // parol dəyişdikdən sonra da işləməməlidir
  await revokeAllSessions(user.id, (await currentSessionId()) ?? undefined);

  revalidatePath("/admin/hesabim");
  return { success: "Parol dəyişdirildi və digər cihazlardakı sessiyalar bağlandı." };
}

export async function revokeOne(formData: FormData): Promise<void> {
  const user = await requireStaff();
  const sid = String(formData.get("sid") ?? "");

  // Yalnız öz sessiyasını ləğv edə bilir
  const owned = await prisma.session.findFirst({
    where: { id: sid, userId: user.id },
    select: { id: true },
  });
  if (owned) await revokeSession(sid);

  revalidatePath("/admin/hesabim");
}

export async function revokeOtherSessions(): Promise<void> {
  const user = await requireStaff();
  await revokeAllSessions(user.id, (await currentSessionId()) ?? undefined);

  revalidatePath("/admin/hesabim");
}
