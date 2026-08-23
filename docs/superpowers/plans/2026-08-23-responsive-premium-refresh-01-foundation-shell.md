# Responsive Foundation and Global Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bütün frontend səthlərinin istifadə edəcəyi semantik token, Geist typography, əlçatan overlay və responsive shell primitive-lərini qurmaq.

**Architecture:** Mövcud `ui` primitive-ləri geriyə uyğun saxlanılır və yeni composition komponentləri onların üzərində qurulur. Navbar, footer, modal və gələcək drawer-lər eyni overlay lifecycle müqaviləsini istifadə edir; breakpoint qərarları CSS ilə verilir.

**Tech Stack:** Next.js 15.5.23, React 19.1, TypeScript 5, Tailwind CSS v4, Lucide React, Vitest 4.1.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- Azərbaycan copy/comment və ingilis identifikator qaydası qorunur.
- `dark:` utility əlavə edilmir; `.dark` token override-ları işlədilir.
- `Section` boşluğu yalnız `spacing` ilə idarə edilir.
- Minimum touch target 44×44 px, mobil input mətni minimum 16 px-dir.
- Body səviyyəsində overflow gizlədilməsi root cause düzəlişlərindən sonra silinir.
- Yeni runtime dependency əlavə edilmir.

---

## File Structure

- Modify: `src/app/layout.tsx` — Inter əvəzinə Geist Sans font registration.
- Modify: `src/app/globals.css` — semantik surface/text/layer tokenləri, safe-area və overflow qaydaları.
- Modify: `src/components/ui/button.tsx` — minimum target və focus müqaviləsi.
- Modify: `src/components/ui/field.tsx` — 16 px mobile control və 44 px minimum height.
- Create: `src/components/ui/overlay.tsx` — dialog/drawer focus, Escape, scroll lock və focus-return primitive-i.
- Modify: `src/components/ui/modal.tsx` — `Overlay` primitive-inə keçid.
- Create: `src/components/ui/page-header.tsx` — public/cabinet üçün vahid səhifə başlığı.
- Create: `src/components/ui/responsive-toolbar.tsx` — mobil sticky və desktop inline toolbar shell-i.
- Create: `src/components/ui/active-filter-chips.tsx` — semantik filter chip siyahısı.
- Create: `src/components/ui/sticky-action-bar.tsx` — safe-area-aware mobil CTA zolağı.
- Create: `src/components/ui/adaptive-data-list.tsx` — mobile card/desktop table switch primitive-i.
- Modify: `src/components/site/navbar.tsx` — overflow-suz desktop header və əlçatan mobile drawer.
- Modify: `src/components/site/footer.tsx` — semantik tokenlər və mobile accordion.
- Modify: `src/components/site/theme-toggle.tsx`, `src/components/ui/pagination.tsx` — target ölçüləri.

### Task 1: Geist Sans və semantik global tokenlər

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/__tests__/theme-provider.test.ts`

**Interfaces:**
- Produces: CSS variable `--font-geist-sans`; tokens `--surface-page`, `--surface-panel`, `--surface-subtle`, `--text-primary`, `--text-secondary`, `--safe-bottom`.
- Consumes: mövcud `--font-playfair`, light/dark rəng tokenləri və `THEME_RUNTIME_SHIM`.

- [ ] **Step 1: Mövcud theme testini işə sal və baseline-i təsdiqlə**

```powershell
npm test -- src/components/__tests__/theme-provider.test.ts
```

Expected: 1 test PASS.

- [ ] **Step 2: `layout.tsx`-də Geist Sans registration-u yaz**

```tsx
import { Geist, Playfair_Display } from "next/font/google";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

<html lang="az" suppressHydrationWarning className={`${playfair.variable} ${geist.variable}`}>
```

- [ ] **Step 3: `globals.css`-də font və semantik alias-ları əlavə et**

```css
@theme {
  --font-sans: var(--font-geist-sans), "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
}

