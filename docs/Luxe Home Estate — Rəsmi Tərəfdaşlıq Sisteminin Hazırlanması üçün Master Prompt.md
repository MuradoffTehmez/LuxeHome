# Luxe Home Estate — Rəsmi Tərəfdaşlıq Sisteminin Hazırlanması

Mövcud **Luxe Home Estate** layihəsini analiz et və sayta professional, genişlənə bilən və production səviyyəli **Rəsmi Tərəfdaşlıq Sistemi (Partners System)** əlavə et.

Əsas sayt:

**https://luxehomeestate.az/az**

İlk rəsmi tərəfdaş:

**TREVA Real Estate**  
**https://treva.realestate/az**

Bu dəyişiklik sadəcə ana səhifəyə TREVA logosunun yerləşdirilməsi olmamalıdır. Məqsəd gələcəkdə onlarla və yüzlərlə tərəfdaşın, brokerin, developer şirkətinin, agentliyin və digər biznes tərəfdaşlarının idarə edilə biləcəyi tam B2B tərəfdaşlıq infrastrukturu yaratmaqdır.

Mövcud saytın vizual identikliyini, premium görünüşünü, rəng palitrasını, typography sistemini, komponent strukturunu və ümumi UX yanaşmasını qoruyaraq sistemi inkişaf etdir.

---

# 1. Əsas məqsəd

Luxe Home Estate daxilində aşağıdakı imkanları yaradan tam tərəfdaşlıq sistemi qur:

- rəsmi tərəfdaşların idarə olunması;
- tərəfdaşların public profil səhifələri;
- ana səhifədə seçilmiş tərəfdaşların nümayişi;
- tərəfdaşların elanlarla əlaqələndirilməsi;
- tərəfdaşların yaşayış kompleksləri ilə əlaqələndirilməsi;
- tərəfdaşların agentlərlə əlaqələndirilməsi;
- tərəfdaşlıq statuslarının idarə olunması;
- admin paneldən tam CRUD;
- tərəfdaşlıq tarixçəsi;
- SEO;
- çoxdillilik;
- audit trail;
- gələcəkdə API və avtomatlaşdırma üçün uyğun struktur.

Sistem hardcoded olmamalıdır.

TREVA-nı frontend komponentinə birbaşa yazmaq əvəzinə bütün məlumatlar database və admin panel vasitəsilə idarə edilməlidir.

---

# 2. Mövcud layihəni əvvəlcə analiz et

Kod yazmağa başlamazdan əvvəl:

1. layihənin framework və texnologiyalarını müəyyən et;
2. mövcud folder strukturunu analiz et;
3. database və ORM strukturunu yoxla;
4. mövcud admin paneli analiz et;
5. i18n sistemini analiz et;
6. mövcud `Property`, `Listing`, `Agency`, `Agent`, `Project`, `ResidentialComplex` və digər uyğun modelləri müəyyən et;
7. UI komponent sistemini analiz et;
8. mövcud SEO metadata sistemini analiz et;
9. light/dark theme mövcuddursa onunla inteqrasiyanı yoxla;
10. mövcud authentication və RBAC sistemini analiz et.

Mövcud funksionallığı pozmadan implementasiya et.

Lazımsız refactor etmə.

---

# 3. Yeni əsas modul

Yeni modul yaradılmalıdır:

```text
Partners
```

Terminologiya:

Azərbaycan:

```text
Tərəfdaşlar
Rəsmi tərəfdaş
Tərəfdaşlıq
```

İngilis:

```text
Partners
Official Partner
Partnership
```

Rus:

```text
Партнёры
Официальный партнёр
Партнёрство
```

Bütün mətnlər i18n sistemindən gəlməlidir.

Hardcoded UI mətnlərindən istifadə etmə.

---

# 4. Partner database modeli

Production səviyyəli `Partner` modeli yarat.

Minimum sahələr:

