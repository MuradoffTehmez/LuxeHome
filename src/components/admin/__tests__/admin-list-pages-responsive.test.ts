import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listPages = [
  "src/app/admin/emlaklar/page.tsx",
  "src/app/admin/layiheler/page.tsx",
  "src/app/admin/blog/page.tsx",
  "src/app/admin/xidmetler/page.tsx",
];

describe("əsas admin siyahılarının responsive müqaviləsi", () => {
  it.each(listPages)("%s mobil kart və desktop cədvəl görünüşünü paylaşır", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");

    expect(source).toContain("AdminResponsiveList");
    expect(source).toContain("AdminListCard");
    expect(source).toContain("renderTable");
    expect(source).toContain("size-11");
  });
});
