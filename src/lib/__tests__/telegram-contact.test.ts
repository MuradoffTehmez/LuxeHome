import { describe, expect, it } from "vitest";
import { normalizeTelegramUsername, telegramHref } from "@/lib/accounts/telegram";
import { resolveListingPublisher } from "@/lib/accounts/listing-publisher";

describe("normalizeTelegramUsername (#208)", () => {
  it("@ad, t.me linki və tam URL eyni istifadəçi adına gəlir", () => {
    for (const input of ["@luxe_home", "luxe_home", "t.me/luxe_home", "https://t.me/luxe_home", "https://telegram.me/luxe_home/", "  @luxe_home  "]) {
      expect(normalizeTelegramUsername(input)).toBe("luxe_home");
    }
  });

  it("boş dəyər null, etibarsız dəyər undefined qaytarır", () => {
    expect(normalizeTelegramUsername("")).toBeNull();
    expect(normalizeTelegramUsername("   ")).toBeNull();
    expect(normalizeTelegramUsername(null)).toBeNull();
    expect(normalizeTelegramUsername("abc")).toBeUndefined(); // 5 simvoldan qısa
    expect(normalizeTelegramUsername("1luxe")).toBeUndefined(); // rəqəmlə başlayır
    expect(normalizeTelegramUsername("luxe_")).toBeUndefined(); // «_» ilə bitir
    expect(normalizeTelegramUsername("+994501234567")).toBeUndefined(); // nömrə qəbul edilmir
    expect(normalizeTelegramUsername("lüxe_home")).toBeUndefined();
  });

  it("telegramHref yalnız etibarlı addan link qurur", () => {
    expect(telegramHref("@luxe_home")).toBe("https://t.me/luxe_home");
    expect(telegramHref("bad")).toBeNull();
    expect(telegramHref(null)).toBeNull();
  });
});

describe("resolveListingPublisher telegram", () => {
  const base = {
    name: "Aysel Məmmədova",
    phone: "+994501234567",
    email: "aysel@example.com",
    isActive: true,
    accountType: "OWNER",
    companyName: null,
    agency: null,
    agencyEmployments: [],
  };

  it("hesabın Telegram adı normallaşdırılıb qaytarılır", () => {
    const publisher = resolveListingPublisher({ ...base, telegram: "https://t.me/aysel_m" });
    expect(publisher).toMatchObject({ kind: "owner", telegram: "aysel_m" });
  });

  it("etibarsız bazadakı dəyər göstərilmir", () => {
    const publisher = resolveListingPublisher({ ...base, telegram: "x" });
    expect(publisher).toMatchObject({ telegram: null });
  });
});
