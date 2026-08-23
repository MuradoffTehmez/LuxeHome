# Public Discovery and Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home, `/emlaklar`, property detail, `/muqayise` və `/favoritler` axınlarını mobile-native discovery və conversion təcrübəsinə çevirmək.

**Architecture:** URL query parametrləri filter state-in yeganə daimi mənbəyi olaraq qalır. Böyük `SearchPanel` shared field content və iki presentation shell-ə ayrılır; detail və comparison eyni server data-sını breakpoint-ə uyğun fərqli presentation ilə göstərir.

**Tech Stack:** Next.js Server Components, React client components, TypeScript, Tailwind CSS v4, Lucide React, `next/image`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- Query adları tam qorunur: `elan`, `axtaris`, `tip`, `seher`, `rayon`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `tikili`, `dovr`, `mertebe_min`, `mertebe_max`, `ilk_mertebe_yox`, `son_mertebe_yox`, `sekilli`, `xususiyyet`, `siralama`, `sehife`.
- `SearchPanel` başlanğıc state-i serverdən `initial` propu ilə alır; `useSearchParams` əlavə edilmir.
- Property public queries `publicPropertyWhere()` sərhədini qoruyur.
- Mobil filter 320–1023 px-də `100dvh` sheet, 1024 px-dən inline paneldir.
- Primary mobile CTA-lar minimum 44 px və safe-area-aware olmalıdır.
- `dark:` utility və JS breakpoint branching istifadə edilmir.

---

## File Structure

- Create: `src/lib/property-search.ts` — URL parse/build və active-filter derivation saf funksiyaları.
- Test: `src/lib/__tests__/property-search.test.ts`.
- Create: `src/components/site/property-filter-fields.tsx` — shared form controls.
- Modify: `src/components/site/search-panel.tsx` — hero/desktop shells.
- Create: `src/components/site/property-filter-sheet.tsx` — mobile fullscreen filter form.
- Modify: `src/app/(site)/emlaklar/page.tsx` — toolbar, chips, result layout.
- Modify: `src/components/site/property-card.tsx`, `src/components/site/hero.tsx`, `src/app/(site)/page.tsx` — mobile information hierarchy.
- Create: `src/components/site/mobile-category-rail.tsx` — home scroll-snap categories.
- Modify: `src/components/site/gallery.tsx`, `src/app/(site)/emlaklar/[slug]/page.tsx` — swipe gallery and sticky conversion.
- Modify: `src/app/(site)/muqayise/compare-table.tsx`, `src/app/(site)/favoritler/favorites-list.tsx` — adaptive comparison/favorites.

### Task 1: Property search URL contract-ını saf modula çıxar

**Files:**
- Create: `src/lib/property-search.ts`
- Test: `src/lib/__tests__/property-search.test.ts`
- Modify: `src/app/(site)/emlaklar/page.tsx`

**Interfaces:**
- Produces: `parsePropertySearchParams(params): ParsedPropertySearch`, `buildPropertySearchHref(state, overrides): string`, `buildActivePropertyFilters(state, options): ActiveFilterChip[]`.
- Consumes: constants label maps and filter option labels.

- [ ] **Step 1: Failing URL round-trip testini yaz**

```ts
import { describe, expect, it } from "vitest";
import { buildPropertySearchHref, parsePropertySearchParams } from "../property-search";

describe("property search URL müqaviləsi", () => {
  it("çoxseçimli xüsusiyyətləri və bayraqları qoruyur", () => {
    const state = parsePropertySearchParams({ xususiyyet: ["lift", "parking"], sekilli: "1", sehife: "3" });
    expect(state.featureSlugs).toEqual(["lift", "parking"]);
    expect(buildPropertySearchHref(state, { siralama: "price_asc" })).toContain("xususiyyet=lift");
    expect(buildPropertySearchHref(state, { siralama: "price_asc" })).not.toContain("sehife=3");
  });
});
```

- [ ] **Step 2: Testi işə sal və modul olmadığı üçün FAIL olduğunu təsdiqlə**

```bash
npm test -- src/lib/__tests__/property-search.test.ts
```

- [ ] **Step 3: Exact types və parse/build funksiyalarını implement et**

