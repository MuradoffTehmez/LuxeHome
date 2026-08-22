"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, PERMISSIONS, ROLES } from "@/lib/constants";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessions } from "@/lib/auth/session";
import {
  type ActionState,
  failure,
  invalid,
  success,
  successWithSecret,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { userCreateSchema, userUpdateSchema } from "@/lib/admin/schemas";
import * as form from "@/lib/admin/form";

/**
 * İstifadəçi idarəsi.
 *
 * Bu bölmə panelin ən həssas hissəsidir, ona görə əlavə qaydalar var:
 *
 * - İstifadəçi öz rolunu dəyişə və özünü deaktiv edə bilmir — əks halda bir səhv
 *   klik panelə girişi tamamilə bağlaya bilər.
 * - Sonuncu aktiv SUPER_ADMIN deaktiv edilə, rolu aşağı salına və silinə bilmir.
 * - Parol bu ekranda görünmür: yeni hesab və sıfırlama müvəqqəti parol yaradır,
 *   istifadəçi ilk girişdə onu dəyişməyə məcburdur.
 * - Parol dəyişəndə həmin istifadəçinin bütün sessiyaları bağlanır.
 */

const LIST_PATH = "/admin/istifadeciler";

/**
 * Oxunaqlı müvəqqəti parol.
 *
 * Qarışdırıla bilən simvollar (0/O, 1/l/I) qəsdən çıxarılıb — parol şifahi və ya
 * kağızda ötürülür və səhv oxunma dəstək müraciətinə çevrilir.
 */
function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** Panel əməliyyatlarının idarə edə biləcəyi əməkdaş hesabını qaytarır. */
async function findStaffTarget(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, accountType: ACCOUNT_TYPES.STAFF },
    select: { id: true, email: true, role: true, isActive: true },
  });
}

/** Sonuncu aktiv STAFF SUPER_ADMIN qorunur. */
async function isLastSuperAdmin(userId: string): Promise<boolean> {
  const user = await findStaffTarget(userId);
  if (user?.role !== ROLES.SUPER_ADMIN || !user.isActive) return false;

  const count = await prisma.user.count({
    where: {
      accountType: ACCOUNT_TYPES.STAFF,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    },
  });
  return count <= 1;
}

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = userCreateSchema.safeParse({
    name: form.text(formData, "name"),
    email: form.text(formData, "email"),
    role: form.text(formData, "role"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing) {
      return failure("Bu e-poçt artıq istifadə olunur.", { email: "E-poçt artıq qeydiyyatdadır" });
    }

    const password = temporaryPassword();

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        accountType: ACCOUNT_TYPES.STAFF,
        passwordHash: await hashPassword(password),
        isActive: true,
        // 2FA qurulmayıb: ilk girişdə məcburi qurulum ekranı açılır
        mustChangePassword: true,
      },
      select: { id: true },
    });

    await recordAudit(actor, "CREATE", "User", user.id, `${parsed.data.email} · ${parsed.data.role}`);
    revalidatePath(LIST_PATH);

    // Parol yalnız bu bir dəfə göstərilir — bazada yalnız hash saxlanılır
    return successWithSecret(`«${parsed.data.email}» hesabı yaradıldı.`, password);
  } catch (error) {
    return unexpected("istifadəçi yaradıla bilmədi", error);
  }
}

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("İstifadəçi tapılmadı.");

  const parsed = userUpdateSchema.safeParse({
    name: form.text(formData, "name"),
    role: form.text(formData, "role"),
    isActive: form.boolean(formData, "isActive"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const target = await findStaffTarget(id);
    if (!target) return failure("İstifadəçi tapılmadı.");

    if (id === actor.id && (parsed.data.role !== target.role || !parsed.data.isActive)) {
      return failure("Öz rolunuzu dəyişə və ya hesabınızı deaktiv edə bilməzsiniz.");
    }

    const losingSuperAdmin =
      (parsed.data.role !== ROLES.SUPER_ADMIN || !parsed.data.isActive) &&
      (await isLastSuperAdmin(id));
    if (losingSuperAdmin) {
      return failure("Sistemdə ən azı bir aktiv Super Admin qalmalıdır.");
    }

    await prisma.user.update({
      where: { id, accountType: ACCOUNT_TYPES.STAFF },
      data: parsed.data,
    });

    // Deaktiv edilmiş istifadəçinin açıq sessiyaları dərhal bağlanır
    if (!parsed.data.isActive) await revokeAllSessions(id);

    await recordAudit(
      actor,
      parsed.data.role !== target.role ? "ROLE_CHANGE" : "UPDATE",
      "User",
      id,
      `${target.email} → ${parsed.data.role}${parsed.data.isActive ? "" : " (deaktiv)"}`,
    );

    revalidatePath(LIST_PATH);
    return success("İstifadəçi yeniləndi.");
  } catch (error) {
    return unexpected("istifadəçi yenilənmədi", error);
  }
}

export async function resetUserPassword(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const target = await findStaffTarget(id);
    if (!target) return failure("İstifadəçi tapılmadı.");

    const password = temporaryPassword();

    const user = await prisma.user.update({
      where: { id, accountType: ACCOUNT_TYPES.STAFF },
      data: {
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
        failedAttempts: 0,
        lockedUntil: null,
      },
      select: { email: true },
    });

    // Köhnə parolla açılmış sessiyalar etibarsız olur
    await revokeAllSessions(id);
    await recordAudit(actor, "UPDATE", "User", id, `${user.email} — parol sıfırlandı`);

    revalidatePath(LIST_PATH);
    return successWithSecret(`«${user.email}» üçün parol sıfırlandı.`, password);
  } catch (error) {
    return unexpected("parol sıfırlanmadı", error);
  }
}

