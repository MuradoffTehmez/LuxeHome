# Authentication and Cabinet Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public/staff authentication və kabinet route-larını təhlükəsizlik davranışına toxunmadan mobile form-first və touch-first məhsul təcrübəsinə keçirmək.

**Architecture:** Server Action, session, 2FA və guard qatları dəyişməz qalır; yalnız presentation və responsive navigation yenilənir. Cabinet desktop sidebar saxlanır, mobile üçün eyni item data-sından account header + drawer qurulur.

**Tech Stack:** Next.js App Router/Server Actions, React 19, TypeScript, Tailwind CSS v4, existing auth libraries and Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- `requireAccount()`, `requireStaff()`, middleware, signed cookies, lockout, rate limit, 2FA, permission və audit log davranışı dəyişmir.
- Password və validation copy-ləri Azərbaycan dilində qalır.
- Form input-ları mobile 16 px, action target-ları minimum 44 px olmalıdır.
- Production hesabı istifadə edilmir; QA local/staging seed fixture ilə aparılır.
- Form submit pending/error/success state-ləri həm vizual, həm assistive text ilə görünməlidir.

---

## File Structure

- Modify: `src/app/(site)/daxil-ol/page.tsx`, `src/app/(site)/daxil-ol/login-form.tsx`, `src/app/(site)/qeydiyyat/page.tsx`, `src/app/(site)/qeydiyyat/register-form.tsx`.
- Modify: `src/app/giris/page.tsx`, `src/app/giris/login-form.tsx`, `src/app/giris/dogrulama/page.tsx`, `src/app/giris/dogrulama/verify-form.tsx`, `src/app/giris/2fa-qurulumu/page.tsx`, `src/app/giris/2fa-qurulumu/enroll-form.tsx`.
- Create: `src/components/auth/auth-shell.tsx` — public/staff auth layout primitive.
- Create: `src/app/(site)/kabinet/cabinet-shell.tsx`.
- Modify: `src/app/(site)/kabinet/cabinet-nav.tsx`, `src/app/(site)/kabinet/layout.tsx`, `src/app/(site)/kabinet/page.tsx`, `src/app/(site)/kabinet/elanlar/page.tsx`, `src/app/(site)/kabinet/elanlar/yeni/page.tsx`, `src/app/(site)/kabinet/elanlar/yeni/public-property-form.tsx`, `src/app/(site)/kabinet/profil/page.tsx`, `src/app/(site)/kabinet/profil/profile-forms.tsx`.
- Test: existing auth/account tests; new pure navigation test.

### Task 1: Shared auth shell və public account forms

**Files:**
- Create: `src/components/auth/auth-shell.tsx`
- Modify: `src/app/(site)/daxil-ol/page.tsx`
- Modify: `src/app/(site)/daxil-ol/login-form.tsx`
- Modify: `src/app/(site)/qeydiyyat/page.tsx`
- Modify: `src/app/(site)/qeydiyyat/register-form.tsx`

**Interfaces:**
- Produces: `AuthShell({ eyebrow?, title, description?, children, aside? })`.
- Consumes: `Container`, `Logo`, shared fields/buttons, existing Server Actions unchanged.

- [ ] **Step 1: Auth shell-i form-first mobile order ilə yaz**

```tsx
export type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, aside }: AuthShellProps) {
  return <main className="min-h-[calc(100dvh-var(--header-h))] bg-beige"><Container className="grid min-h-full items-center gap-8 py-8 lg:grid-cols-2 lg:py-16"><section className="mx-auto w-full max-w-lg rounded-md border border-line bg-paper p-5 sm:p-8"><header className="mb-6">{eyebrow ? <p className="editorial-kicker text-gold-deep">{eyebrow}</p> : null}<h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>{description ? <p className="mt-2 text-ink-soft">{description}</p> : null}</header>{children}</section>{aside ? <aside className="hidden lg:block">{aside}</aside> : null}</Container></main>;
}
```

- [ ] **Step 2: Login/register pages-i `AuthShell`-ə keçir**

- [ ] **Step 3: Form controls və submit state-lərini shared `Field`/`Button` ilə standardlaşdır**

```tsx
<Input autoComplete="email" inputMode="email" label="E-poçt" name="email" required />
<Button type="submit" fullWidth loading={pending}>Daxil ol</Button>
```

- [ ] **Step 4: Auth policy regression testlərini işə sal**

```bash
npm test -- src/lib/auth/__tests__/public-account-policy.test.ts src/lib/auth/__tests__/public-account-registration.test.ts src/lib/auth/__tests__/session-routing.test.ts
```

- [ ] **Step 5: 320/390/768/1440 visual test və commit**

