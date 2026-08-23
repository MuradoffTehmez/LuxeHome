# Public Content, Route States, and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discovery-dən kənar bütün public səhifələri vahid premium responsive sistemə keçirmək, route state coverage-i və image/performance müqaviləsini tamamlamaq.

**Architecture:** List/detail route-ları shared `PageHeader`, kart və state primitive-lərini istifadə edir. Route-level `loading.tsx` faylları data shape-ə uyğun skeleton göstərir; global error/not-found qorunur və bütün external media `next/image` qaydalarına uyğunlaşdırılır.

**Tech Stack:** Next.js Server Components, React 19, Tailwind CSS v4, `next/image`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- Metadata, JSON-LD və canonical generatorları `src/lib/seo.ts` üzərindən qalır.
- Azərbaycan mətnləri, `siteConfig` əlaqə məlumatları və hüquqi sahiblik dəyişmir.
- Dynamic content HTML sanitization və query data sərhədləri dəyişdirilmir.
- Skeleton real final layout ölçüsünə uyğun, cumulative layout shift yaratmayan olmalıdır.
- Yeni `dark:` utility və lazımsız client component əlavə edilmir.

---

## File Structure

- Modify: `src/app/(site)/agentlikler/page.tsx`, `src/app/(site)/agentlikler/[slug]/page.tsx`, `src/app/(site)/layiheler/page.tsx`, `src/app/(site)/layiheler/[slug]/page.tsx`, `src/app/(site)/xidmetler/page.tsx`, `src/app/(site)/xidmetler/[slug]/page.tsx`, `src/app/(site)/blog/page.tsx`, `src/app/(site)/blog/[slug]/page.tsx`.
- Modify: `src/app/(site)/haqqimizda/page.tsx`, `src/app/(site)/elaqe/page.tsx`, `src/app/(site)/elaqe/contact-form.tsx`, `src/app/(site)/suallar/page.tsx`, `src/app/(site)/mexfilik-siyaseti/page.tsx`, `src/app/(site)/istifade-sertleri/page.tsx`, `src/app/(site)/cookie-siyaseti/page.tsx`.
- Modify: `src/components/site/agency-card.tsx`, `legal-article.tsx`, `post-card.tsx`, `project-card.tsx`.
- Create: route-level `loading.tsx` files for data-heavy public groups.
- Modify: `src/components/ui/states.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`.

### Task 1: Public list pages-i shared header/grid sisteminə keçir

**Files:**
- Modify: `src/app/(site)/agentlikler/page.tsx`
- Modify: `src/app/(site)/layiheler/page.tsx`
- Modify: `src/app/(site)/xidmetler/page.tsx`
- Modify: `src/app/(site)/blog/page.tsx`
- Modify: `src/components/site/agency-card.tsx`
- Modify: `src/components/site/project-card.tsx`
- Modify: `src/components/site/post-card.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Container`, `Section`, existing card data types.
- Produces: consistent one/two/three-column responsive grids and 44 px card actions.

- [ ] **Step 1: Hər list route-da local hero başlığını `PageHeader` ilə əvəz et**

```tsx
<PageHeader eyebrow="Kolleksiya" title="Layihələr" description="Seçilmiş yaşayış və kommersiya layihələri" />
```

- [ ] **Step 2: Grid contracts-i page type üzrə tətbiq et**

```tsx
className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
```

Agentlik listi mobile 1, tablet 2, desktop 3; blog/layihə eyni ritmi istifadə etməlidir.

- [ ] **Step 3: Card content və image sizes-i grid ilə sinxronlaşdır**

```tsx
sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
```

- [ ] **Step 4: Empty və pagination state-lərini shared primitive-lərə keçir**

- [ ] **Step 5: 320/768/1024/1440 smoke test və commit**

```bash
npm run lint && npm run typecheck
git add "src/app/(site)/agentlikler" "src/app/(site)/layiheler/page.tsx" "src/app/(site)/xidmetler/page.tsx" "src/app/(site)/blog/page.tsx" src/components/site/agency-card.tsx src/components/site/project-card.tsx src/components/site/post-card.tsx
git commit -m "style: unify public collection pages"
```

### Task 2: Public detail pages-i adaptive content order-a keçir

**Files:**
- Modify: `src/app/(site)/agentlikler/[slug]/page.tsx`
- Modify: `src/app/(site)/layiheler/[slug]/page.tsx`
- Modify: `src/app/(site)/xidmetler/[slug]/page.tsx`
- Modify: `src/app/(site)/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Gallery`, `ShareButtons`, `PropertyCard`, `prose-luxe`.
- Produces: mobile content-first order and desktop sticky secondary panels.

- [ ] **Step 1: Detail top sections-i breadcrumb + title + metadata orderına keçir**

```tsx
<PageHeader breadcrumbs={breadcrumbs} eyebrow={category} title={title} description={summary} compact />
```

- [ ] **Step 2: Mobile order və desktop columns-i CSS order ilə yaz**

```tsx
<div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
```

- [ ] **Step 3: Long content-də `min-w-0`, overflow-wrap və 68ch prose limitini tətbiq et**

- [ ] **Step 4: Detail CTA-ları real href/action-larla 44 px target et**

- [ ] **Step 5: JSON-LD/canonical regression və commit**

