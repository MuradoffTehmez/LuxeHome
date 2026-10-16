"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeAzMobile } from "@/lib/auth/phone-otp-policy";
import { normalizeTelegramUsername } from "@/lib/accounts/telegram";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";
import { composeName, isPhoneLike, normalizeTaxId, parseBirthDate, profileRequirements } from "@/lib/accounts/profile-fields";
import { isAgencyTaxIdTaken } from "@/lib/accounts/agency-tax-id";
import { requireAccount, currentSessionId } from "@/lib/auth/guard";
import { systemModeBlock } from "@/lib/admin/guard";
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
import { requestAccountDeletion } from "@/lib/account-deletion";

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
  // Profil `User`, `Agency` və `AgentProfile` sətirlərini yazır — `READ_ONLY` rejimində bağlıdır.
  const blocked = await systemModeBlock();
  if (blocked) return blocked;
  const requirements = profileRequirements(user.accountType);
  const optionalUrl = z
    .string()
    .trim()
    .url(t("actions.invalidUrl"))
    .refine((value) => value.startsWith("https://"), t("actions.httpsUrl"))
    .nullable();
  const profileSchema = z
    .object({
      firstName: z.string().trim().min(2, t("actions.firstNameRequired")).max(60, t("actions.invalidField")),
      lastName: z.string().trim().min(2, t("actions.lastNameRequired")).max(60, t("actions.invalidField")),
      phone: z.string().trim().max(30, t("actions.invalidField")).refine(isPhoneLike, t("actions.invalidPhone")).nullable(),
      avatarUrl: z.string().trim().max(500).nullable(),
      companyName: z.string().trim().max(160, t("actions.invalidField")).nullable(),
      companyWebsite: optionalUrl,
      position: z.string().trim().max(120, t("actions.invalidField")).nullable(),
      agencyDescription: z.string().trim().max(2000, t("actions.invalidField")).nullable(),
      agencyAddress: z.string().trim().max(240, t("actions.invalidField")).nullable(),
      agencyEmail: z.string().trim().toLowerCase().max(200, t("actions.invalidField")).pipe(z.email(t("actions.invalidEmail"))).nullable(),
      agencyWhatsapp: z.string().trim().max(30, t("actions.invalidField")).refine(isPhoneLike, t("actions.invalidPhone")).nullable(),
      agencyInstagram: z
        .string()
        .trim()
        .regex(/^@?[A-Za-z0-9._]{1,30}$/, t("actions.invalidInstagram"))
        .transform((value) => value.replace(/^@/, ""))
        .nullable(),
      agencyHours: z.string().trim().max(120, t("actions.invalidField")).nullable(),
      agentRoleTitle: z.string().trim().max(120, t("actions.invalidField")).nullable(),
      agentSpecialization: z.string().trim().max(160, t("actions.invalidField")).nullable(),
      agentExperience: z.number().int().min(0).max(70).nullable(),
      agentBio: z.string().trim().max(3000, t("actions.invalidField")).nullable(),
    })
    .refine((data) => !requirements.company || (data.companyName?.length ?? 0) >= 2, {
      message: t("actions.companyNameRequired"),
      path: ["companyName"],
    })
    .refine((data) => !requirements.phoneRequired || data.phone !== null, {
      message: t("actions.phoneRequired"),
      path: ["phone"],
    });

  const parsed = profileSchema.safeParse({
    firstName: form.text(formData, "firstName"),
    lastName: form.text(formData, "lastName"),
    phone: form.optionalText(formData, "phone"),
    avatarUrl: avatarFromForm(formData),
    companyName: form.optionalText(formData, "companyName") ?? form.optionalText(formData, "agencyName"),
    companyWebsite: form.optionalText(formData, "companyWebsite") ?? form.optionalText(formData, "agencyWebsite"),
    position: form.optionalText(formData, "position"),
    agencyDescription: form.optionalText(formData, "agencyDescription"),
    agencyAddress: form.optionalText(formData, "agencyAddress"),
    agencyEmail: form.optionalText(formData, "agencyEmail"),
    agencyWhatsapp: form.optionalText(formData, "agencyWhatsapp"),
    agencyInstagram: form.optionalText(formData, "agencyInstagram"),
    agencyHours: form.optionalText(formData, "agencyHours"),
    agentRoleTitle: form.optionalText(formData, "agentRoleTitle"),
    agentSpecialization: form.optionalText(formData, "agentSpecialization"),
    agentExperience: form.integer(formData, "agentExperience"),
    agentBio: form.optionalText(formData, "agentBio"),
  });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  const birthDate = parseBirthDate(form.optionalText(formData, "birthDate"));
  if (!birthDate.ok) {
    return failure(t("actions.invalidForm"), {
      birthDate: birthDate.reason === "underage" ? t("actions.underage") : t("actions.invalidBirthDate"),
    });
  }
  // Telegram istifadəçi adı (#208): `@ad`, `t.me/ad` və tam link eyni dəyərə gəlir.
  const telegram = normalizeTelegramUsername(form.optionalText(formData, "telegram") ?? "");
  if (telegram === undefined) {
    return failure(t("actions.invalidForm"), { telegram: t("actions.invalidTelegram") });
  }
  const companyTaxId = normalizeTaxId(form.optionalText(formData, "companyTaxId"));
  if (companyTaxId === false) {
    return failure(t("actions.invalidForm"), { companyTaxId: t("actions.invalidTaxId") });
  }
  if (user.accountType === ACCOUNT_TYPES.AGENCY && companyTaxId && (await isAgencyTaxIdTaken(companyTaxId, user.id))) {
    return failure(t("actions.invalidForm"), { companyTaxId: t("actions.taxIdTaken") });
  }
  const data = parsed.data;
  const name = composeName(data.firstName, data.lastName);

  try {
    // Agentliyin örtük şəkli (#157): dəyişməyibsə (o cümlədən paneldən qoyulubsa) yoxlanılmır,
    // yenisi isə avatar kimi bu hesabın profil qovluğuna yüklədiyi fayl olmalıdır.
    const coverUrl = user.accountType === ACCOUNT_TYPES.AGENCY ? imageUrlFromForm(formData, "cover") : null;
    const storedAgency = user.accountType === ACCOUNT_TYPES.AGENCY
      ? await prisma.agency.findUnique({ where: { userId: user.id }, select: { coverUrl: true } })
      : null;
    if (coverUrl && coverUrl !== storedAgency?.coverUrl) {
      const owned = await prisma.media.findFirst({
        where: { uploaderId: user.id, url: coverUrl },
        select: { id: true },
      });
      if (!owned || !coverUrl.startsWith("/media/avatarlar/")) {
        return failure(t("actions.avatarOwnership"), { cover: t("actions.avatarOwnership") });
      }
    }

    // Profil şəkli yalnız bu hesabın profil qovluğuna yüklədiyi fayl ola bilər.
    if (data.avatarUrl) {
      const owned = await prisma.media.findFirst({
        where: { uploaderId: user.id, url: data.avatarUrl },
        select: { id: true },
      });
      if (!owned || !data.avatarUrl.startsWith("/media/avatarlar/")) {
        return failure(t("actions.avatarOwnership"), { avatar: t("actions.avatarOwnership") });
      }
    }

    // Profildəki nömrə təsdiqlənmiş nömrədən fərqlənirsə təsdiq ləğv olunur (#109):
    // telefonla giriş yalnız hazırda göstərilən və SMS ilə sübut olunmuş nömrə ilə işləyir.
    const current = await prisma.user.findUnique({ where: { id: user.id }, select: { verifiedPhone: true, avatarUrl: true, telegram: true } });
    const keepsVerifiedPhone = current?.verifiedPhone != null && normalizeAzMobile(data.phone) === current.verifiedPhone;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: birthDate.value,
        phone: data.phone,
        telegram,
        avatarUrl: data.avatarUrl,
        companyName: requirements.company ? data.companyName : null,
        companyTaxId: requirements.company ? companyTaxId : null,
        companyWebsite: requirements.company ? data.companyWebsite : null,
        position: requirements.company ? data.position : null,
        ...(current?.verifiedPhone && !keepsVerifiedPhone ? { verifiedPhone: null } : {}),
      },
    });

    if (user.accountType === ACCOUNT_TYPES.AGENCY && data.companyName) {
      const existing = await prisma.agency.findUnique({
        where: { userId: user.id },
        select: { id: true, name: true, slug: true, logoUrl: true, rejectedAt: true },
      });

      // Ad dəyişəndə slug da yenilənir, amma yalnız toqquşma olmayan variantla
      const slug =
        existing && existing.name === data.companyName
          ? existing.slug
          : await uniqueSlug(
              data.companyName,
              (candidate) =>
                prisma.agency.findUnique({ where: { slug: candidate }, select: { id: true } }),
              existing?.id,
            );

      const agencyData = {
        name: data.companyName,
        slug,
        description: data.agencyDescription,
        address: data.agencyAddress,
        website: data.companyWebsite,
        email: data.agencyEmail,
        whatsapp: data.agencyWhatsapp,
        telegram,
        instagram: data.agencyInstagram,
        workingHours: data.agencyHours,
        coverUrl,
        phone: data.phone,
        // Loqo profil şəkli ilə eynidir: şəkil silinəndə agentlikdən də silinir (əvvəl köhnə
        // loqo qalırdı). Profil şəklindən gəlməyən köhnə loqoya isə toxunulmur.
        logoUrl: data.avatarUrl
          ?? (existing?.logoUrl && existing.logoUrl !== current?.avatarUrl ? existing.logoUrl : null),
      };

      if (existing) {
        // Rədd edilmiş müraciət profil yenilənəndə yenidən təsdiq növbəsinə düşür (#157);
        // SLA yeni göndərilmə vaxtından sayılır.
        await prisma.agency.update({
          where: { id: existing.id },
          data: existing.rejectedAt
            ? { ...agencyData, rejectedAt: null, rejectionReason: null, reviewRequestedAt: new Date() }
            : agencyData,
        });
        // Agentlik adı/loqosu elan kartlarında və agentlik səhifəsində göstərilir.
        revalidatePublicContent("agency", existing.slug);
        if (existing.slug !== slug) revalidatePublicContent("agency", slug);
        revalidatePublicContent("property");
      } else {
        await prisma.agency.create({ data: { ...agencyData, userId: user.id, isVerified: false } });
      }
    }

    if (requirements.agent) {
      const agentData = {
        name,
        phone: data.phone,
        email: user.email,
        avatarUrl: data.avatarUrl,
        roleTitle: data.agentRoleTitle,
        specialization: data.agentSpecialization,
        experienceYears: data.agentExperience,
        bio: data.agentBio,
      };
      const existing = await prisma.agentProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, slug: true, rejectedAt: true },
      });
      if (existing) {
        await prisma.agentProfile.update({
          where: { id: existing.id },
          data: existing.rejectedAt
            ? { ...agentData, rejectedAt: null, rejectionReason: null, reviewRequestedAt: new Date() }
            : agentData,
        });
        revalidatePublicContent("agent", existing.slug);
      } else {
        const slug = await uniqueSlug(name, (candidate) =>
          prisma.agentProfile.findUnique({ where: { slug: candidate }, select: { id: true } }),
        );
        await prisma.agentProfile.create({
          data: { ...agentData, userId: user.id, slug, isPublic: false, isVerified: false },
        });
      }
    }

    // Elan detalı yerləşdirənin Telegram bayrağını keşdən oxuyur (#208): dəyişəndə keş dərhal bitməlidir,
    // yoxsa yeni ad 5 dəqiqə görünmür, silinən ad isə düyməni saxlayır. Agentlik qolu bunu özü edir.
    if ((current?.telegram ?? null) !== telegram) revalidatePublicContent("property");
    revalidatePath(localizePath("/kabinet", locale));
    revalidatePath(localizePath("/kabinet/profil", locale));
    return success(t("actions.profileUpdated"));
  } catch (error) {
    return unexpected("profil yenilənmədi", error, t("actions.unexpected"));
  }
}

