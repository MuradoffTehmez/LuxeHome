import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

/**
 * Hüquqi mətn səhifələri üçün ümumi çərçivə (məxfilik, şərtlər, cookie).
 * Mətnlər hüquqşünas tərəfindən təsdiqlənməlidir — hazırkı variant iş versiyasıdır.
 */
export function LegalArticle({
  title,
  description,
  updatedAt,
  children,
}: {
  title: string;
  description?: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <Section tone="ivory">
      <Container size="narrow">
        <SectionHeader as="h1" title={title} description={description} />
        <p className="mt-4 text-sm text-ink-muted">Son yenilənmə: {updatedAt}</p>

        <div
          className={[
            "mt-10 flex flex-col gap-6 text-ink-soft",
            "[&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-ink [&_h2]:mt-4",
            "[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_li]:list-disc",
            "[&_a]:text-gold-deep [&_a]:underline [&_a]:underline-offset-4",
          ].join(" ")}
        >
          {children}
        </div>
      </Container>
    </Section>
  );
}
