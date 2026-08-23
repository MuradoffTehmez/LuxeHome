# Cari vəziyyət və yol xəritəsi

Bu səhifə 23 avqust 2026 tarixində `main@f7348b2` kod auditi və production smoke yoxlaması əsasında hazırlanıb. Prioritetlər faktiki boşluğu göstərir; buradakı maddə avtomatik olaraq təsdiqlənmiş məhsul planı demək deyil.

## Hazırlıq matrisi

| Sahə | Vəziyyət | Qeyd |
|---|---:|---|
| Production sayt | ✅ İşlək | Əsas public route-lar canlı smoke test-dən keçib |
| Əmlak kataloqu | ✅ İşlək | Geniş filtr, sort, pagination və detail |
| Xəritə | ✅ İşlək | Koordinatlı property üçün Leaflet |
| Favorit | ✅ İşlək | LocalStorage, hesabla sync deyil |
| Müqayisə | ✅ İşlək | Cookie, maksimum 4 property |
| Layihə/xidmət/bloq | ✅ İşlək | Public read və admin CRUD |
| Agentlik kataloqu | ✅ İşlək | Verification və public profil |
| Public auth | ✅ İşlək | Qeydiyyat, login, revoke edilə bilən sessiya |
| Public kabinet | 🟡 Qismən | Profil və create listing; edit/delete yoxdur |
| Staff auth | ✅ İşlək | TOTP, backup code, lockout, session guard |
| Admin CRUD | ✅ İşlək | Əsas bütün əməliyyat sahələri |
| Media | ✅ İşlək | Admin/public upload, R2, Images, thumbnail |
| Lead/əlaqə | 🟡 Qismən | D1 + Resend; anti-spam və source konteksti çatmır |
| SEO | 🟡 Qismən | Mərkəzi metadata var; sitemap yeni route-lardan geri qalır |
| Test | 🟡 Qismən | 21 unit/helper test faylı; integration/E2E yoxdur |
| CI/CD | 🔴 Yoxdur | Manual quality gate və deploy |
| Backup/DR | 🔴 Yoxdur | Avtomatlaşdırılmış export/restore drill yoxdur |
| Çoxdillilik | 🔴 Yoxdur | Yalnız Azərbaycan dili |

## Son tamamlanan mərhələlər

### Cloudflare-native deployment

- OpenNext Worker build;
- production/staging izolyasiyası;
- Prisma D1 adapter və WASM runtime;
- D1, R2, Images və incremental cache;
- custom domain, sitemap və staging noindex.

### Staff auth və admin

- PBKDF2 parol;
- məcburi TOTP və backup kod;
- D1 sessiyası, lockout, permission guard;
- admin dashboard;
- əmlak, layihə, xidmət, bloq, kateqoriya, lead, media, user və settings idarəetməsi;
- audit log.

### Public hesab və marketplace

- `USER`, `OWNER`, `AGENCY` qeydiyyatı;
- public kabinet və profil;
- qorunan public media upload;
- owner/agency property submission;
- pending/verified-agency publish siyasəti;
- agentlik kataloqu və admin verification.

### Axtarış və seçim

- geniş əmlak taksonomiyası;
- bina, mərtəbə, kirayə dövrü, şəkil və feature filtrləri;
- FAQ və footer naviqasiyası;
- Leaflet xəritəsi;
- cookie əsaslı 4-lük müqayisə.

## P0 — production riskinin azaldılması

### Əlaqə forması anti-spam

**Mövcud:** `CONTACT_LIMIT` Wrangler binding-i var, action istifadə etmir. Honeypot və Turnstile yoxdur.

**Hədəf:**

1. server action-da IP əsaslı `CONTACT_LIMIT`;
2. görünməz honeypot;
3. Cloudflare Turnstile server verification;
4. uğursuz e-poçt göndərişinin retry/observability siyasəti;
5. spam nəticəsini real şəxsi məlumat saxlamadan loglama.

### Backup və bərpa

**Mövcud:** manual D1 migration/deploy, automated backup job və restore drill yoxdur.

**Hədəf:** D1 export schedule, retention, RPO/RTO, R2 inventory və dövri restore testi.

## P1 — əsas məhsul boşluqları

### Public elan lifecycle

Hazırda public user yeni elan yaradır və statusu izləyir. Lazımdır:

- yalnız sahibinə açıq edit;
- statusa görə redaktə qaydası;
- soft-delete və yenidən göndərmə;
- admin rədd səbəbi və user feedback;
- şəkil orphan cleanup siyasəti;
- verified agency statusu dəyişəndə mövcud elan qərarı.

### Public hesab bərpası və təsdiqi

- e-poçt verification;
- “parolu unutdum” token axını;
- e-poçt dəyişmə təsdiqi;
- optional public 2FA;
- hesab silmə/export tələbi.

### Ətraflı filtr state-i

`mertebe_min`, `mertebe_max`, mərtəbə istisnaları, `sekilli` və `xususiyyet` query-ləri server filter-ə çatır. Lakin səhifədəki `buildHref()` və aktiv filter chip-ləri əsas `FILTER_KEYS` siyahısına tam daxil olmadığı üçün sort/pagination və chip təcrübəsində state itə bilər.

