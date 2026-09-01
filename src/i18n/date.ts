import type { Locale } from "@/lib/constants";

const MONTHS: Record<Locale, readonly string[]> = {
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  // Tarixdən sonra rus dilində ay adı yiyəlik halında yazılır.
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};

/** İctimai səhifələr üçün runtime-dan asılı olmayan lokal tarix formatı. */
export function formatLocalizedDate(
  value: Date | string | null | undefined,
  locale: Locale,
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  // Workers-in yığcam ICU datasında Azərbaycan ay adları yoxdur. Rəqəm hissələri
  // stabil `en-CA` formatter-i ilə Bakı vaxtında götürülür, ay adı öz lüğətimizdəndir.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const year = parts.find((part) => part.type === "year")?.value;
  if (!day || !year || !Number.isInteger(month) || month < 1 || month > 12) return null;

  return `${day} ${MONTHS[locale][month - 1]} ${year}`;
}
