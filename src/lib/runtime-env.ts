import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Sorğu vaxtı mühit dəyərini həm Next.js, həm də Cloudflare binding-indən oxuyur.
 *
 * OpenNext production-da secret-ləri adətən `process.env`-ə proyeksiya edir, amma
 * status ekranları və bəzi runtime yolları yalnız buna güvənsə yanlış "qurulmayıb"
 * göstərə bilər. Lokal build-də Cloudflare konteksti olmadığı üçün ikinci oxunuş
 * təhlükəsiz şəkildə `try/catch` içindədir.
 */
export function runtimeEnv(name: string): string | undefined {
  const processValue = process.env[name]?.trim();
  if (processValue) return processValue;

  try {
    const env = getCloudflareContext().env as unknown as Record<string, unknown>;
    const value = env[name];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function hasRuntimeEnv(name: string): boolean {
  return Boolean(runtimeEnv(name));
}
