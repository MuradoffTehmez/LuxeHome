# Luxe Home Estate — Editorial Luxury redesign

**Tarix:** 21 avqust 2026  
**Status:** təsdiqlənmiş vizual istiqamət  
**Əhatə:** ictimai saytın təqdimat qatı

## Məqsəd

Luxe Home Estate saytını daha sakit, etibarlı və yüksək səviyyəli daşınmaz əmlak brendi kimi göstərmək. Mövcud funksionallıq, məlumat axını və Azərbaycan dilli məzmun qorunmaqla vizual iyerarxiya, responsiv davranış və komponent keyfiyyəti yaxşılaşdırılacaq.

## Dəyişməyən sahələr

- route və query-param müqavilələri;
- Prisma sxemi, D1 sorğuları və Server Action-lar;
- auth, admin və middleware davranışı;
- mövcud istifadəçi mətnlərinin mənası;
- filterlərin işləmə prinsipi;
- favorit, əlaqə forması və naviqasiya funksionallığı;
- SEO metadata və strukturlaşdırılmış data;
- light/dark theme funksiyası.

## Audit nəticələri

Canlı desktop və tablet auditində aşağıdakı problemlər təsdiqləndi:

1. Header daxilində şaquli loqo həddindən artıq yer tutur və naviqasiyanı sıxır.
2. Hero başlığı, CTA-lar və iri ağ filter paneli eyni anda diqqət tələb edir.
3. Filter paneli tablet ölçüsündə çox hündür və forma-ağır görünür.
4. Ana səhifədə üç bərabər kartlıq grid-lər tez-tez təkrarlanır.
5. Seçilmiş elanların son natamam sırası böyük, məqsədsiz boşluq yaradır.
6. Qızılı rəng düymə, mətn, border və ikonlarda paralel istifadə olunaraq premium vurğunu zəiflədir.
7. Bölmələr eyni başlıq–grid–boşluq formulunu təkrarlayır.
8. Kartlarda border, badge, ikon və metadata sıxlığı şəkillərin təsirini azaldır.
9. Footer link-farm təsiri yaradır və mobil/tablet ekranında uzun görünür.
10. Scroll reveal elementi JavaScript işləmədikdə görünməz saxlaya bilir.

## Seçilmiş vizual istiqamət

### Editorial Luxury

Əsas hiss: memarlıq jurnalı estetikasına yaxın, işıqlı və sakit kompozisiya.

- əsas səth: isti ivory;
- ikinci səth: yumşaq qum/beige;
- əsas mətn: isti qrafit;
- accent: məhdud champagne gold;
- fotoqrafiya: böyük, kəsintisiz və dominant;
- display tipoqrafiya: editorial serif;
- UI tipoqrafiya: neytral sans-serif;
- forma: əsasən kəskin və ya çox kiçik radius;
- kölgə: yalnız real yüksəklik lazım olan yerlərdə;
- hərəkət: qısa, sakit, opacity/transform əsaslı.

Dark mode eyni iyerarxiyanı qorumalı, lakin bütün səhifəni monoton tünd bloklara çevirməməlidir. Tünd səthlər isti charcoal və yumşaq navy ilə məhdudlaşdırılacaq.

## Dizayn prinsipləri

### 1. Bir ekran — bir əsas fokus

Hero-da əsas fokus brend və axtarış niyyətidir. Əlavə CTA-lar vizual olaraq aşağı səviyyəyə endiriləcək. Search panel böyük ağ dashboard əvəzinə hero-nun aşağı kənarına yerləşən yığcam discovery bar olacaq.

### 2. Foto əvvəl, çərçivə sonra

Əmlak və layihə kartlarında foto sahəsi böyüdüləcək. Border və kölgə minimuma endiriləcək. Metadata yalnız qərar vermək üçün lazım olan sahələrlə vizual prioritet alacaq.

### 3. Təkrarlanan grid-ləri sındırmaq

Ana səhifədə seçilmiş elanlar editorial kompozisiyada göstəriləcək:

- ilk elan iri feature kartı;
- sonrakı elanlar daha kompakt supporting kartlar;
- natamam sıra məqsədsiz boşluq yaratmayacaq;
- mobil ekranda bütün kartlar vahid bir sütuna çevriləcək.

### 4. Qızılı rəng yalnız siqnal kimi

Gold aşağıdakı yerlərlə məhdudlaşacaq:

- əsas CTA;
- aktiv naviqasiya işarəsi;
- kiçik overline və seçilmiş məlumat;
- fokus halqası.

Adi body mətni, bütün ikonlar və hər border gold olmayacaq.

