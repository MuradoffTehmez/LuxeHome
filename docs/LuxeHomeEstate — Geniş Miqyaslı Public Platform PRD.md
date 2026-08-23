# LuxeHomeEstate — Geniş Miqyaslı Public Platform PRD

**Sənəd növü:** Product Requirements Document  
**Məhsul:** LuxeHomeEstate  
**Əhatə dairəsi:** Public website + User Dashboard + Agent/Agency Experience + AI + Search + Notifications + Reservation + SEO + Marketplace Features  
**Status:** Master Product Specification  
**Prioritet:** Production-grade implementation  
**Platformalar:** Desktop Web, Tablet Web, Mobile Web, gələcəkdə PWA/Mobile App  
**Default dil:** Azərbaycan dili  
**Default tema:** Light Theme  
**Arxitektura məqsədi:** Ölçülə bilən, SEO-friendly, AI-assisted, mobil-first, təhlükəsiz əmlak marketplace platforması

---

# 1. Məhsulun vizyonu

LuxeHomeEstate sadəcə əmlak elanlarının yerləşdirildiyi klassik elan saytı olmamalıdır.

Platforma istifadəçiyə:

- əmlak axtarmaq;
- ehtiyacına uyğun əmlak tapmaq;
- əmlakları müqayisə etmək;
- agentlə əlaqə yaratmaq;
- görüş və rezervasiya etmək;
- favorit və saxlanmış axtarışlar yaratmaq;
- qiymət dəyişikliklərini izləmək;
- AI vasitəsilə əmlak seçmək;
- rayon və məkan haqqında qərar vermək;
- agent və agentlikləri qiymətləndirmək

imkanı verən tam rəqəmsal əmlak ekosistemi olmalıdır.

Əsas məhsul prinsipi:

> İstifadəçi mümkün qədər az əməliyyatla özünə uyğun əmlakı tapa bilməlidir.

---

# 2. Əsas məhsul məqsədləri

LuxeHomeEstate aşağıdakı məqsədlərə çatmalıdır:

1. Əmlak axtarışını mümkün qədər rahat etmək.
2. İstifadəçiyə fərdiləşdirilmiş təcrübə təqdim etmək.
3. Agent və agentlikləri görünən və etibarlı etmək.
4. AI vasitəsilə klassik filter sistemini genişləndirmək.
5. İstifadəçinin platformaya yenidən qayıtmasını artırmaq.
6. Lead conversion faizini artırmaq.
7. Əmlak məlumatlarının keyfiyyətini yüksəltmək.
8. SEO vasitəsilə üzvi trafik yaratmaq.
9. Mobil istifadəyə üstünlük vermək.
10. Marketplace monetizasiyası üçün infrastruktur yaratmaq.
11. Premium elan və agentlik paketlərini dəstəkləmək.
12. İstifadəçi davranışlarını ölçülə bilən etmək.
13. Agentlərin performansını ölçmək.
14. Bildiriş və alert mexanizmləri ilə retention yaratmaq.
15. Gələcək AI və recommendation sistemlərinə uyğun data arxitekturası qurmaq.

---

# 3. Hədəf istifadəçi qrupları

## 3.1 Qonaq istifadəçi

Qeydiyyatsız istifadəçi.

Edə bilər:

- elanlara baxmaq;
- axtarış etmək;
- filter istifadə etmək;
- agentlərə baxmaq;
- agentlik profillərinə baxmaq;
- rayon səhifələrinə baxmaq;
- AI search-in limitli versiyasından istifadə etmək;
- əmlak paylaşmaq;
- QR kod istifadə etmək.

Qeydiyyat tələb olunan funksiyalar:

- favorit;
- saxlanmış axtarış;
- price alert;
- rezervasiya;
- görüş;
- bildiriş;
- saxlanmış müqayisə;
- şəxsi dashboard.

---

# 3.2 Qeydiyyatdan keçmiş istifadəçi

Əsas alıcı və ya kirayəçi.

Əlavə imkanlar:

- favoritlər;
- saxlanmış axtarışlar;
- price drop alert;
- son baxılanlar;
- görüşlər;
- rezervasiyalar;
- bildirişlər;
- agentlə əlaqə tarixçəsi;
- AI recommendation;
- şəxsi preference-lər.

---

# 3.3 Agent

Fərdi əmlak agenti.

Agent:

- öz profilini idarə edə bilər;
- elanlarını görə bilər;
- lead qəbul edə bilər;
- görüşləri idarə edə bilər;
- müştəri rəylərini görə bilər;
- performans məlumatlarını görə bilər.

---

# 3.4 Agentlik əməkdaşı

Agentliyin daxilində fəaliyyət göstərən istifadəçi.

Role və permission-a uyğun olaraq:

- elanları idarə edə bilər;
- lead qəbul edə bilər;
- rezervasiya idarə edə bilər;
- görüşləri görə bilər.

---

# 3.5 Agentlik Owner

Agentlik profilinin əsas sahibidir.

Əlavə olaraq:

- maksimum default 3 əməkdaş əlavə edə bilər;
- əməkdaş rollarını idarə edə bilər;
- agentlik profilini dəyişə bilər;
- elanları əməkdaşlara təyin edə bilər;
- agentlik performansını görə bilər.

---

# 4. Public saytın əsas informasiya arxitekturası

```text
Home

Properties
 ├─ Buy
 ├─ Rent
 ├─ New Developments
 ├─ Featured
 ├─ Recently Added
 └─ Map Search

AI Property Assistant

Find My Property

Neighborhoods

Agents

Agencies

Developers

Residential Complexes

Blog

FAQ

About

Contact

User Dashboard
 ├─ Profile
 ├─ Favorites
 ├─ Saved Searches
 ├─ Recently Viewed
 ├─ Compare
 ├─ Meetings
 ├─ Reservations
 ├─ Notifications
 ├─ Requests
 └─ Settings
```

---

# 5. Ana səhifə

Ana səhifənin əsas məqsədi istifadəçini mümkün qədər tez əmlak axtarışına yönləndirməkdir.

## Əsas hissələr

### Hero

- əsas başlıq;
- qısa value proposition;
- Buy / Rent toggle;
- location;
- property type;
- price;
- rooms;
- Search.

Əlavə:

**AI ilə axtar**

düyməsi.

---

# 5.1 Featured Properties

Premium və Featured elanlar göstərilir.

Kart:

- cover;
- qiymət;
- title;
- location;
- rooms;
- area;
- agent;
- favorite;
- premium badge.

---

# 5.2 Yeni elanlar

Son əlavə olunan əmlaklar.

---

# 5.3 Populyar ərazilər

Məsələn:

- Yasamal;
- Nəsimi;
- Səbail;
- Xətai;
- Nərimanov;
- Binəqədi.

---

# 5.4 Agentliklər

Verified agentliklər.

---

# 5.5 Agentlər

Top/featured agentlər.

---

