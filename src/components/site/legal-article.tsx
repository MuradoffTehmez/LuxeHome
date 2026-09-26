import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { useTranslations } from "next-intl";

/**
 * Hüquqi mətn səhifələri üçün ümumi çərçivə (məxfilik, şərtlər, cookie).
 * Mətnlər hüquqşünas tərəfindən təsdiqlənməlidir — hazırkı variant iş versiyasıdır.
 */
export function LegalArticle({
  title,
  description,
  updatedAt,
  path,
  children,
}: {
  title: string;
  description?: string;
  updatedAt: string;
  path: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("legal");
  const nav = useTranslations("navigation");
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
        <Container size="narrow">
          <p className="inline-flex min-h-9 items-center rounded-full border border-line bg-paper px-4 text-sm text-ink-muted shadow-xs">
            {t("updated", { date: updatedAt })}
          </p>
          <div className="mt-6 rounded-xl border border-line bg-paper p-6 shadow-xs sm:p-10">
          <div
            className={[
              "flex max-w-[68ch] min-w-0 flex-col gap-6 leading-relaxed text-ink-soft [overflow-wrap:anywhere]",
              // `font-serif` brend şrifti deyil (brauzerin Georgia-sı) — başlıqlar Playfair olmalıdır.
              "[&_h2]:mt-4 [&_h2]:scroll-mt-28 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_h2:first-child]:mt-0",
              "[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_li]:list-disc",
              "[&_a]:rounded-xs [&_a]:text-gold-deep [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-gold",
            ].join(" ")}
          >
            {children}
          </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