**Hədəf:** bütün parametrlər üçün vahid parser/serializer və round-trip testləri.

### Sitemap tamlığı

Hazırkı statik sitemap siyahısında yoxdur:

- `/agentlikler` və verified agentlik detalları;
- `/suallar`;
- `/muqayise` barədə index/noindex qərarı;
- yeni public route-lar üçün vahid qeydiyyat mexanizmi.

Kabinet və auth route-ları sitemap-a əlavə edilməməli, noindex qalmalıdır.

### Azərbaycan dilində axtarış

SQLite `LIKE` ə, ş, ç, ğ, ı, ö, ü hərflərində etibarlı registrsiz axtarış vermir.

**Hədəf:** yazı zamanı yenilənən normallaşdırılmış search text/sütun və həmin sahə üzrə filter/index.

### Lead konteksti

Contact action bütün müraciəti `CONTACT` source ilə yaradır. Property/project/service detail-dən struktur lead yaratma action-ı yoxdur.

**Hədəf:** source və entity ID-ni server tərəfindən təyin edən vahid lead action, ayrı CTA konteksti və admin linki.

### CI və E2E

GitHub Actions pipeline:

1. `npm ci`;
2. typecheck;
3. lint;
4. Vitest;
5. production build;
6. migration drift yoxlaması.

Browser E2E minimum axınları:

- search → detail → favorite/compare;
- public register/login → media → listing submit;
- staff login → TOTP → permission;
- admin property CRUD;
- contact submit və rate limit;
- staging noindex və production canonical.

## P2 — məhsul yetkinliyi

### Hesab əsaslı favorit

Prisma `Favorite` modeli var, UI LocalStorage istifadə edir. Login zamanı lokal favoritləri user hesabına birləşdirən sync axını gələcəkdə əlavə oluna bilər.

### Agentlik profilinin tamlığı

Agentlik profile edit-i ad, description, telefon, ünvan və HTTPS website verir. Logo upload və daha geniş əlaqə/komanda məlumatı üçün ayrıca qorunan axın yoxdur.

### Çoxdillilik

Hədəf AZ + RU ola bilər, lakin hazırda:

- route locale strategiyası yoxdur;
- UI mətnləri Azərbaycan dilində source daxilindədir;
- Prisma kontent modellərində tərcümə strukturu yoxdur;
- SEO hreflang və locale sitemap yoxdur.

Bu iş ayrıca arxitektura qərarı tələb edir; yalnız label faylı əlavə etməklə həll olunmur.

### Observability və analitika

- error tracking;
- strukturlaşdırılmış log və alert;
- Cloudflare Web Analytics və ya privacy-conscious analitika;
- Search Console;
- Core Web Vitals monitorinqi;
- admin audit anomaliya alert-i.

### Kontent və hüquqi təsdiq

- hüquqi səhifələrin hüquqşünas yoxlaması;
- `siteConfig.geo` dəqiq koordinatı;
- `siteConfig.workingHours` təsdiqi;
- real şirkət foto arxivi;
- xidmət və FAQ iddialarının hüquqi/əməliyyat təsdiqi;
- Resend production sender domain doğrulaması.

### UX və performans

- route səviyyəli `loading.tsx`/skeleton;
- public listing edit UX;
- media orphan cleanup;
- uzun filter URL-ləri üçün test;
- xəritə bundle və Core Web Vitals ölçümü;
- comparison/favorite üçün hesab sync qərarı.

## Bilinən əməliyyat qeydləri

- Cloudflare Managed Content/Bot qaydası default CLI User-Agent ilə HTML route-larına 403 verə bilər; browser User-Agent ilə audit 200 alıb.
- Production admin açıq feature flag ilə işləyir, lakin sessiyasız `/admin` staff login-ə yönləndirilir və layout/action guard-ları aktivdir.
- `AUTH_SECRET` rotasiyası versiyalı deyil və TOTP secret encryption-a təsir edir.
- Cloudflare Images çevirməsi uğursuz olarsa original image fallback yazıla bilər.
- D1 interactive transaction olmayan axınlar tətbiq səviyyəli kompensasiya istifadə edir.
- Demo content public query-də bloklansa da admin təmizləmə üçün görə bilər.

## Tamamlanma meyarı

Bir roadmap maddəsi yalnız aşağıdakılar olduqda tamamlanmış sayılır:

- davranış source-da mövcuddur;
- auth/data sərhədi serverdə qorunur;
- uyğun unit/integration/E2E test əlavə edilib;
- typecheck, lint, test və build keçir;
- staging smoke test keçir;
- README/Wiki/SECURITY təsirlənirsə yenilənib;
- migration/deploy/rollback qeydi mövcuddur;
- production davranışı ayrıca yoxlanıb.

## Sənədləşdirmə borcu qaydası

Yeni route, model, permission, npm script, binding və security davranışı eyni pull request-də sənədləşdirilməlidir. Wiki-ni faktiki koddan üstün həqiqət mənbəyi saymaq olmaz; ziddiyyətdə source qalibdir və sənəd düzəldilməlidir.
