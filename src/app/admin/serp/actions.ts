"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  LOCALES,
  PERMISSIONS,
  SEO_AUDIT_SEVERITIES,
  SEO_ENTITY_TYPES,
  SEO_INTENTS,
  SEO_LANDING_STATUSES,
  SEO_SETTING_KEYS,
  type Permission,
} from "@/lib/constants";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { failure, invalid, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import * as form from "@/lib/admin/form";
import { getSeoAuditItems } from "@/lib/queries";
import { findRedirectChain, normalizePublicPath } from "@/lib/serp";

const ROOT = "/admin/serp";
const locale = z.enum(Object.values(LOCALES) as [string, ...string[]]);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug kiçik latın hərfləri ilə yazılmalıdır").max(120);
const optional = (max = 500) => z.string().trim().max(max).nullable();

async function actor(permission: Permission = PERMISSIONS.SEO_EDIT) {
  try { return await requireAdminAction(permission); }
  catch (error) { if (error instanceof AdminGuardError) return null; throw error; }
}

function refresh(path = ROOT) {
  revalidatePath(path);
  revalidatePath("/sitemap.xml");
}

export async function saveGlobalSeoSettings(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_SETTINGS_MANAGE);
  if (!user) return failure("SEO parametrlərini dəyişmək səlahiyyətiniz yoxdur.");
  const schema = z.object({
    siteName: z.string().trim().min(2).max(120), titleTemplate: z.string().trim().min(3).max(120),
    defaultDescription: z.string().trim().min(40).max(300),
    canonicalHostname: z.string().trim().regex(/^[a-z0-9.-]+$/), defaultLocale: locale, xDefaultLocale: locale,
    defaultOgImage: z.string().trim().min(1).max(500),
    defaultRobotsIndex: z.boolean(), defaultRobotsFollow: z.boolean(),
    minLandingInventory: z.number().int().min(1).max(100), indexEmptyCategories: z.boolean(),
    minPropertyImages: z.number().int().min(1).max(20), expiredRetentionDays: z.number().int().min(1).max(3650),
  });
  const parsed = schema.safeParse({
    siteName: form.text(data, "siteName"), titleTemplate: form.text(data, "titleTemplate"),
    defaultDescription: form.text(data, "defaultDescription"), canonicalHostname: form.text(data, "canonicalHostname"),
    defaultLocale: form.text(data, "defaultLocale"), xDefaultLocale: form.text(data, "xDefaultLocale"),
    defaultOgImage: form.text(data, "defaultOgImage"), defaultRobotsIndex: form.boolean(data, "defaultRobotsIndex"),
    defaultRobotsFollow: form.boolean(data, "defaultRobotsFollow"), minLandingInventory: form.integer(data, "minLandingInventory") ?? 5,
    indexEmptyCategories: form.boolean(data, "indexEmptyCategories"), minPropertyImages: form.integer(data, "minPropertyImages") ?? 1,
    expiredRetentionDays: form.integer(data, "expiredRetentionDays") ?? 180,
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await prisma.setting.upsert({ where: { key: SEO_SETTING_KEYS.GLOBAL }, create: { key: SEO_SETTING_KEYS.GLOBAL, value: JSON.stringify(parsed.data) }, update: { value: JSON.stringify(parsed.data) } });
    await recordAudit(user, "UPDATE", "Setting", SEO_SETTING_KEYS.GLOBAL, "Qlobal SEO parametrləri", { newValue: parsed.data });
    refresh(`${ROOT}/parametrler`); return success("Qlobal SEO parametrləri saxlanıldı.");
  } catch (error) { return unexpected("SEO parametrləri saxlanmadı", error); }
}

export async function saveLocalSeoSettings(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_SETTINGS_MANAGE);
  if (!user) return failure("Local SEO parametrlərini dəyişmək səlahiyyətiniz yoxdur.");
  const parsed = z.object({
    businessName: z.string().trim().min(2).max(160), legalName: z.string().trim().min(2).max(160),
    address: z.string().trim().min(5).max(300), latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(),
    phone: z.string().trim().min(7).max(40), email: z.string().trim().email(), openingHours: z.array(z.string()), serviceAreas: z.array(z.string()),
    googleMapsUrl: optional(), googleBusinessProfileUrl: optional(), socialProfiles: z.array(z.string()),
  }).safeParse({
    businessName: form.text(data, "businessName"), legalName: form.text(data, "legalName"), address: form.text(data, "address"),
    latitude: form.number(data, "latitude"), longitude: form.number(data, "longitude"), phone: form.text(data, "phone"), email: form.text(data, "email"),
    openingHours: form.text(data, "openingHours").split("\n").map((v) => v.trim()).filter(Boolean),
    serviceAreas: form.text(data, "serviceAreas").split("\n").map((v) => v.trim()).filter(Boolean),
    googleMapsUrl: form.optionalText(data, "googleMapsUrl"), googleBusinessProfileUrl: form.optionalText(data, "googleBusinessProfileUrl"),
    socialProfiles: form.text(data, "socialProfiles").split("\n").map((v) => v.trim()).filter(Boolean),
  });
  if (!parsed.success) return invalid(parsed.error);
  try {
    await prisma.setting.upsert({ where: { key: SEO_SETTING_KEYS.LOCAL }, create: { key: SEO_SETTING_KEYS.LOCAL, value: JSON.stringify(parsed.data) }, update: { value: JSON.stringify(parsed.data) } });
    await recordAudit(user, "UPDATE", "Setting", SEO_SETTING_KEYS.LOCAL, "Local SEO / NAP parametrləri", { newValue: parsed.data });
    refresh(`${ROOT}/parametrler`); return success("Local SEO parametrləri saxlanıldı.");
  } catch (error) { return unexpected("Local SEO parametrləri saxlanmadı", error); }
}

