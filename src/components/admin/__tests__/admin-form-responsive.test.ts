import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string) {
  return readFileSync(join(process.cwd(), file), "utf8");
}

describe("admin formalarının responsive və validasiya müqaviləsi", () => {
  it("server xətasında ilk etibarsız sahəni fokuslayır", () => {
    const formShell = source("src/components/admin/form-shell.tsx");
    expect(formShell).toContain("formRef");
    expect(formShell).toContain('[aria-invalid="true"]');
    expect(formShell).toContain("firstInvalid.focus");
  });

  it("sticky submit safe-area və mobil tək sütun grid-ini saxlayır", () => {
    const formShell = source("src/components/admin/form-shell.tsx");
    expect(formShell).toContain("var(--safe-bottom)");
    expect(formShell).toContain("grid gap-4 p-4 sm:grid-cols-2 sm:p-5");
  });

  it("hesab kartları dar ekranda az padding və qırılan uzun mətn istifadə edir", () => {
    const account = source("src/app/admin/hesabim/page.tsx");
    expect(account).toContain("p-4 sm:p-6");
    expect(account).toContain("[overflow-wrap:anywhere]");
  });
});
