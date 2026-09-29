# Terminlər lüğəti

Kodda, sənədlərdə və issue-larda işlənən termin və qısaltmalar. Kod identifikatorları ingiliscədir, istifadəçiyə görünən mətn və şərhlər azərbaycancadır — cədvəl ikisini bağlayır.

## Məhsul və domen

| Termin | Kodda | Məna |
|---|---|---|
| Elan | `Property` | Satış və ya kirayə üçün əmlak qeydi |
| Elan növü | `listingType` — `SALE` / `RENT` | Satış və ya kirayə; URL-də `?elan=` |
| Əmlak növü | `PropertyType` | Mənzil, həyət evi, villa, ofis, torpaq… (`?tip=`) |
| Kirayə dövrü | `pricePeriod` — `MONTH` / `DAY` | Aylıq və ya günlük kirayə (`?dovr=`) |
| Tikili növü | `BUILDING_TYPES` — `NEW` / `OLD` | Yeni və ya köhnə tikili (`?tikili=`) |
| Sənəd | `DOCUMENT_STATUSES` | Çıxarış, müqavilə, bələdiyyə sənədi və s. (`?sened=`) |
| Qiymət göstəricisi | `price-benchmark.ts` | Elanın m² qiymətinin yaxın elanların medianı ilə müqayisəsi; ≥5 nümunə, ±10% «bazara uyğun» |
| Sərfəli qiymət | kart nişanı | Median-dan aşağı qiymətli elan |
| Vitrin | `getHomeShowcaseProperties()` | Ana səhifədəki seçilmiş + son elanlar |
| Sahib bloku | `OwnerLeadBanner` | Vitrində 3-dən az elan olanda çıxan mülk sahibi müraciəti bloku |
| Mənzil şahmatı | `ProjectUnit` | Yaşayış kompleksində blok/mərtəbə/nömrə üzrə mənzil cədvəli |
| Açıq qapı günü | `OpenHouse` | Elana bağlı baxış tədbiri; qeydiyyat lead yaradır |
| Premium paket | `ListingPackage`, `PackageOrder` | Elanın önə çıxarılması; ödəniş ofisdə/köçürmə ilə |
| Elan müddəti | `listing-expiry.ts` | Sahib/agentlik elanı 60 gün; «Yenilə» +60 gün |
| Müraciət / lead | `Lead` | Ziyarətçinin əlaqə, baxış və ya satış sorğusu |
| Huni | `/admin/huni` | Baxış → favorit → müraciət konversiyası |
| SLA | `leadSla()` | Müraciətin gecikmə həddi: yeni >24 saat, işdə >3 gün |
| Match Score | `phase3-search.ts` | AI axtarışında elanın sorğu meyarlarına (növ, qiymət, otaq, sahə…) uyğunluq balı və səbəbləri |
| Bilik Mərkəzi | `Knowledge*` modelləri | Hüquqi bələdçi, lüğət və əmlak üzrə FAQ |

## Hesablar və rollar

| Termin | Kodda | Məna |
|---|---|---|
| Əməkdaş | `accountType = STAFF` | Panelə daxil olan şirkət işçisi |
| Rol | `SUPER_ADMIN`, `ADMIN`, `EDITOR` | Əməkdaşın səlahiyyət dəsti (`ROLE_PERMISSIONS`) |
| İcazə | `PERMISSIONS` (25) | `property:manage`, `billing:manage` kimi konkret hüquq |
| İctimai hesab | `USER`, `OWNER`, `AGENT`, `AGENCY`, `CORPORATE` | Saytın qeydiyyatlı istifadəçisi |
| Elan yerləşdirən | `LISTING_ACCOUNT_TYPES` | `USER`-dən başqa ictimai hesablar |
| Kabinet | `/{locale}/kabinet` | İctimai hesabın şəxsi paneli |
| Panel | `/admin` | Əməkdaşın idarə paneli (locale prefiksi yoxdur) |
| `authKind` | `STAFF_2FA` / `PUBLIC` | Sessiyanın növü; panel yalnız `STAFF_2FA` qəbul edir |
| Təsdiq | `approvedAt` | İctimai hesabın biznes təsdiqi (girişdən ayrıdır — `isActive`) |

## Ərazi

