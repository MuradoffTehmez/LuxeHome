"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { requireAccount, currentSessionId } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions } from "@/lib/auth/session";
import { uniqueSlug } from "@/lib/admin/slug";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";

/**
 * Kabinet profili.
 *
 * Hesab növü buradan dəyişdirilmir: istifadəçidən agentliyə keçid admin təsdiqi
 * tələb edir, əks halda hər kəs özünü «təsdiqlənmiş agentlik» elan edə bilərdi.
 */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(120),
  phone: z.string().trim().min(7, "Telefon nömrəsi düzgün deyil").max(30).nullable(),
  agencyName: z.string().trim().min(2).max(160).nullable(),
  agencyDescription: z.string().trim().max(2000).nullable(),
  agencyAddress: z.string().trim().max(240).nullable(),
  agencyWebsite: z
    .string()
    .trim()
    .url("Ünvan düzgün deyil")
    .refine((value) => value.startsWith("https://"), "Ünvan https:// ilə başlamalıdır")
    .nullable(),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAccount();

  const parsed = profileSchema.safeParse({
    name: form.text(formData, "name"),
    phone: form.optionalText(formData, "phone"),
    agencyName: form.optionalText(formData, "agencyName"),
    agencyDescription: form.optionalText(formData, "agencyDescription"),
    agencyAddress: form.optionalText(formData, "agencyAddress"),
    agencyWebsite: form.optionalText(formData, "agencyWebsite"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone },
    });

    if (user.accountType === ACCOUNT_TYPES.AGENCY && parsed.data.agencyName) {
      const existing = await prisma.agency.findUnique({
        where: { userId: user.id },
        select: { id: true, name: true, slug: true },
      });

      // Ad dəyişəndə slug da yenilənir, amma yalnız toqquşma olmayan variantla
      const slug =
        existing && existing.name === parsed.data.agencyName
          ? existing.slug
          : await uniqueSlug(
              parsed.data.agencyName,
              (candidate) =>
                prisma.agency.findUnique({ where: { slug: candidate }, select: { id: true } }),
              existing?.id,
            );

      const data = {
        name: parsed.data.agencyName,
        slug,
        description: parsed.data.agencyDescription,
        address: parsed.data.agencyAddress,
        website: parsed.data.agencyWebsite,
        phone: parsed.data.phone,
      };

      if (existing) {
        await prisma.agency.update({ where: { id: existing.id }, data });
      } else {
        await prisma.agency.create({ data: { ...data, userId: user.id, isVerified: false } });
      }
    }

    revalidatePath("/kabinet");
    revalidatePath("/kabinet/profil");
    return success("Profil yeniləndi.");
  } catch (error) {
    return unexpected("profil yenilənmədi", error);
  }
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Cari parolu yazın"),
    next: z.string().min(10, "Yeni parol ən azı 10 simvol olmalıdır").max(200),
    repeat: z.string().min(1, "Parolu təkrar yazın"),
  })
  .refine((data) => data.next === data.repeat, {
    message: "Parollar üst-üstə düşmür",
    path: ["repeat"],
  });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireAccount();

  const parsed = passwordSchema.safeParse({
    current: form.text(formData, "current"),
    next: form.text(formData, "next"),
    repeat: form.text(formData, "repeat"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const record = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
      return failure("Cari parol yanlışdır.", { current: "Parol yanlışdır" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.next), mustChangePassword: false },
    });

    // Parol dəyişəndə digər cihazlardakı sessiyalar bağlanır; cari sessiya qalır
    await revokeAllSessions(user.id, (await currentSessionId()) ?? undefined);

    return success("Parol dəyişdirildi. Digər cihazlardakı sessiyalar bağlandı.");
  } catch (error) {
    return unexpected("parol dəyişdirilmədi", error);
  }
}
