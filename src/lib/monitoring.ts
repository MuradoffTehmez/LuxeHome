export const WEB_VITAL_NAMES = ["CLS", "FCP", "INP", "LCP", "TTFB"] as const;

export function sanitizeTelemetryPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.split(/[?#]/, 1)[0]?.trim() || "/";
  return path.startsWith("/") ? path.slice(0, 300) : "/";
}

/** Xəta mesajında təsadüfən görünən e-poçt, telefon və URL-ləri redaktə edir. */
export function sanitizeTelemetryMessage(value: unknown): string {
  if (typeof value !== "string") return "Naməlum brauzer xətası";
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[e-poçt]")
    .replace(/https?:\/\/\S+/g, "[URL]")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "[telefon]")
    .slice(0, 500);
}
