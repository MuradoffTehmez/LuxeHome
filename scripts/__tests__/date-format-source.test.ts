import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Cloudflare Workers-in yığcam ICU datasında `az` tarix şablonları yoxdur: `Intl.DateTimeFormat("az", …)`
 * və `next-intl`-in `format.dateTime()` «2026 M09 29» qaytarır (bloq kartı, məqalə meta sətri və s.).
 * Tarix yalnız `src/i18n/date.ts`-dəki köməkçilərlə yazılmalıdır.
 */
const FORBIDDEN: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /new\s+Intl\.DateTimeFormat\(/, hint: "formatLocalizedDate / formatLocalizedDateTime işlət" },
  { pattern: /new\s+Intl\.RelativeTimeFormat\(/, hint: "formatLocalizedRelative işlət" },
  // `toLocaleString` rəqəm formatı üçün də işləndiyindən yoxlanmır; tarix üçün bu iki metod qadağandır.
  { pattern: /\.toLocale(Date|Time)String\(/, hint: "formatLocalizedDate / formatLocalizedTime işlət" },
  { pattern: /\bformat\.dateTime\(/, hint: "next-intl dateTime ICU-dan asılıdır — formatLocalizedDate işlət" },
  { pattern: /\bformat\.relativeTime\(/, hint: "formatLocalizedRelative işlət" },
];

/** Brauzerdə, istifadəçinin öz locale-ında işləyən yerlər (server render olunmur). */
const ALLOWED = new Set(["src/i18n/date.ts", "src/components/admin/form-wizard.tsx"]);

function collect(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      collect(full, found);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

describe("tarix formatı", () => {
  it("mənbə kodunda ICU-dan asılı tarix formatlayıcısı qalmayıb", () => {
    const root = join(process.cwd(), "src");
    const violations: string[] = [];

    for (const file of collect(root)) {
      const rel = relative(process.cwd(), file).split(sep).join("/");
      if (ALLOWED.has(rel)) continue;
      const text = readFileSync(file, "utf-8");
      for (const { pattern, hint } of FORBIDDEN) {
        if (pattern.test(text)) violations.push(`${rel}: ${pattern} — ${hint}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
