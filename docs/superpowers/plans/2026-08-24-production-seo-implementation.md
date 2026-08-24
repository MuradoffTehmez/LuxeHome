# Luxe Home Estate Production SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Luxe Home Estate-in Azərbaycan dilli canonical saytını production-səviyyəli indeks, metadata, sitemap, schema, landing, audit və ölçmə qatı ilə təmin etmək; natamam RU/EN variantlarını təhlükəsiz `noindex, follow` saxlamaq.

**Architecture:** `src/lib/seo.ts` URL, metadata, index policy və JSON-LD üçün tək mənbə olur. Təmiz SEO landings `src/lib/seo-landings.ts` registry-si və yalnız `publicPropertyWhere()`-dan yaranan query-lərlə işləyir. AZ prefikssiz canonical variantdır; RU/EN real lokal DB məzmunu yaranana qədər indekslənmir. Admin audit eyni public query və landing keyfiyyət qapısından metrik/issue yaradır.

**Tech Stack:** Next.js 15 App Router, React 19, next-intl 4, TypeScript 5, Prisma 6 + Cloudflare D1, Tailwind CSS 4, Vitest 4, OpenNext Cloudflare.

**Spec:** `docs/superpowers/specs/2026-08-23-production-seo-layer-design.md`

## Global Constraints

- Görünən mətn Azərbaycan dilində, identifikatorlar ingiliscədir.
- Public əmlak query-si `publicPropertyWhere()` bazasından başlamalıdır.
- `isDemo`, soft-deleted, draft/private data sitemap və landing-ə düşmür.
- Ünvan `Əliyar Əliyev 109A`, owner `Əmiyev Bahadur Qafar oğlu` dəyişmir.
- Təsdiqlənməmiş geo, iş saatı, statistika, review və hüquqi fakt schema/copy-yə salınmır.
- `dark:` sinfi yazılmır; semantic tokenlər istifadə olunur.
- Hər mərhələ `npm run test`, `npm run typecheck`, `npm run build` ilə bağlanır.

---

## P0 — indekslənmə və texniki baza

### Task 1: URL, host, staging və metadata kontraktı

**Files:**

- Modify: `src/config/site.ts`
- Modify: `src/lib/seo.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/middleware.ts`
- Modify: `next.config.ts`
- Modify: `.env.example`
- Create: `src/lib/__tests__/seo.test.ts`

- [x] Testdə production URL-in yalnız HTTPS canonical host qaytarmasını, preview fallback-in production-a sızmamasını, `index`/`noindex-follow`/`private` robots siyasətini, locale OG kodunu və təhlükəsiz JSON-LD escape davranışını təsvir et.
- [x] `npm test -- src/lib/__tests__/seo.test.ts` işlə və köhnə helper səbəbilə fail-i təsdiqlə.
- [x] `siteUrl()` üçün `SITE_URL`/`NEXT_PUBLIC_SITE_URL` precedence, production HTTPS host validation və safe local fallback tətbiq et; `canonicalPath: null` ilə canonical-ı qəsdən buraxmaq mümkün olsun.
- [x] `buildMetadata()`-ya `indexPolicy`, `locale`, locale canonical mapping, env əsaslı GSC verification və real default OG image əlavə et.
- [x] `jsonLd()` daxilində recursive boş-value təmizləmə və `<`, `>`, `&`, U+2028/U+2029 escape et.
- [x] Root layout-dan hardcode GA ID-ni sil; analytics yalnız env və production consent şərti ilə sonrakı P1 moduluna bağlanacaq. Root canonical-ı child route-lara səhv inherit etdirmə.
- [x] Locale layout-da AZ indexable, RU/EN `noindex, follow` metadata siyasəti yarat.
- [x] Middleware-də production `http` və `www` host üçün bir-hop 308 fallback redirect; staging `X-Robots-Tag: noindex, nofollow` header-i ver.
- [x] Production host üçün HSTS header əlavə et; local/staging davranışını sənədləşdir.
- [x] Unit testi green et.

### Task 2: Ana səhifə intent, H1 və daxili discovery

**Files:**

