"use client";

import { Container, Section } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/states";

export default function PartnersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Section tone="ivory" spacing="cozy">
      <Container>
        <ErrorState onRetry={reset} />
      </Container>
    </Section>
  );
}
