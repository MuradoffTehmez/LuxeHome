"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { saveThemePreference } from "@/lib/theme-actions";
import { cn } from "@/lib/utils";

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

  const current = theme === "dark" ? "dark" : "light";
  const next = current === "light" ? "dark" : "light";
  const Icon = current === "light" ? Moon : Sun;

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
      aria-label={t("activate", { theme: t(next) })}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