- Modify: `src/app/[locale]/(site)/page.tsx`
- Modify: `src/components/site/hero.tsx`
- Create: `src/components/site/home-seo-intro.tsx`
- Modify: `src/components/site/__tests__/home-discovery.test.tsx`

- [x] Testdə tək H1-in `Bakıda daşınmaz əmlak satışı və icarəsi` olmasını, sloganın H1 olmamasını və əsas təmiz route href-lərini tələb et.
- [x] Test fail-i təsdiqlə.
- [x] Locale-aware `generateMetadata()` ilə tövsiyə olunan title, unikal description və `/` canonical qur.
- [x] Hero-da sloganı vizual overline saxla, əsas intent-i yeganə H1 et.
- [x] Hero altına 100–180 sözlük lokal, fakt uydurmayan giriş və satış/kirayə/mənzil/villa/layihə linkləri əlavə et.
- [x] Testi green et və H1 count üçün server render assertion əlavə et.

### Task 3: Utility/private robots siyasəti

**Files:**

- Modify: `src/app/robots.ts`
- Modify: `src/app/[locale]/(site)/favoritler/page.tsx`
- Modify: `src/app/[locale]/(site)/muqayise/page.tsx`
- Modify: `src/app/(account)/daxil-ol/page.tsx`
- Modify: `src/app/(account)/qeydiyyat/page.tsx`
- Modify: `src/app/(account)/kabinet/layout.tsx`
- Create: `src/lib/__tests__/robots.test.ts`

- [x] Robots testində public utility `noindex` URL-lərinin disallow edilməməsini, `/admin` və staff girişinin bloklanmasını, staging full disallow-u tələb et.
- [x] Utility metadata-da `noindex, follow`, private kabinet/admin metadata-da `noindex, nofollow` tətbiq et.
- [x] `/favoritler` disallow ziddiyyətini sil; sitemap/login/account route-larını robots allow siyahısına salma.
- [x] Testi green et.

### Task 4: Faceted navigation və pagination metadata

**Files:**

- Create: `src/lib/seo-indexing.ts`
- Create: `src/lib/__tests__/seo-indexing.test.ts`
- Modify: `src/app/[locale]/(site)/emlaklar/page.tsx`
- Modify: `src/app/[locale]/(site)/blog/page.tsx`

- [x] Parametrsiz, yalnız real `sehife=N`, filter/search/sort, naməlum/təkrarlanan parametr matrisini testlə.
- [x] `classifyPropertySearchParams()` və `classifyBlogSearchParams()` saf funksiyalarını yaz: clean page indexable self-canonical; filter `noindex, follow`; yalnız ekvivalent registry mapping varsa landing canonical; qeyri-ekvivalent filter canonical-sız.
- [x] Static metadata export-larını request-aware `generateMetadata()` ilə əvəz et.
- [x] `?sehife=1` canonical `/emlaklar`/`/blog`; total page-dən böyük page `notFound()`; pagination real `<a>` qalır.
- [x] Filter nəticələrinə ItemList ver, amma index policy-ni schema ilə dəyişmə.
- [x] Testi green et.

### Task 5: Təmiz və tam sitemap

**Files:**

- Modify: `src/lib/queries.ts`
- Modify: `src/app/sitemap.ts`
- Create: `src/lib/__tests__/sitemap.test.ts`

- [x] Sitemap assembler üçün static, property/project/service/blog/agency/landing fixture testləri yaz; closed/noIndex/canonical override/demo/private URL-lərin çıxmasını tələb et.
- [x] `getSitemapEntries()`-ə verified public agencies, `noIndex`, status və `updatedAt` sahələrini əlavə et; closed property-ləri çıxar.
- [x] `/agentlikler`, agency detail, `/suallar`, hüquqi səhifələr və keyfiyyət qapısını keçən landings əlavə et.
- [x] URL-ləri yalnız AZ canonical host ilə absolute HTTPS qur; RU/EN daxil etmə; real `updatedAt` olmayan static route-a saxta request timestamp yazma.
- [x] Testi green et.

### Task 6: P0 quality gate və Cloudflare runbook

**Files:**

