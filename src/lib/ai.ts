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
 * Mətndən balanslı JSON blokunu çıxarır.
 *
 * Sadəcə ilk `{` ilə son `}` arasını götürmək kifayət etmir: model bəzən JSON-dan
 * sonra izahat cümləsi yazır, bəzən isə iki ayrı blok qaytarır — belə halda həmin
 * kəsik sintaksis xətası verir. Burada mötərizələr sayılır və **ilk tam bağlanan**
 * blok qaytarılır. Sətir literalları nəzərə alınır ki, mətn daxilindəki mötərizə
 * balansı pozmasın.
 */
function extractJsonBlock(text: string): string | null {
  for (let index = 0; index < text.length; index += 1) {
    const opening = text[index];
    if (opening !== "{" && opening !== "[") continue;

    const closing = opening === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let cursor = index; cursor < text.length; cursor += 1) {
      const char = text[cursor];

      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') inString = true;
      else if (char === opening) depth += 1;
      else if (char === closing) {
        depth -= 1;
        if (depth === 0) return text.slice(index, cursor + 1);
      }
    }
  }
  return null;
}

/**
 * Model çıxışından JSON çıxarır.
 *
 * Model təlimata baxmayaraq cavabı ``` bloku içində, izahat mətni ilə və ya
 * massiv kimi qaytara bilir. Üç mərhələ sınanır: təmizlənmiş sətrin özü →
 * markdown blokunun içi → mətnə səpələnmiş ilk balanslı JSON bloku. Yalnız
 * üçü də alınmadıqda xəta atılır.
 */
export function parseAiJson<T>(value: string): T {
  const trimmed = value.trim();

  const candidates: string[] = [trimmed];

  // ```json … ``` bloku — açılış/bağlanış sətrin ortasında da ola bilər.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const block = extractJsonBlock(trimmed);
  if (block) candidates.push(block);

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // növbəti namizəd
    }
  }

  throw new Error("AI cavabında JSON tapılmadı.");
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

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: input.instructions },
    { role: "user", content: input.prompt },
  ];

  // Sxem həm də mətnlə təkrarlanır: JSON mode dəstəklənməyən modeldə yeganə
  // istiqamətləndirici budur, dəstəklənəndə isə nəticəyə zərər vermir.
  if (input.jsonSchema) {
    messages.push({
      role: "system",
      content:
        "Yalnız bu JSON sxeminə uyğun tək bir JSON obyekti qaytar. " +
        `Markdown, kod bloku və izahat yazma. Sxem: ${JSON.stringify(input.jsonSchema)}`,
    });
  }

  const basePayload: Record<string, unknown> = {
    messages,
    max_tokens: input.maxTokens ?? 1600,
    temperature: 0.3,
  };

  /**
   * Cəhd sırası.
   *
   * Workers AI JSON mode-u (`response_format`) modelin çıxışını sxemə məcbur edir
   * və sərbəst mətni sonradan parse etməkdən qat-qat etibarlıdır. Lakin kataloqdakı
   * hər model onu dəstəkləmir — dəstəkləməyən model 400 qaytarır. Ona görə hər model
   * üçün əvvəlcə JSON mode, sonra sxemsiz sadə çağırış sınanır.
   *
   * (Əvvəlki kod `guided_json` işlədirdi; o, vLLM-ə xas parametrdir və Workers AI
   * binding-ində 400 verirdi. `response_format` OpenAI-uyğun rəsmi yoldur.)
   */
  const payloads: Record<string, unknown>[] = input.jsonSchema
    ? [
        {
          ...basePayload,
          response_format: { type: "json_schema", json_schema: input.jsonSchema },
        },
        basePayload,
      ]
    : [basePayload];

  const models = [configuredModel, ...FALLBACK_TEXT_MODELS.filter((item) => item !== configuredModel)];
  let lastError: unknown;

  for (const model of models) {
    for (const [attempt, payload] of payloads.entries()) {
      try {
        const text = extractText(await ai.run(model, payload));
        if (!text) throw new Error("AI boş cavab qaytardı.");
        return { text, model };
      } catch (error) {
        lastError = error;
        console.error("[workers-ai] mətn modeli xətası", {
          model,
          jsonMode: attempt === 0 && Boolean(input.jsonSchema),
          error: error instanceof Error ? error.message : String(error),
        });
      }
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
