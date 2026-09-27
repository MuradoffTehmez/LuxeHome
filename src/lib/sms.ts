import { runtimeEnv } from "@/lib/runtime-env";

/**
 * SMS göndərişi (#109) — provayderdən asılı olmayan nazik qat.
 *
 * `SMS_PROVIDER_URL` və `SMS_PROVIDER_TOKEN` secret-ləri olmayanda telefonla giriş
 * tam söndürülüdür. Sorğu JSON formasındadır: `{ to, text, sender }` + Bearer token.
 * Seçilən yerli provayderin API-si başqa formadadırsa, dəyişiklik yalnız bu faylda olur.
 */

const TIMEOUT_MS = 8000;

export function isSmsConfigured(): boolean {
  return Boolean(runtimeEnv("SMS_PROVIDER_URL") && runtimeEnv("SMS_PROVIDER_TOKEN"));
}

export async function sendSms(to: string, text: string): Promise<boolean> {
  const url = runtimeEnv("SMS_PROVIDER_URL");
  const token = runtimeEnv("SMS_PROVIDER_TOKEN");
  if (!url || !token) return false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, text, sender: runtimeEnv("SMS_SENDER") ?? "LuxeHome" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) console.error("[sms] provayder xətası", response.status);
    return response.ok;
  } catch (error) {
    console.error("[sms] göndərilmədi", error);
    return false;
  }
}