```ts
export type PropertySearchInput = Record<string, string | string[] | undefined>;
export type PropertySearchOverride = Record<string, string | number | readonly string[] | null>;

export const PROPERTY_SEARCH_KEYS = [
  "elan", "axtaris", "tip", "seher", "rayon", "otaq", "min", "max",
  "sahe_min", "sahe_max", "temir", "sened", "tikili", "dovr",
  "mertebe_min", "mertebe_max",
] as const;

export type ParsedPropertySearch = {
  values: Partial<Record<(typeof PROPERTY_SEARCH_KEYS)[number], string>>;
  featureSlugs: string[];
  excludeFirstFloor: boolean;
  excludeLastFloor: boolean;
  withImagesOnly: boolean;
  sort: SortOption;
  page: number;
};

export function parsePropertySearchParams(params: PropertySearchInput): ParsedPropertySearch {
  const values = Object.fromEntries(PROPERTY_SEARCH_KEYS.flatMap((key) => {
    const raw = params[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    return value ? [[key, value]] : [];
  })) as ParsedPropertySearch["values"];
  const rawFeatures = Array.isArray(params.xususiyyet) ? params.xususiyyet : params.xususiyyet ? [params.xususiyyet] : [];
  const sort = typeof params.siralama === "string" && SORT_OPTIONS.some((option) => option.value === params.siralama) ? params.siralama as SortOption : "newest";
  const rawPage = typeof params.sehife === "string" ? Number(params.sehife) : 1;
  return {
    values,
    featureSlugs: rawFeatures.map((value) => value.trim()).filter(Boolean),
    excludeFirstFloor: params.ilk_mertebe_yox === "1",
    excludeLastFloor: params.son_mertebe_yox === "1",
    withImagesOnly: params.sekilli === "1",
    sort,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function buildPropertySearchHref(state: ParsedPropertySearch, overrides: PropertySearchOverride = {}): string {
  const params = new URLSearchParams();
  for (const key of PROPERTY_SEARCH_KEYS) {
    const value = state.values[key];
    if (value) params.set(key, value);
  }
  for (const value of state.featureSlugs) params.append("xususiyyet", value);
  if (state.excludeFirstFloor) params.set("ilk_mertebe_yox", "1");
  if (state.excludeLastFloor) params.set("son_mertebe_yox", "1");
  if (state.withImagesOnly) params.set("sekilli", "1");
  if (state.sort !== "newest") params.set("siralama", state.sort);
  if (state.page > 1) params.set("sehife", String(state.page));
  for (const [key, value] of Object.entries(overrides)) {
    params.delete(key);
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== null && value !== "") params.set(key, String(value));
  }
  if (Object.keys(overrides).some((key) => key !== "sehife")) params.delete("sehife");
  const query = params.toString();
  return `/emlaklar${query ? `?${query}` : ""}`;
}
```

`buildActivePropertyFilters` bütün scalar, üç flag, çoxseçimli xüsusiyyət və sort-dan yalnız istifadəçiyə görünən filterləri qaytarmalı; hər item `{ key, label, href }` olmalı və `href` həmin konkret parametri silməlidir. `sehife` active chip deyil və filter silinəndə sıfırlanır.

- [ ] **Step 4: `emlaklar/page.tsx`-i helper-lərə keçir və testləri PASS et**

```bash
npm test -- src/lib/__tests__/property-search.test.ts
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/property-search.ts src/lib/__tests__/property-search.test.ts "src/app/(site)/emlaklar/page.tsx"
git commit -m "refactor: centralize property search URL state"
```

### Task 2: Filter fields və mobile fullscreen sheet

**Files:**
- Create: `src/components/site/property-filter-fields.tsx`
- Create: `src/components/site/property-filter-sheet.tsx`
- Modify: `src/components/site/search-panel.tsx`
- Modify: `src/app/(site)/emlaklar/page.tsx`

**Interfaces:**
- Produces: `PropertyFilterFieldsProps` with `types`, `cities`, `features`, `initial`, `mode: "compact" | "full"`; `PropertyFilterSheetProps` with the same options plus `resultCount`.
- Consumes: `Overlay`, `Button`, URL GET form names.

- [ ] **Step 1: Shared field prop contract-ını yaz və mövcud control-ları köçür**

