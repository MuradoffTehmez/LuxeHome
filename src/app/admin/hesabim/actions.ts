"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentSessionId, requireStaff } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions, revokeSession } from "@/lib/auth/session";
import { generateBackupCodes, hashBackupCode } from "@/lib/auth/totp";
import { parseSingleImage } from "@/lib/admin/images";
import { recordAudit } from "@/lib/admin/audit";
import { assertSameOrigin } from "@/lib/admin/guard";
import { type ActionState, failure, invalid, success, successWithSecret, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";

/**
 * Hesab əməliyyatları.
 *
 * Hər action `requireStaff()` ilə başlayır: server action-ları layout-dan keçmir,
 * birbaşa POST ilə çağırıla bilir, ona görə qoruma burada təkrarlanmalıdır.
 */

export type AccountState = { error?: string; success?: string };

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır.").max(120),
  phone: z.string().trim().max(30).nullable(),
  locale: z.enum(["az", "en", "ru"]),
  themePreference: z.enum(["light", "dark"]),
});

export async function saveProfile(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await assertSameOrigin();
  const user = await requireStaff();
  const parsed = profileSchema.safeParse({
    name: form.text(formData, "name"),
    phone: form.optionalText(formData, "phone"),
    locale: form.text(formData, "locale"),
    themePreference: form.text(formData, "themePreference"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const image = parseSingleImage(formData, "avatar");
    await prisma.user.update({
      where: { id: user.id },
      data: { ...parsed.data, avatarUrl: image?.url ?? null },
    });
    await recordAudit(user, "UPDATE", "User", user.id, "Şəxsi profil yeniləndi");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/hesabim");
    return success("Profil məlumatları yeniləndi.");
  } catch (error) {
    return unexpected("profil yenilənmədi", error);
  }
}

export async function regenerateBackupCodes(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertSameOrigin();
  const user = await requireStaff();
  const currentPassword = form.text(formData, "currentPassword");
  if (!currentPassword) return failure("Cari parolu yazın.", { currentPassword: "Cari parol tələb olunur" });

  const record = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(currentPassword, record.passwordHash))) {
    return failure("Cari parol yanlışdır.", { currentPassword: "Cari parol yanlışdır" });
  }

  try {
    const codes = generateBackupCodes();
    await prisma.backupCode.deleteMany({ where: { userId: user.id } });
    for (const code of codes) {
      await prisma.backupCode.create({ data: { userId: user.id, codeHash: await hashBackupCode(code) } });
    }
    await recordAudit(user, "UPDATE", "User", user.id, "2FA ehtiyat kodları yeniləndi");
    revalidatePath("/admin/hesabim");
    return successWithSecret("Yeni ehtiyat kodları yaradıldı. Onları indi təhlükəsiz yerdə saxlayın.", codes.join("\n"));
  } catch (error) {
    return unexpected("ehtiyat kodları yenilənmədi", error);
  }
}

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
