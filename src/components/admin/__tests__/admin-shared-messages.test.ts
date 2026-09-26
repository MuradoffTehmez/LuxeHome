import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import az from "@/i18n/locales/az/admin.json";
import en from "@/i18n/locales/en/admin.json";
import ru from "@/i18n/locales/ru/admin.json";
import { pickSharedAdminMessages } from "@/i18n/admin";

/**
 * Kabinet paneldəki ortaq komponentləri işlədir, lakin `admin` kataloqunun yalnız
 * `pickSharedAdminMessages()` alt-dəstini alır (#81). Burada kabinetdən idxal
 * olunan hər admin komponenti (və onun daxili idxalları) izlənir və çağırdığı
 * hər açarın alt-dəstdə üç dildə olduğu yoxlanır — əks halda formada
 * `admin.actions.cancel` kimi xam açar görünür.
 */

const ROOT = process.cwd();
const ACCOUNT_DIR = join(ROOT, "src", "app", "[locale]", "(account)");
const ADMIN_COMPONENTS_DIR = join(ROOT, "src", "components", "admin");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function resolveAdminModule(name: string): string | null {
  for (const extension of [".tsx", ".ts"]) {
    const path = join(ADMIN_COMPONENTS_DIR, `${name}${extension}`);
    if (existsSync(path)) return path;
  }
  return null;
}

function adminModulesUsedByAccount(): string[] {
  const queue = sourceFiles(ACCOUNT_DIR).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/from "@\/components\/admin\/([\w-]+)"/g)].map((match) => match[1]),
  );
  const seen = new Set<string>();
  while (queue.length > 0) {
    const name = queue.pop()!;
    const path = resolveAdminModule(name);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/from "(?:\.\/|@\/components\/admin\/)([\w-]+)"/g)) queue.push(match[1]);
  }
  return [...seen];
}

function keysUsedBy(file: string): string[] {
  const source = readFileSync(file, "utf8");
  if (!source.includes('useTranslations("admin")')) return [];
  return [...source.matchAll(/\bt\(\s*"([\w.]+)"/g)].map((match) => match[1]);
}

function resolve(messages: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>(
    (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
    messages,
  );
}

describe("kabinetdəki ortaq admin komponentlərinin mesajları", () => {
  const modules = adminModulesUsedByAccount();
  const keys = [...new Set(modules.flatMap(keysUsedBy))];

  it("kabinetin istifadə etdiyi admin komponentləri tapılır (test boş keçmir)", () => {
    expect(modules.some((file) => file.endsWith("image-dropzone.tsx"))).toBe(true);
    expect(keys).toContain("components.dropzone.altPlaceholder");
    expect(keys).toContain("actions.cancel");
  });

  for (const [locale, catalog] of [["az", az], ["en", en], ["ru", ru]] as const) {
    it(`«${locale}» alt-dəsti hər açarı string kimi saxlayır`, () => {
      const subset = pickSharedAdminMessages(catalog as typeof az);
      const missing = keys.filter((key) => typeof resolve(subset, key) !== "string");
      expect(missing).toEqual([]);
    });
  }
});
