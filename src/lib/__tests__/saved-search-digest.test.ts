import { describe, expect, it } from "vitest";
import {
  isDigestDue,
  runSavedSearchDigest,
  type DigestProperty,
  type DigestSavedSearch,
  type DigestStore,
} from "../saved-search-digest";

const NOW = new Date("2026-08-27T08:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function property(overrides: Partial<DigestProperty> = {}): DigestProperty {
  return {
    id: "property-1",
    title: "Yasamalda 3 otaqlı mənzil",
    slug: "yasamalda-3-otaqli-menzil",
    price: 185_000,
    currency: "AZN",
    imageUrl: "/media/emlaklar/2026/08/abc.webp",
    ...overrides,
  };
}

function search(overrides: Partial<DigestSavedSearch> = {}): DigestSavedSearch {
  return {
    id: "search-1",
    userId: "user-1",
    name: "Yasamal 3 otaqlı",
    frequency: "DAILY",
    lastNotifiedAt: null,
    user: { email: "user1@example.com", locale: "az" },
    ...overrides,
  };
}

/** Saxta store — Prisma-ya toxunmur, hər addımı qeyd edir. */
function createFakeStore(overrides: Partial<DigestStore> = {}) {
  const calls = {
    sendDigestEmail: [] as unknown[],
    markNotified: [] as unknown[],
    markChecked: [] as unknown[],
  };

  const store: DigestStore = {
    findDigestSavedSearches: async () => [],
    findPendingMatches: async () => [property()],
    countPendingMatches: async () => 1,
    sendDigestEmail: async (input) => {
      calls.sendDigestEmail.push(input);
    },
    markNotified: async (savedSearchId, propertyIds, at) => {
      calls.markNotified.push({ savedSearchId, propertyIds, at });
    },
    markChecked: async (savedSearchId, at) => {
      calls.markChecked.push({ savedSearchId, at });
    },
    ...overrides,
  };

  return { store, calls };
}

describe("isDigestDue", () => {
  it("IMMEDIATE və OFF tezlikləri digest-ə düşmür", () => {
    expect(isDigestDue("IMMEDIATE", null, NOW)).toBe(false);
    expect(isDigestDue("OFF", null, NOW)).toBe(false);
  });

  it("heç vaxt göndərilməyibsə vaxtı çatmış sayılır", () => {
    expect(isDigestDue("DAILY", null, NOW)).toBe(true);
    expect(isDigestDue("WEEKLY", null, NOW)).toBe(true);
  });

  it("gündəlik tezlik 24 saatdan tez göndərilmir", () => {
    expect(isDigestDue("DAILY", new Date(NOW.getTime() - 23 * 60 * 60 * 1000), NOW)).toBe(false);
    expect(isDigestDue("DAILY", new Date(NOW.getTime() - DAY), NOW)).toBe(true);
  });

  it("həftəlik tezlik 7 gündən tez göndərilmir", () => {
    expect(isDigestDue("WEEKLY", new Date(NOW.getTime() - 6 * DAY), NOW)).toBe(false);
    expect(isDigestDue("WEEKLY", new Date(NOW.getTime() - 7 * DAY), NOW)).toBe(true);
  });
});

describe("runSavedSearchDigest", () => {
  it("yeni nəticəsi olan axtarış üçün tək məktub göndərir", async () => {
    const { store, calls } = createFakeStore({
      findDigestSavedSearches: async () => [search()],
      findPendingMatches: async () => [property({ id: "p1" }), property({ id: "p2" })],
      countPendingMatches: async () => 2,
    });

    const result = await runSavedSearchDigest(store, NOW);

    expect(result).toEqual({ checked: 1, sent: 1, failed: 0 });
    expect(calls.sendDigestEmail).toHaveLength(1);
    expect(calls.sendDigestEmail[0]).toMatchObject({
      email: "user1@example.com",
      locale: "az",
      searchName: "Yasamal 3 otaqlı",
      frequency: "DAILY",
      totalCount: 2,
    });
    expect(calls.markNotified).toEqual([
      { savedSearchId: "search-1", propertyIds: ["p1", "p2"], at: NOW },
    ]);
  });

  it("yeni nəticə yoxdursa məktub göndərmir, yalnız «yoxlandı» damgası qoyur", async () => {
    const { store, calls } = createFakeStore({
      findDigestSavedSearches: async () => [search()],
      findPendingMatches: async () => [],
    });

    const result = await runSavedSearchDigest(store, NOW);

    expect(result).toEqual({ checked: 1, sent: 0, failed: 0 });
    expect(calls.sendDigestEmail).toHaveLength(0);
    expect(calls.markChecked).toEqual([{ savedSearchId: "search-1", at: NOW }]);
  });

  it("vaxtı çatmamış axtarışa toxunmur", async () => {
    const { store, calls } = createFakeStore({
      findDigestSavedSearches: async () => [
        search({ lastNotifiedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000) }),
      ],
    });

    const result = await runSavedSearchDigest(store, NOW);

    expect(result).toEqual({ checked: 0, sent: 0, failed: 0 });
    expect(calls.sendDigestEmail).toHaveLength(0);
    expect(calls.markChecked).toHaveLength(0);
  });

  it("istifadəçinin dilini məktuba ötürür", async () => {
    const { store, calls } = createFakeStore({
      findDigestSavedSearches: async () => [
        search({ frequency: "WEEKLY", user: { email: "ru@example.com", locale: "ru" } }),
      ],
    });

    await runSavedSearchDigest(store, NOW);

    expect(calls.sendDigestEmail[0]).toMatchObject({ locale: "ru", frequency: "WEEKLY" });
  });

  it("bir göndərişin çökməsi qalan axtarışları dayandırmır", async () => {
    let attempt = 0;
    const { store, calls } = createFakeStore({
      findDigestSavedSearches: async () => [
        search({ id: "search-fails" }),
        search({ id: "search-ok" }),
      ],
      sendDigestEmail: async (input) => {
        attempt += 1;
        if (attempt === 1) throw new Error("Resend unavailable");
        calls.sendDigestEmail.push(input);
      },
    });

    const result = await runSavedSearchDigest(store, NOW);

    expect(result).toEqual({ checked: 2, sent: 1, failed: 1 });
    expect(calls.markNotified).toEqual([
      { savedSearchId: "search-ok", propertyIds: ["property-1"], at: NOW },
    ]);
  });

  it("göndəriş uğursuz olarsa uyğunluqları möhürləmir — növbəti işləmə yenidən cəhd edir", async () => {
    const { store, calls } = createFakeStore({
      findDigestSavedSearches: async () => [search()],
      sendDigestEmail: async () => {
        throw new Error("Resend unavailable");
      },
    });

    await runSavedSearchDigest(store, NOW);

    expect(calls.markNotified).toHaveLength(0);
    expect(calls.markChecked).toHaveLength(0);
  });
});
