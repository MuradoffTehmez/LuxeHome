"""
Yerləşmə ağacının TypeScript data faylını (`prisma/locations-data.ts`) qurur.

Girişlər (hamısı `prisma/` altındadır):
- `az-admin-divisions.json` — Dövlət Statistika Komitəsinin «İnzibati Ərazi
  Bölgüsü Təsnifatı, 2024» sənədindən çıxarış (e-qanun.az/framework/57325).
- `unvanportali-admin-units.json` — Ünvan Reyestri (unvanportali.az) üzrə Bakı
  və Abşeronun rəsmi rayon → qəsəbə/kənd ağacı və rəsmi kodları. Bakının
  rayon bölgüsü buradan götürülür və DSK siyahısı ilə çarpaz yoxlanılır.
- `baku-market-locations.json` — rəsmi vahid olmayan, amma elanlarda işlənən
  massiv/mikrorayon adları, metro, nişangahlar və alternativ yazılışlar.
  Mənbələr (bina.az, kub.az, arenda.az, yeniemlak.az, lalafo.az) və rayon
  yoxlaması `docs/erazi/baki-erazi-bolgusu.md`-də təsvir olunub.

Ziddiyyət tapılanda skript dayanır — səhvi SQL tətbiq olunandan sonra tapmaq
çətindir.

İşlətmə: python scripts/build-locations-data.py
"""

import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRISMA = os.path.join(ROOT, "prisma")
SRC = os.path.join(PRISMA, "az-admin-divisions.json")
UNITS = os.path.join(PRISMA, "unvanportali-admin-units.json")
MARKET = os.path.join(PRISMA, "baku-market-locations.json")
OUT = os.path.join(PRISMA, "locations-data.ts")

# Respublika tabeli şəhərlər. Lənkəran, Şəki və Yevlax rəsmi təsnifatda həm
# şəhər, həm eyniadlı rayondur — saytda tək qeyd kimi saxlanılır.
CITY_TIER = [
    "BAKI", "GƏNCƏ", "SUMQAYIT", "MİNGƏÇEVİR", "ŞİRVAN", "NAFTALAN",
    "NAXÇIVAN", "XANKƏNDİ", "LƏNKƏRAN", "ŞƏKİ", "YEVLAX",
]

DISPLAY = {
    "BAKI": "Bakı", "GƏNCƏ": "Gəncə", "SUMQAYIT": "Sumqayıt",
    "MİNGƏÇEVİR": "Mingəçevir", "ŞİRVAN": "Şirvan", "NAFTALAN": "Naftalan",
    "NAXÇIVAN": "Naxçıvan", "XANKƏNDİ": "Xankəndi", "LƏNKƏRAN": "Lənkəran",
    "ŞƏKİ": "Şəki", "YEVLAX": "Yevlax", "ABŞERON": "Abşeron",
    "AĞCABƏDİ": "Ağcabədi", "AĞDAM": "Ağdam", "AĞDAŞ": "Ağdaş",
    "AĞDƏRƏ": "Ağdərə", "AĞSTAFA": "Ağstafa", "AĞSU": "Ağsu",
    "ASTARA": "Astara", "BABƏK": "Babək", "BALAKƏN": "Balakən",
    "BEYLƏQAN": "Beyləqan", "BƏRDƏ": "Bərdə", "BİLƏSUVAR": "Biləsuvar",
    "CƏBRAYIL": "Cəbrayıl", "CƏLİLABAD": "Cəlilabad", "CULFA": "Culfa",
    "DAŞKƏSƏN": "Daşkəsən", "FÜZULİ": "Füzuli", "GƏDƏBƏY": "Gədəbəy",
    "GORANBOY": "Goranboy", "GÖYÇAY": "Göyçay", "GÖYGÖL": "Göygöl",
    "HACIQABUL": "Hacıqabul", "İMİŞLİ": "İmişli", "İSMAYILLI": "İsmayıllı",
    "KƏLBƏCƏR": "Kəlbəcər", "KƏNGƏRLİ": "Kəngərli", "KÜRDƏMİR": "Kürdəmir",
    "QAX": "Qax", "QAZAX": "Qazax", "QƏBƏLƏ": "Qəbələ",
    "QOBUSTAN": "Qobustan", "QUBA": "Quba", "QUBADLI": "Qubadlı",
    "QUSAR": "Qusar", "LAÇIN": "Laçın", "LERİK": "Lerik",
    "MASALLI": "Masallı", "NEFTÇALA": "Neftçala", "OĞUZ": "Oğuz",
    "ORDUBAD": "Ordubad", "SAATLI": "Saatlı", "SABİRABAD": "Sabirabad",
    "SALYAN": "Salyan", "SAMUX": "Samux", "SƏDƏRƏK": "Sədərək",
    "SİYƏZƏN": "Siyəzən", "ŞABRAN": "Şabran", "ŞAHBUZ": "Şahbuz",
    "ŞAMAXI": "Şamaxı", "ŞƏMKİR": "Şəmkir", "ŞƏRUR": "Şərur",
    "ŞUŞA": "Şuşa", "TƏRTƏR": "Tərtər", "TOVUZ": "Tovuz", "UCAR": "Ucar",
    "XAÇMAZ": "Xaçmaz", "XIZI": "Xızı", "XOCALI": "Xocalı",
    "XOCAVƏND": "Xocavənd", "YARDIMLI": "Yardımlı", "ZAQATALA": "Zaqatala",
    "ZƏNGİLAN": "Zəngilan", "ZƏRDAB": "Zərdab",
}

