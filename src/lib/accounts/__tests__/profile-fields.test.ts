import { describe, expect, it } from "vitest";
import { composeName, normalizeTaxId, parseBirthDate, profileRequirements, splitName } from "../profile-fields";

describe("profil sahələri", () => {
  it("ad və soyaddan göstəriş adı, köhnə addan ad/soyad", () => {
    expect(composeName(" Aysel ", " Məmmədova ")).toBe("Aysel Məmmədova");
    expect(splitName("Əli Rza Həsənov")).toEqual({ firstName: "Əli Rza", lastName: "Həsənov" });
    expect(splitName("Orxan")).toEqual({ firstName: "Orxan", lastName: "" });
  });

  it("doğum tarixi istəyə bağlıdır, 18 yaş və düzgün tarix yoxlanılır", () => {
    const now = new Date("2026-09-27T12:00:00Z");
    expect(parseBirthDate("", now)).toEqual({ ok: true, value: null });
    expect(parseBirthDate("1990-02-30", now)).toEqual({ ok: false, reason: "invalid" });
    expect(parseBirthDate("2010-01-01", now)).toEqual({ ok: false, reason: "underage" });
    expect(parseBirthDate("2008-09-27", now).ok).toBe(true);
    expect(parseBirthDate("2008-09-28", now)).toEqual({ ok: false, reason: "underage" });
  });

  it("VÖEN 10 rəqəmdir, boş dəyər qəbul olunur", () => {
    expect(normalizeTaxId("1234 567 890")).toBe("1234567890");
    expect(normalizeTaxId("")).toBeNull();
    expect(normalizeTaxId("12345")).toBe(false);
  });

  it("hesab növünə görə tələb olunan bölmələr", () => {
    expect(profileRequirements("USER")).toEqual({ phoneRequired: false, company: false, agent: false });
    expect(profileRequirements("AGENT")).toEqual({ phoneRequired: true, company: false, agent: true });
    expect(profileRequirements("CORPORATE").company).toBe(true);
    expect(profileRequirements("AGENCY").company).toBe(true);
  });
});
