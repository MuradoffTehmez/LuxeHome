# Luxe Home Estate — SERP Ecosystem production qəbul hesabatı

**Tarix:** 31 avqust 2026
**Branch:** `main`
**Canonical host:** `https://luxehomeestate.az`
**PRD:** `docs/LuxeHomeEstate — SERP Ecosystem PRD.md`
**Production Worker version:** `d88313a3-e461-494d-a7a6-05fd3db56e14`

## 1. Nəticə

SERP Ecosystem PRD-nin tətbiq daxilində olan funksional scope-u production-a çıxarılıb: məlumat modeli, migrasiya, granular SEO RBAC, publication quality gate, redirect/404 idarəsi, media SEO, metadata və hreflang mühərriki, entity schema-ları, DB əsaslı landing-lər, sitemap index/feed-ləri, organic attribution, bazar analitikası və vahid SERP admin mərkəzi işləyir.

Production qəbulunda iki xarici əməliyyat açıq qalır:

1. `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` Worker secret-i verilməyib; admin GSC sync bunu idarəli xəta ilə göstərir. Google Search Console property-si brauzerdə təsdiqlənib və sitemap işləyir, lakin API snapshot sync credential olmadan mümkün deyil.
2. `/az` üçün Google URL Inspection canlı testində səhifə indekslənə bilən kimi təsdiqlənib, amma Google-a “İndekslənməsini istə” sorğusu ayrıca istifadəçi adından submission olduğuna görə hələ göndərilməyib.

Bu iki maddə kod qüsuru deyil və repository daxilində credential uydurmaqla bağlana bilməz.

## 2. İcra edilmiş əsas qatlar

| Qat | Production nəticəsi |
| --- | --- |
| Data modeli | SEO metadata, landing, keyword, semantic entity, GSC metric, SERP snapshot, SEO audit/alert və redirect əlaqələri Prisma + D1-dədir |
| Publication quality gate | Kritik listing mismatch, duplicate və retention qaydaları publish axınında tətbiq olunur |
| Media SEO | Semantik ad, WebP çevirmə, watermark, checksum, alt/metadata və audit dəstəyi işləyir |
| Metadata | Mərkəzi title/description/canonical/robots/OG/Twitter generatoru və DB override-ları işləyir |
| Multilingual | `/az`, `/en`, `/ru` self-canonical; bidirectional `az/en/ru/x-default` hreflang işləyir |
| Schema | Organization/LocalBusiness/RealEstateAgent, WebSite, BreadcrumbList, ItemList, Dataset və entity schema-ları valid JSON-LD verir |
| Faceted navigation | Query/filter səhifələri `noindex, follow`; idarəli landing-lər ayrıca canonical entity-dir |
| Sitemap | `/sitemap.xml` index, locale/entity feed-ləri və yalnız canonical query-siz URL-lər |
| Robots | Public crawl açıq, admin/giriş private; Cloudflare managed content signals ilə birlikdə canonical sitemap elan edilir |
| Local/entity SEO | Agent, agentlik, bazar analitikası, bilik mərkəzi və entity graph public route-ları işləyir |
| Admin | 18 faktiki SERP/redirect modulu auth + permission sərhədində production-da açılır |
| Measurement | Organic attribution/conversion, GSC snapshot modeli, SERP monitorinq, audit, alert və real-user Web Vitals saxlanılır |

## 3. Commit və keyfiyyət qapıları

PRD işi məntiqi qruplara bölünmüş **28 commit** ilə tamamlanıb; minimum 20 commit tələbi keçilib. Qruplar data/auth/policy, listing/media/redirect, metadata/schema/landing/sitemap, analytics/market/public routes, admin modulları və test/production acceptance qatları üzrə ayrılıb.

Yekun kod qapıları:

- `npm run typecheck` — **pass**.
- `npm test` — **89 test faylı, 373 test pass, 0 failure**.
- `npm run build` — **pass**; lint, type validation və production route generation tamamlandı.
- `npm run test:seo:routes` — **8/8 true 404 + noindex pass**.
- `npm run test:seo:live` — **42 pass, 2 Cloudflare challenge skip, 0 failure**.

İki skip `/` və `www` üçün unverified sintetik HTTP agentinə verilən Cloudflare Managed Challenge-dir. Eyni iki axın real Chrome-da ayrıca yoxlanıb və hər ikisi `https://luxehomeestate.az/az` ünvanına düşüb.

## 4. D1 və deploy sübutu

- Production D1 migration: `0025_serp_ecosystem.sql`.
- Nəticə: **63 command uğurla tətbiq edilib**.
- Deploy domenləri: `luxehomeestate.az`, `www.luxehomeestate.az`.
- Worker version: `d88313a3-e461-494d-a7a6-05fd3db56e14`.
- Production deploy və OpenNext-in deploy build-i uğurla tamamlanıb.

## 5. Canlı HTTP və brauzer qəbulu

Real Chrome DOM qəbulu:

