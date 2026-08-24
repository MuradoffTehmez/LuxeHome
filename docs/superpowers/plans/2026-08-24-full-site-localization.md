# Luxe Home Estate Full-Site Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development task-by-task.

**Goal:** Public Luxe Home Estate saytını AZ/EN/RU dillərində UI, səhifə copy-si, metadata və public məzmun daxil olmaqla tam locale-aware etmək.

**Architecture:** `next-intl` statik UI üçün vahid mesaj qatı, locale-aware navigation wrapper-ları isə linklər üçün istifadə olunur. DB məzmunu ayrıca locale translation qeydlərindən oxunur; metadata və schema həmin lokal projection-dan qurulur. Tərcüməsi tamamlanmamış qeydlər başqa dil adı altında AZ mətn göstərmir və indekslənmir.

**Tech Stack:** Next.js 15 App Router, React 19, next-intl 4, TypeScript 5, Prisma 6, Cloudflare D1, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-24-full-site-localization-design.md`

## Global Constraints

- Public AZ davranışı və mövcud route slug-ları geriyə uyğun qalmalıdır.
- `publicPropertyWhere()` və demo/private data qoruması saxlanmalıdır.
- UI mətnləri message catalog-dan, public DB mətni locale projection-dan gəlməlidir.
- Hər mərhələ ayrıca, qruplaşdırılmış commitlə bağlanmalıdır.
- Hər implementation mərhələsindən əvvəl fail edən test, sonra minimal green dəyişiklik yazılmalıdır.

## Task 1 — Lokalizasiya kontraktı və test bazası

**Files:** `src/i18n/**`, `src/lib/__tests__/i18n-*.test.ts`

- [ ] AZ/EN/RU namespace və recursive key parity testi yaz, fail-i təsdiqlə.
- [ ] Public source hardcode audit testi yaz və mövcud boşluğu təsdiqlə.
- [ ] Namespace-ləri bütün public domenləri əhatə edəcək şəkildə genişləndir.
- [ ] Locale label, interpolasiya, plural və format kontraktını mərkəzləşdir.
- [ ] Testləri green et və `test(i18n): define full-site localization contract` commit-i yarat.

## Task 2 — Shell, naviqasiya və discovery UI

**Files:** `src/components/site/{navbar,footer,hero,home-seo-intro,...}.tsx`, əsas siyahı/filter komponentləri

- [ ] Shell render testlərində AZ/EN/RU görünən mətn və locale-aware href-ləri tələb et.
- [ ] Navbar, footer, dil/theme/account elementlərini tam tərcümə et.
- [ ] Ana səhifə, axtarış, filter, sort, card, favorite/compare/gallery/share/map mətnlərini köçür.
- [ ] Loading/error/empty/aria/alt/toast mətnlərini kataloqa bağla.
- [ ] Testləri green et və `feat(i18n): localize public shell and discovery` commit-i yarat.

## Task 3 — Bütün public route copy-si və metadata

**Files:** `src/app/[locale]/(site)/**`, `src/components/site/{legal-article,seo-landing-page,...}.tsx`

- [ ] Route metadata və H1 test matrisini AZ/EN/RU üçün yaz.
- [ ] Əsas, siyahı, detal, əlaqə, haqqımızda, FAQ və utility səhifələrini tərcümə et.
- [ ] Məxfilik, istifadə və cookie mətnlərini tam tərcümə et.
- [ ] Sabit SEO landing, rayon və metro copy/FAQ/related labels-i locale-aware et.
- [ ] JSON-LD və metadata-nı görünən lokal mətnlə uyğunlaşdır.
- [ ] Testləri green et və `feat(i18n): localize every public route` commit-i yarat.

## Task 4 — Public DB məzmununun lokal projection-u

**Files:** `prisma/schema.prisma`, `migrations/**`, `src/lib/localized-content.ts`, `src/lib/queries.ts`, public detail/list routes

- [ ] Translation seçimi və completeness üçün unit test yaz.
- [ ] D1-uyğun translation modeli və migration əlavə et.
- [ ] Query nəticələrini locale projection-a çevir; proper noun/fakt sahələrini qoruyub mətn sahələrini lokal seç.
- [ ] Seed edilən xidmət/taksonomiya məzmununun EN/RU tərcümələrini əlavə et.
- [ ] Natamam translation üçün noindex və lokal fallback vəziyyəti tətbiq et.
- [ ] Test, Prisma generate və typecheck-i green et; `feat(i18n): add localized public content projections` commit-i yarat.

## Task 5 — Tam doğrulama və production

- [ ] `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` işlə.
- [ ] Lokal route matrisi və dil switch path/query qorumasını brauzerdə yoxla.
- [ ] Commitləri `main`-ə push et və Cloudflare production deploy et.
- [ ] Canlı AZ/EN/RU route matrisi, metadata, H1, locale cookie və mobil menyunu brauzerdə yoxla.
- [ ] Deploy/version və qalan data translation backlog-u varsa dəqiq qeyd et.
