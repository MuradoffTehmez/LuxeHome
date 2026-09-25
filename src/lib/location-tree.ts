import { LOCATION_KINDS } from "@/lib/constants";

/**
 * Yerləşmə ağacını düz siyahıdan quran köməkçilər.
 *
 * Niyə relation yüklənməsi deyil: Cloudflare D1 bir sorğuda **ən çox 100 bound
 * parametr** qəbul edir. Prisma nested `children` / `parent` relation-unu
 * `WHERE parentId IN (…)` sorğusu ilə yükləyir; adapter həmin siyahını 98-lik
 * hissələrə bölür, amma `where`-dəki əlavə şərtləri (`kind IN (…)`) saymır.
 * Rəsmi ağacda ~600 alt yer olduğu üçün sorğu `too many SQL variables` ilə
 * düşür və ana səhifə ilə `/emlaklar` 500 qaytarırdı (#74). Lokal miniflare-də
 * SQLite həddi böyükdür, ona görə bu, yalnız staging/production-da görünür.
 *
 * Buna görə yerlər `kind IN (…)` şərti ilə — parametr sayı sabit qalır — düz
 * oxunur, ağac isə burada qurulur.
 */

type FlatLocation = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  parentId: string | null;
};

type FilterLeaf = { name: string; slug: string; kind: string };
type FilterChild = FilterLeaf & { children: FilterLeaf[] };
type FilterCity = { name: string; slug: string; children: FilterChild[] };

/** SQLite-in `ORDER BY kind` (binary collation) sırası ilə eyni müqayisə. */
function compareKind(a: FlatLocation, b: FlatLocation): number {
  if (a.kind === b.kind) return 0;
  return a.kind < b.kind ? -1 : 1;
}

function groupByParent(locations: FlatLocation[]): Map<string, FlatLocation[]> {
  const byParent = new Map<string, FlatLocation[]>();
  for (const location of locations) {
    if (!location.parentId) continue;
    const siblings = byParent.get(location.parentId);
    if (siblings) siblings.push(location);
    else byParent.set(location.parentId, [location]);
  }
  return byParent;
}

/**
 * Filtr açılışı üçün şəhər → alt yer → alt-alt yer ağacı.
 *
 * `locations` `order` üzrə artan sırada gəlməlidir. Birinci səviyyə əvvəlcə
 * `kind`, sonra `order` üzrə düzülür (inzibati rayonlar qəsəbələrdən əvvəl),
 * ikinci səviyyə isə yalnız `order` üzrə — əvvəlki nested sorğunun
 * `orderBy`-ı ilə eyni.
 */
export function buildCityFilterTree(
  cities: Array<{ id: string; name: string; slug: string }>,
  locations: FlatLocation[],
): FilterCity[] {
  const byParent = groupByParent(locations);
  const toLeaf = ({ name, slug, kind }: FlatLocation): FilterLeaf => ({ name, slug, kind });

  return cities.map((city) => ({
    name: city.name,
    slug: city.slug,
    // `sort` stabildir, ona görə eyni `kind` daxilində `order` sırası qorunur.
    children: [...(byParent.get(city.id) ?? [])].sort(compareKind).map((child) => ({
      ...toLeaf(child),
      children: (byParent.get(child.id) ?? []).map(toLeaf),
    })),
  }));
}

/**
 * Elan formasının rayon siyahısı: hər yerə kök şəhəri (`cityId`) və açılışdakı
 * optgroup başlığı (`group`) əlavə olunur.
 *
 * Bakının qəsəbələri şəhərin deyil, inzibati rayonun uşağıdır — onlar üçün
 * `cityId` babadır, `group` isə rayonun adıdır. Valideyn eyni siyahıdan
 * tapılır, ayrıca `parent` relation sorğusu lazım olmur.
 */
export function withCityAndGroup<T extends FlatLocation>(
  locations: T[],
): Array<T & { cityId: string | null; group: string | null }> {
  const byId = new Map(locations.map((location) => [location.id, location]));
  return locations.map((location) => {
    const parent = location.parentId ? byId.get(location.parentId) : undefined;
    const parentIsDistrict = parent?.kind === LOCATION_KINDS.DISTRICT;
    return {
      ...location,
      cityId: parentIsDistrict ? parent.parentId : location.parentId,
      group: parentIsDistrict ? parent.name : null,
    };
  });
}
