# Luxe Home Estate — Responsive Premium Refresh

**Tarix:** 23 avqust 2026

**Status:** istifadəçi tərəfindən təsdiqlənmiş dizayn

**Əhatə:** public sayt, auth, kabinet, admin və bütün ortaq frontend infrastrukturu

**Əvvəlki dizayn:** `docs/superpowers/specs/2026-08-21-editorial-luxury-redesign-design.md`

## 1. Məqsəd

Luxe Home Estate frontend-ini mövcud editorial-luxury brend istiqamətini qoruyaraq peşəkar daşınmaz əmlak platforması səviyyəsinə çatdırmaq. Dəyişiklik yalnız vizual cilalama deyil: bütün route-lar, komponentlər və breakpoint-lər audit ediləcək, root-cause əsaslı düzəldiləcək və mobil interfeys desktop-un daraldılmış forması deyil, touch-first məhsul kimi qurulacaq.

Bu sənəd 21 avqust tarixli public təqdimat qatı dizaynını ləğv etmir. Həmin sənəddəki editorial istiqaməti baza kimi götürür və əhatəni public discovery, property detail, comparison, auth, kabinet, admin, accessibility, performance və tam responsive QA müqaviləsinə qədər genişləndirir.

## 2. Cari vəziyyət və audit sübutları

23 avqust 2026 tarixində cari `main` branch və canlı `https://luxehomeestate.az` əsasında aşağıdakı baza qeydə alınıb:

- 49 `page.tsx`: 21 public, 4 kabinet, 21 admin, 3 staff-auth;
- 42 React komponenti: 21 site, 10 UI, 10 admin və 1 ortaq provider;
- 21 test faylı və 107 keçən test;
- ESLint, TypeScript və production Next.js build təmizdir;
- shared First Load JS 103 kB-dir;
- public məlumat axını Server Component + `src/lib/queries.ts` üzərindədir;
- filter vəziyyətinin mənbəyi URL query parametrləridir;
- light/dark theme CSS token override-ları ilə işləyir.

Canlı auditdə təsdiqlənmiş əsas problemlər:

1. `body { overflow-x: hidden }` bəzi real overflow səbəblərini gizlədir.
2. Header 1024, 1280 və xüsusilə 1536 px keçidlərində action-ları sıxır və bəzi elementləri viewport xaricinə çıxarır.
3. `/emlaklar` mobil filteri inline uzun forma kimi açılır və nəticələri çox aşağı itələyir.
4. `/muqayise` mobil ekranda desktop cədvəli kimi qalır; digər property sütunları vizual istiqamətləndirmə olmadan kənarda gizlənir.
5. Property detail mobil action-ları parçalanmışdır və əsas zəng/WhatsApp əməliyyatları sticky deyil.
6. Tema düyməsi, listing-type düymələri və bir sıra xidmət, əlaqə və footer linkləri 44 px touch target tələbini ödəmir.
7. Footer semantik brend tokenləri əvəzinə ayrıca `zinc` palitrası istifadə edir.
8. Modal focus trap-i var, lakin bütün drawer implementasiyaları eyni əlçatan primitive-dən istifadə etmir.
9. Admin və kabinet mobile shell-ləri mövcuddur, lakin desktop sidebar strukturu hələ mobil məhsul iyerarxiyasını müəyyən edir.
10. Loading state coverage route səviyyəsində natamamdır; bəzi client data səhifələri sabit hündürlüklü placeholder istifadə edir.

İlkin screenshot-lar source koddan kənarda aşağıdakı qovluqda saxlanılıb:

`C:/Users/Tahmaz Muradov/.codex/visualizations/2026/08/23/01a02bf2-58c4-79a3-8d9b-194ec16a0e9a/baseline`

## 3. Seçilmiş yanaşma

Seçilən yanaşma **system-first controlled premium refresh**-dir.

Alternativlərdən imtina səbəbləri:

- Səhifə-səhifə birbaşa patch responsive pattern-ləri təkrarlayacaq və texniki borc yaradacaq.
- Tam ayrı mobile/desktop component ağacları biznes məntiqini təkrarlayacaq və maintenance riskini yüksəldəcək.
- Böyük rewrite mövcud işlək data, auth və admin axınları üçün lazımsız regressiya riski yaradacaq.

