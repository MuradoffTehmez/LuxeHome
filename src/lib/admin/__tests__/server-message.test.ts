import { describe, expect, it } from "vitest";
import az from "@/i18n/locales/az/admin.json";
import en from "@/i18n/locales/en/admin.json";
import ru from "@/i18n/locales/ru/admin.json";
import { SERVER_MESSAGE_PREFIX, msg, parseServerMessage } from "@/lib/admin/server-message";

describe("server mesaj markerləri (#89)", () => {
  it("açarı və parametrləri marker kimi kodlaşdırıb geri oxuyur", () => {
    expect(msg("server.common.unexpected")).toBe(`${SERVER_MESSAGE_PREFIX}server.common.unexpected`);
    expect(parseServerMessage(msg("server.emlaklar.elanYenilendi2", { p0: 5 }))).toEqual({
      key: "server.emlaklar.elanYenilendi2",
      values: { p0: 5 },
    });
    // «|» dəyərin içində ola bilər — yalnız ilk ayırıcı açarı bitirir.
    expect(parseServerMessage(msg("server.blog.kateqoriyasiSilindi", { p0: "a|b" }))?.values).toEqual({ p0: "a|b" });
  });

  it("adi mətni və boş dəyəri marker saymır", () => {
    expect(parseServerMessage("Parametrlər yadda saxlanıldı.")).toBeNull();
    expect(parseServerMessage(undefined)).toBeNull();
    expect(parseServerMessage("")).toBeNull();
  });

  it("server bölməsi üç dildə eyni açarlara malikdir və boş dəyər yoxdur", () => {
    const leaves = (node: unknown, prefix = ""): string[] =>
      node && typeof node === "object"
        ? Object.entries(node).flatMap(([key, value]) => leaves(value, `${prefix}${key}.`))
        : [`${prefix.slice(0, -1)}=${String(node).trim() ? "ok" : "empty"}`];
    const [azKeys, enKeys, ruKeys] = [az, en, ru].map((catalog) => leaves(catalog.server).sort());
    expect(enKeys).toEqual(azKeys);
    expect(ruKeys).toEqual(azKeys);
    expect(azKeys.some((entry) => entry.endsWith("=empty"))).toBe(false);
  });
});
