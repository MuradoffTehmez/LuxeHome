import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `migrations/0031_official_location_tree.sql` tamlığını yoxlayır.
 *
 * Bu test repo fayllarını oxuyur, ona görə workerd-də deyil, Node layihəsində
 * işləyir (`vitest.config.mts` → `repo-node`).
 */
const root = new URL("../../", import.meta.url);

describe("0031 miqrasiyası", () => {
  const sql = readFileSync(
    new URL("migrations/0031_official_location_tree.sql", root),
    "utf8",
  );

  /**
   * Köhnə ağacda olub yenidə olmayan slug-lar. Hər biri ya köçürülməli, ya da
   * silinməlidir — əks halda mövcud bazada qalıb seçim siyahısında yeni qeydin
   * yanında görünər və elanlar səhv yerə bağlı qalar.
   */
  const removedSlugs = [
    "baki-bineqedi-qesebesi",
    "baki-goredil",
    "baki-kesle-qesebesi",
    "baki-pirallahi-qesebesi",
    "baki-qobustan-qesebesi",
    "baki-sengecal",
    "baki-yasamal-qesebesi",
    "metro-nariman-nerimanov",
    "xirdalan",
    "baki-novxani",
    "xirdalan-merkez",
    "xirdalan-masazir",
    "xirdalan-digah",
    "sumqayit-merkez",
    "qebele-merkez",
    "qebele-hemzeli",
    "seki-merkez",
    "quba-merkez",
    "quba-qriz",
  ];

  it("köhnə ağacdan silinən hər slug-a toxunur", () => {
    for (const slug of removedSlugs) {
      expect(sql, `${slug} miqrasiyada yoxdur`).toContain(`'${slug}'`);
    }
  });

  it("köçürmə hədəfləri miqrasiyanın özündə yaradılır", () => {
    // CI yalnız `migrations/` tətbiq edir, `taxonomy.sql`-i sonra — miqrasiya
    // hədəfsiz qalmamalıdır.
    for (const slug of [
      "abseron",
      "abseron-xirdalan",
      "abseron-novxani",
      "abseron-masazir",
      "abseron-digah",
      "abseron-goredil",
      "baki-kesle",
      "baki-qobustan",
      "baki-sanqacal",
      "metro-neriman-nerimanov",
    ]) {
      expect(sql, `${slug} üçün INSERT yoxdur`).toContain(`'loc_${slug}'`);
    }
  });

  it("hər köçürmə hədəfi yeni taksonomiyada mövcuddur", () => {
    const taxonomy = readFileSync(
      new URL("prisma/taxonomy.sql", root),
      "utf8",
    );
    const targets = [...sql.matchAll(/VALUES \('loc_([a-z0-9-]+)'/g)].map((match) => match[1]);
    expect(targets.length).toBeGreaterThan(5);
    for (const slug of targets) {
      expect(taxonomy, `${slug} taxonomy.sql-də yoxdur`).toContain(`'loc_${slug}'`);
    }
  });
});