export async function saveRobotsSettings(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_SETTINGS_MANAGE);
  if (!user) return failure("Robots siyasətini dəyişmək səlahiyyətiniz yoxdur.");
  const lines = (name: string) => form.text(data, name).split("\n").map((value) => normalizePublicPath(value)).filter(Boolean);
  const parsed = z.object({ allow: z.array(z.string()), disallow: z.array(z.string()), sitemap: z.string().trim().url() }).safeParse({
    allow: lines("allow"), disallow: lines("disallow"), sitemap: form.text(data, "sitemap"),
  });
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.disallow.includes("/")) return failure("Production saytını bütövlükdə bloklayan Disallow: / saxlanıla bilməz.");
  try {
    await prisma.setting.upsert({ where: { key: SEO_SETTING_KEYS.ROBOTS }, create: { key: SEO_SETTING_KEYS.ROBOTS, value: JSON.stringify(parsed.data) }, update: { value: JSON.stringify(parsed.data) } });
    await recordAudit(user, "UPDATE", "Setting", SEO_SETTING_KEYS.ROBOTS, "Robots siyasəti", { newValue: parsed.data });
    refresh(`${ROOT}/robots`);
    revalidatePath("/robots.txt");
    return success("Robots siyasəti saxlanıldı.");
  } catch (error) { return unexpected("robots siyasəti saxlanmadı", error); }
}

