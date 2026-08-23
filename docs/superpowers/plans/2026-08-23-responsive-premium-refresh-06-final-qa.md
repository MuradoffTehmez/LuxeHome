# Full Responsive QA and Audit Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bütün 49 səhifə və 15 məcburi viewport üçün funksional, vizual, accessibility və performance sübutu toplamaq, regressiyaları düzəltmək və yekun audit hesabatını təqdim etmək.

**Architecture:** Route inventory kod ağacından yaradılır, public route-lar live/local data ilə, protected route-lar təhlükəsiz local/staging fixture ilə yoxlanır. Hər tapıntı root cause səviyyəsində əvvəlki phase sahibinə qaytarılır; hesabat yalnız bütün quality gate-lər təmiz olduqda bağlanır.

**Tech Stack:** Next.js production build, Vitest, browser DevTools/in-app browser automation, Git, Markdown evidence report.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- Viewport matrisi: 320, 360, 375, 390, 412, 430, 480, 640, 768, 820, 1024, 1280, 1440, 1536, 1920 px.
- Əsas DoD viewport-ları: 320, 360, 375, 390, 430, 768, 1024, 1440 px.
- Protected screenshot-lar yalnız local/staging seed fixture hesabları ilə çəkilir.
- Production auth və permission qaydaları QA üçün zəiflədilmir.
- Final claim lint, typecheck, bütün testlər və production build sübutu olmadan verilmir.

---

## File Structure

- Create: `docs/audits/2026-08-23-frontend-route-matrix.md` — 49-route coverage ledger.
- Create: `docs/audits/2026-08-23-luxehome-frontend-audit.md` — final report.
- Store screenshots: `C:/Users/Tahmaz Muradov/.codex/visualizations/2026/08/23/01a02bf2-58c4-79a3-8d9b-194ec16a0e9a/final/`.
- Modify: only source files tied to proven regression; each fix gets focused commit and repeated gate.

### Task 1: Route inventory və QA ledger

**Files:**
- Create: `docs/audits/2026-08-23-frontend-route-matrix.md`

**Interfaces:**
- Produces: columns `Route`, `Surface`, `Auth`, `Data fixture`, `DoD widths`, `Full widths`, `Keyboard`, `States`, `Console`, `Result`, `Evidence`.

- [ ] **Step 1: Source route inventory-ni yenidən çıxar**

```powershell
Get-ChildItem -LiteralPath 'src/app' -Recurse -Filter 'page.tsx' | Sort-Object FullName
```

Expected: 49 page files; fərq varsa report baseline və yeni count-u qeyd et.

- [ ] **Step 2: Ledger header və hər route üçün bir row yaz**

```markdown
| Route | Surface | Auth | Fixture | DoD widths | Full widths | Keyboard | States | Console | Result | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Public | Xeyr | Public data | Gözləyir | Gözləyir | Gözləyir | Gözləyir | Gözləyir | Gözləyir | — |
```

“Public data” yalnız real/non-demo public query nəticəsidir; protected row-lar fixture hesab rolunu qeyd etməlidir.

- [ ] **Step 3: Dynamic route fixture URL-lərini ledger-də konkretləşdir**

Property, agency, project, blog və admin edit route-ları üçün təhlükəsiz mövcud slug/id yazılmalıdır; məlumat yoxdursa local seed fixture yaradılmalı, production-a yazılmamalıdır.

- [ ] **Step 4: Commit**

```bash
git add docs/audits/2026-08-23-frontend-route-matrix.md
git commit -m "docs: establish frontend QA matrix"
```

### Task 2: Automated quality gates və baseline metrics

**Files:**
- Modify: `docs/audits/2026-08-23-frontend-route-matrix.md` with gate evidence.

**Interfaces:**
- Produces: exact command, timestamp, pass/fail, test count and build bundle metrics.

- [ ] **Step 1: Lint işə sal**

```bash
npm run lint
```

Expected: exit 0, 0 errors.

