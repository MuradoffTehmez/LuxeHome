# Luxe Home Estate — production SEO qəbul hesabatı

**Tarix:** 24 avqust 2026  
**Branch:** `codex/production-seo`  
**Canonical host:** `https://luxehomeestate.az`  
**Baseline:** Seobility auditində 54%; meta 95%, page quality 38%, page structure 79%, link structure 25%, server 0%.

## 1. Ümumi nəticə

P0/P1/P2 kod scope-u production build və real OpenNext/Cloudflare local preview üzərində tamamlanıb. AZ prefikssiz canonical variantdır. DB məzmunu hələ tərcümə olunmadığı üçün RU/EN variantları təhlükəsiz `noindex, follow` və AZ canonical saxlanılır. Sitemap yalnız public, canonical və indexable AZ URL-lərindən qurulur; demo, draft, soft-deleted, closed/noIndex və private route-lar çıxarılır.

Seobility tapıntılarındakı ana səhifə H1/content, query-param daxili link, logo alt, canonical/host, sitemap/robots və server siyasəti problemləri kod səviyyəsində aradan qaldırılıb. Auditdəki `45A` ünvanı tətbiq edilməyib; mövcud təsdiqlənmiş mənbə `Əliyar Əliyev 109A` saxlanılıb və ziddiyyət biznes blocker-i kimi qeyd olunub.

**Cari sübutlu SEO readiness balı: 92/100.** Bu, daxili acceptance rubric balıdır, Google sıralama və ya indeks zəmanəti deyil. Lighthouse/field CWV, canlı GSC, GBP/NAP və production edge sübutu olmadan 100/100 iddiası verilmir.

## 2. Dəyişən fayllar və məqsədi

Branch `main`-dən 100-dən çox faylda məqsədli SEO dəyişiklikləri saxlayır. Tam siyahı `git diff --name-only main...codex/production-seo` ilə alınır; funksional qruplar:

