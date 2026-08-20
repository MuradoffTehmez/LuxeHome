import { LegalArticle } from "@/components/site/legal-article";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "İstifadə şərtləri",
  description:
    "Luxe Home Estate saytından istifadə qaydaları, məsuliyyət hüdudları və müəllif hüquqları.",
  path: "/istifade-sertleri",
});

export default function TermsPage() {
  return (
    <LegalArticle
      title="İstifadə şərtləri"
      description="Saytdan istifadə edərkən qüvvədə olan qaydalar."
      updatedAt="20 avqust 2026"
    >
      <p>
        {siteConfig.name} saytı {siteConfig.legalName} ({siteConfig.owner.name}) tərəfindən
        idarə olunur. Saytı ziyarət etməklə aşağıdakı şərtləri qəbul edirsiniz.
      </p>

      <h2>Elanların statusu</h2>
      <p>
        Saytda yerləşdirilən əmlak elanları, qiymətlər və texniki göstəricilər məlumat
        xarakteri daşıyır və ictimai oferta sayılmır. Qiymət və mövcudluq xəbərdarlıq
        olmadan dəyişə bilər. Müqavilə bağlanmazdan əvvəl bütün məlumatlar şirkətlə
        birbaşa dəqiqləşdirilməlidir.
      </p>
      <p>
        «Nümunə» nişanı ilə işarələnmiş elanlar saytın nümayişi üçün hazırlanmış demo
        məzmundur və real təklif deyil.
      </p>

      <h2>İstifadəçinin öhdəlikləri</h2>
      <ul>
        <li>Müraciət formalarında doğru və özünüzə aid əlaqə məlumatı göstərmək.</li>
        <li>Saytın işini pozan avtomatlaşdırılmış vasitələrdən istifadə etməmək.</li>
        <li>Məzmunu icazəsiz kopyalayıb kommersiya məqsədilə yaymamaq.</li>
      </ul>

      <h2>Müəllif hüquqları</h2>
      <p>
        Saytın dizaynı, mətnləri, fotoşəkilləri, loqotipi və «Luxe Home Estate» brendi{" "}
        {siteConfig.owner.name}-na məxsusdur. Yazılı icazə olmadan istifadə qadağandır.
      </p>

      <h2>Məsuliyyət hüdudu</h2>
      <p>
        Şirkət saytdakı məlumatların dolğunluğuna görə maksimum səy göstərsə də, texniki
        səhvlərdən və ya üçüncü tərəf mənbələrindən qaynaqlanan qeyri-dəqiqliyə görə
        məsuliyyət daşımır. Xarici saytlara olan linklərin məzmunu şirkətin nəzarətində deyil.
      </p>

      <h2>Əlaqə</h2>
      <p>
        Suallar üçün: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>,{" "}
        <a href={siteConfig.phoneHref}>{siteConfig.phone}</a>, {siteConfig.addressFull}.
      </p>
    </LegalArticle>
  );
}