### 5. Optik ritm

Bölmələr arasında eyni riyazi padding əvəzinə məzmun sıxlığına uyğun ritm tətbiq ediləcək. Başlıq, description və grid arasındakı məsafələr vahid sistemdən gələcək.

## Komponent dizaynı

### Navbar

- mövcud üfüqi `logo-full` versiyası istifadə ediləcək;
- header hündürlüyü desktopda təxminən 72–80 px saxlanacaq;
- telefon CTA-sı desktopda yüngül text-link formasına salınacaq;
- əsas “Əmlak axtar” CTA-sı gold olaraq qalacaq;
- aktiv link incə xətt və rənglə göstəriləcək;
- scroll zamanı ivory fon, nazik border və yüngül blur istifadə olunacaq;
- tablet ekranında CTA və menyu düyməsi sıxışmadan yerləşəcək;
- mobil drawer daha qısa naviqasiya və ayrıca əlaqə bloku kimi qurulacaq.

### Hero

- hero desktopda geniş editorial split kompozisiyaya çevriləcək;
- şəkil bütün fonu tutsa da mətn üçün nəzarətli kontrast sahəsi yaradılacaq;
- başlıq maksimum iki–üç vizual sətirdə, daha balanslı ölçüdə veriləcək;
- description 55–62 simvol enində məhdudlaşacaq;
- bir əsas CTA və bir sakit text/outline action saxlanacaq;
- axtarış paneli hero-nun aşağı hissəsində ayrıca səviyyə yaradacaq;
- slow zoom zəiflədiləcək və reduced-motion rejimində söndürüləcək.

### Search panel

- desktop hero variantı birinci sətirdə listing type, açar söz və submit; ikinci sətirdə əsas seçimlər kimi qurulacaq;
- form label-ləri daha sakit, control-lar daha az çərçivəli olacaq;
- qiymət sahələri bir vahid interval komponenti kimi görünəcək;
- advanced filter link səviyyəsində qalacaq;
- tablet və mobil ekranlarda filtr sahələri iki sütun və sonra bir sütuna düşəcək;
- page variantının cari query və state davranışı dəyişməyəcək.

### Property card

- iki vizual ölçü dəstəklənəcək: `featured` və `standard`;
- qiymət şəkil üzərində deyil, kontent blokunda daha oxunaqlı veriləcək;
- listing badge kiçik və küncə yaxın olacaq;
- title üçün iki sətirlik sabit vizual sahə ayrılacaq;
- lokasiya və əsas texniki xüsusiyyətlər iyerarxik qruplaşdırılacaq;
- hover zamanı şəkil 1.02–1.03 miqyasında böyüyəcək, kart yuxarı sıçramayacaq;
- bütün kartı əhatə edən link/favorit düymə konflikti qorunacaq və klik davranışı dəyişməyəcək.

### Kateqoriyalar

- mövcud asimmetrik image grid saxlanacaq və daha güclü editorial ölçü nisbətləri alacaq;
- overlay yüngülləşdiriləcək;
- ad və elan sayı aşağı kənarda daha oxunaqlı yerləşəcək;
- boş/az saylı kateqoriyalar kompozisiyanı pozmayacaq.

### Xidmətlər

- səkkiz bərabər tünd hüceyrə görünüşü ləğv ediləcək;
- solda section narrative, sağda nömrələnmiş xidmət siyahısı qurulacaq;
- hər xidmət hover/focus zamanı gold xətt və yön işarəsi alacaq;
- funksional linklər dəyişməyəcək.

### Haqqımızda və üstünlüklər

- foto və mətn arasında yüngül overlap yaradılacaq;
- üstünlüklər altı border-li kart əvəzinə iki sütunlu editorial siyahı olacaq;
- ikonlar dekorativ səth deyil, kiçik naviqasiya markerinə çevriləcək;
- demo statistikalar ayrıca sakit data strip-də göstəriləcək.

### Layihələr və bloq

- layihələr horizontal editorial trio kimi saxlanacaq, lakin şəkil nisbətləri fərqləndiriləcək;
- bloqda ilk yazı feature ölçüdə, digər yazılar kompakt list/card olacaq;
- metadata separator və tip ölçüləri sadələşdiriləcək.

### CTA və footer

- son CTA tam tünd copy-paste section əvəzinə foto və ivory panel kombinasiyası olacaq;
- footer iki əsas səviyyəyə endiriləcək: brend/əlaqə və yığcam naviqasiya/hüquqi linklər;
- əmlak kateqoriyası linkləri mobil ekranda uzun sütun yaratmayacaq;
- hüquqi sahiblik mətni dəyişdirilməyəcək.