# 5.6 AI Property Assistant CTA

Məsələn:

> Nə axtardığınızı adi cümlə ilə yazın.

---

# 5.7 Find My Property Wizard

İstifadəçini wizard-a yönləndirən hissə.

---

# 5.8 Testimonials

Təsdiqlənmiş müştəri rəyləri.

---

# 5.9 FAQ

Ən çox verilən suallar.

---

# 6. Əmlak axtarış sistemi

Axtarış LuxeHomeEstate-in əsas funksional nüvəsidir.

Sistem iki əsas axtarış rejiminə malik olmalıdır:

## Klassik Filter Search

və

## AI / Natural Language Search

---

# 7. Klassik filter sistemi

Minimum filter-lər:

- satılıq / kirayə;
- property type;
- şəhər;
- rayon;
- qəsəbə;
- küçə;
- residential complex;
- minimum qiymət;
- maksimum qiymət;
- otaq sayı;
- minimum sahə;
- maksimum sahə;
- mərtəbə;
- ümumi mərtəbə;
- təmir statusu;
- yeni/köhnə tikili;
- sənəd;
- ipoteka;
- parking;
- lift;
- balkon;
- dəniz mənzərəsi;
- metro yaxınlığı;
- məktəb yaxınlığı;
- yalnız verified;
- yalnız premium.

---

# 8. Search nəticələri

Nəticələr:

- grid;
- list;
- map

rejimlərində göstərilə bilməlidir.

URL filter-ləri saxlamalıdır.

Məsələn:

```text
/properties?city=baku&district=yasamal&rooms=3&price_max=150000
```

Bu:

- refresh;
- bookmark;
- sharing;
- SEO;
- browser back

üçün vacibdir.

---

# 9. Sort

Minimum:

- Recommended
- Newest
- Price Low → High
- Price High → Low
- Most Viewed
- Price Reduced
- Area
- Best Match

---

# 10. Saxlanmış axtarış

Qeydiyyatdan keçmiş istifadəçi istənilən axtarış nəticəsini saxlaya bilməlidir.

Misal:

**Bakı → Yasamal → 3 otaq → maksimum 150,000 AZN**

Düymə:

**Axtarışı saxla**

---

# 11. Saved Search entity

Saxlanmalıdır:

- user;
- name;
- filters;
- natural language query;
- location;
- price range;
- property type;
- room count;
- attributes;
- notification frequency;
- enabled status;
- created date;
- last match check;
- last notification.

---

# 12. Saved Search bildirişləri

Yeni uyğun property yarananda istifadəçiyə xəbər verilməlidir.

Channel-lar:

- e-mail;
- web/in-app notification;
- Web Push;
- gələcəkdə mobile push.

---

# 13. Saved Search notification frequency

İstifadəçi seçə bilər:

- dərhal;
- gündə bir dəfə;
- həftəlik;
- söndürülmüş.

Default:

**Gündə bir dəfə**

və ya məhsul qərarına uyğun real-time seçilə bilər.

---

# 14. Saved Search duplicate prevention

Eyni əmlak eyni saved search üçün istifadəçiyə dəfələrlə göndərilməməlidir.

Sistem:

`SavedSearchMatch`

entity-si saxlamalıdır.

---

# 15. Saved Search Dashboard

User Dashboard:

**Saxlanmış axtarışlar**

bölməsində:

- ad;
- filter summary;
- yeni nəticə sayı;
- notification status;
- frequency;
- edit;
- pause;
- delete;
- nəticələrə bax

olmalıdır.

---

# 16. Price Drop Alert

İstifadəçinin:

- favoritində;
- saved property listində

olan əmlakın qiyməti düşəndə alert yaradılmalıdır.

Misal:

> Saxladığınız əmlakın qiyməti 350,000 AZN-dən 335,000 AZN-ə düşdü.

və:

> 15,000 AZN qiymət endirimi.

---

# 17. Əmlak qiymət tarixçəsi

Property detail səhifəsində qiymət tarixçəsi göstərilə bilər.

Misal:

```text
12 Avqust
350,000 AZN

18 Avqust
340,000 AZN

23 Avqust
325,000 AZN
```

Grafik də təqdim edilə bilər.

---

# 18. Property Price History entity

Hər qiymət dəyişikliyində:

- property_id;
- old_price;
- new_price;
- changed_at;
- source;
- changed_by

saxlanmalıdır.

Price history sonradan dəyişdirilməməlidir.

---

# 19. Son baxdıqlarım

İstifadəçinin son baxdığı property-lər saxlanmalıdır.

User Dashboard:

**Son baxdıqlarım**

Məsələn maksimum:

- 50;
- 100

son property.

Anonymous istifadəçilər üçün local storage istifadə edilə bilər.

Login olduqda server-side history əsas götürülməlidir.

---

# 20. Favorites

İstifadəçi property-ni favoritə əlavə edə bilməlidir.

Property card və detail səhifəsində heart button olmalıdır.

Favorit:

- add;
- remove;
- list;
- price alerts;
- availability alerts

ilə inteqrasiya olunmalıdır.

---

# 21. Property Comparison

Tövsiyə edilən əlavə funksiya.

İstifadəçi 2–4 əmlakı müqayisə edə bilər.

Müqayisə:

| Meyar | Property A | Property B |
|---|---|---|
| Qiymət | | |
| m² | | |
| Otaq | | |
| Rayon | | |
| Təmir | | |
| Parking | | |
| Metro | | |
| Məktəb | | |
| m² qiyməti | | |

AI:

**“Bu əmlaklardan hansı daha yaxşıdır?”**

sualını da cavablandıra bilər.

---

# 22. Agent profili

Hər agent üçün ayrıca public profil olmalıdır.

URL:

```text
/agents/{slug}
```

---

# 23. Agent profil məlumatları

- profil şəkli;
- ad və soyad;
- verified badge;
- agentlik;
- rol;
- ixtisas;
- iş təcrübəsi;
- bio;
- telefon;
- WhatsApp;
- e-mail;
- dillər;
- işlədiyi ərazilər;
- active property count;
- sold/rented statistikası;
- rating;
- review count;
- response time.

---

# 24. Agent profil səhifəsi

Tabs:

- Overview
- Listings
- Reviews
- About
- Contact

---

# 25. Property altında agent kartı

Hər property detail səhifəsində məsul agent göstərilməlidir.

Agent kartı:

- avatar;
- ad;
- agency;
- rating;
- telefon;
- WhatsApp;
- ixtisas;
- profile link;
- contact;
- meeting.

---

# 26. Agentlər səhifəsi

Public:

**Agentlər**

səhifəsi olmalıdır.

Filter:

- agentlik;
- rayon;
- ixtisas;
- rating;
- dil;
- property type.

Sort:

- Most Active
- Highest Rated
- Most Listings
- Most Experienced

---

# 27. Agent rəyləri

Müştəri agent haqqında rəy yaza bilər.