```text
id

name
slug
legal_name

short_description
description

website_url

email
phone
whatsapp

logo
logo_light
logo_dark
cover_image

country
city
address

partnership_type

status

verified
official_partner
featured
show_publicly
show_on_homepage

official_since
partnership_end_date

sort_order

seo_title
seo_description
seo_keywords

created_at
updated_at

created_by
updated_by
```

Mümkün olduqda UUID istifadə et.

---

# 5. Partnership Type

Enum və ya taxonomy sistemi qur:

```text
BROKER
REAL_ESTATE_AGENCY
DEVELOPER
CONSTRUCTION_COMPANY
INVESTMENT
BANK
MORTGAGE
INSURANCE
TECHNOLOGY
MEDIA
MARKETING
SERVICE_PROVIDER
STRATEGIC_PARTNER
OTHER
```

Frontend-də bunlar istifadəçi üçün lokalizə edilmiş formada göstərilsin.

Məsələn:

```text
BROKER → Broker
DEVELOPER → Developer
STRATEGIC_PARTNER → Strateji tərəfdaş
```

---

# 6. Partner Status

Status sistemi qur:

```text
DRAFT
PENDING
ACTIVE
SUSPENDED
EXPIRED
TERMINATED
ARCHIVED
```

Public tərəfdə yalnız uyğun şərtlərə cavab verən tərəfdaşlar göstərilsin.

Məsələn:

```text
status = ACTIVE
show_publicly = true
```

olmadan public profil görünməsin.

---

# 7. “Rəsmi tərəfdaş” təhlükəsizlik qaydası

Sayt aşağıdakı şərtlər olmadan heç vaxt:

```text
Rəsmi tərəfdaş
Official Partner
```

badge-i göstərməməlidir:

```text
status = ACTIVE
official_partner = true
verified = true
show_publicly = true
```

Əlavə olaraq:

```text
partnership_end_date
```

mövcuddursa və tarix keçibsə sistem avtomatik olaraq public `Official Partner` badge-ni göstərməməlidir.

Status avtomatik `EXPIRED` edilə bilər.

---

# 8. İlk tərəfdaş — TREVA

İlk tərəfdaş kimi aşağıdakı şirkətin əlavə edilməsi üçün seed/admin data hazırlansın:

```text
Name:
TREVA

Website:
https://treva.realestate/az

Slug:
treva

Status:
ACTIVE

Verified:
true

Official Partner:
true

Featured:
true

Show Publicly:
true

Show on Homepage:
true
```

TREVA haqqında məlumat uydurma.

Məlumat mövcud deyilsə boş saxla və admin paneldən əlavə edilməsinə imkan ver.

TREVA-nın hüquqi adı, əməkdaşlıq tarixi, müqavilə nömrəsi və digər hüquqi məlumatları təxmin etmə.

---

# 9. Ana səhifədə premium tərəfdaşlıq bölməsi

Ana səhifədə yeni premium section yarat:

```text
Rəsmi tərəfdaşlarımız
```

Hazırda yalnız TREVA olduğu üçün carousel yaratma.

Bir premium featured partnership komponenti göstər.

Vizual konsept:

```text
──────────────────────────────────────────

         STRATEGIC PARTNERSHIP

 LUXE HOME ESTATE      ×       TREVA

             ✓ Rəsmi tərəfdaş

 Daşınmaz əmlak sektorunda daha geniş
 imkanlar və peşəkar xidmətlər yaratmaq
 üçün strateji əməkdaşlıq.

        [ Əməkdaşlıq haqqında → ]

──────────────────────────────────────────
```

Dizayn minimal, premium və corporate olmalıdır.

Həddindən artıq gradient, glow və animasiya istifadə etmə.

---

# 10. Logo qaydaları

Luxe Home Estate və TREVA loqolarını:

- deformasiyaya uğratma;
- crop etmə;
- aspect ratio dəyişmə;
- rənglərini özbaşına dəyişmə;
- yeni versiya yaratma.

Hər iki logo vizual olaraq balanslı görünməlidir.

Bir logo digərindən həddindən artıq böyük olmamalıdır.

Dark theme varsa uyğun logo variantından istifadə et.

