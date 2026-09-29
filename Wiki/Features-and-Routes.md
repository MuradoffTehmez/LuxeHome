# Funksiyalar və marşrutlar

29 sentyabr 2026 snapshot-unda (`main@199f8409`) 133 `page.tsx` faylı (ictimai sayt 40, kabinet və auth 24, admin 69), 58 `"use server"` faylı və 21 Route Handler mövcuddur. İstifadəçi səhifələri həmişə `/{locale}` prefiksi (`az`, `en`, `ru`) daşıyır; aşağıdakı public cədvəldə qısa yol göstərilir. Marşrut adları azərbaycancadır və URL-in bir hissəsidir.

## İctimai sayt

| Marşrut | Funksiya | Data/render |
|---|---|---|
| `/` | Ana səhifə: vitrin (seçilmiş + son elanlar), kateqoriyalar, layihə/xidmət/bloq/tərəfdaş blokları, sahib müraciəti bloku | D1 + public cache + kənar HTML keşi |
| `/emlaklar` | Kataloq, URL filtrləri, siyahı/xəritə görünüşü, xəritədə sahə çəkmə, boş nəticədə filtr təklifləri | `getProperties`, `search-relaxation.ts` |
| `/emlaklar/[slug]` | Detal: lightbox qalereya, plan, 360° tur, qiymət göstəricisi, metro, nişangah, açıq qapı, rezervasiya, QR, oxşar elanlar | Public predicate ilə D1 |
| `/emlakimi-sat` | Satıcı səhifəsi və «Evimi qiymətləndir» aləti (lead yaratmır) | `estimateOwnerProperty` + `VALUATION_LIMIT` |
| `/layiheler`, `/layiheler/[slug]` | Yaşayış kompleksləri, qalereya, mənzil şahmatı; bölmə admin açarı ilə gizlədilə bilər | D1 |
| `/agentlikler`, `/agentlikler/[slug]` | Təsdiqlənmiş agentlik kataloqu və profili | Aktiv user + `isVerified` |
| `/agentler`, `/agentler/[slug]` | Agent kataloqu, profil, metriklər və moderasiyadan keçmiş rəylər | D1 |
| `/terefdaslar`, `/terefdaslar/[slug]` | Rəsmi tərəfdaş kataloqu və çoxdilli profil | Public partner predicate |
| `/xidmetler`, `/xidmetler/[slug]` | Xidmətlər və JSON-LD | D1 |
| `/blog`, `/blog/[slug]` | Kateqoriya, axtarış, səhifələmə və sanitizasiya olunmuş məqalə | D1 |
| `/bilik-merkezi`, `/bilik-merkezi/[slug]` | Hüquqi bələdçi kataloqu, məqalə, hüquqi status və prosedur blokları, AI məsləhətçi | `src/lib/knowledge.ts` |
| `/bilik-merkezi/kateqoriya/[slug]` | Bilik kateqoriyası | D1 |
| `/bilik-merkezi/suallar` | Hüquqi CMS FAQ-ı (`KnowledgeFaq`) | D1 |
| `/lugat`, `/lugat/[slug]` | Əmlak lüğəti | D1 + `DefinedTerm` JSON-LD |
| `/kalkulyator` | İpoteka, büdcə və tikintiçi hissə-hissə ödəniş kalkulyatoru | Client hesablama (`mortgage.ts`) |
| `/investisiya` | İnvestor gəlirliliyi kalkulyatoru və rayon üzrə gəlirlilik | `investment-math.ts`, `stats.ts` |
| `/ai-axtaris` | Təbii dildə axtarış, semantik axtarış və Match Score | Workers AI + Vectorize + `AI_LIMIT` |
| `/mene-emlak-tap` | Əmlak sehrbazı | D1 |
| `/bazar-analitikasi`, `/bazar-analitikasi/[slug]` | Çoxdilli bazar hesabatları | D1 |
| `/suallar` | Platforma haqqında 20 əsas sual (`src/i18n/site-faq.ts`) | Statik kataloq |
| `/favoritler` | Favorit elanlar (hesabla sinxron) | LocalStorage + `/api/hesab/favoritler` |
| `/muqayise` | Ən çox 4 elanın yan-yana müqayisəsi | Cookie ID → Server Action |
| `/haqqimizda`, `/elaqe` | Şirkət məlumatı, əlaqə forması (Turnstile, `CONTACT`/`OWNER` mənbəyi) | Server Action → D1 + Resend + Telegram |
| `/mexfilik-siyaseti`, `/istifade-sertleri`, `/cookie-siyaseti` | Hüquqi səhifələr | Statik |
| `/rayon/[slug]`, `/metro/[slug]` | Yerə görə indekslənən landing; rayon landing-i qəsəbə/kənd/massivi də açır | D1 |
| `/[seoLanding]` | Bazadan idarə olunan SEO landing runtime-ı | D1 |
| `/[...slug]` | Aktiv 301/302 redirect və 404 hit qeydiyyatı | D1 |

