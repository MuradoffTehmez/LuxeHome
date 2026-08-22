import Link from "next/link";
import { MapPin, Phone, Globe, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  legalNavigation,
  listingLinks,
  navigation,
  propertyTypeLinks,
  siteConfig,
  supportNavigation,
} from "@/config/site";
import { InstagramIcon } from "./brand-icons";
import { Logo } from "./logo";

function TagLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center rounded-full border border-zinc-700 px-3.5 text-xs font-medium text-zinc-300 transition-colors duration-200 hover:border-gold-soft/60 hover:text-gold-soft"
    >
      {label}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark relative border-t border-zinc-800 bg-zinc-900 text-zinc-50">
      {/* Üst qızıl xətt — brend aksenti, digər bölmələrdən vizual ayrılıq üçün */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <Container className="py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brend */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <Logo tone="dark" />
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              {siteConfig.slogan.charAt(0) + siteConfig.slogan.slice(1).toLowerCase()}.
              Mənzil, villa, torpaq və kommersiya obyektləri üzrə peşəkar daşınmaz
              əmlak xidmətləri.
            </p>

            <div className="flex flex-col gap-2">
              <span className="editorial-kicker text-zinc-500">Bizi izləyin</span>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-11 w-fit items-center gap-2.5 rounded-full border border-zinc-800 py-1.5 pr-4 pl-2 text-sm text-zinc-300 transition-colors duration-200 hover:border-gold-soft/40 hover:text-gold-soft"
              >
                <span className="grid size-7 place-items-center rounded-full bg-zinc-800 text-zinc-300 transition-colors duration-200 group-hover:bg-gold-soft/15 group-hover:text-gold-soft">
                  <InstagramIcon className="size-3.5" />
                </span>
                @{siteConfig.instagram}
              </a>
            </div>
          </div>

          {/* Naviqasiya */}
          <nav aria-labelledby="footer-nav-heading" className="flex flex-col gap-4 lg:col-span-3">
            <h2
              id="footer-nav-heading"
              className="editorial-kicker text-gold-soft"
            >
              Naviqasiya
            </h2>
            <ul className="flex flex-col gap-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-sm text-zinc-300 transition-colors hover:text-gold-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-2 flex flex-col gap-1 border-t border-zinc-800 pt-4">
              {supportNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-9 items-center text-sm text-zinc-400 transition-colors hover:text-gold-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Əlaqə */}
          <div className="flex flex-col gap-4 rounded-md border border-zinc-800 bg-zinc-900/60 p-5 lg:col-span-4">
            <h2 className="editorial-kicker text-gold-soft">
              Əlaqə
            </h2>

            <address className="flex flex-col gap-3.5 text-sm not-italic text-zinc-300">
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

        {/* Əmlak kateqoriyaları — teq/pill zolağı */}
        <nav
          aria-labelledby="footer-props-heading"
          className="mt-10 border-t border-zinc-800 pt-8"
        >
          <h2 id="footer-props-heading" className="editorial-kicker mb-4 text-gold-soft">
            Əmlaklar
          </h2>
          <ul className="flex flex-wrap gap-2">
            {propertyTypeLinks.map((item) => (
              <li key={item.href}>
                <TagLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Elan növü üzrə keçidlər */}
        <nav
          aria-labelledby="footer-listing-heading"
          className="mt-6 border-t border-zinc-800 pt-6"
        >
          <h2 id="footer-listing-heading" className="editorial-kicker mb-4 text-gold-soft">
            Elan növü
          </h2>
          <ul className="flex flex-wrap gap-2">
            {listingLinks.map((item) => (
              <li key={item.href}>
                <TagLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Alt sətir */}
        <div className="mt-10 flex flex-col gap-4 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-xs text-zinc-500">
            <p>© {year} {siteConfig.legalName}. Bütün hüquqlar qorunur.</p>
            <p>
              Sayt, «{siteConfig.name}» brendi və markası {siteConfig.owner.name}-na məxsusdur.
            </p>
          </div>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legalNavigation.map((item, index) => (
              <li key={item.href} className="flex items-center gap-5">
                {index > 0 && <span className="size-1 rounded-full bg-zinc-700" aria-hidden="true" />}
                <Link
                  href={item.href}
                  className="inline-flex min-h-9 items-center text-xs text-zinc-500 transition-colors hover:text-zinc-200"
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
