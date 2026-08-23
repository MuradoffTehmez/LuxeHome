import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string) {
  return readFileSync(join(process.cwd(), file), "utf8");
}

describe("admin əməliyyat ekranlarının responsive müqaviləsi", () => {
  it.each([
    "src/app/admin/muracietler/page.tsx",
    "src/app/admin/hesablar/page.tsx",
    "src/app/admin/istifadeciler/page.tsx",
  ])("%s mobil kart təqdimatını saxlayır", (file) => {
    const page = source(file);
    expect(page).toContain("AdminResponsiveList");
    expect(page).toContain("AdminListCard");
    expect(page).toContain("renderTable");
  });

  it("media grid-i 480 px-dən etibarən iki sütuna keçir və mobil şəkil ölçüsünü düzgün bildirir", () => {
    expect(source("src/app/admin/media/page.tsx")).toContain("min-[480px]:grid-cols-2");
    expect(source("src/app/admin/media/media-card.tsx")).toContain("(max-width: 479px) 100vw");
  });

  it("istifadəçi və media əməliyyatlarında 44 px toxunma hədəflərini saxlayır", () => {
    expect(source("src/app/admin/istifadeciler/user-forms.tsx")).toContain("min-h-11");
    expect(source("src/app/admin/media/media-card.tsx")).toContain("size-11");
  });
});