/** Dropzone profil şəklini JSON sətri kimi göndərir (`{ url, alt, isCover }`). */
function avatarFromForm(formData: FormData): string | null {
  return imageUrlFromForm(formData, "avatar");
}

/** Dropzone sahəsindən (`{ url, alt, isCover }` JSON) şəklin ünvanı. */
function imageUrlFromForm(formData: FormData, name: string): string | null {
  const raw = form.optionalText(formData, name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { url?: unknown };
    return typeof parsed.url === "string" && parsed.url ? parsed.url : null;
  } catch {
    return null;
  }
}

/**
 * Parol dəyişmə `READ_ONLY` rejimində də açıq qalır.
 *
 * Bu, məzmun redaktəsi deyil, təhlükəsizlik əməliyyatıdır: parolu sızmış
 * istifadəçi onu texniki xidmət pəncərəsinin bitməsini gözləmədən dəyişə
 * bilməlidir. `MAINTENANCE` rejimində kabinet səhifəsinə middleware onsuz da
 * icazə vermir.
 */
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
  // Silinmə iki mərhələlidir və ikincisi `runPhase2Maintenance()` ilə təkrarlanır;
  // rejim bağlı ikən başlanğıc vermək yarımçıq vəziyyəti uzadardı.
  const blocked = await systemModeBlock();
  if (blocked) return blocked;
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
    // İlk atomik addım hesabı deaktiv edib durable marker yazır. Əlaqəli təmizlik
    // yarımçıq qalsa gündəlik maintenance cron-u idempotent şəkildə davam etdirir.
    await requestAccountDeletion(user.id);
    await revokeAllSessions(user.id);
  } catch (error) {
    return unexpected("ictimai hesab silinmədi", error, t("actions.unexpected"));
  }

  await clearSessionCookie();
  revalidatePublicContent("property");
  redirect(`${localizePath("/", locale)}?hesab=silindi`);
}
