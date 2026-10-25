import { isStaging, siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { getKnowledgeArticles } from "@/lib/knowledge";
import { buildLlmsTxt, type LlmsEntry } from "@/lib/llms-txt";
import { getPosts } from "@/lib/queries";
import { getHiddenPublicPaths } from "@/lib/site-sections";
import { PLANS_PAGE_PATH, PROJECTS_SECTION_PATH } from "@/lib/site-section-paths";

export const dynamic = "force-dynamic";

const KNOWLEDGE_LIMIT = 40;
const POST_LIMIT = 20;

const entry = (path: string, title: string, description: string | null): LlmsEntry => ({
  url: siteUrl(localizePath(path, DEFAULT_LOCALE)),
  title,
  description: (description ?? "").replace(/\s+/g, " ").trim() || title,
});

/**
 * `llms.txt`-in geniş versiyası (#289): əsas bölmələrə dərc olunmuş Bilik Mərkəzi
 * məqalələri və son bloq yazıları əlavə olunur. D1 oxusu alınmasa qısa versiyaya düşür.
 */
export async function GET() {
  if (isStaging()) {
    return new Response("# Staging mühiti — indekslənməməlidir\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const [hiddenPaths, knowledge, posts] = await Promise.all([
    getHiddenPublicPaths().catch(() => [PROJECTS_SECTION_PATH, PLANS_PAGE_PATH]),
    getKnowledgeArticles({ pageSize: KNOWLEDGE_LIMIT })
      .then((result) => result.items.map((item) => entry(`/bilik-merkezi/${item.slug}`, item.title, item.excerpt)))
      .catch(() => [] as LlmsEntry[]),
    getPosts({ pageSize: POST_LIMIT })
      .then((result) => result.items.map((item) => entry(`/blog/${item.slug}`, item.title, item.excerpt)))
      .catch(() => [] as LlmsEntry[]),
  ]);

  return new Response(buildLlmsTxt({ hiddenPaths, full: { knowledge, posts } }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
