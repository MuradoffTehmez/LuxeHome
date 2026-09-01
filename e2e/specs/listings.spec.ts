import { expect, test } from "@playwright/test";
import { FILTER_PARAMS, ListingsPage } from "../pages/listings.page";
import { queryParam, readResultCount } from "../support/helpers";

/**
 * Əmlak kataloqu — filtr, axtarış, sıralama, səhifələmə.
 *
 * Testlər məzmun sayından asılı deyil: az məzmunlu mühitdə (production) filtr
 * nəticəsi boş ola bilər və bu, xəta deyil. Yoxlanan şey **müqavilədir** —
 * URL parametri oxunur, nəticə ona uyğun daralır, sayğac cavabla üst-üstə düşür.
 */

test.describe("Kataloq — əsas görünüş", () => {
  test("başlıq və nəticə sayğacı görünür", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();

    await expect(listings.heading()).toBeVisible();
    const count = await listings.resultCount();
    expect(count, "nəticə sayğacı oxunmalıdır").not.toBeNull();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("sayğac göstərilən kart sayı ilə uyğundur", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();

    const total = (await listings.resultCount()) ?? 0;
    const cards = await listings.cardCount();

    if (total === 0) {
      expect(cards).toBe(0);
      return;
    }
    // Bir səhifədə sayğacdan çox kart ola bilməz; az ola bilər (səhifələmə).
    expect(cards).toBeGreaterThan(0);
    expect(cards).toBeLessThanOrEqual(total);
  });
});

test.describe("Kataloq — elan növü filtri", () => {
  // Dəyər `LISTING_TYPES` sabitindən gəlir: azərbaycanca mətn deyil, `SALE`/`RENT`.
  for (const listingType of ["SALE", "RENT"] as const) {
    test(`«${listingType}» filtri tətbiq olunur`, async ({ page }) => {
      const listings = new ListingsPage(page);
      await listings.applyQuery({ [FILTER_PARAMS.listingType]: listingType });

      expect(queryParam(page, FILTER_PARAMS.listingType)).toBe(listingType);

      const filtered = (await listings.resultCount()) ?? 0;
      await listings.open();
      const all = (await listings.resultCount()) ?? 0;

      // Filtr ya nəticəni daraldır, ya da bütün elanlar həmin növdədir.
      expect(filtered).toBeLessThanOrEqual(all);
    });
  }

  test("SALE və RENT birlikdə ümumi sayı verir", async ({ page }) => {
    const listings = new ListingsPage(page);

    await listings.open();
    const all = (await listings.resultCount()) ?? 0;
    test.skip(all === 0, "kataloq boşdur");

    await listings.applyQuery({ [FILTER_PARAMS.listingType]: "SALE" });
    const sale = (await listings.resultCount()) ?? 0;
    await listings.applyQuery({ [FILTER_PARAMS.listingType]: "RENT" });
    const rent = (await listings.resultCount()) ?? 0;

    // Hər elan ya satış, ya kirayədir — üçüncü hal yoxdur.
    expect(sale + rent).toBe(all);
  });
});

test.describe("Kataloq — qiymət filtri", () => {
  test("minimum qiymət nəticəni daraldır", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    const all = (await listings.resultCount()) ?? 0;
    test.skip(all === 0, "kataloq boşdur");

    await listings.applyQuery({ [FILTER_PARAMS.minPrice]: "1000000" });
    const expensive = (await listings.resultCount()) ?? 0;

    expect(expensive).toBeLessThanOrEqual(all);
    expect(queryParam(page, FILTER_PARAMS.minPrice)).toBe("1000000");
  });

  test("min > max boş nəticə verir və çökmür", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({
      [FILTER_PARAMS.minPrice]: "900000",
      [FILTER_PARAMS.maxPrice]: "1000",
    });

    // Səhifə açılmalı, xəta verməməlidir — boş nəticə düzgün cavabdır.
    await expect(listings.heading()).toBeVisible();
    expect(await listings.cardCount()).toBe(0);
  });
});

test.describe("Kataloq — otaq filtri", () => {
  test("otaq sayı URL-ə düşür və nəticəni daraldır", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    const all = (await listings.resultCount()) ?? 0;
    test.skip(all === 0, "kataloq boşdur");

    await listings.applyQuery({ [FILTER_PARAMS.rooms]: "3" });
    expect(queryParam(page, FILTER_PARAMS.rooms)).toBe("3");
    expect((await listings.resultCount()) ?? 0).toBeLessThanOrEqual(all);
  });
});

test.describe("Kataloq — kateqoriya filtri", () => {
  test("əmlak növü seçimi nəticəni daraldır", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    const all = (await listings.resultCount()) ?? 0;
    test.skip(all === 0, "kataloq boşdur");

    await listings.applyQuery({ [FILTER_PARAMS.type]: "menziller" });
    const filtered = (await listings.resultCount()) ?? 0;

    expect(filtered).toBeLessThanOrEqual(all);
    expect(queryParam(page, FILTER_PARAMS.type)).toBe("menziller");
  });

  test("mövcud olmayan kateqoriya boş nəticə verir", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({ [FILTER_PARAMS.type]: "movcud-olmayan-kateqoriya" });

    await expect(listings.heading()).toBeVisible();
    expect(await listings.cardCount()).toBe(0);
  });
});

