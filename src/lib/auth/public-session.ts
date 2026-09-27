import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_KINDS, type AccountType } from "@/lib/constants";
import { setSessionCookie, signSessionToken } from "./cookies";
import { clientIp, registerSuccess } from "./rate-limit";
import { createSession } from "./session";
import { canUsePublicSignIn } from "./public-account-policy";

/**
 * İctimai hesab üçün sessiya açır (parol girişi və Google callback eyni yoldan keçir, #109).
 * Əməkdaş hesabı üçün `false` qaytarır — onun sessiyası yalnız TOTP-li `/giris` axınındadır.
 */
export async function openPublicSession(userId: string): Promise<boolean> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, role: true, accountType: true },
  });
  if (!canUsePublicSignIn(user.accountType as AccountType)) return false;

  const session = await createSession({
    userId,
    totpCounter: null,
    ip,
    userAgent: requestHeaders.get("user-agent"),
    authKind: AUTH_KINDS.PUBLIC,
  });

  await setSessionCookie(
    await signSessionToken(
      {
        sid: session.id,
        uid: userId,
        role: user.role,
        accountType: user.accountType as AccountType,
        authKind: AUTH_KINDS.PUBLIC,
      },
      session.expiresAt,
    ),
    session.expiresAt,
  );
  await registerSuccess(userId, user.email, ip);
  return true;
}