Ana səhifə, kataloq və detalın sərt qaydaları:

- vitrində 3-dən az elan olanda `OwnerLeadBanner` çıxır; boş kateqoriya «0 elan» yazmır;
- ana səhifə şəkilləri `site.image_*` parametrlərindən gəlir (`Parametrlər → Saytın şəkilləri`), boşdursa stok foto;
- qiymət göstəricisi eyni rayon (çatmasa şəhər) + növ + elan tipi + valyuta + dövrdəki m² medianı ilə müqayisə edir, ən azı 5 nümunə tələb olunur; kartda yalnız «Sərfəli qiymət» göstərilir;
- metro çipi kartda ≤1,5 km, `?metro_yaxin=1` filtri ≤1 km;
- mobil alt naviqasiya `lg`-dən kiçik ekranlarda detal səhifəsindən başqa hər yerdə görünür.

### Əmlak kataloqu və filtrlər

URL query parametrləri filtr vəziyyətinin yeganə mənbəyidir (`src/lib/property-search.ts`). `SearchPanel` göndərdiyi adlarla səhifənin oxuduğu adlar eyni olmalıdır. Əsas parametrlər: `elan` (`SALE`/`RENT`), `axtaris`, `tip`, `seher`, `rayon`, `metro`, `nisangah`, `metro_yaxin`, `otaq`, `min`, `max`, `sahe_min`, `sahe_max`, `temir`, `sened`, `tikili`, `dovr`, `mertebe_min`, `mertebe_max`, `ilk_mertebe_yox`, `son_mertebe_yox`, `sekilli`, `xususiyyet`, `sahe` (xəritədə poliqon, `lat,lng;…`), `siralama`, `sehife`.

| Parametr | Məna | Nümunə |
|---|---|---|
| `elan` | `LISTING_TYPES`: `SALE` / `RENT` (azərbaycanca mətn deyil) | `?elan=SALE` |
| `axtaris` | Sərbəst mətn — başlıq, yer, metro, nişangah, alias | `?axtaris=28 mall` |
| `tip` | Əmlak növünün slug-ı | `?tip=menziller` |
| `seher`, `rayon` | Şəhər/rayon və onun daxilindəki rayon/qəsəbə/kənd/massiv slug-ı | `?seher=baki&rayon=baki-nesimi` |
| `metro`, `metro_yaxin` | Metro stansiyası; `1` — ≤1 km-də metro olan elanlar | `?metro_yaxin=1` |
| `nisangah` | Nişangahın slug-ı | `?nisangah=nisangah-28-mall` |
| `otaq` | Otaq sayı (`5` = 5 və daha çox) | `?otaq=3` |
| `min`, `max` | Qiymət aralığı | `?min=80000&max=150000` |
| `sahe_min`, `sahe_max` | Sahə (m²) aralığı | `?sahe_min=60` |
| `temir`, `sened`, `tikili` | Təmir, sənəd, tikili növü (`NEW`/`OLD`) | `?sened=TITLE_DEED` |
| `dovr` | Kirayə dövrü (`MONTH`/`DAY`) | `?elan=RENT&dovr=DAY` |
| `mertebe_min`, `mertebe_max`, `ilk_mertebe_yox`, `son_mertebe_yox` | Mərtəbə aralığı və istisnaları | `?son_mertebe_yox=1` |
| `sekilli` | Yalnız şəkilli elanlar | `?sekilli=1` |
| `xususiyyet` | Xüsusiyyət slug-ı, təkrarlana bilər | `?xususiyyet=lift&xususiyyet=qaz` |
| `sahe` | Xəritədə çəkilmiş poliqon (`lat,lng;…`) | — |
| `gorunus` | `xerite` — xəritə görünüşü (nəticə dəstini dəyişmir) | `?gorunus=xerite` |
| `siralama` | `newest` (defolt), `price_asc`, `price_desc`, `area_desc`, `featured` | `?siralama=price_asc` |
| `sehife` | Səhifə nömrəsi | `?sehife=2` |