# Bakı rayonlarının saytdakı sırası (`order` sahəsi). Sıra dəyişsə, mövcud
# bazada yalnız `order` yenilənir.
BAKU_DISTRICT_ORDER = [
    "Binəqədi", "Nərimanov", "Nəsimi", "Nizami", "Qaradağ", "Sabunçu",
    "Səbail", "Suraxanı", "Xəzər", "Xətai", "Yasamal", "Pirallahı",
]

# Ünvan Reyestrində ayrıca kök kimi çəkilən iri şəhər/rayonlar: DSK açarı → ad.
# Bunların qəsəbə və kəndləri rəsmi reyestrdəki tam siyahı ilə birləşdirilir
# (DSK çıxarışında kəndlər seçmə idi) və rəsmi kodları yazılır.
PORTAL_ROOTS = {
    "ABŞERON": "Abşeron", "SUMQAYIT": "Sumqayıt", "GƏNCƏ": "Gəncə",
    "NAXÇIVAN": "Naxçıvan", "MİNGƏÇEVİR": "Mingəçevir", "ŞİRVAN": "Şirvan",
    "LƏNKƏRAN": "Lənkəran", "ŞƏKİ": "Şəki", "YEVLAX": "Yevlax",
    "NAFTALAN": "Naftalan", "XANKƏNDİ": "Xankəndi",
}

# Gəncənin 2 inzibati rayonu. Rəsmi sənəddə qəsəbələrin rayon bölgüsü
# cədvəl sütunlarında itir, ona görə qəsəbələr birbaşa şəhərə bağlanır.
GANJA_DISTRICTS = ["Kəpəz", "Nizami"]


def q(text):
    return '"' + text.replace('\\', '\\\\').replace('"', '\\"') + '"'


def load(path):
    with io.open(path, encoding="utf-8") as handle:
        return json.load(handle)


def strip_suffix(full_name):
    """«Biləcəri qəsəbəsi» → «Biləcəri», «Binəqədi rayonu» → «Binəqədi»."""
    for suffix in (" qəsəbəsi", " rayonu", " kəndi", " şəhəri"):
        if full_name.endswith(suffix):
            return full_name[: -len(suffix)]
    return full_name