```bash
git add src/components/auth/auth-shell.tsx "src/app/(site)/daxil-ol/page.tsx" "src/app/(site)/daxil-ol/login-form.tsx" "src/app/(site)/qeydiyyat/page.tsx" "src/app/(site)/qeydiyyat/register-form.tsx"
git commit -m "style: improve public authentication flow"
```

### Task 2: Staff login, verification və 2FA pages

**Files:**
- Modify: `src/app/giris/page.tsx`
- Modify: `src/app/giris/login-form.tsx`
- Modify: `src/app/giris/dogrulama/page.tsx`
- Modify: `src/app/giris/dogrulama/verify-form.tsx`
- Modify: `src/app/giris/2fa-qurulumu/page.tsx`
- Modify: `src/app/giris/2fa-qurulumu/enroll-form.tsx`

**Interfaces:**
- Consumes: `AuthShell`, existing staff login/verify/enroll actions.
- Produces: form-first mobile flow, desktop brand panel and accessible OTP input behavior.

- [ ] **Step 1: Üç staff route-u shared shell-ə keçir**

- [ ] **Step 2: OTP controls-a numeric input contract əlavə et**

```tsx
<Input name="code" label="Təsdiq kodu" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
```

- [ ] **Step 3: QR/secret səthində overflow və copy action target-larını düzəlt**

```tsx
className="max-w-full overflow-x-auto rounded-md border border-line bg-paper p-4"
```

- [ ] **Step 4: Staff auth test suite-i işə sal**

```bash
npm test -- src/lib/auth/__tests__/staff-login-policy.test.ts src/lib/auth/__tests__/totp.test.ts src/lib/auth/__tests__/lockout.test.ts src/lib/auth/__tests__/session-policy.test.ts
```

- [ ] **Step 5: Keyboard, long error copy və commit**

```bash
npm run lint && npm run typecheck
git add src/app/giris/page.tsx src/app/giris/login-form.tsx src/app/giris/dogrulama/page.tsx src/app/giris/dogrulama/verify-form.tsx src/app/giris/2fa-qurulumu/page.tsx src/app/giris/2fa-qurulumu/enroll-form.tsx
git commit -m "style: refine staff authentication screens"
```

### Task 3: Cabinet navigation state helper və mobile drawer

**Files:**
- Create: `src/lib/accounts/cabinet-navigation.ts`
- Test: `src/lib/accounts/__tests__/cabinet-navigation.test.ts`
- Create: `src/app/(site)/kabinet/cabinet-shell.tsx`
- Modify: `src/app/(site)/kabinet/cabinet-nav.tsx`
- Modify: `src/app/(site)/kabinet/layout.tsx`

**Interfaces:**
- Produces: `getCabinetItems(canList): readonly CabinetNavItem[]`, `isCabinetItemActive(pathname, href): boolean`.
- Consumes: `Overlay placement="left"`, `ACCOUNT_TYPE_LABELS`, existing sign-out action.

- [ ] **Step 1: Failing active-route testini yaz**

```ts
import { describe, expect, it } from "vitest";
import { getCabinetItems, isCabinetItemActive } from "../cabinet-navigation";

describe("kabinet naviqasiyası", () => {
  it("yeni elan səhifəsində yalnız ən spesifik bəndi aktiv edir", () => {
    expect(isCabinetItemActive("/kabinet/elanlar/yeni", "/kabinet/elanlar/yeni")).toBe(true);
    expect(isCabinetItemActive("/kabinet/elanlar/yeni", "/kabinet/elanlar")).toBe(false);
    expect(getCabinetItems(false).some((item) => item.href.includes("elanlar"))).toBe(false);
  });
});
```

- [ ] **Step 2: Testi FAIL et, sonra helper-i implement et**

```ts
export function isCabinetItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
```

`getCabinetItems(false)` yalnız overview və profil qaytarmalıdır.

- [ ] **Step 3: `CabinetNav`-ı desktop və mobile variant prop-u ilə yenilə**

```tsx
type CabinetNavProps = {
  name: string;
  accountLabel: string;
  canList: boolean;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};
```

- [ ] **Step 4: Layout-da mobile account header + drawer əlavə et**

```tsx
<div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-line bg-paper p-4 lg:hidden"><div className="min-w-0"><p className="text-xs tracking-wide text-ink-muted uppercase">{accountLabel}</p><p className="truncate font-medium text-ink">{name}</p></div><button type="button" className="inline-flex size-11 shrink-0 items-center justify-center" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>Menyu</button></div>
<Overlay open={open} onClose={() => setOpen(false)} title="Kabinet menyusu" placement="left"><CabinetNav variant="mobile" onNavigate={() => setOpen(false)} /></Overlay>
```

Server layout birbaşa state saxlaya bilmədiyi üçün mobile shell client wrapper `src/app/(site)/kabinet/cabinet-shell.tsx` faylında yaradılmalı və layout yalnız user props ötürməlidir.