Slug-lar taksonomiyadan gəlir (`prisma/taxonomy-data.ts`, `locations-data.ts`); nişangah slug-ı `nisangah-` prefiksi daşıyır. Sənəd dəyərləri `DOCUMENT_STATUSES`-dəndir (`TITLE_DEED`, `CONTRACT`, `MUNICIPAL`, `DECREE`, `POWER_OF_ATTORNEY`, `EXTRACT_COMMERCIAL`, `NONE`).

- `5` otaq seçimi “5 və daha çox” kimi işləyir; `xususiyyet` təkrarlana bilər.
- Rayon açılışında seçilə bilən səviyyələr `LOCATION_CHILD_KINDS`-dədir; metro və nişangah öz filtr sahələrindədir.
- `?nisangah=<slug>` — 214 nişangahdan biri («28 Mall», «Neapol dairəsi»): desktop panel, mobil sheet, aktiv çip və boş nəticə təklifində işləyir.
- Mətn axtarışı (`axtaris`) elanın yerini, metrosunu, nişangahını və massivin rayonunu tapır; alternativ yazılışlar (`Müşfiqabad`, `8 km`, `Kirov qəsəbəsi`) `Location.searchName`-dədir.
- Boş nəticədə `EmptySearchSuggestions` hər aktiv çipi çıxaranda neçə elan qaldığını göstərir. Yeni filtr `CHIP_FIELDS`-ə də yazılmalıdır.
- Xəritədə sahə: SQL sərhəd qutusunu süzür, dəqiq poliqon yoxlaması JS-də; ən çox 1000 namizəd.

### Favorit və müqayisə

- Favorit əvvəl LocalStorage-də saxlanılır; hesabla daxil olanda `/api/hesab/favoritler` ilə sinxronlaşır. Hidrasiyadan əvvəl kliklər bloklanır.
- Müqayisə cookie-də saxlanılır, `MAX_COMPARE = 4` həm client, həm server tərəfdə tətbiq olunur.

## İctimai hesab və kabinet

### Giriş marşrutları

| Marşrut | Funksiya |
|---|---|
| `/qeydiyyat` | Hesab növü ikonlu kartlarla seçilir; istəyə bağlı sahələr yığılan bölmədə; Google girişi yuxarıda |
| `/daxil-ol` | Parol (Turnstile), Google və telefon OTP girişi (sonuncu ikisi konfiqurasiyadan asılı) |
| `/hesab/e-poct-tesdiqi`, `/hesab/e-poct-gonderildi` | E-poçt təsdiqi |
| `/hesab/parolu-unutdum`, `/hesab/parolu-yenile` | Parol bərpası |
| `/kabinet` | Hesab xülasəsi |
| `/kabinet/profil` | Profil, parol, telefon təsdiqi, şəxsi data ixracı, hesabın silinməsi |
| `/kabinet/elanlar`, `/kabinet/elanlar/yeni`, `/kabinet/elanlar/[id]` | Elan siyahısı, 8 addımlı sehrbaz, redaktə, «Yenilə» (+60 gün) |
| `/kabinet/paketler` | Premium paket sifarişi və tarixçə |
| `/kabinet/rezervasiyalar` | Rezervasiyalar |
| `/kabinet/axtarislarim` | Saxlanmış axtarışlar və tezlik |
| `/kabinet/bildirisler` | Bildirişlər, kanal seçimləri, sakit saatlar |
| `/kabinet/son-baxilanlar`, `/kabinet/tovsiyeler` | Son baxılanlar və fərdi tövsiyələr |
| `/kabinet/komanda` | Agentlik komandası (ən çox 3 üzv) |
| `/elan-yerlesdir`, `/elanlarim`, `/profilim` | Qısa ünvanlar (`accounts/short-links.ts`) |

