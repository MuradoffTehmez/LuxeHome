"""
`docs/erazi/baki-erazi-bolgusu.md` hesabatını data fayllarından qurur.

Girişlər: `prisma/baku-market-locations.json`, `prisma/unvanportali-admin-units.json`,
`prisma/unvanportali-streets.json`. Hesabat əl ilə yazılmır ki, siyahı data ilə
ayrışmasın; izah bölmələri isə bu skriptin içindədir.

İşlətmə: python scripts/build-location-report.py
"""

import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRISMA = os.path.join(ROOT, "prisma")
OUT = os.path.join(ROOT, "docs", "erazi", "baki-erazi-bolgusu.md")

SOURCE_NAMES = {
    "B": "bina", "K": "kub", "A": "arenda", "Y": "yeniemlak", "L": "lalafo",
    "R": "araşdırma", "O": "OSM", "W": "rəsmi/xəbər",
}

BAKU_ORDER = [
    "Binəqədi", "Nərimanov", "Nəsimi", "Nizami", "Qaradağ", "Sabunçu",
    "Səbail", "Suraxanı", "Xəzər", "Xətai", "Yasamal", "Pirallahı",
]

CONFLICTS = [
    ("8-ci kilometr", "Köhnə saytda Binəqədi", "**Nizami** — bina, kub, arenda, yeniemlak, lalafo"),
    ("Günəşli", "Köhnə saytda Binəqədi", "**Suraxanı** — bina, lalafo"),
    ("6–9-cu mikrorayon", "Köhnə saytda 6–8-ci Nəsimi", "**Binəqədi** — Binəqədi RİH, bütün bazar saytları"),
    ("Alatava", "Köhnə saytda Nizami; bina «2-ci Alatava»nı Binəqədi yazır",
     "**1-ci Alatava → Nəsimi, 2-ci Alatava → Yasamal** — OSM sərhədi, yeniemlak"),
    ("Sovetski", "Köhnə saytda Nərimanov; bina/kub nişangah kimi", "**Yasamal massivi** — Vikipediya"),
    ("Baksol", "İstifadəçi siyahısında Binəqədi", "**Nərimanov** — OSM (Böyükşor yaxınlığı)"),
    ("Çermet", "Rayon göstərilmir", "**Nərimanov** — OSM (Ziya Bünyadov pr.)"),
    ("Çiçək", "bina Abşeron, yeniemlak Binəqədi",
     "**Binəqədi** (Sulutəpə) — yeniemlak, yerli mənbələr; Abşeronun rəsmi siyahısında yoxdur"),
    ("Zağulba", "bina Abşeron, yeniemlak Xəzər", "**Xəzər** — OSM, yeniemlak"),
    ("Albalılıq / Albalı", "bina Albalılığı Sabunçu yazır",
     "**Albalılıq → Xəzər (Buzovna)** — OSM; **Albalı → Sabunçu** — kub, yeniemlak, lalafo"),
    ("Gürgən", "bina Xəzər", "**Pirallahı** — rəsmi qəsəbə (DSK, Ünvan Reyestri)"),
    ("Bilgəh", "istifadəçi siyahısında Xəzər («Bilgəh yolu»)", "**Sabunçu** — rəsmi qəsəbə"),
    ("Müşfiqabad, Səngəçal", "bazar yazılışı", "Rəsmi ad **Müşviqabad, Sanqaçal**; bazar yazılışı alias"),
    ("Kirov qəsəbəsi", "kub.az ayrıca yer kimi", "**M.Ə.Rəsulzadə**-nin 1999-a qədərki adı — alias"),
    ("Nübar, Atyalı, Corat, Kimyaçılar şəhərciyi, Nasosnu", "bazar saytları «Bakı» altında",
     "Bakı deyil: Nübar/Atyalı — Abşeron massivi; Corat — Sumqayıt qəsəbəsi; "
     "Nasosnu — Hacı Zeynalabdinin alias-ı"),
    ("Şuşa (Sabunçu)", "kub, yeniemlak", "**Əlavə edilmədi** — rəsmi və müstəqil təsdiq tapılmadı"),
    ("Qurd qapısı", "arenda məntəqə kimi", "**Əlavə edilmədi** — qəbiristanlıqdır"),
    ("Suraxanı qəs., Yasamal qəs.", "bazar saytları ayrıca qəsəbə",
     "Rayonun özü ilə seçilir (rəsmi qəsəbə deyil / ad təkrarı)"),
    ("Sumqayıt: 72-ci / 76-cı məhəllə", "hər biri yalnız bir saytda (arenda / yeniemlak)",
     "**Əlavə edilmədi** — iki mənbədə təsdiqlənənlər (17 mikrorayon, 40 məhəllə, 10 ərazi) saxlanılıb"),
    ("Sumqayıt: «21-ci mərhələ»", "arenda.az yazılışı", "Yazı səhvi — **21-ci məhəllə** (yeniemlak ilə eyni)"),
    ("Naxçıvan şəhərinin məhəllələri", "evimemlak.az-da strukturlu siyahı yoxdur, yalnız elan başlıqlarında",
     "**Əlavə edilmədi** — tək və qeyri-strukturlu mənbə; rəsmi kənd/qəsəbələr reyestrdən gəlir"),
    ("DSK və reyestr yazılışı fərqli olanda", "məs. köhnə adlar (Orconikidze, Nehrəm)",
     "Mövcud elanların slug-ı qorunsun deyə DSK yazılışı saxlanılır; reyestr kodu normallaşdırılmış açarla bağlanır"),
]