- Create: `docs/seo/cloudflare-production-checklist.md`
- Modify: `docs/superpowers/plans/2026-08-24-production-seo-implementation.md`

- [x] HTTP→HTTPS, www→apex, HSTS, verified bot skip, Managed Challenge, sitemap, GSC URL Inspection və rollback addımlarını sənədləşdir.
- [x] `npm run test`, `npm run typecheck`, `npm run build` işlə.
- [x] P0 checkbox-larını yalnız sübut olduqda tamamla və `feat(seo): establish production indexing foundation` commit-i yarat.

---

## P1 — landing, schema, audit, daxili link və ölçmə

### Task 7: Data-backed SEO landing registry və query qatı

**Files:**

- Create: `src/lib/seo-landings.ts`
- Create: `src/lib/__tests__/seo-landings.test.ts`
- Modify: `src/lib/queries.ts`
- Modify: `prisma/schema.prisma`
- Create: `migrations/0010_property_metro.sql`
- Modify: `src/lib/admin/property-input.ts`
- Modify: `src/lib/admin/schemas.ts`
- Modify: `src/app/admin/emlaklar/form-values.ts`
- Modify: `src/app/admin/emlaklar/property-form.tsx`
- Modify: `src/app/admin/emlaklar/[id]/page.tsx`

- [x] Registry testində bütün tələb olunan kommersiya slug-larının unikal metadata/H1/filter mapping, 250–500 söz content blocks, FAQ və related route verdiyini yoxla.
- [x] `MIN_INDEXABLE_LISTINGS = 3`, type-safe intent registry və taxonomy landing descriptor qur.
- [x] `getSeoLanding()`, `getSeoLandingProperties()` və `getIndexableTaxonomyLandings()` query-lərini `publicPropertyWhere()` bazasında yaz.
- [x] Nullable `metroId` relation/index və D1 migration əlavə et; mövcud data dəyişməsin.
- [x] Admin property form/input/schema-ya city-dən asılı optional metro seçimi əlavə et; köhnə qeydlər üçün null işləsin.
- [x] Unit test və Prisma generate/typecheck green et.

### Task 8: Landing route-ları və crawl edilən əlaqələr

**Files:**

- Create: `src/app/[locale]/(site)/[seoLanding]/page.tsx`
- Create: `src/app/[locale]/(site)/rayon/[slug]/page.tsx`
- Create: `src/app/[locale]/(site)/metro/[slug]/page.tsx`
- Create: `src/components/site/seo-landing-page.tsx`
- Create: `src/components/site/breadcrumbs.tsx`
- Create: `src/components/site/__tests__/seo-landing-page.test.tsx`
- Modify: `src/config/site.ts`
- Modify: `src/components/site/footer.tsx`
- Modify: `src/app/[locale]/(site)/emlaklar/[slug]/page.tsx`

- [x] Render testində tək H1, visible breadcrumbs, result count, 250–500 söz mətn, property cards, FAQ və related links tələb et.
- [x] Registry-də olmayan slug, yanlış location kind və üçdən az real public nəticə üçün `notFound()` et.
- [x] Landing metadata self-canonical AZ, RU/EN noindex canonical AZ olsun.
- [x] Əmlak detalından type/listing/district/metro landing-ə və oxşar elanlara real linklər əlavə et.
- [x] Footer query linklərini mövcud təmiz route-larla əvəz et; data-gated taxonomy linklərini yalnız server-render edilən landing bloklarında göstər.
- [x] Testi green et.

### Task 9: Vahid structured data və metadata keyfiyyəti

**Files:**

- Modify: `src/lib/seo.ts`
- Modify: `src/lib/__tests__/seo.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/[locale]/(site)/emlaklar/[slug]/page.tsx`
- Modify: `src/app/[locale]/(site)/blog/[slug]/page.tsx`
- Modify: `src/app/[locale]/(site)/xidmetler/[slug]/page.tsx`
- Modify: `src/app/[locale]/(site)/agentlikler/[slug]/page.tsx`
- Modify: `src/app/[locale]/(site)/suallar/page.tsx`

