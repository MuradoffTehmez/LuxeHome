export type LegalKey = "privacy" | "terms" | "cookies";

export type LegalTable = {
  columns: string[];
  rows: string[][];
  /** Birinci sütun texniki addır (cookie, yaddaş açarı) — `<code>` ilə göstərilir. */
  codeFirstColumn?: boolean;
};

export type LegalSection = {
  /** Lövbər keçidi üçün sabit id (dildən asılı deyil), məs. Meta-nın məlumat silmə təlimatı ünvanı. */
  id?: string;
  heading: string;
  /** 3 — alt bölmə (h3). Defolt h2. */
  level?: 2 | 3;
  /** Siyahı və cədvəldən əvvəlki abzas. */
  intro?: string;
  bullets?: { label?: string; text: string }[];
  table?: LegalTable;
  paragraphs?: string[];
};

export type LegalDocument = {
  title: string;
  metaDescription: string;
  description: string;
  updatedAt: string;
  introduction: string;
  sections: LegalSection[];
};

/** Mətnə yerləşdirilən şirkət məlumatları — hamısı `siteConfig`-dən gəlir. */
export type LegalFacts = {
  name: string;
  legalName: string;
  ownerName: string;
  voen: string;
  address: string;
  email: string;
  securityEmail: string;
  supportEmail: string;
  financeEmail: string;
  phone: string;
};

export type LegalDocuments = Record<LegalKey, LegalDocument>;

/** Lövbərlər — səhifə və kənar keçidlər (Meta «Data Deletion Instructions URL») bunlara istinad edir. */
export const LEGAL_ANCHORS = {
  dataDeletion: "hesabin-silinmesi",
  rights: "huquqlariniz",
  consent: "razilig",
} as const;