- [ ] **Step 5: Test/gate və commit**

```bash
npm test -- src/lib/accounts/__tests__/cabinet-navigation.test.ts
npm run typecheck
git add src/lib/accounts/cabinet-navigation.ts src/lib/accounts/__tests__/cabinet-navigation.test.ts "src/app/(site)/kabinet/cabinet-nav.tsx" "src/app/(site)/kabinet/cabinet-shell.tsx" "src/app/(site)/kabinet/layout.tsx"
git commit -m "feat: add mobile cabinet navigation"
```

### Task 4: Cabinet overview və listing pages

**Files:**
- Modify: `src/app/(site)/kabinet/page.tsx`
- Modify: `src/app/(site)/kabinet/elanlar/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `AdaptiveDataList`, existing `getCabinetSummary()` and listing queries.
- Produces: mobile stat cards and listing cards; desktop summary/list presentation.

- [ ] **Step 1: Overview title/action-ları `PageHeader`-ə keçir**

- [ ] **Step 2: Stat cards-i 1-column mobile, 2-column tablet et**

```tsx
className="grid gap-4 sm:grid-cols-2"
```

- [ ] **Step 3: Elanlar listini adaptive card/table presentation-a keçir**

```tsx
type CabinetProperty = (typeof properties)[number];

function renderPropertyCard(property: CabinetProperty) {
  const status = property.status as PropertyStatus;
  return <article className="rounded-md border border-line bg-paper p-4"><div className="flex items-start justify-between gap-3"><h2 className="min-w-0 truncate font-medium text-ink">{property.title}</h2><Badge tone={PROPERTY_STATUS_TONE[status]}>{PROPERTY_STATUS_LABELS[status]}</Badge></div><p className="tabular mt-3 text-sm text-ink-soft">{formatPrice(property.price, property.currency)}</p></article>;
}

function renderPropertyTable(items: readonly CabinetProperty[]) {
  return <ul className="divide-y divide-line rounded-md border border-line bg-paper">{items.map((property) => <li key={property.id} className="p-5">{renderPropertyCard(property)}</li>)}</ul>;
}

<AdaptiveDataList items={properties} getKey={(property) => property.id} renderCard={renderPropertyCard} renderTable={renderPropertyTable} empty={<EmptyState title="Elan yoxdur" />} />
```

Bu funksiyalar server query-dən sonrakı local scope-da yazılmalı; desktop renderer mövcud list məlumatını saxlamalı və əlavə query yaratmamalıdır.

- [ ] **Step 4: Empty, status badge və action href-ləri yoxla**

- [ ] **Step 5: Commit**

```bash
npm run lint && npm run typecheck
git add "src/app/(site)/kabinet/page.tsx" "src/app/(site)/kabinet/elanlar/page.tsx"
git commit -m "style: adapt cabinet overview and listings"
```

### Task 5: Cabinet profile və property submission forms

**Files:**
- Modify: `src/app/(site)/kabinet/profil/page.tsx`
- Modify: `src/app/(site)/kabinet/profil/profile-forms.tsx`
- Modify: `src/app/(site)/kabinet/elanlar/yeni/page.tsx`
- Modify: `src/app/(site)/kabinet/elanlar/yeni/public-property-form.tsx`
- Modify: `src/components/admin/image-dropzone.tsx` — mobile picker target və preview grid.

**Interfaces:**
- Consumes: existing profile/submission Server Actions, `FormSection`, fields, `ImageDropzone`.
- Produces: sectioned mobile forms and sticky save/submit bar without changing payload names.

- [ ] **Step 1: Profile forms-i aydın section-lara və full-width mobile actions-a keçir**

```tsx
<div className="sticky bottom-0 z-[var(--z-sticky)] -mx-4 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
```

- [ ] **Step 2: Public property form-da semantic fieldset/legend qrupları yarat**

Qruplar: əsas məlumat, ünvan, qiymət, xüsusiyyətlər, şəkillər, təsdiq.

- [ ] **Step 3: Mobile image dropzone və preview grid-i 2-column saxla**

```tsx
className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
```

- [ ] **Step 4: Payload adlarını actions/schema ilə müqayisə et**

```powershell
rg -n 'formData.get|name=' "src/app/(site)/kabinet/elanlar/yeni"
```

- [ ] **Step 5: Account/submission tests və phase gate**

```bash
npm test -- src/lib/accounts/__tests__/cabinet-summary.test.ts src/lib/accounts/__tests__/property-submission.test.ts
npm run lint && npm run typecheck && npm test && npm run build
git add "src/app/(site)/kabinet" src/components/admin/image-dropzone.tsx
git commit -m "style: improve cabinet forms on mobile"
```
