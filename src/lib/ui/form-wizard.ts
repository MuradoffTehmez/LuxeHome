/**
 * Addımlı formanın (sehrbaz) saf qaydaları: irəliləyiş və qaralama.
 * Komponent (`components/admin/form-wizard.tsx`) və testlər eyni mənbədən oxuyur.
 */

/**
 * Tamamlanmış addım sayı və faiz. Cari addım hələ tamamlanmayıb sayılır:
 * 4-cü addımda «3 / 8 addım tamamlanıb — 37%».
 */
export function wizardProgress(currentIndex: number, total: number) {
  const completed = Math.max(0, Math.min(currentIndex, total));
  const percent = total > 0 ? Math.floor((completed / total) * 100) : 0;
  return { completed, total, percent };
}

export type FormDraft = {
  version: 1;
  savedAt: string;
  step: number;
  entries: Array<[string, string]>;
};

/**
 * Qaralamaya yazılmayan sahələr: Next.js-in server action xidməti sahələri,
 * bot tələsi və birdəfəlik doğrulama tokenləri. Fayllar ayrıca atılır.
 */
const SKIPPED_FIELD = /^(\$ACTION|website$|cf-turnstile-response$|turnstileToken$)/;

export function serializeDraft(entries: Iterable<[string, FormDataEntryValue]>, step: number, now = new Date()): FormDraft {
  const values: Array<[string, string]> = [];
  for (const [name, value] of entries) {
    if (typeof value !== "string" || SKIPPED_FIELD.test(name)) continue;
    values.push([name, value]);
  }
  return { version: 1, savedAt: now.toISOString(), step, entries: values };
}

/** Qaralama saxlanma müddəti — köhnə yarımçıq elan təklif edilmir. */
export const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function parseDraft(raw: string | null, now = Date.now()): FormDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<FormDraft>;
    if (value.version !== 1 || !Array.isArray(value.entries) || typeof value.savedAt !== "string") return null;
    const savedAt = Date.parse(value.savedAt);
    if (!Number.isFinite(savedAt) || now - savedAt > DRAFT_MAX_AGE_MS) return null;
    const entries = value.entries.filter(
      (entry): entry is [string, string] =>
        Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "string",
    );
    return { version: 1, savedAt: value.savedAt, step: Number(value.step) || 0, entries };
  } catch {
    return null;
  }
}

/** Qaralama sahələrinə rahat oxu: tək dəyər, siyahı və JSON sətirlər. */
export function draftReader(entries: ReadonlyArray<[string, string]>) {
  const get = (name: string) => entries.find(([key]) => key === name)?.[1] ?? "";
  const all = (name: string) => entries.filter(([key]) => key === name).map(([, value]) => value);
  const has = (name: string) => entries.some(([key]) => key === name);
  const json = <T,>(name: string): T[] =>
    all(name).flatMap((value) => {
      try {
        return [JSON.parse(value) as T];
      } catch {
        return [];
      }
    });
  return { get, all, has, json };
}