:root {
  --surface-page: var(--color-ivory);
  --surface-panel: var(--color-paper);
  --surface-subtle: var(--color-beige);
  --text-primary: var(--color-ink);
  --text-secondary: var(--color-ink-soft);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

- [ ] **Step 4: `body`-dən `overflow-x: hidden` sil və yalnız komponent root-cause-larını sonrakı task-larda düzəlt**

```css
body {
  background-color: var(--surface-page);
  color: var(--text-primary);
  font-family: var(--font-sans);
}
```

- [ ] **Step 5: Azərbaycan glyph və light/dark smoke test et**

Run: 320 px və 1440 px-də `Ə ə Ş ş Ç ç Ğ ğ İ i I ı Ö ö Ü ü` renderini, body horizontal scroll ölçüsünü və theme toggle-u yoxla.

- [ ] **Step 6: Gate və commit**

```bash
npm run lint && npm run typecheck && npm test
git add src/app/layout.tsx src/app/globals.css src/components/__tests__/theme-provider.test.ts
git commit -m "style: establish responsive design tokens"
```

### Task 2: Control ölçüləri və fokus müqaviləsi

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/field.tsx`
- Modify: `src/components/site/theme-toggle.tsx`
- Modify: `src/components/ui/pagination.tsx`

**Interfaces:**
- Produces: bütün `Button`, `ButtonLink`, `ButtonAnchor`, `IconButton`, `Input`, `Textarea`, `Select` üçün min-h-11 və görünən `:focus-visible`.
- Consumes: mövcud prop signature-ları; heç bir caller dəyişikliyi tələb etmir.

- [ ] **Step 1: Base class-ları minimum target müqaviləsinə keçir**

```tsx
const sizeClasses = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
} as const;
```

- [ ] **Step 2: Form control-larında mobile zoom və target problemini həll et**

```tsx
const controlClass =
  "min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-base text-ink sm:text-sm";
```

- [ ] **Step 3: Icon və pagination düymələrini 44 px target daxilində saxla**

```tsx
className="inline-flex size-11 items-center justify-center rounded-xs"
```

- [ ] **Step 4: Keyboard/touch smoke test et**

Run: Tab/Shift+Tab ilə `/`, `/emlaklar`, `/daxil-ol`; 320 px-də bütün əsas target-ları browser ölçümü ilə yoxla.

- [ ] **Step 5: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/components/ui/button.tsx src/components/ui/field.tsx src/components/site/theme-toggle.tsx src/components/ui/pagination.tsx
git commit -m "fix: enforce accessible control targets"
```

### Task 3: Vahid overlay primitive-i

**Files:**
- Create: `src/components/ui/overlay.tsx`
- Modify: `src/components/ui/modal.tsx`

**Interfaces:**
- Produces: `Overlay({ open, onClose, title, description?, placement, children, footer?, className? })` where `placement: "center" | "bottom" | "left" | "right"`.
- Guarantees: Escape close, focus trap, initial focus, body scroll lock, backdrop close, previous focus return, unique `useId()` labels.
- Consumes: `IconButton`, `cn`, Lucide `X`.

- [ ] **Step 1: Overlay public type və placement map-i yaz**

```tsx
export type OverlayPlacement = "center" | "bottom" | "left" | "right";

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  placement?: OverlayPlacement;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};
```

- [ ] **Step 2: Focus lifecycle və scroll lock implementasiyasını yaz**

```tsx
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

useEffect(() => {
  if (!open) return;
  const previous = document.activeElement as HTMLElement | null;
  const overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  return () => {
    document.body.style.overflow = overflow;
    previous?.focus();
  };
}, [open]);
```

- [ ] **Step 3: Placement class-ları ilə render ağacını yaz**

```tsx
const placementClasses = {
  center: "m-auto max-h-[92dvh] max-w-xl rounded-md",
  bottom: "mt-auto max-h-[100dvh] rounded-t-lg pb-[var(--safe-bottom)]",
  left: "mr-auto h-dvh max-w-sm",
  right: "ml-auto h-dvh max-w-sm",
} as const;
```

- [ ] **Step 4: `Modal`-ı geriyə uyğun adapter et**

```tsx
return (
  <Overlay open={open} onClose={onClose} title={title} description={description} placement="bottom" className={cn(SIZES[size], className)} footer={footer}>
    {children}
  </Overlay>
);
```

