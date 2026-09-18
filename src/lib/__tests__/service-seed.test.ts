import { describe, expect, it } from "vitest";
import seedSql from "../../../prisma/seed.sql?raw";

const expectedDescriptions = new Map([
  [
    "alqi-satqi",
    [
      "Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.",
      "Bakıda daşınmaz əmlak alqı-satqısı: qiymətləndirmə, sənəd yoxlanışı, danışıqlar və notarial rəsmiləşdirmə üzrə peşəkar müşayiət.",
    ],
  ],
  [
    "icare",
    [
      "Mənzil, villa, ofis və digər əmlakların icarəsi.",
      "Bakıda mənzil, villa, ofis və kommersiya obyektlərinin qısa və uzunmüddətli icarəsi üzrə seçim, baxış və müqavilə dəstəyi.",
    ],
  ],
  [
    "ipoteka",
    [
      "İpoteka yolu ilə əmlak əldə etmək üçün dəstək.",
      "İpoteka ilə mənzil alışı üçün uyğun əmlak seçimi, sənədlərin hazırlanması, qiymətləndirmə və bank tələbləri üzrə peşəkar dəstək.",
    ],
  ],
  [
    "daxili-kredit",
    [
      "Şirkətin təqdim etdiyi daxili kredit imkanları.",
      "Seçilmiş əmlaklar üçün fərdi ilkin ödəniş və mərhələli ödəniş qrafiki ilə şirkətdaxili kredit imkanları və müqavilə dəstəyi.",
    ],
  ],
  [
    "temir-tikinti",
    [
      "Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.",
      "Bakıda mənzil və kommersiya obyektləri üçün kosmetik və əsaslı təmir, tikinti, daxili dizayn, smeta və mərhələli təhvil xidmətləri.",
    ],
  ],
  [
    "reklam",
    [
      "Daşınmaz əmlakların tanıtımı və reklam xidmətləri.",
      "Əmlak elanının hazırlanması, peşəkar təqdimatı, sosial media yayımı və hədəflənmiş rəqəmsal reklam kampaniyaları üzrə xidmət.",
    ],
  ],
  [
    "cekilis",
    [
      "Professional foto və video çəkiliş xidmətləri.",
      "Əmlaklar üçün peşəkar interyer və eksteryer fotoçəkilişi, video təqdimat, dron çəkilişi, 360° panorama və şəkil emalı.",
    ],
  ],
]);

describe("D1 xidmət seed-i", () => {
  it("SEO mətnlərini metaDescription sahəsində saxlayır", () => {
    const start = seedSql.indexOf("-- Service (11)");
    const end = seedSql.indexOf("-- Partner (1)", start);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const serviceSql = seedSql.slice(start, end);
    const rows = serviceSql.split('INSERT OR IGNORE INTO "Service"').slice(1);

    for (const [slug, [shortDescription, metaDescription]] of expectedDescriptions) {
      const row = rows.find((candidate) => candidate.includes(`'${slug}'`));
      const shortIndex = row?.indexOf(`'${shortDescription}'`) ?? -1;
      const metaIndex = row?.indexOf(`'${metaDescription}'`) ?? -1;

      expect(row).toBeDefined();
      expect(shortIndex).toBeGreaterThanOrEqual(0);
      expect(metaIndex).toBeGreaterThan(shortIndex);
      expect(metaDescription.length).toBeGreaterThanOrEqual(70);
      expect(metaDescription.length).toBeLessThanOrEqual(160);
    }
  });
});
