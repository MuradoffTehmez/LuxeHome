# Luxe Home Estate production SEO qatı — dizayn

Tarix: 23 avqust 2026
Status: implementasiya öncəsi review

Yenilənmə: 24 avqust 2026 — `next-intl` locale route-ları nəzərə alındı.

## 1. Məqsəd və uğur meyarı

Bu işin məqsədi Luxe Home Estate saytının SEO qatını ölçülə bilən production səviyyəsinə
çatdırmaqdır. “100/100” yalnız kodun mövcudluğu deyil, aşağıdakı sübutların birlikdə
uğurlu olması deməkdir:

- production build və TypeScript yoxlaması;
- render edilmiş HTML-də metadata, canonical, robots, H1 və JSON-LD yoxlaması;
- yalnız 200, canonical və indexable URL-lərdən ibarət sitemap;
- utility/private səhifələr üçün düzgün `noindex` siyasəti;
- filter URL-lərinin sonsuz crawl space yaratmaması;
- schema obyektlərinin parse olunması və görünən kontentlə uyğunluğu;
- mümkün olduqda Lighthouse və HTTP smoke nəticələri;
- canlı edge, Search Console və real-user məlumatı tələb edən bəndlərin ayrıca sübutu.

Google sıralaması, tam indekslənmə və rich result görünüşü zəmanət verilən nəticələr deyil.

## 2. Audit nəticəsinin xülasəsi

Mövcud kodda güclü baza var: mərkəzi metadata helper-i, sitemap/robots route-ları,
Organization/WebSite və detal schema-ları, public query qoruması və admin formalarında meta/alt
sahələri mövcuddur. Aşağıdakı boşluqlar production qəbulunu bloklayır:

- ana səhifənin ayrıca metadata-sı və “Bakıda daşınmaz əmlak” H1-i yoxdur;
- `/favoritler` robots.txt-də bloklanır, amma səhifə `noindex` deyil; `/muqayise` indexable-dır;
- sitemap agentlik, FAQ və SEO landing route-larını əhatə etmir;
- filter, sort, axtarış və pagination metadata-sı request-dən asılı deyil;
- əmlak metadata-sı admin `metaTitle`/`metaDescription` sahələrini istifadə etmir;
- əmlak OG tipi səhvən `article`-dır və description sözün ortasında kəsilir;
- property schema location sahələrini istifadə etmir, comment və faktiki tip uyğun deyil;
- blog schema-sı mövcud olmayan `/logo.png` URL-inə istinad edir;
- təsdiqlənməmiş geo və iş saatları Organization schema-sında fakt kimi çıxır;
- JSON-LD serializer-i HTML script bağlanışını escape etmir və boş dəyərləri təmizləmir;
- görünən/crawl edilə bilən breadcrumb komponenti yoxdur;
- rayon/kateqoriya/metro landing sistemi yoxdur; `Property` modelində metro əlaqəsi yoxdur;
- admin SEO auditı yalnız boş meta sahələrini göstərir;
- analytics və Search Console verification inteqrasiyası yoxdur;
- DB oxuyan public route-lar tam `force-dynamic` işləyir;
- canlı domen anonim browser/crawler sorğularında Cloudflare Managed Challenge qaytarır;
  verified Googlebot davranışı Search Console və Cloudflare ilə ayrıca yoxlanmalıdır.

24 avqust 2026 tarixli Seobility PDF yoxlaması canlı `https://www.luxehomeestate.az/` üçün
sonrakı ayrıca ölçmə təqdim edir: HTTP 200, ümumi SEO score 54%, meta 95%, page quality 38%,
page structure 79%, link structure 25%, server 0%. Hesabat H1-in olmamasını, 213 sözlük nazik
ana səhifəni, query-parametrli daxili linkləri, üç boş logo alt-ını, `www`-dan apex-ə redirect
olmamasını və `private, no-cache, no-store` cavabında 0.71 saniyə response time-ı göstərir.
HSTS artıq edge-də `max-age=15552000` ilə mövcuddur. Bu PDF bir alətin lab auditidir; Lighthouse,
CrUX və Search Console sübutunu əvəz etmir, amma final müqayisə üçün 54% baseline kimi saxlanılır.

## 3. Seçilən yanaşma

Seçilən həll ayrıca ağır SEO CMS modeli yaratmadan data-backed SEO qatı qurur:

