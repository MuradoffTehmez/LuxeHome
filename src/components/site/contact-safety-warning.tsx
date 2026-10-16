import { getLocale, getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { getCachedSafetyWarnings } from "@/lib/public-cache";
import type { Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Əlaqə panelinin məcburi beh xəbərdarlığı (PRD Modul 11, #199). Telefon/WhatsApp
 * düymələrinin bilavasitə üstündə durur və onları gizlətmir. Mətn paneldən dəyişdirilə
 * bilir; parametr oxunmasa və ya həmin dil boşdursa kataloqdakı defolt mətn göstərilir —
 * xəbərdarlıq heç vaxt itmir. Sessiya oxumur, elan detalının kənar keşini pozmur.
 */
export async function ContactSafetyWarning({ className }: { className?: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("property")]);
  const overrides = await getCachedSafetyWarnings().catch(() => ({}) as Awaited<ReturnType<typeof getCachedSafetyWarnings>>);
  const text = overrides[locale as Locale] ?? t("safety.contactWarning");

  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning-bg px-3.5 py-3 text-sm leading-6 text-ink",
        className,
      )}
    >
      <ShieldAlert className="mt-1 size-4 shrink-0 text-warning" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
