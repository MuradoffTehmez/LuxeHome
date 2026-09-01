/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import { SESSION_DEPENDENT_PUBLIC_ROUTES, isCacheablePublicRoute } from "../public-cache-policy";

/**
 * Keşlənə bilən ictimai səhifə heç vaxt sessiyadan asılı olmamalıdır.
 *
 * Bir istifadəçinin HTML-i başqasına verilməsin deyə qayda sadədir: server
 * komponentində sessiya oxuyan ictimai səhifə paylaşılan keşə salınmır. Bu test
 * həmin siyahını mənbədən yenidən hesablayır — kimsə yeni səhifəyə
 * `getOptionalUser()` əlavə edib siyahını yeniləməyi unutsa, burada dayanır.
 */

// Qeyd: glob-da `[locale]` simvol sinfi, `(site)` isə qrup kimi oxunur, ona görə
// şablon geniş saxlanılır və `(site)` filtri yol sətri üzərində aparılır.
const allModules = import.meta.glob("../../app/**/*.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const pageModules = Object.fromEntries(
  Object.entries(allModules).filter(
    ([path]) => path.includes("/(site)/") && path.endsWith("/page.tsx"),
  ),
);

const SESSION_READS = /\b(getOptionalUser|requireAccount|requireStaff|requireUser)\s*\(/;

function routeOf(path: string): string {
  const match = path.match(/\(site\)\/(.*)\/page\.tsx$/);
  if (!match) return "/";
  return "/" + match[1].replace(/\/\[[^\]]+\]/g, "/[param]");
}

const sessionDependent = Object.entries(pageModules)
  .filter(([, source]) => SESSION_READS.test(source))
  .map(([path]) => routeOf(path))
  .sort();

describe("ictimai keş təhlükəsizliyi", () => {
  it("sessiya oxuyan ictimai səhifələrin siyahısı mənbə ilə üst-üstə düşür", () => {
    expect(sessionDependent).toEqual([...SESSION_DEPENDENT_PUBLIC_ROUTES].sort());
  });

  it("sessiya oxuyan səhifə keşlənə bilən sayılmır", () => {
    for (const pattern of SESSION_DEPENDENT_PUBLIC_ROUTES) {
      // Şablon konkret ünvana çevrilir: `/emlaklar/[param]` → `/az/emlaklar/villa-1`
      const concrete = "/az" + pattern.replace("[param]", "villa-1");
      expect(isCacheablePublicRoute(concrete), concrete).toBe(false);
    }
  });

  it("auth, kabinet, admin və API yolları keşdən kənardır", () => {
    for (const route of [
      "/az/daxil-ol",
      "/az/qeydiyyat",
      "/az/kabinet",
      "/az/kabinet/favoritler",
      "/giris",
      "/admin",
      "/admin/emlaklar",
      "/api/hesab/menu",
    ]) {
      expect(isCacheablePublicRoute(route), route).toBe(false);
    }
  });

  it("sessiyasız ictimai səhifələr keşlənə bilən sayılır", () => {
    for (const route of [
      "/az",
      "/az/emlaklar",
      "/en/emlaklar",
      "/ru/bilik-merkezi/suallar",
      "/az/xidmetler",
      "/az/blog",
    ]) {
      expect(isCacheablePublicRoute(route), route).toBe(true);
    }
  });
});