---

# 11. Homepage komponentinin responsivliyi

Desktop:

```text
Luxe Home Estate Logo    ×    TREVA Logo
```

Tablet:

eyni struktur kompaktlaşdırılsın.

Mobile:

```text
Luxe Home Estate
       ×
TREVA
```

şəklində vertikal və premium görünüş yaradıla bilər.

Desktop dizaynını sadəcə sıxışdırıb mobile göstərmə.

Mobile üçün ayrıca responsive composition hazırla.

---

# 12. Tərəfdaşlar səhifəsi

Yeni səhifə yarat:

```text
/az/terefdaslar
/en/partners
/ru/partners
```

Layihənin mövcud routing/i18n standartına uyğun URL strukturu istifadə et.

Səhifə strukturu:

```text
Hero
↓
Intro
↓
Featured Partners
↓
All Partners
↓
Partner Categories / Filters
↓
CTA
```

---

# 13. Partners Hero

Başlıq:

```text
Tərəfdaşlarımız
```

Subheadline məntiqi:

```text
Etibarlı tərəfdaşlarla birlikdə daşınmaz əmlak
sahəsində daha geniş imkanlar yaradırıq.
```

Mətn translation fayllarından idarə edilsin.

---

# 14. Partner grid

Bir neçə tərəfdaş olduqda responsive grid:

Desktop:

```text
3 və ya 4 column
```

Tablet:

```text
2 column
```

Mobile:

```text
1 column
```

Partner kartında:

- logo;
- şirkət adı;
- partnership type;
- verified badge;
- official partner badge;
- short description;
- ölkə/şəhər;
- “Ətraflı”;
- xarici website linki.

---

# 15. Filter sistemi

Gələcək üçün filter sistemi hazırla:

```text
Hamısı
Brokerlər
Agentliklər
Developerlər
Strateji tərəfdaşlar
Texnologiya
Maliyyə
Digər
```

Filter URL/query-state ilə işləyə bilər:

```text
/partners?type=developer
```

Filter refresh olmadan işləməlidir.

---

# 16. Partner detail səhifəsi

Dynamic route yarat:

```text
/az/terefdaslar/[slug]
```

TREVA:

```text
/az/terefdaslar/treva
```

Səhifə strukturu:

```text
Breadcrumb
↓
Partner Hero
↓
Partner məlumatları
↓
Əməkdaşlıq haqqında
↓
Əməkdaşlıq istiqamətləri
↓
Əlaqəli yaşayış kompleksləri
↓
Əlaqəli elanlar
↓
Əlaqəli agentlər
↓
External Website CTA
```

---

# 17. Partner Hero

Göstər:

- logo;
- şirkət adı;
- verified badge;
- official partner badge;
- partnership type;
- city/country;
- website;
- official_since.

Əgər məlumat yoxdursa boş element göstərmə.

---

# 18. Partner description

İki səviyyə:

```text
short_description
description
```

`description` rich text ola bilər.

XSS qorunması təmin et.

---

# 19. Listing ↔ Partner əlaqəsi

Sadə:

```text
listing.partner_id
```

modelindən istifadə etmə.

Many-to-many relationship yarat.

Məsələn:

```text
ListingPartner
```

sahələri:

```text
id

listing_id
partner_id

role

source_url

is_public
is_primary

created_at
updated_at
```

---

# 20. Listing Partner Role

Enum:

```text
SOURCE
BROKER
CO_BROKER
DEVELOPER
EXCLUSIVE_SALES
SALES_PARTNER
MARKETING_PARTNER
MANAGEMENT_PARTNER
OTHER
```

Bu struktur gələcəkdə bir əmlakın bir neçə şirkətlə əlaqələndirilməsinə imkan verməlidir.

Məsələn:

```text
Developer → Company A
Sales Partner → TREVA
Agency → Luxe Home Estate
```

---

# 21. Elan səhifəsində tərəfdaşın göstərilməsi

Əgər elan public partner ilə əlaqəlidirsə, property detail səhifəsində ayrıca blok göstər:

```text
Tərəfdaş

[TREVA logo]

TREVA
✓ Rəsmi tərəfdaş

Satış tərəfdaşı

[ Tərəfdaş haqqında ]
```

Partnerin rolunu da göstər:

```text
Broker
Developer
Sales Partner
Exclusive Sales Partner
```

---

# 22. Project ↔ Partner əlaqəsi

Yaşayış kompleksləri üçün ayrıca relation yarat:

```text
ProjectPartner
```

və ya mövcud relation sistemindən istifadə et.

Sahələr:

```text
project_id
partner_id
role
is_primary
is_public
```

---

# 23. Agent ↔ Partner əlaqəsi

Əgər gələcəkdə ehtiyac varsa:

```text
AgentPartner
```

strukturu dəstəklə.

Bir agent:

- agentlik;
- developer;
- tərəfdaş broker;

ilə əlaqələndirilə bilər.

---

# 24. Admin panel — Tərəfdaşlar

Admin panelə yeni əsas bölmə əlavə et:

```text
Tərəfdaşlar
```

Sub-navigation:

```text
Bütün tərəfdaşlar
Aktiv
Gözləyən
Müddəti bitmiş
Arxiv
Yeni tərəfdaş
```

---

# 25. Admin partner list

Cədvəldə göstər:

```text
Logo

Ad

Tip

Status

Verified

Official

Featured

Homepage

Başlama tarixi

Bitmə tarixi

Elan sayı

Layihə sayı

Son yenilənmə

Actions
```

---

# 26. Admin filter

Filterlər:

```text
Status
Partnership Type
Verified
Official
Featured
Homepage
Country
Created Date
```

Search:

```text
name
legal_name
website
email
```

---

# 27. Admin Partner Create/Edit

Form bölmələrə ayrılsın.

## Əsas məlumatlar

```text
Name
Legal Name
Slug
Partnership Type
```

## Media

```text
Logo
Light Logo
Dark Logo
Cover Image
```

## Əlaqə

```text
Website
Email
Phone
WhatsApp
Address
Country
City
```

## Partnership

```text
Status

Verified

Official Partner

Featured

Show Publicly

Show on Homepage

Official Since

Partnership End Date

Sort Order
```

## Description

```text
Short Description
Description
```

## SEO

```text
SEO Title
SEO Description
SEO Keywords
```

---

# 28. Contract metadata

Gələcəkdə daxili istifadə üçün aşağıdakı sahələri də nəzərdə tut:

```text
contract_number

contract_start_date

contract_end_date

contract_document

internal_notes
```

Bu məlumatlar public API və frontend-də göstərilməməlidir.

Yalnız uyğun admin icazəsi olan istifadəçilər görə bilməlidir.

---

# 29. RBAC

Tərəfdaşlıq modulunda permission sistemi tətbiq et.

Məsələn:

```text
partner.view

partner.create

partner.update

partner.delete

partner.verify

partner.publish

partner.manage_contract

partner.manage_relationships
```

Super Admin bütün icazələrə sahibdir.

Adi adminə contract metadata avtomatik göstərilməsin.

---

# 30. Audit Trail

Partner dəyişikliklərini audit et.

Saxla:

```text
user
action
partner_id
old_value
new_value
timestamp
ip_address
```

Minimum olaraq:

```text
CREATE
UPDATE
DELETE
VERIFY
PUBLISH
UNPUBLISH
STATUS_CHANGE
```

---

# 31. Soft delete

Tərəfdaşlar üçün mümkün olduqda hard delete istifadə etmə.

Soft delete:

```text
deleted_at
deleted_by
```

və ya mövcud layihə standartından istifadə et.

Əlaqəli elanlara görə database integrity pozulmamalıdır.

---

# 32. Partnership expiration

`partnership_end_date` mövcuddursa sistem bunu nəzərə almalıdır.

Müddət bitdikdə:

- Official badge gizlənə bilər;
- homepage-dən çıxarıla bilər;
- status `EXPIRED` edilə bilər;
- admin paneldə xəbərdarlıq göstərilə bilər.

