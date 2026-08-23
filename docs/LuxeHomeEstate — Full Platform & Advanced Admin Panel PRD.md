# LuxeHomeEstate — Full Platform & Advanced Admin Panel PRD

**Document Type:** Product Requirements Document  
**Product:** LuxeHomeEstate  
**Scope:** Public Platform + User Profiles + Agency Management + Advanced Admin Panel  
**Priority:** Production Readiness / Core Platform Rebuild  
**Status:** Required  
**Default Language:** Azərbaycan dili  
**Architecture Goal:** Scalable, auditable, role-based, multi-language real-estate platform

---

# 1. Layihənin məqsədi

LuxeHomeEstate yalnız əmlak elanlarının göstərildiyi sadə sayt deyil, aşağıdakı komponentləri birləşdirən tam idarə olunan əmlak platformasına çevrilməlidir:

- əmlak elanları;
- fərdi istifadəçi profilləri;
- agent profilləri;
- agentlik profilləri;
- agentlik əməkdaş sistemi;
- CRM;
- lead idarəetməsi;
- moderasiya;
- paket və ödəniş sistemi;
- reklam;
- CMS;
- SEO;
- analitika;
- bildiriş sistemi;
- təhlükəsizlik;
- audit;
- sistem sağlamlığı;
- media idarəetməsi;
- admin idarəetməsi.

Admin panel sadəcə məlumat göstərən interfeys deyil, platformanın bütün biznes proseslərini idarə edə bilən mərkəzi idarəetmə sistemi olmalıdır.

---

# 2. Əsas məqsədlər

Sistem aşağıdakı məqsədlərə cavab verməlidir:

1. Platformanın bütün əsas məlumatları admin paneldən idarə edilə bilməlidir.
2. Kod daxilində hard-code edilmiş biznes məlumatları minimuma endirilməlidir.
3. Dəyişdirilə bilən konfiqurasiyalar Database-backed Settings sisteminə keçirilməlidir.
4. İstifadəçi və agentlik profilləri tam hazırlanmalıdır.
5. Agentliklər öz daxili əməkdaşlarını idarə edə bilməlidir.
6. RBAC permission sistemi bütün platformada tətbiq edilməlidir.
7. Yeni elanlar moderasiyadan keçmədən canlı yayımlanmamalıdır.
8. Bütün kritik əməliyyatlar audit edilə bilməlidir.
9. Sistem çoxdilli işləməlidir.
10. Sistem default olaraq Light Theme ilə açılmalıdır.
11. İstifadəçi theme seçimini profil parametrlərindən dəyişə bilməlidir.
12. Admin panel bütün ekran ölçülərində responsive olmalıdır.
13. Media yükləmə sistemi etibarlı və stabil işləməlidir.
14. SEO sistemi tam idarə olunan olmalıdır.
15. Statistikalar real backend məlumatlarından hesablanmalıdır.
16. Admin paneldə bütün resurslar üçün BREAD/CRUD əməliyyatları təmin edilməlidir.
17. Yazma və oxuma əməliyyatlarının ayrılması üçün CQRS modeli tətbiq edilməlidir.
18. Kritik dəyişikliklər event jurnalında saxlanmalıdır.
19. Soft Delete + Restore tətbiq edilməlidir.
20. Platforma production səviyyəli təhlükəsizlik tələblərinə cavab verməlidir.

---

# 3. Mövcud kritik problemlər — P0

Aşağıdakı problemlər yeni funksiyalardan əvvəl və ya onlarla paralel olaraq həll edilməlidir.

## 3.1 Admin əməliyyat xətaları

Hazırda admin paneldə müxtəlif əməliyyatlar xəta qaytarır.

Tələb:

- bütün admin səhifələri ayrıca yoxlanılmalıdır;
- frontend console error-ları yoxlanılmalıdır;
- failed API request-lər müəyyən edilməlidir;
- backend exception-lar loglanmalıdır;
- validation error-ları istifadəçiyə düzgün göstərilməlidir;
- generic `500 Internal Server Error` istifadəçiyə birbaşa göstərilməməlidir.

Hər admin əməliyyatı üçün:

- success;
- validation error;
- authorization error;
- not found;
- conflict;
- server error

halları düzgün idarə edilməlidir.

---

# 3.2 Şəkil yükləmə sistemi işləmir

Admin paneldən hazırda şəkil yükləmək mümkün deyil.

Media upload sistemi tam yenidən yoxlanılmalıdır.

Dəstəklənən formatlar minimum:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

Əlavə olaraq sistem source faylın MIME type-ını yoxlamalıdır.

Yalnız fayl extension-a etibar edilməməlidir.

Yükləmə zamanı:

- file size validation;
- MIME validation;
- image decode validation;
- təhlükəli metadata təmizlənməsi;
- avtomatik compression;
- thumbnail generation;
- unique filename;
- media ownership;
- upload progress;
- retry;
- error handling

olmalıdır.

Media upload uğursuz olarsa konkret səbəb göstərilməlidir.

Məsələn:

> Şəkil yüklənmədi: maksimal fayl ölçüsü 15 MB-dır.

və ya:

> Fayl şəkil kimi doğrulana bilmədi.

---

# 3.3 Admin → İstifadəçilər səhifəsi açılmır

İstifadəçi modulu tam audit edilməlidir.

Aşağıdakılar işləməlidir:

- list;
- pagination;
- search;
- filtering;
- sorting;
- detail view;
- create;
- update;
- suspend;
- block;
- restore;
- delete;
- audit history;
- login history;
- report history.

---

# 3.4 Admin → Parametrlər funksional deyil

Parametrlər sistemi yenidən qurulmalıdır.

Kod daxilində dəyişdirilə bilən biznes məlumatlarının böyük hissəsi:

**Settings Registry**

sisteminə daşınmalıdır.

Admin paneldən aşağıdakılar idarə edilə bilməlidir:

- sayt adı;
- logo;
- favicon;
- əlaqə məlumatları;
- telefon;
- e-mail;
- sosial şəbəkələr;
- default language;
- available languages;
- default theme;
- elan limitləri;
- media limitləri;
- moderasiya parametrləri;
- SEO defaults;
- notification settings;
- maintenance mode;
- registration settings;
- agency employee limit;
- pagination defaults;
- feature flags;
- currency options;
- listing expiry duration;
- premium listing duration;
- lead settings.

Admin arbitrary source code dəyişməməlidir.

Bunun əvəzinə dəyişdirilə bilən dəyərlər təhlükəsiz konfiqurasiya registrinə çıxarılmalıdır.

---

# 3.5 Admin → SEO Audit boşdur

SEO Audit real analiz sistemi olmalıdır.

Sadəcə boş səhifə qəbul edilmir.

SEO Audit minimum aşağıdakı yoxlamaları aparmalıdır:

