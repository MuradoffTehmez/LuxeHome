# Admin Responsive Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin shell, list, table, filter, form və media səthlərini mövcud permission/data davranışını qoruyaraq mobil əməliyyat mühitinə çevirmək.

**Architecture:** Admin server pages eyni query nəticəsini verir; `AdaptiveDataList` mobile card və desktop table presentation-ı ayırır. Sidebar shared overlay lifecycle istifadə edir, filterlər URL əsaslı GET form olaraq qalır və secondary row action-ları mobile overflow menu-da toplanır.

**Tech Stack:** Next.js Server Components/Actions, React 19, TypeScript, Tailwind CSS v4, Prisma/D1, Lucide, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- `requireStaff()`, action guard-ları, permissions, audit və status constants dəyişmir.
- Admin route-ları indekslənmir və production təhlükəsizlik davranışı zəiflədilmir.
- List filter state URL GET parametrlərində qalır.
- Mobile 320–1023 px card/list, desktop 1024+ table; desktop table-i sadəcə page overflow ilə gizlətmək qəbul edilmir.
- Destructive action confirm və server pending/error state-ləri qorunur.

---

## File Structure

- Modify: `src/components/admin/admin-shell.tsx`, `admin-ui.tsx`, `admin-filter-bar.tsx`, `form-shell.tsx`, `form-fields.tsx`.
- Create: `src/components/admin/admin-action-menu.tsx`, `admin-responsive-list.tsx`.
- Modify: dashboard and all admin list pages.
- Modify: property/project/blog/service forms and edit/create pages.
- Modify: media page/uploader/card/dropzone.

### Task 1: Admin shell-i shared overlay və semantik surface-lərə keçir

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`

**Interfaces:**
- Consumes: `Overlay placement="left"`, `adminNav`, `AuthUser`, counters.
- Produces: focus-trapped mobile drawer and unchanged fixed desktop sidebar.

- [ ] **Step 1: Local scroll/Escape effects-i sil və `Overlay` ilə əvəz et**

```tsx
<Overlay open={drawerOpen} onClose={() => setDrawerOpen(false)} title="İdarə paneli menyusu" placement="left" className="w-[min(20rem,88vw)] lg:hidden">
  <SidebarContent pathname={pathname} user={user} counters={counters} onNavigate={() => setDrawerOpen(false)} />
</Overlay>
```

- [ ] **Step 2: Desktop sidebar content-i eyni `SidebarContent` ilə render et**

```tsx
<aside className="fixed inset-y-0 left-0 hidden w-[264px] flex-col bg-navy lg:flex">
  <SidebarContent pathname={pathname} user={user} counters={counters} />
</aside>
```

- [ ] **Step 3: Fake global search control-unu çıxar və header actions-i real linklərə endir**

Spec “işləməyən fake interaction yaradılmır” müqaviləsinə görə hazırda action-u olmayan `admin-search` görünməməlidir.

- [ ] **Step 4: Focus, route-close, overflow və permission visibility smoke test et**

- [ ] **Step 5: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/components/admin/admin-shell.tsx
git commit -m "fix: harden responsive admin shell"
```

### Task 2: Admin action menu və responsive list primitive-ləri

**Files:**
- Create: `src/components/admin/admin-action-menu.tsx`
- Create: `src/components/admin/admin-responsive-list.tsx`
- Modify: `src/components/admin/admin-ui.tsx`

**Interfaces:**
- Produces: `AdminActionMenu({ label, children })`; `AdminResponsiveList<T>` wrapping `AdaptiveDataList<T>`; `AdminListCard` slots `title`, `meta`, `status`, `actions`, `children`.
- Consumes: `Overlay` or anchored disclosure with outside/Escape close; existing `AdminTable`.

- [ ] **Step 1: Action menu interface və accessible trigger yaz**

```tsx
export type AdminActionMenuProps = { label: string; children: React.ReactNode };

<button type="button" className="inline-flex size-11 items-center justify-center" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
```

- [ ] **Step 2: Menu item contract-ını real Link/button children ilə saxla**

Menu özü destructive action yaratmır; `ConfirmAction` child olduğu kimi işləyir.

- [ ] **Step 3: Responsive list və card slots yaz**

```tsx
export type AdminResponsiveListProps<T> = AdaptiveDataListProps<T> & { ariaLabel: string };

export type AdminListCardProps = {
  title: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AdminListCard({ title, meta, status, actions, children }: AdminListCardProps) {
  return <article className="rounded-md border border-line bg-paper p-4"><header className="flex items-start justify-between gap-3"><div className="min-w-0">{title}{meta}</div>{status}</header><div className="mt-4">{children}</div><footer className="mt-4 border-t border-line pt-3">{actions}</footer></article>;
}
```