Bu proses cron/scheduled task vasitəsilə avtomatlaşdırıla biləcək formada dizayn edilməlidir.

---

# 33. Homepage seçim sistemi

Bütün aktiv tərəfdaşlar homepage-də görünməməlidir.

Admin:

```text
show_on_homepage
featured
sort_order
```

ilə idarə edə bilsin.

Məsələn gələcəkdə:

```text
TREVA
Partner B
Partner C
```

sırası admin tərəfindən dəyişdirilə bilsin.

---

# 34. Tək tərəfdaş və çox tərəfdaş davranışı

Əgər yalnız 1 featured partner varsa:

premium collaboration showcase göstər.

Əgər 2–4 partner varsa:

grid və ya balanced cards istifadə et.

Əgər 5+ partner varsa:

responsive logo grid və ya professional carousel nəzərdən keçirilə bilər.

Amma carousel avtomatik olaraq default həll olmasın.

---

# 35. Header

Hazırda yalnız bir tərəfdaş olduğuna görə əsas navigation-a məcburi `Tərəfdaşlar` linki əlavə etmə.

Əgər mövcud UX uyğun gəlirsə linki:

```text
Footer → Şirkət → Tərəfdaşlarımız
```

altında yerləşdir.

Gələcəkdə:

```text
Şirkət
├── Haqqımızda
├── Komandamız
├── Tərəfdaşlarımız
├── Karyera
└── Əlaqə
```

strukturuna uyğunlaşdırıla biləcək şəkildə hazırla.

---

# 36. Footer

Footer-a:

```text
Tərəfdaşlarımız
```

linki əlavə et.

Mövcud footer dizaynını pozma.

---

# 37. External links

TREVA website linki yeni tab-da açılsın:

```text
target="_blank"
```

və təhlükəsizlik üçün:

```text
rel="noopener noreferrer"
```

istifadə et.

External-link icon göstər.

---

# 38. SEO

Partners landing page üçün metadata yarat.

Azərbaycan nümunəsi:

```text
Title:
Rəsmi Tərəfdaşlarımız | Luxe Home Estate
```

Description dinamik və optimallaşdırılmış olsun.

Partner detail:

```text
TREVA — Rəsmi Tərəfdaş | Luxe Home Estate
```

Canonical URL əlavə et.

---

# 39. Structured Data

Uyğun olduğu hallarda Schema.org structured data əlavə et.

Partner şirkət səhifələrində:

```text
Organization
```

istifadə edilə bilər.

Məlumat mövcuddursa:

```text
name
url
logo
address
sameAs
```

daxil et.

Məlumat uydurma.

---

# 40. Breadcrumb structured data

Partner detail:

```text
Ana səhifə
>
Tərəfdaşlarımız
>
TREVA
```

Breadcrumb həm UI, həm schema səviyyəsində düzgün qurulsun.

---

# 41. Sitemap

Public partner səhifələri sitemap-a avtomatik daxil edilsin.

Yalnız:

```text
ACTIVE
show_publicly = true
```

olan tərəfdaşlar sitemap-a daxil edilsin.

---

# 42. robots/indexing

Draft, suspended və private partner səhifələri index edilməməlidir.

Public olmayan partner route-ları:

```text
404
```

və ya layihənin təhlükəsizlik strategiyasına uyğun davranmalıdır.

---

# 43. Open Graph

Partner detail səhifələrində:

```text
og:title
og:description
og:image
og:url
```

dinamik qurulsun.

Partner cover yoxdursa düzgün fallback istifadə et.

---

# 44. i18n

Bütün yeni mətnlər mövcud i18n sisteminə inteqrasiya edilsin.

Ən azı:

```text
az
en
ru
```

dəstəklə.

Əgər layihədə başqa dillər varsa onları pozma.

Partner description üçün də multilingual data strukturu nəzərə alınmalıdır.

Mövcud project convention-a uyğun:

```text
name_az
name_en
name_ru
```