İcra əvvəl ortaq responsive infrastrukturu düzəldəcək, sonra eyni primitive-lər public, kabinet və admin səthlərinə mərhələli tətbiq olunacaq.

## 4. Dəyişməyən müqavilələr

- Next.js 15 App Router, React 19 və Tailwind CSS v4 qalır.
- Mövcud route-lar və Azərbaycan dilində URL-lər dəyişmir.
- Query param adları dəyişmir: `elan`, `axtaris`, `tip`, `seher`, `rayon`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `tikili`, `dovr`, `mertebe_min`, `mertebe_max`, `ilk_mertebe_yox`, `son_mertebe_yox`, `sekilli`, `xususiyyet`, `siralama`, `sehife`.
- Filter vəziyyətinin yeganə daimi mənbəyi URL-dir.
- `queries.ts`, `publicPropertyWhere()`, card select-ləri və public content təhlükəsizlik qaydaları qorunur.
- Auth, 2FA, session, middleware, permission və audit log davranışı dəyişmir.
- Prisma schema, D1, R2, API və Server Action-lar yalnız frontend müqaviləsinin tələb etdiyi minimal hallarda dəyişə bilər.
- `siteConfig.owner` və hüquqi sahiblik mətni dəyişmir.
- Dark mode-da `dark:` utility pattern-i yayılmır; semantik token override-ları istifadə olunur.
- Section boşluğu yalnız `spacing` propu ilə idarə olunur.
- İşləməyən və ya fake interaction yaradılmır.

## 5. Vizual istiqamət

### 5.1 Brend

- Editorial serif başlıqlar üçün Playfair Display saxlanılır.
- Body və UI şrifti Geist Sans-a keçirilir; font `next/font` ilə self-host edilir.
- Geist Sans bütün Azərbaycan hərfləri ilə yoxlanılır: `Ə ə Ş ş Ç ç Ğ ğ İ i I ı Ö ö Ü ü`.
- Əsas palitra navy, ivory, warm beige və champagne-gold olaraq qalır.
- Gold yalnız əsas CTA, aktiv vəziyyət, focus, overline və seçilmiş məlumat üçün istifadə olunur.
- Footer daxil olmaqla hardcoded `zinc` səthləri semantik brend tokenlərinə keçirilir.
- Radius kiçik və memarlıq xarakterli qalır; media, panel və control radius-ları eyni olmur.
- Kölgə yalnız real elevation olduqda istifadə olunur və isti qrafit/navy rənginə tint edilir.
- Dekorativ tekstura incə olur; ağır parallax, inertia scroll, spotlight cursor və süni gradient istifadə olunmur.

### 5.2 Typography və spacing

- Display ölçüləri məzmun əsaslı `clamp()` ilə verilir; bütün mətnlər kor-koranə fluid edilmir.
- H1 mobil 320 px-də daşmır və Azərbaycan dilində uzun sözlərlə yoxlanılır.
- Body mətnləri təxminən 60–68 simvol oxu enində saxlanılır.
- Qiymətlər və data `tabular-nums` istifadə edir.
- Container gutter-ları mobile 16–20 px, tablet 24 px, desktop 32–40 px diapazonunda mövcud token sisteminə bağlanır.
- Bölmə boşluqları `Section` pillələri ilə, lokal optik düzəlişlər isə `spacing="none"` ilə idarə olunur.

## 6. Responsive arxitektura

### 6.1 Prinsiplər

- Breakpoint qərarı framework default-u ilə deyil, məzmunun pozulduğu nöqtə ilə əsaslandırılır.
- CSS media və container queries üstün tutulur.
- `window.innerWidth`, render zamanı viewport oxunması və sırf responsive davranış üçün `useEffect` istifadə edilmir.
- Mobile və desktop eyni data və business logic-i paylaşır, təqdimat variantları CSS və kiçik interaction komponentləri ilə ayrılır.
- `overflow-x: hidden` root fix əvəzi deyil. Bütün real overflow səbəbləri tapıldıqdan sonra body səviyyəsindəki maska silinir.
- Fixed/sticky elementlər `dvh`/`svh` və safe-area tokenlərindən istifadə edir.