| Qrup | Əsas fayllar | Məqsəd |
| --- | --- | --- |
| SEO nüvəsi | `src/lib/seo.ts`, `seo-host.ts`, `seo-indexing.ts`, `seo-landings.ts` | URL/canonical, metadata, index policy, JSON-LD, faceted navigation və landing registry üçün tək mənbə |
| Host və runtime | `src/middleware.ts`, `next.config.ts`, `.env.example` | HTTPS/apex redirect fallback-i, staging noindex, HSTS, env əsaslı verification/analytics |
| Sitemap/robots | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/queries.ts`, `src/lib/public-cache.ts` | Yalnız public canonical URL-lər, real `updatedAt`, cache və utility/private siyasəti |
| Public route-lar | `src/app/[locale]/(site)/**` | Unikal metadata/H1, pagination/facet siyasəti, schema, E-E-A-T və clean landing route-ları |
| Landing UI | `seo-landing-page.tsx`, `breadcrumbs.tsx`, `home-seo-intro.tsx`, `footer.tsx` | Breadcrumb, 250–500 söz copy, FAQ, ItemList, daxili discovery və premium responsiv təqdimat |
| Schema | `src/lib/seo.ts` və property/blog/service/agency/FAQ route-ları | Stable `@id`, RealEstateListing/residence/Offer/location, BlogPosting, Service, agency və visible FAQ parity |
| Admin SEO | `src/lib/seo-audit.ts`, `src/app/admin/seo/page.tsx`, `seo-fields.tsx`, form/dropzone faylları | Meta/alt/thin/schema/author/orphan auditləri, severity, SERP preview və sayğaclar |
| Analytics | `client-analytics.ts`, `analytics-provider.tsx`, conversion komponent/action-ları | Consent-li, env əsaslı GA/GTM və PII-siz event allowlist |
| Cache/revalidation | `cache-tags.ts`, `public-cache.ts`, `revalidate-public.ts`, admin/public mutation action-ları | 5 dəqiqəlik public discovery cache-i və hədəfli invalidation; private data cache-dən kənar |
| Data modeli | `prisma/schema.prisma`, `0010_property_metro.sql`, admin property form/input | Nullable metro relation/index və taxonomy landing dəstəyi |
| D1 uyğunluğu | `0011_normalize_service_timestamps.sql`, `prisma/services-add.sql` | Legacy mətn service timestamp-lərini Prisma-nın gözlədiyi Unix millisecond integer-a çevirmək |
| Etibar qatı | `business-trust-panel.tsx`, `article-trust-meta.tsx`, About/Contact/Blog/Footer | Hüquqi ad, owner, VÖEN, NAP, müəllif və tarix; unverified geo/hours/stock team vizualının çıxarılması |
| Tests/smoke | `src/**/__tests__/*seo*`, `scripts/seo-smoke.mjs` | Saf policy/schema/audit/cache testləri və real HTTP metadata/link/sitemap smoke-u |
| Operations | `docs/seo/*.md`, spec və implementation plan | Cloudflare, ölçmə, blocker, 90 günlük off-page/content və qəbul sübutu |

## 3. P0/P1/P2 nəticələri

### P0 — indeks və texniki baza

- Canonical production URL yalnız HTTPS apex host verir; HTTP/www fallback bir hop 308-dir.
- Staging full `noindex, nofollow`; RU/EN content hazır olana qədər `noindex, follow` + AZ canonical-dır.
- Seobility verification meta əlavə edilib: `915a7ee78cdfc3bf8b2b272351e8ac86`.
- Ana səhifədə tək H1: “Bakıda daşınmaz əmlak satışı və icarəsi”; 100–180 söz lokal giriş və clean discovery linkləri var.
- Utility route-lar `noindex, follow`, private/admin route-lar `noindex, nofollow`; robots/noindex ziddiyyəti aradan qaldırılıb.
- Facet/search/sort URL-ləri `noindex, follow`; yalnız ekvivalent registry mapping olduqda clean landing canonical verilir.
- Sitemap static hub-ları və real public property/project/service/blog/agency/landing URL-lərini əhatə edir.
- Cloudflare edge qaydaları və rollback `cloudflare-production-checklist.md`-dədir.

### P1 — discovery, schema, audit və ölçmə

- 9 kommersiya landing-i və data-backed `/rayon/[slug]`, `/metro/[slug]` arxitekturası qurulub; minimum 3 public elan qapısı var.
- Property metro relation/index və admin seçimi əlavə edilib; null geriyə uyğun qalır.
- Property, BlogPosting, Service, agency, FAQ, Breadcrumb və ItemList schema-ları vahid serializer ilə qurulub.
- Organization schema-dan təsdiqlənməmiş geo/iş saatı çıxarılıb; bütün NAP `siteConfig`-dən gəlir.
- Admin audit missing/duplicate/length meta, thin copy, cover/alt, slug, location/schema, author/date və orphan risklərini göstərir.
- GA4/GTM yalnız production + explicit consent + env olduqda yüklənir; PII payload rədd edilir.
- Public home/list/detail/sitemap cache-lənir; publish/update/delete/moderation action-ları uyğun tag/path revalidation edir.

### P2 — Local SEO və E-E-A-T

- About/Contact trust panel hüquqi ad, VÖEN, owner, ünvan, telefon və e-poçtu mərkəzi config-dən göstərir.
- Blog real DB müəllifini, yoxdursa hüquqi publisher-i, dərc və meaningful update tarixini göstərir.
- Stok team fotosu, təxmini geo, təsdiqlənməmiş iş saatı və rəqəmli uydurma şirkət statistikası public təqdimatdan çıxarılıb.
- Real team/ofis vizualı yalnız real URL verildikdə render olunan slotla hazırdır.
- Off-page/content 90 günlük plan, ölçmə runbook-u və biznes blocker siyahısı yaradılıb; xarici işlər tamamlanmış kimi göstərilmir.

## 4. Test, build və runtime sübutu

Yekun komanda nəticələri bu hesabatın son commitindən dərhal əvvəl təzə işçi ağacında yenidən işlədilib:

- `npm test`: **64 test faylı, 233 test — pass; 0 failure**.
- `npm run typecheck`: **exit 0**.
- `npm run build`: **exit 0**, compile/lint/type validation pass, **50/50 static page generation**.
- `npm run db:migrate:local`: `0010` və `0011` tətbiq edilib; `metroId` index və 11/11 Service timestamp integer storage read-only yoxlanıb.

OpenNext/Cloudflare preview real D1/R2 binding-ləri ilə `http://127.0.0.1:8787` üzərində qaldırılıb. Canonical production proxy-ni simulyasiya etmək üçün `Host: luxehomeestate.az` və `X-Forwarded-Proto: https` verilib.

`scripts/seo-smoke.mjs` nəticəsi:

- 6/6 əsas template 200: `/`, `/emlaklar`, `/blog`, `/xidmetler`, `/haqqimizda`, `/elaqe`.
- Hər template: title, description, canonical, effektiv index/follow, OG, tək H1, parse olunan JSON-LD və daxili href — pass.
- `/robots.txt` və `/sitemap.xml` — 200/pass.
- 23/23 sitemap URL-si — 200.
- 55/55 discovery daxili linki — 4xx/5xx yoxdur.
- Cold preview-də sitemap əvvəl legacy Service timestamp səbəbilə P2023/500 verdi; `0011` migration-dan sonra eyni smoke 200/pass oldu.

## 5. Render, schema, 404 və Lighthouse

- Render edilmiş HTML metadata/H1/OG/JSON-LD smoke ilə yoxlanıb.
- JSON-LD bütün əsas səhifələrdə parse olunur; unit testlər schema type, stable `@id`, visible FAQ parity, location/Offer və təhlükəsiz escape davranışını yoxlayır.
- Parametrli facet, utility, RU/EN və data qapısını keçməyən landing-lər `noindex` qaytarır.
- **Qalıq framework riski:** Next.js streamed `notFound()` local OpenNext preview-də 404 UI + `noindex` versə də HTTP statusu 200 qaytara bilir (soft-404). Sitemap və əsas discovery crawl-da belə URL yoxdur, lakin production deploy-dan sonra bot URL Inspection ilə ayrıca yoxlanmalı və lazım gələrsə edge 404 siyasəti tətbiq edilməlidir.
- Lokal mühitdə `chrome`, `msedge` və `lighthouse` CLI tapılmadığı üçün Lighthouse balı ölçülməyib. Bal uydurulmur.
- Field CWV hədəfləri production trafikində p75 üzrə qalır: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1.

## 6. Texniki SEO rubric-i

| Sahə | Bal | Sübut / çıxılma |
| --- | ---: | --- |
| Crawl, host, index siyasəti | 17/20 | canonical/robots/facet pass; live edge və streamed soft-404 üçün 3 bal saxlanılıb |
| Metadata, H1 və content | 15/15 | real HTML 6/6 pass, home intent/copy testli |
| Sitemap və daxili linklər | 15/15 | 23 sitemap + 55 daxili URL HTTP pass |
| Structured data | 13/15 | parse/unit parity pass; external live Rich Results validation gözləyir |
| Landing və admin quality gate | 14/15 | registry/audit hazır; production inventory ilə landing coverage hələ ölçülməyib |
| Cache və Core Web Vitals | 6/10 | cache/revalidation/build hazır; Lighthouse/field data yoxdur |
| Measurement/privacy | 6/10 | consent/PII/env hazır; real GSC/GA/GTM access/ID yoxdur |
| Local SEO və E-E-A-T | 6/10 | hüquqi trust hazır; address conflict, geo/hours, GBP və real foto açıqdır |
| **Cəmi** | **92/100** | 100/100 yalnız aşağıdakı canlı/manual sübutlardan sonra |

Bu rubric Seobility-nin proprietary balı ilə birbaşa müqayisə edilmir.

## 7. Manual görüləcək işlər

1. Production deploy-dan əvvəl D1 snapshot/export al və `npm run db:migrate:remote` ilə `0010` + `0011` tətbiq et.
2. Cloudflare checklist üzrə HTTP/www redirect, HSTS, WAF/verified bot skip və rollback qaydalarını zone-da tətbiq et.
3. GSC Domain property-ni DNS ilə təsdiqlə, sitemap təqdim et və əsas template-ləri URL Inspection-dan keçir.
4. `NEXT_PUBLIC_GTM_ID` və ya `NEXT_PUBLIC_GA_MEASUREMENT_ID` yalnız hüquqi consent təsdiqindən sonra production-a əlavə et.
5. Production-da Lighthouse mobile və GSC/CrUX p75 CWV baseline ölç.
6. Property/blog/service/FAQ nümunələrini Google Rich Results Test və Schema Markup Validator ilə live validate et.
7. Google Business Profile və seçilmiş kataloqlarda yalnız vahid təsdiqlənmiş NAP istifadə et.

## 8. İstifadəçidən tələb olunan məlumat və girişlər

- `109A`/`45A` ünvan ziddiyyətinin hüquqi sənəd + GBP/Maps əsasında qərarı.
- GSC/DNS və Cloudflare zone admin girişi.
- Google Business Profile owner/manager girişi.
- GA4/GTM ID və consent/hüquqi siyasət təsdiqi.
- Dəqiq geo pin və real iş/bayram saatları.
- Real logo master asseti, ofis/komanda fotoları və istifadə icazələri.
- Davamlı inventara əsaslanan prioritet rayon/metro siyahısı.
- VÖEN artıq məlumdur (`1507750271`); yenidən tələb edilmir, yalnız public dərc səlahiyyəti təsdiqlənməlidir.

Detallı cədvəl: `docs/seo/business-data-blockers.md`.

## 9. 30/60/90 plan

- **0–30:** GBP sahiblik, NAP qərarı, Maps pin/kateqoriya, real foto/post ritmi, etik review prosesi, GSC baseline.
- **31–60:** keyfiyyətli local directory sitatları, real tərəfdaş materialları, Bakı alış/kirayə/sənəd/ipoteka content klasterləri, CTR testləri.
- **61–90:** ekspert/media materialları, backlink keyfiyyət analizi, content consolidation, GBP/GSC/consent-li conversion nəticələri və rüblük audit.

Tam plan: `docs/seo/off-page-and-content-90-day-plan.md`.

## 10. Risk və rollback

- Kod rollback-i commit qrupları üzrə reverse revert ilə aparılır: P2 docs/trust → cache → P1 discovery/audit → P0 foundation.
- `0011` yalnız text timestamp-ləri eyni anın integer formasına çevirir; remote tətbiqdən əvvəl D1 export saxlanılmalıdır. Geri dönüş yalnız həmin export-dan seçilmiş restore ilə edilməlidir.
- Redirect/HSTS/WAF dəyişikliyində əvvəlki Cloudflare rule export-u saxlanılır; HSTS dərhal maksimum/preload ilə aktivləşdirilmir.
- Analytics PII/consent şübhəsində GA/GTM env söndürülür və əvvəlki container versiyasına qayıdılır.
- Index itkisi halında ilk yoxlama sırası: deploy → `X-Robots-Tag` → robots → canonical → sitemap → Cloudflare redirect/cache.