def main():
    data = load(SRC)
    data.pop("_source", None)
    units = load(UNITS)
    market = load(MARKET)

    unknown = sorted(k for k in data if k not in DISPLAY)
    if unknown:
        raise SystemExit("DISPLAY-də olmayan açar: " + ", ".join(unknown))

    # --- Bakının rəsmi bölgüsü: Ünvan Reyestri, DSK ilə çarpaz yoxlama ---
    baku_split = {}
    codes = {}
    for district in units["Bakı"]:
        name = strip_suffix(district["fullName"])
        codes[("Bakı", name)] = district["code"]
        baku_split[name] = []
        for child in district.get("children", []):
            child_name = strip_suffix(child["fullName"])
            baku_split[name].append(child_name)
            codes[(name, child_name)] = child["code"]

    if sorted(baku_split) != sorted(BAKU_DISTRICT_ORDER):
        raise SystemExit("Ünvan Reyestrindəki Bakı rayonları gözləniləndən fərqlidir: %s"
                         % sorted(baku_split))
    official = set(data["BAKI"]["t"])
    mapped = [name for names in baku_split.values() for name in names]
    if sorted(mapped) != sorted(official):
        raise SystemExit(
            "Ünvan Reyestri ilə DSK təsnifatı uyğun gəlmir.\n"
            "Əskik: %s\nArtıq: %s" % (
                sorted(official - set(mapped)), sorted(set(mapped) - official))
        )
    if len(mapped) != len(set(mapped)):
        raise SystemExit("Bakı bölgüsündə təkrar qəsəbə var")

    # İri şəhər/rayonların rəsmi siyahısı və kodları (qəsəbə, kənd, rayon tabeli şəhər)
    portal_towns = {}
    portal_villages = {}
    for key, name in PORTAL_ROOTS.items():
        if DISPLAY[key] != name:
            raise SystemExit("PORTAL_ROOTS adı DISPLAY ilə uyğun deyil: %s" % key)
        codes[(None, name)] = units["_roots"][name]["code"]
        towns, villages = set(), set()
        for child in units[name]:
            child_name = strip_suffix(child["fullName"])
            codes[(name, child_name)] = child["code"]
            (villages if child["fullName"].endswith(" kəndi") else towns).add(child_name)
        portal_towns[name] = towns
        portal_villages[name] = villages

    # --- Bazar massivləri ---
    neighborhoods = market["bakuNeighborhoods"]
    if sorted(neighborhoods) != sorted(BAKU_DISTRICT_ORDER):
        raise SystemExit("baku-market-locations.json: bakuNeighborhoods açarları 12 rayon olmalıdır")
    baku_names = set(mapped) | set(baku_split)
    seen = set()
    for district, items in neighborhoods.items():
        for item in items:
            name = item["name"]
            if name in baku_names:
                raise SystemExit("Massiv rəsmi rayon/qəsəbə ilə eyniadlıdır: %s (%s)" % (name, district))
            if name in seen:
                raise SystemExit("Təkrar massiv: %s" % name)
            if not item.get("sources"):
                raise SystemExit("Massivin mənbəyi göstərilməyib: %s" % name)
            seen.add(name)

    abseron_official = set(data["ABŞERON"]["c"]) | set(data["ABŞERON"]["t"]) | set(data["ABŞERON"]["v"])
    abseron_hoods = [item["name"] for item in market["abseronNeighborhoods"]]
    clash = abseron_official & set(abseron_hoods)
    if clash:
        raise SystemExit("Abşeron massivi rəsmi məntəqə ilə eyniadlıdır: %s" % sorted(clash))

    metro = [item["name"] for item in market["metro"]]
    landmarks = [item["name"] for item in market["landmarks"]]
    for label, items in (("metro", metro), ("nişangah", landmarks)):
        if len(items) != len(set(items)):
            raise SystemExit("Təkrar %s adı var" % label)

    # Alias açarı mövcud bir adı göstərməlidir, alias özü isə başqa yerin adı olmamalıdır
    aliases = {}
    for item in [i for items in neighborhoods.values() for i in items] + \
            market["abseronNeighborhoods"] + market["metro"] + market["landmarks"]:
        if item.get("aliases"):
            aliases.setdefault(item["name"], []).extend(item["aliases"])
    for name, extra in market["aliases"].items():
        aliases.setdefault(name, []).extend(extra)
    all_names = baku_names | seen | set(metro) | set(landmarks) | abseron_official | \
        set(abseron_hoods) | set(data["SUMQAYIT"]["t"])
    missing = sorted(name for name in aliases if name not in all_names)
    if missing:
        raise SystemExit("Alias açarı heç bir yerə uyğun gəlmir: %s" % missing)
    for name in aliases:
        aliases[name] = sorted(set(aliases[name]) - {name})

    lines = []
    add = lines.append

    add('/**')
    add(' * Azərbaycanın rəsmi inzibati-ərazi bölgüsü və bazar massivləri.')
    add(' *')
    add(' * **Bu fayl generasiya olunur — əl ilə redaktə etmə.**')
    add(' * Generator: `python scripts/build-locations-data.py`. Girişlər:')
    add(' * - `prisma/az-admin-divisions.json` — «İnzibati Ərazi Bölgüsü Təsnifatı, 2024»,')
    add(' *   Dövlət Statistika Komitəsi kollegiyasının 16.02.2024 tarixli 2/2 nömrəli')
    add(' *   qərarı (https://e-qanun.az/framework/57325). 11 respublika tabeli şəhər,')
    add(' *   64 rayon, 12 şəhər rayonu, 262 qəsəbə və 4 244 kənd.')
    add(' * - `prisma/unvanportali-admin-units.json` — Ünvan Reyestri (unvanportali.az):')
    add(' *   Bakı və Abşeronun rəsmi rayon/qəsəbə kodları. Bakının 12 rayonu və 59')
    add(' *   qəsəbəsi DSK siyahısı ilə çarpaz yoxlanılır.')
    add(' * - `prisma/baku-market-locations.json` — elanlarda işlənən massivlər, metro,')
    add(' *   nişangahlar və alternativ yazılışlar (bina.az, kub.az, arenda.az,')
    add(' *   yeniemlak.az, lalafo.az; bax `docs/erazi/baki-erazi-bolgusu.md`).')
    add(' *')
    add(' * Səviyyələr `Location.kind` ilə verilir:')
    add(' * - `CITY` — istifadəçinin birinci seçimi: respublika tabeli şəhərlər və')
    add(' *   rayonlar. Rayon burada `DISTRICT` deyil, çünki axtarışda şəhərlərlə eyni')
    add(' *   pillədə seçilir (Quba, Qusar, Şəki…). `DISTRICT` yalnız şəhərin')
    add(' *   daxilindəki inzibati rayon deməkdir.')
    add(' * - `DISTRICT` — şəhərdaxili inzibati rayonlar: Bakının 12, Gəncənin 2 rayonu.')
    add(' * - `SETTLEMENT` — rəsmi qəsəbələr və rayon tabeli şəhərlər (Xırdalan, Xudat,')
    add(' *   Horadiz, Liman, Göytəpə, Qovlar, Dəliməmmədli).')
    add(' * - `VILLAGE` — kəndlər. Rəsmi siyahı 4 244 kənd sayır; burada yalnız əmlak')
    add(' *   bazarında elan verilənlər var — Bakıya yaxın rayonlarda tam, turizm və')
    add(' *   bağ bölgələrində seçmə. Tam siyahı seçim menyusunu yararsız edərdi.')
    add(' * - `NEIGHBORHOOD` — yaşayış massivləri və mikrorayonlar. **Rəsmi inzibati')
    add(' *   vahid deyil**, amma elanlarda gündəlik işlənir (Yeni Günəşli, Yeni Yasamal,')
    add(' *   8-ci km). Rəsmi qəsəbə siyahısının təmiz qalması üçün ayrıca səviyyədədir.')
    add(' * - `METRO` — Bakı metrosunun stansiyaları; valideyni Bakıdır.')
    add(' * - `LANDMARK` — nişangahlar (ticarət mərkəzi, park, universitet, meydan);')
    add(' *   valideyni Bakıdır, elanda `landmarkId` ilə saxlanılır.')
    add(' *')
    add(' * Slug-lar adlardan qurulur (`build-taxonomy-sql.ts`) və valideynin slug-ı ilə')
    add(' * prefikslənir, ona görə eyni adlı yerlər toqquşmur — «İstisu» həm Kəlbəcərdə,')
    add(' * həm Lənkəranda, həm Xaçmazda var.')
    add(' */')
    add('')
    add('export const BAKU = "Bakı";')
    add('')
    add('/** Şəhər/rayonun altındakı yaşayış məntəqəsi. */')
    add('export type ChildPlace = {')
    add('  name: string;')
    add('  kind: "SETTLEMENT" | "VILLAGE" | "NEIGHBORHOOD";')
    add('  /** Rəsmi kod (DSK / Ünvan Reyestri) — yalnız rəsmi məntəqədə. */')
    add('  code?: string;')
    add('};')
    add('')
    add('/** Şəhərdaxili inzibati rayon — yalnız Bakı və Gəncədə var. */')
    add('export type UrbanDistrict = {')
    add('  name: string;')
    add('  code?: string;')
    add('  places: ChildPlace[];')
    add('};')
    add('')
    add('/**')
    add(' * Birinci pillə: respublika tabeli şəhər və ya rayon.')
    add(' *')
    add(' * `tier` yalnız sıralama üçündür — bazada hər ikisi `kind="CITY"` olur, çünki')
    add(' * istifadəçi axtarışda onları eyni açılan siyahıdan seçir. Lənkəran, Şəki və')
    add(' * Yevlax rəsmi təsnifatda həm şəhər, həm eyniadlı rayondur; saytda tək qeyddir.')
    add(' */')
    add('export type TopLevelPlace = {')
    add('  name: string;')
    add('  tier: "CITY" | "REGION";')
    add('  code?: string;')
    add('  /** Şəhərdaxili inzibati rayonlar. */')
    add('  districts?: UrbanDistrict[];')
    add('  /** Birbaşa alt yaşayış məntəqələri. */')
    add('  places?: ChildPlace[];')
    add('};')
    add('')
    add('const s = (name: string, code?: string): ChildPlace =>')
    add('  code ? { name, kind: "SETTLEMENT", code } : { name, kind: "SETTLEMENT" };')
    add('const v = (name: string, code?: string): ChildPlace =>')
    add('  code ? { name, kind: "VILLAGE", code } : { name, kind: "VILLAGE" };')
    add('const n = (name: string): ChildPlace => ({ name, kind: "NEIGHBORHOOD" });')
    add('')

    def call(fn, name, code=None):
        return '%s(%s%s)' % (fn, q(name), (', ' + q(code)) if code else '')

    def emit_items(indent, key, rendered):
        pad = ' ' * indent
        one_line = '%s%s: [%s],' % (pad, key, ', '.join(rendered))
        if not rendered:
            add('%s%s: [],' % (pad, key))
        elif len(one_line) <= 98:
            add(one_line)
        else:
            add('%s%s: [' % (pad, key))
            for chunk in rendered:
                add('%s  %s,' % (pad, chunk))
            add('%s],' % pad)

    # --- Bakı rayonları ---
    add('/**')
    add(' * Bakının 12 inzibati rayonu, 59 rəsmi qəsəbəsi (rəsmi kodları ilə) və bazar')
    add(' * massivləri. Bakıda rəsmi kənd yoxdur.')
    add(' *')
    add(' * Rəsmi təsnifatda Nərimanov, Nəsimi və Yasamal rayonlarında **qəsəbə yoxdur**')
    add(' * — orada yalnız massiv adları işlənir, ona görə onlar `NEIGHBORHOOD`-dur.')
    add(' */')
    add('export const BAKU_DISTRICTS: UrbanDistrict[] = [')
    for name in BAKU_DISTRICT_ORDER:
        # Rayonla eyniadlı qəsəbə ayrıca qeyd yaratmır: «Binəqədi qəsəbəsi»
        # Binəqədi rayonunun mərkəzidir, seçim siyahısında iki dəfə görünməsi
        # istifadəçini çaşdırardı və slug-lar da toqquşardı.
        rendered = [call('s', x, codes[(name, x)])
                    for x in sorted(baku_split[name]) if x != name]
        rendered += [call('n', item["name"]) for item in neighborhoods[name]]
        add('  {')
        add('    name: %s,' % q(name))
        add('    code: %s,' % q(codes[("Bakı", name)]))
        emit_items(4, 'places', rendered)
        add('  },')
    add('];')
    add('')

    add('/** Bakı metrosunun 27 stansiyası — xətt sırası ilə. */')
    add('export const METRO_STATIONS: string[] = [')
    for station in metro:
        add('  %s,' % q(station))
    add('];')
    add('')

    add('/**')
    add(' * Nişangahlar — bina.az, kub.az və yeniemlak.az siyahılarının birləşməsi,')
    add(' * dublikatlar və massiv/metro ilə təkrarlananlar çıxarılıb.')
    add(' */')
    add('export const LANDMARKS: string[] = [')
    for landmark in landmarks:
        add('  %s,' % q(landmark))
    add('];')
    add('')

    add('/**')
    add(' * Alternativ yazılışlar: köhnə adlar («Kirov qəsəbəsi»), gündəlik yazılış')
    add(' * («Müşfiqabad»), qısaltmalar («8 km»). Axtarış sahəsinə (`searchName`) yazılır,')
    add(' * ayrıca yer yaratmır. Açar kanonik addır və eyni adlı bütün yerlərə aiddir.')
    add(' */')
    add('export const LOCATION_ALIASES: Record<string, string[]> = {')
    for name in sorted(aliases, key=lambda x: x.lower()):
        add('  %s: [%s],' % (q(name), ', '.join(q(a) for a in aliases[name])))
    add('};')
    add('')

    # --- Birinci pillə ---
    add('/**')
    add(' * Respublika tabeli şəhərlər və rayonlar bir siyahıdadır, çünki axtarışda')
    add(' * eyni açılan siyahıdan seçilir: əvvəl şəhərlər, sonra rayonlar.')
    add(' */')
    add('export const PLACES: TopLevelPlace[] = [')
    add('  // --- Respublika tabeli şəhərlər ---')

    def render_place(key, tier):
        entry = data[key]
        name = DISPLAY[key]
        # Şəhər/rayonla eyniadlı qəsəbə və kənd ayrıca qeyd yaratmır — o, artıq
        # birinci pillədə seçilir (Daşkəsən, Siyəzən, Qobustan…).
        towns = sorted((set(entry["c"]) | set(entry["t"]) | portal_towns.get(name, set())) - {name})
        villages = sorted((set(entry["v"]) | portal_villages.get(name, set())) - set(towns) - {name})
        code_of = lambda x: codes.get((name, x))  # noqa: E731
        top_code = codes.get((None, name))
        rendered = [call('s', x, code_of(x)) for x in towns] + \
            [call('v', x, code_of(x)) for x in villages]
        if name == "Abşeron":
            rendered += [call('n', x) for x in abseron_hoods]

        if key == "BAKI":
            add('  { name: BAKU, tier: "CITY", code: %s, districts: BAKU_DISTRICTS },'
                % q(units_code_baku))
            return
        if key == "GƏNCƏ":
            add('  {')
            add('    name: %s,' % q(name))
            add('    tier: "CITY",')
            add('    code: %s,' % q(top_code))
            add('    districts: [%s],' % ', '.join(
                '{ name: %s, places: [] }' % q(d) for d in GANJA_DISTRICTS))
            add('    places: [%s],' % ', '.join(call('s', x, code_of(x)) for x in towns))
            add('  },')
            return

        code_part = ('code: %s, ' % q(top_code)) if top_code else ''
        if not rendered:
            add('  { name: %s, tier: %s%s },' % (
                q(name), q(tier), (', code: %s' % q(top_code)) if top_code else ''))
            return
        head = '  { name: %s, tier: %s, %s' % (q(name), q(tier), code_part)
        one_line = head + 'places: [%s] },' % ', '.join(rendered)
        if len(one_line) <= 98:
            add(one_line)
        else:
            add('  {')
            add('    name: %s,' % q(name))
            add('    tier: %s,' % q(tier))
            if top_code:
                add('    code: %s,' % q(top_code))
            emit_items(4, 'places', rendered)
            add('  },')

    units_code_baku = units["_roots"]["Bakı"]["code"]

    for key in CITY_TIER:
        render_place(key, "CITY")

    add('')
    add('  // --- Rayonlar ---')
    regions = sorted((k for k in data if k not in CITY_TIER),
                     key=lambda k: DISPLAY[k].lower())
    for key in regions:
        render_place(key, "REGION")
    add('];')
    add('')
    add('/** Yalnız respublika tabeli şəhərlər — sıralama və etiket üçün. */')
    add('export const CITIES: string[] = PLACES.filter((place) => place.tier === "CITY").map(')
    add('  (place) => place.name,')
    add(');')
    add('')
    add('/** Yalnız rayonlar — sıralama və etiket üçün. */')
    add('export const REGIONS: string[] = PLACES.filter((place) => place.tier === "REGION").map(')
    add('  (place) => place.name,')
    add(');')

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines) + "\n")

    # Sayılar yazılan fayldan hesablanır — şəhər/rayonla eyniadlı qeydlər
    # atıldığı üçün JSON-dakı xam say daha böyükdür.
    written = io.open(OUT, encoding="utf-8").read()
    towns = written.count('s("')
    villages = written.count('v("')
    hoods = written.count('n("')
    print("prisma/locations-data.ts yazıldı — %d şəhər, %d rayon, %d qəsəbə, %d kənd, "
          "%d massiv, %d metro, %d nişangah, %d alias açarı." % (
              len(CITY_TIER), len(regions), towns, villages, hoods, len(metro),
              len(landmarks), len(aliases)))


if __name__ == "__main__":
    main()
