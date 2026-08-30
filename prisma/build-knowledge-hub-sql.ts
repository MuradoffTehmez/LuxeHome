/**
 * `docs/Real Estate Knowledge Hub/Real Estate Knowledge Hub.md` sənədindəki
 * strukturlaşdırılmış «Mövzu — ...» bölmələrini idempotent D1 SQL-ə çevirir.
 *
 * Hüquqi məzmun qəsdən `DRAFT` yaradılır: sənəddə cari norma ilə tarixi rəqəm,
 * təklif və analitik müşahidələr birlikdədir. Redaktor paneldə rəsmi URL-ləri,
 * `legalStatus` və `legalReviewedAt` sahələrini tamamlamadan mətn ictimai sayta
 * çıxmamalıdır.
 *
 * İstifadə:
 *   npm run db:knowledge:build
 *   wrangler d1 execute DB --local --file=prisma/knowledge-hub.sql
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourcePath = join(root, "docs", "Real Estate Knowledge Hub", "Real Estate Knowledge Hub.md");
const outputPath = join(root, "prisma", "knowledge-hub.sql");

const CATEGORY_BY_TITLE: Array<[RegExp, string]> = [
  [/alqı-satqı/i, "alqi-satqi"],
  [/kirayə/i, "kiraye"],
  [/miras|vərəsə/i, "vereselik"],
  [/ipoteka|kredit/i, "ipoteka-maliyye"],
  [/notariat|qeydiyyat/i, "qeydiyyat-notariat"],
  [/vergi|rüsum|xərc/i, "vergi-rusum"],
  [/tikinti|yeni tikili/i, "yeni-tikili"],
  [/torpaq/i, "torpaq"],
  [/məhkəmə/i, "mehkemeler"],
  [/agent|broker/i, "agentlik-brokerlik"],
];

const CATEGORIES = [
  ["alqi-satqi", "Alqı-satqı", "Home"],
  ["kiraye", "Kirayə", "KeyRound"],
  ["vereselik", "Vərəsəlik", "ScrollText"],
  ["ipoteka-maliyye", "İpoteka və maliyyə", "Landmark"],
  ["qeydiyyat-notariat", "Qeydiyyat və notariat", "FileCheck2"],
  ["vergi-rusum", "Vergi və rüsumlar", "ReceiptText"],
  ["yeni-tikili", "Tikinti və yeni tikililər", "Building2"],
  ["torpaq", "Torpaq hüququ", "Map"],
  ["mehkemeler", "Məhkəmə təcrübəsi", "Scale"],
  ["agentlik-brokerlik", "Agentlik və brokerlik", "Handshake"],
] as const;

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("az-AZ")
    .replace(/[ə]/g, "e").replace(/[ı]/g, "i").replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u").replace(/[ş]/g, "s").replace(/[ç]/g, "c").replace(/[ğ]/g, "g")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toHtml(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

type Section = { title: string; lines: string[] };

function sectionsFromDocument(raw: string): Section[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const starts = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.startsWith("Mövzu — "));

  return starts.map(({ line, index }, position) => ({
    title: line.slice("Mövzu — ".length).trim(),
    lines: lines.slice(index + 1, starts[position + 1]?.index ?? lines.length),
  }));
}

const raw = readFileSync(sourcePath, "utf8");
const sections = sectionsFromDocument(raw);
if (sections.length < 8) {
  throw new Error(`Sənəddə gözlənilən mövzular tapılmadı (tapıldı: ${sections.length}).`);
}

const now = "CURRENT_TIMESTAMP";
const sql: string[] = [
  "-- Avtomatik yaradılıb: npm run db:knowledge:build",
  "-- Hüquqi yoxlama tamamlanana qədər bütün bələdçilər DRAFT-dır.",
  "PRAGMA foreign_keys = ON;",
  "",
];

for (const [order, [slug, name, icon]] of CATEGORIES.entries()) {
  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES (` +
      `${quote(`knowledge_category_${slug}`)},${quote(slug)},${quote(name)},${quote(slug.replace(/-/g, " "))},` +
      `${quote(`${name} üzrə hüquqi və praktiki bələdçilər.`)},${quote(icon)},${order * 10},1,${now},${now});`,
  );
}

for (const section of sections) {
  const slug = slugify(section.title);
  const categorySlug = CATEGORY_BY_TITLE.find(([pattern]) => pattern.test(section.title))?.[1] ?? "alqi-satqi";
  const nonEmpty = section.lines.map((line) => line.trim()).filter(Boolean);
  const executive = nonEmpty.find((line) => line.startsWith("İcra xülasəsi."));
  const excerpt = (executive ?? nonEmpty[0] ?? section.title).replace(/^İcra xülasəsi\.\s*/, "").slice(0, 390);
  const sourceIndex = nonEmpty.findIndex((line) => line.startsWith("Prioritet rəsmi mənbələr:"));
  const bodyLines = sourceIndex >= 0 ? nonEmpty.slice(0, sourceIndex) : nonEmpty;
  const sourceLines = sourceIndex >= 0 ? nonEmpty.slice(sourceIndex) : [];
  const id = `knowledge_article_${slug}`;

  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeArticle" (` +
      `"id","slug","title","searchText","excerpt","content","categoryId","audience","level","status",` +
      `"legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt"` +
      `) VALUES (` +
      `${quote(id)},${quote(slug)},${quote(section.title)},${quote(`${section.title} ${excerpt}`.toLocaleLowerCase("az-AZ"))},` +
      `${quote(excerpt)},${quote(toHtml(bodyLines))},` +
      `(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"=${quote(categorySlug)}),` +
      `${quote("BUYER")},${quote("INTERMEDIATE")},${quote("DRAFT")},${quote("MIXED")},${quote("YELLOW")},` +
      `${quote("Azərbaycan Respublikası")},${sourceLines.length ? quote(JSON.stringify(sourceLines)) : "NULL"},` +
      `${executive ? quote(`<p>${escapeHtml(executive)}</p>`) : "NULL"},0,` +
      `${Math.max(1, Math.round(bodyLines.join(" ").split(/\s+/).length / 200))},${now},${now});`,
  );
}

writeFileSync(outputPath, `${sql.join("\n")}\n`, "utf8");
console.log(`✓ ${sections.length} bələdçi və ${CATEGORIES.length} mövzu → ${outputPath}`);
