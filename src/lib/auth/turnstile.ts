import { runtimeEnv } from "@/lib/runtime-env";

export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  [key: string]: unknown;
};

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

/** Deployment üçün icazəli frontend hostlarını vergüllə ayrılmış env dəyərindən oxuyur. */
export function parseTurnstileHostnames(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map(normalizeHostname)
      .filter(Boolean),
  );
}

/**
 * Köhnə keşlənmiş client bundle-ları eyni adlı əlavə boş input göndərə bilər.
 * Bütün dəyərləri oxuyub Cloudflare limitinə uyğun ilk dolu tokeni seçirik.
 */
export function readTurnstileToken(formData: FormData): string | null {
  for (const value of formData.getAll(TURNSTILE_RESPONSE_FIELD)) {
    if (typeof value !== "string") continue;
    const token = value.trim();
    if (token.length >= 10 && token.length <= 2_048) return token;
  }
  return null;
}

/** Cloudflare cavabını ayrıca saxlayırıq ki, şəbəkəsiz unit test edilə bilsin. */
export function isTurnstileResponseValid(
  response: TurnstileResponse,
  expectedAction: string,
  expectedHostnames: ReadonlySet<string>,
): boolean {
  return (
    response.success === true &&
    response.action === expectedAction &&
    typeof response.hostname === "string" &&
    expectedHostnames.has(normalizeHostname(response.hostname))
  );
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
  // `_KEY` yalnız əvvəlki deploy-dan təhlükəsiz keçid üçün müvəqqəti fallback-dır.
  const secret = runtimeEnv("TURNSTILE_SECRET") ?? runtimeEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return process.env.NODE_ENV !== "production";

  const expectedHostnames = parseTurnstileHostnames(runtimeEnv("TURNSTILE_HOSTNAMES"));
  if (expectedHostnames.size === 0) return false;

  const token = readTurnstileToken(formData);
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileResponse;
    const valid = isTurnstileResponseValid(result, expectedAction, expectedHostnames);
    if (!valid) {
      console.warn("Turnstile yoxlaması rədd edildi", {
        expectedAction,
        action: result.action ?? null,
        hostname: result.hostname ?? null,
        errorCodes: result["error-codes"] ?? [],
      });
    }
    return valid;
  } catch (error) {
    console.error("Turnstile yoxlaması tamamlanmadı", error);
    return false;
  }
}
