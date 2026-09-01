import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Nümunə (demo) məzmun rejiminin müqaviləsi.
 *
 * Rejim yalnız sorğu şərtində yaşayır: qeydlər bazadan silinmir, `isDemo`
 * bayrağı da dəyişmir. Buna görə üç davranış qorunmalıdır:
 *
 * 1. Rejim bağlı olanda ictimai şərt `isDemo: false` daşıyır — nümunə qeyd sızmır.
 * 2. Rejim açıq olanda həmin şərt düşür — nümunə qeydlər saytda görünür.
 * 3. Sitemap və SEO şərti rejimə **baxmır** — nümunə URL heç vaxt indeksləşmir.
 *
 * Üçüncüsü qəsdən ayrıca funksiyadır: rejim təqdimat üçün açıldıqda axtarış
 * sistemlərinə nümunə səhifə vermək, rejim söndürüləndən sonra qırıq indeks
 * qeydləri qoyardı.
 */

const settingValue = vi.hoisted(() => ({ current: null as string | null }));
const stagingFlag = vi.hoisted(() => ({ current: undefined as string | undefined }));

// `runtimeEnv` Cloudflare kontekstinə toxunur; testdə yalnız dəyər lazımdır.
vi.mock("@/lib/runtime-env", () => ({
  runtimeEnv: (name: string) => (name === "IS_STAGING" ? stagingFlag.current : undefined),
  hasRuntimeEnv: (name: string) => Boolean(name === "IS_STAGING" && stagingFlag.current),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { fields: { totalFloors: "__field:totalFloors__" } },
    setting: {
      findUnique: async () =>
        settingValue.current === null ? null : { value: settingValue.current },
    },
  },
}));

import { demoWhere, isDemoContentEnabled } from "../demo-content";
import { indexablePropertyWhere, publicPropertyWhere } from "../queries";

/**
 * `isDemoContentEnabled` React `cache()` ilə sarınıb — request scope-u olmayan
 * testdə çağırış nəticəsi keşlənir. Hər test öz dəyərini görsün deyə modul
 * qeydiyyatı sıfırlanır.
 */
async function withSetting(value: string | null, isStaging?: string) {
  settingValue.current = value;
  stagingFlag.current = isStaging;
  vi.resetModules();
  const demo = await import("../demo-content");
  const queries = await import("../queries");
  return { demo, queries };
}

beforeEach(() => {
  settingValue.current = null;
  stagingFlag.current = undefined;
  vi.resetModules();
});

describe("demoWhere — rejim bağlı", () => {
  it("nümunə qeydləri süzən şərt qaytarır", async () => {
    const { demo } = await withSetting(null);
    expect(await demo.demoWhere()).toEqual({ isDemo: false });
    expect(await demo.isDemoContentEnabled()).toBe(false);
  });

  it("«0» dəyəri də bağlı sayılır", async () => {
    const { demo } = await withSetting("0");
    expect(await demo.demoWhere()).toEqual({ isDemo: false });
  });

  it("gözlənilməz dəyər rejimi açmır", async () => {
    const { demo } = await withSetting("true");
    expect(await demo.demoWhere()).toEqual({ isDemo: false });
  });
});

describe("demoWhere — rejim açıq", () => {
  it("«1» dəyərində şərt düşür", async () => {
    const { demo } = await withSetting("1");
    expect(await demo.demoWhere()).toEqual({});
    expect(await demo.isDemoContentEnabled()).toBe(true);
  });
});

describe("mühit defoltu — açar heç yazılmayıb", () => {
  it("staging-də rejim açıq gəlir", async () => {
    const { demo } = await withSetting(null, "true");
    expect(await demo.isDemoContentEnabled()).toBe(true);
    expect(await demo.demoWhere()).toEqual({});
  });

  it("production-da rejim bağlı qalır", async () => {
    const { demo } = await withSetting(null, undefined);
    expect(await demo.isDemoContentEnabled()).toBe(false);
    expect(await demo.demoWhere()).toEqual({ isDemo: false });
  });
});

describe("paneldəki açar mühit defoltundan üstündür", () => {
  it("staging-də «0» yazılıbsa rejim bağlıdır", async () => {
    const { demo } = await withSetting("0", "true");
    expect(await demo.isDemoContentEnabled()).toBe(false);
    expect(await demo.demoWhere()).toEqual({ isDemo: false });
  });

  it("production-da «1» yazılıbsa rejim açıqdır", async () => {
    const { demo } = await withSetting("1", undefined);
    expect(await demo.isDemoContentEnabled()).toBe(true);
    expect(await demo.demoWhere()).toEqual({});
  });
});

describe("publicPropertyWhere — rejimə uyğunlaşır", () => {
  it("rejim bağlı olanda nümunə elanları süzür", async () => {
    const { queries } = await withSetting(null);
    const where = await queries.publicPropertyWhere();

    expect(where.isDemo).toBe(false);
    expect(where.deletedAt).toBeNull();
    expect(where.status).toEqual({ in: expect.arrayContaining(["PUBLISHED"]) });
  });

  it("rejim açıq olanda isDemo şərti qoymur", async () => {
    const { queries } = await withSetting("1");
    const where = await queries.publicPropertyWhere();

    expect(where.isDemo).toBeUndefined();
    // Digər ictimai qorumalar rejimdən asılı olmadan qalır
    expect(where.deletedAt).toBeNull();
    expect(where.status).toEqual({ in: expect.arrayContaining(["PUBLISHED"]) });
  });
});

describe("indexablePropertyWhere — sitemap qoruması", () => {
  it("rejim açıq olsa belə nümunə elanları kənarlaşdırır", async () => {
    const { queries } = await withSetting("1");
    expect(queries.indexablePropertyWhere().isDemo).toBe(false);
  });

  it("rejim bağlı olanda da eyni şərti qaytarır", async () => {
    const { queries } = await withSetting(null);
    expect(queries.indexablePropertyWhere().isDemo).toBe(false);
  });
});

describe("buildPropertyWhere — filtrlərlə birlikdə", () => {
  it("rejim açıq olanda filtr şərtləri qorunur, isDemo düşür", async () => {
    const { queries } = await withSetting("1");
    const where = await queries.buildPropertyWhere({ listingType: "RENT", rooms: 3 });

    expect(where.isDemo).toBeUndefined();
    expect(where.listingType).toBe("RENT");
    expect(where.rooms).toBe(3);
  });
});

// Modul səviyyəli idxalların işlədildiyini təsdiqləyir — istifadə olunmayan
// idxal lint xətası verərdi, davranış isə yuxarıdakı dinamik idxallarla yoxlanır.
describe("statik idxal", () => {
  it("modul ixracları mövcuddur", () => {
    expect(typeof demoWhere).toBe("function");
    expect(typeof isDemoContentEnabled).toBe("function");
    expect(typeof publicPropertyWhere).toBe("function");
    expect(typeof indexablePropertyWhere).toBe("function");
  });
});