Review:

- customer;
- agent;
- rating;
- comment;
- service type;
- date;
- moderation status.

---

# 28. Review status

- Pending
- Approved
- Rejected
- Hidden

Rəy moderator təsdiqindən sonra public olmalıdır.

---

# 29. Agentlik profil sistemi

URL:

```text
/agencies/{slug}
```

Məlumat:

- logo;
- cover;
- verified badge;
- company name;
- description;
- phone;
- WhatsApp;
- e-mail;
- website;
- address;
- map;
- working hours;
- active properties;
- team;
- reviews.

---

# 30. Agentlik komandası

Agentlik səhifəsində:

**Komanda**

bölməsi olmalıdır.

Owner + employees göstərilir.

Default:

**1 Owner + maksimum 3 Employee**

---

# 31. AI Property Assistant

LuxeHomeEstate üçün əsas fərqləndirici funksiyalardan biri olmalıdır.

İstifadəçi natural language ilə axtarış edə bilməlidir.

Məsələn:

> Bakıda 200,000 AZN-ə qədər, 3 otaqlı, dənizə yaxın mənzil istəyirəm.

AI bu sorğunu strukturlaşdırmalıdır.

---

# 32. AI Query Parsing

Sorğudan çıxarılmalıdır:

```text
transaction_type = buy
city = Bakı
price_max = 200000
rooms = 3
near_sea = true
property_type = apartment
```

Sonra real property database-də axtarış aparılmalıdır.

---

# 33. AI nəticələrinin qaydası

AI olmayan property yaratmamalıdır.

AI yalnız real database-də olan elanlardan cavab verməlidir.

Əgər uyğun nəticə yoxdursa:

> Bu kriteriyalara tam uyğun elan tapılmadı.

deyilməlidir.

Sonra yaxın alternativlər göstərilə bilər.

---

# 34. AI clarification

Sorğu qeyri-dəqiqdirsə AI sual verə bilər.

Məsələn:

> 200,000 AZN ümumi büdcənizdir?

və ya:

> Yeni tikili sizin üçün vacibdir?

və ya:

> Hansı rayonlara üstünlük verirsiniz?

---

# 35. AI Property Assistant nəticəsi

Nəticə kartları:

- cover;
- title;
- price;
- location;
- match score;
- matching reasons;
- detail;
- compare.

---

# 36. AI Property Match Score

Sistem istifadəçi kriteriyalarına əsasən uyğunluq faizi hesablaya bilər.

Məsələn:

**94% uyğun**

Səbəblər:

- büdcəyə uyğundur;
- rayon uyğundur;
- otaq sayı uyğundur;
- parking mövcuddur;
- məktəb yaxındır;
- metro məsafəsi uyğundur.

---

# 37. Match Score arxitekturası

Score təkcə AI tərəfindən qeyri-şəffaf yaradılmamalıdır.

Mümkün qədər deterministic scoring istifadə edilməlidir.

Məsələn:

```text
Budget        25%
Location      20%
Rooms         15%
Property Type 10%
Parking       10%
Nearby        10%
Condition     10%
```

AI score-un səbəblərini izah edə bilər.

---

# 38. AI Property Detail Assistant

Property detail səhifəsində:

**Bu əmlak haqqında AI-dan soruş**

funksiyası olmalıdır.

İstifadəçi soruşa bilər:

> Bu evin üstünlükləri nədir?

> Ailə üçün uyğundur?

> Parking varmı?

> Metroya nə qədər yaxındır?

AI yalnız:

- həmin property;
- property attributes;
- location;
- nearby data

əsasında cavab verməlidir.

---

# 39. AI grounding

AI aşağıdakı qaydaya əməl etməlidir:

> Məlumat bazasında olmayan xüsusiyyəti fakt kimi demə.

Məsələn parking məlumatı yoxdursa:

> Parking haqqında elan məlumatlarında təsdiqlənmiş məlumat yoxdur.

---

# 40. AI ilə avtomatik elan təsviri

Admin/Agent property məlumatlarını daxil etdikdən sonra AI məzmun yarada bilər.

Input:

```text
3 otaq
145 m²
Yasamal
350,000 AZN
Yeni təmir
Yeraltı parking
```

Output:

- title;
- short description;
- long description;
- SEO title;
- meta description;
- social media caption.

---

# 41. AI Content Generator qaydaları

AI:

- mövcud olmayan xüsusiyyət əlavə etməməlidir;
- hüquqi status uydurmamalıdır;
- lokasiya uydurmamalıdır;
- “ən yaxşı”, “100% yatırım fürsəti” kimi əsassız iddialardan çəkinməlidir;
- generated content admin/agent tərəfindən təsdiqlənməlidir.

---

# 42. AI Photo Advisor

Property şəkilləri yüklənəndə sistem hər şəkli analiz edə bilər.

Yoxlanmalıdır:

- blur;
- darkness;
- overexposure;
- resolution;
- aspect ratio;
- duplicate;
- watermark;
- screenshot;
- şəxsi məlumat riski;
- üz görünməsi;
- uyğun olmayan kontent;
- property relevance.

---

# 43. Photo Quality Score

Məsələn:

**87 / 100**

və tövsiyələr:

> Şəkil cover üçün uyğundur.

və ya:

> Şəkil çox qaranlıqdır.

> Şəkildə mətn/watermark mövcuddur.

> Bu şəkil əvvəlki şəkilə çox oxşardır.

---

# 44. Cover Recommendation

AI/algoritm ən uyğun cover şəklini tövsiyə edə bilər.

Amma admin son qərarı verməlidir.

---

# 45. “Mənim üçün uyğun əmlak tap” Wizard

Texniki olmayan istifadəçilər üçün guided experience.

---

# 46. Wizard sualları

### Addım 1

Satın almaq, yoxsa kirayə?

### Addım 2

Büdcəniz?

### Addım 3

Property type?

### Addım 4

Otaq sayı?

### Addım 5

Hansı ərazi?

### Addım 6

Yeni tikili / köhnə tikili?

### Addım 7

Təmirli?

### Addım 8

Parking?

### Addım 9

Metro yaxınlığı?

### Addım 10

Məktəb yaxınlığı?

### Addım 11

Dəniz mənzərəsi?

### Addım 12

Digər prioritetlər?

---

# 47. Wizard nəticəsi

Nəticə:

> Sizə uyğun 24 əmlak tapıldı.

Kartlarda Match Score göstərilə bilər.

İstifadəçiyə:

**Bu axtarışı saxla**

təklif edilməlidir.

---

# 48. Neighborhood / Rayon səhifələri

SEO və qərarvermə baxımından vacib modul.

URL:

```text
/neighborhoods/yasamal
```

---

# 49. Rayon səhifəsi məlumatları

Minimum:

- ad;
- description;
- cover image;
- map;
- active listing count;
- average price;
- median price;
- average m² price;
- sale/rent ratio;
- residential complexes;
- property types;
- schools;
- universities;
- hospitals;
- metro;
- parks;
- restaurants;
- shopping;
- new developments.

