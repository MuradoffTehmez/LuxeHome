# SEO ölçmə və əməliyyat runbook-u

## Məsuliyyət və girişlər

- SEO sahibi: GSC, content inventarı, metadata və aylıq audit.
- Texniki sahibi: deploy, Cloudflare, sitemap/robots, schema və revalidation.
- Biznes sahibi: NAP, iş saatı, geo pin, foto, müəllif və iddia təsdiqi.
- Analytics sahibi: consent rejimi, GTM/GA4 dəyişiklik jurnalı və PII nəzarəti.

Production dəyişiklikləri əvvəl staging-də yoxlanılır. Staging `noindex, nofollow` qalır və GSC-yə təqdim edilmir.

## Google Search Console

1. Domain property-ni DNS ilə təsdiqlə; sayt daxilindəki verification meta env-dən verilsin.
2. Yalnız `https://luxehomeestate.az/sitemap.xml` təqdim et.
3. Deploy-dan sonra ana səhifə, bir list, bir public detail, bir blog və data qapısını keçən bir landing üçün URL Inspection apar.
4. Həftəlik Page indexing, Sitemaps, Core Web Vitals, HTTPS və Manual actions bölmələrini yoxla.
5. Aylıq branded/non-branded query, page, device və country export-u saxla. CTR dəyişikliklərini metadata change-log ilə müqayisə et.

## GA4/GTM və consent

- `NEXT_PUBLIC_GTM_ID` və ya `NEXT_PUBLIC_GA_MEASUREMENT_ID` yalnız production env-də verilir.
- Analytics yalnız istifadəçi açıq razılıq verdikdən sonra yüklənir; razılıq yoxdursa provider no-op qalır.
- Event payload allowlist-dən keçir və e-poçt, telefon, ad, mesaj, sərbəst mətn və digər PII göndərilmir.
- Əsas eventlər: telefon/WhatsApp klikləri, contact submit, property view, favorite, compare, filter, agency contact və elan təqdimatının start/complete mərhələləri.
- GTM publish üçün versiya adı, dəyişiklik izahı, tester və tarix yazılır; rollback üçün əvvəlki container versiyası saxlanılır.

## Cloudflare

- HTTP→HTTPS və www→apex bir-hop redirect; apex canonical mənbədir.
- HSTS yalnız HTTPS və bütün subdomain hazırlığı təsdiqlənəndən sonra mərhələli aktivləşdirilir.
- Verified bot trafiki yalnız Cloudflare-in doğrulanmış bot siqnalı ilə təhlükəsizlik qaydalarından seçilmiş şəkildə skip edilir; bütün WAF yoxlamaları kor-koranə söndürülmür.
- Managed Challenge real trafik analizi ilə tətbiq edilir. Dəyişiklikdən əvvəl rule export/screenshot və rollback planı saxlanılır.
- Cache dəyişikliklərində public tag/path revalidation yoxlanılır; auth/admin/private cavabları cache edilmir.

Ətraflı addımlar: `docs/seo/cloudflare-production-checklist.md`.

## Schema və metadata yoxlaması

Hər deploy-da smoke script aşağıdakıları yoxlayır: status, title, description, canonical, robots, OG, tək H1, parse olunan JSON-LD və daxili linklər. Əlavə olaraq:

- Google Rich Results Test ilə public property, blog, service və FAQ nümunələrini manual yoxla.
- Schema Markup Validator ilə `@id` əlaqələri, boş dəyər və visible-content parity-ni yoxla.
- Closed/noIndex property-nin `noindex, follow`, RU/EN-in isə AZ canonical + `noindex, follow` verdiyini təsdiqlə.
- Təsdiqlənməmiş geo, iş saatı, review və aggregateRating struktur datada olmamalıdır.

## Sitemap və crawl nəzarəti

- Sitemap yalnız AZ canonical, public və keyfiyyət qapısını keçən URL-ləri saxlayır.
- Draft, demo, soft-deleted, closed/noIndex, canonical override və private route sitemap-a düşmür.
- Hər sitemap URL-si 200, indexable və self-canonical olmalıdır; 3xx/4xx/5xx aşkarlanarsa mənbə query düzəldilir.
- Robots private/admin route-ları bloklayır, `noindex, follow` utility route-larının crawl-na mane olmur.

## Core Web Vitals və lab ölçmə

- GSC field CWV əsas qərar mənbəyidir; kifayət qədər field data olmayanda PageSpeed Insights/CrUX statusu ayrıca qeyd edilir.
- Lighthouse mobile lab testi ana səhifə, list, detail, landing və blog template-lərində eyni cihaz/network profili ilə aparılır.
- Performance balı tək KPI deyil. LCP, INP/TBT, CLS, TTFB və ağır asset/request səbəbləri qeyd edilir.
- Ölçmə mümkün olmayanda bal uydurulmur; tarix, mühit və blocker yazılır.

## Aylıq audit checklist-i

1. Production host/redirect/HSTS və staging robots header-lərini yoxla.
2. GSC coverage, sitemap, manual action, security və CWV dəyişikliklərini qeyd et.
3. Admin SEO auditində missing/duplicate meta, alt, thin content, schema və orphan issue-ları ixrac et.
4. 404, redirect chain, canonical və parametrli indeks URL-lərini crawl et.
5. Sitemap URL-lərini public DB statusu və `updatedAt` ilə nümunəvi müqayisə et.
6. JSON-LD-ni dörd əsas template-də validate et.
7. GBP və seçilmiş kataloqlarda NAP uyğunluğunu yoxla.
8. GA4 consent və PII-siz eventlərin DebugView nümunəsini yoxla.
9. Dependency/security hesabatını triage et; breaking avtomatik fix tətbiq etmə.
10. Tapıntıları severity, owner, deadline, sübut və rollback ilə issue siyahısına yaz.

## Hadisə və rollback

- Kəskin index itkisi: son deploy, robots, `X-Robots-Tag`, canonical, sitemap və Cloudflare redirect qaydalarını ilk yoxla.
- Schema error artımı: problemli generator/route commitini revert et; məzmunu silmə.
- Analytics PII şübhəsi: GTM/GA env-ni dayandır, container-i əvvəlki versiyaya qaytar və data governance sahibi ilə araşdır.
- Cache köhnəlməsi: uyğun tag/path revalidation et; bütün cache-i yalnız təsir dairəsi bilinirsə purge et.