export async function saveSeoMetadata(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(); if (!user) return failure("SEO metadata redaktə səlahiyyətiniz yoxdur.");
  const parsed = z.object({ entityType: z.enum(Object.values(SEO_ENTITY_TYPES) as [string, ...string[]]), entityId: z.string().trim().min(1).max(180), locale,
    title: optional(70), description: optional(180), canonical: optional(500), robotsIndex: z.boolean(), robotsFollow: z.boolean(), ogTitle: optional(70), ogDescription: optional(200), ogImage: optional(500),
  }).safeParse({ entityType: form.text(data, "entityType"), entityId: form.text(data, "entityId"), locale: form.text(data, "locale"), title: form.optionalText(data, "title"), description: form.optionalText(data, "description"), canonical: form.optionalText(data, "canonical"), robotsIndex: form.boolean(data, "robotsIndex"), robotsFollow: form.boolean(data, "robotsFollow"), ogTitle: form.optionalText(data, "ogTitle"), ogDescription: form.optionalText(data, "ogDescription"), ogImage: form.optionalText(data, "ogImage") });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const result = await prisma.seoMetadata.upsert({ where: { entityType_entityId_locale: { entityType: parsed.data.entityType, entityId: parsed.data.entityId, locale: parsed.data.locale } }, create: { ...parsed.data, updatedBy: user.email }, update: { ...parsed.data, updatedBy: user.email }, select: { id: true } });
    await recordAudit(user, "UPDATE", "SeoMetadata", result.id, `${parsed.data.entityType}:${parsed.data.entityId}:${parsed.data.locale}`, { newValue: parsed.data });
    refresh(`${ROOT}/metadata`); return success("Metadata override saxlanıldı.");
  } catch (error) { return unexpected("metadata saxlanmadı", error); }
}

export async function deleteSeoMetadata(id: string): Promise<ActionState> {
  const user = await actor(); if (!user) return failure("SEO metadata silmək səlahiyyətiniz yoxdur.");
  try { const item = await prisma.seoMetadata.delete({ where: { id } }); await recordAudit(user, "DELETE", "SeoMetadata", id, `${item.entityType}:${item.entityId}`); refresh(`${ROOT}/metadata`); return success("Metadata override silindi."); }
  catch (error) { return unexpected("metadata silinmədi", error); }
}

export async function saveSeoLanding(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_PUBLISH); if (!user) return failure("SEO landing dərc etmək səlahiyyətiniz yoxdur.");
  const status = z.enum(Object.values(SEO_LANDING_STATUSES) as [string, ...string[]]);
  const jsonArray = z.string().trim().refine((v) => { try { return Array.isArray(JSON.parse(v)); } catch { return false; } }, "JSON massiv düzgün deyil");
  const parsed = z.object({ id: optional(80), locale, slug, name: z.string().trim().min(3).max(160), title: z.string().trim().min(20).max(70), h1: z.string().trim().min(5).max(160), description: z.string().trim().min(60).max(180), introContent: z.string().trim().min(120).max(12000), bottomContent: optional(12000), filtersJson: z.string().trim().refine((v) => { try { const p: unknown = JSON.parse(v); return Boolean(p && typeof p === "object" && !Array.isArray(p)); } catch { return false; } }, "Filter JSON düzgün deyil"), faqJson: jsonArray, relatedPathsJson: jsonArray, indexable: z.boolean(), indexEmpty: z.boolean(), minInventory: z.number().int().min(1).max(100), canonical: optional(500), status,
  }).safeParse({ id: form.optionalText(data, "id"), locale: form.text(data, "locale"), slug: form.text(data, "slug"), name: form.text(data, "name"), title: form.text(data, "title"), h1: form.text(data, "h1"), description: form.text(data, "description"), introContent: form.text(data, "introContent"), bottomContent: form.optionalText(data, "bottomContent"), filtersJson: form.text(data, "filtersJson"), faqJson: form.text(data, "faqJson") || "[]", relatedPathsJson: form.text(data, "relatedPathsJson") || "[]", indexable: form.boolean(data, "indexable"), indexEmpty: form.boolean(data, "indexEmpty"), minInventory: form.integer(data, "minInventory") ?? 5, canonical: form.optionalText(data, "canonical"), status: form.text(data, "status") });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const payload = { ...parsed.data, id: undefined, updatedBy: user.email, publishedAt: parsed.data.status === SEO_LANDING_STATUSES.PUBLISHED ? new Date() : null };
    const item = parsed.data.id ? await prisma.seoLandingPage.update({ where: { id: parsed.data.id }, data: payload }) : await prisma.seoLandingPage.create({ data: payload });
    await recordAudit(user, parsed.data.id ? "UPDATE" : "CREATE", "SeoLandingPage", item.id, `${item.locale}/${item.slug}`, { newValue: payload });
    refresh(`${ROOT}/landingler`); return success("SEO landing səhifəsi saxlanıldı.");
  } catch (error) { return unexpected("SEO landing saxlanmadı", error); }
}

