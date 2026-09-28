import { describe, expect, it } from "vitest";
import {
  BAKU_DISTRICTS,
  CITIES,
  LANDMARKS,
  LOCATION_ALIASES,
  METRO_STATIONS,
  PLACES,
  REGIONS,
} from "../../../prisma/locations-data";
import { LOCATION_CHILD_KINDS, LOCATION_KINDS, LOCATION_KIND_SUFFIX } from "@/lib/constants";

/**
 * Yerləşmə ağacının rəsmi inzibati-ərazi bölgüsünə uyğunluğunu qoruyur.
 *
 * Mənbə: «İnzibati Ərazi Bölgüsü Təsnifatı, 2024» — Dövlət Statistika Komitəsi
 * kollegiyasının 16.02.2024 tarixli 2/2 nömrəli qərarı
 * (https://e-qanun.az/framework/57325).
 *
 * `prisma/locations-data.ts` generasiya olunur, ona görə testlər generatorun
 * çıxışını yoxlayır — data faylı əl ilə redaktə edilsə burada sınar.
 */

/** `build-taxonomy-sql.ts`-dəki `slugify()` ilə eyni davranış. */
const AZ_TRANSLIT: Record<string, string> = {
  ə: "e", Ə: "e", ı: "i", İ: "i", ö: "o", Ö: "o", ü: "u", Ü: "u",
  ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g",
};

