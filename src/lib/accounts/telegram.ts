/**
 * Telegram əlaqəsi (#208). Saf modul — həm server formaları, həm client düymələri işlədir.
 *
 * Bazada yalnız istifadəçi adı saxlanılır (`@`-sız): `@luxe_home`, `t.me/luxe_home`,
 * `https://t.me/luxe_home` və `telegram.me/...` eyni dəyərə gəlir. Telegram qaydası: 5–32 simvol,
 * hərflə başlayır, yalnız Latın hərfi, rəqəm və `_`. Telefon nömrəsi qəbul edilmir — nömrə ilə
 * əlaqə artıq WhatsApp və zəng düymələrindədir.
 */

const USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

/** Boş giriş `null`; etibarsız giriş `undefined` (formada xəta göstərmək üçün). */
export function normalizeTelegramUsername(input: unknown): string | null | undefined {
  if (typeof input !== "string") return null;
  let value = input.trim();
  if (!value) return null;
  value = value.replace(/^https?:\/\//i, "").replace(/^(www\.)?(t|telegram)\.me\//i, "").replace(/^@/, "");
  value = value.split(/[/?#]/)[0] ?? "";
  if (!USERNAME.test(value) || value.endsWith("_")) return undefined;
  return value;
}

export function telegramHref(username: string | null | undefined): string | null {
  const value = normalizeTelegramUsername(username ?? "");
  return value ? `https://t.me/${value}` : null;
}
