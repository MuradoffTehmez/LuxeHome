import { CollectionPageSkeleton } from "@/components/ui/states";

/** Daha spesifik loading faylı olmayan ictimai route-lar üçün ümumi vəziyyət. */
export default function SiteLoading() {
  return <CollectionPageSkeleton cards={3} variant="article" />;
}
