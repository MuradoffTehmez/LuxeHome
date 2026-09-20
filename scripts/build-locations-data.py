"""
`prisma/az-admin-divisions.json` -> `prisma/locations-data.ts` generatoru.

JSON rəsmi «İnzibati Ərazi Bölgüsü Təsnifatı, 2024» sənədindən çıxarılıb
(e-qanun.az/framework/57325). Bu skript ondan TypeScript data faylını qurur ki,
`build-taxonomy-sql.ts` və testlər tək mənbədən oxusun.

İşlətmə: python scripts/build-locations-data.py
"""

import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "prisma", "az-admin-divisions.json")
OUT = os.path.join(ROOT, "prisma", "locations-data.ts")

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

# Bakının rayon-qəsəbə bölgüsü. Rəsmi sənəd ümumi sayı (59) verir, rayon
# sərhədləri isə cədvəl sütunlarındadır — bölgü burada sabitlənib və
# generator onu rəsmi siyahıya qarşı yoxlayır.
BAKU_SPLIT = {
    "Binəqədi": ["28 May", "Biləcəri", "Binəqədi", "M.Ə.Rəsulzadə", "Sulutəpə", "Xocəsən"],
    "Nərimanov": [],
    "Nəsimi": [],
    "Nizami": ["Keşlə"],
    "Qaradağ": ["Baş Ələt", "Çeyildağ", "Ələt", "Heybət", "Korgöz", "Kotal",
                "Lökbatan", "Müşviqabad", "Pirsaat", "Puta", "Qarakosa", "Qaradağ",
                "Qızıldaş", "Qobustan", "Sahil", "Sanqaçal", "Şıxlar", "Şonqar",
                "Şubanı", "Ümid", "Yeni Ələt"],
    "Sabunçu": ["Bakıxanov", "Balaxanı", "Bilgəh", "Kürdəxanı", "Maştağa",
                "Nardaran", "Pirşağı", "Ramana", "Sabunçu", "Zabrat"],
    "Səbail": ["Badamdar", "Bibiheybət"],
    "Suraxanı": ["Bülbülə", "Əmircan", "Hövsan", "Qaraçuxur", "Yeni Suraxanı", "Zığ"],
    "Xəzər": ["Binə", "Buzovna", "Mərdəkan", "Qala", "Şağan", "Şüvəlan", "Türkan", "Zirə"],
    "Xətai": ["Əhmədli"],
    "Yasamal": [],
    "Pirallahı": ["Çilov", "Gürgən", "Neft Daşları", "Pirallahı"],
}

# Rəsmi inzibati vahid olmayan, amma elanlarda işlənən massiv adları.
BAKU_NEIGHBORHOODS = {
    "Binəqədi": ["8-ci kilometr", "9-cu mikrorayon", "Günəşli"],
    "Nərimanov": ["Böyükşor", "Sovetski"],
    "Nəsimi": ["1-ci mikrorayon", "2-ci mikrorayon", "3-cü mikrorayon",
               "4-cü mikrorayon", "5-ci mikrorayon", "6-cı mikrorayon",
               "7-ci mikrorayon", "8-ci mikrorayon"],
    "Nizami": ["Alatava"],
    "Sabunçu": ["Savalan"],
    "Səbail": ["Bayıl", "İçərişəhər", "Şıxov"],
    "Suraxanı": ["Bahar", "Yeni Günəşli"],
    "Xətai": ["Ağ şəhər", "Qara şəhər"],
    # Dübəndi rəsmi təsnifatda ayrıca yaşayış məntəqəsi deyil (Bakıda kənd
    # yoxdur), amma bağ evi elanlarında işlənir və köhnə ağacda qeyd vardı.
    "Xəzər": ["Dübəndi"],
    "Yasamal": ["Yeni Yasamal"],
}

