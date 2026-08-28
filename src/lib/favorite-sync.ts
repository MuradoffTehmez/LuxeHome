export const MAX_FAVORITES = 100;

export function sanitizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0 && item.length <= 80))].slice(0, MAX_FAVORITES);
}

/** Giriş anında qonaq favoritlərini hesab favoritləri ilə itkisiz birləşdirir. */
export function mergeFavoriteIds(local: readonly string[], remote: readonly string[]): string[] {
  return sanitizeFavoriteIds([...local, ...remote]);
}