| Termin | Kodda | Məna |
|---|---|---|
| Şəhər / rayon | `CITY` | 11 respublika tabeli şəhər və 64 rayon — birinci seçim |
| Şəhər rayonu | `DISTRICT` | Bakının 12, Gəncənin 2 daxili rayonu |
| Qəsəbə | `SETTLEMENT` | Rəsmi qəsəbə və rayon tabeli şəhər |
| Kənd | `VILLAGE` | Rəsmi kənd (Bakıda yoxdur) |
| Massiv | `NEIGHBORHOOD` | Bazarda işlənən ərazi adı — rəsmi vahid deyil |
| Nişangah | `LANDMARK`, `landmarkId` | Ticarət mərkəzi, park, universitet kimi orientir (`?nisangah=`) |
| Rəsmi kod | `officialCode` | DSK / Ünvan Reyestrinin 8 rəqəmli kodu |
| Alias | `searchName` | Eyni yerin alternativ yazılışı («Müşfiqabad» → «Müşviqabad») |
| DSK | — | Dövlət Statistika Komitəsi — «İnzibati Ərazi Bölgüsü Təsnifatı, 2024» |
| Ünvan Reyestri | unvanportali.az | Rəsmi ünvan vahidləri və küçələr |
| Region | `regions.ts` | 14 iqtisadi rayon + Naxçıvan MR (bazada deyil) |

## Texniki

| Termin | Məna |
|---|---|
| D1 | Cloudflare-in SQLite əsaslı verilənlər bazası; transaction yoxdur, sorğuda ≤100 bound parametr |
| R2 | Cloudflare obyekt anbarı: media (`MEDIA`) və ISR keşi |
| Workers / workerd | Cloudflare-in serverless runtime-ı və onun açıq mənbə mühərriki |
| OpenNext | Next.js tətbiqini Workers formatına çevirən adapter |
| Miniflare | Workers/D1/R2-nin lokal emulyatoru (testlərdə) |
| Kənar HTML keşi | `worker.ts`-in anonim ictimai HTML-i 60 s Cache API-də saxlaması |
| ISR | Incremental Static Regeneration — R2-də saxlanan səhifə keşi |
| Vectorize | Cloudflare vektor bazası — semantik axtarış (`PROPERTY_VECTORS`) |
| Workers AI | Cloudflare-in AI modelləri (mətn, vision, `bge-m3` embedding) |
| Turnstile | Cloudflare-in CAPTCHA alternativi — bütün formalarda |
| TOTP | Authenticator tətbiqindəki 30 saniyəlik birdəfəlik kod |
| Passkey / WebAuthn | Cihaza bağlı açarla ikinci mərhələ (TOTP-a alternativ) |
| OIDC / PKCE | Google ilə girişin standart protokolu və onun qoruma mexanizmi |
| Public predicate | `publicPropertyWhere()` — ictimai elan sorğusunun məcburi bazası |
| Server Action | `"use server"` faylındakı `async` funksiya — formaların yazma yolu |
| Guard | `requireAdminAction()`, `requirePublicAction()`, `requireUser()` — hər action-un ilk sətri |
| Demo rejimi | `demo.content_enabled` — `isDemo` qeydlərinin görünürlüyü |
| Sistem rejimi | `NORMAL` / `MAINTENANCE` / `READ_ONLY` |
| Staging | `luxehomeestate-staging` — ayrı resurslarla sınaq mühiti |
| Lokal stack | `:8787`-də workerd + real D1/R2 — PR-da E2E üçün |
| Keyfiyyət qapısı | test + typecheck + lint + dead-code + build |
| Knip | İstifadə olunmayan fayl və asılılıqları tapan alət (`npm run dead-code`) |
| msg() markeri | Bazada saxlanan tərcümə açarı; `translateServerMessage()` ilə göstərilir |

## URL parametrləri

| Parametr | Məna |
|---|---|
| `elan`, `tip`, `seher`, `rayon`, `metro`, `nisangah` | Elan növü, əmlak növü, şəhər, rayon/qəsəbə/kənd/massiv, metro, nişangah |
| `min`, `max`, `sahe_min`, `sahe_max`, `otaq` | Qiymət, sahə, otaq |
| `temir`, `sened`, `tikili`, `dovr`, `xususiyyet` | Təmir, sənəd, tikili, kirayə dövrü, xüsusiyyət |
| `axtaris`, `sahe`, `gorunus`, `siralama`, `sehife` | Mətn, xəritə poliqonu, görünüş, sıralama, səhifə |
| `davam` | Girişdən sonra qayıdılacaq `/admin` ünvanı |