---

# 50. Neighborhood investment məlumatları

Gələcək mərhələdə:

- qiymət trendi;
- illik dəyişiklik;
- rental demand;
- average rent;
- rental yield estimation;
- property supply trend.

Məlumat varsa göstərilməlidir.

Uydurma statistika göstərilməməlidir.

---

# 51. Nearby Places

Property detail səhifəsində yaxın obyektlər göstərilə bilər.

Məsələn:

```text
Metro       7 dəq
Məktəb      4 dəq
Xəstəxana   8 dəq
Market      3 dəq
Park        5 dəq
```

---

# 52. Nearby data

Kateqoriyalar:

- metro;
- bus;
- school;
- university;
- kindergarten;
- hospital;
- clinic;
- pharmacy;
- supermarket;
- restaurant;
- park;
- shopping center.

---

# 53. Nearby distance

Mümkündürsə iki dəyər ayrılmalıdır:

- linear distance;
- travel/walking time.

Məsələn:

**Metro — 850 m / təxminən 11 dəq piyada**

Məlumatın mənbə və hesablanma üsulu texniki səviyyədə aydın olmalıdır.

---

# 54. Map Search

İstifadəçi xəritə üzərində əmlak axtara bilməlidir.

Funksiyalar:

- pan;
- zoom;
- cluster;
- price marker;
- premium marker;
- selected property preview;
- draw area — Phase 2.

---

# 55. Web Push Notifications

İstifadəçi browser push-a icazə verə bilər.

İstifadə nümunələri:

> Saxladığınız axtarışa uyğun yeni əmlak əlavə edildi.

> Favoritinizdəki əmlakın qiyməti düşdü.

> Görüşünüz sabah saat 14:00-dadır.

> Rezervasiya statusunuz dəyişdi.

---

# 56. Notification Center

User Dashboard-da:

**Bildirişlər**

bölməsi olmalıdır.

Notification:

- icon;
- title;
- content;
- date;
- read/unread;
- action URL.

Əməliyyat:

- mark as read;
- mark all read;
- delete.

---

# 57. Notification Preferences

User Settings:

```text
Saved Search
[x] Email
[x] Web
[x] Push

Price Drop
[x] Email
[x] Web
[x] Push

Meeting Reminder
[x] Email
[x] Web
```

---

# 58. Social Sharing

Property paylaşma funksiyası olmalıdır.

Channel-lar:

- WhatsApp;
- Telegram;
- Facebook;
- copy link;
- digər native share.

---

# 59. Smart Sharing

Property paylaşılarkən metadata avtomatik hazırlanmalıdır:

- title;
- price;
- location;
- cover;
- description;
- canonical URL.

---

# 60. Open Graph

Hər property üçün dinamik:

```text
og:title
og:description
og:image
og:url
og:type
```

olmalıdır.

---

# 61. QR Code

Hər property üçün QR avtomatik generasiya olunmalıdır.

QR default:

**Property canonical URL**

daşımalıdır.

---

# 62. QR istifadə sahələri

- property detail;
- çap materialı;
- brochure;
- agent kartı;
- vitrin;
- sosial media materialları.

---

# 63. QR download

Agent/admin:

- PNG;
- SVG

formatında QR əldə edə bilər.

---

# 64. Property Lifecycle

Əmlak statusları:

- Draft
- Pending Review
- Published
- Featured
- Reserved
- Sold
- Rented
- Expired
- Archived
- Rejected
- Suspended

---

# 65. Status workflow

```text
Draft
 ↓
Pending Review
 ↓
Published
```

Published:

```text
→ Featured
→ Reserved
→ Sold
→ Rented
→ Expired
→ Archived
```

---

# 66. Reservation Expiry

Reserved statusu üçün:

`reservation_expires_at`

olmalıdır.

Müddət bitdikdə configurable qayda ilə:

`Reserved → Published`

ola bilər.

---

# 67. Expired Listing

Property expiry date keçdikdə:

`Published → Expired`

Sistem agentə əvvəlcədən bildiriş göndərməlidir.

Məsələn:

- 7 gün əvvəl;
- 3 gün əvvəl;
- 1 gün əvvəl.

---

# 68. Auto Archive

Expired property müəyyən müddətdən sonra:

`Expired → Archived`

keçə bilər.

Məsələn:

30 gündən sonra.

Bu parametr admin paneldən dəyişdirilə bilməlidir.

---

# 69. Premium / Featured Listing

Agent və ya admin property-ni premium edə bilər.

Premium property:

- ana səhifə;
- search;
- map;
- premium section;
- related listings

sahələrində prioritet əldə edə bilər.

---

# 70. Premium badge

Kart və detail:

**Premium**

və ya:

**Featured**

badge göstərməlidir.

---

# 71. Premium sıralama

Premium status relevance-i tam əvəz etməməlidir.

Məsələn istifadəçi Bakı axtarırsa Gəncədəki premium property yuxarı çıxmamalıdır.

Premium yalnız uyğun nəticələr daxilində rank boost almalıdır.

---

# 72. Premium müddəti

Property:

- 3 gün;
- 7 gün;
- 14 gün;
- 30 gün

premium edilə bilər.

Bu paket sistemi ilə idarə edilməlidir.

---

# 73. Rezervasiya sistemi

Property detail səhifəsində:

**Rezervasiya et**

düyməsi ola bilər.

Bütün property-lərdə reservation aktiv olmaq məcburi deyil.

---

# 74. Reservation form

İstifadəçi:

- ad;
- soyad;
- telefon;
- e-mail;
- property;
- istədiyi tarix;
- mesaj;
- şərtləri qəbul

göndərir.

Login istifadəçi məlumatları avtomatik doldurula bilər.

---

# 75. Reservation statusları

- Requested
- Pending
- Approved
- Rejected
- Cancelled
- Expired
- Completed

---

# 76. Reservation notification

Status dəyişdikdə:

- user;
- agent;
- agency

uyğun şəkildə bildiriş almalıdır.

---

# 77. Görüş sistemi

Property üçün ayrıca:

**Baxış təyin et**

funksiyası olmalıdır.

---

# 78. Meeting məlumatları

- property;
- customer;
- agent;
- date;
- time;
- type;
- location;
- note;
- status.

---

# 79. Meeting type

- property viewing;
- office meeting;
- online consultation;
- phone consultation.

---

# 80. Meeting status

- Requested
- Confirmed
- Rescheduled
- Cancelled
- Completed
- No Show

---

# 81. Calendar

User Dashboard:

**Görüşlər**

Agent Dashboard:

**Görüşlər**

göstərməlidir.

---

# 82. AI Chatbot

Sayt daxilində canlı conversational interface.

Başlanğıc:

> Salam. Sizə hansı tip əmlak lazımdır?

---

# 83. Chatbot imkanları

