import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { checkLoginLimit, clientIp } from "@/lib/auth/rate-limit";
import { beginTelegramFlow, isTelegramLoginConfigured } from "@/lib/auth/telegram-oidc";
import { safePublicTarget } from "@/lib/auth/public-account-policy";
import { localizePath } from "@/i18n/path-locale";
import { LOCALES, type Locale } from "@/lib/constants";

/** Telegram ilə girişi başladır. `TELEGRAM_CLIENT_ID`/`SECRET` yoxdursa marşrut mövcud deyilmiş kimi 404. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isTelegramLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("l");
  const locale: Locale = (Object.values(LOCALES) as string[]).includes(rawLocale ?? "") ? (rawLocale as Locale) : "az";

  if (!(await checkLoginLimit(clientIp(await headers())))) {
    return NextResponse.redirect(new URL(localizePath("/daxil-ol?telegram=limit", locale), request.url), 303);
  }
  // `davam` yalnız saytdaxili, `/admin` olmayan yol ola bilər — açıq yönləndirmə yoxdur.
  const target = await beginTelegramFlow({ next: safePublicTarget(url.searchParams.get("davam")), locale });
  return NextResponse.redirect(target, 303);
}
