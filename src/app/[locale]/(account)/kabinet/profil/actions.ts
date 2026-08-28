"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { requireAccount, currentSessionId } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions } from "@/lib/auth/session";
import { uniqueSlug } from "@/lib/admin/slug";
import { type ActionState, failure, success, toFieldErrors, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { assertSameOrigin } from "@/lib/admin/guard";
import { redirect } from "next/navigation";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/**
 * Kabinet profili.
 *
 * Hesab növü buradan dəyişdirilmir: istifadəçidən agentliyə keçid admin təsdiqi
 * tələb edir, əks halda hər kəs özünü «təsdiqlənmiş agentlik» elan edə bilərdi.
 */

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);
  const profileSchema = z.object({
    name: z.string().trim().min(2, t("actions.nameMin")).max(120, t("actions.invalidField")),
    phone: z.string().trim().min(7, t("actions.invalidPhone")).max(30, t("actions.invalidField")).nullable(),
    agencyName: z.string().trim().min(2, t("actions.agencyNameRequired")).max(160, t("actions.invalidField")).nullable(),
    agencyDescription: z.string().trim().max(2000, t("actions.invalidField")).nullable(),
    agencyAddress: z.string().trim().max(240, t("actions.invalidField")).nullable(),
    agencyWebsite: z
      .string()
      .trim()
      .url(t("actions.invalidUrl"))
      .refine((value) => value.startsWith("https://"), t("actions.httpsUrl"))
      .nullable(),
  });

  const parsed = profileSchema.safeParse({
    name: form.text(formData, "name"),
    phone: form.optionalText(formData, "phone"),
    agencyName: form.optionalText(formData, "agencyName"),
    agencyDescription: form.optionalText(formData, "agencyDescription"),
    agencyAddress: form.optionalText(formData, "agencyAddress"),
    agencyWebsite: form.optionalText(formData, "agencyWebsite"),
  });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

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

    revalidatePath(localizePath("/kabinet", locale));
    revalidatePath(localizePath("/kabinet/profil", locale));
    return success(t("actions.profileUpdated"));
  } catch (error) {
    return unexpected("profil yenilənmədi", error, t("actions.unexpected"));
  }
}

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  const user = await requireAccount(locale);
  const passwordSchema = z
    .object({
      current: z.string().min(1, t("actions.currentPasswordRequired")),
      next: z.string().min(10, t("actions.newPasswordMin")).max(200, t("actions.passwordLong")),
      repeat: z.string().min(1, t("actions.repeatPasswordRequired")),
    })
    .refine((data) => data.next === data.repeat, {
      message: t("actions.passwordMismatch"),
      path: ["repeat"],
    });

  const parsed = passwordSchema.safeParse({
    current: form.text(formData, "current"),
    next: form.text(formData, "next"),
    repeat: form.text(formData, "repeat"),
  });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  try {
    const record = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
      return failure(t("actions.badCurrentPassword"), { current: t("actions.badPasswordField") });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.next), mustChangePassword: false },
    });

    // Parol dəyişəndə digər cihazlardakı sessiyalar bağlanır; cari sessiya qalır
    await revokeAllSessions(user.id, (await currentSessionId()) ?? undefined);

    return success(t("actions.passwordChanged"));
  } catch (error) {
    return unexpected("parol dəyişdirilmədi", error, t("actions.unexpected"));
  }
}

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  await assertSameOrigin();
  const user = await requireAccount(locale);
  const parsed = z.object({
    password: z.string().min(1, t("actions.currentPasswordRequired")),
    confirmation: z.literal(t("profile.deletePhrase"), {
      error: t("actions.deleteConfirmationInvalid"),
    }),
  }).safeParse({
    password: form.text(formData, "password"),
    confirmation: form.text(formData, "confirmation").trim(),
  });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record || !(await verifyPassword(parsed.data.password, record.passwordHash))) {
    return failure(t("actions.badCurrentPassword"), { password: t("actions.badPasswordField") });
  }

  try {
    await prisma.property.updateMany({
      where: { authorId: user.id, deletedAt: null },
      data: { deletedAt: new Date(), status: PROPERTY_STATUSES.ARCHIVED },
    });
    await prisma.user.delete({ where: { id: user.id } });
  } catch (error) {
    return unexpected("ictimai hesab silinmədi", error, t("actions.unexpected"));
  }

  await clearSessionCookie();
  revalidatePublicContent("property");
  redirect(`${localizePath("/", locale)}?hesab=silindi`);
}
