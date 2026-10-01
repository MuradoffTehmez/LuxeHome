import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isBottomNavHidden } from "../mobile-bottom-nav";

describe("mobil alt naviqasiya", () => {
  it("öz sabit paneli olan detal səhifəsində gizlənir", () => {
    expect(isBottomNavHidden("/emlaklar/sahil-menzili")).toBe(true);
    expect(isBottomNavHidden("/emlaklar")).toBe(false);
    expect(isBottomNavHidden("/")).toBe(false);
    expect(isBottomNavHidden("/favoritler")).toBe(false);
  });

  it("alt kənara yapışan səthlər panelin hündürlüyü qədər qalxır", () => {
    const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
    expect(read("src/app/globals.css")).toMatch(/body:has\(\[data-bottom-nav\]\)\s*\{\s*--bottom-nav-offset/);
    expect(read("src/components/ui/toast.tsx")).toContain("var(--bottom-nav-offset)");
    expect(read("src/components/analytics/consent-banner.tsx")).toContain("var(--bottom-nav-offset)");
    // Əmlak detalındakı sticky CTA zolağı da eyni mexanizmlə ofset yaradır: razılıq kartı və toast onun üstündə qalır
    expect(read("src/app/globals.css")).toMatch(/body:has\(\[data-sticky-action-bar\]\)\s*\{\s*--sticky-bar-offset/);
    expect(read("src/components/ui/sticky-action-bar.tsx")).toContain("data-sticky-action-bar");
    expect(read("src/components/ui/toast.tsx")).toContain("var(--sticky-bar-offset)");
    expect(read("src/components/analytics/consent-banner.tsx")).toContain("var(--sticky-bar-offset)");
    expect(read("src/app/[locale]/(site)/layout.tsx")).toContain("pb-[var(--bottom-nav-offset)]");
  });
});
