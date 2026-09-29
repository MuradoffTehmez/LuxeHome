# İdarə paneli bələdçisi

Bu səhifə `/admin` panelində gündəlik iş axınlarını izah edir: kim nəyi edə bilər, elan necə dərc olunur, müraciətlər necə idarə olunur, sistem rejimi nə vaxt dəyişdirilir. Texniki marşrut və icazə inventarı [[Funksiyalar və marşrutlar|Features-and-Routes]], təhlükəsizlik modeli [[Təhlükəsizlik və autentifikasiya|Security-and-Authentication]] səhifəsindədir.

## Giriş və hesab

1. `/{locale}/giris` — e-poçt + parol (Turnstile ilə). 5 uğursuz cəhddən sonra hesab 15 dəqiqə kilidlənir.
2. İlk girişdə `/giris/2fa-qurulumu` — authenticator tətbiqi ilə QR skan edilir, 10 birdəfəlik backup kod saxlanılır. TOTP məcburidir.
3. Sonrakı girişlərdə `/giris/dogrulama` — TOTP kodu, backup kod və ya qeydiyyatdan keçmiş passkey.
4. Sessiya 8 saat aktivliksiz qalanda bitir; aktivliklə uzansa da 7 gündən çox yaşamır.

`/admin/hesabim`-də: profil və avatar, **panel dili** (AZ/EN/RU — `User.locale`), tema, parol, backup kodların yenilənməsi, passkey əlavə/silmə, şəxsi ICS təqvim linki və aktiv sessiyaların bağlanması.

> Passkey domenə bağlıdır: `luxehomeestate.az`-da yaradılan açar `workers.dev` ünvanında işləmir.

Qısa yol: **Ctrl/⌘ + K** əmr menyusunu açır (bölmələr arası sürətli keçid).

## Rollar

| Rol | Nə edə bilər |
|---|---|
| `SUPER_ADMIN` | Hər şey: əməkdaş və ictimai hesablar, parametrlər, sistem rejimi, demo məzmun, audit jurnalının sıfırlanması, tərəfdaş müqavilələri, SERP parametrləri |
| `ADMIN` | Elan, layihə, xidmət, bloq, Bilik Mərkəzi, müraciət/rezervasiya, media, tərcümə, tərəfdaş (müqavilə xaric), SEO (parametrlər xaric), premium paketlər |
| `EDITOR` | Bloq, Bilik Mərkəzi, media, tərcümə; tərəfdaş və SEO-ya yalnız baxış |

Menyuda yalnız icazəniz olan bölmələr görünür; icazəsiz ünvan 403 səhifəsi verir.

## Elanlar

### Yeni elan (`/admin/emlaklar/yeni`)

Forma 8 addımlı sehrbazdır (kabinetdəki ilə eyni komponent). «Növbəti» yalnız cari addımı, «Göndər» bütün addımları yoxlayır; server xətası olanda sehrbaz xətalı sahənin addımına keçir. Yeni elanın qaralaması brauzerdə saxlanılır və yenidən açanda bərpa təklif olunur.

Ünvan pillələri: Region → şəhər/rayon → şəhər rayonu → qəsəbə → kənd → massiv → metro → nişangah → küçə → bina.

- Siyahıda olmayan massivi sərbəst yazmaq olar.
- Küçə sahəsi seçilmiş vahidin rəsmi küçələrini təklif edir, amma sərbəst mətn qəbul edir.
- Metro və nişangah şəhər dəyişəndə sıfırlanır.

Şəkillər toplu yüklənir: brauzer əvvəl kiçildir, növbə ilə göndərir, xətada təkrar cəhd edir. 8 MB-dan böyük, SVG və JPEG/PNG/WebP/AVIF olmayan fayl rədd olunur. Elan şəkillərinə avtomatik su nişanı çəkilir; artıq nişanlı şəkil ikinci dəfə nişanlanmır.

Yadda saxlanandan sonra fonda:

- **SEO və ALT** avtomatik yaranır (AI əlçatandırsa AI, deyilsə faktlardan). Redaktorun doldurduğu SEO sahəsinin üzərinə yazılmır. Yenidən yaratmaq üçün `/admin/ai-komekci`.
- **Semantik axtarış indeksi** yenilənir.

### Statuslar

| Status | Saytda | Nə vaxt |
|---|:---:|---|
| `DRAFT` | ❌ | Qaralama; CSV idxalı həmişə bununla yaradır |
| `PENDING` | ❌ | Mülk sahibi və ya təsdiqlənməmiş agentliyin elanı — moderasiya gözləyir |
| `PUBLISHED` | ✅ | Aktiv elan |
| `RESERVED` | ✅ | Beh alınıb |
| `SOLD` / `RENTED` | ✅ | Satılıb / kirayə verilib |
| `ARCHIVED` | ❌ | Arxiv; müddəti bitmiş sahib/agentlik elanı da buraya düşür |

Sahib/agentlik elanı 60 gün yaşayır, 7 gün qalmış sahibinə xatırlatma gedir, bitəndə `ARCHIVED` olur; sahib kabinetdən «Yenilə» ilə +60 gün uzadır. Şirkət (staff) elanlarına müddət tətbiq olunmur.

