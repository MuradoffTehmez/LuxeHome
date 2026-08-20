# Azərbaycan daşınmaz əmlak portalları — sahə və filtr araşdırması

Tarix: 2026-08-20
Məqsəd: Luxe Home Estate-in əmlak sxemini, admin panel formalarını və ictimai filtrlərini
yerli bazarın gözlədiyi standarta uyğunlaşdırmaq.

Mənbələr: bina.az (bazar lideri, 77 667 aktiv satış elanı), yeniemlak.az, kub.az,
tap.az/elanlar/dasinmaz-emlak, Azərbaycan Qiymətləndiricilər Palatası (aqp.gov.az) May 2026
bazar hesabatı. emlak.az bot yoxlaması ilə bağlı olduğu üçün araşdırmaya daxil edilməyib.

**Qeyd:** Bu sənəd yalnız struktur və faktiki bazar göstəricilərini toplayır. Heç bir elan
məzmunu, foto və ya təsvir köçürülməyib və köçürülməyəcək.

---

## 1. Elan növü (listingType)

Üç səviyyəli bölgü bütün portallarda eynidir:

| Dəyər | Etiket | bina.az | yeniemlak | kub.az | tap.az |
|---|---|---|---|---|---|
| `SALE` | Satılır / Alqı-satqı | var | var | var | var |
| `RENT` | Kirayə (aylıq) | var | var | var | var |
| `DAILY` | Günlük kirayə | var | var | var | var |

**Bizdə boşluq:** `LISTING_TYPES` yalnız `SALE` və `RENT` saxlayır. Günlük kirayə Bakıda
ayrıca və böyük seqmentdir (bina.az onu ayrıca əsas menyu bölməsi kimi saxlayır). `PRICE_PERIODS`
sabitində `DAY` varsa, `listingType` deyil, `pricePeriod` üzərindən həll edilə bilər — amma
istifadəçi filtri səviyyəsində üç ayrı düymə gözlənilir.

## 2. Əmlak növü (propertyType)

bina.az elan yerləşdirmə formasında dəqiq yeddi növ:

`Yeni tikili` · `Köhnə tikili` · `Həyət evi/Bağ evi` · `Ofis` · `Qaraj` · `Torpaq` · `Obyekt`

Axtarış filtrində isə altı növ + ayrıca «Tikilinin növü» oxu:

- **Əmlakın növü:** Mənzil · Həyət evi/Bağ evi · Ofis · Qaraj · Torpaq · Obyekt
- **Tikilinin növü:** Yeni tikili · Köhnə tikili

Yəni **«yeni tikili / köhnə tikili» ayrıca ölçüdür**, əmlak növü deyil. kub.az və yeniemlak.az
eyni bölgünü işlədir. Bu, yerli bazarın ən vacib ayırıcı xüsusiyyətlərindəndir: qiymət, sənəd
vəziyyəti və ipoteka uyğunluğu birbaşa ondan asılıdır.

**Bizdə boşluq:** `PropertyType` modelində belə ikinci ox yoxdur. `Property`-yə `buildingType`
sahəsi (`NEW` | `OLD`) əlavə edilməlidir.

## 3. Yerləşmə — dörd səviyyəli iyerarxiya

Portallar yeri **dörd paralel açar** ilə göstərir və istifadəçi hər hansı biri ilə axtarır:

1. **Rayon** (`r.`) — Bakının 13 rayonu: Abşeron, Binəqədi, Xətai, Xəzər, Qaradağ, Nərimanov,
   Nəsimi, Nizami, Pirallahı, Sabunçu, Səbail, Suraxanı, Yasamal
2. **Metro** (`m.`) — 26 stansiya: Həzi Aslanov, Əhmədli, Xalqlar Dostluğu, Neftçilər,
   Qara Qarayev, Koroğlu, Ulduz, Nəriman Nərimanov, Gənclik, 28 May, Nizami,
   Elmlər Akademiyası, İnşaatçılar, 20 Yanvar, Memar Əcəmi, Nəsimi, Azadlıq prospekti,
   Cəfər Cabbarlı, Xətai, Sahil, İçəri Şəhər, Bakmil, Dərnəgül, Avtovağzal, 8 Noyabr, Xocəsən
