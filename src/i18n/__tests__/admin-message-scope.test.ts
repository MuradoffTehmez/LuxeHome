/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import azAdmin from "../locales/az/admin.json";
import enAdmin from "../locales/en/admin.json";
import ruAdmin from "../locales/ru/admin.json";

/**
 * Panel client komponentlərinin oxuduğu bölmələr kataloqda mövcud olmalıdır.
 *
 * Əvvəl bu test marşruta görə süzgəcin (`pickAdminMessages`) hər marşruta lazım
 * olan bölməni göndərdiyini yoxlayırdı. Süzgəc götürüldü — səbəbi `../admin.ts`
 * sonundakı qeyddədir: layout client naviqasiyasında yenidən render olunmadığı
 * üçün süzgəc keçid anında köhnə bölmələrlə qalırdı və paneldə tərcümə açarları
 * görünürdü.
 *
 * Yoxlamanın özü hələ də dəyərlidir, sadəcə hədəfi dəyişib: indi hər üç dil
 * kataloqunun client komponentlərinin istinad etdiyi bölmələri daşıdığını təsdiq
 * edir. Bölmə adı dəyişəndə və ya tərcümə faylı bir dildə unudulanda test tutur.
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

const usedSections = [
  ...new Set(
    Object.entries({ ...clientModules, ...sharedModules })
      .filter(([path, src]) => !path.includes("__tests__") && isClient(src))
      .flatMap(([, src]) => sectionsIn(src)),
  ),
].sort();

function has(catalog: object, path: string): boolean {
  return (
    path
      .split(".")
      .reduce<unknown>(
        (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
        catalog as Record<string, unknown>,
      ) !== undefined
  );
}

describe("admin message catalog", () => {
  it("finds the sections the panel actually reads", () => {
    // Skan boşa düşərsə test səssizcə hər şeyi keçirərdi
    expect(usedSections.length).toBeGreaterThan(5);
  });

  it.each([
    ["az", azAdmin],
    ["en", enAdmin],
    ["ru", ruAdmin],
  ])("%s catalog ships every section the panel client components use", (locale, catalog) => {
    for (const section of usedSections) {
      expect(has(catalog, section), `${locale} → ${section}`).toBe(true);
    }
  });
});
