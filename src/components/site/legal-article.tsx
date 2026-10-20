import { CalendarClock, ChevronDown, Cookie, FileText, Mail, Phone, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type LegalDocumentKey = "privacy" | "terms" | "cookies";

const LEGAL_DOCUMENTS: { key: LegalDocumentKey; href: string; icon: typeof ShieldCheck }[] = [
  { key: "privacy", href: "/mexfilik-siyaseti", icon: ShieldCheck },
  { key: "terms", href: "/istifade-sertleri", icon: FileText },
  { key: "cookies", href: "/cookie-siyaseti", icon: Cookie },
];

export type LegalTocItem = { id: string; label: string };

export type LegalCompanyCard = {
  legalName: string;
  voen: string;
  address: string;
  email: string;
  phone: string;
  phoneHref: string;
};

/**
 * Hüquqi mətn səhifələri üçün ümumi çərçivə (məxfilik, şərtlər, cookie): sənədlər arası keçid, mündəricat
 * (desktopda yapışqan yan panel, mobil ekranda qatlanan siyahı), oxunaqlı mətn sütunu və rekvizit kartı.
 * Mündəricat və keçidlər adi `<a>`/`Link`-dir — client JS lazım deyil.
 */
export function LegalArticle({
  title,
  description,
  updatedAt,
  path,
  activeDocument,
  toc = [],
  company,
  children,
}: {
  title: string;
  description?: string;
  updatedAt: string;
  path: string;
  activeDocument?: LegalDocumentKey;
  toc?: LegalTocItem[];
  company?: LegalCompanyCard;
  children: React.ReactNode;
}) {
  const t = useTranslations("legal");
  const nav = useTranslations("navigation");

  const documentNav = (
    <nav aria-label={t("documents")}>
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {LEGAL_DOCUMENTS.map(({ key, href, icon: Icon }) => {
          const active = key === activeDocument;
          return (
            <li key={key} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-sm border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  active ? "border-gold/60 bg-paper text-ink shadow-xs" : "border-line bg-paper/60 text-ink-soft hover:border-line-strong hover:text-ink",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-gold-deep" : "text-ink-muted")} aria-hidden="true" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const tocList = (
    <ol className="flex flex-col gap-0.5 text-sm">
      {toc.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="block rounded-xs border-l-2 border-transparent py-1.5 pl-3 pr-2 leading-snug text-ink-soft transition-colors hover:border-gold hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <PageHeader
        compact
        eyebrow={t("eyebrow")}
        title={title}
        description={description}
        breadcrumbs={[
          { label: nav("home"), href: "/" },
          { label: title, href: path },
        ]}
      />

      <Section tone="ivory" spacing="cozy">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
            <aside className="no-print min-w-0 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto">
              <p className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted lg:block">{t("documents")}</p>
              {documentNav}

              {toc.length > 0 ? (
                <>
                  <details className="group mt-4 rounded-lg border border-line bg-paper shadow-xs lg:hidden">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      {t("toc")}
                      <ChevronDown className="size-4 text-ink-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="border-t border-line px-2 py-3">{tocList}</div>
                  </details>
                  <nav aria-label={t("toc")} className="mt-8 hidden lg:block">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{t("toc")}</p>
                    {tocList}
                  </nav>
                </>
              ) : null}
            </aside>

            <div className="min-w-0">
              <article className="rounded-xl border border-line bg-paper p-6 shadow-xs sm:p-10">
                <p className="mb-8 inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-ivory px-4 text-sm text-ink-muted">
                  <CalendarClock className="size-4 text-gold-deep" aria-hidden="true" />
                  {t("updated", { date: updatedAt })}
                </p>
                <div
                  className={[
                    "legal-prose flex max-w-[72ch] min-w-0 flex-col gap-5 leading-relaxed text-ink-soft [overflow-wrap:anywhere]",
                    // Giriş abzası — qızılı xətli «lead».
                    "[&>p:first-child]:border-l-2 [&>p:first-child]:border-gold [&>p:first-child]:pl-5 [&>p:first-child]:text-base [&>p:first-child]:text-ink sm:[&>p:first-child]:text-lg",
                    // `font-serif` brend şrifti deyil (brauzerin Georgia-sı) — başlıqlar Playfair olmalıdır.
                    "[&_h2]:mt-6 [&_h2]:scroll-mt-28 [&_h2]:border-t [&_h2]:border-line [&_h2]:pt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:leading-tight [&_h2]:text-ink [&_h2:first-child]:mt-0",
                    "[&_h3]:mt-2 [&_h3]:scroll-mt-28 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink",
                    "[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2.5 [&_ul]:pl-5 [&_li]:list-disc [&_li]:pl-1 [&_li]:marker:text-gold",
                    "[&_strong]:font-semibold [&_strong]:text-ink",
                    "[&_a]:rounded-xs [&_a]:text-gold-deep [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-gold",
                  ].join(" ")}
                >
                  {children}
                </div>
              </article>

              {company ? (
                <section aria-labelledby="legal-company" className="mt-6 grid grid-cols-1 gap-6 rounded-xl border border-line bg-paper p-6 shadow-xs sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <h2 id="legal-company" className="font-sans text-lg font-semibold text-ink">{company.legalName}</h2>
                    <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-ink-soft sm:grid-cols-[auto_minmax(0,1fr)]">
                      <dt className="font-medium text-ink-muted">{t("voen")}</dt>
                      <dd className="tabular-nums">{company.voen}</dd>
                      <dt className="font-medium text-ink-muted">{t("address")}</dt>
                      <dd>{company.address}</dd>
                    </dl>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                    <a href={`mailto:${company.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                      <Mail className="size-4 text-gold-deep" aria-hidden="true" />
                      {company.email}
                    </a>
                    <a href={company.phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-4 text-sm font-medium tabular-nums text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                      <Phone className="size-4 text-gold-deep" aria-hidden="true" />
                      {company.phone}
                    </a>
                    <ButtonLink href="/elaqe" size="sm" className="no-print">{t("contactCta")}</ButtonLink>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
