import {
  KNOWLEDGE_AUDIENCES,
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_RISK_LEVELS,
  KNOWLEDGE_STATUSES,
  LEGAL_CONTENT_STATUSES,
} from "@/lib/constants";
import type { DropzoneImage } from "@/components/admin/image-dropzone";

/**
 * Forma dəyərləri client modulundan kənardadır.
 *
 * Server Component `"use client"` faylından adi dəyər idxal edə bilmir — bundler
 * onu client-referens ilə əvəz edir və bütün sahələr `undefined` olur.
 */

export type KnowledgeArticleFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  audience: string;
  level: string;
  status: string;
  isFeatured: boolean;
  legalStatus: string;
  riskLevel: string;
  jurisdiction: string;
  legalReviewedAt: string;
  legalActs: string;
  sourceUrls: string;
  legalBasis: string;
  requiredDocuments: string;
  procedure: string;
  duration: string;
  costs: string;
  risks: string;
  checklist: string;
  template: string;
  courtPosition: string;
  metaTitle: string;
  metaDescription: string;
  noIndex: boolean;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  cover: DropzoneImage[];
};

export const EMPTY_KNOWLEDGE_ARTICLE: KnowledgeArticleFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  categoryId: "",
  audience: KNOWLEDGE_AUDIENCES.BUYER,
  level: KNOWLEDGE_LEVELS.BEGINNER,
  status: KNOWLEDGE_STATUSES.DRAFT,
  isFeatured: false,
  legalStatus: LEGAL_CONTENT_STATUSES.CURRENT,
  riskLevel: KNOWLEDGE_RISK_LEVELS.YELLOW,
  jurisdiction: "Azərbaycan Respublikası",
  legalReviewedAt: "",
  legalActs: "",
  sourceUrls: "",
  legalBasis: "",
  requiredDocuments: "",
  procedure: "",
  duration: "",
  costs: "",
  risks: "",
  checklist: "",
  template: "",
  courtPosition: "",
  metaTitle: "",
  metaDescription: "",
  noIndex: false,
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  cover: [],
};

export type KnowledgeCategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
};

export const EMPTY_KNOWLEDGE_CATEGORY: KnowledgeCategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  order: 0,
  isActive: true,
};

export type KnowledgeTermFormValues = {
  id?: string;
  term: string;
  slug: string;
  shortDefinition: string;
  definition: string;
  categoryId: string;
  status: string;
  order: number;
  relatedSlugs: string;
};

export const EMPTY_KNOWLEDGE_TERM: KnowledgeTermFormValues = {
  term: "",
  slug: "",
  shortDefinition: "",
  definition: "",
  categoryId: "",
  status: KNOWLEDGE_STATUSES.DRAFT,
  order: 0,
  relatedSlugs: "",
};

export type FaqFormValues = {
  id?: string;
  question: string;
  answer: string;
  category: string;
  status: string;
  order: number;
};

export const EMPTY_FAQ: FaqFormValues = {
  question: "",
  answer: "",
  category: "PLATFORM",
  status: KNOWLEDGE_STATUSES.DRAFT,
  order: 0,
};
