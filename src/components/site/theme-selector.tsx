"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { saveThemePreference } from "@/lib/theme-actions";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common.theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted && theme === "dark" ? "dark" : "light";

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">{t("choose")}</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value, icon: Icon }) => {
          const active = current === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTheme(value);
                void saveThemePreference(value);
              }}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                active
                  ? "border-gold bg-gold/12 text-ink"
                  : "border-line-strong bg-paper text-ink-soft hover:border-gold hover:text-ink",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
              {t(value)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
