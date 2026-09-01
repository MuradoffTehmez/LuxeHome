"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, defaultTheme = "light" }: { children: React.ReactNode; defaultTheme?: string }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme === "dark" ? "dark" : "light"}
      enableSystem={false}
      themes={["light", "dark"]}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