1. Sabit kommersiya niyyətləri mərkəzi TypeScript registry-də saxlanılır.
2. Taksonomiya route-ları real `PropertyType` və `Location` qeydlərindən oxunur.
3. Hər landing real public elan sayı və real aqreqatlarla yaradılır.
4. Nəticəsi olmayan və ya minimum keyfiyyət həddinə çatmayan landing `404` qaytarır və sitemap-a
   düşmür.
5. Metadata, schema, sitemap və daxili linklər eyni registry/query nəticəsindən qidalanır.

Bu yanaşma route copy-sinin kor-koranə hardcode edilməsinin qarşısını alır, amma hazırkı mərhələdə
əlavə `SeoLanding` CRUD subsystem-i yaratmır.

## 4. İndekslənmə siyasəti

### 4.0 Dil variantları

Cari `next-intl` konfiqurasiyası `az`, `ru` və `en` route-larını yaradır, lakin yalnız kiçik UI
mesaj dəsti tərcümə olunub; public DB məzmunu və səhifə copy-si Azərbaycan dilində qalır. Buna
görə production indeks siyasəti belədir:

- Azərbaycan dili default, canonical və indexable variantdır (`localePrefix: "as-needed"`,
  yəni `/emlaklar`);
- `/ru/**` və `/en/**` route-ları real lokal məzmun sahələri yaradılana qədər
  `noindex, follow` olur, sitemap-a və `hreflang` siyahısına daxil edilmir;
- həmin route-ların canonical-ı semantik cəhətdən eyni AZ route-a işarə edir;
- DB title/description/body və landing copy-si locale üzrə ayrıca saxlanılmadan RU/EN indeksə
  açılmır;
- gələcəkdə yalnız tam tərcümə olunmuş route-lar qarşılıqlı `hreflang` və `x-default` ilə açılır.

Bu siyasət UI dil seçimini saxlayır, amma üç dildə eyni Azərbaycan məzmununun duplikat kimi
indekslənməsinə yol vermir.

### 4.1 Indexable səhifələr

- ana səhifə və əsas public siyahılar;
- public əmlak, layihə, xidmət, blog və təsdiqlənmiş agentlik detalları;
- FAQ, haqqımızda, əlaqə və hüquqi səhifələr;
- real nəticəsi və kifayət qədər faydalı məzmunu olan SEO landing-lər;
- `/emlaklar?sehife=N` kimi yalnız pagination URL-ləri — səhifə mövcuddursa self-canonical.

### 4.2 `noindex, follow`

- `/daxil-ol`, `/qeydiyyat`, `/favoritler`, `/muqayise`;
- `/kabinet/**` və istifadəçiyə özəl səhifələr;
- mətn axtarışı, filter, sort və sonsuz parametr kombinasiyaları;
- satılmış və kirayə verilmiş elanlar: URL 200 qalır, oxşar elanlara keçid verir, sitemap-dan
  çıxır və `noindex, follow` olur.

Admin və əməkdaş giriş route-ları authentication, robots block və `noindex, nofollow` ilə private
qalır. `noindex` direktivini Google-un görməli olduğu public utility route-lar robots.txt-də
bloklanmır.

### 4.3 404/410 və köhnə elanlar

- mövcud olmayan slug və nəticəsiz landing `notFound()` ilə 404 qaytarır;
- soft-delete olunmuş elan hazırkı data modeli ilə 404 qaytarır;
- 410 yalnız ayrıca tombstone məlumatı saxlanıldıqdan sonra tətbiq edilə bilər;
- avtomatik “ən yaxın” redirect yaradılmır; yalnız biznes baxımından ekvivalent replacement
  məlumdursa 301 verilir.

## 5. Canonical və faceted navigation

`/emlaklar` üçün metadata request parametrlərindən qurulur:

- parametrsiz səhifə self-canonical və indexable;
- yalnız `sehife=N` varsa mövcud pagination səhifəsi self-canonical və indexable;
- filter/axtarış/sort varsa `noindex, follow`;
- filtr kombinasiyası registry-dəki təmiz SEO landing-lə tam eynidirsə canonical həmin landing-ə
  yönəlir; başqa kombinasiyada səhifə əsas siyahı ilə ekvivalent olmadığı üçün canonical verilmir;
