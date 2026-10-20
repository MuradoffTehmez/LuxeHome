import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/constants";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { APPLE_LINK_PATH, consumeAppleFlow, exchangeAppleCode, isAppleLoginConfigured, storeAppleLinkResult } from "@/lib/auth/apple-oauth";
import { completeSocialLogin, socialFailurePath } from "@/lib/auth/social-login";
import { linkReturnPath } from "@/lib/auth/linked-logins";
import { SOCIAL_PROVIDERS, appleUserName } from "@/lib/auth/social-login-policy";

/**
 * Sign in with Apple callback-i. Apple `response_mode=form_post` ilə **POST** göndərir (`code`, `state`, ilk dəfə
 * `user`). Flow cookie-si buna görə `SameSite=None`-dur; `state` imzalı cookie ilə müqayisə olunur (CSRF), ID tokenin
 * `nonce`-u yoxlanılır. Qərar və sessiya `completeSocialLogin()`-dədir.
 */
export const dynamic = "force-dynamic";

async function handle(request: Request, params: { code: string | null; state: string | null; error: string | null; user: FormDataEntryValue | null }) {
  if (!isAppleLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const flow = await consumeAppleFlow(params.state);
  const locale: Locale = flow && (Object.values(LOCALES) as string[]).includes(flow.locale) ? (flow.locale as Locale) : "az";
  const fail = (code: string) => NextResponse.redirect(new URL(socialFailurePath(SOCIAL_PROVIDERS.APPLE, code, locale), request.url), 303);
  if (!flow || !params.code || params.error) return fail("xeta");
  if (!(await checkLoginLimit(clientIp(await headers())))) return fail("limit");

  const claims = await exchangeAppleCode(params.code, flow).catch(() => null);
  if (flow.linkUserId) {
    // Kabinetdən bağlama: bu POST kənar saytdandır və `Lax` sessiya cookie-si burada gəlmir — iddialar imzalı
    // qısaömürlü cookie-yə yazılır, bağlama eyni sayta GET-də cari sessiya ilə yoxlanılaraq edilir.
    if (!claims) return NextResponse.redirect(new URL(linkReturnPath("APPLE", "failed", locale), request.url), 303);
    await storeAppleLinkResult({ linkUserId: flow.linkUserId, ...claims, locale });
    return NextResponse.redirect(new URL(APPLE_LINK_PATH, request.url), 303);
  }
  if (!claims) return fail("xeta");
  const target = await completeSocialLogin({ provider: SOCIAL_PROVIDERS.APPLE, claims: { ...claims, name: appleUserName(params.user) }, locale, next: flow.next });
  return NextResponse.redirect(new URL(target, request.url), 303);
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const value = (key: string) => {
    const entry = form?.get(key);
    return typeof entry === "string" ? entry : null;
  };
  return handle(request, { code: value("code"), state: value("state"), error: value("error"), user: form?.get("user") ?? null });
}

/** İstifadəçi Apple ekranında «Ləğv et» seçəndə bəzi brauzerlər GET ilə qayıdır. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return handle(request, { code: url.searchParams.get("code"), state: url.searchParams.get("state"), error: url.searchParams.get("error") ?? (url.searchParams.get("code") ? null : "missing"), user: null });
}
