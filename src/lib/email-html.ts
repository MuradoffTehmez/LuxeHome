/**
 * E-poçt şablonlarının kodlama sərhədi.
 *
 * Məktub HTML-i React tərəfindən render olunmur — sətir birləşdirməsi ilə qurulur,
 * ona görə istifadəçi mətni şablona **kodlanmadan** düşsə markup-un bir hissəsinə
 * çevrilir. Əlaqə formasını anonim ziyarətçi doldurur, elan başlığını və saxlanmış
 * axtarış adını isə hesab sahibi yazır; hər ikisi sonra **başqasının** (əməkdaşın
 * və ya müştərinin) poçt qutusunda brend məktubu kimi açılır.
 *
 * Klientlər skripti bloklasa da, kodlanmamış markup linki, düyməni və uzaq şəkli
 * yerləşdirməyə imkan verir — yəni fişinq və izləmə. Buna görə modul leaf-dir və
 * heç nə idxal etmir: hər şablon faylı onu ucuz şəkildə çağıra bilsin.
 */

/** Mətn və qoşa dırnaqlı atribut dəyəri üçün — hər iki kontekst eyni dəsti tələb edir. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** `null`/`undefined` dəyərləri boş sətrə çevirən variant — şablonlarda opsional sahələr üçün. */
export function escapeOptional(value: string | null | undefined): string {
  return value ? escapeHtml(value) : "";
}

/** `href` üçün icazəli sxemlər — `javascript:` və `data:` qəsdən yoxdur. */
const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;

/**
 * `href` atributuna qoyulan ünvan.
 *
 * Sxem ağ siyahısı ilə yoxlanır, sonra atribut kimi kodlanır. Qəbul edilməyən
 * dəyər `#`-ə düşür: məktubda sınıq link görünsün, aktiv link yox.
 */
export function emailHref(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("/")) return escapeHtml(trimmed);
  return SAFE_SCHEME.test(trimmed) ? escapeHtml(trimmed) : "#";
}

/**
 * `tel:` linki üçün nömrə.
 *
 * Nömrə formasındakı mötərizə və boşluqlar saxlanılır, qalan simvollar atılır —
 * beləliklə həm atribut sərhədi, həm də sxem toxunulmaz qalır.
 */
export function telHref(value: string | null | undefined): string {
  return (value ?? "").replace(/[^\d+()\s.-]/g, "").trim();
}
