import { existsSync, readFileSync } from "node:fs";
import { posix } from "node:path";
import { describe, expect, it } from "vitest";
import { adminNav } from "../../src/components/admin/admin-nav";
import { PERMISSIONS } from "../../src/lib/constants";

// `posix`: Windows-da `join` əks xətt qaytarır və aşağıdakı `src/app/admin` müqayisəsi layout-u heç tapmırdı.
const { dirname, join } = posix;

/**
 * Admin menyusu rola görə süzülür (`adminNavForRole`). Bəndin icazəsi səhifənin öz guard-ı ilə eyni
 * olmalıdır: fərqli olsa ya icazəsiz istifadəçi 403-ə aparan link görür, ya da icazəli istifadəçi
 * öz səhifəsini menyuda tapmır. Guard səhifədə və ya yuxarıdakı `layout.tsx`-də ola bilər.
 */
const KEY_OF = new Map<string, string>(Object.entries(PERMISSIONS).map(([key, value]) => [value, key]));

function guardSources(href: string): string {
  let dir = join("src/app", href.split("#", 1)[0]);
  const sources: string[] = [];
  const page = join(dir, "page.tsx");
  if (existsSync(page)) sources.push(readFileSync(page, "utf8"));
  while (dir !== "src/app/admin" && dir.startsWith("src/app/admin")) {
    const layout = join(dir, "layout.tsx");
    if (existsSync(layout)) sources.push(readFileSync(layout, "utf8"));
    dir = dirname(dir);
  }
  return sources.join("\n");
}

describe("admin menyusunun icazələri", () => {
  const children = adminNav.flatMap((group) => group.items.flatMap((item) => item.children ?? []));

  it("hər alt bəndin səhifəsi mövcuddur", () => {
    for (const child of children) expect(existsSync(join("src/app", child.href.split("#", 1)[0], "page.tsx")), child.href).toBe(true);
  });

  it("bəndin icazəsi səhifə və ya layout guard-ı ilə eynidir", () => {
    for (const child of children) {
      const key = KEY_OF.get(child.permission);
      const source = guardSources(child.href);
      expect(source, `${child.href} → PERMISSIONS.${key}`).toMatch(new RegExp(`require(?:AdminRead|Permission)\\(PERMISSIONS\\.${key}\\)`));
    }
  });
});
