import { prisma } from "@/lib/prisma";
import { KNOWLEDGE_STATUSES, type Locale } from "@/lib/constants";
import { publishedKnowledgeWhere } from "@/lib/knowledge";
import { normalizeSearchText } from "@/lib/search-normalization";
import { runAiText, parseAiJson } from "@/lib/ai";

/**
 * Bilik Mərkəzi AI məsləhətçisi (#109).
 *
 * Cavab **yalnız dərc olunmuş** məqalə və suallardan qurulur (RAG): əvvəl sual üzrə
 * leksik axtarışla ən uyğun mənbələr seçilir, model yalnız onları görür və hər iddianı
 * `[n]` istinadı ilə bağlamalıdır. İstinadsız cavab göstərilmir — hüquqi mövzuda
 * mənbəsiz «məsləhət» zərərlidir. Mənbə tapılmayanda model heç çağırılmır.
 */

export const ADVISOR_QUESTION_MAX = 300;
const MAX_ARTICLE_SOURCES = 4;
const MAX_FAQ_SOURCES = 2;
const SOURCE_TEXT_LIMIT = 1800;
const PREFIX_LENGTH = 5;

/** Mənası az olan sözlər — hər məqalədə keçir və sıralamanı korlayır. */
const STOP_WORDS = new Set([
  "ve", "ile", "ucun", "bu", "bir", "ne", "nece", "hansi", "olar", "olur", "var", "yox", "men", "mene", "menim",
  "biz", "siz", "onu", "ona", "da", "de", "ki", "mi", "mu", "ya", "yaxud", "eger", "zaman", "lazim", "lazimdir",
  "the", "and", "for", "what", "how", "can", "does", "with", "from", "about", "need", "have", "that", "this",
  "kak", "chto", "dlya", "eto", "ili", "mozhno", "nuzhno",
]);

export type AdvisorSource = { n: number; kind: "article" | "faq"; title: string; href: string };

export type AdvisorResult =
  | { status: "answered"; answer: string; sources: AdvisorSource[] }
  | { status: "noAnswer"; sources: AdvisorSource[] }
  | { status: "unavailable"; sources: AdvisorSource[] };

/** Sualı normallaşdırılmış açar sözlərə bölür (təkrarsız, qısa və boş sözlər atılır). */
export function advisorTokens(question: string): string[] {
  const words = normalizeSearchText(question).split(" ");
  return [...new Set(words.filter((word) => word.length >= 3 && !STOP_WORDS.has(word)))].slice(0, 12);
}

/**
 * Azərbaycan dili iltisaqidir («ipotekanı», «ipotekaya») — söz kökü kimi ilk 5 hərf
 * müqayisə olunur. Başlıqdakı uyğunluq mətndəkindən ağırdır.
 */
export function scoreDocument(tokens: string[], fields: { title: string; tags?: string; body: string }): number {
  if (tokens.length === 0) return 0;
  const title = normalizeSearchText(fields.title);
  const tags = normalizeSearchText(fields.tags ?? "");
  const body = normalizeSearchText(fields.body);
  let score = 0;
  for (const token of tokens) {
    const stem = token.slice(0, PREFIX_LENGTH);
    const pattern = new RegExp(`(^| )${stem}`);
    if (pattern.test(title)) score += 3;
    if (pattern.test(tags)) score += 2;
    if (pattern.test(body)) score += 1;
  }
  return score;
}