və ya translation table / JSON istifadə edilə bilər.

Mövcud sistem necə qurulubsa ona uyğun həll et.

---

# 45. Accessibility

Bütün logolarda düzgün:

```text
alt
```

istifadə et.

Məsələn:

```text
TREVA Real Estate
```

Keyboard navigation işləsin.

Focus states saxlanılsın.

Contrast WCAG prinsiplərinə mümkün qədər uyğun olsun.

---

# 46. Image optimization

Partner logoları optimize et.

Mövcud layihənin image pipeline-dan istifadə et.

Aspect ratio qorunsun.

Lazy loading yalnız viewport-dan kənardakı şəkillər üçün tətbiq olunsun.

Above-the-fold əsas logo lazımsız gecikməsin.

---

# 47. Performance

Yeni tərəfdaşlıq sistemi:

- homepage LCP-ni ciddi artırmamalıdır;
- lazımsız JS əlavə etməməlidir;
- partner list server-side pagination dəstəkləməlidir;
- database query-lərdə N+1 yaranmamalıdır;
- lazımi indexlər əlavə edilməlidir.

Index nümunələri:

```text
slug
status
partnership_type
featured
show_publicly
show_on_homepage
official_since
```

---

# 48. API strukturu

Layihə API istifadə edirsə və ya gələcəkdə istifadə edəcəksə aşağıdakı struktura uyğun hazırla:

```text
GET /api/partners
GET /api/partners/:slug
```

Admin:

```text
POST   /api/admin/partners
PATCH  /api/admin/partners/:id
DELETE /api/admin/partners/:id
```

RBAC və validation tətbiq et.

---

# 49. Validation

Ən azı:

```text
name required

slug unique

website valid URL

email valid email

official_since valid date

partnership_end_date >= official_since

sort_order numeric
```

Logo üçün file type və ölçü validation tətbiq et.

---

# 50. Duplicate prevention

Eyni tərəfdaşın təsadüfən bir neçə dəfə əlavə olunmasının qarşısını almaq üçün:

```text
slug
website/domain
legal_name
```

üzərindən uyğun validation və admin warning tətbiq et.

---

# 51. Security

Partner descriptions və rich-text content sanitize edilməlidir.

File upload:

- MIME validation;
- extension validation;
- maksimum ölçü;
- təhlükəsiz filename;
- server-side validation.

External URL injection və XSS risklərini nəzərə al.

---

# 52. Loading states

Partners page, detail page və admin səhifələrində layihənin mövcud UX sisteminə uyğun:

```text
Skeleton
Loading
Empty
Error
```

state-lər yarat.

---

# 53. Empty state

Heç bir public tərəfdaş yoxdursa səhifə qırılmamalıdır.

Professional empty-state göstər:

```text
Hazırda nümayiş etdirilən tərəfdaş yoxdur.
```

Amma admin panel işlək qalmalıdır.

---

# 54. Error handling

Əgər partner slug mövcud deyilsə düzgün 404 göstər.

Backend error zamanı raw stack trace frontend-də göstərilməsin.

---

# 55. Analytics

Mövcud analytics sisteminə uyğun eventlər əlavə et.

Məsələn:

```text
partner_card_click

partner_profile_view

partner_external_website_click

partner_listing_click
```

Event data:

```text
partner_id
partner_name
partner_type
page_location
```

Şəxsi məlumat göndərmə.

---

# 56. TREVA external click tracking

TREVA saytına keçidlər ayrıca analytics event göndərə bilsin:

```text
partner_external_website_click
```

Bu gələcəkdə tərəfdaşlıqların nəticəsini ölçmək üçün lazımdır.

---

# 57. Future B2B analytics

Data model gələcəkdə aşağıdakı göstəriciləri hesablamağa uyğun olsun:

```text
Partner profile views
Partner listing views
Partner leads
External website clicks
Partner listing count
Partner active projects
Conversion rate
```

Hazırda tam dashboard tələb olunmur, amma architecture maneə yaratmamalıdır.

---

# 58. Partner lead attribution