Bot:

- əmlak axtara bilər;
- filter yarada bilər;
- property link göndərə bilər;
- property müqayisə edə bilər;
- FAQ cavablandıra bilər;
- agent tapa bilər;
- lead yarada bilər;
- görüş prosesini başlada bilər.

---

# 84. Chatbot → human handoff

AI bütün hallarda insan agentini əvəz etməməlidir.

İstifadəçi:

> Agentlə danışmaq istəyirəm.

dedikdə sistem:

- uyğun agent;
- property agent;
- agency support

ilə lead yarada bilməlidir.

---

# 85. Chat Lead

AI conversation-dan lead yaradıla bilər.

Lead source:

`AI_CHATBOT`

olmalıdır.

Conversation ID lead ilə əlaqələndirilə bilər.

---

# 86. FAQ CMS

Public FAQ admin CMS tərəfindən idarə olunmalıdır.

Kateqoriyalar:

- Alış;
- Kirayə;
- Rezervasiya;
- Agentlik;
- Ödəniş;
- Hüquqi;
- Platforma.

---

# 87. FAQ SEO

FAQ page:

- unique URL;
- title;
- description;
- structured data

ilə işləməlidir.

---

# 88. Testimonial sistemi

Testimonial məlumatları:

- customer name;
- avatar;
- review;
- date;
- service type;
- rating;
- related agent;
- related agency.

Admin approval tələb olunmalıdır.

---

# 89. User Dashboard

Əsas struktur:

```text
Mənim profilim
├── Overview
├── Favoritlər
├── Saxlanmış axtarışlar
├── Son baxdıqlarım
├── Müqayisə
├── Görüşlər
├── Rezervasiyalar
├── Bildirişlər
├── Sorğularım
└── Parametrlər
```

---

# 90. User Dashboard Overview

KPI:

- favoritlər;
- saved searches;
- upcoming meetings;
- reservations;
- unread notifications.

Əlavə:

**Sizin üçün tövsiyələr**

bölməsi.

---

# 91. User Profile

Məlumat:

- avatar;
- cover;
- name;
- surname;
- phone;
- e-mail;
- location;
- bio;
- language;
- theme;
- notification preferences.

---

# 92. Theme

Default:

**Light**

İstifadəçi:

- Light
- Dark
- System

seçə bilər.

Preference database-də saxlanmalıdır.

---

# 93. Multi-language

Platforma i18n-ready olmalıdır.

Minimum nəzərdə tutula bilər:

- AZ;
- EN;
- RU.

Default:

AZ.

---

# 94. Localized content

Tərcümə edilə bilməlidir:

- UI;
- category;
- location descriptions;
- property title/description;
- agent bio;
- agency description;
- neighborhood;
- CMS;
- FAQ;
- SEO;
- notifications;
- e-mail.

---

# 95. Responsive design

Public sayt mobil cihaz üçün ayrıca optimallaşdırılmalıdır.

Desktop dizaynın sıxılmış versiyası olmamalıdır.

---

# 96. Mobile Search

Mobile filter bottom sheet/drawer kimi işləyə bilər.

Əsas action-lar:

- Search
- Filter
- Map
- Sort

asan əlçatan olmalıdır.

---

# 97. Mobile property detail

Əsas əlaqə action-ları sticky ola bilər:

```text
Telefon | WhatsApp | Mesaj
```

---

# 98. Property Detail Page

Property detail səhifəsi minimum aşağıdakı hissələrdən ibarət olmalıdır:

1. Gallery
2. Price
3. Main information
4. Property attributes
5. Description
6. Location
7. Nearby
8. Agent
9. Price history
10. Similar properties
11. AI assistant
12. Contact
13. Reservation
14. Meeting
15. Share
16. QR

---

# 99. Property Gallery

- cover;
- thumbnail;
- fullscreen;
- swipe;
- zoom;
- image count.

Gələcək:

- video;
- 360°;
- virtual tour.

---

# 100. Property əsas məlumatları

- title;
- listing ID;
- price;
- currency;
- transaction type;
- category;
- location;
- rooms;
- area;
- floor;
- building floor count;
- condition;
- document;
- published date;
- updated date.

---

# 101. Price per m²

Sistem avtomatik:

`price / area`

hesablamalıdır.

Property detail və neighborhood analytics-də istifadə oluna bilər.

---

# 102. Similar Properties

Meyarlar:

- location;
- price;
- property type;
- rooms;
- area;
- attributes.

Similarity score istifadə edilə bilər.

---

# 103. Recommendation Engine

Phase 2-də istifadəçi davranışı ilə:

- viewed;
- favorite;
- searches;
- clicked;
- contacted

əsasında personal recommendation hazırlana bilər.

---

# 104. Recommendation privacy

İstifadəçi preference-based personalization-u söndürə bilməlidir.

---

# 105. SEO əsasları

Public platforma SEO-first qurulmalıdır.

Index edilə bilən səhifələr:

- property;
- agency;
- agent;
- neighborhood;
- category;
- residential complex;
- developer;
- blog;
- FAQ.

---

# 106. Dynamic SEO

Hər entity üçün:

- title;
- description;
- canonical;
- OG;
- schema;
- hreflang.

---

# 107. Property SEO

URL nümunəsi:

```text
/az/property/yasamal-3-otaqli-yeni-tikili-LH10482
```

Property ID URL-də olması duplicate slug problemlərini azalda bilər.

---

# 108. Neighborhood SEO

Məsələn:

```text
/az/baki/yasamal/menziller
```

və:

```text
/az/neighborhood/yasamal
```

Strategiya vahid şəkildə seçilməlidir.

---

# 109. Structured Data

Uyğun səhifələrdə:

- BreadcrumbList
- Organization
- RealEstateAgent
- FAQPage
- Article
- WebSite

schema istifadə edilə bilər.

---

# 110. Search indexing qaydaları

Hər filter kombinasiyası index edilməməlidir.

Əks halda milyonlarla thin URL yarana bilər.

SEO landing pages ayrıca idarə edilməlidir.

---

# 111. Analytics event-ləri

Minimum:

```text
page_view
property_view
property_impression
search
filter_applied
search_saved
favorite_added
favorite_removed
price_alert_created
phone_clicked
whatsapp_clicked
message_clicked
agent_viewed
agency_viewed
meeting_requested
reservation_requested
property_shared
qr_opened
ai_search
ai_result_clicked
chatbot_started
lead_created
```

---

# 112. Search funnel

Ölçülməlidir:

```text
Search
↓
Property Impression
↓
Property View
↓
Favorite
↓
Contact
↓
Lead
↓
Meeting
↓
Conversion
```

---

# 113. AI Analytics

Ölçülə bilər:

- AI query sayı;
- result click rate;
- zero-result;
- clarification rate;
- AI → lead conversion;
- AI → meeting conversion.

---

# 114. Lead Attribution

Lead source saxlanmalıdır.

