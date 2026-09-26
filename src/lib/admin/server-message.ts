import type adminCatalog from "@/i18n/locales/az/admin.json";

/**
 * Server action mesajlarının tərcümə markerləri (#89).
 *
 * Admin action-ları mətn əvəzinə `$t:server.<modul>.<açar>` qaytarır; client-dəki
 * `useServerMessage()` onu istifadəçinin **panel dilində** tərcümə edir (admin
 * layout tam kataloqu client-ə verir). Belə olanda modul səviyyəsindəki zod
 * sxemləri də tərcüməçiyə ehtiyac duymadan açar daşıya bilir.
 *
 * Açarlar kataloqun tipindən törəyir — olmayan açar typecheck-də düşür.
 * İctimai kabinet action-ları bunu işlətmir: onlar mesajı öz dilində
 * (`getTranslations`) qurur.
 */

type Leaves<T, Prefix extends string> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type ServerMessageKey = Leaves<(typeof adminCatalog)["server"], "server.">;
export type ServerMessageValues = Record<string, string | number>;

export const SERVER_MESSAGE_PREFIX = "$t:";

export function msg(key: ServerMessageKey, values?: ServerMessageValues): string {
  return values ? `${SERVER_MESSAGE_PREFIX}${key}|${JSON.stringify(values)}` : `${SERVER_MESSAGE_PREFIX}${key}`;
}

/** Marker deyilsə `null` — adi mətn olduğu kimi göstərilir. */
export function parseServerMessage(text: string | null | undefined): { key: string; values?: ServerMessageValues } | null {
  if (!text || !text.startsWith(SERVER_MESSAGE_PREFIX)) return null;
  const body = text.slice(SERVER_MESSAGE_PREFIX.length);
  const separator = body.indexOf("|");
  if (separator < 0) return { key: body };
  try {
    return { key: body.slice(0, separator), values: JSON.parse(body.slice(separator + 1)) as ServerMessageValues };
  } catch {
    return { key: body.slice(0, separator) };
  }
}
