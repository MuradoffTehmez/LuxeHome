import { LegalArticle } from "@/components/site/legal-article";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cookie siyasəti",
  description:
    "Luxe Home Estate saytında istifadə olunan cookie və brauzer yaddaşı texnologiyaları.",
  path: "/cookie-siyaseti",
});

export default function CookiePage() {
  return (
    <LegalArticle
      title="Cookie siyasəti"
      description="Saytda hansı cookie-lərin işlədiyi və onları necə idarə edə biləcəyiniz."
      updatedAt="20 avqust 2026"
      path="/cookie-siyaseti"
    >
      <p>
        Cookie — saytın brauzerinizdə saxladığı kiçik mətn faylıdır. {siteConfig.name}{" "}
        yalnız saytın işləməsi üçün zəruri olan minimal dəsti istifadə edir.
      </p>

      <h2>İstifadə olunan növlər</h2>
      <ul>
        <li>
          <strong>Zəruri:</strong> təhlükəsizlik, sorğu balanslaşdırılması və sui-istifadənin
          qarşısının alınması üçün Cloudflare tərəfindən qoyulan texniki cookie-lər.
        </li>
        <li>
          <strong>Seçim yaddaşı (localStorage):</strong> tema (işıqlı/tünd) və favorit elanların
          siyahısı. Bu məlumat yalnız sizin cihazınızda qalır, serverə göndərilmir.
        </li>
      </ul>
      <p>
        Hazırda saytda reklam və ya davranış izləmə cookie-ləri istifadə olunmur.
        Analitika alətləri əlavə edilərsə, bu səhifə yenilənəcək.
      </p>

      <h2>İdarə etmək</h2>
      <p>
        Cookie-ləri brauzerinizin parametrlərindən silə və ya bloklaya bilərsiniz. Zəruri
        cookie-lər bloklanarsa saytın bəzi hissələri düzgün işləməyə bilər. Brauzer yaddaşındakı
        favoritləri «Favoritlər» səhifəsindəki «Siyahını təmizlə» düyməsi ilə silmək mümkündür.
      </p>

      <h2>Əlaqə</h2>
      <p>
        Suallarınız üçün: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </LegalArticle>
  );
}
