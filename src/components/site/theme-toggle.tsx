"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-11" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className="flex size-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-beige hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Mövzunu dəyişdir"
    >
      {theme === "dark" ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