- [ ] **Step 2: Typecheck işə sal**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 3: Bütün testləri işə sal**

```bash
npm test
```

Expected: 21 baseline test faylı/107 baseline test və bütün yeni testlər PASS.

- [ ] **Step 4: Production build işə sal**

```bash
npm run build
```

Expected: exit 0; shared First Load JS baseline 103 kB ilə müqayisə edilir.

- [ ] **Step 5: Nəticələri ledger-in “Gate evidence” bölməsinə yaz və commit et**

```bash
git add docs/audits/2026-08-23-frontend-route-matrix.md
git commit -m "docs: record frontend quality gates"
```

### Task 3: Public route responsive və interaction matrix

**Files:**
- Modify: `docs/audits/2026-08-23-frontend-route-matrix.md`
- Modify: proven-regression source files only.

**Interfaces:**
- Consumes: public routes and all 15 viewport widths.
- Produces: per-route overflow, clipping, CTA, keyboard, state and console evidence.

- [ ] **Step 1: Hər public route-u əsas 8 DoD width-də yoxla**

Browser assertion:

```js
({
  width: innerWidth,
  overflow: document.documentElement.scrollWidth - innerWidth,
  title: document.title,
  active: document.activeElement?.tagName
})
```

Expected: `overflow <= 0`, visible title/primary CTA, no clipped media.

- [ ] **Step 2: Breakpoint sərhədlərini qalan 7 width-də yoxla**

412, 480, 640, 820, 1280, 1536, 1920 px; xüsusilə header, grids, sheet/table switch və sticky bars.

- [ ] **Step 3: Critical public flows-i keyboard və touch ilə icra et**

Flows: navbar drawer; search/filter/sort/pagination; gallery; favorite; compare; share; contact submit; FAQ disclosure; theme switch.

- [ ] **Step 4: Loading/empty/error/long-copy hallarını yoxla**

Empty data local fixture/query ilə, error state təhlükəsiz forced local failure ilə yoxlanır; production data dəyişdirilmir.

- [ ] **Step 5: Console/hydration/asset nəticələrini ledger-ə yaz**

Expected: 0 `console.error`, 0 hydration error, 0 failed image/font asset.

- [ ] **Step 6: Tapılan hər regressiyanı focused commit ilə düzəlt və həmin route/width-i təkrar yoxla**

```bash
npm run lint && npm run typecheck
git add -p
git diff --cached --check
git commit -m "fix: resolve public responsive regression"
```

`git add -p` zamanı yalnız həmin audit tapıntısına aid hunks stage edilməli, istifadəçinin əlaqəsiz dəyişiklikləri saxlanmalıdır.

### Task 4: Auth, cabinet və admin protected matrix

**Files:**
- Modify: `docs/audits/2026-08-23-frontend-route-matrix.md`
- Modify: proven-regression source files only.

**Interfaces:**
- Consumes: local/staging USER, AGENT/OWNER and staff role fixtures.
- Produces: access, navigation, form, CRUD presentation and permission evidence.

- [ ] **Step 1: Public/staff auth route-larını bütün DoD width-lərdə yoxla**

Login, register, verification və 2FA enrollment: 16 px controls, 44 px actions, keyboard focus, long error copy.

- [ ] **Step 2: Cabinet route-larını USER və listing-capable account ilə yoxla**

USER listing menu görməməli; capable account overview/list/new form görməlidir; drawer route change-də bağlanmalıdır.

- [ ] **Step 3: Admin route-larını permission uyğun staff fixture-lərlə yoxla**

Dashboard, all lists, create/edit, leads, users, media, settings, account; mobile cards və desktop tables eyni action imkanını saxlamalıdır.

- [ ] **Step 4: Form create/edit validation və destructive confirm flow-larını təhlükəsiz fixture ilə yoxla**

Permanent production mutation edilmir; local fixture dəyişiklikləri QA sonunda yalnız fixture scope-da təmizlənir.