### Hesab növləri

| Hesab | Elan yerləşdirmə | Qeyd |
|---|---:|---|
| `USER` | ❌ | Axtarır, saxlayır, görüş təyin edir |
| `OWNER` | ✅, təsdiq gözləyir | Mülk sahibi |
| `AGENT` | ✅ | Fərdi rieltor, ictimai agent profili |
| `AGENCY` | ✅ (təsdiqlənmiş agentlik birbaşa dərc edir) | `Agency.isVerified` |
| `CORPORATE` | ✅ | Tikinti şirkəti, developer, bank |
| `STAFF` | Admin CRUD | Yalnız admin/bootstrap ilə yaranır |

Siyahıları əl ilə yazmaq olmaz: `PUBLIC_ACCOUNT_TYPES`, `LISTING_ACCOUNT_TYPES`, `COMPANY_ACCOUNT_TYPES`, `accountTypeKey()`. Doğum tarixi istəyə bağlıdır və yalnız 18 yaş yoxlaması üçündür.

### Elan sehrbazı və ünvan

- Kabinet və admin eyni 8 addımlı sehrbazı (`components/admin/form-wizard.tsx`) işlədir; bütün addımların sahələri DOM-da qalır, «Növbəti» cari addımı, «Göndər» hamısını yoxlayır; server xətasında sehrbaz xətalı sahənin addımına keçir.
- Yeni elanın qaralaması `localStorage`-a yazılır və bərpa təklif olunur.
- Ünvan pillələri: Region → şəhər/rayon → şəhər rayonu → qəsəbə → kənd → massiv → metro → nişangah → küçə → bina (`LocationFields`, admin və kabinet ortaq). Bazaya bir yer yazılır (`districtId` — ən dərin seçim); siyahıda olmayan massiv `neighborhoodName`, küçə/bina `street`/`building`-dədir. Metro və nişangah şəhərə bağlıdır — şəhər dəyişəndə sıfırlanır.
- «Kənd» sahəsi seçilmiş rayonun kəndlərini tələb olunanda yükləyir (~3 600 kənd bir dəfədə göndərilmir).
- «Küçə» sahəsi seçilmiş rəsmi vahidin (qəsəbə/kənd, yoxdursa şəhər rayonu və ya şəhər) Ünvan Reyestri küçələrini təklif edir (`public/data/kuceler/<kod>.json`), amma sərbəst mətn olaraq qalır.
- Elan yazan hər action fonda `queuePropertyVectorSync()` və `queueListingEnrichment()` (AI SEO + ALT) çağırır.
- Sahib/agentlik elanı 60 gün yaşayır: 7 gün qalmış xatırlatma, bitəndə `ARCHIVED` + `expiredAt`. Şirkət (STAFF) elanlarına toxunulmur.

## Əməkdaş giriş axını

| Marşrut | Funksiya |
|---|---|
| `/giris` | E-poçt + parol, Turnstile, rate limit və lockout |
| `/giris/dogrulama` | TOTP, backup kod və ya passkey |
| `/giris/2fa-qurulumu` | İlk girişdə məcburi TOTP enrollment |
| `/admin/hesabim` | Profil, panel dili, tema, parol, backup kod, passkey, ICS təqvim tokeni, sessiyalar |

## Admin panel

