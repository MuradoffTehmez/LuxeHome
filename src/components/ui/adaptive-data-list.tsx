export type AdaptiveDataListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => React.Key;
  renderCard: (item: T) => React.ReactNode;
  renderTable: (items: readonly T[]) => React.ReactNode;
  empty: React.ReactNode;
};

/** Bir data massivini mobil kart və desktop cədvəl təqdimatında paylaşır. */
export function AdaptiveDataList<T>({
  items,
  getKey,
  renderCard,
  renderTable,
  empty,
}: AdaptiveDataListProps<T>) {
  if (items.length === 0) return empty;

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {items.map((item) => (
          <div key={getKey(item)}>{renderCard(item)}</div>
        ))}
      </div>
      <div className="hidden lg:block">{renderTable(items)}</div>
    </>
  );
}
