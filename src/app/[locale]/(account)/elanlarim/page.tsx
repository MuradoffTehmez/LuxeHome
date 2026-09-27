import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { SHORT_LINKS } from "@/lib/accounts/short-links";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";

/** Qısa ünvan — kabinetdəki hədəfə yönləndirir (giriş yoxdursa kabinet özü girişə aparır). */
export default async function ShortLinkPage() {
  redirect(localizePath(SHORT_LINKS["/elanlarim"], (await getLocale()) as Locale));
}