export async function deleteSeoLanding(id: string): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_PUBLISH); if (!user) return failure("Landing silmək səlahiyyətiniz yoxdur.");
  try { const item = await prisma.seoLandingPage.delete({ where: { id } }); await recordAudit(user, "DELETE", "SeoLandingPage", id, item.slug); refresh(`${ROOT}/landingler`); return success("Landing silindi."); }
  catch (error) { return unexpected("landing silinmədi", error); }
}

export async function saveSeoKeyword(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(); if (!user) return failure("Keyword redaktə səlahiyyətiniz yoxdur.");
  const parsed = z.object({ keyword: z.string().trim().min(2).max(180), locale, intent: z.enum(Object.values(SEO_INTENTS) as [string, ...string[]]), cluster: z.string().trim().min(2).max(120), targetUrl: z.string().trim().startsWith("/").max(300), priority: z.number().int().min(1).max(5), searchVolume: z.number().int().min(0).nullable(), currentPosition: z.number().positive().nullable() }).safeParse({ keyword: form.text(data, "keyword"), locale: form.text(data, "locale"), intent: form.text(data, "intent"), cluster: form.text(data, "cluster"), targetUrl: normalizePublicPath(form.text(data, "targetUrl")), priority: form.integer(data, "priority") ?? 3, searchVolume: form.integer(data, "searchVolume"), currentPosition: form.number(data, "currentPosition") });
  if (!parsed.success) return invalid(parsed.error);
  try { const item = await prisma.seoKeyword.upsert({ where: { keyword_locale: { keyword: parsed.data.keyword, locale: parsed.data.locale } }, create: { ...parsed.data, measuredAt: parsed.data.currentPosition ? new Date() : null }, update: { ...parsed.data, measuredAt: parsed.data.currentPosition ? new Date() : null } }); await recordAudit(user, "UPDATE", "SeoKeyword", item.id, item.keyword); refresh(`${ROOT}/acar-sozler`); return success("Keyword saxlanıldı."); }
  catch (error) { return unexpected("keyword saxlanmadı", error); }
}

export async function deleteSeoKeyword(id: string): Promise<ActionState> { const user = await actor(); if (!user) return failure("Keyword silmək səlahiyyətiniz yoxdur."); try { const item = await prisma.seoKeyword.delete({ where: { id } }); await recordAudit(user, "DELETE", "SeoKeyword", id, item.keyword); refresh(`${ROOT}/acar-sozler`); return success("Keyword silindi."); } catch (error) { return unexpected("keyword silinmədi", error); } }

export async function saveEntityProfile(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_SCHEMA_MANAGE); if (!user) return failure("Entity/schema redaktə səlahiyyətiniz yoxdur.");
  const parsed = z.object({ entityType: z.string().trim().min(2).max(60), entityId: optional(100), locale, slug, name: z.string().trim().min(2).max(160), legalName: optional(160), description: optional(2000), schemaType: z.string().trim().min(2).max(80), dataJson: z.string().trim().refine((v) => { try { JSON.parse(v); return true; } catch { return false; } }, "JSON düzgün deyil"), isPublic: z.boolean() }).safeParse({ entityType: form.text(data, "entityType"), entityId: form.optionalText(data, "entityId"), locale: form.text(data, "locale"), slug: form.text(data, "slug"), name: form.text(data, "name"), legalName: form.optionalText(data, "legalName"), description: form.optionalText(data, "description"), schemaType: form.text(data, "schemaType"), dataJson: form.text(data, "dataJson") || "{}", isPublic: form.boolean(data, "isPublic") });
  if (!parsed.success) return invalid(parsed.error);
  try { const item = await prisma.entityProfile.upsert({ where: { entityType_slug_locale: { entityType: parsed.data.entityType, slug: parsed.data.slug, locale: parsed.data.locale } }, create: { ...parsed.data, updatedBy: user.email }, update: { ...parsed.data, updatedBy: user.email } }); await recordAudit(user, "UPDATE", "EntityProfile", item.id, `${item.entityType}:${item.name}`); refresh(`${ROOT}/entities`); return success("Entity profili saxlanıldı."); }
  catch (error) { return unexpected("entity profili saxlanmadı", error); }
}

