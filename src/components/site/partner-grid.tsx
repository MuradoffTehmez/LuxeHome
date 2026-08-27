import { Reveal } from "@/components/ui/reveal";
import { PartnerCard } from "./partner-card";
import type { PartnerCardData } from "@/lib/queries";
import type { Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Tərəfdaş grid-i — mobil 1, planşet 2, desktop 3–4 sütun.
 *
 * Sütun sayı elementlərin sayına uyğunlaşır: üç tərəfdaşı dörd sütunlu şəbəkəyə
 * qoymaq sonuncu xananı boş qoyub kompozisiyanı pozardı.
 */
export function PartnerGrid({
  partners,
  locale,
  className,
}: {
  partners: PartnerCardData[];
  locale: Locale;
  className?: string;
}) {
  const columns =
    partners.length >= 8
      ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : partners.length >= 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <div className={cn("grid grid-cols-1 gap-5", columns, className)}>
      {partners.map((partner, index) => (
        // Gecikmə altıncı kartdan sonra dayanır — uzun siyahıda son kartların
        // yarım saniyə gec görünməsi zəiflik kimi hiss olunur.
        <Reveal key={partner.id} delay={Math.min(index, 5) * 60}>
          <PartnerCard partner={partner} locale={locale} />
        </Reveal>
      ))}
    </div>
  );
}