3. **Qəsəbə / mikrorayon** (`q.`) — Mərdəkan, Buzovna, Şüvəlan, Nardaran, Masazır, Bakıxanov,
   Yeni Ramana, Badamdar, Hövsan, Savalan, Maştağa, Bilgəh, Ağ şəhər, Sea Breeze,
   9-cu mikrorayon və s.
4. **Nişangah** (landmark) — məs. «Zərifə Əliyeva adına park». bina.az axtarış sahəsinin
   placeholder-i məhz budur: *«Rayon, metro, nişangah»*

Elan kartında yer **yalnız bir dəyərlə** göstərilir və o, ən dəqiq olanıdır: qəsəbə varsa qəsəbə,
yoxsa metro, yoxsa rayon — «Nəsimi m.», «Mərdəkan q.», «Nərimanov r.».

**Bizdə boşluq:** `Location` modeli iki səviyyəlidir (`CITY` / `DISTRICT`). Metro stansiyası,
qəsəbə və nişangah üçün yer yoxdur. `kind` dəyərlərinə `METRO`, `SETTLEMENT`, `LANDMARK`
əlavə edilməli, `Property`-də isə `metroId` və `landmark` sahələri olmalıdır.

## 4. Sənəd, ipoteka və kredit

Bakı bazarında alıcının ilk sualı budur, ona görə hər üç portalda **filtr səviyyəsində** var:

| Filtr | bina.az etiketi | Məna |
|---|---|---|
| Sənəd | `Çıxarış var` | Dövlət reyestrindən çıxarış (kupça) mövcuddur |
| İpoteka | `İpoteka var` | İpoteka Fondunun şərtlərinə uyğundur |
| Kredit | `Daxili kredit` | Tikinti şirkətinin öz taksiti |

kub.az əlavə olaraq «sənədsiz» variantını da saxlayır. yeniemlak.az sənəd növlərini
`Kupça` / `İcarə müqaviləsi` / `Çıxarış yoxdur` kimi ayırır.

**Bizdə var:** `DOCUMENT_STATUSES`. **Bizdə yoxdur:** ipoteka və daxili kredit bayraqları —
`Property`-yə `mortgageAvailable` və `installmentAvailable` boolean sahələri lazımdır.
Bunlar həm filtr, həm kart üzərində nişan kimi işlədilir.

## 5. Təmir

bina.az sadə üçlü seçim işlədir: `Fərqi yoxdur` · `Təmirli` · `Təmirsiz`.
Bəzi portallar altı pilləli şkala saxlayır (təmirsiz, qismən təmirli, yüngül təmirli,
orta təmirli, yaxşı təmirli, əla təmirli), lakin **bazar standartı ikilidir** — istifadəçi
əsasən «təmirli/təmirsiz» axtarır.

**Bizdə var:** `RENOVATIONS`. Sabitin dəyərləri bina.az-ın ikili modelinə uyğunlaşdırılmalı,
daha incə dərəcələr isteğe bağlı qalmalıdır.

## 6. Ədədi sahələr

| Sahə | bina.az | Bizim sxem | Boşluq |
|---|---|---|---|
| Qiymət | min/maks, ₼ | var | — |
| Otaq sayı | 1 · 2 · 3 · 4 · 5+ | var | filtr «5+» qruplaşdırması yoxdur |
| Sahə, m² | min/maks | var | — |
| Torpaq sahəsi, sot | min/maks | **yoxdur** | torpaq və həyət evi üçün mütləqdir |
| Mərtəbə | min/maks | var | — |
| Mərtəbələrin sayı | ayrıca sahə | var | — |
| Elanın nömrəsi | birbaşa ID axtarışı | **yoxdur** | operator üçün faydalı |

**Mərtəbə üzrə üç xüsusi filtr** bina.az-da ayrıca düymələrdir və yerli alıcı davranışını
əks etdirir: `1-ci olmasın` · `Ən üst olmasın` · `Yalnız ən üst`.
Bunlar sadə min/maks ilə əvəz olunmur — ayrıca boolean filtr kimi qurulmalıdır.

