/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import {
  ACCOUNT_CLIENT_MESSAGE_PATHS,
  PUBLIC_CLIENT_MESSAGE_PATHS,
  pickMessages,
} from "../client-messages";
import { MESSAGE_NAMESPACES } from "../config";

/**
 * Klientə gedən mesaj siyahısı mənbə ilə üst-üstə düşməlidir (#183).
 *
 * Kök provider artıq bütün kataloqu deyil, yalnız siyahıdakı yolları göndərir. Client
 * komponenti siyahıda olmayan açar oxusa, ekranda açar adı görünərdi — bu test
 * `useTranslations("…")` çağırışlarını mənbədən toplayır və hər açarın aid olduğu ağacın
 * siyahısı ilə örtüldüyünü yoxlayır.
 */

const sources = import.meta.glob(["../../**/*.{ts,tsx}", "!../../**/__tests__/**", "!../../**/*.test.{ts,tsx}"], {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const catalogs = import.meta.glob("../locales/az/*.json", { eager: true, import: "default" }) as Record<string, unknown>;
const azMessages = Object.fromEntries(
  Object.entries(catalogs).map(([path, value]) => [path.replace(/^.*\/|\.json$/g, ""), value]),
) as Record<string, unknown>;

/** Panel öz provider-i ilə tam kataloq alır — bu qayda ona aid deyil. */
const isAdmin = (path: string) => path.includes("/app/admin/") || path.includes("/components/admin/");
/** Hesab ağacları kök siyahının üzərinə hesab siyahısını da alır. */
const isAccountTree = (path: string) => /\/app\/\[locale\]\/(\(account\)|giris)\//.test(path);

function covered(key: string, paths: readonly string[]) {
  return paths.some((path) => key === path || key.startsWith(`${path}.`));
}

type Usage = { file: string; key: string };

/** `const t = useTranslations("ns")` → ya bütün namespace, ya da `t("açar")` çağırışları. */
function usages(file: string, source: string, paths: readonly string[]): { needed: Usage[]; problems: string[] } {
  const needed: Usage[] = [];
  const problems: string[] = [];
  for (const match of source.matchAll(/useTranslations\(([^)]*)\)/g)) {
    const argument = match[1].trim();
    if (!/^"[^"]+"$/.test(argument)) problems.push(`${file}: useTranslations(${argument}) — yalnız sətir literalı yoxlana bilir`);
  }
  for (const match of source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*useTranslations\("([^"]+)"\)/g)) {
    const [, name, namespace] = match;
    if (covered(namespace, paths)) continue;
    // Namespace tam göndərilmir — hər çağırılan açar ayrıca örtülməlidir.
    const calls = [...source.matchAll(new RegExp(`\\b${name}(?:\\.(?:rich|raw|markup|has))?\\(\\s*([^,)\\s]+)`, "g"))];
    for (const call of calls) {
      const literal = /^"([^"]+)"$/.exec(call[1]);
      if (!literal) problems.push(`${file}: ${name}(${call[1]}) dinamik açardır — "${namespace}" bütöv siyahıda olmalıdır`);
      else needed.push({ file, key: `${namespace}.${literal[1]}` });
    }
  }
  return { needed, problems };
}

describe("klientə gedən mesajlar (#183)", () => {
  const files = Object.entries(sources).filter(([path]) => !isAdmin(path) && /useTranslations\(/.test(sources[path]));

  it("mənbədə useTranslations çağıran fayllar tapılır", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("hər client açarı aid olduğu ağacın siyahısı ilə örtülür", () => {
    const missing: string[] = [];
    for (const [file, source] of files) {
      const paths = isAccountTree(file) ? [...PUBLIC_CLIENT_MESSAGE_PATHS, ...ACCOUNT_CLIENT_MESSAGE_PATHS] : PUBLIC_CLIENT_MESSAGE_PATHS;
      const { needed, problems } = usages(file, source, paths);
      missing.push(...problems);
      for (const usage of needed) if (!covered(usage.key, paths)) missing.push(`${usage.file}: ${usage.key}`);
    }
    expect(missing).toEqual([]);
  });

  it("siyahıdakı hər yol kataloqda mövcuddur", () => {
    for (const path of [...PUBLIC_CLIENT_MESSAGE_PATHS, ...ACCOUNT_CLIENT_MESSAGE_PATHS]) {
      expect(Object.keys(pickMessages(azMessages, [path])), path).not.toHaveLength(0);
      expect(MESSAGE_NAMESPACES as readonly string[]).toContain(path.split(".")[0]);
    }
  });

  it("ictimai səhifəyə hesab kataloqu getmir, ölçü əhəmiyyətli dərəcədə kiçilir", () => {
    const publicMessages = pickMessages(azMessages, PUBLIC_CLIENT_MESSAGE_PATHS);
    expect(publicMessages.account).toBeUndefined();
    expect(Object.keys(publicMessages.auth as object).sort()).toEqual(
      ["adminPanel", "login", "myAccount", "notifications", "notificationsUnread", "register"],
    );
    const full = JSON.stringify(pickMessages(azMessages, MESSAGE_NAMESPACES)).length;
    expect(JSON.stringify(publicMessages).length).toBeLessThan(full * 0.6);
  });

  it("pickMessages iç-içə formanı saxlayır və olmayan yolu atır", () => {
    const messages = { a: { b: { c: "1", d: "2" }, e: "3" }, f: "4" };
    expect(pickMessages(messages, ["a.b.c", "f", "yoxdur.x"])).toEqual({ a: { b: { c: "1" } }, f: "4" });
    expect(pickMessages(messages, ["a.b", "a.e"])).toEqual({ a: { b: { c: "1", d: "2" }, e: "3" } });
  });
});
