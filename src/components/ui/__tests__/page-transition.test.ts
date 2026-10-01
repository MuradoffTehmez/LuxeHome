import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/**
 * Səhifə keçidi sarğısı (`(site)/template.tsx`) bütün ictimai məzmunu əhatə edir. Animasiyadan sonra
 * sarğıda hər hansı `transform` qalsa, içindəki `position: fixed` elementlər (əmlak detalındakı mobil
 * «Zəng et / WhatsApp» zolağı, tam ekran xəritə) viewport-a deyil sarğıya görə yerləşir və sənədin
 * sonuna düşür.
 */
describe("səhifə keçidi animasiyası", () => {
  const keyframes = css.match(/@keyframes luxe-page-enter\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const rule = css.match(/\.page-transition\s*\{[^}]*\}/)?.[0] ?? "";

  it("yalnız opacity animasiya edir: transform containing block yaratmasın", () => {
    expect(keyframes).toContain("opacity");
    expect(keyframes).not.toMatch(/transform|translate|scale|rotate|filter|perspective/);
  });

  it("animasiyadan sonra son kadrı saxlamır (both/forwards yox)", () => {
    expect(rule).toContain("luxe-page-enter");
    expect(rule).not.toMatch(/\b(both|forwards)\b/);
  });
});
