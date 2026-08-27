/**
 * İctimai formalar üçün honeypot.
 *
 * Sahə ekranda görünmür, amma DOM-da real `input` kimi durur və avtomatik
 * doldurma botları onu adına görə (`website`) doldurur. Ziyarətçi onu görmür,
 * ekran oxuyucusu isə `aria-hidden` + `tabindex="-1"` sayəsində ona düşmür.
 *
 * `display: none` qəsdən işlədilmir — bir çox bot gizlədilmiş sahəni məhz bu
 * xassəyə görə atır. Sahə ekrandan kənara çıxarılır, ona görə DOM-da «real»
 * qalır.
 *
 * Honeypot tək başına kifayət etmir: sürət limiti və mənbə yoxlaması ilə
 * birlikdə işlədilməlidir (bax `elaqe/actions.ts`).
 */

/** Formada və server tərəfdə eyni ad işlədilməlidir. */
export const HONEYPOT_FIELD = "website";

/**
 * Sahə doludursa göndəriş bot sayılır.
 *
 * Çağıran tərəf **uğur cavabı qaytarmalıdır**, xəta yox: bot forma
 * sındırıldığını bilməməlidir, əks halda sahəni keçib yenidən cəhd edir.
 */
export function isHoneypotFilled(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