- [ ] **Step 5: Tapılan regressiyaları focused commit-lərlə düzəlt və gate-i təkrar et**

```bash
npm run lint && npm run typecheck && npm test
```

### Task 5: Accessibility və performance audit

**Files:**
- Modify: `docs/audits/2026-08-23-frontend-route-matrix.md`
- Modify: proven-regression source files only.

**Interfaces:**
- Produces: WCAG 2.2 AA-oriented evidence and before/after performance metrics.

- [ ] **Step 1: Keyboard/focus audit apar**

Skip link, Tab order, visible focus, trap/return, Escape, disclosure state, no keyboard dead-end.

- [ ] **Step 2: Touch target ölçümlərini əsas action-larda qeyd et**

```js
[...document.querySelectorAll('a,button,input,select,textarea')].map((element) => {
  const rect = element.getBoundingClientRect();
  return { label: element.getAttribute('aria-label') || element.textContent?.trim(), width: rect.width, height: rect.height };
}).filter((item) => item.width > 0 && item.height > 0 && (item.width < 44 || item.height < 44));
```

İstisna yalnız inline text link kimi WCAG target-size exception-a düşən elementdirsə reportda əsaslandırılır.

- [ ] **Step 3: Contrast, reduced-motion, 200% zoom və safe-area behavior yoxla**

- [ ] **Step 4: Image/network və bundle audit apar**

LCP priority, `sizes`, lazy load, duplicate requests, failed assets, shared JS and route chunks.

- [ ] **Step 5: Tapıntıları severity/root cause/fix/evidence ilə ledger-ə əlavə et**

### Task 6: Final screenshot paketi və audit hesabatı

**Files:**
- Create: `docs/audits/2026-08-23-luxehome-frontend-audit.md`
- Modify: `docs/audits/2026-08-23-frontend-route-matrix.md`
- Store images under final visualization directory.

**Interfaces:**
- Produces: desktop/mobile before-after evidence for Home, Əmlaklar, Property detail, Agentliklər, Müqayisə, Login, Register, Kabinet, Admin.

- [ ] **Step 1: Final screenshot qovluğu yarat və tələb olunan 18 after screenshot-u çək**

```powershell
New-Item -ItemType Directory -Force -Path 'C:\Users\Tahmaz Muradov\.codex\visualizations\2026\08\23\01a02bf2-58c4-79a3-8d9b-194ec16a0e9a\final'
```

Hər 9 route üçün 390 px mobile və 1440 px desktop screenshot; protected route-lar safe fixture ilə.

- [ ] **Step 2: Baseline və final screenshot adlarını reportda map et**

```markdown
| Səth | Baseline | Final mobile | Final desktop |
|---|---|---|---|
| Home | `baseline/home-mobile.png` | `final/home-mobile.png` | `final/home-desktop.png` |
```

- [ ] **Step 3: Final audit report-un tələb olunan bölmələrini yaz**

Sections: Executive Summary; analiz edilən route-lar; Critical/High/Medium/Low; root cause/həll/fayllar; mobile/tablet/desktop; accessibility; performance; reusable components; silinən texniki borc; test/build; qalan risklər; növbəti addımlar.

- [ ] **Step 4: Final gate-i təzədən işə sal və exact nəticələri reporta yaz**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

- [ ] **Step 5: Placeholder və coverage scan et**

```powershell
rg -n "TB[D]|TO[D]O|implement[ ]later|fill[ ]in[ ]details|Gözləyir" docs/audits/2026-08-23-frontend-route-matrix.md docs/audits/2026-08-23-luxehome-frontend-audit.md
```

Expected: 0 match; bütün 49 row `PASS` və ya açıq severity/risk ilə yekun status almalıdır.

- [ ] **Step 6: Report commit-i yarat**

```bash
git add docs/audits/2026-08-23-frontend-route-matrix.md docs/audits/2026-08-23-luxehome-frontend-audit.md
git commit -m "docs: publish frontend audit report"
```