**«Sot»** vahidi torpaq elanlarında m²-nin yerini tamamilə tutur (1 sot = 100 m²). Kartda
`3 sot`, `5.7 sot`, `50 sot` kimi göstərilir. `Property`-yə `landArea` (sot) sahəsi lazımdır.

## 7. Satıcı tipi

`Mülkiyyətçi` · `Vasitəçi (agent)` · `Agentlik` · `Tikinti şirkəti`

bina.az kartda mavi `Agentlik` nişanı, detal səhifəsində isə «Vasitəçi (agent)» yazısı göstərir.
kub.az filtrində `Ancaq mülkiyyətçi` / `Ancaq vasitəçi` seçimi var; bina.az-da
`Yalnız tikinti şirkətləri` filtri mövcuddur.

Luxe Home Estate tək agentlikdir, ona görə bu ox **filtr kimi lazım deyil**, lakin elanın
mənbəyini (şirkətin öz portfeli / tərəfdaş) daxili sahə kimi saxlamaq admin üçün faydalıdır.

## 8. Elan kartının anatomiyası (bina.az)

Sıralama dəqiq bu ardıcıllıqladır:

```
[şəkil]  [nişan: Agentlik | Daxili kredit | Kompleks]  [♡]
195 000 ₼
Nəsimi m.
3 otaqlı • 75 m² • 3/16 mərtəbə
Bakı, bugün 18:50
```

Diqqətçəkən qərarlar:

- **Qiymət başlıqdan əvvəl gəlir və ən iri elementdir.** Başlıq ümumiyyətlə kartda yoxdur.
- Yer bir sətir, bir dəyər.
- Texniki göstəricilər bir sətirdə nöqtə ilə ayrılır.
- Tarix nisbi formatdadır («bugün 18:50»), mütləq tarix deyil.
- Torpaq elanlarında otaq/mərtəbə sətri tamamilə düşür, yerinə `3 sot` gəlir.

## 9. Detal səhifəsinin anatomiyası (bina.az)

```
Breadcrumb: Daşınmaz əmlak › Bakı › Alqı-satqı › 3 otaqlı yeni tikililər
H1: Satılır 3 otaqlı yeni tikili 75 m², Nəsimi m.
Qalereya: 1/12 · «Bütün şəkillər» · «+4 şəkil»
Təsvir + «Daha çox oxu»
Ünvan: Bakı, Mir Cəlal küç. · «Xəritədə bax»
Yer çipləri: Binəqədi r. · Nəsimi m. · 9-cu mikrorayon q. · Zərifə Əliyeva adına park
Meta: № 6216262 · Baxış sayı: 1463 · Yeniləndi: Bugün, 18:50
Qiymət: 195 000 AZN
        2 600 AZN/m²          ← hesablanmış vahid qiymət
Göstəricilər: 3 otaqlı / yeni tikili | 75 m² sahə | 3/16 mərtəbə
Nişanlar: Çıxarış · Təmir
Satıcı: ad · «Vasitəçi (agent)» · [Nömrəni göstər] +994 •••
Agentlik kartı: ad · iş saatları · ünvan · «Bütün 472 təklifə baxmaq»
```

İki güclü detal:

1. **`AZN/m²` avtomatik hesablanır** və qiymətin altında göstərilir. Alıcı elanları məhz bu
   rəqəmlə müqayisə edir. Bizdə yoxdur — `price / area` kimi törəmə dəyər olaraq əlavə edilməlidir.
2. **Telefon nömrəsi gizlidir**, «Nömrəni göstər» düyməsi ilə açılır. Bu, həm spam-a qarşı
   tədbir, həm də ölçülə bilən konversiya hadisəsidir.

## 10. Şəkil qaydaları (bina.az elan formasından)

- **Minimum 4, maksimum 30 şəkil**
- Qadağan: skrinşotlar, çərçivəli fotolar, loqo və ya yazı olan fotolar, bulanıq fotolar