- title mövcuddur?
- title uzunluğu;
- description mövcuddur?
- description uzunluğu;
- canonical;
- robots;
- H1;
- duplicate H1;
- missing alt;
- broken internal link;
- redirect chain;
- noindex səhifələr;
- sitemap status;
- sitemap coverage;
- canonical conflict;
- duplicate title;
- duplicate description;
- orphan SEO pages;
- schema status;
- OpenGraph metadata;
- Twitter metadata;
- URL slug;
- language alternate links;
- structured data validation.

Nəticələr:

- Critical;
- Error;
- Warning;
- Recommendation;
- Passed

kimi qruplaşdırılmalıdır.

---

# 4. Çoxdilli sistem — i18n

Platforma tam multi-language architecture ilə qurulmalıdır.

Dil sistemi yalnız frontend düymələrinin tərcüməsi ilə məhdudlaşmamalıdır.

Aşağıdakılar lokallaşdırıla bilməlidir:

- UI;
- navigasiya;
- validation messages;
- error messages;
- e-mail template-ləri;
- notifications;
- CMS pages;
- FAQ;
- kateqoriyalar;
- property attributes;
- SEO metadata;
- agentlik təsvirləri;
- əmlak təsvirləri;
- sistem statuslarının istifadəçiyə göstərilən adları.

## Dil seçimi

Header-də language selector olmalıdır.

İstifadəçi dil seçdikdə seçim:

- hesabında;
- cookie/local storage-da;
- session-da

uyğun şəkildə saxlanmalıdır.

Login olunmuş istifadəçi üçün account preference əsas götürülməlidir.

## URL strategiyası

Tövsiyə:

`/az/...`

`/en/...`

`/ru/...`

kimi locale-aware URL strukturu.

SEO baxımından hər dil üçün:

`hreflang`

dəstəyi olmalıdır.

## Admin

Admin paneldə:

**Content → Translations**

və ya uyğun lokalizasiya sistemi nəzərdə tutula bilər.

Admin bir məzmunun müxtəlif dillərdə variantlarını idarə edə bilməlidir.

---

# 5. Theme sistemi

Platformanın varsayılan görünüşü:

**Light Theme**

olmalıdır.

Anonymous istifadəçilər ilk girişdə Light Theme görməlidir.

Login olmuş istifadəçilər:

**Profil → Parametrlər → Görünüş**

bölməsindən seçim edə bilməlidir:

- Light;
- Dark;
- System.

İstifadəçi seçimi database-də:

`theme_preference`

kimi saxlanmalıdır.

Prioritet:

1. User Preference
2. System Preference
3. Default Light Theme

Theme dəyişdirilməsi səhifənin reload olunmasını tələb etməməlidir.

---

# 6. İstifadəçi profil sistemi

Hazırda mövcud olmayan detallı istifadəçi profil səhifəsi hazırlanmalıdır.

URL nümunəsi:

`/profile/{username}`

və ya

`/users/{id}`

## Profil məlumatları

- profil şəkli;
- cover image;
- ad;
- soyad;
- username;
- hesab tipi;
- verification badge;
- bio;
- telefon;
- e-mail görünürlük parametri;
- lokasiya;
- qeydiyyat tarixi;
- son aktivlik;
- sosial media bağlantıları;
- elanlar;
- favoritlər;
- baxış statistikası;
- verified status.

## Profil bölmələri

### Overview

Ümumi profil məlumatları.

### Listings

İstifadəçinin aktiv elanları.

### Reviews

Gələcək istifadə üçün rəy sistemi.

### Activity

İstifadəçinin public fəaliyyətləri.

### Contact

İcazə verilmiş əlaqə məlumatları.

---

# 7. Profil məxfiliyi

İstifadəçi aşağıdakı məlumatların görünürlüyünü seçə bilməlidir:

- telefon;
- e-mail;
- son aktivlik;
- sosial media;
- location;
- activity.

Mümkün seçimlər:

- Public
- Registered Users
- Private

---

# 8. Agentlik profil sistemi

Hər agentliyin ayrıca detallı səhifəsi olmalıdır.

URL:

`/agencies/{slug}`

## Agentlik məlumatları

- logo;
- cover;
- rəsmi ad;
- verification badge;
- description;
- telefon;
- e-mail;
- website;
- ünvan;
- xəritə koordinatı;
- iş saatları;
- sosial media;
- yaranma tarixi;
- platformaya qoşulma tarixi;
- aktiv elan sayı;
- satılıq elanlar;
- kirayə elanlar;
- əməkdaşlar;
- agentlik statistikası.

## Agentlik tabs

- Overview
- Properties
- Employees
- About
- Contact

---

# 9. Agentlik əməkdaş sistemi

Agentliyin əməkdaşlarının ayrıca agentlik profili yaratması tələb olunmamalıdır.

Hər agentliyin bir:

**Agency Owner**

hesabı olmalıdır.

Default limit:

**1 Owner + maksimum 3 Employee**

olmalıdır.

## Əməkdaş məlumatları

- ad;
- soyad;
- avatar;
- vəzifə;
- rol;
- telefon;
- bio;
- employee ID;
- status;
- yaradılma tarixi;
- verification status.

---

# 10. Agentlik əməkdaş e-mail modeli

Agentliyin rəsmi e-maili:

`info@agency.az`

olarsa əməkdaş üçün alias belə ola bilər:

`info+ali@agency.az`

və ya:

`info+sales@agency.az`

Lakin sistem real authentication baxımından eyni e-mail ünvanını bir neçə hesaba bağlamamalıdır.

Hər əməkdaş ayrıca:

- user ID;
- username;
- authentication identity;
- password;
- session;
- audit history

sahib olmalıdır.

Agentliyin rəsmi e-maili:

- recovery;
- notification;
- administrative communication

ünvanı kimi istifadə edilə bilər.

`+alias` mexanizmi yalnız mail provider bunu dəstəklədiyi halda real e-mail kimi istifadə edilməlidir.

---

# 11. Employee Approval Workflow

Yeni əməkdaş yaradıldıqda avtomatik aktivləşdirilməməlidir.

Workflow:

`Draft`

→ `Pending Admin Approval`

→ `Approved`

və ya:

→ `Rejected`

Əlavə statuslar:

- Suspended
- Deactivated
- Archived

Hər yeni profil ayrıca admin təsdiqindən keçməlidir.

Admin rədd etdikdə səbəb daxil etməlidir.

---

# 12. Agentlik əməkdaş limiti

Default:

`max_employees = 3`

Bu limit həm frontend, həm backend səviyyəsində tətbiq edilməlidir.

Admin xüsusi agentlik üçün limiti dəyişə bilməlidir.

Məsələn:

`3 → 5`

və ya:

`3 → 20`

Bu gələcəkdə subscription paketlərinə bağlanmalıdır.

---

# 13. Agentlik rolları

Minimum:

## Agency Owner

Tam idarəetmə.

## Agency Manager

Əməkdaş, elan və lead idarəetməsi.

## Agent

Öz elanları və lead-ləri.

## Content Manager

Elan məzmunu və media.

## Viewer

