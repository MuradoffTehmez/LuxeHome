/**
 * Paylaşım kartı üçün qiymət mətni. OG şrifti (Geist) «₼» işarəsini daşımır, ona görə
 * valyuta kodu yazılır; minliklər adi boşluqla ayrılır (Intl-in dar boşluğu da şriftdə yoxdur).
 */
export function formatOgPrice(price: number, currency: string): string {
  const grouped = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const code = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return code === "$" || code === "€" ? `${code}${grouped}` : `${grouped} ${code}`;
}
