/**
 * Bilik Mərkəzi bələdçilərini, lüğət terminlərini və bloq yazılarını
 * (`prisma/knowledge-guides/`) özü-yetərli D1 miqrasiyasına çevirir.
 *
 * CI yalnız `migrations/`-ı tətbiq edir, ona görə məzmun production-a miqrasiya
 * ilə çatır. Hər ifadə idempotentdir və redaktorun paneldəki düzəlişinin üzərinə
 * yazmır: yeni qeydlər `INSERT OR IGNORE`, kateqoriya izahı isə yalnız köhnə
 * avtomatik mətn hələ dəyişdirilməyibsə yenilənir.
 *
 * İstifadə:
 *   npm run db:guides:build
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { knowledgeSearchText } from "../src/lib/knowledge-text";
import { normalizeSearchText } from "../src/lib/search-normalization";
import { GUIDE_CATEGORIES, KNOWLEDGE_GUIDES } from "./knowledge-guides";
import { GLOSSARY_TERMS } from "./knowledge-guides/glossary";
import { BLOG_POSTS } from "./knowledge-guides/blog-posts";
import { EXISTING_ARTICLE_TAGS } from "./knowledge-guides/existing-articles";

const OUTPUT = join(process.cwd(), "migrations", "0054_knowledge_guides_and_blog.sql");
/** Bütün qeydlərin dərc tarixi — sabit saxlanılır ki, fayl hər qurulmada eyni çıxsın. */
const PUBLISHED_AT = "2026-09-29T08:00:00.000Z";

function q(value: string | null | undefined): string {
  return value === null || value === undefined ? "NULL" : `'${value.replace(/'/g, "''")}'`;
}

function words(html: string): number {
  return html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function readMinutes(html: string): number {
  return Math.max(1, Math.round(words(html) / 200));
}

/**
 * SQLite-də `normalizeSearchText()`-in yaxın ekvivalenti: `lower()` yalnız ASCII
 * hərfləri kiçildir, ona görə Azərbaycan hərfləri əl ilə əvəz olunur. Mövcud
 * bələdçilərin indeksini yenidən qurmaq üçündür; paneldə saxlananda dəqiq JS
 * versiyası yazılır.
 */
function sqlNormalize(expression: string): string {
  const pairs: Array<[string, string]> = [
    ["Ə", "e"], ["ə", "e"], ["Ş", "s"], ["ş", "s"], ["Ç", "c"], ["ç", "c"],
    ["Ğ", "g"], ["ğ", "g"], ["İ", "i"], ["ı", "i"], ["Ö", "o"], ["ö", "o"],
    ["Ü", "u"], ["ü", "u"], ["<", " "], [">", " "],
  ];
  return pairs.reduce((acc, [from, to]) => `replace(${acc}, '${from}', '${to}')`, `lower(${expression})`);
}

const sql: string[] = [
  "-- Avtomatik yaradılıb: npm run db:guides:build (prisma/build-knowledge-guides-sql.ts).",
  "-- Əl ilə redaktə etmə — prisma/knowledge-guides/ altındakı məzmunu dəyiş və yenidən qur.",
  "-- Bilik Mərkəzi: yeni mövzular, praktiki bələdçilər, lüğət terminləri; bloq yazıları;",
  "-- mövcud bələdçilərin tag-ları və tam mətnli axtarış indeksi.",
  "",
];

// --- Kateqoriyalar -----------------------------------------------------------
for (const category of GUIDE_CATEGORIES) {
  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES (` +
      `${q(`knowledge_category_${category.slug}`)},${q(category.slug)},${q(category.name)},${q(normalizeSearchText(category.name))},` +
      `${q(category.description)},${q(category.icon)},${category.order},1,${q(PUBLISHED_AT)},${q(PUBLISHED_AT)});`,
  );
  // İlk generatorun şablon izahı («X üzrə hüquqi və praktiki bələdçilər.») əvəzlənir;
  // redaktor artıq öz mətnini yazıbsa, toxunulmur.
  sql.push(
    `UPDATE "KnowledgeCategory" SET "description"=${q(category.description)},"searchName"=${q(normalizeSearchText(category.name))},"order"=${category.order},"updatedAt"=${q(PUBLISHED_AT)} ` +
      `WHERE "slug"=${q(category.slug)} AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');`,
  );
}
sql.push("");

