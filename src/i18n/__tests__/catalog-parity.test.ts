/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import { MESSAGE_NAMESPACES } from "../config";

const locales = ["az", "en", "ru"] as const;
const requiredNamespaces = [
  "common",
  "navigation",
  "auth",
  "account",
  "property",
  "validation",
  "home",
  "listings",
  "content",
  "contact",
  "legal",
  "partners",
  "seoLandings",
] as const;

const catalogModules = import.meta.glob("../locales/*/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function readCatalog(locale: string, namespace: string): unknown {
  return catalogModules[`../locales/${locale}/${namespace}.json`];
}

function leafKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n message catalogs", () => {
  it("declares every public-site namespace", () => {
    expect(MESSAGE_NAMESPACES).toEqual(requiredNamespaces);
  });

  it.each(requiredNamespaces)("keeps recursive key parity for %s", (namespace) => {
    const baseline = leafKeys(readCatalog("az", namespace)).sort();

    for (const locale of locales.slice(1)) {
      expect(leafKeys(readCatalog(locale, namespace)).sort()).toEqual(baseline);
    }
  });

  it.each(locales)("does not ship blank leaf messages for %s", (locale) => {
    for (const namespace of requiredNamespaces) {
      const catalog = readCatalog(locale, namespace);
      const serialized = JSON.stringify(catalog);
      expect(serialized).not.toMatch(/:\s*"\s*"/);
    }
  });
});