### 6.2 Məcburi viewport matrisi

Hər əsas səhifə aşağıdakı width-lərdə yoxlanır:

`320, 360, 375, 390, 412, 430, 480, 640, 768, 820, 1024, 1280, 1440, 1536, 1920 px`

Məzmun əsaslı əlavə breakpoint yalnız real pozuntu sübutu olduqda əlavə edilir.

## 7. Ortaq component sistemi

Mövcud UI primitive-ləri saxlanır və aşağıdakı sərhədlərlə genişləndirilir:

### 7.1 Mövcud primitive-lər

- `Container`, `Section`, `SectionHeader`
- `Button`, `ButtonLink`, `ButtonAnchor`, `IconButton`
- `Field`, `Input`, `Select`, `Textarea`, checkbox/radio controls
- `Badge`, `Pagination`, `Modal`, `Toast`, `Reveal`
- `EmptyState`, `ErrorState`, skeleton utilities

### 7.2 Yeni və ya ayrılacaq primitive-lər

- `PageHeader`: overline, title, description, count və optional action.
- `Sheet`: mobile bottom/fullscreen sheet, desktop dialog/side panel variantı.
- `Drawer`: navigation üçün yan panel variantı.
- `ResponsiveToolbar`: search, sort, filter trigger və nəticə sayı.
- `ActiveFilterChips`: URL-dən gələn filterlərin silinə bilən təqdimatı.
- `StickyActionBar`: safe-area dəstəkli əsas mobil əməliyyatlar.
- `ResponsiveGrid`: yalnız həqiqətən təkrarlanan listing/project/post grid contract-ları.
- `AdaptiveDataList`: mobile label/value və desktop table arasında ortaq data təsviri.
- `LoadingShell`: card/list/detail ölçülərinə uyğun skeleton kompozisiyaları.

`Sheet` və `Drawer` mövcud `Modal`-dakı focus trap, Escape, scroll lock və focus-return məntiqini ortaq overlay primitive-ə çıxarır. Hər overlay unikal `aria-labelledby`/`aria-describedby` id-ləri istifadə edir; cari sabit `modal-title` id-si çoxlu modal riski yaratmayacaq.

Mənfi margin, absolute positioning və overlay yalnız kompozisiya və ya real interaction zərurəti olduqda, lokal izahla istifadə olunur. Magic pixel və `!important` qəbul edilmir.

## 8. Global shell

### 8.1 Navbar

Mobil header yalnız aşağıdakıları göstərir:

1. kompakt logo;
2. tema action-u;
3. 44 × 44 px menu trigger.

Mobil menu `Drawer` istifadə edir:

- body scroll lock;
- focus trap;
- Escape ilə bağlanma;
- route dəyişdikdə bağlanma;
- backdrop klik davranışı;
- fokusun trigger-ə qaytarılması;
- `100dvh` və top/bottom safe-area;
- əsas naviqasiya, hesab/favorit və əlaqə action-larının aydın iyerarxiyası.

Desktop header-də elementlər content pressure-a görə mərhələli göstərilir:

- 1280 px-də naviqasiya + yığcam actions;
- telefon və mətnli search CTA yalnız real yer olduqda görünür;
- 1536 px-də label açılması overflow yaratmır;
- header hündürlüyü ilə `--header-h` eyni source-dan gəlir.

### 8.2 Footer

Desktop footer brend/əlaqə, naviqasiya və hüquqi səviyyələri saxlayır. Mobil footer:

1. brend və əsas əlaqə;
2. sosial keçid;
3. native/accessible accordion naviqasiya qrupları;
4. hüquqi keçidlər;
5. müəllif hüququ və sahiblik.

Telefon, ünvan, Instagram və hüquqi məlumat yalnız `siteConfig`-dən gəlir. Footer link-lərinin interaktiv sahəsi minimum 44 px-dir.

## 9. Home və discovery

### 9.1 Hero

