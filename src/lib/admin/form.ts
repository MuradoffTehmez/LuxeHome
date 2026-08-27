/**
 * `FormData` oxuma köməkçiləri.
 *
 * Brauzer hər sahəni sətir göndərir: boş input `""` olur, işarələnməmiş checkbox isə
 * ümumiyyətlə göndərilmir. Bu funksiyalar həmin fərqləri bir yerdə həll edir ki,
 * hər action-da eyni yoxlama təkrarlanmasın.
 */

export function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Boş sətri `null`-a çevirir — sxemdəki nullable sahələr üçün. */
export function optionalText(formData: FormData, name: string): string | null {
  const value = text(formData, name);
  return value === "" ? null : value;
}

export function number(formData: FormData, name: string): number | null {
  const value = text(formData, name);
  if (value === "") return null;
  // Vergüllə yazılmış onluq ayırıcı da qəbul edilir — yerli klaviatura vərdişi
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function integer(formData: FormData, name: string): number | null {
  const value = number(formData, name);
  return value === null ? null : Math.trunc(value);
}

export function boolean(formData: FormData, name: string): boolean {
  return formData.get(name) !== null;
}

/** Eyni adlı çoxlu sahə (checkbox qrupu, gizli sıralı inputlar) → sətir massivi. */
export function list(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value !== "");
}

/**
 * Responsive görünüşlərdə eyni checkbox həm kart, həm cədvəl DOM-unda ola bilər.
 * Kütləvi əməliyyatda eyni qeydin iki dəfə işlənməməsi üçün təkrarsız siyahı.
 */
export function uniqueList(formData: FormData, name: string): string[] {
  return [...new Set(list(formData, name))];
}

/** Sətir-başına-bir-maddə formatındakı textarea → massiv. */
export function lines(formData: FormData, name: string): string[] {
  return text(formData, name)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** JSON massiv sahələri (`highlights`, `bullets`, `timeline`) üçün saxlanan format. */
export function jsonArray(values: unknown[]): string | null {
  return values.length === 0 ? null : JSON.stringify(values);
}

export function date(formData: FormData, name: string): Date | null {
  const value = text(formData, name);
  if (value === "") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