export async function deleteEntityProfile(id: string): Promise<ActionState> { const user = await actor(PERMISSIONS.SEO_SCHEMA_MANAGE); if (!user) return failure("Entity silmək səlahiyyətiniz yoxdur."); try { const item = await prisma.entityProfile.delete({ where: { id } }); await recordAudit(user, "DELETE", "EntityProfile", id, item.name); refresh(`${ROOT}/entities`); return success("Entity silindi."); } catch (error) { return unexpected("entity silinmədi", error); } }

export async function runSeoAudit(_state: ActionState, _data: FormData): Promise<ActionState> {
  void _state;
  void _data;
  const user = await actor(PERMISSIONS.SEO_VIEW); if (!user) return failure("SEO audit səlahiyyətiniz yoxdur.");
  try {
    const [{ issues }, redirects] = await Promise.all([getSeoAuditItems(), prisma.redirect.findMany({ where: { isActive: true } })]);
    await prisma.seoAuditIssue.updateMany({ where: { status: "OPEN" }, data: { status: "RESOLVED", resolvedAt: new Date() } });
    for (const issue of issues) await prisma.seoAuditIssue.create({ data: { type: issue.code, severity: issue.severity === "error" ? SEO_AUDIT_SEVERITIES.HIGH : issue.severity === "warning" ? SEO_AUDIT_SEVERITIES.MEDIUM : SEO_AUDIT_SEVERITIES.INFO, url: issue.publicPath, entityType: issue.kind.toUpperCase(), entityId: issue.contentId, message: issue.message } });
    for (const rule of redirects) { const chain = findRedirectChain(rule.fromPath, rule.toPath, redirects); if (chain) await prisma.seoAuditIssue.create({ data: { type: "REDIRECT_CHAIN", severity: SEO_AUDIT_SEVERITIES.HIGH, url: rule.fromPath, entityType: "REDIRECT", entityId: rule.id, message: chain.join(" → ") } }); }
    const criticalCount = issues.filter((issue) => issue.severity === "error").length;
    if (criticalCount > 0) await prisma.seoAlert.create({ data: { type: "SEO_AUDIT_CRITICAL", severity: SEO_AUDIT_SEVERITIES.CRITICAL, message: `${criticalCount} kritik SEO audit problemi tapıldı.` } });
    await recordAudit(user, "UPDATE", "SeoAuditIssue", null, `SEO audit: ${issues.length} problem`); refresh(`${ROOT}/audit`); return success(`Audit tamamlandı: ${issues.length} cari problem.`);
  } catch (error) { return unexpected("SEO audit işləmədi", error); }
}

export async function resolveSeoAuditIssue(id: string): Promise<ActionState> { const user = await actor(PERMISSIONS.SEO_EDIT); if (!user) return failure("Audit qeydi həll etmək səlahiyyətiniz yoxdur."); try { await prisma.seoAuditIssue.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } }); await recordAudit(user, "UPDATE", "SeoAuditIssue", id, "Problem həll edildi"); refresh(`${ROOT}/audit`); return success("Audit qeydi həll edildi."); } catch (error) { return unexpected("audit qeydi yenilənmədi", error); } }

