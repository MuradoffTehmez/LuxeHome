"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/site/property-card";
import { ConfirmClearButton } from "@/components/site/confirm-clear-button";
import { EmptyState, PropertyGridSkeleton } from "@/components/ui/states";
import { useFavorites } from "@/lib/favorites";
import { fetchFavoriteProperties } from "./actions";

export type FavoriteProperty = Awaited<ReturnType<typeof fetchFavoriteProperties>>[number];

type FavoritesPresentationProps = {
  properties: FavoriteProperty[];
  savedCount: number;
  onClear: () => void;
};

/** Yüklənmiş favorit datasının toolbar, grid və missing-state təqdimatı. */
export function FavoritesPresentation({
  properties,
  savedCount,
  onClear,
}: FavoritesPresentationProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{savedCount} əmlak yadda saxlanılıb</p>
        <ConfirmClearButton
          title="Favorit siyahısı təmizlənsin?"
          description="Yadda saxladığınız bütün əmlaklar bu cihazdakı siyahıdan silinəcək."
          onConfirm={onClear}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {properties.length < savedCount ? (
        <p role="status" className="text-sm text-ink-muted">
          Bəzi elanlar artıq mövcud deyil və ya arxivə salınıb, ona görə göstərilmir.
        </p>
      ) : null}
    </div>
  );
}

export function FavoritesList() {
  const { ids, ready, clear, count } = useFavorites();
  const [properties, setProperties] = useState<FavoriteProperty[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;

    if (ids.length === 0) {
      setProperties([]);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    startTransition(async () => {
      const result = await fetchFavoriteProperties(ids);
      const byId = new Map(result.map((item) => [item.id, item]));
      setProperties(
        ids.map((id) => byId.get(id)).filter((item): item is FavoriteProperty => Boolean(item)),
      );
      setLoaded(true);
    });
  }, [ids, ready]);

  if (!ready || (!loaded && pending)) {
    return <PropertyGridSkeleton count={3} />;
  }

  if (properties.length === 0) {
    if (ids.length > 0) {
      return (
        <div className="flex flex-col items-center gap-4">
          <EmptyState
            icon={<Heart className="size-6" aria-hidden="true" />}
            title="Yadda saxlanan elanlar artıq əlçatan deyil"
            description="Elanlar silinib və ya arxivə salınıb. Siyahını təmizləyib yeni əmlaklar seçə bilərsiniz."
            action={{ href: "/emlaklar", label: "Yeni əmlak seç" }}
            className="w-full"
          />
          <ConfirmClearButton
            title="Favorit siyahısı təmizlənsin?"
            description="Əlçatan olmayan bütün seçimlər siyahıdan silinəcək."
            onConfirm={clear}
          />
        </div>
      );
    }

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
    <FavoritesPresentation
      properties={properties}
      savedCount={count}
      onClear={clear}
    />
  );
}
