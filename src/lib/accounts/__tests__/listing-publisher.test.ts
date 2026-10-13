import { describe, expect, it } from "vitest";
import {
  listingPublisherBadge,
  maskPhone,
  phoneHref,
  publisherWhatsappHref,
  resolveListingPublisher,
  type PublisherContactSource,
} from "../listing-publisher";

const agency = { name: "Kapital Əmlak", slug: "kapital-emlak", logoUrl: "/media/avatarlar/k.webp", isVerified: true, phone: "+994124445566" };

function author(overrides: Partial<NonNullable<PublisherContactSource>> = {}): NonNullable<PublisherContactSource> {
  return {
    accountType: "OWNER",
    name: "Aysel Məmmədova",
    phone: "+994501234567",
    email: "aysel@example.az",
    companyName: null,
    agency: null,
    agencyEmployments: [],
    ...overrides,
  };
}

describe("elanı yerləşdirən", () => {
  it("müəllif yoxdursa və ya əməkdaşdırsa şirkət əlaqəsi qalır", () => {
    expect(resolveListingPublisher(null)).toEqual({ kind: "company" });
    expect(resolveListingPublisher(author({ accountType: "STAFF" }))).toEqual({ kind: "company" });
    expect(listingPublisherBadge(undefined)).toEqual({ kind: "company", agency: null });
  });

  it("mülk sahibinin öz adını, nömrəsini və e-poçtunu göstərir", () => {
    expect(resolveListingPublisher(author())).toMatchObject({
      kind: "owner",
      displayName: "Aysel Məmmədova",
      contactName: "Aysel Məmmədova",
      phone: "+994501234567",
      email: "aysel@example.az",
      agency: null,
    });
  });

  it("agentlik elanında agentliyin adı və ofis nömrəsi göstərilir", () => {
    const publisher = resolveListingPublisher(author({ accountType: "AGENCY", name: "Rauf Əliyev", agency }));
    expect(publisher).toMatchObject({
      kind: "agency",
      displayName: "Kapital Əmlak",
      contactName: "Rauf Əliyev",
      phone: "+994124445566",
      agency: { name: "Kapital Əmlak", slug: "kapital-emlak", isVerified: true },
    });
  });

  it("agentliyin təsdiqlənmiş əməkdaşı öz nömrəsi ilə, agentlik adı altında görünür", () => {
    const publisher = resolveListingPublisher(author({ accountType: "OWNER", agencyEmployments: [{ agency }] }));
    expect(publisher).toMatchObject({ kind: "agent", phone: "+994501234567", agency: { name: "Kapital Əmlak" } });
    expect(listingPublisherBadge({ accountType: "AGENT", agency: null, agencyEmployments: [{ agency }] })).toMatchObject({
      kind: "agent",
      agency: { slug: "kapital-emlak" },
    });
  });

  it("korporativ hesabda şirkət adı göstərilir", () => {
    expect(resolveListingPublisher(author({ accountType: "CORPORATE", companyName: "Bina Developer" }))).toMatchObject({
      kind: "corporate",
      displayName: "Bina Developer",
    });
  });
});

describe("əlaqə linkləri", () => {
  it("nömrəni maskalayır — tam nömrə HTML-ə düşmür", () => {
    expect(maskPhone("050 123 45 67")).toBe("+994 50 123 •• ••");
    expect(maskPhone("+994124445566")).toBe("+99412444••••");
  });

  it("WhatsApp yalnız mobil nömrə üçün qurulur", () => {
    expect(publisherWhatsappHref("050 123 45 67", "Salam")).toBe("https://wa.me/994501234567?text=Salam");
    expect(publisherWhatsappHref("+994124445566")).toBeNull();
    expect(publisherWhatsappHref(null)).toBeNull();
  });

  it("tel: linkindən boşluq və mötərizələri atır", () => {
    expect(phoneHref("+994 (50) 123-45-67")).toBe("tel:+994501234567");
  });
});