test.describe("Kataloq — axtarış", () => {
  test("axtarış sözü URL-ə düşür", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({ [FILTER_PARAMS.search]: "mənzil" });

    expect(queryParam(page, FILTER_PARAMS.search)).toBe("mənzil");
    await expect(listings.heading()).toBeVisible();
  });

  /**
   * Azərbaycan hərfləri ilə registrsiz axtarış `searchText` sütunu və
   * `normalizeSearchText()` ilə həll olunub: «Səbail» və «sebail» eyni nəticəni
   * verməlidir. D1 `mode: "insensitive"` dəstəkləmir, ona görə bu davranış
   * normallaşdırılmış sütundan asılıdır və reqressiyaya həssasdır.
   */
  test("diakritiksiz yazılış eyni nəticəni verir", async ({ page }) => {
    const listings = new ListingsPage(page);

    await listings.applyQuery({ [FILTER_PARAMS.search]: "Səbail" });
    const withDiacritics = (await listings.resultCount()) ?? 0;

    await listings.applyQuery({ [FILTER_PARAMS.search]: "sebail" });
    const withoutDiacritics = (await listings.resultCount()) ?? 0;

    expect(withoutDiacritics).toBe(withDiacritics);
  });

  test("böyük/kiçik hərf nəticəni dəyişmir", async ({ page }) => {
    const listings = new ListingsPage(page);

    await listings.applyQuery({ [FILTER_PARAMS.search]: "BAKI" });
    const upper = (await listings.resultCount()) ?? 0;
    await listings.applyQuery({ [FILTER_PARAMS.search]: "baki" });
    const lower = (await listings.resultCount()) ?? 0;

    expect(lower).toBe(upper);
  });

  test("nəticəsiz axtarış boş vəziyyət göstərir", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({ [FILTER_PARAMS.search]: "zzzqwertyuiopasdfgh" });

    await expect(listings.heading()).toBeVisible();
    expect(await listings.cardCount()).toBe(0);
  });
});

test.describe("Kataloq — sıralama", () => {
  test("qiymət artan sıralaması tətbiq olunur", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({ [FILTER_PARAMS.sort]: "qiymet_artan" });

    expect(queryParam(page, FILTER_PARAMS.sort)).toBe("qiymet_artan");
    await expect(listings.heading()).toBeVisible();
  });

  test("naməlum sıralama dəyəri səhifəni sındırmır", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({ [FILTER_PARAMS.sort]: "movcud-olmayan" });

    await expect(listings.heading()).toBeVisible();
  });
});

test.describe("Kataloq — səhifələmə", () => {
  test("ikinci səhifə fərqli elanlar göstərir", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();

    const total = (await listings.resultCount()) ?? 0;
    const firstPageCards = await listings.cardCount();
    test.skip(total <= firstPageCards, "səhifələmə üçün kifayət qədər məzmun yoxdur");

    const firstHrefs = await listings.cards().evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );

    await listings.applyQuery({ [FILTER_PARAMS.page]: "2" });
    const secondHrefs = await listings.cards().evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );

    expect(secondHrefs.length).toBeGreaterThan(0);
    // İki səhifədə eyni elan təkrarlanmamalıdır.
    const overlap = secondHrefs.filter((href) => firstHrefs.includes(href));
    expect(overlap, `təkrarlanan elanlar: ${overlap.join(", ")}`).toHaveLength(0);
  });

  test("mövcud olmayan səhifə nömrəsi çökmür", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({ [FILTER_PARAMS.page]: "99999" });

    await expect(listings.heading()).toBeVisible();
  });
});

test.describe("Kataloq — filtrlərin birləşməsi", () => {
  /**
   * Tarixi reqressiya: müstəqil filtrlər bir-birini `where.AND` sahəsində
   * üzərinə yazırdı — UI-da hər ikisi aktiv görünürdü, nəticə isə yanlış idi.
   * Burada URL səviyyəsində hamısının qorunduğu yoxlanılır.
   */
  test("çoxlu filtr eyni anda qorunur", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.applyQuery({
      [FILTER_PARAMS.listingType]: "SALE",
      [FILTER_PARAMS.type]: "menziller",
      [FILTER_PARAMS.rooms]: "3",
      [FILTER_PARAMS.minPrice]: "50000",
      [FILTER_PARAMS.sort]: "qiymet_artan",
    });

    expect(queryParam(page, FILTER_PARAMS.listingType)).toBe("SALE");
    expect(queryParam(page, FILTER_PARAMS.type)).toBe("menziller");
    expect(queryParam(page, FILTER_PARAMS.rooms)).toBe("3");
    expect(queryParam(page, FILTER_PARAMS.minPrice)).toBe("50000");
    expect(queryParam(page, FILTER_PARAMS.sort)).toBe("qiymet_artan");

    await expect(listings.heading()).toBeVisible();
  });

  test("filtr nəticəsi ümumi saydan çox ola bilməz", async ({ page }) => {
    const listings = new ListingsPage(page);
    await listings.open();
    const all = (await listings.resultCount()) ?? 0;
    test.skip(all === 0, "kataloq boşdur");

    await listings.applyQuery({
      [FILTER_PARAMS.listingType]: "SALE",
      [FILTER_PARAMS.rooms]: "2",
    });
    expect((await readResultCount(page)) ?? 0).toBeLessThanOrEqual(all);
  });
});
