import { LegalArticle } from "@/components/site/legal-article";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Məxfilik siyasəti",
  description:
    "Luxe Home Estate saytında şəxsi məlumatların toplanması, istifadəsi və qorunması qaydaları.",
  path: "/mexfilik-siyaseti",
});

export default function PrivacyPage() {
  return (
    <LegalArticle
      title="Məxfilik siyasəti"
      description="Şəxsi məlumatlarınızı necə topladığımız, istifadə etdiyimiz və qoruduğumuz barədə."
      updatedAt="20 avqust 2026"
      path="/mexfilik-siyaseti"
    >
      <p>
        Bu siyasət {siteConfig.legalName} ({siteConfig.owner.name}) tərəfindən idarə olunan{" "}
        {siteConfig.name} saytına aiddir. Saytdan istifadə etməklə burada təsvir olunan
        qaydalarla razılaşmış olursunuz.
      </p>

      <h2>Hansı məlumatları toplayırıq</h2>
      <ul>
        <li>
          <strong>Müraciət formaları:</strong> ad, telefon nömrəsi, e-poçt ünvanı (könüllü),
          mövzu və mesaj mətni.
        </li>
        <li>
          <strong>Texniki məlumatlar:</strong> IP ünvanı, brauzer növü, cihaz tipi və
          səhifəyə giriş vaxtı — təhlükəsizlik və sui-istifadənin qarşısının alınması üçün.
        </li>
        <li>
          <strong>Brauzer yaddaşı:</strong> favorit elanların siyahısı və tema seçimi
          yalnız sizin cihazınızda (localStorage) saxlanılır, serverə göndərilmir.
        </li>
      </ul>

      <h2>Məlumatlardan necə istifadə edirik</h2>
      <ul>
        <li>Müraciətinizə cavab vermək və əmlak seçimi üzrə xidmət göstərmək.</li>
        <li>Saytın texniki işini təmin etmək və təhlükəsizliyini qorumaq.</li>
        <li>Qanunvericiliyin tələb etdiyi hallarda uçot aparmaq.</li>
      </ul>
      <p>
        Məlumatlarınız reklam məqsədilə üçüncü tərəflərə satılmır və ötürülmür.
      </p>

      <h2>Məlumatların saxlanması</h2>
      <p>
        Sayt və verilənlər bazası Cloudflare infrastrukturunda yerləşir. Müraciət qeydləri
        xidmətin göstərilməsi üçün zəruri müddət ərzində, ən çoxu 3 il saxlanılır və sonra silinir.
        E-poçt bildirişləri Resend xidməti vasitəsilə göndərilir.
      </p>

      <h2>Hüquqlarınız</h2>
      <ul>
        <li>Sizin haqqınızda saxlanılan məlumatları öyrənmək.</li>
        <li>Yanlış məlumatın düzəldilməsini tələb etmək.</li>
        <li>Məlumatlarınızın silinməsini tələb etmək.</li>
      </ul>
      <p>
        Bu hüquqlardan istifadə üçün <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>{" "}
        ünvanına və ya <a href={siteConfig.phoneHref}>{siteConfig.phone}</a> nömrəsinə müraciət edin.
      </p>

      <h2>Dəyişikliklər</h2>
      <p>
        Siyasətdə dəyişiklik edilərsə, yenilənmiş mətn bu səhifədə dərc olunur və yuxarıdakı
        tarix yenilənir.
      </p>
    </LegalArticle>
  );
}