export async function importSearchMetric(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_EDIT); if (!user) return failure("Search Console məlumatı idxal etmək səlahiyyətiniz yoxdur.");
  const parsed = z.object({ date: z.coerce.date(), query: z.string().trim().max(500), page: z.string().trim().max(500), country: z.string().trim().max(12), device: z.string().trim().max(30), clicks: z.number().min(0), impressions: z.number().min(0), ctr: z.number().min(0).max(1), position: z.number().min(0) }).safeParse({ date: form.text(data, "date"), query: form.text(data, "query"), page: form.text(data, "page"), country: form.text(data, "country"), device: form.text(data, "device"), clicks: form.number(data, "clicks") ?? 0, impressions: form.number(data, "impressions") ?? 0, ctr: form.number(data, "ctr") ?? 0, position: form.number(data, "position") ?? 0 });
  if (!parsed.success) return invalid(parsed.error);
  try {
    const { date, query, page, country, device } = parsed.data;
    await prisma.seoSearchMetric.upsert({
      where: { date_query_page_country_device: { date, query, page, country, device } },
      create: parsed.data,
      update: parsed.data,
    });
    refresh(`${ROOT}/search-console`);
    return success("Search Console metrikası idxal edildi.");
  } catch (error) { return unexpected("metrika idxal edilmədi", error); }
}

export async function syncSearchConsole(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_EDIT); if (!user) return failure("Search Console sync səlahiyyətiniz yoxdur.");
  const token = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN;
  const site = process.env.GSC_SITE_URL || "sc-domain:luxehomeestate.az";
  if (!token) return failure("GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN secret-i konfiqurasiya edilməyib.");
  const endDate = form.text(data, "endDate") || new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  const startDate = form.text(data, "startDate") || new Date(Date.parse(endDate) - 27 * 86_400_000).toISOString().slice(0, 10);
  try {
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions: ["date", "query", "page", "country", "device"], rowLimit: 25000, dataState: "final" }),
    });
    if (!response.ok) return failure(`Search Console API ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const payload = await response.json() as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> };
    let imported = 0;
    for (const row of payload.rows ?? []) {
      const [date, query = "", page = "", country = "", device = ""] = row.keys ?? [];
      if (!date) continue;
      const record = { date: new Date(`${date}T00:00:00.000Z`), query, page, country, device, clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 };
      await prisma.seoSearchMetric.upsert({ where: { date_query_page_country_device: { date: record.date, query, page, country, device } }, create: record, update: record });
      imported += 1;
    }
    await recordAudit(user, "UPDATE", "SeoSearchMetric", null, `GSC sync ${startDate}–${endDate}: ${imported} sətir`);
    refresh(`${ROOT}/search-console`); return success(`Search Console sinxronlaşdırıldı: ${imported} sətir.`);
  } catch (error) { return unexpected("Search Console sinxronlaşdırılmadı", error); }
}

export async function submitSitemapToSearchConsole(_state: ActionState, data: FormData): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_PUBLISH); if (!user) return failure("Sitemap göndərmək səlahiyyətiniz yoxdur.");
  const token = process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN;
  const site = process.env.GSC_SITE_URL || "sc-domain:luxehomeestate.az";
  const sitemap = form.text(data, "sitemap");
  if (!token) return failure("GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN secret-i konfiqurasiya edilməyib.");
  try {
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemap)}`, { method: "PUT", headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) return failure(`Search Console sitemap API ${response.status}: ${(await response.text()).slice(0, 300)}`);
    await recordAudit(user, "PUBLISH", "Setting", SEO_SETTING_KEYS.SEARCH_CONSOLE, `Sitemap göndərildi: ${sitemap}`);
    return success("Sitemap Google Search Console-a göndərildi.");
  } catch (error) { return unexpected("sitemap göndərilmədi", error); }
}

export async function resolveSeoAlert(id: string): Promise<ActionState> {
  const user = await actor(PERMISSIONS.SEO_EDIT); if (!user) return failure("Xəbərdarlığı həll etmək səlahiyyətiniz yoxdur.");
  try { await prisma.seoAlert.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() } }); refresh(`${ROOT}/monitorinq`); return success("Xəbərdarlıq həll edildi."); }
  catch (error) { return unexpected("xəbərdarlıq yenilənmədi", error); }
}
