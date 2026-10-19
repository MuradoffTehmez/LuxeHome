import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { beginFacebookFlow, isFacebookLoginConfigured } from "@/lib/auth/facebook-oauth";
import { safePublicTarget } from "@/lib/auth/public-account-policy";
import { localizePath } from "@/i18n/path-locale";
import { LOCALES, type Locale } from "@/lib/constants";
import { linkingUserForStart } from "@/lib/auth/linked-login-session";

/** «Facebook ilə daxil ol» axınını başladır. Açarlar yoxdursa marşrut mövcud deyilmiş kimi 404. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isFacebookLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("l");
  const locale: Locale = (Object.values(LOCALES) as string[]).includes(rawLocale ?? "") ? (rawLocale as Locale) : "az";
  if (!(await checkLoginLimit(clientIp(await headers())))) {
    return NextResponse.redirect(new URL(localizePath("/daxil-ol?facebook=limit", locale), request.url), 303);
  }
  // `?bagla=1` — kabinetdən giriş üsulunu bağlama: yalnız cari sessiyanın hesabına.
  const linking = await linkingUserForStart(url);
  if (linking.linking && !linking.userId) {
    return NextResponse.redirect(new URL(localizePath(`/daxil-ol?davam=${encodeURIComponent(localizePath("/kabinet/profil", locale))}`, locale), request.url), 303);
  }
  const target = await beginFacebookFlow({
    next: linking.linking ? undefined : safePublicTarget(url.searchParams.get("davam")),
    locale,
    ...(linking.linking && linking.userId ? { linkUserId: linking.userId } : {}),
  });
  return NextResponse.redirect(target, 303);
}
