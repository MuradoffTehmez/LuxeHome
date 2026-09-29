/**
 * Azərbaycan əlifbası ilə sıralama: a b c ç d e ə f g ğ h x ı i j k q l m n o ö p r s ş t u ü v y z.
 *
 * `localeCompare(…, "az")` workerd-də etibarlı deyil — runtime-ın ICU məlumatında
 * `az` collation-u tam olmadığı üçün «Çartəpə» «Cağacıq» ilə «Cek» arasına düşür,
 * SQLite-in binar `ORDER BY`-ı isə «Ç», «Ə», «Ş» ilə başlayanları sona atır. Bu
 * müqayisə hər iki mühitdə eynidir və yerləşmə generatorunun (`az_key`) sırası ilə
 * üst-üstə düşür. Rəqəmlər təbii sıra ilə müqayisə olunur: «2-ci» «10-cu»dan əvvəl.
 */

const ALPHABET = "abcçdeəfgğhxıijkqlmnoöprsştuüvyz";
const ORDER = new Map([...ALPHABET].map((char, index) => [char, index]));

function lower(value: string): string {
  return value.replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase();
}

function tokens(value: string): string[] {
  return lower(value).match(/\d+|\D+/g) ?? [];
}

function compareText(left: string, right: string): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === b) continue;
    const orderA = ORDER.get(a);
    const orderB = ORDER.get(b);
    // Hərf olmayan simvollar (boşluq, defis, nöqtə) hərflərdən əvvəl gəlir.
    if (orderA === undefined && orderB === undefined) return a.charCodeAt(0) - b.charCodeAt(0);
    if (orderA === undefined) return -1;
    if (orderB === undefined) return 1;
    return orderA - orderB;
  }
  return left.length - right.length;
}

export function compareAzerbaijani(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const digitsA = /^\d/.test(a[index]);
    const digitsB = /^\d/.test(b[index]);
    let result: number;
    if (digitsA && digitsB) result = Number(a[index]) - Number(b[index]);
    else if (digitsA !== digitsB) result = digitsA ? -1 : 1;
    else result = compareText(a[index], b[index]);
    if (result !== 0) return result;
  }
  return a.length - b.length;
}

/** `sort()` üçün: obyektin `name` sahəsinə görə. */
export function byAzerbaijaniName(left: { name: string }, right: { name: string }): number {
  return compareAzerbaijani(left.name, right.name);
}
