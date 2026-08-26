"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { PropertyCard } from "@/components/site/property-card";
import { ConfirmClearButton } from "@/components/site/confirm-clear-button";
import { EmptyState, PropertyGridSkeleton } from "@/components/ui/states";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { fetchRecentProperties } from "./actions";

type RecentProperty = Awaited<ReturnType<typeof fetchRecentProperties>>[number];

export function RecentlyViewedList() {
  const t = useTranslations("account.recentlyViewed");
  const { ids, ready, clear } = useRecentlyViewed();
  const [properties, setProperties] = useState<RecentProperty[]>([]);
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
      const result = await fetchRecentProperties(ids);
      const byId = new Map(result.map((item) => [item.id, item]));
      // Sıra baxılma tarixinə görə qorunur — `ids` onsuz da ən yenisi əvvəldə
      setProperties(ids.map((id) => byId.get(id)).filter((item): item is RecentProperty => Boolean(item)));
      setLoaded(true);
    });
  }, [ids, ready]);

  if (!ready || (!loaded && pending)) {
    return <PropertyGridSkeleton count={3} />;
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-6" aria-hidden="true" />}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={{ href: "/emlaklar", label: t("viewProperties") }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">{t("count", { count: properties.length })}</p>
        <ConfirmClearButton title={t("clearTitle")} description={t("clearDescription")} onConfirm={clear} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