# Gəncənin 2 inzibati rayonu. Rəsmi sənəddə qəsəbələrin rayon bölgüsü
# cədvəl sütunlarında itir, ona görə qəsəbələr birbaşa şəhərə bağlanır.
GANJA_DISTRICTS = ["Kəpəz", "Nizami"]

METRO_STATIONS = [
    "20 Yanvar", "28 May", "8 Noyabr", "Avtovağzal", "Azadlıq prospekti",
    "Bakmil", "Cəfər Cabbarlı", "Dərnəgül", "Elmlər Akademiyası", "Əhmədli",
    "Gənclik", "Həzi Aslanov", "İçərişəhər", "İnşaatçılar", "Koroğlu",
    "Qara Qarayev", "Memar Əcəmi", "Nəriman Nərimanov", "Neftçilər", "Nəsimi",
    "Nizami", "Sahil", "Ulduz", "Xalqlar Dostluğu", "Xocəsən", "Şah İsmayıl Xətai",
]


def q(text):
    return '"' + text.replace('\\', '\\\\').replace('"', '\\"') + '"'


def main():
    with io.open(SRC, encoding="utf-8") as handle:
        data = json.load(handle)
    data.pop("_source", None)

    unknown = sorted(k for k in data if k not in DISPLAY)
    if unknown:
        raise SystemExit("DISPLAY-də olmayan açar: " + ", ".join(unknown))

    # Bakı bölgüsünü rəsmi siyahıya qarşı yoxla
    official = set(data["BAKI"]["t"])
    mapped = [name for names in BAKU_SPLIT.values() for name in names]
    if sorted(mapped) != sorted(official):
        raise SystemExit(
            "Bakı bölgüsü rəsmi siyahı ilə uyğun deyil.\n"
            "Əskik: %s\nArtıq: %s" % (
                sorted(official - set(mapped)), sorted(set(mapped) - official))
        )
    if len(mapped) != len(set(mapped)):
        raise SystemExit("Bakı bölgüsündə təkrar qəsəbə var")

    lines = []
    add = lines.append

    add('/**')
    add(' * Azərbaycanın rəsmi inzibati-ərazi bölgüsü.')
    add(' *')
    add(' * **Bu fayl generasiya olunur — əl ilə redaktə etmə.**')
    add(' * Mənbə: `prisma/az-admin-divisions.json`; generator:')
    add(' * `python scripts/build-locations-data.py`.')
    add(' *')
    add(' * Rəsmi mənbə — «İnzibati Ərazi Bölgüsü Təsnifatı, 2024», Azərbaycan')
    add(' * Respublikası Dövlət Statistika Komitəsi kollegiyasının 16.02.2024 tarixli')
    add(' * 2/2 nömrəli qərarı ilə təsdiq edilib, Milli Məclisin Aparatı ilə')
    add(' * razılaşdırılıb (https://e-qanun.az/framework/57325). Təsnifat 11 respublika')
    add(' * tabeli şəhər, 64 rayon, 12 şəhər rayonu, 262 qəsəbə və 4 244 kənd sayır.')
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
    add(' *   vahid deyil**, amma elanlarda gündəlik işlənir (Günəşli, Yeni Yasamal,')
    add(' *   8-ci km). Rəsmi qəsəbə siyahısının təmiz qalması üçün ayrıca səviyyədədir.')
    add(' * - `METRO` — Bakı metrosunun stansiyaları; valideyni Bakıdır.')
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
    add('};')
    add('')
    add('/** Şəhərdaxili inzibati rayon — yalnız Bakı və Gəncədə var. */')
    add('export type UrbanDistrict = {')
    add('  name: string;')
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
    add('  /** Şəhərdaxili inzibati rayonlar. */')
    add('  districts?: UrbanDistrict[];')
    add('  /** Birbaşa alt yaşayış məntəqələri. */')
    add('  places?: ChildPlace[];')
    add('};')
    add('')
    add('const s = (name: string): ChildPlace => ({ name, kind: "SETTLEMENT" });')
    add('const v = (name: string): ChildPlace => ({ name, kind: "VILLAGE" });')
    add('const n = (name: string): ChildPlace => ({ name, kind: "NEIGHBORHOOD" });')
    add('')

    # --- Bakı rayonları ---
    add('/**')
    add(' * Bakının 12 inzibati rayonu, 59 rəsmi qəsəbəsi və bazar massivləri.')
    add(' *')
    add(' * Rəsmi təsnifatda Nərimanov, Nəsimi və Yasamal rayonlarında **qəsəbə yoxdur**')
    add(' * — orada yalnız massiv adları işlənir, ona görə onlar `NEIGHBORHOOD`-dur.')
    add(' */')
    add('export const BAKU_DISTRICTS: UrbanDistrict[] = [')
    for name in BAKU_SPLIT:
        # Rayonla eyniadlı qəsəbə ayrıca qeyd yaratmır: «Binəqədi qəsəbəsi»
        # Binəqədi rayonunun mərkəzidir, seçim siyahısında iki dəfə görünməsi
        # istifadəçini çaşdırardı və slug-lar da toqquşardı.
        items = [('s', x) for x in sorted(BAKU_SPLIT[name]) if x != name]
        items += [('n', x) for x in BAKU_NEIGHBORHOODS.get(name, [])]
        add('  {')
        add('    name: %s,' % q(name))
        if not items:
            add('    places: [],')
        else:
            rendered = ['%s(%s)' % (fn, q(val)) for fn, val in items]
            one_line = '    places: [%s],' % ', '.join(rendered)
            if len(one_line) <= 98:
                add(one_line)
            else:
                add('    places: [')
                for chunk in rendered:
                    add('      %s,' % chunk)
                add('    ],')
        add('  },')
    add('];')
    add('')

    add('/** Bakı metrosunun stansiyaları — axtarışda ayrıca açar kimi işlənir. */')
    add('export const METRO_STATIONS: string[] = [')
    for station in METRO_STATIONS:
        add('  %s,' % q(station))
    add('];')
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
        # rayon tabeli şəhərlər də qəsəbə səviyyəsində saxlanılır
        # Şəhər/rayonla eyniadlı qəsəbə və kənd ayrıca qeyd yaratmır — o, artıq
        # birinci pillədə seçilir (Daşkəsən, Siyəzən, Qobustan…).
        towns = sorted((set(entry["c"]) | set(entry["t"])) - {name})
        villages = sorted(set(entry["v"]) - set(towns) - {name})
        items = [('s', x) for x in towns] + [('v', x) for x in villages]

        if key == "BAKI":
            add('  { name: BAKU, tier: "CITY", districts: BAKU_DISTRICTS },')
            return
        if key == "GƏNCƏ":
            add('  {')
            add('    name: %s,' % q(name))
            add('    tier: "CITY",')
            add('    districts: [%s],' % ', '.join(
                '{ name: %s, places: [] }' % q(d) for d in GANJA_DISTRICTS))
            add('    places: [%s],' % ', '.join('s(%s)' % q(x) for x in towns))
            add('  },')
            return

        if not items:
            add('  { name: %s, tier: %s },' % (q(name), q(tier)))
            return
        rendered = ['%s(%s)' % (fn, q(val)) for fn, val in items]
        one_line = '  { name: %s, tier: %s, places: [%s] },' % (
            q(name), q(tier), ', '.join(rendered))
        if len(one_line) <= 98:
            add(one_line)
        else:
            add('  {')
            add('    name: %s,' % q(name))
            add('    tier: %s,' % q(tier))
            add('    places: [')
            for chunk in rendered:
                add('      %s,' % chunk)
            add('    ],')
            add('  },')

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
    print("prisma/locations-data.ts yazıldı — %d şəhər, %d rayon, %d qəsəbə, "
          "%d kənd, %d massiv." % (len(CITY_TIER), len(regions), towns, villages, hoods))


if __name__ == "__main__":
    main()
