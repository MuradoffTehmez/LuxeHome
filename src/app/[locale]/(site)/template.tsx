/**
 * Səhifə keçidi animasiyası.
 *
 * `template.tsx` `layout.tsx`-dən onunla fərqlənir ki, hər naviqasiyada yenidən
 * mount olunur — CSS animasiyası da buna görə hər keçiddə yenidən işə düşür.
 *
 * **Niyə `loading.tsx` deyil.** `loading.tsx` Suspense sərhədi yaradır, Suspense
 * isə streaming-i məcbur edir; streaming başlayan kimi HTTP başlıqları göndərilir
 * və `notFound()` artıq 404 statusu qaytara bilmir. `74052c8` commit-i məhz bu
 * səbəbdən ictimai `loading.tsx` fayllarını silmişdi. `template.tsx` Suspense
 * sərhədi yaratmır, ona görə status kodları toxunulmaz qalır, keçid isə
 * kəskin sıçrayış olmaqdan çıxır.
 *
 * Animasiya qəsdən kiçikdir (160 ms, 4 px) — məzmunun gec gəldiyi hissi
 * yaratmamalıdır. `prefers-reduced-motion` `globals.css`-dəki ümumi qayda ilə
 * onsuz da neytrallaşır.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}</div>;
}
