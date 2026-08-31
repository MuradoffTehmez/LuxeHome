/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import { adminRouteSegment, pickAdminMessages, type AdminMessages } from "../admin";
import azAdmin from "../locales/az/admin.json";

/**
 * `pickAdminMessages()` client-ə göndərilən kataloqu marşruta görə süzür.
 *
 * Süzgəc siyahısı əl ilə yazılıb, ona görə bu test onu mənbədən yenidən hesablayır:
 * bir marşrutun client komponenti işlətdiyi bölmə siyahıda yoxdursa, paneldə
 * mətn əvəzinə açar adı görünərdi. Test həmin uyğunsuzluğu tutur.
 */

const clientModules = import.meta.glob("../../app/admin/**/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const sharedModules = import.meta.glob("../../components/admin/**/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const SECTION = /t\(\s*[`"](pages\.[a-zA-Z]+|labels|shell|nav|actions|state|components|profile|dashboard|pagination)/g;

function isClient(source: string): boolean {
  return /^\s*["']use client["']/.test(source);
}

function sectionsIn(source: string): string[] {
  return [...source.matchAll(SECTION)].map((m) => m[1]);
}

function routeOf(path: string): string {
  const rest = path.replace(/^\.\.\/\.\.\/app\/admin\/?/, "");
  const segment = rest.split("/")[0] ?? "";
  return segment.endsWith(".tsx") ? "" : segment;
}

const sharedSections = new Set(
  Object.entries(sharedModules)
    .filter(([path, src]) => !path.includes("__tests__") && isClient(src))
    .flatMap(([, src]) => sectionsIn(src)),
);

const requiredByRoute = new Map<string, Set<string>>();
for (const [path, src] of Object.entries(clientModules)) {
  if (path.includes("__tests__") || !isClient(src)) continue;
  const route = routeOf(path);
  const bucket = requiredByRoute.get(route) ?? new Set<string>();
  for (const section of sectionsIn(src)) bucket.add(section);
  requiredByRoute.set(route, bucket);
}

const messages = { admin: azAdmin } as unknown as AdminMessages;

function has(picked: AdminMessages, path: string): boolean {
  return (
    path
      .split(".")
      .reduce<unknown>(
        (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
        picked.admin as unknown as Record<string, unknown>,
      ) !== undefined
  );
}

describe("admin message scope", () => {
  it("derives the route segment from the pathname", () => {
    expect(adminRouteSegment("/admin")).toBe("");
    expect(adminRouteSegment("/admin/emlaklar")).toBe("emlaklar");
    expect(adminRouteSegment("/admin/emlaklar/abc-123")).toBe("emlaklar");
    expect(adminRouteSegment("/admin/bilik-merkezi/suallar")).toBe("bilik-merkezi");
  });

  it.each([...requiredByRoute.keys()].sort())(
    "ships every section the client components of /admin/%s use",
    (route) => {
      const picked = pickAdminMessages(messages, `/admin/${route}`);
      for (const section of [...(requiredByRoute.get(route) ?? []), ...sharedSections]) {
        expect(has(picked, section), `${route} → ${section}`).toBe(true);
      }
    },
  );

  it("actually trims the payload it sends", () => {
    const full = JSON.stringify(messages).length;
    const trimmed = JSON.stringify(pickAdminMessages(messages, "/admin/serp")).length;
    expect(trimmed).toBeLessThan(full / 2);
  });

  it("falls back to the whole catalog for an unknown route", () => {
    const picked = pickAdminMessages(messages, "/admin/yeni-bolme");
    expect(JSON.stringify(picked)).toBe(JSON.stringify(messages));
  });
});
