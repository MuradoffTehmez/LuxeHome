import { ABSOLUTE_LIFETIME_MS, SLIDING_LIFETIME_MS } from "@/lib/auth/session-policy";
import { PROPERTY_DOCUMENT_RETENTION_DAYS } from "@/lib/constants";
import { UNIQUE_VIEW_RETENTION_DAYS } from "@/lib/listing-stats";

/** Domen hadisələri (`DomainEvent`) — gündəlik baxım bundan köhnəsini silir. */
export const DOMAIN_EVENT_RETENTION_DAYS = 180;
/** Təhlükəsizlik hadisələri və giriş cəhdləri (#264, PRD 23.4). */
export const SECURITY_EVENT_RETENTION_DAYS = 180;
export const LOGIN_ATTEMPT_RETENTION_DAYS = 90;

export type RetentionItem = { key: string; value: number; unit: "hours" | "days" | "forever" };

/**
 * Məlumat saxlama siyasəti (PRD 23.4) — `/admin/tehlukesizlik` cədvəli və sənəd bu siyahıdan qurulur, rəqəmlər
 * baxım işinin işlətdiyi sabitlərin özüdür (ayrıca yazılmış «vəd» deyil).
 */
export const RETENTION_POLICY: RetentionItem[] = [
  { key: "sessionSliding", value: SLIDING_LIFETIME_MS / 3_600_000, unit: "hours" },
  { key: "sessionAbsolute", value: ABSOLUTE_LIFETIME_MS / 86_400_000, unit: "days" },
  { key: "loginAttempts", value: LOGIN_ATTEMPT_RETENTION_DAYS, unit: "days" },
  { key: "securityEvents", value: SECURITY_EVENT_RETENTION_DAYS, unit: "days" },
  { key: "domainEvents", value: DOMAIN_EVENT_RETENTION_DAYS, unit: "days" },
  { key: "uniqueViews", value: UNIQUE_VIEW_RETENTION_DAYS, unit: "days" },
  { key: "propertyDocuments", value: PROPERTY_DOCUMENT_RETENTION_DAYS, unit: "days" },
  { key: "auditLog", value: 0, unit: "forever" },
];