- [x] JSON-LD testində stable `@id`, property `RealEstateListing`/residence + Offer/location, BlogPosting real logo, Service, agency, FAQ görünən data parity və boş value təmizliyini yoxla.
- [x] Property metadata-da admin meta sahələrini birinci seçim et; fallback-i söz sərhədində kəs; closed/noIndex property `noindex, follow`, OG `website` olsun.
- [x] Organization schema-dan təsdiqlənməmiş geo/iş saatı çıxar; NAP yalnız `siteConfig`-dən gəlsin.
- [x] Blog hardcode logo-nu mərkəzi `articleSchema()` ilə əvəz et; publisher `@id` istifadə et.
- [x] Agentlik və FAQ schema generatorlarını mərkəzləşdir; bütün raw `JSON.stringify` script-ləri `jsonLd()`-ya keçir.
- [x] SearchAction şərhini aktual et və target canonical AZ axtarışına bağla.
- [x] Testi green et.

### Task 10: Admin SEO audit və form keyfiyyət UX-i

**Files:**

- Create: `src/lib/seo-audit.ts`
- Create: `src/lib/__tests__/seo-audit.test.ts`
- Modify: `src/lib/queries.ts`
- Modify: `src/app/admin/seo/page.tsx`
- Create: `src/components/admin/seo-fields.tsx`
- Create: `src/components/admin/__tests__/seo-fields.test.tsx`
- Modify: `src/app/admin/emlaklar/property-form.tsx`
- Modify: `src/app/admin/blog/post-form.tsx`
- Modify: `src/app/admin/layiheler/project-form.tsx`
- Modify: `src/app/admin/xidmetler/service-form.tsx`
- Modify: `src/components/admin/image-dropzone.tsx`

- [x] Saf audit evaluator testində missing/short/long/duplicate meta, thin copy, cover/alt, slug, location/schema, author/date və severity/admin link nəticələrini yoxla.
- [x] Query-ni bütün public content üçün bounded audit projection + aggregate metriklər qaytaracaq formada genişləndir.
- [x] Admin səhifədə indexable/sitemap/meta/alt/thin/schema/orphan göstəriciləri və severity filter-li responsiv issue list göstər.
- [x] Ortaq SEO fields component-də title/description sayğacı və desktop/mobile SERP preview ver.
- [x] Image dropzone-da boş content alt üçün görünən Azərbaycan dilli warning və dekorativ izahı əlavə et; saxta alt yazma.
- [x] Testləri green et.

### Task 11: Privacy-safe analytics və conversion eventləri

**Files:**

