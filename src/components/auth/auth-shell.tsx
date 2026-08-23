import { Container } from "@/components/ui/container";

export type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
};

/** İctimai və əməkdaş giriş axınları üçün form-first responsive çərçivə. */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: AuthShellProps) {
  return (
    <main className="min-h-[calc(100dvh-var(--header-h))] bg-beige">
      <Container className="grid min-h-[calc(100dvh-var(--header-h))] items-center gap-10 py-8 lg:grid-cols-2 lg:py-16">
        <section className="mx-auto w-full max-w-lg rounded-md border border-line bg-paper p-5 shadow-sm sm:p-8">
          <header className="mb-7">
            {eyebrow ? (
              <p className="text-xs font-semibold tracking-[0.16em] text-gold-deep uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-2 text-balance font-display text-3xl leading-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-6 text-ink-soft sm:text-base">
                {description}
              </p>
            ) : null}
          </header>
          {children}
        </section>

        {aside ? <aside className="hidden lg:block min-w-0">{aside}</aside> : null}
      </Container>
    </main>
  );
}
