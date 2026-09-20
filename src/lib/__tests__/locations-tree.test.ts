import { describe, expect, it } from "vitest";
import { BAKU_DISTRICTS, CITIES, METRO_STATIONS, PLACES, REGIONS } from "../../../prisma/locations-data";
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
    expect(METRO_STATIONS).toHaveLength(26);
  });

  it("hər kind üçün göstərilən qısaltma təyin olunub", () => {
    for (const kind of Object.values(LOCATION_KINDS)) {
      expect(LOCATION_KIND_SUFFIX[kind]).toBeDefined();
    }
  });
});