- Desktop editorial kompozisiya qorunur.
- Mobil hündürlük content-based olur; desktop min-height mobilə zorla tətbiq edilmir.
- H1, description və əsas CTA ilk ekran daxilində aydın görünür.
- Bir əsas CTA, bir secondary action və yüngül telefon action-u saxlanılır.
- Mobil hero axtarışı listing type, query və submit ilə məhdudlaşır.
- Ətraflı filtrlər `/emlaklar` səhifəsinə keçirilir.
- Background image focal-point crop ilə yoxlanılır.
- LCP hero şəkli priority alır; digər media lazy-load olur.

### 9.2 Property və content kartları

Property card mobile iyerarxiyası:

1. image + status;
2. price + favorite;
3. title;
4. location;
5. maksimum üç əsas spec;
6. bütün karta semantik keçid.

Compare və favorite düymələri kart linkindən ayrıca z-index/focus sahəsi saxlayır. Hover məlumatın yeganə mənbəyi deyil. Uzun title, location və price üçün line clamp yalnız məlumat itkisi yaratmadıqda istifadə olunur; accessible name tam qalır.

Project, agency və post kartları eyni surface/token sistemindən istifadə edir, lakin eyni generic card komponentinə məcburi birləşdirilmir.

### 9.3 Kateqoriyalar və home bölmələri

- Desktop asimmetrik editorial grid qorunur.
- Mobil görünüşdə kateqoriyalar horizontal scroll-snap rail olur; görünən növbəti kart hissəsi əlavə məzmunu aşkar edir.
- 0 nəticəli kateqoriyalar rail-in sonunda daha sakit surface ilə göstərilir və kompozisiyanı dominasiya etmir.
- Xidmətlər, üstünlüklər, layihələr və blog eyni üç-kart şablonuna düşmür.

## 10. `/emlaklar` filter və nəticə axını

Mobil struktur:

1. kompakt `PageHeader` və nəticə sayı;
2. query search;
3. sticky `ResponsiveToolbar` — sort + filter;
4. `ActiveFilterChips`;
5. nəticə kartları;
6. pagination.

Filter trigger `Sheet` açır:

- 320–1023 px-də `100dvh` fullscreen sheet; 1024 px və yuxarıda inline desktop filter;
- header-də title, reset və close;
- əsas filterlər birinci səviyyədə;
- advanced qruplar progressive disclosure;
- form control-ları minimum 48 px;
- footer-də `Nəticələri göstər (N)` sticky CTA;
- CTA `env(safe-area-inset-bottom)` nəzərə alır;
- apply-dan sonra query URL-ə yazılır, `sehife` sıfırlanır və sheet bağlanır;
- close/cancel URL-i dəyişmir;
- reset yalnız filter parametrlərini silir, uyğun sort davranışı ayrıca qorunur.

Desktop-da mövcud geniş filter kompozisiyası saxlanır və sıxlıq təmizlənir. `SearchPanel` monolitinin field/data serialization məntiqi ortaq hissələrə ayrılır; hero və page variantları eyni query müqaviləsini paylaşır.

## 11. Property detail

### 11.1 Mobile content order

1. status və type;
2. price;
3. title;
4. location;
5. action toolbar;
6. gallery;
7. əsas specs;
8. description;
9. features;
10. map/location;
11. contact form;
12. related properties.

### 11.2 Gallery

- Mobile edge-to-edge swipe gallery;
- sabit aspect-ratio və image counter;
- fullscreen `100dvh` viewer;
- swipe + əvvəlki/növbəti keyboard control;
- close fokus return;
- thumbnail rail yalnız məzmun və viewport uyğun olduqda;
- zoom üçün minimum native browser gesture maneəsi yaradılmır.

### 11.3 Actions

Share, favorite və compare vahid toolbar olur. Açıq elanlarda aşağıda iki əsas action göstərilir:

- `Zəng et`;
- `WhatsApp`.

`StickyActionBar` yalnız mobile/tablet-də görünür, safe-area istifadə edir və content üçün uyğun bottom padding təmin edir. Closed/sold/rented property-də conversion CTA status mesajı ilə əvəzlənir.

