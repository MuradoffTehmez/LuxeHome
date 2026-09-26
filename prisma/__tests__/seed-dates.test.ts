import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Prisma D1-də DateTime sütunlarını ISO mətn kimi oxuyur. Seed-də epoch rəqəmi
 * (məs. 1787850000000) yazılsa, həmin cədvəldən oxuyan hər sorğu çökür —
 * TREVA qeydi `/admin/terefdaslar`-ı belə sındırırdı (#99).
 */
describe("seed.sql tarix formatı", () => {
  it("epoch millisaniyə rəqəmi saxlamır", () => {
    const sql = readFileSync(join(process.cwd(), "prisma", "seed.sql"), "utf8");
    // Dəyər kimi yazılmış 13 rəqəmli ədəd (2001–2286 aralığı). URL daxilindəki
    // şəkil ID-ləri (`photo-1600…`) tire/slash-dan sonra gəlir və sayılmır.
    const epochValues = sql.match(/(?<![\w'"/-])1\d{12}(?![\w'"])/g) ?? [];

    expect(epochValues).toEqual([]);
  });

  it("0033 miqrasiyası Partner tarixlərini ISO-ya çevirir", () => {
    const migration = readFileSync(join(process.cwd(), "migrations", "0033_partner_iso_dates.sql"), "utf8");

    for (const column of ["createdAt", "updatedAt"]) {
      expect(migration).toContain(`UPDATE "Partner" SET "${column}" = strftime('%Y-%m-%dT%H:%M:%fZ'`);
      expect(migration).toContain(`WHERE typeof("${column}") = 'integer'`);
    }
  });
});
