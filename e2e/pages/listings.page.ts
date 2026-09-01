import { expect, type Locator, type Page } from "@playwright/test";
import { propertyCardLinks, readResultCount, type Locale } from "../support/helpers";

/**
 * Əmlak kataloqu (`/{locale}/emlaklar`).
 *
 * **Filtr adları URL-in müqaviləsidir.** `SearchPanel` göndərdiyi ad ilə
 * `emlaklar/page.tsx` oxuduğu ad eyni olmalıdır; tarixdə bu ikisi ayrıldığı üçün
 * saytın əsas axtarışı səssizcə heç nə filtrləmirdi. Testlər həmin müqaviləni
 * URL səviyyəsində yoxlayır, ona görə adlar burada bir yerdə toplanıb.
 */
export const FILTER_PARAMS = {
  listingType: "elan",
  search: "axtaris",
  type: "tip",
  city: "seher",
  district: "rayon",
  metro: "metro",
  rooms: "otaq",
  minPrice: "min",
  maxPrice: "max",
  minArea: "sahe_min",
  maxArea: "sahe_max",
  renovation: "temir",
  document: "sened",
  sort: "siralama",
  page: "sehife",
} as const;

export class ListingsPage {
  readonly page: Page;
  readonly locale: Locale;

  constructor(page: Page, locale: Locale = "az") {
    this.page = page;
    this.locale = locale;
  }

  get path(): string {
    return `/${this.locale}/emlaklar`;
  }

  async open(query = ""): Promise<void> {
    await this.page.goto(`${this.path}${query}`, { waitUntil: "domcontentloaded" });
  }

  cards(): Locator {
    return propertyCardLinks(this.page, this.locale);
  }

  async cardCount(): Promise<number> {
    return this.cards().count();
  }

  async resultCount(): Promise<number | null> {
    return readResultCount(this.page);
  }

  heading(): Locator {
    return this.page.locator("h1");
  }

  /** Kartın açdığı ilk elan slug-ı — detal testləri buradan bəslənir. */
  async firstPropertyHref(): Promise<string | null> {
    const first = this.cards().first();
    if ((await first.count()) === 0) return null;
    return first.getAttribute("href");
  }

  /** `select[name=...]` — React-in generasiya etdiyi `id` sabit deyil, `name` isə müqavilədir. */
  select(name: string): Locator {
    return this.page.locator(`select[name="${name}"]`);
  }

  input(name: string): Locator {
    return this.page.locator(`input[name="${name}"]`);
  }

  /** Filtri tətbiq edib naviqasiyanı gözləyir. */
  async applyQuery(params: Record<string, string>): Promise<void> {
    const search = new URLSearchParams(params).toString();
    await this.page.goto(`${this.path}?${search}`, { waitUntil: "domcontentloaded" });
  }

  /** Səhifələmə linki (varsa). */
  pageLink(pageNumber: number): Locator {
    return this.page.locator(`a[href*="${FILTER_PARAMS.page}=${pageNumber}"]`).first();
  }

  /**
   * Kataloqun boş olmadığını təsdiqləyir və kart sayını qaytarır.
   * Boş kataloq real haldır (az məzmunlu mühit), ona görə çağıran tərəf qərar verir.
   */
  async expectNotEmpty(): Promise<number> {
    await expect(this.cards().first()).toBeVisible();
    return this.cardCount();
  }
}
