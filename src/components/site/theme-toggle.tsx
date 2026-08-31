"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { saveThemePreference } from "@/lib/theme-actions";
import { cn } from "@/lib/utils";

const CYCLE = ["light", "dark", "system"] as const;
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

export function ThemeToggle({ isOverlay = false }: { isOverlay?: boolean }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common.theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-11" aria-hidden="true" />;
  }

  const current = (theme && CYCLE.includes(theme as (typeof CYCLE)[number]) ? theme : "system") as (typeof CYCLE)[number];
  const Icon = ICONS[current];
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  return (
    <button
      type="button"
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2",
        isOverlay
          ? "text-white/90 hover:bg-white/10 hover:text-white focus-visible:ring-gold-soft"
          : "text-ink-soft hover:bg-beige hover:text-ink focus-visible:ring-gold-deep",
      )}
      onClick={() => {
        setTheme(next);
        void saveThemePreference(next);
      }}
      aria-label={t("toggle", { theme: t(current) })}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