### Moderasiya (`/admin/moderation`)

`PENDING` elanlar burada təsdiqlənir və ya rədd edilir. Təsdiqlənmiş agentliyin elanı moderasiyadan keçmədən dərc olunur.

### CSV idxalı (`/admin/emlaklar/idxal`)

| Sütun | Məcburi |
|---|:---:|
| `title`, `description`, `listing_type`, `price`, `type`, `city` | ✅ |
| `currency`, `price_period`, `district`, `metro`, `landmark`, `address`, `rooms`, `area`, `land_area`, `floor`, `total_floors`, `renovation`, `document`, `building_type`, `latitude`, `longitude`, `video_url`, `features`, `images` | — |

- Taksonomiya (növ, şəhər, rayon, metro, nişangah, xüsusiyyət) slug və ya diakritiksiz adla tapılır; metro/nişangah yalnız seçilmiş şəhərin öz siyahısında axtarılır.
- Elan **həmişə DRAFT** yaranır — yoxlayıb özünüz dərc edirsiniz.
- Sətirlər 10-luq partiyalarla işlənir; `images`-dəki kənar linklər yüklənib R2-yə köçürülür.
- Təkrar idxal: tamamlanmış və ya dərc olunmuş eyni sətir «dublikat» sayılır; yarımçıq qalmış qaralama davam etdirilir. Əl ilə yaradılmış eyni başlıq + şəhər + qiymətli elan da dublikatdır.
- İdxalda SEO/ALT AI-sız, faktlardan yaranır; AI versiyası elan paneldə yenidən saxlananda yaranır.

### Toplu əməliyyatlar

Siyahılarda sətir seçib zolaqdan əməliyyat seçilir. Bir dəfədə ən çox 100 qeyd; silmə həmişə təsdiq dialoqu istəyir. Hər qeyd tək əməliyyatla eyni yoxlamadan keçir və audit jurnalına düşür. Toplu seçim: hesablar, agentliklər, müraciətlər, bloq, layihələr, tərəfdaşlar, xidmətlər; əmlaklarda toplu status/featured yeniləməsi.

## Layihələr və mənzil şahmatı

- `/admin/layiheler` — yaşayış kompleksləri, qalereya (xarici, interyer, tikinti, landşaft).
- `/admin/layiheler/[id]/menziller` — blok/mərtəbə/nömrə üzrə mənzil generatoru. Mövcud blok + nömrəni üzərinə yazmır.
- «Layihələr» bölməsi saytda ümumi açarla gizlədilə bilər.

## Müraciətlər (CRM)

| Səhifə | Nə üçün |
|---|---|
| `/admin/muracietler` | Siyahı, filtr, sürətli status, məsul əməkdaş, daxili qeyd |
| `/admin/muracietler/lovhe` | Status sütunlu lövhə: sürüşdürmə və ya kartdakı menyu ilə status dəyişimi, SLA işarəsi, «mənə təyin et» |
| `/admin/huni` | Dövr üzrə konversiya hunisi, mənbə bölgüsü, ən çox baxılan elanlar üzrə baxış → favorit → müraciət |

Statuslar: `NEW` → `CONTACTED` → `IN_PROGRESS` → `COMPLETED` / `CLOSED` (istənilən keçid mümkündür). SLA: yeni müraciət 24 saatdan, işdəki 3 gündən çox yenilənməyəndə işarələnir. «Mənə təyin et» yalnız məsulu olmayan müraciəti götürür — iki əməkdaş eyni anda götürsə, ikincinin əməliyyatı səssizcə üzərinə yazmır.

Mənbələr: `PROPERTY`, `CONTACT`, `SERVICE`, `PROJECT`, `OWNER` (`/emlakimi-sat`). Yeni müraciət Telegram ofis çatına (qoşulubsa) və e-poçtla bildirilir.

## Rezervasiya və təqvim