Bu, admin panelin yükləmə axını üçün birbaşa tələb dəstidir: minimum say yoxlaması, ölçü/keyfiyyət
yoxlaması və cover seçimi.

## 11. Elan yerləşdirmə formasının sahə dəsti (bina.az, «Yeni tikili» + «Satıram»)

Məcburi sahələr `*` ilə:

```
Əmlakın növü *          Yeni tikili
Şəhər *
Rayon *
Əmlak haqqında *        (otaq, sahə, mərtəbə bloku)
  Otaq sayı *
  Sahə, m² *
  Mərtəbə *
  Mərtəbələrin sayı *
  Təmir                 Təmirli | Təmirsiz
Şəkil *                 min 4, maks 30
Əlavə məlumat           maks 3000 simvol
Qiymət *
  Çıxarış var           (bayraq)
  İpoteka var           (bayraq)
Əlaqə məlumatları *     Elanın sahibi | Mən vasitəçiyəm
  Ad *
  E-mail *
  Telefon nömrəsi *
```

**Təsvir limiti 3000 simvoldur** — bizim admin redaktorunda da eyni həddi qoymaq məntiqlidir.

## 12. Bazar rəqəmləri (AQP, May 2026 — rəsmi)

Baza: Dekabr 2025 = 100.

| Seqment | Median | İndeks | Dəyişmə |
|---|---|---|---|
| Ümumi bazar | 2 750 ₼/m² | 106.0 | +6.0% |
| Yeni tikili | 2 750 ₼/m² | 104.2 | +4.2% |
| Təkrar bazar | 2 585 ₼/m² | 102.6 | +2.6% |
| Kommersiya | 2 940 ₼/m² | 100.8 | +0.8% |
| Qaraj | 1 400 ₼/m² | 109.5 | +9.5% |
| Torpaq | 15 464 ₼/sahə | 116.0 | +16.0% |

Kirayə medianları: yeni tikili **11 ₼/m²**, təkrar bazar **10 ₼/m²**,
taunhaus **12.5 ₼/m²**, kommersiya **16.2 ₼/m²**.

Satış müddəti: **110–150 gün**.

Rayonlar üzrə (ikinci bazar, 2026 icmalları): ən baha Nəsimi ~3 126 ₼/m², Nərimanov ~3 006 ₼/m²,
Yasamal ~2 822 ₼/m²; ən sərfəli Suraxanı ~1 836 ₼/m². Ümumi diapazon **1 800 – 3 150 ₼/m²**.

Bu rəqəmlər filtrlərin qiymət addımlarını təyin etmək üçün istifadə olunmalıdır. Məsələn
mənzil üçün mənalı qiymət pillələri: 50k / 100k / 150k / 200k / 300k / 500k / 1M ₼.
Kirayə üçün: 300 / 500 / 800 / 1200 / 2000 / 3000+ ₼.

---

## 13. Nəticə — bizim sxemdəki boşluqlar

Prioritet sırası ilə:

1. `buildingType` (`NEW` | `OLD`) — bazarın ən vacib ikinci ölçüsü, hazırda yoxdur
2. `Location.kind`-ə `METRO`, `SETTLEMENT`, `LANDMARK` əlavəsi + `Property.metroId`
3. `landArea` (sot) — torpaq və həyət evi elanları onsuz göstərilə bilmir
4. `mortgageAvailable`, `installmentAvailable` bayraqları
5. `DAILY` elan növü (və ya `pricePeriod: DAY` üzərindən üçüncü filtr düyməsi)
6. Hesablanmış `pricePerSquareMeter` — kartda və detalda göstərilir
7. Mərtəbə üzrə üç xüsusi filtr: 1-ci olmasın / ən üst olmasın / yalnız ən üst
8. Elan nömrəsi ilə birbaşa axtarış
9. Şəkil sayı yoxlaması (min 4, maks 30) və təsvir limiti (3000 simvol)
10. Telefonun «Nömrəni göstər» arxasında gizlədilməsi

1–4 bəndləri **Faza 2-dən əvvəl** sxemə düşməlidir, çünki admin formaları onların üzərində qurulur.
