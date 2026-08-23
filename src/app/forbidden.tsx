import { ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

/**
 * `forbidden()` naviqasiya kəsicisinin göstərdiyi 403 səhifəsi.
 * `next.config.ts`-dəki `experimental.authInterrupts` bayrağı olmadan işləmir.
 */
export default function Forbidden() {
  return (
    <main className="flex min-h-[70vh] items-center bg-ivory text-ink">
      <Container>
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 size-10 text-ink-muted" aria-hidden="true" />
        <h1 className="font-display text-3xl text-ink">İcazəniz yoxdur</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Bu bölmə sizin rolunuz üçün açıq deyil. Səhv olduğunu düşünürsünüzsə,
          panel administratoru ilə əlaqə saxlayın.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/admin">Panelə qayıt</ButtonLink>
          <ButtonLink href="/" variant="outline">Ana səhifə</ButtonLink>
        </div>
      </div>
      </Container>
    </main>
  );
}