- `/admin/rezervasiyalar` — rezervasiya sorğuları (`REQUESTED`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`, `COMPLETED`).
- `/admin/rezervasiyalar/teqvim` — Bakı vaxtı (UTC+4) ilə təqvim; açıq qapı günləri də görünür.
- Şəxsi ICS abunəsi «Hesabım»da yaradılır; yenidən yaradanda köhnə link dərhal ölür.

## Premium paketlər (`/admin/paketler`)

Real ödəniş provayderi yoxdur: ödəniş ofisdə və ya köçürmə ilə alınır, paneldə qeyd olunur. İcazə: `billing:manage`.

| Sifariş statusu | Məna |
|---|---|
| `PENDING` | Sifariş verilib, ödəniş gözlənilir |
| `PAID` | Ödəniş qeyd olunub — premium müddət başlayır |
| `CANCELLED` | Ləğv olunub |
| `REFUNDED` | Geri qaytarılıb — müddət geri çıxılır |

Paketin adı, müddəti və qiyməti sifarişə kopyalanır (sonrakı qiymət dəyişikliyi köhnə sifarişə təsir etmir). İkinci «ödənildi» qeydi premiumu təkrar uzatmır.

## Hesablar

- `/admin/istifadeciler` — əməkdaş yaratma, rol, aktivlik, parol/2FA sıfırlama, sessiyaların ləğvi (`user:manage`).
- `/admin/hesablar` — ictimai hesabların təsdiqi (`approvedAt`), bloklanması (`isActive`) və silinməsi. Silmə kabinetdəki self-service silmə ilə eyni iki mərhələli yoldan keçir.
- `/admin/agentlikler`, `/admin/agentler` — agentlik verification, agent profilləri, rəy moderasiyası.

## Məzmun

- **Xidmətlər, bloq, Bilik Mərkəzi** — CRUD, kateqoriyalar; HTML saxlananda sanitizasiya olunur.
- **Bilik Mərkəzi:** hüquqi məqalənin hüquqi status, risk səviyyəsi, baxış tarixi, qanun aktları və mənbə linkləri doldurulmalıdır. İdxal paketi DRAFT yaradır — hüquqşünas/redaktor təsdiqi olmadan dərc etməyin.
- **Tərcümələr** (`/admin/tercumeler`) — məzmunun EN/RU variantları; boş qalan sahədə AZ mətni göstərilir.
- **Media** (`/admin/media`) — yükləmə, axtarış, alt mətn, silmə.
- **Tərəfdaşlar** — saytda görünmək üçün `ACTIVE + təsdiqlənmiş + rəsmi + ictimai` olmalıdır; müqavilə məlumatı yalnız `partner:contract` icazəsi ilə görünür.
- **Taksonomiya** (`/admin/taksonomiya`) — əmlak növləri, xüsusiyyətlər və yerlər. Rəsmi ərazi ağacı generasiya olunur: yeni rəsmi vahid paneldə deyil, [[Ərazi bölgüsü və ünvan|Location-Taxonomy]] runbook-u ilə əlavə olunur.

## SEO və SERP

- `/admin/serp` — metadata redaktoru və SERP önbaxışı, açar sözlər, entity profilləri, landing-lər, audit (məzmun və media iş siyahıları), monitorinq xəbərdarlıqları, indeksləmə, Search Console, schema, sitemap, daxili linklər, robots və lokal SEO parametrləri.
- `/admin/redirects` — 301/302 yönləndirmələr və 404 hit-ləri.
- `/admin/seo` — marşrut/metadata auditi.
- Landing yalnız ən azı 80 sözlük unikal giriş mətni və kifayət qədər elan olanda indekslənir.

## Sistem

| Səhifə | Nə üçün | Diqqət |
|---|---|---|
| `/admin/sistem` | Sistem rejimi və 11 inteqrasiyanın hazırlığı: Search Console, Cloudflare analitikası, e-poçt (Resend), e-poçt webhook-u, geokod (Geoapify), Turnstile, saved-search cron, Web Push, Telegram, Google girişi, telefon girişi | Hər rejim dəyişikliyi audit qeydi yaradır |
| `/admin/demo-mezmun` | Nümunə məzmun açarı | Production-da bağlı saxlanılır |
| `/admin/parametrler` | Əlaqə məlumatı, bildiriş, saytın şəkilləri (hero, «Haqqımızda», CTA — yalnız `/media/...`), tema | Boş şəkil sahəsində stok foto göstərilir |
| `/admin/ictimai-imkanlar` | İctimai imkanların açarları | — |
| `/admin/analitika` | Cloudflare trafik metrikləri | `CLOUDFLARE_ANALYTICS_TOKEN` tələb edir |
| `/admin/e-poct` | Resend çatdırılma/qəbul metadata jurnalı (məzmun saxlanmır) | Webhook secret qurulmalıdır |
| `/admin/security` | Giriş cəhdləri və sessiya təhlükəsizliyi | — |
| `/admin/audit` | Audit jurnalı | Sıfırlama yalnız Super Admin; sıfırlamanın özü qeydə düşür |

### Sistem rejimləri — nə vaxt hansı

| Rejim | Ziyarətçi nə görür | Nə vaxt |
|---|---|---|
| `NORMAL` | Sayt tam işləyir | Adi vəziyyət |
| `READ_ONLY` | Səhifələr açılır, forma göndərmək, elan yerləşdirmək və digər dəyişikliklər rədd edilir | Baza işləri, miqrasiya, məlumat yoxlaması |
| `MAINTENANCE` | 503 «texniki xidmət» səhifəsi; yalnız Super Admin keçir | Böyük insident, ciddi xəta |

Panelə girmək mümkün deyilsə və ya D1 əlçatmazdırsa, texniki xidmət rejimini Worker-in `FORCE_MAINTENANCE="true"` dəyəri ilə açmaq olar (bax [[Deployment və əməliyyatlar|Deployment-and-Operations]]).

## Dəyişiklik saytda nə vaxt görünür

Anonim ziyarətçiyə ictimai HTML kənar keşdən verilir: paneldəki dəyişiklik ən çox **60 saniyə** gecikmə ilə görünür. Daxil olmuş istifadəçi və staging dərhal görür.