Read-only giriş.

---

# 14. RBAC — Role Based Access Control

Sistem yalnız frontend menu gizlətməklə permission idarə etməməlidir.

Permission backend səviyyəsində yoxlanmalıdır.

Nümunələr:

`property.view`

`property.create`

`property.edit`

`property.delete`

`property.approve`

`property.reject`

`property.restore`

`user.view`

`user.edit`

`user.suspend`

`agency.view`

`agency.edit`

`agency.employee.create`

`agency.employee.approve`

`moderation.review`

`finance.view`

`finance.refund`

`seo.manage`

`settings.manage`

`audit.view`

`security.block_ip`

---

# 15. Admin rolları

Minimum admin rolları:

## Super Admin

Tam sistem girişi.

## Admin

Əsas platforma idarəetməsi.

## Moderator

Moderasiya.

## Support

İstifadəçi və müraciət dəstəyi.

## Finance Manager

Ödənişlər və paketlər.

## SEO Manager

SEO və CMS.

## Analyst

Read-only analitika.

Custom role sistemi dəstəklənməlidir.

---

# 16. Admin Panel əsas strukturu

```text
Dashboard

Properties
 ├─ All Properties
 ├─ Pending
 ├─ Active
 ├─ Rejected
 ├─ Expired
 ├─ Reported
 └─ Archived

Users
 ├─ All Users
 ├─ Agents
 ├─ Verified
 ├─ Suspended
 └─ Reports

Agencies
 ├─ All Agencies
 ├─ Pending
 ├─ Employees
 ├─ Verification
 └─ Packages

CRM
 ├─ Leads
 ├─ Requests
 └─ Meetings

Property Management
 ├─ Categories
 ├─ Attributes
 ├─ Locations
 ├─ Residential Complexes
 └─ Developers

Moderation
 ├─ Pending Reviews
 ├─ Reports
 ├─ Duplicate Detection
 └─ Moderation Rules

Finance
 ├─ Transactions
 ├─ Subscriptions
 ├─ Packages
 ├─ Coupons
 └─ Invoices

Marketing
 ├─ Featured Listings
 ├─ Banners
 ├─ Promotions
 └─ Campaigns

Content
 ├─ Pages
 ├─ Blog
 ├─ FAQ
 └─ Media

SEO
 ├─ SEO Audit
 ├─ Metadata
 ├─ Sitemap
 ├─ Redirects
 ├─ Schema
 └─ SEO Pages

Analytics
 ├─ Overview
 ├─ Properties
 ├─ Searches
 ├─ Users
 ├─ Agencies
 └─ Revenue

Notifications
 ├─ Notifications
 ├─ Email Templates
 └─ Delivery Logs

Security
 ├─ Admin Roles
 ├─ Permissions
 ├─ Login Logs
 ├─ Sessions
 ├─ Blocked IPs
 └─ Audit Logs

System
 ├─ General Settings
 ├─ Feature Flags
 ├─ Integrations
 ├─ Cron Jobs
 ├─ System Health
 ├─ Backup
 └─ Maintenance
```

---

# 17. CRUD + BREAD tələbi

Admin paneldə bütün uyğun resurslar üçün:

**BREAD**

- Browse
- Read
- Edit
- Add
- Delete

və tam:

**CRUD**

- Create
- Read
- Update
- Delete

dəstəyi olmalıdır.

Əlavə olaraq domain-specific əməliyyatlar ayrıca command kimi işləməlidir.

Məsələn:

- ApproveProperty
- RejectProperty
- ArchiveProperty
- RestoreProperty
- SuspendUser
- VerifyAgency
- AssignLead
- CancelSubscription

Sadəcə generic CRUD endpoint-ləri kifayət deyil.

---

# 18. CQRS

Read və Write əməliyyatları məntiqi olaraq ayrılmalıdır.

## Commands

Məsələn:

`CreatePropertyCommand`

`UpdatePropertyCommand`

`ApprovePropertyCommand`

`RejectPropertyCommand`

`SuspendUserCommand`

`ApproveAgencyEmployeeCommand`

## Queries

Məsələn:

`GetPropertyQuery`

`SearchPropertiesQuery`

`GetDashboardStatsQuery`

`GetAgencyEmployeesQuery`

`GetModerationQueueQuery`

Complex dashboard və analitika üçün ayrıca optimallaşdırılmış read model-lər istifadə edilə bilər.

---

# 19. Event sistemi və Event Sourcing

Bütün kritik mutasiyalar event şəklində qeyd edilməlidir.

Məsələn:

`PropertyCreated`

`PropertyUpdated`

`PropertyPriceChanged`

`PropertySubmitted`

`PropertyApproved`

`PropertyRejected`

`UserSuspended`

`AgencyVerified`

`AgencyEmployeeApproved`

`LeadAssigned`

`PaymentCompleted`

`SubscriptionActivated`

`AdminSettingChanged`

Minimum event məlumatı:

- event ID;
- aggregate type;
- aggregate ID;
- event type;
- actor;
- timestamp;
- old value;
- new value;
- request ID;
- correlation ID;
- IP;
- metadata.

Bu event-lər audit və tarixçənin əsasını təşkil etməlidir.

---

# 20. Dashboard

Dashboard real vaxt və ya yaxın real-vaxt məlumatlarını göstərməlidir.

KPI cards:

- ümumi elanlar;
- aktiv elanlar;
- pending elanlar;
- rejected elanlar;
- istifadəçilər;
- yeni istifadəçilər;
- agentliklər;
- pending agentliklər;
- lead-lər;
- müraciətlər;
- gəlir;
- premium elanlar;
- aktiv subscriptions;
- gözləyən moderasiyalar.

---

# 21. Dashboard qrafikləri

Minimum:

### Elan sayı

- günlük;
- həftəlik;
- aylıq;
- illik.

### Satılıq vs Kirayə

Müqayisəli statistika.

### Ən çox baxılan ərazilər

Top N location.

### Ən çox axtarılan qiymət intervalı

Məsələn:

- 0–50k
- 50–100k
- 100–150k
- 150–250k
- 250k+

### Ən aktiv agentliklər

Elan və engagement əsasında.

### Conversion Rate

Formula:

`contact actions / property views × 100`

### Engagement funnel

`Property View`

→ `Contact Click`

→ `Phone Click`

→ `WhatsApp Click`

→ `Lead`

→ `Meeting`

→ `Conversion`

---

# 22. Properties modul

Admin aşağıdakı əməliyyatları edə bilməlidir:

- elan yaratmaq;
- redaktə etmək;
- preview;
- approve;
- reject;
- suspend;
- archive;
- restore;
- soft delete;
- permanent delete;
- premium etmək;
- premium ləğv etmək;
- expiration dəyişmək;
- owner dəyişmək;
- agency dəyişmək;
- responsible agent dəyişmək;
- status dəyişmək;
- media idarə etmək;
- moderation history görmək;
- reports görmək.

---

# 23. Elan lifecycle

