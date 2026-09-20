import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const detailRoutes = [
  "src/app/[locale]/(site)/xidmetler/[slug]/page.tsx",
  "src/app/[locale]/(site)/layiheler/[slug]/page.tsx",
  "src/app/[locale]/(site)/blog/[slug]/page.tsx",
  "src/app/[locale]/(site)/bilik-merkezi/[slug]/page.tsx",
  "src/app/[locale]/(site)/emlaklar/[slug]/page.tsx",
];

describe("detail route canonical metadata", () => {
  it.each(detailRoutes)("%s boş CMS canonical dəyərində self-canonical saxlayır", (path) => {
    const source = readFileSync(join(process.cwd(), path), "utf8");

    expect(source).toMatch(/canonicalPath:\\s*\\w+\\.canonicalUrl \\|\\| undefined/);
  });
});