| Marşrut | Əsas imkanlar | Permission |
|---|---|---|
| `/admin` | Dashboard statistikası və sürətli əməliyyatlar | Staff |
| `/admin/emlaklar` | Siyahı, filtr, status, featured, toplu yeniləmə və seçim | Staff (baxış); yazma `property:manage` |
| `/admin/emlaklar/yeni`, `/[id]` | 8 addımlı sehrbaz, iyerarxik ünvan, metro/nişangah, rəsmi küçə təklifi, AI SEO/ALT | `property:manage` |
| `/admin/emlaklar/idxal` | CSV idxalı (həmişə DRAFT, 10-luq partiyalar, dublikat/davam etmə; `metro` və `landmark` sütunları şəhərin öz stansiya/nişangahları arasında axtarılır) | `property:manage` |
| `/admin/moderation` | Pending elanlar, approve/reject | `property:manage` |
| `/admin/layiheler`, `/yeni`, `/[id]` | Layihə CRUD və şəkillər | `project:manage` |
| `/admin/layiheler/[id]/menziller` | Mənzil şahmatı generatoru (blok/mərtəbə/nömrə) | `project:manage` |
| `/admin/xidmetler`, `/yeni`, `/[id]` | Xidmət CRUD | `service:manage` |
| `/admin/blog`, `/yeni`, `/[id]`, `/kateqoriyalar` | Bloq və kateqoriyalar | `blog:manage` |
| `/admin/bilik-merkezi` (+ `/yeni`, `/[id]`, `/kateqoriyalar`, `/lugat`, `/suallar`) | Bilik Mərkəzi CMS-i | `knowledge:manage` |
| `/admin/muracietler`, `/[id]` | Müraciət filtri, status, məsul, qeyd | `lead:manage` |
| `/admin/muracietler/lovhe` | Status sütunlu lövhə, SLA, «mənə təyin et» | `lead:manage` |
| `/admin/huni` | Konversiya hunisi və mənbə bölgüsü | `lead:manage` |
| `/admin/rezervasiyalar`, `/teqvim` | Rezervasiyalar və Bakı vaxtı ilə təqvim | `lead:manage` |
| `/admin/paketler` | Premium paketlər, sifarişlər, ödəniş uçotu | `billing:manage` |
| `/admin/media` | Upload, axtarış, alt mətn, silmə | `media:manage` |
| `/admin/istifadeciler` | Staff yaratma, rol/aktivlik, parol/2FA/sessiya reset | `user:manage` |
| `/admin/hesablar` | İctimai hesab təsdiqi, bloklama, silmə, toplu seçim | `user:manage` |
| `/admin/agentlikler`, `/admin/agentler`, `/admin/agentler/[id]` | Agentlik verification, agent profilləri, profil redaktəsi və rəy moderasiyası | `user:manage` |
| `/admin/terefdaslar`, `/yeni`, `/[id]` | Tərəfdaş CRUD, görünürlük, müqavilə, entity əlaqələri | `partner:*` |
| `/admin/taksonomiya` | Əmlak tipi, yerləşmə, xüsusiyyətlər | uyğun manage permission |
| `/admin/tercumeler` | Məzmun tərcümələri | `translation:manage` |
| `/admin/seo` | Route/metadata auditı | `property:manage` |
| `/admin/redirects` | 301/302 yönləndirmə və 404 hit-ləri | `seo:view` |
| `/admin/serp` (+ 15 alt səhifə) | `metadata`, `acar-sozler`, `entities`, `landingler`, `audit`, `content`, `media`, `monitorinq`, `indexing`, `search-console`, `schema`, `sitemap`, `links`, `robots`, `parametrler` | Baxış `seo:view`; yazma `seo:edit` / `seo:publish` / `seo:schema:manage` / `seo:settings:manage` |
| `/admin/ai-komekci` | AI köməkçi, elan üçün SEO+ALT-ın yenidən yaradılması | `property:manage` |
| `/admin/ictimai-imkanlar` | Phase 2 ictimai imkanların açarları | `property:manage` |
| `/admin/demo-mezmun` | Nümunə məzmun rejimi | `settings:manage` |
| `/admin/sistem` | Sistem rejimi (`NORMAL`/`MAINTENANCE`/`READ_ONLY`), inteqrasiya hazırlığı | `settings:manage` |
| `/admin/analitika` | Cloudflare GraphQL trafik metrikləri | `settings:manage` + token |
| `/admin/e-poct` | Resend e-poçt event metadata-sı | `lead:manage` |
| `/admin/security` | Login və sessiya təhlükəsizliyi | `user:manage` |
| `/admin/audit` | Audit jurnalı; sıfırlama yalnız Super Admin | `settings:manage` |
| `/admin/hesabim` | Profil, avatar, panel dili, tema, parol, backup kod, passkey, ICS tokeni, sessiyalar | Hər staff |
| `/admin/parametrler` | Əlaqə, bildiriş, sayt şəkilləri, tema | `settings:manage` |

