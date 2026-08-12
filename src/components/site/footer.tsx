import Link from "next/link";
import { MapPin, Phone, Globe, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { legalNavigation, navigation, siteConfig } from "@/config/site";
import { InstagramIcon } from "./brand-icons";
import { Logo } from "./logo";

const PROPERTY_LINKS = [
  { label: "Mənzillər", href: "/emlaklar?tip=menziller" },
  { label: "Villalar", href: "/emlaklar?tip=villalar" },
  { label: "Həyət evləri", href: "/emlaklar?tip=heyet-evleri" },
  { label: "Bağ evləri", href: "/emlaklar?tip=bag-evleri" },
  { label: "Torpaq", href: "/emlaklar?tip=torpaq" },
  { label: "Ofislər", href: "/emlaklar?tip=ofisler" },
  { label: "Obyektlər", href: "/emlaklar?tip=obyektler" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark border-t border-zinc-800 bg-zinc-900 text-zinc-50">
      <Container className="py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brend */}
          <div className="flex flex-col gap-5">
            <Logo tone="dark" />
            <p className="max-w-xs text-sm leading-relaxed text-zinc-300">
              {siteConfig.slogan.charAt(0) + siteConfig.slogan.slice(1).toLowerCase()}.
              Mənzil, villa, torpaq və kommersiya obyektləri üzrə peşəkar daşınmaz
              əmlak xidmətləri.
            </p>

            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-gold-soft"
            >
              <InstagramIcon className="size-4" />
              @{siteConfig.instagram}
            </a>
          </div>

          {/* Naviqasiya */}
          <nav aria-labelledby="footer-nav-heading" className="flex flex-col gap-4">
            <h2
              id="footer-nav-heading"
              className="font-display text-sm tracking-[0.18em] text-gold-soft uppercase"
            >
              Naviqasiya
            </h2>
            <ul className="flex flex-col gap-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-sm text-zinc-300 transition-colors hover:text-zinc-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Əmlak kateqoriyaları */}
          <nav aria-labelledby="footer-props-heading" className="flex flex-col gap-4">
            <h2
              id="footer-props-heading"
              className="font-display text-sm tracking-[0.18em] text-gold-soft uppercase"
            >
              Əmlaklar
            </h2>
            <ul className="flex flex-col gap-1">
              {PROPERTY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-sm text-zinc-300 transition-colors hover:text-zinc-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Əlaqə */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-sm tracking-[0.18em] text-gold-soft uppercase">
              Əlaqə
            </h2>

            <address className="flex flex-col gap-3 text-sm not-italic text-zinc-300">
              <a
                href={siteConfig.phoneHref}
                className="flex min-h-11 items-center gap-3 transition-colors hover:text-gold-soft"
              >
                <Phone className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
                <span className="tabular">{siteConfig.phone}</span>
              </a>

              <span className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
                {siteConfig.addressFull}
              </span>

              <span className="flex items-start gap-3">
                <Globe className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
                {siteConfig.website}
              </span>

              <span className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
                <span className="flex flex-col">
                  <span>{siteConfig.workingHours.weekdays}</span>
                  <span>{siteConfig.workingHours.weekend}</span>
                </span>
              </span>
            </address>
          </div>
        </div>

        {/* Alt sətir */}
        <div className="mt-12 flex flex-col gap-4 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-300">
            © {year} {siteConfig.legalName}. Bütün hüquqlar qorunur.
          </p>

          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {legalNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-9 items-center text-xs text-zinc-300 transition-colors hover:text-zinc-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