```tsx
export type PropertyFilterFieldsProps = {
  types: TypeOption[];
  cities: CityOption[];
  features: FeatureOption[];
  initial: SearchPanelInitial;
  mode: "compact" | "full";
};
```

`name` atributları dəyişmədən `SearchPanel`-dən bu komponentə köçürülməlidir.

- [ ] **Step 2: Mobile sheet-i real GET form kimi yaz**

```tsx
<Overlay open={open} onClose={() => setOpen(false)} title="Filtrlər" placement="bottom" className="h-dvh max-h-dvh lg:hidden">
  <form action="/emlaklar" method="get" className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <PropertyFilterFields mode="full" types={types} cities={cities} features={features} initial={initial} />
    </div>
    <div className="border-t border-line bg-paper px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
      <Button type="submit" fullWidth>{resultCount} nəticəni göstər</Button>
    </div>
  </form>
</Overlay>
```

- [ ] **Step 3: `SearchPanel` hero compact və desktop full presentation-a endir**

Hero yalnız elan tipi, lokasiya/tip və submit göstərməli; full fields `lg:` desktop panel və mobile sheet daxilində paylaşılmalıdır.

- [ ] **Step 4: Mobile toolbar-a filter trigger və active count əlavə et**

```tsx
<button type="button" className="inline-flex min-h-11 items-center gap-2" aria-haspopup="dialog" onClick={() => setOpen(true)}>
  <SlidersHorizontal aria-hidden="true" /> Filtrlər {activeCount > 0 ? `(${activeCount})` : ""}
</button>
```

- [ ] **Step 5: URL və interaction smoke test et**

Run: sheet aç, rayon/otaq/xüsusiyyət seç, submit et, URL və `initial` selection qorunsun; Escape/focus return işləsin.

- [ ] **Step 6: Gate və commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/components/site/property-filter-fields.tsx src/components/site/property-filter-sheet.tsx src/components/site/search-panel.tsx "src/app/(site)/emlaklar/page.tsx"
git commit -m "feat: add mobile property filter sheet"
```

### Task 3: Listing toolbar, chips və card hierarchy

**Files:**
- Modify: `src/app/(site)/emlaklar/page.tsx`
- Modify: `src/components/site/sort-select.tsx`
- Modify: `src/components/site/property-card.tsx`
- Modify: `src/components/ui/states.tsx`

**Interfaces:**
- Consumes: `ResponsiveToolbar`, `ActiveFilterChips`, `PropertyFilterSheet`.
- Produces: sticky mobile sort/filter row, scrollable chips and consistent card/skeleton aspect ratios.

- [ ] **Step 1: Mobile/desktop toolbar composition-u yaz**

```tsx
<ResponsiveToolbar
  mobile={<div className="flex min-h-14 items-center justify-between gap-2 border-b border-line bg-paper px-4"><PropertyFilterSheet types={typeOptions} cities={cityOptions} features={featureOptions} initial={initialSearch} resultCount={total} /><SortSelect value={sort} hrefs={sortHrefs} /></div>}
  desktop={<div className="flex items-start justify-between gap-6"><ActiveFilterChips items={activeFilters} resetHref="/emlaklar" /><SortSelect value={sort} hrefs={sortHrefs} /></div>}