Məsələn:

- Property Page
- Agent Page
- Agency Page
- AI Search
- Chatbot
- Saved Search
- Price Alert
- Campaign
- Organic Search

---

# 115. Error state

Əgər property tapılmırsa:

> Bu elan artıq mövcud deyil və ya deaktiv edilib.

Alternativ:

- oxşar elanlar;
- rayon elanları;
- yeni axtarış.

---

# 116. Zero Search Results

Sadəcə:

> Nəticə yoxdur

göstərilməməlidir.

Sistem:

- büdcəni genişləndir;
- yaxın rayonlar;
- otaq sayını dəyiş;
- oxşar property-lər

təklif edə bilər.

---

# 117. Loading State

Skeleton istifadə edilməlidir.

Xüsusilə:

- property cards;
- property detail;
- search;
- agent;
- neighborhood.

---

# 118. Offline / weak connection

Mobil internet zəif olduqda:

- retry;
- lazy image;
- compressed images;
- progressive loading

istifadə edilməlidir.

---

# 119. Media format

Public delivery üçün əsas format:

**WebP**

istifadə edilə bilər.

Original source upload saxlanılması biznes qərarına bağlıdır.

Responsive image ölçüləri yaradılmalıdır.

---

# 120. Lazy Loading

Fold-dan aşağı şəkillər lazy load edilməlidir.

LCP cover şəkillərində lazy loading tətbiq edilməməlidir.

---

# 121. Performance hədəfləri

Məqsəd:

- sürətli initial rendering;
- optimized images;
- minimal JS;
- server-side rendering və ya SEO-friendly rendering;
- CDN/cache.

Core Web Vitals prioritet olmalıdır.

---

# 122. Accessibility

Minimum:

- keyboard navigation;
- semantic headings;
- alt text;
- labels;
- focus states;
- screen reader;
- accessible modal;
- contrast.

---

# 123. Authentication

Dəstəklənə bilər:

- e-mail/password;
- gələcəkdə Google OAuth;
- digər OAuth provider-lər.

---

# 124. Account Security

- secure password;
- verification;
- password reset;
- session management;
- login history;
- device management.

---

# 125. Privacy

İstifadəçi:

- notification preferences;
- personalization preferences;
- public profile visibility

idarə edə bilməlidir.

---

# 126. Agent əlaqə təhlükəsizliyi

Contact click-ləri analytics üçün event yarada bilər.

Amma istifadəçinin mesaj məzmunu zəruri olmadıqca analytics sisteminə göndərilməməlidir.

---

# 127. Rate limiting

Xüsusilə:

- contact;
- chatbot;
- AI search;
- login;
- registration;
- reservation;
- meeting;
- review

endpoint-lərində rate limiting olmalıdır.

---

# 128. Spam protection

Lead və contact form:

- rate limiting;
- CAPTCHA/risk detection;
- duplicate detection;
- suspicious patterns

ilə qorunmalıdır.

---

# 129. API modul gözləntiləri

Nümunə:

```text
/api/v1/properties
/api/v1/search
/api/v1/saved-searches
/api/v1/favorites
/api/v1/recently-viewed
/api/v1/agents
/api/v1/agencies
/api/v1/neighborhoods
/api/v1/notifications
/api/v1/reservations
/api/v1/meetings
/api/v1/reviews
/api/v1/ai/search
/api/v1/ai/chat
```

---

# 130. Saved Search API

```text
POST   /saved-searches
GET    /saved-searches
GET    /saved-searches/{id}
PATCH  /saved-searches/{id}
DELETE /saved-searches/{id}
```

---

# 131. Favorites API

```text
POST   /favorites/{propertyId}
DELETE /favorites/{propertyId}
GET    /favorites
```

---

# 132. AI Search API

```text
POST /ai/search
```

Input:

```json
{
  "query": "Yasamalda 200 min manata qədər parkingli 3 otaqlı ev"
}
```

Output strukturlaşdırılmış olmalıdır:

```json
{
  "parsedFilters": {},
  "results": [],
  "clarification": null
}
```

---

# 133. AI maliyyət nəzarəti

AI request-lər limitlənməlidir.

Məsələn:

Guest:

- gündə X request.

Registered:

- daha yüksək limit.

Premium:

- əlavə limit.

Exact limit admin setting olmalıdır.

---

# 134. AI cache

Eyni və ya çox oxşar AI query-lər üçün uyğun cache strategiyası istifadə edilə bilər.

---

# 135. Əsas database entity-ləri

Minimum:

```text
User
UserProfile
UserPreference

Agency
AgencyEmployee

AgentProfile

Property
PropertyMedia
PropertyAttribute
PropertyPriceHistory
PropertyView

Favorite
RecentlyViewed

SavedSearch
SavedSearchMatch

Notification
NotificationPreference
PushSubscription

AgentReview
Testimonial

Neighborhood
NearbyPlace

Reservation
Meeting

Lead
LeadActivity

PropertyMatch
Recommendation

AiConversation
AiMessage

SeoMetadata
QrCode

PremiumPlacement
```

---

# 136. Əsas əlaqələr

```text
User
 ├─ Favorites
 ├─ SavedSearches
 ├─ RecentlyViewed
 ├─ Meetings
 ├─ Reservations
 └─ Notifications

Agency
 ├─ Employees
 ├─ Agents
 └─ Properties

Property
 ├─ Agent
 ├─ Agency
 ├─ Media
 ├─ PriceHistory
 ├─ Favorites
 ├─ Meetings
 ├─ Reservations
 └─ Leads
```

---

# 137. Property validation

Elan yayımlanmazdan əvvəl minimum:

- title;
- price;
- transaction type;
- category;
- location;
- area;
- contact;
- minimum image count

tələbləri olmalıdır.

---

# 138. Data freshness

Property-də:

**Son yenilənmə**

göstərilə bilər.

Agent müəyyən müddət ərzində property statusunu təsdiqləməzsə sistem:

> Bu elan hələ aktualdır?

bildirişi göndərə bilər.

---

# 139. Listing freshness check — Phase 2

Məsələn hər 30 gündə agentdən:

- aktivdir;
- satılıb;
- kirayə verilib

təsdiqi tələb edilə bilər.

Bu saxta və köhnəlmiş elanları azaldar.

---

# 140. Verified Listing — gələcək

Əlavə badge:

**Verified Listing**

sənəd və ya manual yoxlama ilə verilə bilər.

---

# 141. Mortgage Calculator — tövsiyə

Property detail səhifəsində gələcəkdə:

**Aylıq ödənişi hesabla**

modulu əlavə edilə bilər.

Input:

- property price;
- initial payment;
- interest;
- duration.

Bu yalnız məlumat xarakterli olmalı və maliyyə məsləhəti kimi təqdim edilməməlidir.

---

# 142. Affordability Calculator — gələcək

İstifadəçi:

- aylıq gəlir;
- ilkin ödəniş;
- müddət