## 12. Comparison və favorites

Desktop comparison table saxlanır. Mobil müqayisə aşağıdakı modeli istifadə edir:

- yuxarıda müqayisə olunan property selector rail;
- eyni anda iki seçilmiş property;
- aşağıda label + iki value sütunlu vertikal atribut siyahısı;
- fərqli dəyərlərin token əsaslı yumşaq vurğusu;
- property çıxarma action-u minimum 44 px;
- uzun feature siyahıları qruplaşdırılmış disclosure;
- scroll mövqeyində hansı property-lərin müqayisə edildiyi aydın qalır.

Favorites `PropertyCard`-ın eyni responsive variantını istifadə edir. Boş vəziyyət əmlak discovery-yə aparan CTA verir.

Client fetch zamanı sabit inline style placeholder əvəzinə real comparison skeleton göstərilir. Gecikmə zamanı səhifə boş panel kimi görünmür.

## 13. Digər public səhifələr

- Listing səhifələri `PageHeader`, responsive grid və vahid empty/loading/error state istifadə edir.
- Detail səhifələrinin desktop sidebar-ları mobil single-column axına keçir.
- Agency profile mobile iyerarxiyası: logo/image, name, verification, contact, description, stats, properties.
- Blog prose 60–68ch oxu enində, düzgün heading rhythm və responsive media ilə göstərilir.
- Contact link-lərinin bütün səthi interaktiv və minimum 44 px olur.
- FAQ keyboard-accessible progressive disclosure istifadə edir.
- Hüquqi səhifələrdə geri naviqasiya, oxu eni və uzun Azərbaycan mətnləri yoxlanılır.
- Loading route-ları real page kompozisiyasını təqlid edir.

## 14. Auth və kabinet

### 14.1 Login, register və 2FA

- Desktop brend kompozisiyası saxlanır.
- Mobile form-first single-column layout olur.
- Input şrifti minimum 16 px, control hündürlüyü minimum 48 px-dir.
- Password visibility action-u 44 × 44 px-dir.
- Error/hint/label `aria-describedby` və `aria-invalid` ilə bağlanır.
- Submit loading state layout-u dəyişmir.
- Auth redirect, session və security məntiqi dəyişmir.

### 14.2 Cabinet shell

Desktop sidebar qalır. Mobil struktur:

1. account header;
2. cari bölmə və navigation trigger;
3. səhifənin əsas action-u;
4. content.

`CabinetNav` mobil `Drawer`/compact menu variantı alır. Dashboard 1–2 sütunlu priority grid istifadə edir. Listing-lər mobil summary card olur. Profil forması tək sütundur.

Yeni elan forması vizual bölmələrə ayrılır:

- əsas məlumat;
- yerləşmə;
- qiymət və şərtlər;
- xüsusiyyətlər;
- media;
- publish/submit summary.

Mobil uzun form safe-area dəstəkli sticky save action istifadə edir. Server Action, validation schema və permission qaydaları dəyişmir.

## 15. Admin

### 15.1 Shell

- Desktop 264 px sidebar qalır.
- Tablet/mobile sidebar ortaq `Drawer` primitive-i istifadə edir.
- Focus trap, Escape, backdrop, scroll lock və focus-return təmin edilir.
- Cari işləməyən global search control-u fake interaction kimi göstərilmir: funksionallıq qurulana qədər ya real route search-ə bağlanır, ya da UI-dan çıxarılır.
- Header cari bölmə, əsas action və account context-i prioritetləşdirir.

### 15.2 Lists və tables

Hər cədvəl məzmun əsasında bir strategiya seçir:

- desktop full table;
- tablet priority columns + expandable detail;
- mobile summary cards və label/value rows;
- horizontal scroll yalnız müqayisə və sütun münasibətinin vacib olduğu dar hallarda.

Search/filter mobile sheet-ə keçir. Status və primary action birinci səviyyədə qalır. Mobile secondary actions overflow menu-da, tablet/desktop secondary actions isə row və detail daxilində göstərilir. Pagination 44 px target saxlayır.

### 15.3 Forms və media