- [ ] **Step 4: 320/768/1024 compile fixture və keyboard test et**

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run typecheck
git add src/components/admin/admin-action-menu.tsx src/components/admin/admin-responsive-list.tsx src/components/admin/admin-ui.tsx
git commit -m "feat: add adaptive admin list primitives"
```

### Task 3: Dashboard və kiçik admin listləri

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/agentlikler/page.tsx`
- Modify: `src/app/admin/blog/kateqoriyalar/page.tsx`
- Modify: `src/app/admin/parametrler/page.tsx`
- Modify: `src/components/admin/admin-filter-bar.tsx`

**Interfaces:**
- Consumes: `AdminPageHeader`, `AdminResponsiveList`, `AdminActionMenu`, `AdminCard`, `StatCard`.
- Produces: mobile dashboard/list cards, desktop tables and mobile filter sheet.

- [ ] **Step 1: Dashboard stat grid-i 1/2/4 columns və recent rows-i adaptive list et**

```tsx
className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
```

- [ ] **Step 2: `AdminFilterBar`-a mobile sheet presentation əlavə et**

```tsx
type AdminFilterBarProps = {
  action: string;
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  selects?: FilterSelect[];
  hidden?: Record<string, string>;
  resultLabel?: string;
  className?: string;
};
```

GET form field adları və hidden parametrlər eyni qalmalıdır; desktop inline form `lg:`-də görünür.

- [ ] **Step 3: Agentlik və kateqoriya mobile card render functions yaz**

Hər kart title, status/count, primary edit/detail və overflow secondary actions göstərməlidir.

- [ ] **Step 4: Parametrlər formunda section spacing və sticky save overlap yoxla**

- [ ] **Step 5: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/app/admin/page.tsx src/app/admin/agentlikler/page.tsx src/app/admin/blog/kateqoriyalar/page.tsx src/app/admin/parametrler/page.tsx src/components/admin/admin-filter-bar.tsx
git commit -m "style: adapt admin dashboard and compact lists"
```

### Task 4: Əmlak, layihə, blog və xidmət listləri

**Files:**
- Modify: `src/app/admin/emlaklar/page.tsx`
- Modify: `src/app/admin/layiheler/page.tsx`
- Modify: `src/app/admin/blog/page.tsx`
- Modify: `src/app/admin/xidmetler/page.tsx`

**Interfaces:**
- Consumes: existing Prisma results, constants label/tone maps, `AdminResponsiveList`, `AdminActionMenu`, `Pagination`.
- Produces: mobile cards with primary action visible and secondary actions in menu; desktop table unchanged in capability.

- [ ] **Step 1: Hər page-də row type-ını query result-dan infer et**

```ts
const properties = await prisma.property.findMany(propertyQuery);
type PropertyRowData = (typeof properties)[number];

function renderPropertyCard(property: PropertyRowData) {
  return <AdminListCard title={property.title} status={<StatusBadge status={property.status} label={PROPERTY_STATUS_LABELS[property.status]} />} actions={<PropertyActions property={property} />}><p className="tabular text-sm text-ink-soft">{formatPrice(property.price, property.currency)}</p></AdminListCard>;
}
```

`propertyQuery` həmin səhifədə artıq işlənən `where/select/orderBy/skip/take` obyektinin adı kimi çıxarılmalıdır; `PropertyActions` mövcud row action markup-ını qəbul edən local component kimi eyni faylda yazılmalı, `any` əlavə edilməməlidir. Layihə, blog və xidmət səhifələri də öz query nəticəsi üçün `(typeof items)[number]` pattern-ini istifadə etməlidir.

- [ ] **Step 2: Emlak mobile card renderer yaz**

Kart: title/ID, status, qiymət, lokasiya, tarix, primary edit və overflow archive/delete/restore.

- [ ] **Step 3: Layihə/blog/xidmət card renderer-lərini öz data-ları ilə yaz**

Hər renderer ayrıca named function olmalı və öz typed item-ını qəbul etməlidir.

- [ ] **Step 4: Filter, pagination və trash-mode URL-lərini regression test et**

```powershell
rg -n 'href=|action=|searchParams|zibil|sehife' src/app/admin/emlaklar/page.tsx src/app/admin/layiheler/page.tsx src/app/admin/blog/page.tsx src/app/admin/xidmetler/page.tsx
```

- [ ] **Step 5: Gate və commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/app/admin/emlaklar/page.tsx src/app/admin/layiheler/page.tsx src/app/admin/blog/page.tsx src/app/admin/xidmetler/page.tsx
git commit -m "feat: add adaptive admin content lists"
```