At `sm:` width, adapter paneli `sm:m-auto sm:rounded-md` ilə center modal kimi göstərməlidir.

- [ ] **Step 5: Interaction test et**

Run: açan düymə → focus içəri → Tab dövrü → Escape → focus açan düyməyə qayıdır; backdrop click və body scroll lock ayrıca yoxlanır.

- [ ] **Step 6: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/components/ui/overlay.tsx src/components/ui/modal.tsx
git commit -m "feat: unify accessible overlays"
```

### Task 4: Ortaq responsive composition komponentləri

**Files:**
- Create: `src/components/ui/page-header.tsx`
- Create: `src/components/ui/responsive-toolbar.tsx`
- Create: `src/components/ui/active-filter-chips.tsx`
- Create: `src/components/ui/sticky-action-bar.tsx`
- Create: `src/components/ui/adaptive-data-list.tsx`

**Interfaces:**
- Produces: `PageHeaderProps`, `ResponsiveToolbarProps`, `ActiveFilterChip`, `StickyActionBarProps`, `AdaptiveDataListProps<T>`.
- Consumes: `Container`, `cn`, semantic color/spacing tokens.

- [ ] **Step 1: `PageHeader` interface və markup-ını yaz**

```tsx
export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  compact?: boolean;
};
```

- [ ] **Step 2: `ResponsiveToolbar` və `ActiveFilterChips` yaz**

```tsx
export type ActiveFilterChip = { key: string; label: string; href: string };

export type ActiveFilterChipsProps = {
  items: readonly ActiveFilterChip[];
  resetHref?: string;
  className?: string;
};

export type ResponsiveToolbarProps = {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
};

export function ResponsiveToolbar({ mobile, desktop }: { mobile: React.ReactNode; desktop: React.ReactNode }) {
  return <div><div className="sticky top-[var(--header-h)] z-[var(--z-sticky)] lg:hidden">{mobile}</div><div className="hidden lg:block">{desktop}</div></div>;
}
```

Mobil node `lg:hidden`, desktop node `hidden lg:block` olmalı; sticky wrapper yalnız mobil variant aktiv olduqda səth/background almalıdır.

- [ ] **Step 3: Safe-area-aware `StickyActionBar` yaz**

```tsx
export type StickyActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return <div className={cn("fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] backdrop-blur lg:hidden", className)}>{children}</div>;
}
```

- [ ] **Step 4: Generic adaptive list contract-ını yaz**

```tsx
export type AdaptiveDataListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => React.Key;
  renderCard: (item: T) => React.ReactNode;
  renderTable: (items: readonly T[]) => React.ReactNode;
  empty: React.ReactNode;
};
```

Markup mobile `lg:hidden`, table `hidden lg:block` olmalı; eyni data iki fərqli query ilə alınmamalıdır.

- [ ] **Step 5: Story-like manual fixture ilə 320/768/1024/1440 renderini yoxla**

Run: komponentlər istifadə edilən ilk real route Task 5 və sonrakı planlarda yoxlanacaq; bu addım TypeScript interface-lərini bütün importlarla compile edir.

- [ ] **Step 6: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/components/ui/page-header.tsx src/components/ui/responsive-toolbar.tsx src/components/ui/active-filter-chips.tsx src/components/ui/sticky-action-bar.tsx src/components/ui/adaptive-data-list.tsx
git commit -m "feat: add responsive composition primitives"
```

### Task 5: Navbar responsive shell

**Files:**
- Modify: `src/components/site/navbar.tsx`
- Modify: `src/components/site/account-menu.tsx`
- Test: `src/config/site.ts` as read-only navigation source.

**Interfaces:**
- Consumes: `Overlay placement="right"`, `navigation`, `siteConfig`, `ThemeToggle`, `AccountMenu`.
- Produces: mobile drawer at `<1024px`; compact desktop navigation at `1024–1535px`; full CTA label at `>=1536px` without overflow.

- [ ] **Step 1: Mövcud navigation data-sını saxlayaraq header zonalarını ayır**

