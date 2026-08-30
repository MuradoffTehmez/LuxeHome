import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers AI qatı.
 *
 * **Niyə Workers AI, xarici provayder deyil.** Binding hesabın öz infrastrukturunda
 * qalır: ayrıca API açarı saxlamaq lazım gəlmir, elan mətni və şəkilləri üçüncü
 * tərəfin serverinə çıxmır, xərc isə mövcud Cloudflare hesabında ölçülür. Sorğu
 * Worker-in öz sorğu kontekstində gedir, ona görə `getCloudflareContext()`
 * yalnız işləmə vaxtı çağırılır — modul səviyyəsində oxumaq build-i çökdürərdi
 * (eyni səbəb `src/lib/prisma.ts`-də də izah olunub).
 *
 * Model adları `AI_TEXT_MODEL` / `AI_VISION_MODEL` mühit dəyişənləri ilə
 * dəyişdirilə bilir: Workers AI kataloqu tez-tez yenilənir və modeli dəyişmək
 * üçün yayım gözləmək lazım deyil.
 */

/** Mətn modeli — təlimatı izləyən, JSON sxeminə uyğun cavab verə bilən. */
const DEFAULT_TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const FALLBACK_TEXT_MODELS = [
  "@cf/meta/llama-3.1-8b-instruct-fast",
  "@cf/meta/llama-3.2-3b-instruct",
] as const;

/** Şəkil modeli — foto keyfiyyət analizi üçün. */
const DEFAULT_VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

type AiRunner = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

export type AiResult = { text: string; model: string };

async function aiBinding(): Promise<AiRunner> {
  const { env } = getCloudflareContext();
  const ai = (env as unknown as { AI?: AiRunner }).AI;
  if (!ai) throw new Error("Workers AI binding-i (AI) mövcud deyil.");
  return ai;
}

function textModel(): string {
  return process.env.AI_TEXT_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

function visionModel(): string {
  return process.env.AI_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
}

/**
 * Model cavabından mətni çıxarır.
 *
 * Workers AI mətn modelləri `{ response: string }` qaytarır, bəzi modellər isə
 * `{ result: { response } }` sarğısı ilə gəlir. Hər ikisi qəbul edilir ki, model
 * dəyişəndə çağıran tərəf sınmasın.
 */
function extractText(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.response === "string") return record.response.trim();
  if (typeof record.output_text === "string") return record.output_text.trim();
  if (Array.isArray(record.choices)) {
    const choice = record.choices[0] as { message?: { content?: unknown }; text?: unknown } | undefined;
    if (typeof choice?.message?.content === "string") return choice.message.content.trim();
    if (typeof choice?.text === "string") return choice.text.trim();
  }
  if (record.result && typeof record.result === "object") {
    return extractText(record.result);
  }
  return "";
}

/**
 * Model çıxışından JSON obyekti çıxarır.
 *
 * Model bəzən JSON-u ``` bloku içində və ya izahat mətni ilə birlikdə qaytarır.
 * Əvvəlcə təmizlənmiş sətir sınanır, alınmasa ilk `{…}` blokuna düşülür — belə
 * hallarda istifadəçiyə «AI cavab vermədi» demək əvəzinə nəticəni xilas etmək
 * daha faydalıdır.
 */
export function parseAiJson<T>(value: string): T {
  const clean = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("AI cavabında JSON tapılmadı.");
    return JSON.parse(clean.slice(start, end + 1)) as T;
  }
}

/**
 * Mətn sorğusu.
 *
 * `jsonSchema` verilərsə model `guided_json` ilə məhz həmin formaya məcbur edilir —
 * sərbəst mətn cavabını sonradan təmizləməkdən qat-qat etibarlıdır.
 */
export async function runAiText(input: {
  instructions: string;
  prompt: string;
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
}): Promise<AiResult> {
  const ai = await aiBinding();
  const configuredModel = textModel();
  const payload: Record<string, unknown> = {
    messages: [
      { role: "system", content: input.instructions },
      { role: "user", content: input.prompt },
    ],
    max_tokens: input.maxTokens ?? 1600,
    temperature: 0.3,
  };
  // `guided_json` bütün Workers AI Llama variantlarında dəstəklənmir və
  // production-da 400 qaytarırdı. Sxem prompta verilir, yekun sərhəd isə
  // çağıran tərəfdə parse + Zod/allow-list yoxlamasıdır.
  if (input.jsonSchema) {
    payload.messages = [
      ...(payload.messages as Array<Record<string, unknown>>),
      { role: "system", content: `Yekun cavab bu JSON sxeminə uyğun olmalıdır: ${JSON.stringify(input.jsonSchema)}` },
    ];
  }

  const models = [configuredModel, ...FALLBACK_TEXT_MODELS.filter((item) => item !== configuredModel)];
  let lastError: unknown;
  for (const model of models) {
    try {
      const text = extractText(await ai.run(model, payload));
      if (!text) throw new Error("AI boş cavab qaytardı.");
      return { text, model };
    } catch (error) {
      lastError = error;
      console.error("[workers-ai] mətn modeli xətası", { model, error: error instanceof Error ? error.message : String(error) });
    }
  }
  throw new Error(`Workers AI cavab vermədi: ${lastError instanceof Error ? lastError.message : "naməlum xəta"}`);
}

/**
 * Şəkil sorğusu.
 *
 * Llama vision bir çağırışda **bir** şəkil qəbul edir, ona görə çağıran tərəf
 * şəkilləri bir-bir göndərir. Şəkil bayt massivi kimi verilir: R2-dəki fayl
 * ictimai URL olmadan da oxuna bilir.
 */
export async function runAiVision(input: {
  instructions: string;
  prompt: string;
  image: Uint8Array;
  maxTokens?: number;
}): Promise<AiResult> {
  const ai = await aiBinding();
  const model = visionModel();
  const text = extractText(
    await ai.run(model, {
      messages: [
        { role: "system", content: input.instructions },
        { role: "user", content: input.prompt },
      ],
      image: Array.from(input.image),
      max_tokens: input.maxTokens ?? 700,
    }),
  );
  if (!text) throw new Error("AI boş cavab qaytardı.");
  return { text, model };
}

/** Panelin «hansı provayder işləyir» sətri üçün. */
export function aiProviderLabel(): string {
  return `Cloudflare Workers AI · ${textModel()}`;
}
