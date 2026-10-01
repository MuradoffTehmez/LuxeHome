import type { Locale } from "@/lib/constants";

/**
 * Runtime-dan asılı olmayan tarix/vaxt formatı.
 *
 * Cloudflare Workers-in yığcam ICU datasında Azərbaycan (`az`) tarix şablonları yoxdur:
 * `Intl.DateTimeFormat("az", …)` və ona söykənən `next-intl` `format.dateTime()` səssizcə
 * kök (root) şablona düşür və «2026 M09 29» kimi mətn qaytarır. Bu səbəbdən ictimai və
 * kabinet səhifələrində, e-poçt və bildirişlərdə tarix `Intl`-in yerli adlarından deyil,
 * buradakı lüğətdən qurulur. Rəqəm hissələri stabil `en-US` formatter-i ilə, həmişə Bakı
 * vaxtında götürülür — server (UTC) və brauzer eyni nəticəni verir, hidratasiya fərqi olmur.
 */

const MONTHS_LONG: Record<Locale, readonly string[]> = {
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  // Tarixdən sonra rus dilində ay adı yiyəlik halında yazılır.
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};

const MONTHS_SHORT: Record<Locale, readonly string[]> = {
  az: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ru: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."],
};

/** «Ay + il» (gün olmadan) üçün adlıq hal — rus dilində «сентябрь 2026». */
const MONTHS_STANDALONE: Record<Locale, readonly string[]> = {
  az: MONTHS_LONG.az,
  en: MONTHS_LONG.en,
  ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
};

/** İndeks 0 = bazar (JS `getUTCDay()` ilə eyni). */
const WEEKDAYS_LONG: Record<Locale, readonly string[]> = {
  az: ["bazar", "bazar ertəsi", "çərşənbə axşamı", "çərşənbə", "cümə axşamı", "cümə", "şənbə"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
};

const WEEKDAYS_SHORT: Record<Locale, readonly string[]> = {
  az: ["B.", "B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş."],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
};

/**
 * - `long`      → «29 sentyabr 2026»
 * - `short`     → «29 sen 2026»
 * - `numeric`   → «29.09.2026»
 * - `monthYear` → «sentyabr 2026»
 * - `weekday`   → «çərşənbə axşamı, 29 sentyabr»
 * - `full`      → «çərşənbə axşamı, 29 sentyabr 2026»
 */
export type DateStyle = "long" | "short" | "numeric" | "monthYear" | "weekday" | "full";

type BakuParts = {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  weekday: number;
};

// Tək formatter — hər çağırışda yenisini qurmaq `format.dateTime`-dan bahalı olmasın.
const BAKU_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Baku",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function bakuParts(date: Date): BakuParts | null {
  const parts = BAKU_PARTS.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const day = read("day");
  const month = read("month");
  const year = read("year");
  const hour = read("hour");
  const minute = read("minute");
  if (![day, month, year, hour, minute].every(Number.isInteger) || month < 1 || month > 12) return null;

  // Həftənin günü Bakı təqvim gününə görə hesablanır (UTC gecə yarısından gün saymaq təhlükəsizdir).
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { day, month, year, hour, minute, weekday };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Naməlum locale gəlsə səhifə sınmasın — defolt dilə düşür. */
function safeLocale(locale: string): Locale {
  return locale in MONTHS_LONG ? (locale as Locale) : "az";
}

function renderDate(parts: BakuParts, rawLocale: Locale, style: DateStyle): string {
  const locale = safeLocale(rawLocale);
  const { day, month, year, weekday } = parts;
  switch (style) {
    case "short":
      return `${day} ${MONTHS_SHORT[locale][month - 1]} ${year}`;
    case "numeric":
      return `${pad(day)}.${pad(month)}.${year}`;
    case "monthYear":
      return `${MONTHS_STANDALONE[locale][month - 1]} ${year}`;
    case "weekday":
      return `${WEEKDAYS_LONG[locale][weekday]}, ${day} ${MONTHS_LONG[locale][month - 1]}`;
    case "full":
      return `${WEEKDAYS_LONG[locale][weekday]}, ${day} ${MONTHS_LONG[locale][month - 1]} ${year}`;
    case "long":
    default:
      return `${day} ${MONTHS_LONG[locale][month - 1]} ${year}`;
  }
}

/** İctimai səhifələr üçün runtime-dan asılı olmayan lokal tarix formatı (Bakı vaxtı). */
export function formatLocalizedDate(
  value: Date | string | number | null | undefined,
  locale: Locale,
  style: DateStyle = "long",
): string | null {
  const date = toDate(value);
  if (!date) return null;
  const parts = bakuParts(date);
  return parts ? renderDate(parts, locale, style) : null;
}

/** «14:30» — 24 saatlıq format, bütün dillərdə eynidir (Bakı vaxtı). */
export function formatLocalizedTime(value: Date | string | number | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  const parts = bakuParts(date);
  return parts ? `${pad(parts.hour)}:${pad(parts.minute)}` : null;
}

/** «29 sentyabr 2026, 14:30» */
export function formatLocalizedDateTime(
  value: Date | string | number | null | undefined,
  locale: Locale,
  style: DateStyle = "long",
): string | null {
  const date = toDate(value);
  if (!date) return null;
  const parts = bakuParts(date);
  if (!parts) return null;
  return `${renderDate(parts, locale, style)}, ${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Qısa həftə günü adı — təqvim başlıqları üçün. İndeks 0 = bazar. */
export function localizedWeekdayShort(locale: Locale, weekday: number): string {
  return WEEKDAYS_SHORT[safeLocale(locale)][((weekday % 7) + 7) % 7];
}

/** Ay adı (adlıq hal) — təqvim başlığı üçün, `month` 1-12. */
export function localizedMonthName(locale: Locale, month: number): string {
  return MONTHS_STANDALONE[safeLocale(locale)][month - 1] ?? "";
}

const RELATIVE_UNITS: Record<Locale, { now: string; minutes: (n: number) => string; hours: (n: number) => string; yesterday: string; days: (n: number) => string }> = {
  az: {
    now: "indicə",
    minutes: (n) => `${n} dəqiqə əvvəl`,
    hours: (n) => `${n} saat əvvəl`,
    yesterday: "dünən",
    days: (n) => `${n} gün əvvəl`,
  },
  en: {
    now: "just now",
    minutes: (n) => `${n} min ago`,
    hours: (n) => `${n} hr ago`,
    yesterday: "yesterday",
    days: (n) => `${n} days ago`,
  },
  ru: {
    now: "только что",
    minutes: (n) => `${n} мин. назад`,
    hours: (n) => `${n} ч. назад`,
    yesterday: "вчера",
    days: (n) => `${n} дн. назад`,
  },
};

/** «2 saat əvvəl» / «dünən» / 30 gündən sonra tam tarix. */
export function formatLocalizedRelative(
  value: Date | string | number | null | undefined,
  locale: Locale,
  now: Date = new Date(),
): string | null {
  const date = toDate(value);
  if (!date) return null;
  const labels = RELATIVE_UNITS[safeLocale(locale)];
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (minutes < 1) return labels.now;
  if (minutes < 60) return labels.minutes(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return labels.hours(hours);
  const days = Math.floor(hours / 24);
  if (days === 1) return labels.yesterday;
  if (days < 30) return labels.days(days);
  return formatLocalizedDate(date, locale);
}
