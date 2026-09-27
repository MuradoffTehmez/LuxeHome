import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, LOCALES, ROLES, type Locale } from "@/lib/constants";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { consumeGoogleFlow, exchangeGoogleCode, isGoogleLoginConfigured } from "@/lib/auth/google-oauth";
import { googleLinkDecision } from "@/lib/auth/google-login-policy";
import { openPublicSession } from "@/lib/auth/public-session";
import { safePublicTarget } from "@/lib/auth/public-account-policy";
import { revokeAllSessions } from "@/lib/auth/session";
import { localizePath } from "@/i18n/path-locale";

/**
 * Google OAuth callback (#109). Hesab bağlama qaydaları `googleLinkDecision()`-dadır;
 * burada yalnız onun nəticəsi tətbiq olunur. Hər uğursuzluq giriş səhifəsinə
 * ümumi bir səbəb kodu ilə qayıdır — hansı hesabın mövcud olduğu sızdırılmır.
 */
export const dynamic = "force-dynamic";

const USER_SELECT = {
  id: true,
  accountType: true,
  isActive: true,
  lockedUntil: true,
  googleSub: true,
  emailVerifiedAt: true,
  deletionRequestedAt: true,
} as const;

export async function GET(request: Request) {
  if (!isGoogleLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const url = new URL(request.url);
  const flow = await consumeGoogleFlow(url.searchParams.get("state"));
  const locale: Locale = flow && (Object.values(LOCALES) as string[]).includes(flow.locale) ? (flow.locale as Locale) : "az";
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(localizePath(`/daxil-ol?google=${reason}`, locale), request.url), 303);

  const code = url.searchParams.get("code");
  if (!flow || !code || url.searchParams.get("error")) return fail("xeta");
  if (!(await checkLoginLimit(clientIp(await headers())))) return fail("limit");

  const profile = await exchangeGoogleCode(code, flow).catch(() => null);
  if (!profile) return fail("xeta");

  const [bySub, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { googleSub: profile.sub }, select: USER_SELECT }),
    prisma.user.findUnique({ where: { email: profile.email }, select: USER_SELECT }),
  ]);
  const now = new Date();
  const decision = googleLinkDecision({ claims: profile, bySub, byEmail, now });

  let userId: string;
  switch (decision.action) {
    case "REJECT":
      return fail(decision.reason === "STAFF" ? "emekdas" : decision.reason === "UNVERIFIED_EMAIL" ? "tesdiqsiz" : "hesab");
    case "SIGN_IN":
      userId = decision.userId;
      break;
    case "LINK":
      await prisma.user.update({
        where: { id: decision.userId },
        data: {
          googleSub: profile.sub,
          emailVerifiedAt: byEmail?.emailVerifiedAt ?? now,
          // Təsdiqlənməmiş hesabın parolu başqasına məxsus ola bilər — ləğv olunur.
          ...(decision.revokePassword ? { passwordHash: "disabled" } : {}),
        },
      });
      if (decision.revokePassword) await revokeAllSessions(decision.userId);
      userId = decision.userId;
      break;
    case "CREATE":
      try {
        const created = await prisma.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            // Parolsuz hesab: «disabled» heç bir parola uyğun gəlmir, sonradan «Parolu unutdum» ilə qurula bilər.
            passwordHash: "disabled",
            accountType: ACCOUNT_TYPES.USER,
            role: ROLES.EDITOR,
            isActive: true,
            themePreference: "light",
            mustChangePassword: false,
            locale,
            googleSub: profile.sub,
            emailVerifiedAt: now,
          },
          select: { id: true },
        });
        userId = created.id;
      } catch {
        // Eyni anda başqa sorğu eyni e-poçtla hesab yaradıbsa unikal açar pozulur.
        return fail("xeta");
      }
      break;
  }

  if (!(await openPublicSession(userId))) return fail("emekdas");
  const target = safePublicTarget(flow.next) ?? localizePath("/kabinet", locale);
  return NextResponse.redirect(new URL(target, request.url), 303);
}
