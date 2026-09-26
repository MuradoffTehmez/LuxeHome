import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = [
  join(process.cwd(), "src", "app", "admin"),
  join(process.cwd(), "src", "components", "admin"),
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("tipoqrafiya qaydaları (#95)", () => {
  it("başlıq bazası @layer base içindədir — utility sinifləri onu üstələyə bilir", () => {
    // Windows checkout-unda fayl CRLF ilə gələ bilər — axtarış sətir sonundan asılı olmasın.
    const css = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8").replace(/\r\n/g, "\n");
    const baseLayer = css.indexOf("@layer base {");
    const headingRule = css.indexOf("font-family: var(--font-display);\n    font-weight: 500;");

    expect(baseLayer).toBeGreaterThanOrEqual(0);
    expect(headingRule).toBeGreaterThan(baseLayer);
    // Laysız `h1, h2, h3, h4 {` qaydası geri qayıtmamalıdır.
    expect(css).not.toMatch(/^h1,\nh2,\nh3,\nh4 \{/m);
  });

  it("admin başlıqları serif (font-display) işlətmir", () => {
    const heading = /<h[1-4][^>]*className="[^"]*\bfont-display\b/g;
    const findings = roots.flatMap(sourceFiles).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(heading)].map((match) => `${file.replace(process.cwd(), "")}: ${match[0].slice(0, 80)}`),
    );

    expect(findings).toEqual([]);
  });
});