Tövsiyə edilən statuslar:

`DRAFT`

→ `SUBMITTED`

→ `AUTOMATED_REVIEW`

→ `PENDING_MODERATION`

→ `APPROVED`

→ `ACTIVE`

Alternativ:

`REJECTED`

və ya:

`REQUIRES_CHANGES`

Aktiv elandan:

`ACTIVE`

→ `SUSPENDED`

→ `ARCHIVED`

→ `EXPIRED`

və ya:

→ `SOLD`

→ `RENTED`

Silinmə:

`SOFT_DELETED`

→ `RESTORED`

və yalnız Super Admin:

→ `PERMANENTLY_DELETED`

---

# 24. Moderasiya sistemi

Yeni elan birbaşa public yayıma çıxmamalıdır.

Workflow:

1. İstifadəçi elan yaradır.
2. Sistem validation edir.
3. Avtomatik moderasiya başlayır.
4. Risk score hesablanır.
5. Elan moderator queue-ya daxil olur.
6. Moderator qərar verir.
7. Təsdiqlənərsə publish edilir.
8. Rədd edilərsə səbəb istifadəçiyə bildirilir.

---

# 25. Avtomatik moderasiya yoxlamaları

Minimum:

- telefon nömrəsi;
- qadağan edilmiş sözlər;
- URL;
- spam;
- qeyri-real qiymət;
- duplicate elan;
- duplicate şəkil;
- aşağı keyfiyyətli şəkil;
- watermark;
- saxta lokasiya;
- yanlış kateqoriya;
- mətn və şəkil uyğunsuzluğu;
- contact info in description;
- suspicious repeated submission;
- excessive capitalization;
- duplicate description;
- image count;
- invalid coordinates.

---

# 26. Moderation Risk Score

Sistem hər elan üçün risk score hesablaya bilər.

Məsələn:

`0–20` Low Risk

`21–50` Medium Risk

`51–75` High Risk

`76–100` Critical Risk

Risk faktorları moderatora ayrıca göstərilməlidir.

---

# 27. Moderator rədd səbəbləri

Hazır seçimlər:

- Yanlış qiymət
- Yanlış kateqoriya
- Şəkillər uyğun deyil
- Məlumat natamamdır
- Duplicate elan
- Spam
- Saxta elan
- Əlaqə məlumatı yanlışdır
- Yanlış lokasiya
- Qadağan edilmiş məzmun
- Digər

`Digər` seçildikdə əlavə izah məcburi olmalıdır.

---

# 28. Duplicate Detection

Duplicate elan aşağıdakılar üzrə yoxlanmalıdır:

- title similarity;
- description similarity;
- telefon;
- location;
- price;
- property attributes;
- image perceptual hash.

Confidence score göstərilməlidir.

Məsələn:

> Possible Duplicate — 91%

Moderator iki elanı yan-yana müqayisə edə bilməlidir.

---

# 29. İstifadəçilər modulu

Admin görə bilməlidir:

- user ID;
- ad;
- soyad;
- username;
- e-mail;
- telefon;
- role;
- verification;
- status;
- registration date;
- last login;
- active listing count;
- reports;
- security flags.

Əməliyyatlar:

- Edit
- Verify
- Unverify
- Suspend
- Unsuspend
- Block
- Reset verification
- Force logout
- Soft delete
- Restore

---

# 30. Agentliklər modulu

Agentlik məlumatları:

- profile;
- owner;
- employees;
- employee limit;
- package;
- verification;
- subscriptions;
- listings;
- leads;
- reports;
- performance;
- audit history.

Admin:

- approve;
- reject;
- suspend;
- verify;
- unverify;
- change employee limit;
- change package;
- employee approve/reject;
- force logout;
- deactivate agency

əməliyyatları edə bilməlidir.

---

# 31. CRM

CRM modulu minimum:

- Leads
- Requests
- Meetings

idarə etməlidir.

Lead məlumatları:

- customer;
- property;
- source;
- assigned agent;
- agency;
- status;
- priority;
- notes;
- created date;
- last interaction;
- follow-up date.

---

# 32. Lead statusları

- New
- Contacted
- Qualified
- Interested
- Viewing Scheduled
- Negotiation
- Won
- Lost
- Spam

---

# 33. Lead Assignment

Lead:

- manual;
- round-robin;
- agency rule;
- location;
- property responsible agent

əsasında təyin edilə bilər.

Assignment dəyişiklikləri audit olunmalıdır.

---

# 34. Property Management

## Categories

- Mənzil
- Villa
- Həyət evi
- Torpaq
- Obyekt
- Ofis
- Qaraj
- Digər

Admin yeni kateqoriya yarada bilməlidir.

## Attributes

Dynamic property attributes.

Məsələn:

- otaq sayı;
- sahə;
- mərtəbə;
- təmir;
- sənəd;
- istilik sistemi;
- parking.

Attribute-lar category-yə bağlana bilməlidir.

---

# 35. Lokasiya sistemi

Hierarchy:

`Country`

→ `City`

→ `District`

→ `Settlement`

→ `Street`

→ `Residential Complex`

Məlumatlar admin paneldən idarə edilməlidir.

Location üçün:

- latitude;
- longitude;
- slug;
- SEO metadata;
- active status

olmalıdır.

---

# 36. Residential Complexes

Kompleks məlumatları:

- name;
- developer;
- address;
- coordinates;
- description;
- completion year;
- images;
- amenities;
- properties.

---

# 37. Developers

Developer şirkətlər üçün ayrıca entity olmalıdır.

Məlumat:

- name;
- logo;
- description;
- contact;
- website;
- projects;
- verification.

---

# 38. Finance

Finance bölməsi:

- Transactions
- Subscriptions
- Packages
- Coupons
- Invoices

modullarından ibarət olmalıdır.

---

# 39. Paket sistemi

Məsələn:

## Individual

Məhdud elan.

## Agent

Əlavə imkanlar.

## Agency Basic

1 Owner + müəyyən employee limiti.

## Agency Professional

1 Owner + 3 employee.

## Enterprise

Custom limits.

Admin paket parametrlərini dəyişə bilməlidir.

---

# 40. Ödəniş əməliyyatları

Transaction status:

- Pending
- Authorized
- Completed
- Failed
- Cancelled
- Refunded
- Partially Refunded

Transaction məlumatları sonradan dəyişdirilə bilməməlidir.

Manual adjustment ayrıca audit event yaratmalıdır.

---

# 41. Marketing

Marketing bölməsində:

- Featured Listings
- Banners
- Promotions
- Campaigns

olmalıdır.

Banner üçün:

- placement;
- image;
- mobile image;
- target URL;
- start date;
- end date;
- status;
- impressions;
- clicks;
- CTR.

---

# 42. CMS

Admin paneldən aşağıdakı səhifələr idarə edilə bilməlidir:

- Ana səhifə;
- Haqqımızda;
- Əlaqə;
- FAQ;
- Privacy Policy;
- Terms;
- Cookie Policy;
- digər landing pages.