## Global token dəyişiklikləri

- ivory və beige tonları daha isti, aralarındakı fərq daha aydın olacaq;
- gold bir qədər daha yumşaq və desaturasiya edilmiş olacaq;
- paper səthi saf ağdan isti ağ tona çəkiləcək;
- kölgələr isti qrafit tonlu olacaq;
- radius pillələri kiçik qalacaq, lakin səth və media üçün fərqlənəcək;
- tipoqrafiya ölçüləri fluid `clamp()` məntiqi ilə tənzimlənəcək;
- section spacing üçün mövcud prop müqaviləsi qorunacaq.

## Responsiv davranış

### Desktop — 1280 px və yuxarı

- tam naviqasiya, telefon linki və əsas CTA;
- asimmetrik property/category/blog grid-ləri;
- hero search bar iki səviyyəli, lakin bir kompozisiya kimi.

### Tablet — 768–1279 px

- kompakt logo, əsas CTA və menu düyməsi;
- hero başlığı 2–3 sətir;
- search panel iki sütun;
- editorial grid-lər iki sütun və ya feature + stack.

### Mobile — 320–767 px

- logo, favorit və menu üçün təmiz header;
- hero-da bir əsas CTA;
- search panel bir sütun, advanced filter yığılmış;
- bütün kartlar bir sütun;
- minimum 44 px toxunma sahəsi;
- horizontal overflow olmamalıdır.

## Accessibility

- WCAG AA kontrastı hər iki temada qorunacaq;
- focus-visible halqaları saxlanacaq və yeni komponentlərə tətbiq ediləcək;
- interaktiv sahələr minimum 44 px olacaq;
- hover məlumatın yeganə mənbəyi olmayacaq;
- semantik heading ardıcıllığı dəyişməyəcək;
- meaningful image alt mətnləri qorunacaq;
- `prefers-reduced-motion` bütün yeni motion davranışlarını söndürəcək;
- reveal elementi hydration və IntersectionObserver olmadıqda məzmunu gizlətməyəcək.

## Texniki əhatə

Əsas dəyişəcək fayllar:

- `src/app/globals.css`;
- `src/app/(site)/page.tsx`;
- `src/components/site/navbar.tsx`;
- `src/components/site/hero.tsx`;
- `src/components/site/search-panel.tsx`;
- `src/components/site/property-card.tsx`;
- `src/components/site/project-card.tsx`;
- `src/components/site/post-card.tsx`;
- `src/components/site/footer.tsx`;
- `src/components/ui/section-header.tsx`;
- `src/components/ui/button.tsx`;
- `src/components/ui/reveal.tsx`;
- lazım olduqda yalnız təqdimat üçün yeni kiçik komponentlər.

Komponent public prop-ları yalnız mövcud istifadəçiləri qırmadan genişləndirilə bilər. Data shape və query select-ləri dəyişdirilməyəcək.

## Yoxlama strategiyası

### Statik keyfiyyət qapıları

- `tsc --noEmit`;
- ESLint;
- mövcud Vitest suite;
- Next.js production build;
- OpenNext build yalnız deploy tələb olunduqda.

### Vizual yoxlama

Ana səhifə və əsas katalog route-ları aşağıdakı viewport-larda yoxlanacaq:

- 1440 × 1000 desktop;
- 1024 × 768 tablet landscape;
- 768 × 1024 tablet portrait;
- 390 × 844 mobile.

Yoxlanacaq hallar:

- hero və sticky header;
- search panel açıq və advanced vəziyyətləri;
- property card grid-i;
- dark/light theme;
- mobile drawer;
- hover, focus və active state-lər;
- uzun Azərbaycan dilli başlıqlar;
- boş və natamam data sıraları;
- horizontal overflow və layout shift.

## Qəbul meyarları

1. Sayt ilk baxışda işıqlı, editorial və premium daşınmaz əmlak brendi kimi görünür.
2. Hero-da axtarış və əsas CTA aydın iyerarxiyaya malikdir.
3. Header desktop, tablet və mobil ekranlarda sıxışmır.
4. Kart və bölmə kompozisiyası təkrarlanan üç-sütun şablonu təsiri yaratmır.
5. Mövcud funksional testlər və production build keçir.
6. Filter URL-ləri, əlaqə forması, favoritlər və naviqasiya əvvəlki kimi işləyir.
7. Light və dark theme-da mətn/interactive kontrastı qorunur.
8. JavaScript gecikdikdə əsas məzmun görünən qalır.
9. Dəyişikliklər yalnız təqdimat qatında qalır.
