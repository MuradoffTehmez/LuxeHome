"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { saveThemePreference } from "@/lib/theme-actions";

const CYCLE = ["light", "dark", "system"] as const;
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;
const LABELS = { light: "Açıq", dark: "Tünd", system: "Sistem" } as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
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
      className="flex size-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-beige hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
      onClick={() => {
        setTheme(next);
        void saveThemePreference(next);
      }}
      aria-label={`Mövzu: ${LABELS[current]}. Dəyişmək üçün klikləyin.`}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