Toplu seçim `components/admin/bulk-selection.tsx` + `lib/admin/bulk.ts`-dir: hər id mövcud tək action-dan keçir (guard, audit, keş onun içindədir), bir sorğuda ən çox 100 id, silmə həmişə təsdiq dialoqu ilə.

### Rol matrisi

| Rol | İcazələr |
|---|---|
| `SUPER_ADMIN` | Bütün 25 permission, o cümlədən `user:manage`, `settings:manage`, `partner:contract`, `seo:settings:manage` və audit reset |
| `ADMIN` | Kontent, Bilik Mərkəzi, CRM, media, tərcümə, tərəfdaş (müqavilə xaric), SEO (parametrlər xaric), `billing:manage` |
| `EDITOR` | Bloq, Bilik Mərkəzi, media, tərcümə, tərəfdaş və SEO-ya read-only baxış |

## Route Handler-lar

| Metod və marşrut | Məsuliyyət | Qoruma |
|---|---|---|
| `POST /api/admin/media` | Admin şəkil yükləmə (su nişanı, Images) | `media:manage`, origin, rate limit |
| `POST /api/hesab/media` | Kabinet elan şəkli yükləmə | Lister hesabı, ownership, origin, rate limit |
| `GET /api/hesab/menu` | Header hesab menyusu | Optional public session |
| `GET/POST /api/hesab/favoritler` | Favoritlərin hesabla sinxronu | Public session |
| `GET /api/hesab/export` | Şəxsi data ixracı | Public session |
| `GET /api/auth/google/start`, `/callback` | Google OIDC + PKCE | Secret yoxdursa 404 |
| `GET /api/calendar/[token]` | Şəxsi ICS təqvim abunəsi | Yenidən yaradıla bilən token |
| `GET /api/og/property/[slug]` | 1200×630 JPEG OG paylaşım kartı | Public |
| `GET /api/geocode`, `/api/map-tiles/[...tile]` | Geokod (Geoapify) və xəritə tile proksisi | `TILE_LIMIT` (yalnız keş boş olanda) |
| `GET /api/yerler/kendler?seher=<id>` | Seçilmiş rayonun kəndləri — elan formasının «Kənd» sahəsi üçün, Azərbaycan əlifbası ilə sıralı | Public; `Cache-Control: public, max-age=3600, s-maxage=86400` |
| `POST /api/monitoring/error`, `/vitals` | Client xətaları və Web Vitals | `MONITORING_LIMIT` |
| `POST /api/security/turnstile` | Turnstile yoxlaması | Public |
| `POST /api/cron/saved-search-digest` | Digest, maintenance (elan müddəti, silinmə retry), semantik reindeks | `CRON_SECRET` Bearer |
| `POST /api/webhooks/resend` | Resend/Svix event qəbulu | `RESEND_WEBHOOK_SECRET` imzası |
| `GET /media/[...key]` | R2 obyektinin delivery-si | Key parser + cache metadata |
| `GET /llms.txt`, `/sitemap-index.xml`, `/sitemaps/[feed]` | Maşın oxunaqlı xəritə və sitemap feed-ləri | Public |

Cəmi 21 Route Handler: `src/app/api` altında 17, üstəgəl `media/[...key]`, `llms.txt`, `sitemap-index.xml` və `sitemaps/[feed]`. Rəsmi küçə siyahıları Route Handler deyil — `public/data/kuceler/<officialCode>.json` statik fayllarıdır.

## SEO və sistem marşrutları

| Marşrut | Davranış |
|---|---|
| `/sitemap.xml`, `/sitemap-index.xml`, `/sitemaps/[feed]` | D1-dən indekslənə bilən qeydlər (`isDemo: false`), yeni ictimai səhifələr və bazar hesabatları daxil |
| `/robots.txt` | `/admin`, `/giris`, `/favoritler` bloklanır; staging-də tam `Disallow: /` |
| `/sitemap.xml` | Middleware daxildə `/sitemap-index.xml`-ə rewrite edir |
| `manifest.webmanifest` | PWA manifesti |
| `not-found.tsx`, `error.tsx`, `forbidden.tsx` | Brendli 404, xəta sərhədi və 403 |

Kabinet, auth, admin, favorit və müqayisə indekslənmir. Staging bütün metadata-nı noindex edir.
