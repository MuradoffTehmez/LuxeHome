import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOCALES, type Locale } from "@/lib/constants";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { consumeTelegramFlow, exchangeTelegramCode, isTelegramLoginConfigured, setPendingTelegramSignup } from "@/lib/auth/telegram-oidc";
import { telegramLoginDecision } from "@/lib/auth/telegram-login-policy";
import { openPublicSession } from "@/lib/auth/public-session";
import { safePublicTarget } from "@/lib/auth/public-account-policy";
import { localizePath } from "@/i18n/path-locale";

/**
 * Telegram OIDC callback. Qərar `telegramLoginDecision()`-dadır: bağlı kimlik → sessiya, tanınmayan → e-poçt təsdiqli
 * qeydiyyat (`/qeydiyyat/telegram`). Mövcud hesaba avtomatik bağlama yoxdur. Uğursuzluq ümumi səbəb kodu ilə giriş
 * səhifəsinə qayıdır — hansı hesabın mövcud olduğu sızdırılmır.
 */
export const dynamic = "force-dynamic";

const ACCOUNT_SELECT = {
  userId: true,
  oidcSub: true,
  blockedAt: true,
  user: { select: { accountType: true, isActive: true, lockedUntil: true, deletionRequestedAt: true } },
} as const;

type AccountRow = { userId: string; oidcSub: string | null; blockedAt: Date | null; user: { accountType: string; isActive: boolean; lockedUntil: Date | null; deletionRequestedAt: Date | null } };

const flatten = (row: AccountRow | null) => (row ? { userId: row.userId, oidcSub: row.oidcSub, ...row.user } : null);

export async function GET(request: Request) {
  if (!isTelegramLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const url = new URL(request.url);
  const flow = await consumeTelegramFlow(url.searchParams.get("state"));
  const locale: Locale = flow && (Object.values(LOCALES) as string[]).includes(flow.locale) ? (flow.locale as Locale) : "az";
  const fail = (reason: string) => NextResponse.redirect(new URL(localizePath(`/daxil-ol?telegram=${reason}`, locale), request.url), 303);

  const code = url.searchParams.get("code");
  if (!flow || !code || url.searchParams.get("error")) return fail("xeta");
  if (!(await checkLoginLimit(clientIp(await headers())))) return fail("limit");

  const exchanged = await exchangeTelegramCode(code, flow).catch(() => null);
  if (!exchanged) return fail("xeta");
  const { identity, botAccess } = exchanged;

  const [bySub, byTelegramId] = await Promise.all([
    prisma.telegramAccount.findUnique({ where: { oidcSub: identity.sub }, select: ACCOUNT_SELECT }),
    prisma.telegramAccount.findUnique({ where: { telegramUserId: identity.telegramUserId }, select: ACCOUNT_SELECT }),
  ]);
  const decision = telegramLoginDecision({ bySub: flatten(bySub), byTelegramId: flatten(byTelegramId), sub: identity.sub, now: new Date() });

  switch (decision.action) {
    case "REJECT":
      return fail(decision.reason === "STAFF" ? "emekdas" : decision.reason === "CONFLICT" ? "xeta" : "hesab");
    case "ONBOARD":
      await setPendingTelegramSignup({ ...identity, botAccess, locale, next: flow.next });
      return NextResponse.redirect(new URL(localizePath("/qeydiyyat/telegram", locale), request.url), 303);
    case "SIGN_IN": {
      const row = bySub ?? byTelegramId;
      await prisma.telegramAccount.update({
        where: { userId: decision.userId },
        data: {
          ...(decision.storeSub ? { oidcSub: identity.sub } : {}),
          ...(identity.username ? { username: identity.username } : {}),
          // Yeni `telegram:bot_access` razılığı bot bloklamasını aradan qaldırmır — onu yalnız botda `/start` edir.
          ...(botAccess && !row?.blockedAt ? { botAccess: true, chatId: identity.telegramUserId } : {}),
        },
      }).catch(() => undefined);
      if (!(await openPublicSession(decision.userId))) return fail("emekdas");
      const target = safePublicTarget(flow.next) ?? localizePath("/kabinet", locale);
      return NextResponse.redirect(new URL(target, request.url), 303);
    }
  }
}
