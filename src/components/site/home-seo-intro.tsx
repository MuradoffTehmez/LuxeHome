import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { DEFAULT_LOCALE, type Locale } from "@/lib/constants";

const discoveryLinks = [
  { href: "/satilan-emlaklar", key: "sale" },
  { href: "/kiraye-emlaklar", key: "rent" },
  { href: "/bakida-satilan-menziller", key: "apartments" },
  { href: "/villalar", key: "villas" },
  { href: "/layiheler", key: "projects" },
] as const;

/** Ana səhifədə axtarış niyyətini izah edən, crawl edilə bilən lokal giriş. */
export async function HomeSeoIntro({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = await getTranslations({ locale, namespace: "home.intro" });
  return (
    <Section tone="paper" spacing="cozy" aria-labelledby="home-seo-intro-title">
      <Container size="wide">
        <div className="grid gap-7 border-y border-line py-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-10">
          <div>
            <p className="editorial-kicker text-gold-deep">{t("eyebrow")}</p>
            <h2
              id="home-seo-intro-title"
              className="mt-3 max-w-xl font-display text-3xl leading-tight text-ink sm:text-4xl"
            >
              {t("title")}
            </h2>
          </div>

          <div className="flex flex-col gap-5 text-base leading-relaxed text-ink-soft">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
            <nav aria-label={t("navLabel")} className="flex flex-wrap gap-x-6 gap-y-3">
              {discoveryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-gold-deep"
                >
                  {t(`links.${item.key}`)}
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
