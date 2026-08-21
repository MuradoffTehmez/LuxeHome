"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/site/property-card";
import { EmptyState, PropertyGridSkeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites";
import { fetchFavoriteProperties } from "./actions";

type Property = Awaited<ReturnType<typeof fetchFavoriteProperties>>[number];

export function FavoritesList() {
  const { ids, ready, clear, count } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;

    if (ids.length === 0) {
      setProperties([]);
      setLoaded(true);
      return;
    }

    startTransition(async () => {
      const result = await fetchFavoriteProperties(ids);
      // Kartların sırası istifadəçinin əlavə etmə sırasını izləyir
      const byId = new Map(result.map((item) => [item.id, item]));
      setProperties(ids.map((id) => byId.get(id)).filter((item): item is Property => Boolean(item)));
      setLoaded(true);
    });
  }, [ids, ready]);

  if (!ready || (!loaded && pending)) {
    return <PropertyGridSkeleton count={3} />;
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-6" aria-hidden="true" />}
        title="Favorit siyahınız boşdur"
        description="Bəyəndiyiniz elanları ürək işarəsi ilə yadda saxlayın — burada toplanacaq."
        action={{ href: "/emlaklar", label: "Əmlaklara bax" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          {count} əmlak yadda saxlanılıb
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          Siyahını təmizlə
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {properties.length < ids.length && (
        <p className="text-sm text-ink-muted">
          Bəzi elanlar artıq mövcud deyil və ya arxivə salınıb, ona görə göstərilmir.
        </p>
      )}
    </div>
  );
}