SITE_CHANGES = [
    ("Elan forması (admin və kabinet, `LocationFields`)",
     "Region → şəhər → rayon → qəsəbə/kənd → massiv; **metro** (kabinetdə ilk dəfə), **nişangah** "
     "və rəsmi **küçə təklifləri** (seçilmiş vahidin kodu ilə `public/data/kuceler/<kod>.json`)"),
    ("Server validasiyası", "Nişangah mövcud, `LANDMARK` növündə və seçilmiş şəhərə aid olmalıdır (admin + kabinet)"),
    ("`/emlaklar` filtri", "`?nisangah=<slug>` — desktop panel, mobil sheet, aktiv çiplər, boş nəticədə «filtri çıxar» təklifi"),
    ("Mətn axtarışı", "Alias-lar `searchName`-də (Müşfiqabad → Müşviqabad, 8 km → 8-ci kilometr); "
     "massivdəki elan rayon adı ilə də tapılır; nişangah adı ilə axtarış"),
    ("Elan səhifəsi", "«Əsas göstəricilər»də nişangah; eyni nişangahlı elanlara keçid"),
    ("Yadda saxlanmış axtarış", "`landmarkSlug` saxlanılır, xülasədə və «nəticələrə bax» keçidində göstərilir"),
    ("CSV idxalı", "Yeni `landmark` sütunu; rayon sütunu nişangahla qarışmır"),
    ("Semantik axtarış", "Embedding mətninə nişangah əlavə olunur"),
    ("Kəndlər (~3 600)", "Filtrdə yalnız ictimai elanı olanlar; formada seçilmiş rayonun kəndləri "
     "`/api/yerler/kendler`-dən yüklənir, redaktə olunan elanın kəndi server tərəfdə əlavə edilir"),
    ("AI axtarışı", "Nişangahlar və kəndlər prompta göndərilmir (token qənaəti)"),
    ("Admin «ictimai imkanlar»", "Məhəllə profili siyahısına yalnız profili olan kəndlər düşür"),
    ("Baza", "`Location.officialCode`, `Property.landmarkId`; miqrasiyalar `0050`–`0053` özü-yetərlidir "
     "(~8 000 ifadə ardıcıl hissələrdə)"),
]


def load(name):
    with io.open(os.path.join(PRISMA, name), encoding="utf-8") as handle:
        return json.load(handle)


def strip_suffix(full_name):
    for suffix in (" qəsəbəsi", " rayonu", " kəndi", " şəhəri"):
        if full_name.endswith(suffix):
            return full_name[: -len(suffix)]
    return full_name


def sources(code):
    return ", ".join(SOURCE_NAMES[char] for char in code)