CMS content multi-language olmalıdır.

---

# 43. Blog

Blog sistemi:

- posts;
- categories;
- tags;
- author;
- cover;
- status;
- publish date;
- SEO;
- translations.

Status:

- Draft
- Scheduled
- Published
- Archived

---

# 44. Media Library

Bütün media mərkəzləşdirilmiş Media Library-də idarə edilməlidir.

Məlumat:

- file;
- preview;
- filename;
- type;
- MIME;
- size;
- dimensions;
- owner;
- usage references;
- uploaded by;
- uploaded date.

Əməliyyatlar:

- upload;
- replace;
- delete;
- copy URL;
- edit alt;
- edit title;
- search;
- filter.

---

# 45. Watermark sistemi

Property şəkillərinə watermark tətbiq edilə bilməlidir.

Admin parametrləri:

- enabled;
- watermark image;
- opacity;
- position;
- size;
- margin.

Original image ayrıca saxlanmalıdır.

Watermark edilmiş versiya delivery üçün istifadə edilə bilər.

Watermark əməliyyatı idempotent olmalıdır.

Bir şəkilə təkrar-təkrar watermark vurulmamalıdır.

---

# 46. SEO Metadata

Admin idarə edə bilməlidir:

- title;
- meta description;
- keywords;
- canonical;
- robots;
- OpenGraph;
- Twitter Card;
- structured data;
- hreflang;
- slug.

SEO metadata:

- global;
- page-specific;
- property-specific;
- category-specific;
- location-specific

ola bilər.

---

# 47. Sitemap

Sitemap avtomatik yaradılmalıdır.

Minimum:

- pages;
- properties;
- agencies;
- categories;
- locations;
- blog.

Sitemap index dəstəyi olmalıdır.

Admin:

- regenerate;
- view status;
- last generated;
- URL count;
- errors

görə bilməlidir.

---

# 48. Redirect Manager

Admin:

`old URL`

→ `new URL`

redirect yarada bilməlidir.

Dəstəklənən:

- 301
- 302
- 307
- 308

Redirect loop qarşısı alınmalıdır.

---

# 49. Schema Manager

Minimum Schema.org:

- Organization
- RealEstateAgent
- BreadcrumbList
- WebSite
- SearchAction
- Article
- FAQPage

strukturlarının idarə olunması nəzərdə tutulmalıdır.

---

# 50. Analytics

Analytics real backend event-ləri üzərindən qurulmalıdır.

Minimum event-lər:

`property_view`

`search`

`filter_applied`

`favorite_added`

`phone_clicked`

`whatsapp_clicked`

`contact_clicked`

`lead_created`

`agency_viewed`

`share_clicked`

---

# 51. Property Analytics

Hər elan üzrə:

- views;
- unique views;
- favorites;
- phone clicks;
- WhatsApp clicks;
- contact clicks;
- leads;
- conversion;
- traffic source;
- device;
- location.

---

# 52. Search Analytics

Admin görə bilməlidir:

- ən çox axtarılan söz;
- ən çox seçilən location;
- price ranges;
- rooms;
- category;
- transaction type;
- zero-result searches.

Xüsusilə:

**Zero Result Searches**

gələcək məhsul qərarları üçün ayrıca göstərilməlidir.

---

# 53. Agency Analytics

- listing count;
- views;
- leads;
- conversions;
- employee performance;
- response time;
- premium usage;
- listing approval rate.

---

# 54. Bildiriş sistemi

Dəstəklənən channel-lar:

- in-app;
- e-mail;
- gələcəkdə push/SMS.

Bildiriş nümunələri:

- elan təsdiqləndi;
- elan rədd edildi;
- elan bitir;
- yeni lead;
- employee approved;
- agency approved;
- payment completed;
- subscription expires;
- security alert.

---

# 55. Email Templates

Admin paneldən template-lər dəyişdirilə bilməlidir.

Template məlumatları:

- key;
- subject;
- body;
- locale;
- variables;
- status.

Məsələn:

`{{user_name}}`

`{{property_title}}`

`{{agency_name}}`

---

# 56. Delivery Logs

Hər göndəriş üçün:

- recipient;
- template;
- channel;
- queued;
- sent;
- delivered;
- failed;
- error;
- retry count;
- timestamp

saxlanmalıdır.

---

# 57. Audit Log

Audit log dəyişdirilə və silinə bilməməlidir.

Minimum:

- actor;
- action;
- entity type;
- entity ID;
- before;
- after;
- timestamp;
- IP;
- user agent;
- request ID;
- correlation ID.

---

# 58. Audit nümunəsi

```text
23.08.2026 21:37

Actor:
admin@example

Action:
PROPERTY_PRICE_CHANGED

Property:
#LH-10482

Before:
175000 AZN

After:
169000 AZN

IP:
xxx.xxx.xxx.xxx
```

---

# 59. Login Logs

Security paneldə:

- user;
- login time;
- IP;
- device;
- browser;
- result;
- failure reason;
- country/region approximation

göstərilməlidir.

---

# 60. Sessiyalar

Admin aktiv sessiyaları görə bilməlidir.

Əməliyyat:

**Revoke Session**

və:

**Logout From All Devices**

olmalıdır.

---

# 61. Blocked IPs

Admin:

- IP;
- CIDR;
- reason;
- expiration;
- created by

məlumatları ilə block qaydası yarada bilməlidir.

Permanent və temporary block dəstəyi olmalıdır.

---

# 62. Rate Limiting

Minimum qoruma:

- login;
- registration;
- password reset;
- search API;
- contact;
- lead;
- upload;
- admin API.

---

# 63. General Settings

General Settings aşağıdakılara nəzarət etməlidir:

### Site

- site name;
- domain;
- logo;
- favicon.

### Contact

- phone;
- e-mail;
- address.

### Locale

- default language;
- enabled languages;
- timezone;
- currency.

### Property

- expiry;
- listing limits;
- image limits.

### Agency

- default employee limit.

### Moderation

- moderation enabled;
- auto approval rules.

### SEO

- default title;
- default description.

---

# 64. Kodda saxlanılan məlumatlar

Hazırda source code daxilində saxlanılan və biznes baxımından dəyişdirilə bilən məlumatlar müəyyən edilməlidir.

Bunlar kateqoriyalara ayrılmalıdır:

## Immutable technical constants

Admin tərəfindən dəyişdirilməməlidir.

## Business configuration

Settings Registry-yə daşınmalıdır.

Məsələn:

`DEFAULT_AGENCY_EMPLOYEE_LIMIT = 3`

yerinə:

`settings.agency.default_employee_limit`

istifadə edilməlidir.

---

# 65. Settings Registry

Hər setting:

- key;
- value;
- type;
- category;
- description;
- default;
- validation;
- environment;
- updated by;
- updated at;
- version

saxlamalıdır.

Type:

- string;
- integer;
- decimal;
- boolean;
- JSON;
- enum.

