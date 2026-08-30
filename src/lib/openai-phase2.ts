type ResponseContent = { type?: string; text?: string };
type ResponseItem = { type?: string; content?: ResponseContent[] };

type OpenAiResponse = {
  output?: ResponseItem[];
  error?: { message?: string };
};

async function safetyIdentifier(userId: string): Promise<string> {
  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function outputText(response: OpenAiResponse): string {
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n")
    .trim() ?? "";
}

export function parseAiJson<T>(value: string): T {
  const clean = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(clean) as T;
}

export async function createPhase2AiResponse(input: {
  userId: string;
  instructions: string;
  text: string;
  imageUrls?: string[];
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY təyin edilməyib.");
  const model = process.env.OPENAI_PHASE2_MODEL?.trim() || "gpt-5.6-luna";
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: input.text }];
  for (const imageUrl of input.imageUrls ?? []) content.push({ type: "input_image", image_url: imageUrl, detail: "low" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 1800,
      instructions: input.instructions,
      input: [{ role: "user", content }],
      safety_identifier: await safetyIdentifier(input.userId),
    }),
  });
  const payload = await response.json() as OpenAiResponse;
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI sorğusu ${response.status} xətası qaytardı.`);
  const text = outputText(payload);
  if (!text) throw new Error("AI boş cavab qaytardı.");
  return { text, model };
}