- Mobile 1 column;
- tablet məzmun əsaslı 2 column;
- desktop yalnız əlaqəli qısa field-lərdə 2–3 column;
- destructive action normal save flow-dan ayrılır;
- confirmation dialog ilkin olaraq təhlükəsiz cancel action-a fokus verir;
- media upload progress, retry, error və primary-image state-ləri göstərir;
- reorder və delete touch-friendly control-larla işləyir.

## 16. Accessibility müqaviləsi

Hədəf WCAG 2.2 AA-dır.

- Semantik `header`, `nav`, `main`, `section`, `article`, `aside`, `footer` və heading ardıcıllığı.
- Mövcud skip-link saxlanır və bütün layout-larda işləyir.
- Bütün interaktiv target-lər minimum 44 × 44 px; form control-ları minimum 48 px.
- Görünən `focus-visible`; theme surface-ə uyğun outline tokeni.
- Hover məlumatın və action-un yeganə mənbəyi deyil.
- Overlay-lərdə focus trap, Escape, initial focus və focus-return.
- Meaningful image alt mətni; dekorativ media `alt=""`.
- Error state yalnız rənglə ifadə olunmur.
- Status dəyişiklikləri uyğun `aria-live`/alert ilə elan olunur.
- `prefers-reduced-motion` bütün yeni motion-u söndürür.
- Light/dark text və non-text contrast token səviyyəsində yoxlanılır.
- Sticky/fixed control-lar safe-area və zoom/reflow davranışını pozmur.

## 17. Error, loading və empty states

- Server səhifə xətası brendli mesaj, təhlükəsiz geri yol və mümkün olduqda retry verir.
- Client fetch xətası mövcud content shell daxilində göstərilir; səhifə boş qalmır.
- Form xətası daxil edilmiş dəyərləri itirmir və ilk xətaya fokus/summary verir.
- Overlay daxilində xəta overlay-i avtomatik bağlamır.
- Skeleton son layout-un aspect ratio, card ölçüsü və content rhythm-ini təqlid edir.
- Empty state səbəbi və növbəti real action-u göstərir.
- Loading, empty və error state-lər də 320 px-də ayrıca yoxlanır.

## 18. Performance müqaviləsi

- Server Component sərhədləri qorunur.
- Responsive UI üçün əlavə breakpoint JS bundle-i yaradılmır.
- `next/image` `sizes` dəyərləri real grid variantları ilə uyğunlaşdırılır.
- Yalnız LCP image priority alır.
- Media container-larında əvvəlcədən məlum aspect ratio CLS-i önləyir.
- Fontlar `next/font` ilə self-host edilir və lazımi weight-lərlə məhdudlaşdırılır.
- Motion yalnız `transform` və `opacity` üzərindədir.
- Third-party animation/UI library əlavə edilmir.
- Hər phase build-dən sonra route bundle-ları 103 kB shared baseline ilə müqayisə edilir; artım source və interaction ehtiyacı ilə əsaslandırılmadıqda qəbul edilmir.
- Hydration error, unnecessary client component və layout shift browser console/visual audit ilə yoxlanır.

## 19. İcra mərhələləri

İş altı ayrıca, test edilə bilən implementation plan-a bölünür. Master məqsəd yalnız bütün altı phase bitəndə tamamlanır.

### Phase 1 — Responsive foundation və global shell

- token, typography, gutter, safe-area və root overflow;
- overlay primitive-ləri;
- header, mobile menu və footer;
- ortaq touch/focus/state fundamenti.

### Phase 2 — Public discovery və conversion

- home/hero/card;
- `/emlaklar` mobile filter sheet və toolbar;
- property detail gallery/action bar;
- comparison və favorites.

### Phase 3 — Digər public səhifələr və states

- projects, agencies, services, blog, contact, FAQ, legal;
- route-level loading, empty və error coverage.

### Phase 4 — Auth və kabinet

- login/register/2FA responsive polish;
- cabinet shell, lists, profile, property submission və media.

### Phase 5 — Admin

- shell, tables/cards, filters, forms, media və dialogs.

### Phase 6 — Polish və tam QA

