import { describe, expect, it } from "vitest";
import { runSavedSearchMatching, type SavedSearchMatchStore } from "../queries";

const PROPERTY = { title: "Yasamalda 3 otaqlı mənzil", slug: "yasamalda-3-otaqli-menzil" };

type ActiveSearch = Awaited<ReturnType<SavedSearchMatchStore["findActiveSavedSearches"]>>[number];

function search(overrides: Partial<ActiveSearch> = {}): ActiveSearch {
  return {
    id: "search-1",
    userId: "user-1",
    name: "Yasamal 3 otaqlı",
    filters: JSON.stringify({ districtSlug: "yasamal", rooms: 3 }),
    frequency: "DAILY",
    user: { email: "user1@example.com", locale: "az" },
    ...overrides,
  };
}

/** Saxta store — heç bir çağırışı real Prisma-ya toxundurmur, hər addımı qeyd edir. */
function createFakeStore(overrides: Partial<SavedSearchMatchStore> = {}) {
  const calls = {
    matchesFilters: [] as unknown[],
    recordMatch: [] as unknown[],
    createNotification: [] as unknown[],
    sendImmediateEmail: [] as unknown[],
    notificationCopy: [] as unknown[],
  };

  const store: SavedSearchMatchStore = {
    findActiveSavedSearches: async () => [],
    matchesFilters: async (filters, propertyId) => {
      calls.matchesFilters.push({ filters, propertyId });
      return true;
    },
    recordMatch: async (savedSearchId, propertyId) => {
      calls.recordMatch.push({ savedSearchId, propertyId });
      return true;
    },
    getProperty: async () => PROPERTY,
    createNotification: async (input) => {
      calls.createNotification.push(input);
    },
    notificationCopy: async (locale, searchName) => {
      calls.notificationCopy.push({ locale, searchName });
      // Real store `next-intl`-dən oxuyur; testdə dil açıq şəkildə görünsün deyə
      // sadə şablon işlədilir
      return { title: `[${locale}] ${searchName}` };
    },
    sendImmediateEmail: async (userEmail, locale, property, searchName) => {
      calls.sendImmediateEmail.push({ userEmail, locale, property, searchName });
    },
    ...overrides,
  };

  return { store, calls };
}