daxil edir.

Sistem təxmini büdcə intervalı göstərir.

---

# 143. Shareable Shortlist — tövsiyə

İstifadəçi favoritlərindən shortlist yaradıb paylaşa bilər.

Məsələn:

> Baxdığım 5 mənzil

Unique share URL.

---

# 144. Property Notes — Phase 2

İstifadəçi favorit property üçün şəxsi qeyd əlavə edə bilər.

Məsələn:

> Mətbəxi yaxşıdır, amma parking yoxdu.

Bu qeyd yalnız istifadəçiyə görünür.

---

# 145. Public property ID

Hər property unikal public ID almalıdır.

Məsələn:

`LHE-10482`

Bu ID:

- support;
- QR;
- sharing;
- admin;
- search

üçün istifadə edilə bilər.

---

# 146. Global Search

Header-də search:

- property ID;
- location;
- neighborhood;
- agency;
- agent

axtara bilər.

---

# 147. Public navigation

Desktop:

- Buy;
- Rent;
- New Projects;
- Neighborhoods;
- Agents;
- Agencies;
- AI Search.

Mobile:

drawer/bottom navigation ilə optimallaşdırılmalıdır.

---

# 148. Breadcrumbs

Property və SEO səhifələrdə:

```text
Ana səhifə
→ Bakı
→ Yasamal
→ Mənzil
→ LHE-10482
```

---

# 149. 404

SEO-friendly custom səhifə.

Actions:

- ana səhifə;
- property search;
- AI search.

---

# 150. User onboarding

Yeni istifadəçi login olduqdan sonra optional onboarding:

- məqsəd;
- büdcə;
- preferred location;
- rooms;
- notifications

soruşula bilər.

Bu recommendation üçün istifadə edilə bilər.

---

# 151. Onboarding skip

Onboarding məcburi olmamalıdır.

**Keç**

seçimi olmalıdır.

---

# 152. Personalized home

Login istifadəçi üçün ana səhifədə:

**Sizin üçün**

bölməsi ola bilər.

---

# 153. Personalized recommendations

Əsas input:

- saved searches;
- favorites;
- viewed properties;
- explicit preferences.

Explicit preference implicit behavior-dan daha yüksək prioritet ala bilər.

---

# 154. Data retention

Recently viewed və AI conversations üçün retention müddəti müəyyən edilməlidir.

İstifadəçiyə history silmə imkanı verilməlidir.

---

# 155. Export/Delete account

User Settings gələcəkdə:

- personal data export;
- account deletion

workflow dəstəkləməlidir.

---

# 156. Public UI keyfiyyət prinsipləri

Hər səhifədə:

- Loading;
- Empty;
- Error;
- Success

state olmalıdır.

---

# 157. Public mobile UX

Mobil ekranda:

- minimum touch target;
- sticky contact;
- swipe gallery;
- full screen map;
- bottom filter;
- simplified forms

olmalıdır.

---

# 158. Search persistence

İstifadəçi property detail-dan geri qayıtdıqda:

- filters;
- sort;
- scroll position

mümkün qədər saxlanmalıdır.

Bu UX üçün vacibdir.

---

# 159. Listing card

Card minimum:

- image;
- badges;
- price;
- title;
- location;
- rooms;
- area;
- updated date;
- agency/agent;
- favorite.

---

# 160. Listing badges

Mümkün:

- Premium
- New
- Price Drop
- Verified
- Reserved
- New Building

---

# 161. Price Drop badge

Əgər son X gündə qiymət azalıbsa:

**Price Drop**

badge göstərilə bilər.

---

# 162. New badge

Yeni property üçün configurable:

`published_at < X days`

qaydası.

---

# 163. Contact methods

Property detail:

- Call;
- WhatsApp;
- Message;
- Meeting;
- Reservation.

Hər action analytics event yaratmalıdır.

---

# 164. Phone reveal

Telefon nömrəsi əvvəl maskalana bilər:

`+994 50 *** ** **`

**Nömrəni göstər**

klikindən sonra reveal.

Bu klik conversion event kimi saxlanmalıdır.

---

# 165. Agent response metrics — Phase 2

Agent profilində:

> Orta cavab müddəti: 18 dəqiqə

kimi metric göstərilə bilər.

Yalnız kifayət qədər real məlumat varsa.

---

# 166. Review integrity

Agent/agency özünə rəy yaza bilməməlidir.

Bir istifadəçinin eyni completed service üçün təkrar rəy limitləri olmalıdır.

---

# 167. Notification deduplication

İstifadəçiyə eyni hadisə üçün:

- saved search;
- recommendation;
- price alert

üzərindən eyni anda 3 e-mail göndərilməməlidir.

Notification orchestration layer olmalıdır.

---

# 168. Notification quiet hours — Phase 2

İstifadəçi push üçün:

> 22:00–08:00 bildiriş göndərmə

seçə bilər.

---

# 169. Smart recommendation notifications

Gələcəkdə:

> Son axtarışlarınıza əsasən sizə uyğun 5 yeni əmlak tapıldı.

---

# 170. Deep links

Notification property-yə birbaşa açılmalıdır.

Məsələn:

```text
/property/LHE-10482
```

---

# 171. Reservation rules

Reserved əmlak:

- axtarışda görünə bilər;
- `Reserved` badge almalıdır;
- yeni reservation qəbulunun mümkün olub-olmaması configurable olmalıdır.

---

# 172. Sold / Rented property

Sold/Rented property birbaşa silinməməlidir.

SEO və tarixçə səbəbi ilə müəyyən müddət public qala bilər.

Məsələn:

> Bu əmlak artıq satılıb.

Altında:

**Oxşar elanlar**

göstərilir.

---

# 173. Archived property

Archived property normal search-də görünməməlidir.

---

# 174. SEO expired listing strategy

Property URL dərhal 404 edilməməlidir.

Əgər uyğun biznes qaydası varsa:

- status page;
- similar listings;
- canonical rules

tətbiq edilməlidir.

---

# 175. Monetizasiya istiqamətləri

Platforma aşağıdakılara hazır olmalıdır:

- Premium Listings;
- Featured Listings;
- Agency subscription;
- Agent subscription;
- Homepage promotion;
- Search boost;
- Banner ads;
- Developer promotion;
- Residential complex promotion.

---

# 176. Paket sistemi ilə public feature gating

Məsələn:

Free Agent:

- X elan.

Professional:

- daha çox elan;
- analytics;
- featured credits.

Agency:

- employees;
- CRM;
- advanced analytics.

Exact limit admin panel tərəfindən dəyişdirilməlidir.

---

# 177. Feature Flags

Aşağıdakı funksiyalar flag ilə aktivləşdirilə bilər:

```text
ai_search
ai_chatbot
saved_search
push_notifications
reservations
agent_reviews
price_history
neighborhood_pages
premium_listings
```

---

# 178. MVP — Phase 1

