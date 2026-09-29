/**
 * `Combobox` komponentinin mətnləri.
 *
 * JSON kataloqlarında deyil, burada saxlanılır: panel (`/admin`) client-ə yalnız
 * `admin` namespace-ini, ictimai sayt isə ictimai kataloqları ötürür. Ortaq UI
 * komponenti hər iki mühitdə işləməli olduğu üçün dili `useLocale()`-dan alıb
 * bu kiçik kataloqdan seçir. Üç dil eyni açarları daşımalıdır (test yoxlayır).
 */
export type ComboboxMessages = {
  noResults: string;
  loading: string;
  clear: string;
  create: (query: string) => string;
  more: (count: number) => string;
  results: (count: number) => string;
};

const CATALOG: Record<"az" | "en" | "ru", ComboboxMessages> = {
  az: {
    noResults: "Uyğun nəticə tapılmadı",
    loading: "Yüklənir…",
    clear: "Seçimi təmizlə",
    create: (query) => `«${query}» əlavə et`,
    more: (count) => `Daha ${count} nəticə var — axtarışı dəqiqləşdirin`,
    results: (count) => `${count} nəticə`,
  },
  en: {
    noResults: "No matching results",
    loading: "Loading…",
    clear: "Clear selection",
    create: (query) => `Add “${query}”`,
    more: (count) => `${count} more results — refine your search`,
    results: (count) => `${count} results`,
  },
  ru: {
    noResults: "Ничего не найдено",
    loading: "Загрузка…",
    clear: "Очистить выбор",
    create: (query) => `Добавить «${query}»`,
    more: (count) => `Ещё ${count} — уточните поиск`,
    results: (count) => `Найдено: ${count}`,
  },
};

export function comboboxMessages(locale: string): ComboboxMessages {
  return CATALOG[locale as keyof typeof CATALOG] ?? CATALOG.az;
}
