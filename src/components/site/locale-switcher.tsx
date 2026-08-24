"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LOCALE_LABELS, type Locale } from "@/lib/constants";
import { saveLocalePreference } from "@/lib/locale-actions";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

/** Navbar-dakı `ThemeToggle`-ə bənzər dil seçici — dil dəyişdikdə cari səhifədə qalır. */
export function LocaleSwitcher({ isOverlay = false }: { isOverlay?: boolean }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.locale");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function select(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
    void saveLocalePreference(next);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("switch")}
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep",
          isOverlay ? "text-ink-invert-soft hover:bg-white/10" : "text-ink-soft hover:bg-beige hover:text-ink",
        )}
      >
        <Globe className="size-5" aria-hidden="true" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("switch")} size="sm">
        <ul className="flex flex-col gap-1">
          {routing.locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => select(code)}
                className={cn(
                  "flex min-h-12 w-full items-center justify-between rounded-xs px-3 text-sm transition-colors",
                  code === locale ? "bg-beige font-medium text-ink" : "text-ink-soft hover:bg-beige/60 hover:text-ink",
                )}
              >
                {LOCALE_LABELS[code]}
                {code === locale && <Check className="size-4 text-gold-deep" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