def main():
    market = load("baku-market-locations.json")
    units = load("unvanportali-admin-units.json")
    streets = load("unvanportali-streets.json")
    street_count = {
        code: len([s for s in unit["streets"] if s["type"] != "Avtomobil yolu"])
        for code, unit in streets.items() if not code.startswith("_")
    }
    aliases = market["aliases"]
    lines = []
    add = lines.append

    hood_count = sum(len(items) for items in market["bakuNeighborhoods"].values())
    baku_streets = sum(v for k, v in street_count.items() if streets[k]["city"] == "Bakı")

    add("# Bakı üzrə ərazi bölgüsü — mənbələr, siyahı və saytda tətbiq")
    add("")
    add("> Yoxlama tarixi: **28 sentyabr 2026**. Sənəd `python scripts/build-location-report.py` ilə "
        "`prisma/baku-market-locations.json` və Ünvan Reyestri snapshot-larından (`prisma/unvanportali-*.json`) "
        "qurulur — əl ilə redaktə etmə.")
    add("")
    add("## Qısa nəticə")
    add("")
    add("| Qat | Say | Mənbə | Saytda |")
    add("|---|---:|---|---|")
    add("| Şəhər rayonu | 12 | DSK təsnifatı + Ünvan Reyestri | `DISTRICT`, rəsmi kodla |")
    add("| Rəsmi qəsəbə | 59 | DSK təsnifatı + Ünvan Reyestri | `SETTLEMENT`, rəsmi kodla "
        "(rayonla eyniadlı 4-ü rayonun özü ilə seçilir) |")
    add("| Rəsmi kənd | 0 | DSK: Bakıda kənd yoxdur | — |")
    add("| Bazar massivi / mikrorayon | %d | bina, kub, arenda, yeniemlak, lalafo; rayon OSM ilə yoxlanıb "
        "| `NEIGHBORHOOD` |" % hood_count)
    add("| Metro stansiyası | %d | bina, arenda, lalafo, yeniemlak | `METRO` |" % len(market["metro"]))
    add("| Nişangah | %d | bina, kub, yeniemlak (dublikatsız) | `LANDMARK`, elanda `landmarkId` |"
        % len(market["landmarks"]))
    add("| Rəsmi küçə/prospekt/döngə (Bakı) | %d | Ünvan Reyestri (unvanportali.az) | «Küçə» sahəsində təklif |"
        % baku_streets)
    add("")
    add("**Əsas qayda:** rəsmi inzibati vahid (rayon, qəsəbə, kənd) ilə bazarda işlənən ad (massiv, "
        "mikrorayon, bağ, nişangah, küçə) eyni səviyyədə saxlanmır. Rəsmi statusu yalnız Dövlət Statistika "
        "Komitəsinin təsnifatı və Ünvan Reyestri verir; elan saytlarının «qəs.» yazması status yaratmır.")
    add("")
    add("## Mənbələr")
    add("")
    add("| Mənbə | Nə götürüldü | Snapshot |")
    add("|---|---|---|")
    add("| [DSK — İnzibati Ərazi Bölgüsü Təsnifatı, 2024](https://e-qanun.az/framework/57325) "
        "| 12 rayon, 59 qəsəbə, 0 kənd | `prisma/az-admin-divisions.json` |")
    add("| [Ünvan Portalı](https://unvanportali.az/) — `api/adminUnits/list?parentId=<kod>` "
        "| bütün %d şəhər/rayon üzrə rəsmi ağac və kodlar | `prisma/unvanportali-admin-units.json` |"
        % (len(units["_roots"]) - 1))
    add("| Ünvan Portalı — `api/throughFares/<vahid>` | %d rəsmi küçə/prospekt/döngə/meydan/şose "
        "| `prisma/unvanportali-streets.json` → `public/data/kuceler/` |" % sum(street_count.values()))
    add("| [bina.az](https://bina.az) — `LocationGroups` GraphQL | 13 rayon, 25 metro, 104 qəsəbə/massiv, "
        "112 nişangah (valideynlə) | `docs/erazi/sources/bina-az.json` |")
    add("| [kub.az](https://kub.az) | 125 məntəqə, 25 metro, 160 nişangah | `docs/erazi/sources/kub-az.json` |")
    add("| [arenda.az](https://arenda.az) | 112 Bakı məntəqəsi, 27 metro, 73 Sumqayıt ərazisi | `docs/erazi/sources/arenda-az.json` |")
    add("| [yeniemlak.az](https://yeniemlak.az) | Bakı rayonları üzrə məntəqələr, ətraflı axtarış (nişangahlar), Abşeron (19), Sumqayıt (75) "
        "| `docs/erazi/sources/yeniemlak-az.json`, `yeniemlak-az-etrafli.txt` |")
    add("| [lalafo.az](https://lalafo.az) — `params/filter` API | 113 məntəqə, 26 metro, 12 rayon "
        "| `docs/erazi/sources/lalafo-az.json` |")
    add("| [tap.az](https://tap.az/elanlar/dasinmaz-emlak) | Strukturlu ərazi siyahısı yoxdur — "
        "«Yerləşmə yeri» sərbəst mətndir | — |")
    add("| [emlak.az](https://emlak.az) | Cloudflare yoxlaması səbəbindən oxunmadı | — |")
    add("| [evimemlak.az](https://evimemlak.az) | Yalnız Naxçıvan MR: Naxçıvan şəhəri + 7 rayon (hamısı ağacda var); "
        "məhəllə siyahısı yoxdur | — |")
    add("| bina.az / kub.az / lalafo.az — digər şəhərlər | Bakıdan kənarda demək olar ki, bölgü yoxdur "
        "(Naxçıvan MR rayonları, Quzanlı, Nabran) | `docs/erazi/sources/bina-az-other-cities.json`, `lalafo-az.json` |")
    add("| OpenStreetMap / Nominatim | Mənbələr ziddiyyətli olanda rayon sərhədi yoxlaması | — |")
    add("| İstifadəçinin araşdırması (`Desktop/erazi`) | Rəsmi kodlar, RİH məlumatları, yazılış düzəlişləri | — |")
    add("")
    add("## Mənbələr arasındakı ziddiyyətlər və qərar")
    add("")
    add("| Ad | Ziddiyyət | Qərar və əsas |")
    add("|---|---|---|")
    for row in CONFLICTS:
        add("| %s | %s | %s |" % row)
    add("")

    add("## Bakı: rayon, rəsmi qəsəbə və bazar massivləri")
    add("")
    by_name = {strip_suffix(item["fullName"]): item for item in units["Bakı"]}
    for name in BAKU_ORDER:
        district = by_name[name]
        add("### %s rayonu — kod `%s`, rayon səviyyəsində %d rəsmi küçə"
            % (name, district["code"], street_count.get(district["code"], 0)))
        add("")
        children = district.get("children", [])
        if children:
            add("**Rəsmi qəsəbələr:**")
            add("")
            add("| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |")
            add("|---|---|---:|---|")
            for child in sorted(children, key=lambda item: item["fullName"]):
                child_name = strip_suffix(child["fullName"])
                add("| %s | `%s` | %d | %s |" % (
                    child_name, child["code"], street_count.get(child["code"], 0),
                    ", ".join(aliases.get(child_name, [])) or "—"))
            add("")
        else:
            add("Rəsmi qəsəbə yoxdur — ərazi sahə inzibati ərazi dairələri ilə idarə olunur.")
            add("")
        hoods = market["bakuNeighborhoods"][name]
        if hoods:
            add("**Bazar massivləri (rəsmi vahid deyil):**")
            add("")
            add("| Ad | Alternativ yazılış | Mənbələr |")
            add("|---|---|---|")
            for hood in hoods:
                add("| %s | %s | %s |" % (hood["name"], ", ".join(hood.get("aliases", [])) or "—",
                                         sources(hood["sources"])))
            add("")

    add("## Metro stansiyaları (%d)" % len(market["metro"]))
    add("")
    add(", ".join(item["name"] for item in market["metro"]) + ".")
    add("")
    add("«Memar Əcəmi-2» bənövşəyi xəttin ayrıca stansiyasıdır (arenda.az ayrıca göstərir); "
        "bina/kub onu «Memar Əcəmi» ilə birləşdirir.")
    add("")
    add("## Nişangahlar (%d)" % len(market["landmarks"]))
    add("")
    add("bina.az, kub.az və yeniemlak.az siyahılarının birləşməsidir. Dublikatlar birləşdirilib "
        "(«ANS» = «ANS telekanalı», «Botanika bağı» = «Mərkəzi Nəbatat bağı», «Filarmoniya bağı» = "
        "«Qubernator parkı», «MUM» = «Mərkəzi Univermaq»), massiv/metro ilə təkrarlananlar (Ağ şəhər, "
        "İçəri Şəhər, Sovetski, Gürgən, Perekeşkül, Neftçilər metrosu) çıxarılıb, Abşerondakılar "
        "(Qurtuluş 93, Gənclər şəhərciyi) Abşeron massivi kimi saxlanılıb.")
    add("")
    add("| Nişangah | Alternativ ad | Mənbələr |")
    add("|---|---|---|")
    for item in sorted(market["landmarks"], key=lambda value: value["name"].lower()):
        add("| %s | %s | %s |" % (item["name"], ", ".join(item.get("aliases", [])) or "—",
                                 sources(item["sources"])))
    add("")

    add("## Digər şəhər və rayonlar (Ünvan Reyestri)")
    add("")
    add("| Şəhər/rayon | Kod | Rəsmi qəsəbə / şəhər | Rəsmi kənd | Rəsmi küçə |")
    add("|---|---|---:|---:|---:|")
    for city, root in units["_roots"].items():
        if city in ("Bakı", "Ələt azad iqtisadi zonası"):
            continue
        children = units[city]
        villages = sum(1 for child in children if child["fullName"].endswith(" kəndi"))
        city_streets = sum(v for k, v in street_count.items() if streets[k]["city"] == city)
        add("| %s | `%s` | %d | %d | %d |" % (city, root["code"], len(children) - villages, villages, city_streets))
    add("")
    for city, items in market["cityNeighborhoods"].items():
        add("%s bazar massivləri (rəsmi vahid deyil, %d): " % (city, len(items)) + ", ".join(
            "%s (%s)" % (item["name"], sources(item["sources"])) for item in items) + ".")
        add("")
    add("")
    add("Naxçıvan şəhərinin ərazisində rəsmi olaraq Əliabad qəsəbəsi və Bulqan, Hacıniyyət, Qaraçuq, "
        "Qaraxanbəyli, Tumbul kəndləri var; Naftalanda Qasımbəyli və Qaşaltı Qaraqoyunlu kəndləri. Gəncə üçün "
        "Ünvan Reyestri qəsəbələri rayon (Kəpəz/Nizami) üzrə bölmür — onlar şəhərə bağlı qalır.")
    add("")
    add("## Saytda harada tətbiq olunur")
    add("")
    add("| Yer | Nə dəyişdi |")
    add("|---|---|")
    for row in SITE_CHANGES:
        add("| %s | %s |" % row)
    add("")
    add("## Yeniləmə axını")
    add("")
    add("```bash")
    add("# Mənbəni yenilə: prisma/baku-market-locations.json (massiv, metro, nişangah, alias)")
    add("# və ya Ünvan Reyestri snapshot-larını (prisma/unvanportali-*.json), sonra:")
    add("npm run db:locations:build   # prisma/locations-data.ts — ziddiyyətdə dayanır")
    add("npm run db:streets:build     # public/data/kuceler/*.json")
    add("npm run db:taxonomy:build    # prisma/taxonomy.sql")
    add("npm run db:locations:report  # bu sənəd")
    add("npm run db:locations:migrations  # taxonomy.sql-in yerləşmə bölməsi → migrations/0050–0053")
    add("```")
    add("")
    add("## Açıq qalan məsələlər")
    add("")
    add("- **emlak.az** Cloudflare yoxlaması səbəbindən oxunmadı; yoxlamanı brauzerdə keçib siyahını müqayisə etmək olar.")
    add("- **Şuşa (Sabunçu)** kub.az və yeniemlak.az-da var, amma rəsmi və müstəqil təsdiq tapılmadı — əlavə edilmədi.")
    add("- Nişangahların EN/RU adları hələlik transliterasiyadır (`localizeLocation`).")
    add("- Nişangahlar hələlik şəhərə bağlıdır; koordinatla rayona bağlamaq sonrakı mərhələdir.")

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines) + "\n")
    print("docs/erazi/baki-erazi-bolgusu.md yazıldı — %d sətir." % len(lines))


if __name__ == "__main__":
    main()