---

# 66. Settings dəyişiklik təhlükəsizliyi

Kritik setting dəyişdikdə:

- confirmation tələb olunmalıdır;
- audit event yaradılmalıdır;
- old/new value saxlanmalıdır.

Məsələn:

> Elanların default müddətini 30 gündən 90 günə dəyişirsiniz.

---

# 67. Feature Flags

Yeni funksiyalar deploy edilmədən və ya hamıya açılmadan idarə edilə bilməlidir.

Məsələn:

`agency_employees_enabled`

`advanced_moderation_enabled`

`payments_enabled`

`blog_enabled`

`reviews_enabled`

Flag scope:

- global;
- specific role;
- specific agency;
- percentage rollout

gələcəkdə genişləndirilə bilər.

---

# 68. Integrations

Admin görə bilməlidir:

- integration name;
- connected status;
- last success;
- last error;
- health;
- environment.

API secret-lər UI-da plain text göstərilməməlidir.

---

# 69. Cron Jobs

Admin panel cron job-ları görə bilməlidir.

Məsələn:

- expired property cleanup;
- sitemap generation;
- notification queue;
- analytics aggregation;
- subscription expiration;
- backup;
- media cleanup.

Məlumat:

- name;
- schedule;
- last run;
- next run;
- status;
- duration;
- last error.

---

# 70. System Health

System Health real monitorinq məlumatı göstərməlidir.

Minimum:

- API status;
- database status;
- storage status;
- cache status;
- queue status;
- e-mail service status;
- cron status.

Status:

- Healthy
- Degraded
- Down

---

# 71. Backup

Backup sistemi minimum:

- database backup;
- settings backup;
- critical configuration backup

dəstəkləməlidir.

Admin görə bilməlidir:

- last backup;
- backup size;
- status;
- retention;
- restore point.

Restore yüksək permission tələb etməlidir.

---

# 72. Maintenance Mode

Admin Maintenance Mode aktiv edə bilməlidir.

Parametrlər:

- enabled;
- message;
- start;
- estimated end;
- admin bypass;
- allowed IP.

---

# 73. Soft Delete

Aşağıdakı entity-lər default olaraq hard delete edilməməlidir:

- User
- Agency
- Employee
- Property
- Lead
- Page
- Blog Post
- Category

Minimum field:

`deleted_at`

`deleted_by`

Silinmiş data normal query-lərdə görünməməlidir.

---

# 74. Restore

Admin silinmiş resursu restore edə bilməlidir.

Restore audit event yaratmalıdır.

---

# 75. Permanent Delete

Permanent deletion yalnız yüksək permission ilə mümkün olmalıdır.

Məsələn:

`system.permanent_delete`

Əməliyyat əlavə təsdiq tələb etməlidir.

---

# 76. Search

Admin bütün böyük list səhifələrində search edə bilməlidir.

Məsələn Property:

- ID;
- title;
- phone;
- owner;
- agency;
- location.

Users:

- ID;
- name;
- username;
- e-mail;
- phone.

---

# 77. Filter sistemi

Filter-lər URL/query string-də saxlanmalıdır ki:

- səhifə refresh olduqda itməsin;
- link paylaşmaq mümkün olsun;
- browser back işləsin.

---

# 78. Bulk Actions

Uyğun modullarda:

- select all;
- approve;
- reject;
- archive;
- restore;
- suspend;
- delete;
- export;
- status change

bulk şəkildə icra edilə bilməlidir.

Bulk əməliyyat başlamazdan əvvəl təsir ediləcək resurs sayı göstərilməlidir.

---

# 79. Table sistemi

Admin list səhifələri aşağıdakı imkanlara malik olmalıdır:

- pagination;
- sorting;
- filtering;
- search;
- configurable columns;
- sticky header;
- bulk selection;
- row actions;
- saved filters;
- export.

---

# 80. API gözləntiləri

API:

- versioned;
- authenticated;
- authorized;
- validated;
- rate-limited;
- documented

olmalıdır.

Nümunə:

```text
/api/v1/admin/properties
/api/v1/admin/users
/api/v1/admin/agencies
/api/v1/admin/leads
/api/v1/admin/settings
/api/v1/admin/seo
```

---

# 81. Command endpoint-ləri

Domain action-lar ayrıca endpoint ola bilər.

```text
POST /api/v1/admin/properties/{id}/approve
POST /api/v1/admin/properties/{id}/reject
POST /api/v1/admin/users/{id}/suspend
POST /api/v1/admin/agencies/{id}/verify
POST /api/v1/admin/agency-employees/{id}/approve
```

---

# 82. API Error Format

Bütün API error-lar standart formatda olmalıdır.

```json
{
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Elan tapılmadı.",
    "field": null,
    "requestId": "..."
  }
}
```

---

# 83. Validation Error

Field validation:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": {
      "price": [
        "Qiymət 0-dan böyük olmalıdır."
      ]
    }
  }
}
```

---

# 84. Database əsas entity-ləri

Minimum:

- User
- UserProfile
- UserPreference
- Role
- Permission
- RolePermission
- UserRole
- Agency
- AgencyEmployee
- AgencyVerification
- Property
- PropertyMedia
- PropertyCategory
- PropertyAttribute
- PropertyAttributeValue
- Location
- ResidentialComplex
- Developer
- Lead
- LeadActivity
- Meeting
- ModerationReview
- ModerationRule
- Report
- Package
- Subscription
- Transaction
- Invoice
- Coupon
- Campaign
- Banner
- Page
- BlogPost
- FAQ
- Media
- SeoMetadata
- Redirect
- Notification
- NotificationTemplate
- DeliveryLog
- AuditLog
- LoginLog
- Session
- BlockedIP
- Setting
- FeatureFlag
- Integration
- CronJob
- Backup
- DomainEvent
- AnalyticsEvent

---

# 85. Əsas entity əlaqələri

```text
User
 ├── UserProfile
 ├── UserPreference
 ├── Properties
 └── Roles

Agency
 ├── Owner(User)
 ├── Employees
 ├── Properties
 ├── Leads
 └── Subscription

AgencyEmployee
 ├── Agency
 ├── User
 └── Role

Property
 ├── Owner
 ├── Agency
 ├── ResponsibleAgent
 ├── Category
 ├── Location
 ├── Media
 ├── Attributes
 ├── Leads
 ├── Reports
 └── ModerationReviews
