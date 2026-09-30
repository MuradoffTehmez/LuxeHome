/**
 * Bilik Mərkəzində istinad edilən rəsmi mənbələrin oxunaqlı adları.
 *
 * Məqalə mənbəni yalnız URL kimi saxlayır (`KnowledgeArticle.sourceUrls`). Beş fərqli
 * qanun eyni `e-qanun.az` hostunda olduğu üçün oxucu linkləri ayırd edə bilmirdi —
 * burada tanınan ünvanlar üçün ad verilir, tanınmayan üçün host + yol göstərilir.
 *
 * Siyahıdakı hər ünvan 29.09.2026-da yoxlanılıb: e-qanun ID-ləri `api.e-qanun.az`
 * cavabındakı rəsmi başlıqla və «Qüvvədədir» statusu ilə təsdiqlənib.
 */
export const OFFICIAL_SOURCE_LABELS: Record<string, string> = {
  "e-qanun.az/framework/46944": "Mülki Məcəllə",
  "e-qanun.az/framework/46948": "Vergi Məcəlləsi",
  "e-qanun.az/framework/46942": "Torpaq Məcəlləsi",
  "e-qanun.az/framework/46955": "Mənzil Məcəlləsi",
  "e-qanun.az/framework/46958": "Şəhərsalma və Tikinti Məcəlləsi",
  "e-qanun.az/framework/46946": "Ailə Məcəlləsi",
  "e-qanun.az/framework/5456": "«Daşınmaz əmlakın dövlət reyestri haqqında» Qanun",
  "e-qanun.az/framework/107": "«Notariat haqqında» Qanun",
  "e-qanun.az/framework/9902": "«İpoteka haqqında» Qanun",
  "e-qanun.az/framework/2860": "«Dövlət rüsumu haqqında» Qanun",
  "e-qanun.az/framework/22228": "«İcbari sığortalar haqqında» Qanun",
  "e-qanun.az/framework/57325": "İnzibati ərazi bölgüsü təsnifatı (2024)",
  "mcgf.gov.az/az/ipoteka-krediti": "İpoteka və Kredit Zəmanət Fondu — ipoteka şərtləri",
  "emlak.gov.az/az": "Əmlak Məsələləri Dövlət Xidməti",
  "e-emlak.gov.az": "ƏMDX elektron xidmətlər portalı",
  "www.taxes.gov.az/az": "Dövlət Vergi Xidməti",
  "my.gov.az": "Elektron hökumət portalı",
  "asan.gov.az": "ASAN xidmət",
  "justice.gov.az/az": "Ədliyyə Nazirliyi",
  "www.mida.gov.az": "Mənzil İnşaatı Dövlət Agentliyi (MİDA)",
  "arxkom.gov.az": "Şəhərsalma və Arxitektura Komitəsi",
  "www.stat.gov.az": "Dövlət Statistika Komitəsi",
  "fhn.gov.az/az": "Fövqəladə Hallar Nazirliyi",
};

export type OfficialSource = { url: string; label: string; host: string };

/** Etibarsız və ya http(s) olmayan URL `null` qaytarır — səhifə sınmamalıdır. */
export function describeSource(url: string): OfficialSource | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const key = `${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, "");
  const label = OFFICIAL_SOURCE_LABELS[key] ?? key;
  return { url, label, host: parsed.hostname };
}