describe("saxlanmış axtarış uyğunluq mühərriki", () => {
  it("uyğun gələn IMMEDIATE axtarış üçün bildiriş yaradır və dərhal e-poçt göndərir", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [search({ frequency: "IMMEDIATE" })],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.createNotification).toEqual([
      {
        userId: "user-1",
        type: "SAVED_SEARCH_MATCH",
        title: "[az] Yasamal 3 otaqlı",
        content: PROPERTY.title,
        // Dil prefiksi qəsdən yoxdur — link klik anında lokallaşdırılır
        actionUrl: `/emlaklar/${PROPERTY.slug}`,
      },
    ]);
    expect(calls.sendImmediateEmail).toEqual([
      {
        userEmail: "user1@example.com",
        locale: "az",
        property: PROPERTY,
        searchName: "Yasamal 3 otaqlı",
      },
    ]);
  });

  it("uyğun gələn DAILY axtarış üçün bildiriş yaradır, lakin e-poçt göndərmir", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [search({ frequency: "DAILY" })],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.createNotification).toHaveLength(1);
    expect(calls.sendImmediateEmail).toHaveLength(0);
  });

  it("sayt bildirişi söndürülübsə yalnız e-poçt göndərir", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [
        search({
          frequency: "IMMEDIATE",
          user: {
            email: "user1@example.com",
            locale: "az",
            notificationPreference: {
              savedSearchEmail: true,
              savedSearchWeb: false,
              savedSearchPush: false,
            },
          },
        }),
      ],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.createNotification).toHaveLength(0);
    expect(calls.sendImmediateEmail).toHaveLength(1);
  });

  it("e-poçt söndürülübsə yalnız sayt bildirişi yaradır", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [
        search({
          frequency: "IMMEDIATE",
          user: {
            email: "user1@example.com",
            locale: "az",
            notificationPreference: {
              savedSearchEmail: false,
              savedSearchWeb: true,
              savedSearchPush: false,
            },
          },
        }),
      ],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.createNotification).toHaveLength(1);
    expect(calls.sendImmediateEmail).toHaveLength(0);
  });

  it("uyğun gəlməyən axtarış üçün heç nə yaratmır", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [search()],
      matchesFilters: async () => false,
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.recordMatch).toHaveLength(0);
    expect(calls.createNotification).toHaveLength(0);
    expect(calls.sendImmediateEmail).toHaveLength(0);
  });

  it("artıq bildirilmiş uyğunluq üçün bildirişi təkrar yaratmır", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [search({ frequency: "IMMEDIATE" })],
      recordMatch: async () => false,
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.createNotification).toHaveLength(0);
    expect(calls.sendImmediateEmail).toHaveLength(0);
  });

  it("bozuq JSON filtri digər saxlanmış axtarışların yoxlanmasını dayandırmır", async () => {
    const goodSearch = search({ id: "search-good", userId: "user-good" });
    const brokenSearch = search({
      id: "search-broken",
      userId: "user-broken",
      filters: "{ bu düzgün JSON deyil",
    });
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [brokenSearch, goodSearch],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.matchesFilters).toEqual([
      { filters: JSON.parse(goodSearch.filters), propertyId: "property-1" },
    ]);
    expect(calls.createNotification).toHaveLength(1);
    expect((calls.createNotification[0] as { userId: string }).userId).toBe("user-good");
  });

  it("rus dilli istifadəçiyə bildiriş onun dilində yazılır", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [
        search({ user: { email: "user1@example.com", locale: "ru" } }),
      ],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.notificationCopy).toEqual([{ locale: "ru", searchName: "Yasamal 3 otaqlı" }]);
    expect((calls.createNotification[0] as { title: string }).title).toBe("[ru] Yasamal 3 otaqlı");
  });

  it("OFF tezliyi üçün nə uyğunluq qeyd edir, nə bildiriş yaradır", async () => {
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [search({ frequency: "OFF" })],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.matchesFilters).toHaveLength(0);
    expect(calls.recordMatch).toHaveLength(0);
    expect(calls.createNotification).toHaveLength(0);
  });

  it("sxemə uyğun gəlməyən filtr (obyekt dəyər) digərlərini dayandırmır", async () => {
    // Saxta POST ilə göndərilə bilən forma: `citySlug` sətir yerinə obyektdir
    const poisoned = search({
      id: "search-poisoned",
      userId: "user-poisoned",
      filters: JSON.stringify({ citySlug: { contains: "bak" } }),
    });
    const healthy = search({ id: "search-good", userId: "user-good" });
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [poisoned, healthy],
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.matchesFilters).toHaveLength(1);
    expect((calls.createNotification[0] as { userId: string }).userId).toBe("user-good");
  });

  it("bir axtarışda istisna baş verərsə sonrakılar yenə işlənir", async () => {
    const failing = search({ id: "search-fails", userId: "user-fails" });
    const healthy = search({ id: "search-good", userId: "user-good" });
    const { store, calls } = createFakeStore({
      findActiveSavedSearches: async () => [failing, healthy],
      matchesFilters: async (_filters, propertyId) => {
        calls.matchesFilters.push({ propertyId });
        // İlk çağırış çökür — əvvəl bu, bütün döngəni dayandırırdı
        if (calls.matchesFilters.length === 1) throw new Error("D1 unavailable");
        return true;
      },
    });

    await runSavedSearchMatching("property-1", store);

    expect(calls.matchesFilters).toHaveLength(2);
    expect(calls.createNotification).toHaveLength(1);
    expect((calls.createNotification[0] as { userId: string }).userId).toBe("user-good");
  });
});