- animation, accessibility, performance və console audit;
- bütün viewport matrisi;
- regression və əvvəl/sonra screenshot-lar;
- final audit hesabatı.

Hər phase öz planına, test cycle-na və review gate-nə malikdir. Bir phase keçmədən sonrakı phase qəbul edilmiş sayılmır.

## 20. Verification strategiyası

### 20.1 Hər dəyişiklikdən sonra

- əlaqəli Vitest testləri;
- TypeScript;
- ESLint;
- dəyişən səhifələrin mobile/tablet/desktop browser yoxlaması.

### 20.2 Hər phase sonunda

Layihədə qlobal `npm` runtime işləmirsə, eyni skriptlər mövcud bundled Node runtime ilə icra edilir:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Əlavə olaraq:

- console `error` və `warn`;
- hydration error;
- 404 asset/image error;
- horizontal overflow ölçümü;
- keyboard/focus flow;
- modal/drawer/gallery/sticky action interaction;
- long Azərbaycan copy;
- light/dark theme.

### 20.3 Final visual regression

Ən az aşağıdakı səhifələr üçün desktop və mobile əvvəl/sonra screenshot:

- Home;
- Əmlaklar;
- Property detail;
- Agentliklər;
- Müqayisə;
- Login;
- Register;
- Kabinet;
- Admin.

Protected kabinet/admin screenshot-ları təhlükəsiz lokal və ya staging-də seed edilmiş QA fixture hesabı ilə çəkilir; production hesabı istifadə olunmur və production auth qaydaları zəiflədilmir.

## 21. Hər səhifə üçün Definition of Done

Səhifə yalnız aşağıdakılar sübut ediləndə tamamlanır:

- 320, 360, 375, 390, 430, 768, 1024 və 1440 px əsas DoD viewport-larında işləyir;
- tam audit matrisi Phase 6-da 412, 480, 640, 820, 1280, 1536 və 1920 px-i də əhatə edir;
- horizontal overflow yoxdur;
- text clipping və image distortion yoxdur;
- primary CTA rahat və görünəndir;
- keyboard navigation və focus state işləyir;
- loading, empty və error state düzgündür;
- mobile UX ayrıca qərara malikdir;
- desktop regression yoxdur;
- console təmizdir;
- route-a aid mövcud funksiya regression vermir.

## 22. Final hesabat

İş sonunda `LuxeHomeEstate Frontend Audit` hesabatı aşağıdakı bölmələrlə təqdim edilir:

- Executive Summary;
- analiz edilən route-lar;
- Critical/High/Medium/Low problemlər;
- root cause, həll və dəyişən fayllar;
- mobile, tablet və desktop dəyişiklikləri;
- accessibility və performance;
- refaktor edilən/yeni reusable komponentlər;
- silinən texniki borclar;
- test və build nəticələri;
- qalan risklər;
- növbəti addımlar.

## 23. Qəbul meyarları

1. Saytın bütün 49 səhifəsi audit xəritəsində yer alır; auth səbəbilə görünməyən route kod və təhlükəsiz fixture ilə yoxlanır.
2. Mobil public discovery desktop-un daraldılmış forması deyil: filter sheet, sticky toolbar, mobile detail actions və adaptive comparison işləyir.
3. Kabinet və admin desktop sidebar-ı mobilə sıxışdırmır.
4. Header bütün tələb olunan breakpoint-lərdə overflow yaratmır.
5. Body səviyyəsində overflow maskasına ehtiyac qalmır.
6. Touch target, focus, contrast və overlay davranışı WCAG 2.2 AA istiqamətində müqaviləni ödəyir.
7. Mövcud route, query, auth, favorites, comparison, contact, media və CRUD funksiyaları qorunur.
8. Yeni state-lər fake interaction yaratmır və real növbəti addım verir.
9. Shared və route bundle artımı əsaslandırılmamış deyil.
10. Lint, typecheck, 107 mövcud test və əlavə olunan testlər, production build keçir.
11. Final screenshot və audit hesabatı tələbləri yerinə yetirilir.
12. Məqsəd yalnız bütün phase-lər, regression yoxlaması və final audit tamamlandıqdan sonra bitmiş sayılır.
