import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container, Section } from "@/components/ui/container";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";

const discoveryLinks = [
  { href: "/satilan-emlaklar", label: "Satılan əmlaklar" },
  { href: "/kiraye-emlaklar", label: "Kirayə əmlaklar" },
  { href: "/bakida-satilan-menziller", label: "Bakıda satılan mənzillər" },
  { href: "/villalar", label: "Villalar" },
  { href: "/layiheler", label: "Yaşayış layihələri" },
] as const;

/** Ana səhifədə axtarış niyyətini izah edən, crawl edilə bilən lokal giriş. */
export function HomeSeoIntro({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const localePrefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return (
    <Section tone="paper" spacing="cozy" aria-labelledby="home-seo-intro-title">
      <Container size="wide">
        <div className="grid gap-7 border-y border-line py-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-10">
          <div>
            <p className="editorial-kicker text-gold-deep">Bakı əmlak bazarı</p>
            <h2
              id="home-seo-intro-title"
              className="mt-3 max-w-xl font-display text-3xl leading-tight text-ink sm:text-4xl"
            >
              Evinizi və investisiya üçün uyğun məkanı inamla seçin
            </h2>
          </div>

          <div className="flex flex-col gap-5 text-base leading-relaxed text-ink-soft">
            <p>
              Luxe Home Estate Bakıda daşınmaz əmlak axtaran alıcı, kirayəçi və mülkiyyətçilər
              üçün mənzil, villa, həyət evi, torpaq, ofis və kommersiya obyektlərini bir araya
              gətirir. Elanları satış və kirayə məqsədinə, əmlak növünə, şəhər və rayona, qiymətə,
              sahəyə və digər vacib meyarlara görə araşdırmaq mümkündür. Hər elanda mövcud olan
              qiymət, yerləşmə, sahə, otaq sayı, sənəd və təmir məlumatları qərar verməzdən əvvəl
              variantları daha aydın müqayisə etməyə kömək edir.
            </p>
            <p>
              Axtarışa hazır seçimlərdən başlayın, uyğun yaşayış komplekslərini nəzərdən keçirin
              və maraqlandığınız əmlak üzrə komandamızla birbaşa əlaqə saxlayın. Portfeldə real
              aktiv elan olmadıqda süni təklif göstərilmir; yeni əmlaklar dərc olunduqca müvafiq
              kateqoriya və yerləşmə səhifələrində görünür. Məqsədimiz tələbinizə uyğun variantı
              tapmağı sadə, şəffaf və rahat prosesə çevirməkdir.
            </p>
            <nav aria-label="Əsas əmlak seçimləri" className="flex flex-wrap gap-x-6 gap-y-3">
              {discoveryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={`${localePrefix}${item.href}`}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-gold-deep"
                >
                  {item.label}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </Container>
    </Section>
  );
}
