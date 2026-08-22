"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  PUBLIC_ACCOUNT_TYPES,
  ROLES,
  type AccountType,
} from "@/lib/constants";
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/cookies";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import { checkLoginLimit, clientIp, isAccountLocked, registerFailure, registerSuccess } from "@/lib/auth/rate-limit";
import { createSession, revokeSession } from "@/lib/auth/session";
import { uniqueSlug } from "@/lib/admin/slug";
import { canUsePublicSignIn, safePublicTarget } from "@/lib/auth/public-account-policy";
import { createPublicAccount } from "@/lib/auth/public-account-registration";
import { type ActionState, failure, invalid, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";

/**
 * İctimai hesab axını — qeydiyyat və giriş.
 *
 * Paneldəki `/giris` axınından **qəsdən ayrıdır**:
 *
 * - Şirkət əməkdaşı hesabı buradan girə bilmir. Girə bilsəydi, məcburi TOTP addımı
 *   yan keçilər və panelin ikinci müdafiə həlqəsi mənasını itirərdi.
 * - İctimai hesab üçün 2FA məcburi deyil — ziyarətçi üçün əngəl yaradır və qorunan
 *   dəyər (öz elanları) əməkdaş səlahiyyəti ilə müqayisə olunmur.
 *
 * Sessiya mexanizmi eynidir: D1-də saxlanılan, dərhal ləğv edilə bilən sessiya.
 */

const GENERIC_ERROR = "E-poçt və ya parol yanlışdır.";
const CABINET = "/kabinet";

/** Parol uzunluğu ictimai hesab üçün də ciddi saxlanılır — hesab elan yerləşdirə bilir. */
const passwordRule = z
  .string()
  .min(10, "Parol ən azı 10 simvol olmalıdır")
  .max(200, "Parol çox uzundur");

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(120),
    email: z.string().trim().toLowerCase().pipe(z.email("E-poçt ünvanı düzgün deyil")),
    phone: z
      .string()
      .trim()
      .min(7, "Telefon nömrəsi düzgün deyil")
      .max(30)
      .nullable(),
    password: passwordRule,
    accountType: z.enum(PUBLIC_ACCOUNT_TYPES as [AccountType, ...AccountType[]]),
    agencyName: z.string().trim().max(160).nullable(),
  })
  .refine(
    (data) => data.accountType !== ACCOUNT_TYPES.AGENCY || (data.agencyName?.length ?? 0) >= 2,
    { message: "Agentliyin adını yazın", path: ["agencyName"] },
  )
  .refine((data) => data.accountType === ACCOUNT_TYPES.USER || data.phone !== null, {
    message: "Elan yerləşdirmək üçün telefon nömrəsi lazımdır",
    path: ["phone"],
  });

async function startPublicSession(userId: string, target?: string): Promise<never> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, role: true, accountType: true },
  });

  const session = await createSession({
    userId,
    totpCounter: null,
    ip,
    userAgent: requestHeaders.get("user-agent"),
  });

  await setSessionCookie(
    await signSessionToken(
      { sid: session.id, uid: userId, role: user.role, accountType: user.accountType as AccountType },
      session.expiresAt,
    ),
    session.expiresAt,
  );
  await registerSuccess(userId, user.email, ip);

  redirect(target ?? CABINET);
}

export async function registerAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp(await headers());
  if (!(await checkLoginLimit(ip))) {
    return failure("Çox sayda cəhd oldu. Bir dəqiqə sonra yenidən yoxlayın.");
  }

  const parsed = registerSchema.safeParse({
    name: form.text(formData, "name"),
    email: form.text(formData, "email"),
    phone: form.optionalText(formData, "phone"),
    password: form.text(formData, "password"),
    accountType: form.text(formData, "accountType"),
    agencyName: form.optionalText(formData, "agencyName"),
  });
  if (!parsed.success) return invalid(parsed.error);

  let userId: string;

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing) {
      return failure("Bu e-poçt artıq qeydiyyatdadır.", {
        email: "Bu e-poçt artıq istifadə olunur",
      });
    }

    const user = await createPublicAccount(
      {
        async createUser(input) {
          return prisma.user.create({
            data: {
              ...input,
              // İctimai hesab panel səlahiyyəti almır; `role` yalnız sxem tələbidir.
              role: ROLES.EDITOR,
              isActive: true,
              mustChangePassword: false,
            },
            select: { id: true },
          });
        },
        async createAgency(input) {
          const slug = await uniqueSlug(input.name, (candidate) =>
            prisma.agency.findUnique({ where: { slug: candidate }, select: { id: true } }),
          );
          await prisma.agency.create({
            data: { ...input, slug, isVerified: false },
          });
        },
        async deleteUser(userId) {
          await prisma.user.delete({ where: { id: userId } });
        },
      },
      {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash: await hashPassword(parsed.data.password),
        accountType: parsed.data.accountType,
        agencyName: parsed.data.agencyName,
      },
    );

    userId = user.id;
  } catch (error) {
    return unexpected("qeydiyyat tamamlanmadı", error);
  }

  // `startPublicSession` yönləndirmə atır və heç vaxt qayıtmır.
  return startPublicSession(userId, safePublicTarget(formData.get("davam")));
}

export async function signInAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = clientIp(await headers());
  if (!(await checkLoginLimit(ip))) {
    return failure("Çox sayda cəhd oldu. Bir dəqiqə sonra yenidən yoxlayın.");
  }

  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().pipe(z.email()),
      password: z.string().min(1),
    })
    .safeParse({
      email: form.text(formData, "email"),
      password: form.text(formData, "password"),
    });
  if (!parsed.success) return failure(GENERIC_ERROR);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) {
    await registerFailure(null, parsed.data.email, ip, "BAD_PASSWORD");
    return failure(GENERIC_ERROR);
  }

  // Əməkdaş hesabı buradan girə bilməz: 2FA addımı yan keçilərdi
  if (!canUsePublicSignIn(user.accountType as AccountType)) {
    return failure("Bu hesab şirkət panelinə aiddir. «İdarə paneli» girişindən istifadə edin.");
  }

  if (isAccountLocked(user.lockedUntil)) {
    return failure("Hesab müvəqqəti olaraq bağlanıb. 15 dəqiqə sonra yenidən cəhd edin.");
  }

  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await registerFailure(user.id, user.email, ip, "BAD_PASSWORD");
    return failure(GENERIC_ERROR);
  }

  if (needsRehash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });
  }

  return startPublicSession(user.id, safePublicTarget(formData.get("davam")));
}

export async function signOutAccount(): Promise<void> {
  const token = await readSessionCookie();
  const claims = token ? await verifySessionToken(token) : null;
  if (claims) await revokeSession(claims.sid);

  await clearSessionCookie();
  redirect("/");
}