```tsx
<header className="fixed inset-x-0 top-0 z-[var(--z-header)] border-b border-line bg-paper/95 backdrop-blur">
  <Container className="flex min-h-[var(--header-h)] min-w-0 items-center gap-2">
    <Logo className="shrink-0" />
    <nav className="hidden min-w-0 flex-1 justify-center lg:flex" aria-label="Əsas naviqasiya" />
    <div className="ml-auto flex shrink-0 items-center gap-1" />
  </Container>
</header>
```

- [ ] **Step 2: 1024–1535 px üçün label sıxlaşdırmasını CSS ilə yaz**

```tsx
<span className="hidden 2xl:inline">Əmlak əlavə et</span>
<span className="2xl:hidden">Elan ver</span>
```

- [ ] **Step 3: Mobile menyunu `Overlay` drawer-a keçir**

```tsx
<Overlay open={menuOpen} onClose={() => setMenuOpen(false)} title="Menyu" placement="right">
  <nav aria-label="Mobil naviqasiya"><ul>{navigation.map((item) => <li key={item.href}><Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className="flex min-h-14 items-center border-b border-line text-base text-ink">{item.label}</Link></li>)}</ul></nav>
</Overlay>
```

- [ ] **Step 4: Route change close, current-page və focus-return yoxla**

Run: `/`, `/emlaklar`, `/favoritler`, `/kabinet` keçidlərində drawer bağlanmalı; `aria-current="page"` yalnız cari linkdə olmalıdır.

- [ ] **Step 5: Header overflow matrisi yoxla**

Run: 320, 360, 768, 1024, 1280, 1440, 1536 və 1920 px; `document.documentElement.scrollWidth === innerWidth` gözlənilir.

- [ ] **Step 6: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/components/site/navbar.tsx src/components/site/account-menu.tsx
git commit -m "fix: rebuild responsive site navigation"
```

### Task 6: Footer responsive information architecture

**Files:**
- Modify: `src/components/site/footer.tsx`

**Interfaces:**
- Consumes: `navigation`, `legalNavigation`, `siteConfig`, brand icons.
- Produces: mobile accordion disclosure buttons and desktop four-column footer; legal ownership text unchanged.

- [ ] **Step 1: Hardcoded zinc/white səthlərini semantik tokenlərə keçir**

```tsx
<footer className="dark-surface border-t border-line-dark bg-navy text-ink-invert">
```

- [ ] **Step 2: Mobile disclosure-u JavaScript əlavə etmədən semantik `details` ilə yaz**

```tsx
function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <><details className="group border-b border-line-dark lg:hidden"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between">{title}<ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="pb-4">{children}</div></details><section className="hidden lg:block"><h2 className="font-medium text-ink-invert">{title}</h2><div className="pt-4">{children}</div></section></>;
}
```

- [ ] **Step 3: Desktop sütunları və mobile accordion-ları eyni data map-dən render et**

Footer iki ayrı copy massivi saxlamamalı; yalnız presentation ağacları fərqli olmalıdır.

- [ ] **Step 4: Link target və ownership regression yoxla**

Run: telefon, email, Instagram, hüquqi route-lar və `siteConfig.owner.name` düzgün göstərilməlidir.

- [ ] **Step 5: Gate və commit**

```bash
npm run lint && npm run typecheck
git add src/components/site/footer.tsx
git commit -m "feat: make footer responsive and semantic"
```

### Task 7: Phase 1 gate

**Files:**
- Verify only: all files changed in Tasks 1–6.

**Interfaces:**
- Produces: Phase 2 üçün sabit responsive primitive API-ləri.

- [ ] **Step 1: Tam avtomatik gate-i işə sal**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: lint 0 error, typecheck 0 error, ən az 107 test PASS, production build PASS.

- [ ] **Step 2: Overlay və global shell interaction smoke test et**

Run: keyboard, Escape, focus trap/return, body scroll lock, theme switch və 320–1920 px overflow checks.

- [ ] **Step 3: Phase 1 checkpoint commit yalnız əlavə düzəliş varsa et**

```bash
git add -p
git diff --cached --check
git commit -m "test: verify responsive foundation"
```

Əlavə düzəliş yoxdursa boş commit yaratma.
