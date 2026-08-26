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
    user: { email: "user1@example.com" },
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
    sendImmediateEmail: async (userEmail, property, searchName) => {
      calls.sendImmediateEmail.push({ userEmail, property, searchName });
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
        title: '"Yasamal 3 otaqlı" axtarışına uyğun yeni elan',
        content: PROPERTY.title,
        actionUrl: `/emlaklar/${PROPERTY.slug}`,
      },
    ]);
    expect(calls.sendImmediateEmail).toEqual([
      { userEmail: "user1@example.com", property: PROPERTY, searchName: "Yasamal 3 otaqlı" },
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
});