- `/az`, `/en`, `/ru`: 200, unikal title/H1, self-canonical, dörd hreflang və valid JSON-LD.
- `/az/emlaklar?otaq=3&siralama=qiymet-artan`: `noindex, follow` və işlək filter nəticəsi.
- `/az/bazar-analitikasi` və `/az/bazar-analitikasi/baki`: 200; Dataset schema, mənbə və metodologiya görünür.
- `/az/agentler`, `/az/agentlikler`, `/az/bilik-merkezi`: 200 və canonical entity səhifələri.
- Naməlum public URL: həqiqi 404 UI + `noindex`; ayrıca HTTP smoke 404 statusunu təsdiqləyir.
- Ana səhifədə “Əmlaklara bax” naviqasiyası `/az/emlaklar` səhifəsinə keçir və filter formu işlək görünür.
- Root və `www` Chrome-da canonical apex `/az`-a düşür.

Admin brauzer qəbulu aşağıdakı faktiki route-larda 404/application error olmadan keçib:

- ümumi baxış, qlobal/local SEO, metadata, landing-lər;
- redirects/404, schema, sitemap, robots, entities;
- content, media, keyword cluster, SERP monitorinq, audit;
- Search Console, indexing və daxili/qırıq linklər.

## 6. Cloudflare verified bot siyasəti

Security Analytics əvvəl crawler sorğularının `manage definite bots` managed qaydasına düşdüyünü göstərdi. Production-a aşağıdakı dar istisna əlavə edilib:

- ad: `Allow verified search bots`;
- expression: `(cf.client.bot)`;
- action: `Skip`;
- scope: remaining custom rules, managed rules və Super Bot Fight Mode;
- order/status: **First / Active**.

Ümumi WAF və bot qoruması söndürülməyib. Yalnız Cloudflare-in həqiqətən doğruladığı Googlebot/Bingbot kimi botlar challenge-dən azaddır.

## 7. Google Search Console canlı sübutu

Search Console brauzer qəbulu:

- Domain property `sc-domain:luxehomeestate.az` mövcuddur və hesabda açılır.
- Ümumi baxış **9 web search click** göstərir.
- HTTPS hesabatı: **13 HTTPS, 0 non-HTTPS**.
- Breadcrumb enhancement: **7 valid, 0 invalid**.
- `https://luxehomeestate.az/sitemap.xml`: **Successful**.
- Son oxunma: **30 avqust 2026**.
- Aşkarlanmış səhifə: **90**.
- `/az` stored index statusu hazırda Google indeksində deyil; canlı test görünüşü səhifənin indekslənə bilən olduğunu göstərib.

Admin GSC API sync düzgün şəkildə `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN secret-i konfiqurasiya edilməyib` xəbərdarlığını verir. Workspace `.env`/`.dev.vars` və production Worker secret siyahısında həmin token yoxdur.

## 8. Core Web Vitals və performans

Production `WebVitalMetric` RUM qeydlərinin son 7 günlük public p75 nəticəsi:

| Metrik | p75 | Qiymət |
| --- | ---: | --- |
| CLS | 0.002 | Good |
| FCP | 968 ms | Good |
| INP | 40 ms | Good |
| LCP | 1,066.4 ms | Good |
| TTFB | 796 ms | Good |

Son 24 saatın seçilmiş kritik SERP route-larında CLS 0.002, LCP 1,422 ms və INP 40 ms-dir; üç Core Web Vital hədd daxilindədir. Həmin seçimdə TTFB p75 975 ms olaraq “needs improvement” olsa da TTFB Core Web Vital deyil və LCP/INP/CLS qəbulunu pozmur.

Google PageSpeed public API yoxlaması anonim gündəlik kvotanın tükənməsinə görə HTTP 429 qaytardı. Bal uydurulmur; real production RUM yuxarıda verilib.

## 9. Risk və rollback

- Kod rollback-i məntiqi commitlər üzrə `git revert` ilə edilə bilər.
- D1 rollback yalnız migration öncəsi snapshot və seçilmiş restore ilə aparılmalıdır; destruktiv schema reverse avtomatlaşdırılmayıb.
- Verified bot qaydası problem yaratsa Cloudflare custom rule deaktiv edilə bilər; ümumi WAF qaydaları dəyişdirilməyib.
- Index itkisi üçün yoxlama sırası: deploy → Cloudflare Security Events → robots → canonical/hreflang → sitemap → GSC URL Inspection.

## 10. Qalan istifadəçi səlahiyyəti

Tam operational bağlanış üçün:

1. Google OAuth-dan Search Console read access token verilməli və Worker secret kimi saxlanmalıdır.
2. `/az` URL-si üçün Search Console-da indekslənmə sorğusunun göndərilməsinə istifadəçi təsdiqi verilməlidir.

Bu məlumatlar olmadan sistem credential yaratmır, Google hesabına daimi giriş vermir və istifadəçi adından indeks submission göndərmir.
