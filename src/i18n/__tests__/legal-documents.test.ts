import { describe, expect, it } from "vitest";
import { corporateEmails, siteConfig } from "@/config/site";
import { LEGAL_ANCHORS, getLegalDocuments } from "../legal";

const locales = ["az", "en", "ru"] as const;
const keys = ["privacy", "terms", "cookies"] as const;

describe("hüquqi sənədlər", () => {
  it("EN və RU tərcüməsi AZ mətni ilə eyni struktura malikdir", () => {
    const az = getLegalDocuments("az");
    for (const locale of ["en", "ru"] as const) {
      const translated = getLegalDocuments(locale);
      for (const key of keys) {
        const shape = (doc: typeof az.privacy) =>
          doc.sections.map((section) => ({
            id: section.id,
            level: section.level ?? 2,
            intro: Boolean(section.intro),
            bullets: section.bullets?.length ?? 0,
            columns: section.table?.columns.length ?? 0,
            rows: section.table?.rows.length ?? 0,
            paragraphs: section.paragraphs?.length ?? 0,
          }));
        expect(shape(translated[key]), `${locale}.${key}`).toEqual(shape(az[key]));
      }
    }
  });

  it("lövbərlər (Meta məlumat silmə təlimatı, razılıq) hər dildə var", () => {
    for (const locale of locales) {
      const docs = getLegalDocuments(locale);
      const privacyIds = docs.privacy.sections.map((section) => section.id);
      expect(privacyIds).toContain(LEGAL_ANCHORS.dataDeletion);
      expect(privacyIds).toContain(LEGAL_ANCHORS.rights);
      expect(docs.cookies.sections.map((section) => section.id)).toContain(LEGAL_ANCHORS.consent);
    }
  });

  it("şirkət rekvizitləri siteConfig-dən gəlir", () => {
    for (const locale of locales) {
      const text = JSON.stringify(getLegalDocuments(locale));
      expect(text).toContain(siteConfig.legalName);
      expect(text).toContain(siteConfig.legal.voen);
      expect(text).toContain(siteConfig.addressFull);
      expect(text).toContain(corporateEmails.security);
      expect(text).not.toContain("${");
    }
  });
});
