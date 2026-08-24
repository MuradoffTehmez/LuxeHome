"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("property.saved");
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{t("count", { count: savedCount })}</p>
        <ConfirmClearButton
          title={t("favoritesClearTitle")}
          description={t("favoritesClearDescription")}
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
          {t("missingNotice")}
        </p>
      ) : null}
    </div>
  );
}

export function FavoritesList() {
  const t = useTranslations("property.saved");
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
            title={t("unavailableTitle")}
            description={t("unavailableDescription")}
            action={{ href: "/emlaklar", label: t("chooseNew") }}
            className="w-full"
          />
          <ConfirmClearButton
            title={t("favoritesClearTitle")}
            description={t("unavailableClear")}
            onConfirm={clear}
          />
        </div>
      );
    }

    return (
      <EmptyState
        icon={<Heart className="size-6" aria-hidden="true" />}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={{ href: "/emlaklar", label: t("view") }}
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
