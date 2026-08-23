import Link from "next/link";
import { ChevronDown, Clock, Globe, MapPin, Phone } from "lucide-react";
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

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <details className="group border-b border-line-dark lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 text-sm font-semibold text-ink-invert marker:content-none">
          {title}
          <ChevronDown
            className="size-4 shrink-0 text-gold-soft transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="pb-5">{children}</div>
      </details>

      <section className="hidden lg:block">
        <h2 className="text-sm font-semibold text-ink-invert">{title}</h2>
        <div className="pt-5">{children}</div>
      </section>
    </>
  );
}

function FooterLinkList({
  items,
}: {
  items: readonly { label: string; href: string }[];
}) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="inline-flex min-h-11 items-center rounded-xs text-sm text-ink-invert-soft transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PropertyLinks() {
  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 lg:grid-cols-1 xl:grid-cols-2">
        {propertyTypeLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-xs text-sm text-ink-invert-soft transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-line-dark pt-4">
        <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-gold-soft uppercase">
          Elan növü
        </p>
        <ul className="flex flex-wrap gap-2">
          {listingLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-xs border border-line-dark px-3 text-xs font-medium text-ink-invert-soft transition-colors hover:border-gold-soft hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ContactDetails() {
  return (
    <address className="flex flex-col gap-3 text-sm not-italic text-ink-invert-soft">
      <a
        href={siteConfig.phoneHref}
        className="flex min-h-11 items-center gap-3 rounded-xs transition-colors hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <Phone className="size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        <span className="tabular">{siteConfig.phone}</span>
      </a>
      <span className="flex items-start gap-3 py-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        {siteConfig.addressFull}
      </span>
      <span className="flex items-start gap-3 py-2">
        <Globe className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        {siteConfig.website}
      </span>
      <span className="flex items-start gap-3 py-2">
        <Clock className="mt-0.5 size-4 shrink-0 text-gold-soft" aria-hidden="true" />
        <span className="flex flex-col">
          <span>{siteConfig.workingHours.weekdays}</span>
          <span>{siteConfig.workingHours.weekend}</span>
        </span>
      </span>
    </address>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const navigationItems = [...navigation, ...supportNavigation];

  return (
    <footer className="on-dark relative border-t border-line-dark bg-navy text-ink-invert">
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <Container className="py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.8fr_1.3fr_1fr] lg:gap-10 xl:gap-14">
          <div className="flex flex-col gap-5 pb-2 lg:pb-0">
            <Logo tone="dark" />
            <p className="max-w-sm text-sm leading-7 text-ink-invert-soft">
              {siteConfig.slogan.charAt(0) + siteConfig.slogan.slice(1).toLowerCase()}.
              Mənzil, villa, torpaq və kommersiya obyektləri üzrə peşəkar daşınmaz
              əmlak xidmətləri.
            </p>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-11 w-fit items-center gap-2.5 rounded-xs border border-line-dark px-3 text-sm text-ink-invert-soft transition-colors hover:border-gold-soft hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <InstagramIcon className="size-4" />
              @{siteConfig.instagram}
            </a>
          </div>

          <FooterSection title="Naviqasiya">
            <FooterLinkList items={navigationItems} />
          </FooterSection>

          <FooterSection title="Əmlaklar">
            <PropertyLinks />
          </FooterSection>

          <FooterSection title="Əlaqə">
            <ContactDetails />
          </FooterSection>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-line-dark pt-6 lg:mt-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-1 text-xs leading-5 text-ink-invert-muted">
            <p>© {year} {siteConfig.legalName}. Bütün hüquqlar qorunur.</p>
            <p>
              Sayt, «{siteConfig.name}» brendi və markası {siteConfig.owner.name}-na məxsusdur.
            </p>
            <p className="tabular">VÖEN: {siteConfig.legal.voen}</p>
          </div>

          <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            {legalNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-xs text-xs text-ink-invert-muted transition-colors hover:text-ink-invert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