- tanınmayan və təkrarlanan parametrlər indexable variant yaratmır;
- page 1 həmişə `/emlaklar`, `?sehife=1` deyil;
- mövcud olmayan pagination səhifəsi 404 qaytarır;
- pagination server-render edilmiş real `<a>` linkləri ilə qalır.

SEO dəyəri olan kateqoriya, satış/kirayə, rayon və metro niyyətləri query parametrindən çıxarılıb
təmiz route kimi təqdim olunur.

Blog kateqoriya/filter parametrləri də `noindex, follow` olur və əsas blogla ekvivalent olmadığı
üçün canonical almır; parametrsiz və real pagination səhifələri ayrıca metadata alır.

## 6. SEO landing arxitekturası

### 6.1 Sabit niyyət registry-si

Mərkəzi registry aşağıdakı route-ları filter mapping, title, description, H1, giriş məzmunu,
FAQ və əlaqəli route-larla təsvir edir:

- `/satilan-emlaklar`;
- `/kiraye-emlaklar`;
- `/bakida-satilan-menziller`;
- `/bakida-kiraye-menziller`;
- `/villalar`;
- `/heyet-evleri`;
- `/torpaq-saheleri`;
- `/kommersiya-obyektleri`;
- `/ofisler`.

Root səviyyəli registry route-ları `src/app/[locale]/(site)/[seoLanding]/page.tsx` vasitəsilə resolve olunur;
mövcud statik route-lar Next.js prioritetinə görə əvvəl seçilir. Registry-də olmayan slug 404-dür.

### 6.2 Taksonomiya route-ları

- `/rayon/[slug]` yalnız `Location.kind = DISTRICT` qeydi üçün işləyir;
- `/metro/[slug]` yalnız `Location.kind = METRO` qeydi üçün işləyir;
- uyğun olmayan kind və slug 404 qaytarır;
- sitemap yalnız ən azı 3 uyğun, aktiv public elanı olan taksonomiyaları daxil edir.

### 6.3 Metro data modeli

Property modelinə optional `metroId` və `metro` relation-u əlavə edilir. D1 migration mövcud
qeydlərə toxunmadan nullable sütun və index yaradır. Admin və public elan formalarında şəhərdən
asılı metro seçimi açılır. Metro məlumatı olmayan köhnə elan avtomatik təxmin edilmir.

Migration production deploy-dan əvvəl tətbiq edilməlidir; əks halda yeni Prisma client köhnə
D1 schema-sına qarşı işlədilə bilməz.

### 6.4 Landing keyfiyyət qapısı

Landing yalnız aşağıdakı şərtlərdə indexable olur:

- query `publicPropertyWhere()` bazasından başlayır;
- real public elan sayı `MIN_INDEXABLE_LISTINGS = 3` həddinə çatır;
- bir H1, 250–500 söz faydalı mətn, nəticə sayı, real siyahı, FAQ və əlaqəli linklər var;
- mətn yoxlanılmamış bazar statistikası, qiymət proqnozu və üstünlük iddiası yaratmır;
- aqreqatlar yalnız cari public data-dan hesablanır və “saytdakı aktiv elanlar” kimi təqdim olunur.

## 7. Metadata sistemi

`buildMetadata()` aşağıdakı imkanlarla genişlənir:

- `indexPolicy`: `index`, `noindex-follow`, `private`;
- production canonical URL-in HTTPS və təsdiqlənmiş host olması;
- default real `og-default.png` şəkli;
- GSC verification metadata-sı yalnız env dəyişəni varsa;
- staging-də məcburi `noindex, nofollow`;
- Open Graph və Twitter üçün eyni canonical image/description mənbəyi.
- locale-aware OG dili və AZ canonical mapping; natamam RU/EN route-ları üçün məcburi
  `noindex, follow`.

Ana səhifə ayrıca title, description və canonical alır. Hero H1-i “Bakıda daşınmaz əmlak
satışı və icarəsi” olur; sloqan vizual ikinci səviyyədə qalır. Hero-dan sonra 100–180 sözlük
lokal giriş və satış, kirayə, əsas kateqoriya, layihə və real prioritet location linkləri verilir.

Detail fallback description-ları söz sərhədində kəsilir. Əmlak `metaTitle` və
`metaDescription` sahələrini birinci seçim kimi istifadə edir və OG tipi `website` olur.

## 8. Structured data

Bütün schema generatorları `src/lib/seo.ts` qatında mərkəzləşdirilir:

- root: `RealEstateAgent` və `WebSite`;
- detail/list pages: `BreadcrumbList`;
- property: uyğun yaşayış/daşınmaz əmlak obyekti və `Offer`;
- blog: `BlogPosting`;
- service: `Service`;
- agency: `RealEstateAgent`/`LocalBusiness`;
- landing/list: `ItemList`;
- yalnız görünən sual-cavabla eyni olan səhifələr: `FAQPage`.

Qaydalar:

- organization və publisher sabit `@id` istifadə edir;
- property address, city, district, metro və geo dəyərləri uyğun location obyektinə bağlanır;
- logo URL-i mövcud `/logo-full.png` və ya `/logo-mark.png` asset-indən `siteUrl()` ilə qurulur;
- təsdiqlənməmiş geo və iş saatları schema-dan çıxarılır;
- `SearchAction` saxlanılsa belə köhnə sitelinks search box iddiası silinir;
- deep-clean serializer `undefined`, boş string və boş massivləri çıxarır;
- serializer `<`, `>`, `&`, U+2028 və U+2029 simvollarını escape edərək script injection-u bağlayır.

## 9. Daxili linklər və breadcrumbs

Server-render edilmiş `Breadcrumbs` komponenti real `next/link` keçidləri verir və eyni
item-lərdən JSON-LD qurulur. Əmlak detalları rayon, metro, tip və listing intent landing-lərinə;
landing-lər uyğun elanlara və əlaqəli landing-lərə; ana səhifə əsas kommersiya route-larına
link verir. Blog məqalələrində müəllifin daxil etdiyi təhlükəsiz daxili linklər saxlanılır;
əlavə kontekstual “əlaqəli xidmətlər və əmlaklar” bloku orphan riskini azaldır.

Footer-in query əsaslı kateqoriya linkləri uyğun təmiz SEO route-ları ilə əvəz olunur; registry-də
olmayan və ya data keyfiyyət qapısını keçməyən route-a crawl linki yaradılmır.

## 10. Admin SEO keyfiyyət qapısı

Admin audit query-si yalnız problemli ilk 50 qeydi deyil, göstərici və issue listi qaytarır:

- indexable public və sitemap URL sayı;
- boş, qısa, uzun və duplicate meta title/description;
- qısa property/blog/service/project məzmunu;
- boş cover və boş məzmun şəkli alt-ları;
- yararsız slug;
- çatışmayan city/district/metro/address/schema sahələri;
- blog müəllifi, publish və update tarixləri;
- ehtimal olunan orphan route-lar;
- severity: kritik, xəbərdarlıq, məlumat;
- birbaşa düzəliş admin linki.

Formalar üçün ortaq SEO field component-i simvol sayğacı, desktop/mobile SERP preview və
Azərbaycan dilində tövsiyə göstərir. Boş alt mətn publish-i kor-koranə bloklamır, amma məzmun
şəkli üçün görünən xəbərdarlıq yaradır. Dekorativ şəkil seçimi alt mətnin niyə boş olduğunu
açıq saxlayır. Saxta fallback mətn DB-yə yazılmır.

## 11. Cache və Core Web Vitals

Auth və şəxsi route-lar cache olunmur. Public query-lər OpenNext-in R2 incremental cache-i ilə
uyğun tag-lı cache qatına keçirilir. Admin server action-ları uyğun path/tag-ləri revalidate edir.
Request cookie/header tələb etməyən public səhifələrdə lazımsız `force-dynamic` azaldılır;
D1 binding-in build-time əlçatmazlığı nəzərə alınaraq runtime cache istifadə edilir.

Hero image üçün mövcud `priority`, `fetchPriority`, `sizes` və ölçü rezervasiyası qorunur.
Uzun zoom animasiyası azaldılır və mövcud `prefers-reduced-motion` qaydası saxlanılır. Unsplash
şəkli müvəqqəti fallback kimi açıq blocker qalır; real biznes fotosu olmadan “tam E-E-A-T” iddiası
verilmir.

LCP ≤ 2.5 s, INP ≤ 200 ms və CLS ≤ 0.1 yalnız CrUX/GSC 75-ci percentil məlumatı ilə təsdiqlənir.
Lokal Lighthouse lab nəticəsi ayrıca göstərilir və field-data kimi təqdim edilmir.

## 12. Analytics və privacy

