import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { beginGoogleFlow, isGoogleLoginConfigured } from "@/lib/auth/google-oauth";
import { safePublicTarget } from "@/lib/auth/public-account-policy";
import { localizePath } from "@/i18n/path-locale";
import { LOCALES, type Locale } from "@/lib/constants";

/** Google ilə girişi başladır (#109). Açarlar yoxdursa marşrut mövcud deyilmiş kimi 404. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isGoogleLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("l");
  const locale: Locale = (Object.values(LOCALES) as string[]).includes(rawLocale ?? "") ? (rawLocale as Locale) : "az";

  if (!(await checkLoginLimit(clientIp(await headers())))) {
    return NextResponse.redirect(new URL(localizePath("/daxil-ol?google=limit", locale), request.url), 303);
  }
  const target = await beginGoogleFlow({ next: safePublicTarget(url.searchParams.get("davam")), locale });
  return NextResponse.redirect(target, 303);
}