```

---

# 86. Multi-tenant isolation

Agentlik məlumatlarının izolyasiyası backend səviyyəsində təmin edilməlidir.

Employee yalnız öz:

`agency_id`

scope-u daxilində əməliyyat edə bilməlidir.

Bir agentliyin employee-si başqa agentliyin:

- property;
- employee;
- lead;
- analytics;
- customer

məlumatını ID dəyişdirərək əldə edə bilməməlidir.

IDOR testləri mütləq aparılmalıdır.

---

# 87. Business Rules

Minimum:

1. Yeni property moderasiyasız ACTIVE ola bilməz.
2. Agentlik default maksimum 3 əlavə employee yarada bilər.
3. Employee admin təsdiqindən əvvəl aktiv ola bilməz.
4. Employee bir agentliyə bağlı olmalıdır.
5. Owner default employee limitinə daxil edilmir.
6. Suspended agency employee-ləri daxil ola bilməz.
7. Deleted property public göstərilməməlidir.
8. Expired subscription premium funksiyaları aktiv saxlaya bilməz.
9. Negative price qəbul edilməməlidir.
10. Property minimum media requirement qaydasına uyğun olmalıdır.
11. Audit log dəyişdirilə bilməməlidir.
12. Permission backend-də yoxlanmalıdır.

---

# 88. Error State

Hər səhifənin xəta vəziyyəti hazırlanmalıdır.

Misal:

> Məlumatları yükləmək mümkün olmadı.

Düymə:

**Yenidən cəhd et**

Texniki xəta kodu ayrıca göstərilə bilər:

`Request ID: abc123`

---

# 89. Empty State

Boş table sadəcə ağ boş sahə olmamalıdır.

Məsələn:

> Hələ heç bir agentlik əlavə edilməyib.

və uyğun action:

**Agentlik əlavə et**

və ya:

> Təsdiq gözləyən elan yoxdur.

---

# 90. Loading State

İstifadə edilməlidir:

- skeleton;
- spinner;
- progress indicator.

Full page ağ ekran göstərilməməlidir.

---

# 91. Success Feedback

CRUD əməliyyatından sonra:

- toast;
- success state;
- updated data

dərhal görünməlidir.

Məsələn:

> Agentlik uğurla təsdiqləndi.

---

# 92. Confirmation dialogs

Riskli əməliyyatlar confirmation tələb etməlidir.

Misal:

> Bu istifadəçini bloklamaq istədiyinizə əminsiniz?

Destructive action button aydın göstərilməlidir.

---

# 93. Responsive Admin Panel

Admin panel desktop-un mobil ekrana sıxışdırılmış forması olmamalıdır.

Responsive design ayrıca hazırlanmalıdır.

Desktop:

- sidebar;
- full tables;
- multi-column filters.

Tablet:

- collapsible sidebar;
- adaptive tables.

Mobile:

- drawer navigation;
- card-based records;
- bottom/compact actions;
- simplified filters;
- touch-friendly controls.

---

# 94. Accessibility

Minimum:

- keyboard navigation;
- semantic HTML;
- focus states;
- aria labels;
- contrast;
- form labels;
- screen reader compatibility.

Hədəf:

**WCAG 2.1 AA**

səviyyəsinə mümkün qədər yaxın olmaq.

---

# 95. Performance

Hədəflər:

Public API normal request:

`p95 < 500 ms`

Admin list query:

`p95 < 800 ms`

Search:

`p95 < 1 s`

Böyük list səhifələri server-side pagination istifadə etməlidir.

---

# 96. Database Performance

Minimum:

- indexes;
- query profiling;
- N+1 prevention;
- pagination;
- caching;
- aggregate tables/read models.

Analytics query-ləri production transaction query-lərini yavaşlatmamalıdır.

---

# 97. Caching

Uyğun məlumatlarda cache istifadə edilə bilər:

- categories;
- locations;
- settings;
- SEO;
- public property detail;
- agency profiles.

Cache invalidation dəqiq müəyyən edilməlidir.

---

# 98. Security

Minimum:

- secure password hashing;
- RBAC;
- CSRF protection;
- XSS protection;
- SQL injection prevention;
- secure headers;
- session security;
- rate limiting;
- input validation;
- file validation;
- audit logs;
- secrets management.

---

# 99. Admin təhlükəsizliyi

Admin üçün tövsiyə edilən:

- 2FA;
- session timeout;
- new device notification;
- suspicious login detection;
- force logout;
- IP restriction optional.

Super Admin üçün 2FA məcburi edilə bilər.

---

# 100. Logging

Log səviyyələri:

- DEBUG
- INFO
- WARN
- ERROR
- CRITICAL

Production-da həssas məlumatlar loglanmamalıdır.

Məsələn:

- password;
- token;
- payment secret;
- full session token.

---

# 101. Observability

Request-lərə:

`request_id`

və:

`correlation_id`

verilməlidir.

Frontend xəta ilə backend log eyni ID üzərindən tapıla bilməlidir.

---

# 102. Database transaction qaydaları

Bir-biri ilə əlaqəli kritik əməliyyatlar atomic transaction olmalıdır.

Məsələn:

Agency employee approval:

1. employee status update;
2. role assignment;
3. audit event;
4. notification creation

əməliyyatlarından biri uğursuz olarsa consistency qorunmalıdır.

---

# 103. Idempotency

Ödəniş, webhook və bəzi command-larda idempotency istifadə edilməlidir.

Eyni payment callback iki dəfə gəldikdə iki transaction yaradılmamalıdır.

---

# 104. Search Engine

Property search aşağıdakılar üzrə işləməlidir:

- keyword;
- category;
- location;
- price;
- rooms;
- area;
- transaction type;
- attributes.

Search query analytics event yaratmalıdır.

---

# 105. Saved Searches — Phase 2

İstifadəçi filter kombinasiyasını saxlaya bilməlidir.

Yeni uyğun elan gələndə bildiriş ala bilər.

---

# 106. Favorites

Login istifadəçilər elanları favoritə əlavə edə bilməlidir.

Favorite analitika event kimi də saxlanmalıdır.

---

# 107. Reports

İstifadəçi property-ni report edə bilməlidir.

Səbəblər:

- fake;
- duplicate;
- wrong price;
- sold;
- spam;
- wrong contact;
- inappropriate content;
- other.

Report moderator queue-ya düşməlidir.

---

# 108. Verification

İki ayrı verification modeli olmalıdır:

## User Verification

İstifadəçi təsdiqi.

## Agency Verification

Agentlik biznes təsdiqi.

Verification status public badge ilə göstərilə bilər.

---

# 109. Admin daxili qeydlər

Moderator/admin entity-lər üzərində internal note əlavə edə bilməlidir.

Bu qeydlər public və istifadəçi üçün görünməməlidir.

---

# 110. Change History

Property, User, Agency və Settings üçün dəyişiklik tarixçəsi ayrıca göstərilməlidir.

Məsələn:

```text
Price
175,000 → 169,000 AZN

Changed by:
Admin