/>
```

`initialSearch` `SearchPanel`-ə verilən eyni `SearchPanelInitial` obyektidir; `activeFilters` Task 1-dəki helper-dən gələn `ActiveFilterChip[]` olmalıdır.

- [ ] **Step 2: Active chip-ləri 44 px target və horizontal overflow container ilə render et**

```tsx
<ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
```

- [ ] **Step 3: Property card mobile information order-ını düzəlt**

Order: media → status/listing badges → price → title → location → rooms/area/floor → favorite/compare actions. Bütün `next/image` sizes real grid-ə uyğun qalmalıdır.

- [ ] **Step 4: Skeleton markup-ını kartın yeni ölçüləri ilə uyğunlaşdır**

```tsx
<div className="skeleton aspect-[4/3] w-full sm:aspect-[16/11]" />
```

- [ ] **Step 5: 320/390/768/1024/1440 visual smoke test et və commit et**

```bash
npm run lint && npm run typecheck
git add "src/app/(site)/emlaklar/page.tsx" src/components/site/sort-select.tsx src/components/site/property-card.tsx src/components/ui/states.tsx
git commit -m "feat: refine property result experience"
```

### Task 4: Home hero və mobile category rail

**Files:**
- Modify: `src/components/site/hero.tsx`
- Modify: `src/app/(site)/page.tsx`
- Create: `src/components/site/mobile-category-rail.tsx`
- Modify: `src/components/site/project-card.tsx`
- Modify: `src/components/site/post-card.tsx`

**Interfaces:**
- Produces: `MobileCategoryRail({ items })` where each item has `href`, `label`, `count`, `imageUrl?`.
- Consumes: compact `SearchPanel`, existing home query result data.

- [ ] **Step 1: Hero mobile min-height-i content-based et**

```tsx
className="grid min-h-[34rem] items-end gap-8 pt-[calc(var(--header-h)+4rem)] pb-6 sm:min-h-[40rem] lg:min-h-[min(54rem,100dvh)] lg:grid-cols-12"
```

- [ ] **Step 2: Mobile category rail yaz**

```tsx
export type MobileCategoryRailProps = {
  items: readonly { href: string; label: string; count: number; imageUrl?: string }[];
};

