import { corporateEmails, siteConfig } from "@/config/site";
import type { Locale } from "@/lib/constants";
import { azLegalDocuments } from "./az";
import { enLegalDocuments } from "./en";
import { ruLegalDocuments } from "./ru";
import type { LegalDocuments, LegalFacts } from "./types";

export { LEGAL_ANCHORS } from "./types";
export type { LegalDocument } from "./types";

/**
 * Məxfilik siyasəti, İstifadə şərtləri və Cookie siyasəti. Əsas mətn azərbaycancadır (sahib tərəfindən təsdiqlənib,
 * 20.10.2026); EN/RU onun tərcüməsidir və ziddiyyətdə AZ mətni üstündür. Bir dildə bölmə əlavə edəndə qalan ikisinə də yaz.
 */
const BUILDERS: Record<Locale, (facts: LegalFacts) => LegalDocuments> = {
  az: azLegalDocuments,
  en: enLegalDocuments,
  ru: ruLegalDocuments,
};

function legalFacts(): LegalFacts {
  return {
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    ownerName: siteConfig.owner.name,
    voen: siteConfig.legal.voen,
    address: siteConfig.addressFull,
    email: siteConfig.email,
    securityEmail: corporateEmails.security,
    supportEmail: corporateEmails.support,
    financeEmail: corporateEmails.finance,
    phone: siteConfig.phone,
  };
}

export function getLegalDocuments(locale: Locale): LegalDocuments {
  return BUILDERS[locale](legalFacts());
}