İlk production release üçün:

## Public

- Home
- Search
- Filters
- Property Detail
- Agents
- Agencies
- Neighborhood basic pages
- Responsive design
- Multi-language foundation
- Light/Dark/System theme

## User

- Registration/Login
- Profile
- Favorites
- Recently Viewed
- Saved Searches
- Notifications

## Property

- lifecycle;
- price history;
- sharing;
- QR;
- agent card.

## Lead

- phone;
- WhatsApp;
- contact;
- meeting request.

## SEO

- metadata;
- sitemap;
- canonical;
- OG;
- structured pages.

---

# 179. Phase 2

- Web Push;
- Price Drop Alert;
- Reservation;
- Compare;
- Agent Reviews;
- Testimonials;
- Advanced Neighborhood Analytics;
- Nearby Places;
- Premium Listings;
- Recommendation Engine;
- Find My Property Wizard;
- AI description generator;
- AI Photo Advisor.

---

# 180. Phase 3

- AI Property Assistant;
- Semantic Search;
- AI Match Score;
- AI Chatbot;
- Human handoff;
- Advanced recommendation;
- smart pricing insights;
- investment analytics;
- map draw search;
- virtual tours;
- PWA;
- Mobile Application.

---

# 181. AI mərhələləndirmə tövsiyəsi

AI funksiyalarının hamısını ilk versiyada aktiv etmək tələb olunmamalıdır.

Tövsiyə:

### AI Phase A

Natural language → filters.

### AI Phase B

Property Q&A.

### AI Phase C

Match Score.

### AI Phase D

Chatbot + lead.

### AI Phase E

Personalized recommendation.

Bu yanaşma risk və xərci daha yaxşı idarə edəcək.

---

# 182. Acceptance Criteria — Saved Search

Funksiya tamamlanmış hesab edilir əgər:

1. User axtarış saxlaya bilir.
2. Filter-lər düzgün saxlanılır.
3. User search-i edit edə bilir.
4. Search pause edilə bilir.
5. Yeni property matching sistemi işləyir.
6. Duplicate notification yaranmır.
7. E-mail/web notification işləyir.
8. Click property-yə aparır.

---

# 183. Acceptance Criteria — AI Search

1. Natural language query qəbul edilir.
2. Query filter-lərə çevrilir.
3. Real database search işləyir.
4. AI olmayan property uydurmur.
5. Missing criteria üçün clarification mümkündür.
6. Zero result düzgün idarə edilir.
7. Result click analytics işləyir.
8. Mobile UX işləyir.

---

# 184. Acceptance Criteria — Agent Profile

1. Public URL mövcuddur.
2. Agent avatarı görünür.
3. Contact action-lar işləyir.
4. Listings göstərilir.
5. Agency link işləyir.
6. Review-lər moderation-dan sonra görünür.
7. Responsive-dir.
8. SEO metadata mövcuddur.

---

# 185. Acceptance Criteria — Price Alert

1. Property price dəyişir.
2. History record yaranır.
3. Favorite user müəyyən edilir.
4. Alert yaradılır.
5. Duplicate alert olmur.
6. Notification düzgün old/new qiymət göstərir.
7. Property link işləyir.

---

# 186. Acceptance Criteria — Reservation

1. Login user reservation yaradır.
2. Property reservation-enabled olmalıdır.
3. Agent/admin notification alır.
4. Status izlənilir.
5. Status dəyişəndə user notification alır.
6. Expiry düzgün işləyir.
7. Audit history saxlanılır.

---

# 187. Acceptance Criteria — User Dashboard

Bütün əsas səhifələr işləməlidir:

- Profile
- Favorites
- Saved Searches
- Recently Viewed
- Meetings
- Reservations
- Notifications
- Requests
- Settings

Heç bir səhifə placeholder olmamalıdır.

---

# 188. Definition of Done

Hər yeni funksiya aşağıdakılar olmadan tamamlanmış hesab edilməməlidir:

- işlək UI;
- mobile layout;
- backend/API;
- authorization;
- validation;
- loading state;
- error state;
- empty state;
- analytics event;
- audit tələb olunursa audit;
- tests;
- accessibility;
- documentation.

---

# 189. Məhsulun əsas fərqləndiriciləri

LuxeHomeEstate-in əsas üstünlüyü yalnız çox elan saxlaması deyil.

Əsas fərqləndirici kombinasiya:

**Advanced Property Search**

+

**Saved Searches & Alerts**

+

**Agent/Agency Profiles**

+

**Neighborhood Intelligence**

+

**AI Property Assistant**

+

**Semantic Search**

+

**AI Match Score**

+

**AI Chatbot**

+

**Price Intelligence**

+

**Personalized Recommendations**

olmalıdır.

---

# 190. Yekun məhsul arxitekturası

```text
PUBLIC PLATFORM
│
├── Search
│   ├── Classic Filters
│   ├── Map
│   ├── Saved Search
│   └── Semantic AI Search
│
├── Properties
│   ├── Detail
│   ├── Price History
│   ├── Nearby
│   ├── QR
│   ├── Sharing
│   └── Premium
│
├── Discovery
│   ├── Neighborhoods
│   ├── Agents
│   ├── Agencies
│   ├── Developers
│   └── Complexes
│
├── AI
│   ├── Property Assistant
│   ├── Match Score
│   ├── Chatbot
│   ├── Description Generator
│   └── Photo Advisor
│
├── USER
│   ├── Favorites
│   ├── Saved Searches
│   ├── Recently Viewed
│   ├── Compare
│   ├── Alerts
│   ├── Meetings
│   ├── Reservations
│   └── Notifications
│
└── CONVERSION
    ├── Call
    ├── WhatsApp
    ├── Message
    ├── Meeting
    ├── Reservation
    └── Lead
```

---

# 191. Son məhsul prinsipi

LuxeHomeEstate-də istifadəçi yalnız:

> “Elanlara baxan şəxs”

kimi qəbul edilməməlidir.

Sistem onun:

- nə axtardığını;
- hansı əmlaklara baxdığını;
- nələri favoritə əlavə etdiyini;
- hansı büdcəyə üstünlük verdiyini;
- hansı rayonları seçdiyini;
- qiymət düşmələrinə maraq göstərib-göstərmədiyini

icazə verilən çərçivədə anlayaraq daha yaxşı əmlak tapmasına kömək etməlidir.

Bu səbəbdən sistemin əsas dövrəsi:

```text
Axtar
↓
Kəşf et
↓
Müqayisə et
↓
Saxla
↓
Bildiriş al
↓
Agentlə əlaqə saxla
↓
Görüş təyin et
↓
Rezervasiya et
↓
Əməliyyatı tamamla
```

olmalıdır.

LuxeHomeEstate-in hədəfi klassik əmlak elan saytından **AI-assisted, data-driven və personalizasiya olunan Real Estate Marketplace Platform** səviyyəsinə yüksəlməkdir.