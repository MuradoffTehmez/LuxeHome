# Responsive Premium Refresh Execution Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Təsdiqlənmiş responsive premium refresh spesifikasiyasını altı müstəqil, ardıcıl və hər biri ayrıca yoxlanıla bilən icra planına bölmək.

**Architecture:** Əvvəl ortaq token, overlay və responsive primitive-lər qurulur; public discovery həmin təməl üzərində yenilənir; sonra qalan public route-lar, auth/kabinet və admin eyni müqaviləyə keçirilir. Son plan bütün 49 səhifəni 15 viewport-da yoxlayır və sübut paketini hazırlayır.

**Tech Stack:** Next.js 15.5.23 App Router, React 19.1, TypeScript 5, Tailwind CSS v4, Prisma 6.19, Vitest 4.1, Cloudflare/OpenNext.

**Spec:** `docs/superpowers/specs/2026-08-23-responsive-premium-refresh-design.md`

## Global Constraints

- İstifadəçiyə görünən bütün mətn və kod şərhləri Azərbaycan dilində, identifikatorlar ingiliscə olmalıdır.
- Mövcud route-lar, query param adları, Server Component data axını, auth/permission və D1/R2 müqavilələri qorunmalıdır.
- `publicPropertyWhere()`, card select-ləri, `siteConfig` və `src/lib/constants.ts` domen sabitləri bypass edilməməlidir.
- Dark mode yalnız semantik token override-ları ilə işləməli, yeni `dark:` utility-si əlavə edilməməlidir.
- `Section` boşluğu yalnız `spacing` propu ilə idarə edilməlidir.
- 320–1023 px filter/drawer səthləri touch-first, 1024 px və yuxarı desktop strukturu olmalıdır.
- İnteraktiv touch target minimum 44×44 px, input font ölçüsü mobil ekranda minimum 16 px olmalıdır.
- Yeni dependency yalnız mövcud stack ilə həll mümkün deyilsə və ayrıca təsdiqlə əlavə edilə bilər; cari plan yeni dependency tələb etmir.
- Hər task öz test/gate dövrü və ayrıca commit ilə bitməlidir.

---

## İcra ardıcıllığı

| Sıra | Plan | Müstəqil nəticə | Asılılıq |
|---|---|---|---|
| 1 | `2026-08-23-responsive-premium-refresh-01-foundation-shell.md` | Tokenlər, Geist, overlay-lər, ortaq responsive primitive-lər, navbar/footer | yoxdur |
| 2 | `2026-08-23-responsive-premium-refresh-02-public-discovery.md` | Home, əmlak axtarışı, detail, müqayisə və favoritlər | Plan 1 |
| 3 | `2026-08-23-responsive-premium-refresh-03-public-content-states.md` | Digər public route-lar, route state-ləri və image/performance cilası | Plan 1–2 |
| 4 | `2026-08-23-responsive-premium-refresh-04-auth-cabinet.md` | Public/staff auth və kabinet mobile shell/form axınları | Plan 1 |
| 5 | `2026-08-23-responsive-premium-refresh-05-admin.md` | Admin shell, adaptiv listlər, form/media axınları | Plan 1 və 4-dəki form qərarları |
| 6 | `2026-08-23-responsive-premium-refresh-06-final-qa.md` | 49-route × 15-viewport audit, regressiya sübutu və final hesabat | Plan 1–5 |

## Hər plan üçün gate

PowerShell-də global `npm` işləmirsə eyni əmrlər bundled Node ilə çağırılır:

```powershell
$node = 'C:\Users\Tahmaz Muradov\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node .\node_modules\eslint\bin\eslint.js .
& $node .\node_modules\typescript\bin\tsc --noEmit
& $node .\node_modules\vitest\vitest.mjs run
& $node .\node_modules\prisma\build\index.js generate
& $node .\node_modules\next\dist\bin\next build
```

Normal runtime-da ekvivalent əmrlər:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## İcra qaydası

- [ ] **Step 1: Plan 1-i tam icra et və bütün gate-ləri keçir**
- [ ] **Step 2: Plan 2-ni tam icra et və public discovery regression yoxlamasını keçir**
- [ ] **Step 3: Plan 3-ü tam icra et və bütün public route-ları smoke-test et**
- [ ] **Step 4: Plan 4-ü təhlükəsiz fixture hesabları ilə icra et**
- [ ] **Step 5: Plan 5-i mövcud permission sərhədlərini dəyişmədən icra et**
- [ ] **Step 6: Plan 6-da tam audit matrisi və final hesabatı tamamla**
