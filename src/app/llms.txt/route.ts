import { isStaging } from "@/config/site";
import { buildLlmsTxt } from "@/lib/llms-txt";
import { getHiddenPublicPaths } from "@/lib/site-sections";
import { PLANS_PAGE_PATH, PROJECTS_SECTION_PATH } from "@/lib/site-section-paths";

// D1 parametri sorğu vaxtı oxunur — build-də prerender olunsa bölmə vəziyyəti donardı.
export const dynamic = "force-dynamic";

/**
 * LLM axtarış/söhbət alətləri üçün sayt xülasəsi (Generative Engine Optimization).
 *
 * `llms.txt` formalaşmaqda olan qeyri-rəsmi konvensiyadır — böyük dil modelləri
 * saytı düzgün sitat gətirmək üçün bu faylı oxuya bilir. `robots.txt`-dən fərqli
 * olaraq icazə/qadağa deyil, kontekst təqdim edir. Mətn `lib/llms-txt.ts`-dədir.
 */
export async function GET() {
  if (isStaging()) {
    return new Response("# Staging mühiti — indekslənməməlidir\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Bölmə paneldən bağlıdırsa (#83) sətir çıxarılır — 404 verən səhifəyə istinad olmasın.
  // Oxu alınmasa açıq-bağlı bölmələr gizli sayılır: qırıq link verməkdənsə buraxmaq yaxşıdır.
  const hiddenPaths = await getHiddenPublicPaths().catch(() => [PROJECTS_SECTION_PATH, PLANS_PAGE_PATH]);
  return new Response(buildLlmsTxt({ hiddenPaths }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