- Create: `src/lib/client-analytics.ts`
- Create: `src/components/analytics/analytics-provider.tsx`
- Create: `src/lib/__tests__/client-analytics.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `.env.example`
- Modify: `src/components/site/contact-form.tsx`
- Modify: `src/components/site/property-detail-actions.tsx`
- Modify: `src/components/site/search-panel.tsx`
- Modify: `src/components/site/agency-contact-card.tsx`
- Modify: `src/app/[locale]/(site)/favoritler/actions.ts`
- Modify: `src/app/[locale]/(site)/muqayise/actions.ts`
- Modify: `src/app/(account)/kabinet/elanlar/yeni/page.tsx`

- [x] Event allowlist və payload sanitizer testində PII açarlarının rəddini, local/staging/env-siz no-op davranışını yoxla.
- [x] Env əsaslı GA4/GTM provider qur; yalnız production + explicit analytics consent olduqda script/event göndər.
- [x] Telefon, WhatsApp, contact submit, property view, favorite, compare, filter, agency contact, submission start/complete eventlərini PII-siz bağla.
- [x] Cookie siyasəti və `.env.example`-a GSC/GA/GTM/consent konfiqurasiyasını əlavə et.
- [x] Testi green et.

### Task 12: Public cache və revalidation

**Files:**

- Create: `src/lib/cache-tags.ts`
- Modify: `src/lib/queries.ts`
- Modify: public admin/content mutation actions under `src/app/admin/**/actions.ts`
- Modify: public submission/moderation actions that change property visibility
- Create: `src/lib/__tests__/cache-tags.test.ts`

- [x] Cache tag/path matrisini testlə; private/auth query-ləri matrisdən kənar saxla.
- [x] D1 request-context ilə uyğun runtime cache wrapper-i public list/detail queries-ə tətbiq et; səhifələrdən sübutsuz `force-dynamic` silmə.
- [x] Create/update/publish/delete/moderate action-larında uyğun tag və path revalidation et.
- [x] Home query-lərinin hər request-də tam təkrarını cache miss-dən sonrakı hit test/smoke ilə yoxla.
- [x] Testi green et.

### Task 13: P1 quality gate

- [x] `npm run test`, `npm run typecheck`, `npm run build` işlə.
- [x] D1 migration SQL-ni local DB-də tətbiq et və read-only schema inspection ilə `metroId`/index-i doğrula.
- [x] P1 checkbox-larını sübuta görə tamamla və `feat(seo): add data-backed discovery and quality controls` commit-i yarat.

---

## P2 — Local SEO, E-E-A-T və xarici əməliyyat planı

### Task 14: E-E-A-T görünən elementləri

**Files:**

- Modify: `src/app/[locale]/(site)/haqqimizda/page.tsx`
- Modify: `src/app/[locale]/(site)/elaqe/page.tsx`
- Modify: `src/app/[locale]/(site)/blog/[slug]/page.tsx`
- Create: `src/components/site/business-trust-panel.tsx`
- Modify: `src/components/site/__tests__/public-information-pages.test.tsx`

- [x] Testdə hüquqi ad, owner, telefon, email, mövcud ünvan, müəllif və publish/update tarixini `siteConfig`/DB-dən tələb et; uydurma statistikaları qadağan et.
- [x] Haqqımızda/Əlaqə üçün real şəkil gələndə görünən, boş olanda render olunmayan team/office slot və trust panel qur.
- [x] Blogda müəllif, dərc və yenilənmə tarixini görünən et; Organization fallback real publisher olsun.
- [x] Testi green et.

### Task 15: Off-page, content və operations sənədləri

**Files:**

- Create: `docs/seo/off-page-and-content-90-day-plan.md`
- Create: `docs/seo/measurement-and-operations.md`
- Create: `docs/seo/business-data-blockers.md`

- [x] 0–30/31–60/61–90 günlük GBP, NAP, Maps category, foto/post, etik review, local directory, partner/backlink, media/expert, content cluster və GSC CTR planı yaz.
- [x] GSC, GA4/GTM, Cloudflare, schema, sitemap, CWV və aylıq audit ölçmə runbook-u yaz.
- [x] 109A/45A conflict, geo, hours, GSC/GBP/Cloudflare access, consent, real photos/logo və prioritet rayon/metro siyahısını blocker kimi yaz; mövcud VÖEN-i “yenidən tələb olunan” kimi təqdim etmə, dərc səlahiyyətini təsdiqləmə bəndi et.

### Task 16: Final verification and evidence report

**Files:**

- Create: `scripts/seo-smoke.mjs`
- Create: `docs/seo/final-acceptance-report.md`
- Modify: `docs/superpowers/plans/2026-08-24-production-seo-implementation.md`

- [x] Smoke script title, description, canonical, robots, OG, JSON-LD parse, H1 count, internal href, sitemap/robots və statusları yoxlasın.
- [x] `npm run test`, `npm run typecheck`, `npm run build` işlə.
- [x] OpenNext/local server mümkündürsə əsas template-ləri HTTP ilə crawl et; DB/preview mümkün deyilsə real error və blocker-i qeyd et.
- [x] Lighthouse mümkündürsə tələb olunan template-lərdə lab ölç; mümkün deyilsə bal uydurma.
- [x] Final hesabatda dəyişən fayllar, P0/P1/P2, test/build, render/HTTP/schema/Lighthouse, texniki score rubric, manual işlər, tələb olunan data, 30/60/90 plan, risk və rollback ver.
- [x] Planı spec coverage, placeholder/TODO, type name və acceptance meyarlarına qarşı son dəfə yoxla.
- [x] Yalnız bütün in-scope acceptance sübutları tamamlandıqda `docs(seo): add production operations and evidence` commit-i yarat və goal-u complete et.