/** HTML-i model üçün düz mətnə çevirir və uzunluğu məhdudlaşdırır. */
export function sourceText(html: string, limit = SOURCE_TEXT_LIMIT): string {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|tr|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

/**
 * Model cavabını yoxlayır: mövcud olmayan mənbəyə `[n]` istinadı silinir, heç bir
 * etibarlı istinad qalmırsa cavab rədd edilir (null).
 */
export function validateAdvisorAnswer(
  raw: { answered?: unknown; answer?: unknown },
  sourceCount: number,
): { answer: string; cited: number[] } | null {
  if (raw.answered !== true || typeof raw.answer !== "string") return null;
  const cited = new Set<number>();
  const answer = raw.answer
    .replace(/\[(\d{1,2})\]/g, (match, value: string) => {
      const n = Number(value);
      if (n >= 1 && n <= sourceCount) {
        cited.add(n);
        return match;
      }
      return "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .trim();
  if (!answer || cited.size === 0) return null;
  return { answer: answer.slice(0, 2000), cited: [...cited].sort((a, b) => a - b) };
}

const LANGUAGE: Record<Locale, string> = { az: "Azərbaycan dilində", en: "in English", ru: "на русском языке" };

export function advisorInstructions(locale: Locale): string {
  return [
    "Sən Luxe Home Estate Bilik Mərkəzinin daşınmaz əmlak məsləhətçisisən.",
    "YALNIZ verilən mənbələrdəki məlumatla cavab ver. Mənbədə olmayan qanun maddəsi, rəqəm, rüsum, müddət və ya prosedur uydurma.",
    "Hər faktdan sonra mənbənin nömrəsini kvadrat mötərizədə yaz, məsələn [1] və ya [2].",
    "Mənbələr suala cavab vermirsə answered=false qaytar və answer-i boş burax.",
    "Cavab qısa və praktik olsun (ən çox 180 söz), addımlar varsa sıra ilə yaz.",
    "Hüquqi zəmanət vermə; mürəkkəb halda notarius, hüquqşünas və ya agentlə məsləhətləşməyi tövsiyə et.",
    `Cavabı ${LANGUAGE[locale]} yaz.`,
  ].join("\n");
}

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answered: { type: "boolean" },
    answer: { type: "string" },
  },
  required: ["answered", "answer"],
} as const;

type Candidate = { kind: "article" | "faq"; id: string; title: string; href: string; score: number; text: string };

/** Sual üzrə ən uyğun dərc olunmuş məqalə və sualları seçir. */
export async function findAdvisorSources(question: string): Promise<Candidate[]> {
  const tokens = advisorTokens(question);
  if (tokens.length === 0) return [];

  const [articles, faqs] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where: publishedKnowledgeWhere(),
      select: { id: true, slug: true, title: true, excerpt: true, tags: true },
    }),
    prisma.knowledgeFaq.findMany({
      where: { status: KNOWLEDGE_STATUSES.PUBLISHED },
      select: { id: true, question: true, answer: true },
    }),
  ]);

  const rankedArticles = articles
    .map((article) => ({ article, score: scoreDocument(tokens, { title: article.title, tags: article.tags ?? "", body: article.excerpt }) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ARTICLE_SOURCES);
  const rankedFaqs = faqs
    .map((faq) => ({ faq, score: scoreDocument(tokens, { title: faq.question, body: faq.answer }) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FAQ_SOURCES);

  // Məzmun yalnız seçilmiş məqalələr üçün oxunur — bütün mətnləri yükləmək bahalıdır.
  const contents = rankedArticles.length
    ? await prisma.knowledgeArticle.findMany({
        where: { id: { in: rankedArticles.map((item) => item.article.id) } },
        select: { id: true, content: true },
      })
    : [];
  const contentById = new Map(contents.map((item) => [item.id, item.content]));

  return [
    ...rankedArticles.map(({ article, score }) => ({
      kind: "article" as const,
      id: article.id,
      title: article.title,
      href: `/bilik-merkezi/${article.slug}`,
      score,
      text: `${article.excerpt}\n${sourceText(contentById.get(article.id) ?? "")}`,
    })),
    ...rankedFaqs.map(({ faq, score }) => ({
      kind: "faq" as const,
      id: faq.id,
      title: faq.question,
      href: "/bilik-merkezi/suallar",
      score,
      text: sourceText(faq.answer, 900),
    })),
  ].sort((a, b) => b.score - a.score);
}

function publicSource(candidate: Candidate, n: number): AdvisorSource {
  return { n, kind: candidate.kind, title: candidate.title, href: candidate.href };
}

export async function askKnowledgeAdvisor(question: string, locale: Locale): Promise<AdvisorResult> {
  const candidates = await findAdvisorSources(question);
  const numbered = candidates.map((candidate, index) => ({ candidate, n: index + 1 }));
  const suggestions = numbered.map(({ candidate, n }) => publicSource(candidate, n));
  if (candidates.length === 0) return { status: "noAnswer", sources: [] };

  const prompt = [
    `Sual: ${question}`,
    "",
    "Mənbələr:",
    ...numbered.map(({ candidate, n }) => `[${n}] ${candidate.title}\n${candidate.text}`),
  ].join("\n\n");

  let raw: { answered?: unknown; answer?: unknown };
  try {
    const result = await runAiText({ instructions: advisorInstructions(locale), prompt, jsonSchema: ANSWER_SCHEMA, maxTokens: 700 });
    raw = parseAiJson(result.text);
  } catch (error) {
    console.error("[bilik-meslehetci] AI cavabı alınmadı", error);
    return { status: "unavailable", sources: suggestions };
  }

  const validated = validateAdvisorAnswer(raw, candidates.length);
  if (!validated) return { status: "noAnswer", sources: suggestions };
  return {
    status: "answered",
    answer: validated.answer,
    sources: suggestions.filter((source) => validated.cited.includes(source.n)),
  };
}
