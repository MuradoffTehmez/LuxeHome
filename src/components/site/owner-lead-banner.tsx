import { ArrowRight, Home } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { WhatsAppIcon } from "@/components/site/brand-icons";
import { whatsappLink } from "@/config/site";

type OwnerLeadBannerProps = {
  labels: {
    overline: string;
    title: string;
    description: string;
    primary: string;
    whatsapp: string;
    whatsappMessage: string;
  };
  href?: string;
};

/**
 * Satıcı/icarəyə verən üçün müraciət bloku. Portfel boş olanda ana səhifədə boş
 * vəziyyət mesajının yerini tutur — ziyarətçiyə «heç nə yoxdur» demək əvəzinə
 * agentliyə inventar gətirən axını təklif edir (#103).
 */
export function OwnerLeadBanner({ labels, href = "/emlakimi-sat" }: OwnerLeadBannerProps) {
  return (
    <Section tone="ivory" spacing="cozy">
      <Container size="wide">
        <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-line bg-paper p-6 shadow-sm sm:p-10 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-10">
          <span className="grid size-14 place-items-center rounded-xl bg-gold/15 text-gold-deep" aria-hidden="true">
            <Home className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="editorial-kicker text-gold-deep">{labels.overline}</p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.15] tracking-[-0.02em] text-ink">
              {labels.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{labels.description}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href={href} className={buttonClassName("primary", "lg")}>
              {labels.primary}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={whatsappLink(labels.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName("outline", "lg")}
            >
              <WhatsAppIcon className="size-4" aria-hidden="true" />
              {labels.whatsapp}
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