// --- Bələdçilər --------------------------------------------------------------
const categoryNames = new Map(GUIDE_CATEGORIES.map((category) => [category.slug, category.name]));
for (const guide of KNOWLEDGE_GUIDES) {
  const searchText = knowledgeSearchText({
    title: guide.title,
    excerpt: guide.excerpt,
    content: guide.content,
    tags: guide.tags,
    categoryName: categoryNames.get(guide.categorySlug),
  });
  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeArticle" (` +
      `"id","slug","title","searchText","excerpt","content","categoryId","audience","level","status",` +
      `"legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo",` +
      `"metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES (` +
      `${q(`knowledge_guide_${guide.slug}`)},${q(guide.slug)},${q(guide.title)},${q(searchText)},${q(guide.excerpt)},${q(guide.content)},` +
      `(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"=${q(guide.categorySlug)}),` +
      `${q(guide.audience)},${q(guide.level)},'PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası',` +
      `${q(guide.legalActs.length ? JSON.stringify(guide.legalActs) : null)},${q(guide.sources.length ? JSON.stringify(guide.sources) : null)},` +
      `${q(JSON.stringify(guide.tags))},${readMinutes(guide.content)},${guide.featured ? 1 : 0},0,` +
      `${q(guide.title.length <= 70 ? guide.title : null)},${q(guide.excerpt.length <= 180 ? guide.excerpt : null)},` +
      `${q(PUBLISHED_AT)},${q(PUBLISHED_AT)},${q(PUBLISHED_AT)});`,
  );
}
sql.push("");

// --- Mövcud bələdçilər: tag-lar və tam mətnli indeks -------------------------
for (const [slug, tags] of Object.entries(EXISTING_ARTICLE_TAGS)) {
  sql.push(
    `UPDATE "KnowledgeArticle" SET "tags"=${q(JSON.stringify(tags))} WHERE "slug"=${q(slug)} AND ("tags" IS NULL OR "tags"='[]');`,
  );
}
// Əvvəlki indeks yalnız başlıq + xülasə idi və diakritikanı saxlayırdı («kupça» yazan
// «kupca» tapmırdı). Mətn, tag və hüquqi bloklar əlavə olunur.
const indexed = [
  `"title"`, `"excerpt"`, `COALESCE("tags",'')`, `COALESCE("legalBasis",'')`, `COALESCE("requiredDocuments",'')`,
  `COALESCE("procedure",'')`, `COALESCE("costs",'')`, `COALESCE("risks",'')`, `COALESCE("checklist",'')`, `"content"`,
].join(` || ' ' || `);
sql.push(
  `UPDATE "KnowledgeArticle" SET "searchText"=${sqlNormalize(indexed)} WHERE "id" NOT LIKE 'knowledge_guide_%';`,
);
sql.push("");

// --- Lüğət --------------------------------------------------------------------
for (const [order, term] of GLOSSARY_TERMS.entries()) {
  const initial = normalizeSearchText(term.term).charAt(0).toUpperCase() || "#";
  sql.push(
    `INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES (` +
      `${q(`knowledge_term_${term.slug}`)},${q(term.slug)},${q(term.term)},${q(normalizeSearchText(`${term.term} ${term.shortDefinition}`))},` +
      `${q(term.shortDefinition)},${q(term.definition)},${q(initial)},` +
      `(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"=${q(term.categorySlug)}),'PUBLISHED',${200 + order * 10},` +
      `${q(term.related.length ? JSON.stringify(term.related) : null)},${q(PUBLISHED_AT)},${q(PUBLISHED_AT)});`,
  );
}
// Əvvəlki terminlərin indeksi yalnız slug idi — qısa tərif də axtarışa düşür.
sql.push(
  `UPDATE "KnowledgeTerm" SET "searchName"=${sqlNormalize(`"term" || ' ' || "shortDefinition"`)} WHERE "id" NOT IN (${GLOSSARY_TERMS.map((term) => q(`knowledge_term_${term.slug}`)).join(",")});`,
);
sql.push("");

// --- Bloq ---------------------------------------------------------------------
for (const post of BLOG_POSTS) {
  sql.push(
    `INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES (` +
      `${q(`blog_post_${post.slug}`)},${q(post.title)},${q(post.slug)},${q(post.excerpt)},${q(post.content)},'',` +
      `(SELECT "id" FROM "BlogCategory" WHERE "slug"=${q(post.categorySlug)}),` +
      `${q(JSON.stringify(post.tags))},${q(post.references.length ? JSON.stringify(post.references) : null)},'PUBLISHED',0,` +
      `${readMinutes(post.content)},${q(PUBLISHED_AT)},${q(post.metaTitle)},${q(post.metaDescription)},${q(PUBLISHED_AT)},${q(PUBLISHED_AT)});`,
  );
}

writeFileSync(OUTPUT, `${sql.join("\n")}\n`, "utf8");
const totalWords = [...KNOWLEDGE_GUIDES, ...BLOG_POSTS].reduce((sum, item) => sum + words(item.content), 0);
console.log(
  `✓ ${GUIDE_CATEGORIES.length} mövzu, ${KNOWLEDGE_GUIDES.length} bələdçi, ${GLOSSARY_TERMS.length} termin, ` +
    `${BLOG_POSTS.length} bloq yazısı (${totalWords} söz) → ${OUTPUT}`,
);