export function MobileCategoryRail({ items }: MobileCategoryRailProps) {
  return <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 lg:hidden">{items.map((item) => <li key={item.href} className="w-[78vw] max-w-xs shrink-0 snap-start"><Link href={item.href} className="block min-h-11 rounded-md border border-line bg-paper p-4"><span className="font-display text-xl text-ink">{item.label}</span><span className="mt-1 block text-sm text-ink-muted">{item.count} elan</span></Link></li>)}</ul>;
}
```

- [ ] **Step 3: Desktop category grid-i saxla, eyni item data-sını rail ilə paylaş**

Mobile və desktop üçün ayrıca copy/count hesablanmamalıdır.

- [ ] **Step 4: Project/post card action və image sizes-i real grid-lərlə uyğunlaşdır**

```tsx
sizes="(max-width: 640px) 92vw, (max-width: 1280px) 50vw, 33vw"
```

- [ ] **Step 5: LCP və section rhythm yoxla, sonra commit et**

```bash
npm run lint && npm run typecheck
git add src/components/site/hero.tsx "src/app/(site)/page.tsx" src/components/site/mobile-category-rail.tsx src/components/site/project-card.tsx src/components/site/post-card.tsx
git commit -m "feat: make home discovery mobile native"
```

### Task 5: Property detail gallery və conversion actions

**Files:**
- Modify: `src/components/site/gallery.tsx`
- Create: `src/components/site/property-action-toolbar.tsx`
- Modify: `src/app/(site)/emlaklar/[slug]/page.tsx`
- Modify: `src/components/site/share-buttons.tsx`

**Interfaces:**
- Produces: `PropertyActionToolbar({ propertyId, path, title, phone, whatsappHref })` and gallery swipe/index state.
- Consumes: `FavoriteButton`, `CompareButton`, `ShareButtons`, `StickyActionBar`, `siteConfig`/`whatsappLink()`.

- [ ] **Step 1: Mobile gallery-ni edge-to-edge scroll-snap viewport et**

```tsx
<div className="-mx-4 flex snap-x snap-mandatory overflow-x-auto sm:mx-0 sm:grid sm:grid-cols-2">
  {images.map((image, index) => <button key={image.url} type="button" className="relative aspect-[4/3] w-full shrink-0 snap-center" onClick={() => openAt(index)}><Image src={image.url} alt={image.alt || `${title} — şəkil ${index + 1}`} fill priority={index === 0} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 66vw" className="object-cover" /></button>)}
</div>
```

`openAt(index: number)` mövcud lightbox index state-ini yeniləyib modalı açan local callback kimi `Gallery` daxilində yazılmalıdır.

- [ ] **Step 2: Gallery index, modal və keyboard davranışını saxla**

Visible counter `aria-live="polite"`; arrow key navigation modal daxilində işləməlidir.

- [ ] **Step 3: Share/favorite/compare action-larını vahid toolbar-da birləşdir**

```tsx
export type PropertyActionToolbarProps = {
  propertyId: string;
  path: string;
  title: string;
  phone: string;
  whatsappHref: string;
};

<div className="grid grid-cols-3 border-y border-line">
  <FavoriteButton propertyId={propertyId} />
  <CompareButton propertyId={propertyId} />
  <ShareButtons path={path} title={title} compact />
</div>
```

`ShareButtonsProps`-a `compact?: boolean` əlavə edilməli; `compact` yalnız label presentation-ını dəyişməli, share URL və native-share fallback davranışını dəyişməməlidir.

- [ ] **Step 4: Sticky call/WhatsApp bar əlavə et və content padding ver**

```tsx
<StickyActionBar className="grid grid-cols-2 gap-2">
  <ButtonAnchor href={`tel:${phone}`}>Zəng et</ButtonAnchor>
  <ButtonAnchor href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</ButtonAnchor>
</StickyActionBar>
```

Main detail wrapper mobile-da `pb-[calc(5rem+var(--safe-bottom))]` almalıdır ki, bar content-i örtməsin.

- [ ] **Step 5: Detail interaction və data regression test et**

Run: gallery swipe/open/close, favorite, compare, native share fallback, phone və WhatsApp href; JSON-LD dəyişməməlidir.

- [ ] **Step 6: Gate və commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/components/site/gallery.tsx src/components/site/property-action-toolbar.tsx "src/app/(site)/emlaklar/[slug]/page.tsx" src/components/site/share-buttons.tsx
git commit -m "feat: optimize property detail conversion"
```

### Task 6: Adaptive comparison və favorites

**Files:**
- Modify: `src/app/(site)/muqayise/compare-table.tsx`
- Modify: `src/app/(site)/muqayise/page.tsx`
- Modify: `src/app/(site)/favoritler/page.tsx`
- Modify: `src/app/(site)/favoritler/favorites-list.tsx`
- Modify: `src/components/site/compare-bar.tsx`

**Interfaces:**
- Produces: mobile selected-property tabs + vertical attribute cards; desktop comparison table remains available at `lg:`.
- Consumes: existing compare/favorites storage hooks and server actions unchanged.

- [ ] **Step 1: Property selector state-i yalnız presentation üçün əlavə et**

```tsx
const [selectedId, setSelectedId] = useState(properties[0]?.id ?? "");
const selected = properties.find((property) => property.id === selectedId) ?? properties[0];
```

- [ ] **Step 2: Mobile selector və vertical definition list yaz**

```tsx
<div className="lg:hidden">
  <div role="tablist" className="flex snap-x gap-2 overflow-x-auto">{properties.map((property) => <button key={property.id} type="button" role="tab" aria-selected={property.id === selected.id} className="min-h-11 shrink-0 snap-start px-3" onClick={() => setSelectedId(property.id)}>{property.title}</button>)}</div>
  <dl className="divide-y divide-line rounded-md border border-line bg-paper">{rows.map((row) => <div key={row.label} className="grid gap-1 px-4 py-3"><dt className="text-xs text-ink-muted">{row.label}</dt><dd className="text-ink">{row.render(selected)}</dd></div>)}</dl>
</div>
```

- [ ] **Step 3: Desktop table-i `hidden lg:block` ilə saxla və row source-u paylaş**

Attribute label/render funksiyaları mobile və desktop üçün eyni `rows` massivindən gəlməlidir.

- [ ] **Step 4: Favorites toolbar və card grid-i mobile hierarchy ilə uyğunlaşdır**

Clear action confirm tələb etmirsə reversible olmayan wipe kimi görünməməli; mövcud local state davranışı qorunmalıdır.

- [ ] **Step 5: Add/remove/clear və missing-property warning regression test et**

Run: 0, 1, 2, maksimum item halları; silinmiş/arxiv property warning-i qalmalıdır.

- [ ] **Step 6: Phase gate və commit**

```bash
npm run lint && npm run typecheck && npm test && npm run build
git add "src/app/(site)/muqayise/page.tsx" "src/app/(site)/muqayise/compare-table.tsx" "src/app/(site)/favoritler/page.tsx" "src/app/(site)/favoritler/favorites-list.tsx" src/components/site/compare-bar.tsx
git commit -m "feat: adapt comparison and favorites for mobile"
```