function slugify(input: string): string {
  return input
    .trim()
    .replace(/[əƏıİöÖüÜşŞçÇğĞ]/g, (ch) => AZ_TRANSLIT[ch] ?? ch)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

describe("rəsmi inzibati-ərazi bölgüsü", () => {
  it("11 respublika tabeli şəhər və 64 rayon saxlayır", () => {
    expect(CITIES).toHaveLength(11);
    expect(REGIONS).toHaveLength(64);
    expect(PLACES).toHaveLength(75);
  });

  it("Bakının 12 inzibati rayonu var", () => {
    expect(BAKU_DISTRICTS).toHaveLength(12);
    expect(BAKU_DISTRICTS.map((district) => district.name)).toEqual(
      expect.arrayContaining([
        "Binəqədi", "Nərimanov", "Nəsimi", "Nizami", "Qaradağ", "Sabunçu",
        "Səbail", "Suraxanı", "Xəzər", "Xətai", "Yasamal", "Pirallahı",
      ]),
    );
  });

  it("şəhərdaxili rayon yalnız Bakı və Gəncədə var", () => {
    const withDistricts = PLACES.filter((place) => place.districts?.length);
    expect(withDistricts.map((place) => place.name)).toEqual(["Bakı", "Gəncə"]);
  });

  it("rəsmi qəsəbə sayılmayan massivlər NEIGHBORHOOD kimi işarələnib", () => {
    // Rəsmi təsnifatda Nərimanov, Nəsimi və Yasamalda qəsəbə yoxdur.
    for (const name of ["Nərimanov", "Nəsimi", "Yasamal"]) {
      const district = BAKU_DISTRICTS.find((item) => item.name === name);
      expect(district, `${name} rayonu tapılmadı`).toBeDefined();
      expect(district!.places.every((place) => place.kind === LOCATION_KINDS.NEIGHBORHOOD)).toBe(true);
    }
  });

  it("Abşeronun yaşayış məntəqələri Bakıya bağlanmır", () => {
    const absheron = PLACES.find((place) => place.name === "Abşeron");
    expect(absheron).toBeDefined();
    const names = absheron!.places?.map((place) => place.name) ?? [];
    // 2026 auditində Novxanı və Görədil Bakının altında idi, Xırdalan isə
    // ayrıca respublika tabeli şəhər kimi durmuşdu.
    expect(names).toEqual(expect.arrayContaining(["Xırdalan", "Novxanı", "Görədil", "Masazır"]));

    const bakuChildren = BAKU_DISTRICTS.flatMap((district) => district.places.map((place) => place.name));
    for (const name of ["Novxanı", "Görədil", "Masazır", "Xırdalan", "Fatmayı"]) {
      expect(bakuChildren, `${name} Bakının altında qalıb`).not.toContain(name);
    }
  });

  it("Xırdalan birinci pillədə ayrıca şəhər kimi durmur", () => {
    expect(CITIES).not.toContain("Xırdalan");
    expect(REGIONS).not.toContain("Xırdalan");
  });

  it("uydurma «Mərkəz» rayonu yoxdur", () => {
    const every = PLACES.flatMap((place) => [
      ...(place.districts ?? []).flatMap((district) => [district.name, ...district.places.map((p) => p.name)]),
      ...(place.places ?? []).map((place2) => place2.name),
    ]);
    expect(every).not.toContain("Mərkəz");
  });

  it("slug-lar bütün ağac boyu unikaldır", () => {
    const slugs: string[] = [];
    for (const place of PLACES) {
      const top = slugify(place.name);
      slugs.push(top);
      for (const district of place.districts ?? []) {
        slugs.push(`${top}-${slugify(district.name)}`);
        for (const child of district.places) slugs.push(`${top}-${slugify(child.name)}`);
      }
      for (const child of place.places ?? []) slugs.push(`${top}-${slugify(child.name)}`);
    }
    for (const station of METRO_STATIONS) slugs.push(`metro-${slugify(station)}`);
    for (const landmark of LANDMARKS) slugs.push(`nisangah-${slugify(landmark)}`);

    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    expect(duplicates).toEqual([]);
  });

  it("eyni adlı yerlər valideyn prefiksi ilə ayrılır", () => {
    // «İstisu» rəsmi siyahıda üç yerdə var — prefiks olmasaydı toqquşardı.
    const withIstisu = PLACES.filter((place) =>
      place.places?.some((child) => child.name === "İstisu"),
    ).map((place) => place.name);
    expect(withIstisu.length).toBeGreaterThan(1);
  });

  it("hər alt-yerin kind dəyəri filtrdə seçilə bilir", () => {
    const children = PLACES.flatMap((place) => [
      ...(place.districts ?? []).flatMap((district) => district.places),
      ...(place.places ?? []),
    ]);
    expect(children.length).toBeGreaterThan(500);
    for (const child of children) {
      expect(LOCATION_CHILD_KINDS).toContain(child.kind);
    }
  });

  it("metro filtr açılışına düşən səviyyələrdən kənardadır", () => {
    // Metro Bakının uşağıdır; rayon açılışında görünsəydi siyahı korlanardı.
    expect(LOCATION_CHILD_KINDS).not.toContain(LOCATION_KINDS.METRO);
    // Bakı metrosunun 27 stansiyası (bənövşəyi xəttin «Memar Əcəmi-2»si daxil).
    expect(METRO_STATIONS).toHaveLength(27);
    expect(METRO_STATIONS).toContain("Memar Əcəmi-2");
  });

  it("nişangah filtr açılışına düşmür və ad təkrarı yoxdur", () => {
    expect(LOCATION_CHILD_KINDS).not.toContain(LOCATION_KINDS.LANDMARK);
    expect(LANDMARKS.length).toBeGreaterThan(200);
    expect(new Set(LANDMARKS).size).toBe(LANDMARKS.length);
    // Massiv və metro ilə eyni obyekt nişangah kimi təkrar yazılmır.
    const hoods = BAKU_DISTRICTS.flatMap((district) => district.places.map((place) => place.name));
    for (const name of LANDMARKS) {
      expect(hoods, `${name} həm massiv, həm nişangahdır`).not.toContain(name);
      expect(METRO_STATIONS, `${name} həm metro, həm nişangahdır`).not.toContain(name);
    }
  });

  it("hər kind üçün göstərilən qısaltma təyin olunub", () => {
    for (const kind of Object.values(LOCATION_KINDS)) {
      expect(LOCATION_KIND_SUFFIX[kind]).toBeDefined();
    }
  });
});

describe("Bakı üzrə rəsmi kodlar və bazar massivləri", () => {
  const district = (name: string) => {
    const found = BAKU_DISTRICTS.find((item) => item.name === name);
    if (!found) throw new Error(`${name} rayonu tapılmadı`);
    return found;
  };
  const namesIn = (name: string) => district(name).places.map((place) => place.name);

  it("hər rayon və rəsmi qəsəbə Ünvan Reyestrinin kodunu daşıyır, massiv isə yox", () => {
    for (const item of BAKU_DISTRICTS) {
      expect(item.code, item.name).toMatch(/^\d{8}$/);
      for (const place of item.places) {
        if (place.kind === LOCATION_KINDS.SETTLEMENT) expect(place.code, place.name).toMatch(/^\d{8}$/);
        else expect(place.code, place.name).toBeUndefined();
      }
    }
  });

  it("rayonla eyniadlı qəsəbə çıxılmaqla 59 rəsmi qəsəbənin hamısı yerindədir", () => {
    const settlements = BAKU_DISTRICTS.flatMap((item) =>
      item.places.filter((place) => place.kind === LOCATION_KINDS.SETTLEMENT),
    );
    // Binəqədi, Qaradağ, Sabunçu və Pirallahı qəsəbələri rayonun özü ilə eyni seçimdir.
    expect(settlements).toHaveLength(59 - 4);
    expect(new Set(settlements.map((place) => place.code)).size).toBe(settlements.length);
  });

  it("massivlər bazarda və OSM sərhədlərində olduğu rayondadır", () => {
    expect(namesIn("Nizami")).toContain("8-ci kilometr");
    expect(namesIn("Binəqədi")).not.toContain("8-ci kilometr");
    expect(namesIn("Suraxanı")).toEqual(expect.arrayContaining(["Günəşli", "Yeni Günəşli", "Bahar"]));
    expect(namesIn("Binəqədi")).not.toContain("Günəşli");
    expect(namesIn("Binəqədi")).toEqual(
      expect.arrayContaining(["6-cı mikrorayon", "7-ci mikrorayon", "8-ci mikrorayon", "9-cu mikrorayon"]),
    );
    expect(namesIn("Nəsimi")).not.toContain("6-cı mikrorayon");
    expect(namesIn("Nəsimi")).toEqual(expect.arrayContaining(["1-ci mikrorayon", "5-ci mikrorayon", "Kubinka"]));
    expect(namesIn("Yasamal")).toEqual(expect.arrayContaining(["Yeni Yasamal", "2-ci Alatava", "Sovetski"]));
    expect(namesIn("Xətai")).toEqual(expect.arrayContaining(["Ağ şəhər", "Köhnə Günəşli", "NZS"]));
    expect(namesIn("Xəzər")).toEqual(expect.arrayContaining(["Zağulba", "Şimal DRES", "Dübəndi"]));
  });

  it("Bilgəh Sabunçunun, Gürgən Pirallahının qəsəbəsidir", () => {
    expect(namesIn("Sabunçu")).toContain("Bilgəh");
    expect(namesIn("Xəzər")).not.toContain("Bilgəh");
    expect(namesIn("Pirallahı")).toContain("Gürgən");
  });

  it("gündəlik yazılışlar rəsmi ada alias kimi bağlanır, ayrıca yer yaratmır", () => {
    expect(LOCATION_ALIASES["Müşviqabad"]).toContain("Müşfiqabad");
    expect(LOCATION_ALIASES["Sanqaçal"]).toContain("Səngəçal");
    expect(LOCATION_ALIASES["M.Ə.Rəsulzadə"]).toContain("Kirov qəsəbəsi");
    const qaradag = namesIn("Qaradağ");
    expect(qaradag).toContain("Müşviqabad");
    expect(qaradag).not.toContain("Müşfiqabad");
  });

  it("Naxçıvan şəhərinin rəsmi kəndləri Ünvan Reyestrindən gəlir", () => {
    const nakhchivan = PLACES.find((place) => place.name === "Naxçıvan");
    const names = nakhchivan?.places?.map((place) => place.name) ?? [];
    expect(names).toEqual(expect.arrayContaining(["Əliabad", "Bulqan", "Qaraxanbəyli", "Tumbul"]));
  });
});

describe("ölkə üzrə Ünvan Reyestri", () => {
  it("hər şəhər və rayon rəsmi kod daşıyır", () => {
    for (const place of PLACES) {
      expect(place.code, place.name).toMatch(/^\d{8}$/);
    }
  });

  it("reyestrin kənd siyahısı bütün rayonlara yazılıb", () => {
    const villages = PLACES.flatMap((place) => (place.places ?? []).filter((child) => child.kind === LOCATION_KINDS.VILLAGE));
    // Reyestrdə ~3 630 kənd var; DSK-dakı köhnə yazılışlar da saxlanılır.
    expect(villages.length).toBeGreaterThan(3500);
    const coded = villages.filter((village) => village.code);
    expect(coded.length / villages.length).toBeGreaterThan(0.99);
    const quba = PLACES.find((place) => place.name === "Quba");
    expect(quba?.places?.map((child) => child.name)).toEqual(expect.arrayContaining(["Xınalıq", "Qəçrəş"]));
  });

  it("Sumqayıtın mikrorayon və məhəllələri massiv kimi şəhərə bağlanır", () => {
    const sumqayit = PLACES.find((place) => place.name === "Sumqayıt");
    const hoods = (sumqayit?.places ?? []).filter((child) => child.kind === LOCATION_KINDS.NEIGHBORHOOD);
    expect(hoods.map((child) => child.name)).toEqual(
      expect.arrayContaining(["1-ci mikrorayon", "21-ci mikrorayon", "9-cu məhəllə", "52-ci məhəllə", "Yeni Corat"]),
    );
    // Rəsmi qəsəbələr massiv kimi təkrarlanmır.
    expect(hoods.map((child) => child.name)).not.toContain("Corat");
    expect(LOCATION_ALIASES["Corat"]).toContain("Köhnə Corat");
  });
});