Analytics yalnız production-da və uyğun env dəyişəni olduqda yüklənir:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` və ya `NEXT_PUBLIC_GTM_ID`;
- `GOOGLE_SITE_VERIFICATION`;
- heç bir placeholder ID hardcode edilmir;
- local/staging event göndərmir;
- event payload-a ad, telefon, e-poçt, mesaj və tam ünvan daxil edilmir.

Ölçülən eventlər: telefon, WhatsApp, contact submit, property view, favorite, compare, filter,
agent/agency contact, listing submission start və complete. Consent tələb edən analytics üçün
cookie siyasəti və consent davranışı uyğunlaşdırılır; ID olmayanda heç bir izləmə cookie-si yaranmır.

## 13. Cloudflare və canonical host

Production canonical host `https://luxehomeestate.az` olur. HTTP → HTTPS və `www` → non-www
redirect edge-də bir hop permanent redirect kimi yoxlanır. Application səviyyəsində təhlükəsiz
fallback redirect və HSTS header saxlanılır, amma Cloudflare redirect/WAF konfiqurasiyası ayrıca
deployment sənədində verilir.

Managed Challenge verified search bot və sitemap sorğularına mane olmamalıdır. Bunu kod yox,
Cloudflare Security Events, verified bot skip rule və Search Console URL Inspection sübut edir.

## 14. Local SEO və E-E-A-T

`siteConfig` NAP məlumatının yeganə mənbəyi qalır. Mövcud “Əliyar Əliyev 109A” dəyişdirilmir.
45A/109A uyğunsuzluğu təsdiqlənənədək external blocker-dir. Dəqiq geo, iş saatı, VÖEN, lisenziya,
reytinq, rəy, təcrübə, satış və müştəri statistikası uydurulmur.

Haqqımızda və Əlaqə səhifələri real komanda/ofis şəkilləri, müəllif profilləri və hüquqi məlumat
üçün hazır UI slot-ları alır; boş data olduqda yalan placeholder görünmür.

## 15. Test və verifikasiya

Hər P0/P1/P2 mərhələsindən sonra:

1. birbaşa local TypeScript binary-si ilə `tsc --noEmit` (`npm` shim bərpa olunarsa
   `npm run typecheck`);
2. mövcud Vitest suite və yeni SEO unit testləri;
3. mərhələ sonunda production build.

Final yoxlama:

- təmiz `.next` ilə Prisma generate + Next build;
- workerd/OpenNext preview mümkündürsə HTTP crawl;
- title, description, canonical, robots, OG, JSON-LD və H1 extractor;
- sitemap URL status/canonical/indexability uyğunluğu;
- robots/noindex konflikti;
- filter və pagination siyasəti;
- 404 və redirectlər;
- JSON parse və schema shape testləri;
- internal href route yoxlaması;
- keyboard, mobile və dark-mode smoke;
- mümkün route-larda Lighthouse.

DB/preview və canlı edge mümkün olmadıqda nəticə uydurulmur, blocker kimi saxlanılır.

## 16. Mərhələlər və geri dönüş

### P0

Runtime URL/host siyasəti, metadata builder, ana səhifə, robots, sitemap, faceted canonical/noindex,
closed-listing siyasəti və Cloudflare deployment təlimatı.

### P1

Landing registry və route-lar, metro relation/migration, schema sistemi, breadcrumbs/internal links,
admin audit/form UX, cache/revalidation və analytics.

### P2

E-E-A-T UI hazırlığı, business-data blocker siyahısı, off-page sənəd və 30/60/90 günlük plan,
final ölçmə və acceptance audit.

Kod rollback-u mərhələ üzrə commitlərdən aparılır. Metro migration nullable və geriyə uyğundur;
rollback zamanı əvvəlcə yeni kod köhnə schema ilə uyğun versiyaya qaytarılır, yalnız sonra sütun
silinməsi ayrıca backup və explicit migration ilə edilir. Production data avtomatik silinmir.

## 17. İstifadəçidən tələb olunan məlumatlar

- rəsmi ünvan və dəqiq geo koordinat;
- təsdiqlənmiş iş saatları;
- GSC access və verification token;
- GA4/GTM measurement ID və consent seçimi;
- Google Business Profile access;
- real logo təsdiqi, ofis, komanda və əmlak foto arxivi;
- VÖEN və dərc edilə bilən hüquqi məlumatlar;
- prioritet rayon/metro siyahısı;
- Cloudflare Security Events/WAF access.
