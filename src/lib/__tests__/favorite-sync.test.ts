import { describe, expect, it } from "vitest";
import { MAX_FAVORITES, mergeFavoriteIds, sanitizeFavoriteIds } from "@/lib/favorite-sync";

describe("favorite sync", () => {
  it("lokal və hesab favoritlərini sıralı, dublikatsız birləşdirir", () => {
    expect(mergeFavoriteIds(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("etibarsız ID-ləri çıxarır və limiti qoruyur", () => {
    const source = [...Array.from({ length: MAX_FAVORITES + 5 }, (_, index) => `id-${index}`), null, 4];
    expect(sanitizeFavoriteIds(source)).toHaveLength(MAX_FAVORITES);
  });
});
