/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import { MESSAGE_NAMESPACES } from "../config";
import { ADMIN_MESSAGE_NAMESPACES } from "../admin";

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
  "phase2",
  "phase3",
  "knowledge",
] as const;

/**
 * Panel kataloqları ictimai siyahıda deyil (hər ictimai sorğuda yüklənməsinlər),
 * amma dil paritetinə eyni sərtliklə tabedirlər.
 */
const requiredAdminNamespaces = ["admin"] as const;

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

  it("declares every admin namespace", () => {
    expect(ADMIN_MESSAGE_NAMESPACES).toEqual(requiredAdminNamespaces);
  });

  it("keeps admin namespaces out of the public request config", () => {
    for (const namespace of requiredAdminNamespaces) {
      expect(MESSAGE_NAMESPACES).not.toContain(namespace);
    }
  });

  it.each(requiredAdminNamespaces)("keeps recursive key parity for %s", (namespace) => {
    const baseline = leafKeys(readCatalog("az", namespace)).sort();

    for (const locale of locales.slice(1)) {
      expect(leafKeys(readCatalog(locale, namespace)).sort()).toEqual(baseline);
    }
  });

  it.each(requiredNamespaces)("keeps recursive key parity for %s", (namespace) => {
    const baseline = leafKeys(readCatalog("az", namespace)).sort();

    for (const locale of locales.slice(1)) {
      expect(leafKeys(readCatalog(locale, namespace)).sort()).toEqual(baseline);
    }
  });

  it.each(locales)("does not ship blank leaf messages for %s", (locale) => {
    for (const namespace of [...requiredNamespaces, ...requiredAdminNamespaces]) {
      const catalog = readCatalog(locale, namespace);
      const serialized = JSON.stringify(catalog);
      expect(serialized).not.toMatch(/:\s*"\s*"/);
    }
  });
});
