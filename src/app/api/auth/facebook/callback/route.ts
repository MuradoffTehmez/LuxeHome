import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/constants";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { consumeFacebookFlow, exchangeFacebookCode, isFacebookLoginConfigured } from "@/lib/auth/facebook-oauth";
import { completeSocialLogin, socialFailurePath } from "@/lib/auth/social-login";
import { SOCIAL_PROVIDERS } from "@/lib/auth/social-login-policy";

/** Facebook Login callback-i: `state` (CSRF) + PKCE verifier, profil server tərəfdə Graph API-dən oxunur. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isFacebookLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const url = new URL(request.url);
  const flow = await consumeFacebookFlow(url.searchParams.get("state"));
  const locale: Locale = flow && (Object.values(LOCALES) as string[]).includes(flow.locale) ? (flow.locale as Locale) : "az";
  const fail = (code: string) => NextResponse.redirect(new URL(socialFailurePath(SOCIAL_PROVIDERS.FACEBOOK, code, locale), request.url), 303);

  const code = url.searchParams.get("code");
  if (!flow || !code || url.searchParams.get("error")) return fail("xeta");
  if (!(await checkLoginLimit(clientIp(await headers())))) return fail("limit");

  const claims = await exchangeFacebookCode(code, flow).catch(() => null);
  if (!claims) return fail("xeta");
  const target = await completeSocialLogin({ provider: SOCIAL_PROVIDERS.FACEBOOK, claims, locale, next: flow.next });
  return NextResponse.redirect(new URL(target, request.url), 303);
}
