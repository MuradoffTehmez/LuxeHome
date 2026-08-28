import { runtimeEnv } from "@/lib/runtime-env";

export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  [key: string]: unknown;
};

/** Cloudflare cavabını ayrıca saxlayırıq ki, şəbəkəsiz unit test edilə bilsin. */
export function isTurnstileResponseValid(
  response: TurnstileResponse,
  expectedAction: string,
): boolean {
  return response.success === true && response.action === expectedAction;
}

/**
 * Turnstile tokenini bir dəfəlik Cloudflare Siteverify sorğusu ilə yoxlayır.
 * Production-da açar çatışmırsa fail-closed işləyir; lokal development formaları
 * isə ayrıca Cloudflare konfiqurasiyası tələb etmədən işlək qalır.
 */
export async function verifyTurnstile(
  formData: FormData,
  expectedAction: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = runtimeEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return process.env.NODE_ENV !== "production";

  const token = formData.get(TURNSTILE_RESPONSE_FIELD);
  if (typeof token !== "string" || token.length < 10 || token.length > 2_048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return false;
    return isTurnstileResponseValid(
      (await response.json()) as TurnstileResponse,
      expectedAction,
    );
  } catch (error) {
    console.error("Turnstile yoxlaması tamamlanmadı", error);
    return false;
  }
}
