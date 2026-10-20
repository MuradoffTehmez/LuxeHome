import { NextResponse } from "next/server";
import { LOCALES, type Locale } from "@/lib/constants";
import { isAppleLoginConfigured, takeAppleLinkResult } from "@/lib/auth/apple-oauth";
import { linkReturnPath, linkSocialToUser } from "@/lib/auth/linked-logins";
import { currentLinkingUser } from "@/lib/auth/linked-login-session";

/**
 * Apple-ı kabinetdən bağlamanın ikinci addımı. `form_post` callback-i (kənar saytdan POST) yoxlanılmış iddiaları imzalı,
 * 2 dəqiqəlik cookie-yə yazıb bura yönləndirir. Sorğu parametri qəbul edilmir: bağlama yalnız imzalı nəticə cookie-si
 * və onu yaradan hesabın hələ də cari sessiya olması ilə baş verir.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAppleLoginConfigured()) return new Response("Tapılmadı", { status: 404 });
  const result = await takeAppleLinkResult();
  const locale: Locale = result && (Object.values(LOCALES) as string[]).includes(result.locale) ? (result.locale as Locale) : "az";
  const user = result ? await currentLinkingUser(result.linkUserId) : null;
  const outcome = !result ? "failed" : !user ? "mismatch" : await linkSocialToUser(user.id, "APPLE", result);
  return NextResponse.redirect(new URL(linkReturnPath("APPLE", outcome, locale), request.url), 303);
}
