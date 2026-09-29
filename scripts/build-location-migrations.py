"""
`prisma/taxonomy.sql`-in yerləşmə bölməsini özü-yetərli D1 miqrasiyalarına bölür.

CI yalnız `migrations/` qovluğunu tətbiq edir, ona görə taksonomiya dəyişikliyi
production-a miqrasiya ilə çatdırılmalıdır. Ölkə üzrə ağac ~8 700 ifadədir; bir
faylın ölçüsü D1-də risk yaratmasın deyə ~500 KB-lıq ardıcıl hissələrə bölünür.
Sıra vacibdir — valideyn uşaqdan əvvəl yaranır (`taxonomy.sql` bu sıradadır).

Birinci faylın başlığı (sxem dəyişikliyi) və sonuncunun quyruğu (köhnə
«Alatava»nın köçürülməsi) mövcud faylardan götürülür; yalnız sətirlər yenilənir.

İşlətmə: python scripts/build-location-migrations.py
"""

import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAXONOMY = os.path.join(ROOT, "prisma", "taxonomy.sql")
MIGRATIONS = os.path.join(ROOT, "migrations")
FIRST = "0050_baku_location_details.sql"
PART = "%04d_country_locations_part%d.sql"
FIRST_NUMBER = 50
CHUNK_LINES = 2200
SECTION = "-- Şəhərlər və rayonlar"
TAIL = "\n-- Köhnə «Alatava»"


def read(path):
    with io.open(path, encoding="utf-8") as handle:
        return handle.read()


def main():
    rows = read(TAXONOMY)
    rows = rows[rows.index(SECTION):].rstrip().split("\n")

    parts = sorted(name for name in os.listdir(MIGRATIONS) if "_country_locations_part" in name)
    last = read(os.path.join(MIGRATIONS, parts[-1] if parts else FIRST))
    tail = last[last.index(TAIL):]
    first = read(os.path.join(MIGRATIONS, FIRST))
    head = first[:first.index(SECTION)]

    chunks, current = [], []
    for line in rows:
        current.append(line)
        # Hissə həmişə `UPDATE` ilə bitir — INSERT/UPDATE cütü bölünməsin.
        if len(current) >= CHUNK_LINES and line.startswith("UPDATE"):
            chunks.append(current)
            current = []
    if current:
        chunks.append(current)

    for name in parts:
        os.remove(os.path.join(MIGRATIONS, name))
    total = len(chunks)
    for index, chunk in enumerate(chunks):
        body = "\n".join(chunk) + "\n"
        if index == 0:
            name = FIRST
            text = head + body
        else:
            name = PART % (FIRST_NUMBER + index, index + 1)
            text = ("-- Ölkə üzrə ərazi bölgüsü (%d/%d): yerləşmə sətirlərinin davamı.\n"
                    "-- Mənbə və qaydalar: migrations/%s. İdempotentdir\n"
                    "-- (INSERT OR IGNORE + slug üzrə UPDATE); valideyn əvvəlki hissədə yaradılıb.\n\n"
                    "PRAGMA foreign_keys = ON;\n\n" % (index + 1, total, FIRST)) + body
        if index == total - 1:
            text += tail
        with io.open(os.path.join(MIGRATIONS, name), "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
        print("%s — %d sətir, %d KB" % (name, len(chunk), len(text.encode("utf-8")) // 1024))


if __name__ == "__main__":
    main()
