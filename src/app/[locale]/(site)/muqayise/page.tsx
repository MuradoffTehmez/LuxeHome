import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { buildMetadata } from "@/lib/seo";
import { CompareTable } from "./compare-table";

export const metadata: Metadata = buildMetadata({
  title: "Müqayisə",
  description: "Seçdiyiniz əmlakları qiymət, sahə və xüsusiyyətlərinə görə yan-yana müqayisə edin.",
  path: "/muqayise",
});

export default function ComparePage() {
  return (
    <Section tone="ivory" spacing="cozy">
      <Container>
        <SectionHeader
          as="h1"
          overline="Əmlaklar"
          title="Müqayisə"
          description="Seçdiyiniz elanları yan-yana müqayisə edin."
          className="mb-8"
        />
        <CompareTable />
      </Container>
    </Section>
  );
}