/**
 * 2FA-nın sıfırlanması.
 *
 * Telefonunu itirən əməkdaş üçün lazımdır. Sirr və ehtiyat kodlar silinir,
 * istifadəçi növbəti girişdə qurulum ekranından yenidən keçir.
 */
export async function resetUserTwoFactor(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const target = await findStaffTarget(id);
    if (!target) return failure("İstifadəçi tapılmadı.");

    const user = await prisma.user.update({
      where: { id, accountType: ACCOUNT_TYPES.STAFF },
      data: { totpSecret: null, totpEnabledAt: null },
      select: { email: true },
    });

    await prisma.backupCode.deleteMany({ where: { userId: id } });
    await revokeAllSessions(id);
    await recordAudit(actor, "UPDATE", "User", id, `${user.email} — 2FA sıfırlandı`);

    revalidatePath(LIST_PATH);
    return success("2FA sıfırlandı. İstifadəçi növbəti girişdə yenidən quracaq.");
  } catch (error) {
    return unexpected("2FA sıfırlanmadı", error);
  }
}

export async function revokeUserSessions(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const user = await findStaffTarget(id);
    if (!user) return failure("İstifadəçi tapılmadı.");

    await revokeAllSessions(id);
    await recordAudit(actor, "SESSION_REVOKE", "User", id, user.email);

    revalidatePath(LIST_PATH);
    return success("Bütün sessiyalar bağlandı.");
  } catch (error) {
    return unexpected("sessiyalar bağlanmadı", error);
  }
}

export async function deleteUser(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const target = await findStaffTarget(id);
    if (!target) return failure("İstifadəçi tapılmadı.");

    if (id === actor.id) return failure("Öz hesabınızı silə bilməzsiniz.");

    if (await isLastSuperAdmin(id)) {
      return failure("Sistemdə ən azı bir aktiv Super Admin qalmalıdır.");
    }

    // Elan və məqalələr silinmir: sxemdə müəllif əlaqəsi `onDelete: SetNull`-dur
    const user = await prisma.user.delete({
      where: { id, accountType: ACCOUNT_TYPES.STAFF },
      select: { email: true },
    });

    await recordAudit(actor, "DELETE", "User", id, user.email);
    revalidatePath(LIST_PATH);
    return success("İstifadəçi silindi.");
  } catch (error) {
    return unexpected("istifadəçi silinmədi", error);
  }
}
