import { describe, expect, it } from "vitest";
import { LOCATION_KINDS } from "@/lib/constants";
import { buildCityFilterTree, withCityAndGroup } from "@/lib/location-tree";

/**
 * Yerləşmə ağacı D1-dən düz siyahı kimi oxunur və burada qurulur (#74).
 * Nested relation yüklənməsi `WHERE parentId IN (…)` yaradır və rəsmi ağacın
 * ~600 alt yeri D1-in 100 parametr həddini aşır — lokal miniflare bunu tutmur.
 */

const baku = { id: "c-baku", name: "Bakı", slug: "baki" };
const ganja = { id: "c-ganja", name: "Gəncə", slug: "gence" };
const absheron = { id: "c-abs", name: "Abşeron", slug: "abseron" };

// `order` üzrə artan sıra ilə — sorğu belə qaytarır.
const flat = [
  { id: "s-mastaga", name: "Maştağa", slug: "baki-mastaga", kind: LOCATION_KINDS.SETTLEMENT, parentId: "d-sabuncu" },
  { id: "d-sabuncu", name: "Sabunçu", slug: "baki-sabuncu", kind: LOCATION_KINDS.DISTRICT, parentId: "c-baku" },
  { id: "s-xirdalan", name: "Xırdalan", slug: "abseron-xirdalan", kind: LOCATION_KINDS.SETTLEMENT, parentId: "c-abs" },
  { id: "n-8km", name: "8-ci kilometr", slug: "baki-8-ci-kilometr", kind: LOCATION_KINDS.NEIGHBORHOOD, parentId: "d-nizami" },
  { id: "d-nizami", name: "Nizami", slug: "baki-nizami", kind: LOCATION_KINDS.DISTRICT, parentId: "c-baku" },
  { id: "v-novxani", name: "Novxanı", slug: "abseron-novxani", kind: LOCATION_KINDS.VILLAGE, parentId: "c-abs" },
  { id: "s-buzovna", name: "Buzovna", slug: "baki-buzovna", kind: LOCATION_KINDS.SETTLEMENT, parentId: "d-xezer" },
  { id: "d-xezer", name: "Xəzər", slug: "baki-xezer", kind: LOCATION_KINDS.DISTRICT, parentId: "c-baku" },
  { id: "s-bilgah", name: "Bilgəh", slug: "baki-bilgeh", kind: LOCATION_KINDS.SETTLEMENT, parentId: "d-sabuncu" },
];

describe("buildCityFilterTree()", () => {
  const tree = buildCityFilterTree([baku, ganja, absheron], flat);

  it("şəhər sırasını qoruyur və uşağı olmayan şəhərə boş siyahı verir", () => {
    expect(tree.map((city) => city.slug)).toEqual(["baki", "gence", "abseron"]);
    expect(tree[1].children).toEqual([]);
  });

  it("Bakının qəsəbələrini inzibati rayonun altında üçüncü səviyyə kimi verir", () => {
    const sabuncu = tree[0].children.find((child) => child.slug === "baki-sabuncu");
    expect(sabuncu?.children.map((place) => place.slug)).toEqual(["baki-mastaga", "baki-bilgeh"]);
    expect(sabuncu?.children[0]).toEqual({ name: "Maştağa", slug: "baki-mastaga", kind: LOCATION_KINDS.SETTLEMENT });
  });

  it("birinci səviyyəni əvvəlcə kind, sonra order üzrə düzür", () => {
    const abs = tree[2].children.map((child) => `${child.kind}:${child.slug}`);
    // SETTLEMENT < VILLAGE (binary sıra), order isə eyni kind daxilində saxlanır.
    expect(abs).toEqual([
      `${LOCATION_KINDS.SETTLEMENT}:abseron-xirdalan`,
      `${LOCATION_KINDS.VILLAGE}:abseron-novxani`,
    ]);
    expect(tree[0].children.map((child) => child.slug)).toEqual(["baki-sabuncu", "baki-nizami", "baki-xezer"]);
  });

  it("əvvəlki nested sorğu ilə eyni sahə dəstini qaytarır (id/parentId sızmır)", () => {
    expect(Object.keys(tree[0]).sort()).toEqual(["children", "name", "slug"]);
    expect(Object.keys(tree[0].children[0]).sort()).toEqual(["children", "kind", "name", "slug"]);
  });
});

describe("withCityAndGroup()", () => {
  const rows = withCityAndGroup(flat);
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  it("inzibati rayonun uşağı üçün kök şəhəri babadan götürür və qrup başlığı verir", () => {
    expect(bySlug.get("baki-mastaga")).toMatchObject({ cityId: "c-baku", group: "Sabunçu" });
  });

  it("şəhərin birbaşa uşağı üçün valideyni saxlayır, qrup vermir", () => {
    expect(bySlug.get("baki-sabuncu")).toMatchObject({ cityId: "c-baku", group: null });
    expect(bySlug.get("abseron-xirdalan")).toMatchObject({ cityId: "c-abs", group: null });
  });
});
