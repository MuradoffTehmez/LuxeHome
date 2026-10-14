import { describe, expect, it } from "vitest";
import { agencyCompleteness, agentCompleteness, MIN_ABOUT_LENGTH } from "../profile-completeness";

const emptyAgency = {
  logoUrl: null,
  coverUrl: null,
  description: null,
  phone: null,
  whatsapp: null,
  address: null,
  workingHours: null,
  email: null,
  website: null,
  instagram: null,
  taxId: null,
};

describe("profil tamlığı (#157)", () => {
  it("boş agentlik 0%, ən ağır çatışmayan bənd birincidir", () => {
    const result = agencyCompleteness(emptyAgency);
    expect(result.percent).toBe(0);
    expect(result.items.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(result.missing[0].weight).toBe(15);
  });

  it("tam agentlik 100%", () => {
    const result = agencyCompleteness({
      logoUrl: "/media/avatarlar/a.webp",
      coverUrl: "/media/avatarlar/b.webp",
      description: "x".repeat(MIN_ABOUT_LENGTH),
      phone: "+994 50 123 45 67",
      whatsapp: "+994501234567",
      address: "Bakı, Nizami küç. 10",
      workingHours: "10:00-19:00",
      email: "ofis@example.az",
      website: null,
      instagram: "agentlik",
      taxId: "1700767721",
    });
    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("qısa təsvir və telefon yerində e-poçt doldurulmuş sayılmır", () => {
    const result = agencyCompleteness({ ...emptyAgency, description: "Qısa", phone: "ofis@example.az", logoUrl: "/media/x.webp" });
    expect(result.percent).toBe(15);
    expect(result.missing.map((item) => item.key)).toContain("description");
    expect(result.missing.map((item) => item.key)).toContain("phone");
  });

  it("agent: bio və şəkil ən vacibdir, təcrübə 0 il də doldurulmuş sayılır", () => {
    const base = { avatarUrl: null, phone: null, roleTitle: null, specialization: null, experienceYears: null, bio: null };
    expect(agentCompleteness(base).missing[0].key).toBe("bio");
    expect(agentCompleteness({ ...base, experienceYears: 0 }).percent).toBe(10);
    expect(agentCompleteness({
      avatarUrl: "/media/avatarlar/a.webp",
      phone: "+994 55 000 00 00",
      roleTitle: "Baş agent",
      specialization: "Yeni tikili",
      experienceYears: 5,
      bio: "y".repeat(MIN_ABOUT_LENGTH),
    }).percent).toBe(100);
  });
});
