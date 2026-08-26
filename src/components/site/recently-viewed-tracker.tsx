"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/lib/recently-viewed";

/**
 * Əmlak detal səhifəsinə görünməz iz komponenti — baxılan əmlakı localStorage-ə
 * yazır. Ayrıca client komponent kimi çıxarılıb ki, server component (səhifə)
 * statik/dinamik render baxımından təsirlənməsin.
 */
export function RecentlyViewedTracker({ propertyId }: { propertyId: string }) {
  const { add } = useRecentlyViewed();

  useEffect(() => {
    add(propertyId);
  }, [propertyId, add]);

  return null;
}
