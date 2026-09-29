import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GUIDE_CATEGORIES, KNOWLEDGE_GUIDES } from "../knowledge-guides";
import { BLOG_POSTS } from "../knowledge-guides/blog-posts";
import { EXISTING_ARTICLE_TAGS } from "../knowledge-guides/existing-articles";
import { GLOSSARY_TERMS } from "../knowledge-guides/glossary";
import { OFFICIAL_SOURCE_LABELS, describeSource } from "../../src/lib/official-sources";

/** Sanitizer-in (`src/lib/admin/html.ts`) icazə verdiyi teqlər — miqrasiya onu yan keçir. */
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "span", "div", "strong", "b", "em", "i", "u", "s", "mark", "sup", "sub",
  "h2", "h3", "h4", "h5", "ul", "ol", "li", "blockquote", "code", "pre", "a",
  "table", "thead", "tbody", "tr", "th", "td",
]);

/** Saytda mövcud olan və məzmundan keçid verilən ictimai marşrutlar. */
const STATIC_ROUTES = new Set([
  "/kalkulyator", "/investisiya", "/emlakimi-sat", "/bazar-analitikasi", "/agentlikler",
  "/elaqe", "/elan-yerlesdir",
]);

const guideSlugs = new Set([...KNOWLEDGE_GUIDES.map((guide) => guide.slug), ...Object.keys(EXISTING_ARTICLE_TAGS)]);
const blogSlugs = new Set(BLOG_POSTS.map((post) => post.slug));
const everything = [...KNOWLEDGE_GUIDES, ...BLOG_POSTS];

describe("Bilik Mərkəzi məzmunu", () => {
  it("slug-lar unikaldır və URL-ə uyğundur", () => {
    const all = [...KNOWLEDGE_GUIDES.map((g) => g.slug), ...BLOG_POSTS.map((p) => p.slug), ...GLOSSARY_TERMS.map((t) => t.slug)];
    for (const slug of all) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(KNOWLEDGE_GUIDES.map((g) => g.slug)).size).toBe(KNOWLEDGE_GUIDES.length);
    expect(new Set(BLOG_POSTS.map((p) => p.slug)).size).toBe(BLOG_POSTS.length);
    expect(new Set(GLOSSARY_TERMS.map((t) => t.slug)).size).toBe(GLOSSARY_TERMS.length);
    // Mövcud bələdçilərlə toqquşma `INSERT OR IGNORE`-da səssizcə itərdi.
    for (const guide of KNOWLEDGE_GUIDES) expect(EXISTING_ARTICLE_TAGS[guide.slug]).toBeUndefined();
  });

  it("hər bələdçinin kateqoriyası mövcuddur və sahələr sxem həddindədir", () => {
    const categories = new Set(GUIDE_CATEGORIES.map((category) => category.slug));
    for (const guide of KNOWLEDGE_GUIDES) {
      expect(categories.has(guide.categorySlug), guide.slug).toBe(true);
      expect(guide.title.length).toBeGreaterThanOrEqual(5);
      expect(guide.title.length).toBeLessThanOrEqual(180);
      expect(guide.excerpt.length, guide.slug).toBeGreaterThanOrEqual(20);
      expect(guide.excerpt.length, guide.slug).toBeLessThanOrEqual(400);
      expect(guide.tags.length).toBeGreaterThan(0);
      expect(guide.sources.length, guide.slug).toBeGreaterThan(0);
    }
    for (const term of GLOSSARY_TERMS) expect(categories.has(term.categorySlug), term.slug).toBe(true);
  });

  it("bloq meta sahələri SEO həddindədir", () => {
    for (const post of BLOG_POSTS) {
      expect(post.metaTitle.length, post.slug).toBeLessThanOrEqual(70);
      expect(post.metaDescription.length, post.slug).toBeLessThanOrEqual(180);
      expect(["meslehetler", "dasinmaz-emlak", "bazar-xeberleri"]).toContain(post.categorySlug);
    }
  });

  it("mənbələr yalnız yoxlanmış rəsmi siyahıdandır", () => {
    for (const item of [...KNOWLEDGE_GUIDES.flatMap((g) => g.sources), ...BLOG_POSTS.flatMap((p) => p.references)]) {
      const source = describeSource(item);
      expect(source, item).not.toBeNull();
      const key = source!.label;
      expect(Object.values(OFFICIAL_SOURCE_LABELS), item).toContain(key);
    }
  });

  it("HTML yalnız icazəli teqlərdən ibarətdir və skript/atribut hiylələri yoxdur", () => {
    for (const item of everything) {
      for (const [, tag] of item.content.matchAll(/<\/?([a-zA-Z0-9]+)/g)) {
        expect(ALLOWED_TAGS.has(tag.toLowerCase()), `${item.slug}: <${tag}>`).toBe(true);
      }
      expect(item.content).not.toMatch(/\son[a-z]+=/i);
      expect(item.content).not.toMatch(/javascript:/i);
      // Yalnız `href` atributu işlədilir.
      for (const [, attr] of item.content.matchAll(/<[a-z0-9]+\s+([a-z-]+)=/gi)) expect(attr, item.slug).toBe("href");
    }
  });

  it("daxili keçidlər mövcud səhifələrə aparır (404 yoxdur)", () => {
    for (const item of everything) {
      for (const [, href] of item.content.matchAll(/href="([^"]+)"/g)) {
        if (/^https?:/.test(href)) {
          expect(describeSource(href), `${item.slug}: ${href}`).not.toBeNull();
          continue;
        }
        const guide = href.match(/^\/bilik-merkezi\/([a-z0-9-]+)$/);
        const blog = href.match(/^\/blog\/([a-z0-9-]+)$/);
        if (guide) expect(guideSlugs.has(guide[1]), `${item.slug} → ${href}`).toBe(true);
        else if (blog) expect(blogSlugs.has(blog[1]), `${item.slug} → ${href}`).toBe(true);
        else expect(STATIC_ROUTES.has(href), `${item.slug} → ${href}`).toBe(true);
      }
    }
  });

  it("lüğətin əlaqəli terminləri mövcuddur", () => {
    const original = ["cixaris-kupca", "payli-mulkiyyet", "birge-mulkiyyet", "ipoteka", "beh", "vindikasiya-iddiasi", "neqator-iddia", "torpagin-teyinati", "agent", "broker", "numayende", "ilkin-muqavile"];
    const known = new Set([...original, ...GLOSSARY_TERMS.map((term) => term.slug)]);
    for (const term of GLOSSARY_TERMS) {
      expect(original).not.toContain(term.slug);
      for (const related of term.related) expect(known.has(related), `${term.slug} → ${related}`).toBe(true);
    }
  });

  it("yaradılmış miqrasiya məzmunla sinxrondur", () => {
    const sql = readFileSync(join(process.cwd(), "migrations", "0054_knowledge_guides_and_blog.sql"), "utf8");
    for (const guide of KNOWLEDGE_GUIDES) expect(sql).toContain(`'knowledge_guide_${guide.slug}'`);
    for (const post of BLOG_POSTS) expect(sql).toContain(`'blog_post_${post.slug}'`);
  });
});