```bash
npm run lint && npm run typecheck && npm test
git add "src/app/(site)/agentlikler/[slug]/page.tsx" "src/app/(site)/layiheler/[slug]/page.tsx" "src/app/(site)/xidmetler/[slug]/page.tsx" "src/app/(site)/blog/[slug]/page.tsx"
git commit -m "style: refine public detail layouts"
```

### Task 3: About, contact, FAQ və legal səhifələr

**Files:**
- Modify: `src/app/(site)/haqqimizda/page.tsx`
- Modify: `src/app/(site)/elaqe/page.tsx`
- Modify: `src/app/(site)/elaqe/contact-form.tsx`
- Modify: `src/app/(site)/suallar/page.tsx`
- Modify: `src/components/site/legal-article.tsx`
- Modify: `src/app/(site)/mexfilik-siyaseti/page.tsx`
- Modify: `src/app/(site)/istifade-sertleri/page.tsx`
- Modify: `src/app/(site)/cookie-siyaseti/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `Field`, `Button`, `siteConfig`, existing contact Server Action.
- Produces: readable long-form pages, accessible FAQ disclosure and mobile form flow.

- [ ] **Step 1: About/contact/legal headers-i shared primitive-ə keçir**

- [ ] **Step 2: Contact grid-i form-first mobile order və desktop balanced columns et**

```tsx
<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:gap-12">
```

- [ ] **Step 3: FAQ disclosure düymələrinə target və ARIA contract əlavə et**

```tsx
<button type="button" className="flex min-h-11 w-full items-center justify-between text-left" aria-expanded={open} aria-controls={panelId}>
```

- [ ] **Step 4: Legal article width və heading anchor offset-lərini tətbiq et**

- [ ] **Step 5: Contact submit success/error və long-copy test et, commit et**

```bash
npm run lint && npm run typecheck && npm test
git add "src/app/(site)/haqqimizda/page.tsx" "src/app/(site)/elaqe" "src/app/(site)/suallar/page.tsx" "src/app/(site)/mexfilik-siyaseti/page.tsx" "src/app/(site)/istifade-sertleri/page.tsx" "src/app/(site)/cookie-siyaseti/page.tsx" src/components/site/legal-article.tsx
git commit -m "style: polish public information pages"
```

### Task 4: Route-level loading, empty və error state coverage

**Files:**
- Create: `src/app/(site)/emlaklar/loading.tsx`
- Create: `src/app/(site)/emlaklar/[slug]/loading.tsx`
- Create: `src/app/(site)/layiheler/loading.tsx`
- Create: `src/app/(site)/blog/loading.tsx`
- Create: `src/app/(site)/agentlikler/loading.tsx`
- Modify: `src/components/ui/states.tsx`
- Modify: `src/app/error.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/forbidden.tsx`

**Interfaces:**
- Produces: route-shape skeletons built from `PropertyGridSkeleton`, `DetailSkeleton`, `ArticleCardSkeleton`; actionable Azerbaijani error states.

- [ ] **Step 1: Skeleton variants-i final layout ölçüləri ilə düzəlt**

```tsx
export function CollectionPageSkeleton({ cards = 6 }: { cards?: number }) {
  return <Section spacing="cozy"><Container><Skeleton className="h-24 w-full" /><PropertyGridSkeleton count={cards} /></Container></Section>;
}
```

- [ ] **Step 2: Route loading fayllarını konkret shape ilə yarat**

```tsx
export default function Loading() {
  return <CollectionPageSkeleton cards={6} />;
}
```

- [ ] **Step 3: Global error/not-found CTA-larını real route-lara bağla**

Error: “Yenidən cəhd et” `reset()`; not-found: “Ana səhifə” və “Əmlaklara bax”; forbidden: “Geri qayıt” və istifadəçinin icazəli başlanğıc səthinə real link.

- [ ] **Step 4: Slow network və forced error smoke test et**

- [ ] **Step 5: Gate və commit**

```bash
npm run lint && npm run typecheck
git add -p
git diff --cached --check
git commit -m "feat: complete public route states"
```

### Task 5: Image və public performance audit

**Files:**
- Modify only files identified by audit under `src/app/(site)` and `src/components/site`.
- Verify: `next.config.ts` remote patterns.

**Interfaces:**
- Produces: one intentional LCP priority image per route, correct `sizes`, lazy below-fold media, no asset 404.

- [ ] **Step 1: Bütün `next/image` caller-lərini route və rendered grid ölçüsünə görə inventarlaşdır**

```powershell
rg -n "<Image|sizes=|priority|loading=" src/app src/components/site
```

- [ ] **Step 2: Above-fold priority qaydasını düzəlt**

Home hero və detail primary image priority; grid-də yalnız həqiqi first-row card-lar priority olmalıdır.

- [ ] **Step 3: `sizes` dəyərlərini real columns ilə uyğunlaşdır**

```tsx
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

- [ ] **Step 4: Network paneldə duplicate/full-width overfetch və 404-ləri yoxla**

- [ ] **Step 5: Production build ölçüsünü baseline 103 kB shared JS ilə müqayisə et**

```bash
npm run build
```

Unexplained shared JS artımı varsa client boundary-ni daralt və build-i təkrar et.

- [ ] **Step 6: Phase gate və commit**

```bash
npm run lint && npm run typecheck && npm test && npm run build
git add -p
git diff --cached --check
git commit -m "perf: optimize public image delivery"
```
