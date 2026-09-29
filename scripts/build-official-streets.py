"""
`prisma/unvanportali-streets.json` -> `public/data/kuceler/<kod>.json` generatoru.

Mənbə rəsmi Ünvan Reyestridir (unvanportali.az, `throughFares/<vahid>`): hər
rayon, qəsəbə və kənd üçün küçə, prospekt, döngə, meydan və şose siyahısı.
Elan formasındakı «Küçə» sahəsi seçilmiş yerin rəsmi kodu (`Location.officialCode`)
ilə bu fayllardan birini yükləyib təklif kimi göstərir.

Niyə statik fayl: ~20 000 ad Worker bundle-ına və ya D1-ə düşsəydi hər sorğuda
yük olardı; `public/` altındakı fayl CDN-dən keşlənir və yalnız forma açılanda
yüklənir.

Ad formatı gündəlik ünvan yazılışına uyğundur: «Cəfər Xəndan küçəsi»,
«Azadlıq prospekti», döngə isə ana küçə ilə — «Cəfər Xəndan küçəsi, 1-ci döngə».
Respublika əhəmiyyətli avtomobil yolları (Bakı–Quba və s.) hər rayonda təkrarlanır
və ünvan kimi işlənmir, ona görə atılır.

İşlətmə: python scripts/build-official-streets.py
"""

import io
import re
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "prisma", "unvanportali-streets.json")
OUT = os.path.join(ROOT, "public", "data", "kuceler")
# Faylı olan kodların siyahısı — forma mövcud olmayan faylı soruşub 404 almasın
# (məs. Bakının kök kodu: küçələr rayon və qəsəbə səviyyəsindədir).
CODES_OUT = os.path.join(ROOT, "src", "lib", "official-street-codes.ts")

SUFFIX = {
    "Küçə": "küçəsi",
    "Prospekt": "prospekti",
    "Meydan": "meydanı",
    "Şose": "şossesi",
    "Xiyaban": "xiyabanı",
}
SKIPPED_TYPES = {"Avtomobil yolu"}

# Azərbaycan əlifbası sırası: Python-un kod nöqtəsi sırası «ğ», «ə», «ş»-ni
# «z»-dən sonraya atardı.
ALPHABET = "abcçdeəfgğhxıijkqlmnoöprsştuüvyz"
ORDER = {char: index for index, char in enumerate(ALPHABET)}


def az_key(value):
    """Azərbaycan əlifbası + təbii rəqəm sırası: «2-ci» «10-cu»dan əvvəl."""
    lowered = value.replace("I", "ı").replace("İ", "i").lower()
    parts = re.split(r"(\d+)", lowered)
    return [(0, int(part)) if part.isdigit() else (1, letters_key(part)) for part in parts if part]


def letters_key(lowered):
    # Boşluq və rəqəm hərflərdən əvvəl gəlir: «28 May», «Abbas Səhhət», «Abbasqulu».
    return [(1, ORDER[char]) if char in ORDER else (0 if char == " " or char.isdigit() else 2, ord(char))
            for char in lowered]


def label(name, kind):
    suffix = SUFFIX.get(kind)
    if not suffix:
        return name
    # «Meydan 2», «28 May meydanı» kimi adlarda növ artıq yazılıb
    if name.lower().endswith(suffix) or name.lower().startswith(kind.lower()):
        return name
    return "%s %s" % (name, suffix)


def main():
    with io.open(SRC, encoding="utf-8") as handle:
        data = json.load(handle)

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    files = 0
    total = 0
    written = []
    for code, unit in sorted(data.items()):
        if code.startswith("_"):
            continue
        names = set()
        for street in unit["streets"]:
            if street["type"] in SKIPPED_TYPES:
                continue
            if street["type"] == "Döngə" and street.get("parent"):
                # «12-ci Göl kənarı 2-ci döngə» ana küçənin adını artıq daşıyır
                if street["parent"].lower() in street["name"].lower():
                    names.add(street["name"])
                else:
                    names.add("%s, %s" % (label(street["parent"], street["parentType"]), street["name"]))
            else:
                names.add(label(street["name"], street["type"]))
        if not names:
            continue
        ordered = sorted(names, key=az_key)
        with io.open(os.path.join(OUT, "%s.json" % code), "w", encoding="utf-8", newline="\n") as handle:
            json.dump(ordered, handle, ensure_ascii=False, separators=(",", ":"))
        files += 1
        total += len(ordered)
        written.append(code)

    lines = [
        "/**",
        " * Rəsmi küçə faylı olan Ünvan Reyestri kodları (`public/data/kuceler/<kod>.json`).",
        " *",
        " * **Generasiya olunur — əl ilə redaktə etmə.** Generator:",
        " * `python scripts/build-official-streets.py`.",
        " */",
        "export const OFFICIAL_STREET_CODES: ReadonlySet<string> = new Set([",
    ]
    lines += ['  "%s",' % code for code in written]
    lines.append("]);")
    with io.open(CODES_OUT, "w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines) + "\n")

    print("public/data/kuceler — %d fayl, %d küçə adı." % (files, total))


if __name__ == "__main__":
    main()