Əgər saytın contact/lead sistemi mövcuddursa gələcək üçün:

```text
partner_id
listing_id
project_id
source
```

atributları ilə lead attribution dəstəklə.

Beləliklə Luxe Home Estate sonradan TREVA ilə bağlı neçə lead gəldiyini ölçə bilsin.

---

# 59. Legal transparency

Partner səhifəsində lazım gəldikdə disclaimer üçün struktur saxla:

```text
disclaimer
```

Məsələn gələcəkdə:

```text
Bu səhifədə təqdim edilən məlumat tərəfdaş tərəfindən təmin edilmişdir.
```

Lakin hüquqi mətnləri özbaşına yaratma.

Admin tərəfindən idarə edilə bilən olsun.

---

# 60. Partnership dates

Public tərəfdə:

```text
2026-cı ildən rəsmi tərəfdaş
```

kimi məlumat yalnız real `official_since` mövcud olduqda göstərilsin.

Tarix təxmin edilməsin.

---

# 61. Design direction

Vizual istiqamət:

- luxury real estate;
- premium;
- minimal;
- corporate;
- trustworthy;
- modern;
- spacious;
- editorial;
- professional.

Qaçın:

- həddindən artıq neon;
- böyük glow;
- ucuz gradientlər;
- həddindən artıq glassmorphism;
- lazımsız animation;
- casino tipli premium estetika;
- çox rəngli badge-lər.

---

# 62. Animations

Mövcud saytda animasiya sistemi varsa ona uyğun istifadə et.

Məsələn:

```text
fade-in
subtle translate
logo reveal
hover elevation
```

Animasiya:

```text
150–400ms
```

aralığında incə və premium olsun.

`prefers-reduced-motion` dəstəklə.

---

# 63. Responsive testing

Test et:

```text
320px
360px
375px
390px
430px

768px
820px

1024px
1280px
1440px
1920px
```

Horizontal overflow olmamalıdır.

---

# 64. Theme

Əgər Luxe Home Estate-də light/dark theme varsa:

- partner section;
- cards;
- badges;
- logos;
- border;
- hover states;

hər iki theme-də düzgün görünməlidir.

---

# 65. Component architecture

Reusable componentlər yarat.

Məsələn:

```text
PartnerLogo
PartnerBadge
PartnerCard
PartnerGrid
PartnerHero
PartnerSection
PartnerExternalLink
PartnerRelations
FeaturedPartnership
```

Eyni UI-ni müxtəlif səhifələrdə copy-paste etmə.

---

# 66. Backend service architecture

Business logic controller daxilində qarışıq olmamalıdır.

Layihənin arxitekturasına uyğun:

```text
PartnerService
PartnerRepository
PartnerValidator
PartnerMapper
```

və ya mövcud service pattern-dan istifadə et.

---

# 67. Migration

Database migration yarat.

Migration:

- backward-compatible olsun;
- mövcud datanı silməsin;
- production deploy zamanı təhlükəsiz işləsin.

Əgər layihədə migration naming convention varsa onu saxla.

---

# 68. Seed data

TREVA üçün seed yalnız təhlükəsiz məlum məlumatlarla yaradıla bilər.

Məsələn:

```text
name = "TREVA"
slug = "treva"
website_url = "https://treva.realestate/az"
```

Unknown məlumatları seed etmə.

---

# 69. Tests

Minimum testlər:

### Unit

```text
Partner status validation

Official Partner validation

Expiration logic

Slug generation

Partner permissions
```

### Integration

```text
Create partner

Update partner

Publish partner

Get public partner

Expired partner behavior

Listing ↔ Partner relation
```

### UI

```text
Partner list

Partner detail

Homepage featured partner

Mobile rendering
```

---

# 70. Acceptance criteria

İş aşağıdakı hallarda tamamlanmış hesab edilə bilər:

