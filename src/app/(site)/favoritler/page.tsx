import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { buildMetadata } from "@/lib/seo";
import { FavoritesList } from "./favorites-list";

export const metadata = buildMetadata({
  title: "Favoritlər",
  description: "Yadda saxladığınız əmlak elanları.",
  path: "/favoritler",
});

export default function FavoritesPage() {
  return (
    <Section tone="ivory">
      <Container>
        <SectionHeader
          title="Favoritlər"
          description="Bəyəndiyiniz elanlar bu cihazda saxlanılır."
        />
        <div className="mt-10">
          <FavoritesList />
        </div>
      </Container>
    </Section>
  );
}