23.08.2026 19:42
```

---

# 111. Export

Admin uyğun məlumatları:

- CSV;
- XLSX

formatında export edə bilməlidir.

Böyük export-lar background job kimi işlədilə bilər.

---

# 112. Notification Preferences

İstifadəçi profilindən hansı bildirişləri almaq istədiyini seçə bilməlidir.

Məsələn:

- property status;
- marketing;
- lead;
- security;
- subscription.

Security notification söndürülməyə bilər.

---

# 113. Admin Global Search

Admin header-də qlobal search olmalıdır.

Search:

- property;
- user;
- agency;
- lead

üzrə nəticə göstərə bilməlidir.

Məsələn:

`LH-10482`

yazdıqda birbaşa property tapılmalıdır.

---

# 114. Admin Quick Actions

Dashboard-dan:

- Add Property
- Create User
- Review Pending
- Add Agency
- Create Banner

kimi quick action-lar təqdim edilə bilər.

---

# 115. Date Range Filter

Bütün analytics səhifələrində:

- Today
- Yesterday
- Last 7 Days
- Last 30 Days
- This Month
- Last Month
- Custom

olmalıdır.

---

# 116. Admin Dashboard Personalization — Phase 2

Admin istifadəçi widget-ləri özünə görə düzəldə bilər.

Məsələn:

- hide;
- reorder;
- resize.

---

# 117. Non-functional requirements

## Availability

Production sistem stabil olmalıdır.

## Scalability

Property və analytics həcmi böyüdükcə horizontal genişlənməyə mane olan struktur qurulmamalıdır.

## Security

OWASP əsas riskləri nəzərə alınmalıdır.

## Maintainability

Business logic UI komponentlərinə dağılmamalıdır.

## Testability

Service və domain logic test edilə bilməlidir.

## Auditability

Kritik dəyişikliklər izlənilə bilməlidir.

---

# 118. Test tələbləri

Minimum:

- unit tests;
- integration tests;
- API tests;
- authorization tests;
- validation tests;
- upload tests;
- moderation workflow tests;
- agency isolation tests;
- E2E admin tests.

Xüsusilə:

**RBAC permission test matrix**

hazırlanmalıdır.

---

# 119. P0 Test Scenarios

Mütləq yoxlanmalıdır:

1. Admin login.
2. Users səhifəsi açılır.
3. User list pagination işləyir.
4. User edit işləyir.
5. Şəkil upload işləyir.
6. Property approve işləyir.
7. Property reject işləyir.
8. Agency approve işləyir.
9. Employee approve işləyir.
10. Settings save işləyir.
11. SEO Audit nəticə göstərir.
12. Soft delete işləyir.
13. Restore işləyir.
14. RBAC unauthorized əməliyyatı bloklayır.
15. Audit log event yaradır.

---

# 120. MVP — Phase 1

İlk production mərhələsi:

### Public

- multi-language foundation;
- Light/Dark/System theme;
- user profile;
- agency profile.

### Agency

- owner;
- maksimum 3 employee;
- roles;
- admin approval;
- listings assignment.

### Admin

- Dashboard;
- Properties;
- Users;
- Agencies;
- Moderation;
- Property Management;
- CMS;
- SEO;
- Settings;
- Security;
- Audit.

### Infrastructure

- working uploads;
- soft delete;
- validation;
- RBAC;
- CQRS;
- domain events;
- logs;
- backup;
- system health.

---

# 121. Phase 2

- full CRM;
- payments;
- subscriptions;
- coupons;
- invoices;
- advanced analytics;
- campaign management;
- advanced moderation;
- duplicate image detection;
- notification preferences;
- saved searches;
- automatic lead assignment;
- employee performance;
- custom agency roles;
- advanced SEO Audit.

---

# 122. Phase 3 / Future

- AI moderation;
- AI property classification;
- AI duplicate detection;
- AI SEO suggestions;
- smart pricing;
- property recommendation engine;
- advanced CRM automation;
- agency branches;
- commission tracking;
- agent leaderboard;
- mobile app;
- public API;
- webhooks;
- external CRM integrations.

---

# 123. Acceptance Criteria — Admin Panel

Admin panel production-ready hesab edilə bilməz əgər:

- hər hansı əsas menu açılmırsa;
- CRUD əməliyyatları işləmirsə;
- upload işləmir;
- RBAC backend-də tətbiq edilməyib;
- Audit Log yoxdur;
- error handling yoxdur;
- Settings yalnız placeholder-dır;
- SEO Audit boşdur;
- users səhifəsi qırıqdır;
- moderation workflow bypass edilə bilir;
- soft delete yoxdur;
- responsive davranış yoxdur;
- loading/error/empty states yoxdur.

---

# 124. Definition of Done

Hər modul tamamlanmış hesab edilməzdən əvvəl:

- UI tamamlanmalıdır;
- responsive olmalıdır;
- API işləməlidir;
- authorization işləməlidir;
- validation olmalıdır;
- error handling olmalıdır;
- empty state olmalıdır;
- loading state olmalıdır;
- audit event yaradılmalıdır;
- testlər keçməlidir;
- frontend console error olmamalıdır;
- backend unhandled exception olmamalıdır;
- documentation yenilənməlidir.

---

# 125. Əsas arxitektura prinsipi

LuxeHomeEstate admin paneli sadəcə:

**Admin UI + CRUD**

kimi qurulmamalıdır.

Hədəf struktur:

```text
UI
↓
API
↓
Authorization / Validation
↓
Command / Query Layer
↓
Domain / Business Rules
↓
Persistence
↓
Domain Events
↓
Audit / Notification / Analytics
```

Read tərəfi:

```text
UI
↓
Query API
↓
Read Models
↓
Cache / Database
```

Bu struktur gələcəkdə sistemin böyüməsini və admin əməliyyatlarının izlənməsini ciddi şəkildə asanlaşdıracaq.

---

# 126. Admin panel üçün əsas məhsul prinsipi

Admin paneldə mümkün qədər:

> “Bu məlumatı dəyişmək üçün kod dəyişmək lazımdır.”

halları aradan qaldırılmalıdır.

Biznes səviyyəli dəyişdirilə bilən məlumatlar:

- Settings;
- CMS;
- Property Management;
- SEO;
- Feature Flags;
- Moderation Rules;
- Packages;
- Notifications

vasitəsilə admin paneldən idarə edilməlidir.

Texniki və təhlükəsizlik baxımından dəyişdirilməsi riskli olan konfiqurasiyalar isə admin UI-a çıxarılmamalıdır.

---

# 127. Yekun sistem scope-u

LuxeHomeEstate aşağıdakı əsas sistemlərdən ibarət olacaq:

**Public Real Estate Platform**

+

**User Profile System**

+

**Agency Management System**

+

**Agency Employee & RBAC System**

+

**Property Management System**

+

**Moderation Engine**

+

**CRM / Lead Management**

+

**Payments & Subscription**

+

**Marketing**

+

**CMS**

+

**SEO Management & SEO Audit**

+

**Analytics**

+

**Notification System**

+

**Media & Watermark**

+

**Security Center**

+

**Audit & Event System**

+

**System Configuration**

+

**System Health & Backup**

+

**Advanced Admin Panel**

Bu struktur LuxeHomeEstate-i sadə elan saytından daha çox, idarə olunan və gələcəkdə kommersiya məqsədilə genişləndirilə bilən tam **Real Estate Management Platform** səviyyəsinə çıxarmalıdır.