### Task 5: Müraciət, istifadəçi və media listləri

**Files:**
- Modify: `src/app/admin/muracietler/page.tsx`
- Modify: `src/app/admin/muracietler/[id]/page.tsx`
- Modify: `src/app/admin/istifadeciler/page.tsx`
- Modify: `src/app/admin/media/page.tsx`
- Modify: `src/app/admin/media/media-card.tsx`
- Modify: `src/app/admin/media/media-uploader.tsx`

**Interfaces:**
- Consumes: existing lead/user/media actions and permission checks.
- Produces: readable mobile cards, filter sheet and media upload progress/error layout.

- [ ] **Step 1: Lead cards-də contact primary actions və status görünürlüğünü yaz**

```tsx
<a className="inline-flex min-h-11 items-center" href={`tel:${lead.phone}`}>Zəng et</a>
```

- [ ] **Step 2: User cards-də role/status və permission-gated actions saxla**

- [ ] **Step 3: Media grid-i 2/3/4 columns və card action menu ilə düzəlt**

```tsx
className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
```

- [ ] **Step 4: Uploader progress/error və long filename wrapping-i düzəlt**

```tsx
className="min-w-0 break-all text-sm text-ink"
```

- [ ] **Step 5: Permission/action regression, gate və commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/app/admin/muracietler/page.tsx "src/app/admin/muracietler/[id]/page.tsx" src/app/admin/istifadeciler/page.tsx src/app/admin/media/page.tsx src/app/admin/media/media-card.tsx src/app/admin/media/media-uploader.tsx
git commit -m "style: improve admin operations on mobile"
```

### Task 6: Admin create/edit forms və account page

**Files:**
- Modify: `src/components/admin/form-shell.tsx`
- Modify: `src/components/admin/form-fields.tsx`
- Modify: `src/app/admin/emlaklar/property-form.tsx`
- Modify: `src/app/admin/layiheler/project-form.tsx`
- Modify: `src/app/admin/blog/post-form.tsx`
- Modify: `src/app/admin/xidmetler/service-form.tsx`
- Modify: `src/app/admin/blog/kateqoriyalar/category-form.tsx`
- Modify: `src/app/admin/hesabim/page.tsx`
- Modify: `src/app/admin/hesabim/password-form.tsx`
- Modify: `src/components/admin/image-dropzone.tsx`

**Interfaces:**
- Consumes: existing `AdminForm`, `FormSection`, Server Actions and schemas.
- Produces: mobile single-column forms, desktop section grids, safe-area sticky submit and responsive media management.

- [ ] **Step 1: `FormSection` mobile padding/grid və sticky footer safe-area düzəlişini yaz**

```tsx
<div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">{children}</div>
<div className="sticky bottom-0 z-[var(--z-sticky)] pb-[calc(0.75rem+var(--safe-bottom))]">
```

- [ ] **Step 2: Property/project/blog/service form section order-larını mobile task flow-a görə düzəlt**

Primary content və required fields əvvəl, media/SEO/secondary settings sonra gəlməlidir; input `name` və action payload dəyişmir.

- [ ] **Step 3: ImageDropzone drag-only affordance-i mobile file-picker CTA ilə tamamla**

```tsx
<label className="inline-flex min-h-11 cursor-pointer items-center justify-center"><input type="file" className="sr-only" multiple accept="image/*" />Şəkil seç</label>
```

- [ ] **Step 4: Validation error scroll/focus və destructive actions-i yoxla**

İlk invalid control focus almalı; delete/archive confirm modalı overlay lifecycle istifadə etməlidir.

- [ ] **Step 5: Admin tests və full phase gate**

```bash
npm test -- src/lib/admin/__tests__/html.test.ts src/lib/admin/__tests__/property-input.test.ts src/lib/admin/__tests__/staff-user-management.test.ts src/components/admin/__tests__/image-dropzone-config.test.ts
npm run lint && npm run typecheck && npm test && npm run build
git add src/components/admin/form-shell.tsx src/components/admin/form-fields.tsx src/components/admin/image-dropzone.tsx src/app/admin/emlaklar/property-form.tsx src/app/admin/layiheler/project-form.tsx src/app/admin/blog/post-form.tsx src/app/admin/xidmetler/service-form.tsx src/app/admin/blog/kateqoriyalar/category-form.tsx src/app/admin/hesabim/page.tsx src/app/admin/hesabim/password-form.tsx
git commit -m "style: complete responsive admin forms"
```