- TREVA admin panel vasitəsilə idarə olunur;
- TREVA hardcoded deyil;
- ana səhifədə premium şəkildə göstərilir;
- `/terefdaslar` səhifəsi işləyir;
- `/terefdaslar/treva` işləyir;
- partner CRUD işləyir;
- status sistemi işləyir;
- Official Partner validation işləyir;
- elan ↔ partner əlaqəsi işləyir;
- project ↔ partner architecture mövcuddur;
- responsive dizayn düzgündür;
- i18n işləyir;
- SEO metadata işləyir;
- sitemap inteqrasiyası işləyir;
- dark/light theme pozulmur;
- mövcud sayt funksiyaları pozulmur;
- console error yoxdur;
- TypeScript/build error yoxdur;
- migration problems yoxdur;
- production build uğurla tamamlanır.

---

# 71. Kod keyfiyyəti

Strict typing istifadə et.

`any` istifadəsini minimuma endir.

Duplicate code yaratma.

Dead code saxlamama.

Magic string əvəzinə enum/constants istifadə et.

Mövcud lint/formatter qaydalarını pozma.

---

# 72. Ən vacib tələb

Bu tapşırığı sadəcə:

> “TREVA logosunu ana səhifəyə əlavə et”

kimi interpretasiya etmə.

TREVA **ilk rəsmi tərəfdaşdır**, buna görə arxitekturanı gələcək tərəfdaşlar üçün reusable və scalable qur.

Məqsəd:

```text
Luxe Home Estate
        ↓
Partners Platform
        ↓
Brokerlər
Agentliklər
Developerlər
Strateji tərəfdaşlar
Texnologiya şirkətləri
Maliyyə tərəfdaşları
        ↓
Listings / Projects / Agents / Leads
```

əlaqə modelinə doğru inkişaf edə biləcək foundation yaratmaqdır.

---

# 73. Mövcud dizaynı qoruma qaydası

Mövcud Luxe Home Estate dizaynını tam yenidən yaratma.

Yeni tərəfdaşlıq sistemi:

- mövcud header;
- footer;
- typography;
- container widths;
- buttons;
- cards;
- spacing;
- border radius;
- color tokens;
- shadows;
- animations;

ilə eyni design system daxilində görünməlidir.

Yeni section sayta sonradan əlavə edilmiş yad modul təsiri yaratmamalıdır.

---

# 74. İcra ardıcıllığı

Tapşırığı aşağıdakı mərhələlərlə icra et:

### Phase 1 — Audit

Mövcud project architecture və əlaqəli modelləri analiz et.

### Phase 2 — Architecture

Partner domain model və relations planını qur.

### Phase 3 — Database

Migration və modelləri yarat.

### Phase 4 — Backend

CRUD, validation, RBAC və business logic.

### Phase 5 — Admin

Partner management UI.

### Phase 6 — Public Pages

Partners list və partner detail.

### Phase 7 — Homepage

TREVA × Luxe Home Estate partnership section.

### Phase 8 — Relations

Listings / Projects / Agents integration.

### Phase 9 — SEO & i18n

Metadata, schema, sitemap və translations.

### Phase 10 — QA

Responsive, build, lint, tests və regression testing.

---

# 75. İş bitdikdən sonra hesabat

Implementasiyanı tamamladıqdan sonra qısa texniki hesabat təqdim et:

```text
1. Hansı fayllar yaradıldı
2. Hansı fayllar dəyişdirildi
3. Hansı database migration yaradıldı
4. Hansı modellər əlavə edildi
5. Hansı route-lar yaradıldı
6. Admin paneldə nə əlavə edildi
7. TREVA necə əlavə edildi
8. Listing relations necə işləyir
9. SEO dəyişiklikləri
10. i18n dəyişiklikləri
11. Test nəticələri
12. Build nəticəsi
13. Qalan TODO-lar
```

Əgər mövcud layihə arxitekturası bu promptda verilən konkret model və ya route adlarından fərqlənirsə, kor-koranə yeni paralel sistem yaratma.

Mövcud layihənin convention-larına uyğunlaş, lakin yuxarıda göstərilən bütün biznes tələblərini və funksional imkanları qoruyaraq implementasiya et.