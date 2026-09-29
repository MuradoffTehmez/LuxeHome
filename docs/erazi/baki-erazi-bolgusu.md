# Bakı üzrə ərazi bölgüsü — mənbələr, siyahı və saytda tətbiq

> Yoxlama tarixi: **28 sentyabr 2026**. Sənəd `python scripts/build-location-report.py` ilə `prisma/baku-market-locations.json` və Ünvan Reyestri snapshot-larından (`prisma/unvanportali-*.json`) qurulur — əl ilə redaktə etmə.

## Qısa nəticə

| Qat | Say | Mənbə | Saytda |
|---|---:|---|---|
| Şəhər rayonu | 12 | DSK təsnifatı + Ünvan Reyestri | `DISTRICT`, rəsmi kodla |
| Rəsmi qəsəbə | 59 | DSK təsnifatı + Ünvan Reyestri | `SETTLEMENT`, rəsmi kodla (rayonla eyniadlı 4-ü rayonun özü ilə seçilir) |
| Rəsmi kənd | 0 | DSK: Bakıda kənd yoxdur | — |
| Bazar massivi / mikrorayon | 62 | bina, kub, arenda, yeniemlak, lalafo; rayon OSM ilə yoxlanıb | `NEIGHBORHOOD` |
| Metro stansiyası | 27 | bina, arenda, lalafo, yeniemlak | `METRO` |
| Nişangah | 214 | bina, kub, yeniemlak (dublikatsız) | `LANDMARK`, elanda `landmarkId` |
| Rəsmi küçə/prospekt/döngə (Bakı) | 10865 | Ünvan Reyestri (unvanportali.az) | «Küçə» sahəsində təklif |

**Əsas qayda:** rəsmi inzibati vahid (rayon, qəsəbə, kənd) ilə bazarda işlənən ad (massiv, mikrorayon, bağ, nişangah, küçə) eyni səviyyədə saxlanmır. Rəsmi statusu yalnız Dövlət Statistika Komitəsinin təsnifatı və Ünvan Reyestri verir; elan saytlarının «qəs.» yazması status yaratmır.

## Mənbələr

| Mənbə | Nə götürüldü | Snapshot |
|---|---|---|
| [DSK — İnzibati Ərazi Bölgüsü Təsnifatı, 2024](https://e-qanun.az/framework/57325) | 12 rayon, 59 qəsəbə, 0 kənd | `prisma/az-admin-divisions.json` |
| [Ünvan Portalı](https://unvanportali.az/) — `api/adminUnits/list?parentId=<kod>` | bütün 75 şəhər/rayon üzrə rəsmi ağac və kodlar | `prisma/unvanportali-admin-units.json` |
| Ünvan Portalı — `api/throughFares/<vahid>` | 62991 rəsmi küçə/prospekt/döngə/meydan/şose | `prisma/unvanportali-streets.json` → `public/data/kuceler/` |
| [bina.az](https://bina.az) — `LocationGroups` GraphQL | 13 rayon, 25 metro, 104 qəsəbə/massiv, 112 nişangah (valideynlə) | `docs/erazi/sources/bina-az.json` |
| [kub.az](https://kub.az) | 125 məntəqə, 25 metro, 160 nişangah | `docs/erazi/sources/kub-az.json` |
| [arenda.az](https://arenda.az) | 112 Bakı məntəqəsi, 27 metro, 73 Sumqayıt ərazisi | `docs/erazi/sources/arenda-az.json` |
| [yeniemlak.az](https://yeniemlak.az) | Bakı rayonları üzrə məntəqələr, ətraflı axtarış (nişangahlar), Abşeron (19), Sumqayıt (75) | `docs/erazi/sources/yeniemlak-az.json`, `yeniemlak-az-etrafli.txt` |
| [lalafo.az](https://lalafo.az) — `params/filter` API | 113 məntəqə, 26 metro, 12 rayon | `docs/erazi/sources/lalafo-az.json` |
| [tap.az](https://tap.az/elanlar/dasinmaz-emlak) | Strukturlu filtr yoxdur («Yerləşmə yeri» sərbəst mətndir); 1 440 elan başlığının yer hissəsi sayılıb — 119 ad, hamısı ağacda var, metro qısaltmaları alias oldu | `docs/erazi/sources/tap-az-titles.json` |
| [emlak.az](https://emlak.az) | Cloudflare yoxlaması səbəbindən birbaşa oxunmadı; axtarış indeksindəki rayon/metro/qəsəbə səhifələri toplanıb — hamısı ağacda var | `docs/erazi/sources/emlak-az-index.json` |
| [evimemlak.az](https://evimemlak.az) | Yalnız Naxçıvan MR: Naxçıvan şəhəri + 7 rayon (hamısı ağacda var); məhəllə siyahısı yoxdur | — |
| bina.az / kub.az / lalafo.az — digər şəhərlər | Bakıdan kənarda demək olar ki, bölgü yoxdur (Naxçıvan MR rayonları, Quzanlı, Nabran) | `docs/erazi/sources/bina-az-other-cities.json`, `lalafo-az.json` |
| OpenStreetMap / Nominatim | Mənbələr ziddiyyətli olanda rayon sərhədi yoxlaması | — |
| İstifadəçinin araşdırması (`Desktop/erazi`) | Rəsmi kodlar, RİH məlumatları, yazılış düzəlişləri | — |

## Mənbələr arasındakı ziddiyyətlər və qərar

| Ad | Ziddiyyət | Qərar və əsas |
|---|---|---|
| 8-ci kilometr | Köhnə saytda Binəqədi | **Nizami** — bina, kub, arenda, yeniemlak, lalafo |
| Günəşli | Köhnə saytda Binəqədi | **Suraxanı** — bina, lalafo |
| 6–9-cu mikrorayon | Köhnə saytda 6–8-ci Nəsimi | **Binəqədi** — Binəqədi RİH, bütün bazar saytları |
| Alatava | Köhnə saytda Nizami; bina «2-ci Alatava»nı Binəqədi yazır | **1-ci Alatava → Nəsimi, 2-ci Alatava → Yasamal** — OSM sərhədi, yeniemlak |
| Sovetski | Köhnə saytda Nərimanov; bina/kub nişangah kimi | **Yasamal massivi** — Vikipediya |
| Baksol | İstifadəçi siyahısında Binəqədi | **Nərimanov** — OSM (Böyükşor yaxınlığı) |
| Çermet | Rayon göstərilmir | **Nərimanov** — OSM (Ziya Bünyadov pr.) |
| Çiçək | bina Abşeron, yeniemlak Binəqədi | **Binəqədi** (Sulutəpə) — yeniemlak, yerli mənbələr; Abşeronun rəsmi siyahısında yoxdur |
| Zağulba | bina Abşeron, yeniemlak Xəzər | **Xəzər** — OSM, yeniemlak |
| Albalılıq / Albalı | bina Albalılığı Sabunçu yazır | **Albalılıq → Xəzər (Buzovna)** — OSM; **Albalı → Sabunçu** — kub, yeniemlak, lalafo |
| Gürgən | bina Xəzər | **Pirallahı** — rəsmi qəsəbə (DSK, Ünvan Reyestri) |
| Bilgəh | istifadəçi siyahısında Xəzər («Bilgəh yolu») | **Sabunçu** — rəsmi qəsəbə |
| Müşfiqabad, Səngəçal | bazar yazılışı | Rəsmi ad **Müşviqabad, Sanqaçal**; bazar yazılışı alias |
| Kirov qəsəbəsi | kub.az ayrıca yer kimi | **M.Ə.Rəsulzadə**-nin 1999-a qədərki adı — alias |
| Nübar, Atyalı, Corat, Kimyaçılar şəhərciyi, Nasosnu | bazar saytları «Bakı» altında | Bakı deyil: Nübar/Atyalı — Abşeron massivi; Corat — Sumqayıt qəsəbəsi; Nasosnu — Hacı Zeynalabdinin alias-ı |
| Şuşa (Sabunçu) | kub, yeniemlak «Şuşa» yazır, rayon göstərmir | **Şuşa şəhərciyi → Sabunçu** (Yeni Ramana/Ramana) — emlak.az elanları və yerli mənbələr təsdiqləyir |
| Yeni Gəncə, Gülüstan | tap.az başlıqlarında «qəs.» | **Gəncə massivi** — evv.az/homdom.az elanları təsdiqləyir |
| Məhəmmədi | tap.az-da bir elan | «Məhəmmədli»nin yazı səhvi — alias, ayrıca yer yox |
| Qurd qapısı | arenda məntəqə kimi | **Əlavə edilmədi** — qəbiristanlıqdır |
| Suraxanı qəs., Yasamal qəs. | bazar saytları ayrıca qəsəbə | Rayonun özü ilə seçilir (rəsmi qəsəbə deyil / ad təkrarı) |
| Sumqayıt: 72-ci / 76-cı məhəllə | hər biri yalnız bir saytda (arenda / yeniemlak) | **Əlavə edilmədi** — iki mənbədə təsdiqlənənlər (17 mikrorayon, 40 məhəllə, 10 ərazi) saxlanılıb |
| Sumqayıt: «21-ci mərhələ» | arenda.az yazılışı | Yazı səhvi — **21-ci məhəllə** (yeniemlak ilə eyni) |
| Naxçıvan şəhərinin məhəllələri | evimemlak.az-da strukturlu siyahı yoxdur, yalnız elan başlıqlarında | **Əlavə edilmədi** — tək və qeyri-strukturlu mənbə; rəsmi kənd/qəsəbələr reyestrdən gəlir |
| DSK və reyestr yazılışı fərqli olanda | məs. köhnə adlar (Orconikidze, Nehrəm) | Mövcud elanların slug-ı qorunsun deyə DSK yazılışı saxlanılır; reyestr kodu normallaşdırılmış açarla bağlanır |

## Bakı: rayon, rəsmi qəsəbə və bazar massivləri

### Binəqədi rayonu — kod `00100003`, rayon səviyyəsində 65 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| 28 May | `00104016` | 89 | — |
| Biləcəri | `00102016` | 297 | — |
| Binəqədi | `00103016` | 496 | — |
| M.Ə.Rəsulzadə | `00105016` | 159 | Rəsulzadə, Məhəmməd Əmin Rəsulzadə, Kirov qəsəbəsi |
| Sulutəpə | `00101026` | 221 | — |
| Xocəsən | `00101016` | 67 | Xocasən |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| 6-cı mikrorayon | 6 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma, rəsmi/xəbər, tap |
| 7-ci mikrorayon | 7 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma, rəsmi/xəbər, tap |
| 8-ci mikrorayon | 8 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma, rəsmi/xəbər, tap |
| 9-cu mikrorayon | 9 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma, rəsmi/xəbər |
| Dərnəgül | — | yeniemlak, araşdırma, OSM |
| Xutor | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, OSM |
| Çiçək | — | kub, arenda, yeniemlak, lalafo, rəsmi/xəbər |
| Motodrom | — | araşdırma, rəsmi/xəbər |

### Nərimanov rayonu — kod `00700003`, rayon səviyyəsində 184 rəsmi küçə

Rəsmi qəsəbə yoxdur — ərazi sahə inzibati ərazi dairələri ilə idarə olunur.

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Montin | — | kub, arenda, yeniemlak, lalafo, araşdırma, OSM |
| Böyükşor | — | bina, kub, arenda, yeniemlak, OSM |
| Baksol | — | lalafo, araşdırma, OSM |
| Çermet | — | yeniemlak, lalafo, OSM |
| 6-cı parallel | 6-cı paralel, 6-cı Xrebtovı | yeniemlak, rəsmi/xəbər |

### Nəsimi rayonu — kod `00800003`, rayon səviyyəsində 138 rəsmi küçə

Rəsmi qəsəbə yoxdur — ərazi sahə inzibati ərazi dairələri ilə idarə olunur.

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| 1-ci mikrorayon | 1 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| 2-ci mikrorayon | 2 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| 3-cü mikrorayon | 3 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma, emlak |
| 4-cü mikrorayon | 4 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| 5-ci mikrorayon | 5 mkr | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| Kubinka | — | bina, kub, arenda, yeniemlak, lalafo, OSM |
| Papanin | — | kub, arenda, yeniemlak, araşdırma, OSM |
| 1-ci Alatava | Alatava 1 | kub, arenda, yeniemlak, OSM |

### Nizami rayonu — kod `00900003`, rayon səviyyəsində 66 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Keşlə | `00901016` | 82 | — |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| 8-ci kilometr | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma |

### Qaradağ rayonu — kod `00200003`, rayon səviyyəsində 0 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Baş Ələt | `00201026` | 28 | — |
| Heybət | `00204026` | 0 | — |
| Korgöz | `00206016` | 54 | — |
| Kotal | `00201036` | 7 | — |
| Lökbatan | `00204016` | 150 | — |
| Müşviqabad | `00208016` | 81 | Müşfiqabad |
| Pirsaat | `00201056` | 0 | — |
| Puta | `00209016` | 24 | — |
| Qaradağ | `00203026` | 1 | — |
| Qarakosa | `00201076` | 0 | — |
| Qobustan | `00207016` | 147 | — |
| Qızıldaş | `00202016` | 49 | — |
| Sahil | `00203016` | 33 | — |
| Sanqaçal | `00210016` | 52 | Səngəçal, Sangaçal |
| Yeni Ələt | `00201066` | 0 | — |
| Çeyildağ | `00205016` | 6 | Ceyildağ |
| Ümid | `00211016` | 19 | — |
| Şonqar | `00202026` | 8 | — |
| Şubanı | `00204036` | 16 | Şubani |
| Şıxlar | `00201046` | 27 | — |
| Ələt | `00201016` | 64 | — |

### Sabunçu rayonu — kod `00500003`, rayon səviyyəsində 0 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Bakıxanov | `00501016` | 140 | — |
| Balaxanı | `00502016` | 82 | — |
| Bilgəh | `00503016` | 135 | — |
| Kürdəxanı | `00504016` | 428 | — |
| Maştağa | `00505016` | 646 | Məştağa |
| Nardaran | `00506016` | 181 | — |
| Pirşağı | `00507016` | 166 | — |
| Ramana | `00508016` | 488 | — |
| Sabunçu | `00509016` | 139 | — |
| Zabrat | `00510016` | 286 | — |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Yeni Ramana | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, emlak, tap |
| Yeni Balaxanı | — | bina, kub, lalafo, OSM |
| Savalan | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| Albalı | — | kub, yeniemlak, lalafo, araşdırma |
| Zabrat 1 | I Zabrat, 1-ci Zabrat | yeniemlak, araşdırma, rəsmi/xəbər, emlak |
| Zabrat 2 | II Zabrat, 2-ci Zabrat | yeniemlak, araşdırma |
| Sea Breeze | — | bina, yeniemlak, OSM |
| Ləhic bağları | Ləhiş bağları | yeniemlak, rəsmi/xəbər |
| Şuşa şəhərciyi | Şuşa qəsəbəsi | kub, yeniemlak, emlak, rəsmi/xəbər |

### Səbail rayonu — kod `00400003`, rayon səviyyəsində 196 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Badamdar | `00401016` | 129 | — |
| Bibiheybət | `00402016` | 13 | Bibi Heybət |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Bayıl | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, tap |
| 20-ci sahə | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| İçərişəhər | — | kub, arenda, yeniemlak, araşdırma |
| Şıxov | Şıx | bina, kub, lalafo, yeniemlak, OSM |

### Suraxanı rayonu — kod `00600003`, rayon səviyyəsində 0 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Bülbülə | `00601016` | 129 | — |
| Hövsan | `00603016` | 709 | — |
| Qaraçuxur | `00604016` | 149 | — |
| Yeni Suraxanı | `00605016` | 160 | Y.Suraxanı |
| Zığ | `00606016` | 188 | — |
| Əmircan | `00602016` | 100 | — |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Yeni Günəşli | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, emlak, tap |
| Günəşli | — | bina, kub, lalafo, araşdırma, tap |
| Yeni Günəşli A massivi | Massiv A | bina, kub, lalafo, araşdırma |
| Yeni Günəşli B massivi | Massiv B | bina, kub, lalafo |
| Yeni Günəşli D massivi | Massiv D | bina, kub, lalafo, araşdırma |
| Yeni Günəşli Q massivi | Massiv G, Massiv Q | bina, kub, lalafo, araşdırma |
| Yeni Günəşli V massivi | Massiv V | bina, kub, lalafo, araşdırma |
| Bahar | — | bina, kub, arenda, yeniemlak, lalafo, OSM |
| Dədə Qorqud | — | bina, kub, arenda, yeniemlak, lalafo, OSM, emlak, tap |
| Şərq | — | bina, kub, lalafo |
| Qum adası | — | yeniemlak, OSM |

### Xəzər rayonu — kod `00300003`, rayon səviyyəsində 0 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Binə | `00313016` | 508 | — |
| Buzovna | `00314016` | 581 | — |
| Mərdəkan | `00318016` | 256 | — |
| Qala | `00317016` | 626 | — |
| Türkan | `00323016` | 318 | Türkən |
| Zirə | `00324016` | 403 | — |
| Şağan | `00321016` | 101 | — |
| Şüvəlan | `00322016` | 279 | — |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Dübəndi | Dübəndi bağları | bina, kub, arenda, yeniemlak, araşdırma |
| Şimal DRES | Şimal QRES | bina, kub, arenda, yeniemlak, lalafo, araşdırma, OSM |
| Zağulba | Zaqulba, Zuğulba | kub, arenda, yeniemlak, lalafo, araşdırma, OSM, emlak |
| Albalılıq | — | bina, araşdırma, OSM |
| Xaşaxuna | — | kub, yeniemlak, OSM, emlak |
| Binə Atçılıq | — | bina, araşdırma, OSM |

### Xətai rayonu — kod `01000003`, rayon səviyyəsində 289 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Əhmədli | `01001016` | 40 | — |

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Ağ şəhər | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| Həzi Aslanov | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma |
| Köhnə Günəşli | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, tap |
| NZS | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, OSM, tap |
| Qara şəhər | — | kub, arenda, yeniemlak, rəsmi/xəbər |
| UPD | — | arenda, yeniemlak, lalafo, OSM |

### Yasamal rayonu — kod `01100003`, rayon səviyyəsində 214 rəsmi küçə

Rəsmi qəsəbə yoxdur — ərazi sahə inzibati ərazi dairələri ilə idarə olunur.

**Bazar massivləri (rəsmi vahid deyil):**

| Ad | Alternativ yazılış | Mənbələr |
|---|---|---|
| Yeni Yasamal | — | bina, kub, arenda, yeniemlak, lalafo, araşdırma, tap |
| 2-ci Alatava | Alatava 2, Alatava | bina, kub, lalafo, yeniemlak, OSM |
| Sovetski | — | bina, kub, yeniemlak, rəsmi/xəbər |
| Şamaxinka | — | arenda, rəsmi/xəbər |

### Pirallahı rayonu — kod `01200003`, rayon səviyyəsində 0 rəsmi küçə

**Rəsmi qəsəbələr:**

| Qəsəbə | Kod | Rəsmi küçə | Alternativ yazılış |
|---|---|---:|---|
| Gürgən | `01204016` | 94 | — |
| Neft Daşları | `01203016` | 0 | — |
| Pirallahı | `01201016` | 59 | — |
| Çilov | `01202016` | 3 | — |

## Metro stansiyaları (27)

İçərişəhər, Sahil, 28 May, Cəfər Cabbarlı, Gənclik, Nəriman Nərimanov, Bakmil, Ulduz, Koroğlu, Qara Qarayev, Neftçilər, Xalqlar Dostluğu, Əhmədli, Həzi Aslanov, Şah İsmayıl Xətai, Nizami, Elmlər Akademiyası, İnşaatçılar, 20 Yanvar, Memar Əcəmi, Nəsimi, Azadlıq prospekti, Dərnəgül, Xocəsən, Memar Əcəmi-2, Avtovağzal, 8 Noyabr.

«Memar Əcəmi-2» bənövşəyi xəttin ayrıca stansiyasıdır (arenda.az ayrıca göstərir); bina/kub onu «Memar Əcəmi» ilə birləşdirir.

## Nişangahlar (214)

bina.az, kub.az və yeniemlak.az siyahılarının birləşməsidir. Dublikatlar birləşdirilib («ANS» = «ANS telekanalı», «Botanika bağı» = «Mərkəzi Nəbatat bağı», «Filarmoniya bağı» = «Qubernator parkı», «MUM» = «Mərkəzi Univermaq»), massiv/metro ilə təkrarlananlar (Ağ şəhər, İçəri Şəhər, Sovetski, Gürgən, Perekeşkül, Neftçilər metrosu) çıxarılıb, Abşerondakılar (Qurtuluş 93, Gənclər şəhərciyi) Abşeron massivi kimi saxlanılıb.

| Nişangah | Alternativ ad | Mənbələr |
|---|---|---|
| 28 Mall | — | kub, yeniemlak |
| A.S.Puşkin parkı | Puşkin parkı | kub, yeniemlak |
| AAF Park | — | yeniemlak |
| Absheron Marriott otel | — | kub, yeniemlak |
| Abu Arena | — | yeniemlak |
| ABŞ səfirliyi | — | kub, yeniemlak |
| Abşeron Ticarət Mərkəzi | — | bina |
| ADA Universiteti | — | kub, yeniemlak |
| AF Business House | — | kub, yeniemlak |
| AGA Business Center | — | kub, yeniemlak |
| Altes Plaza | — | yeniemlak |
| AMAY | — | kub, yeniemlak |
| Ambassador otel | — | kub, yeniemlak |
| ANS telekanalı | — | kub, yeniemlak |
| Aqua Park | — | yeniemlak |
| Araz kinoteatrı | — | kub, yeniemlak |
| ASAN Xidmət №1 | Asan Xidmət-1 | bina, yeniemlak |
| ASAN Xidmət №2 | Asan Xidmət-2 | bina, yeniemlak |
| ASAN Xidmət №3 | Asan Xidmət-3 | bina, yeniemlak |
| ASAN Xidmət №4 | Asan Xidmət-4 | yeniemlak |
| ASAN Xidmət №5 | Asan Xidmət-5 | bina, yeniemlak |
| ASAN Xidmət №6 | Asan Xidmət-6 | yeniemlak |
| ASK Plaza | — | yeniemlak |
| Atatürk parkı | — | yeniemlak |
| ATV telekanalı | — | kub, yeniemlak |
| Avropa otel | — | kub, yeniemlak |
| Axundov bağı | — | bina, kub, yeniemlak |
| Aygun City | — | kub, yeniemlak |
| Ayna Sultanova heykəli | — | bina, kub, yeniemlak |
| Azadlıq meydanı | — | bina, kub, yeniemlak |
| Azneft meydanı | — | bina, kub, yeniemlak |
| AZTV telekanalı | — | kub, yeniemlak |
| Azərbaycan Dillər Universiteti | — | bina, kub, yeniemlak |
| Azərbaycan Dövlət Neft və Sənaye Universiteti | Neft Akademiyası | bina, kub, yeniemlak |
| Azərbaycan kinoteatrı | — | bina, kub, yeniemlak |
| Azərbaycan Turizm İnstitutu | — | bina, kub, yeniemlak |
| Babək Plaza | — | kub, yeniemlak |
| Baku Mall | — | yeniemlak |
| Bakı Asiya Universiteti | — | bina, kub, yeniemlak |
| Bakı Dövlət Universiteti | BDU | bina, kub, yeniemlak |
| Bakı Musiqi Akademiyası | — | bina, kub, yeniemlak |
| Bakı Slavyan Universiteti | — | bina, kub, yeniemlak |
| Bakı univermağı | — | kub, yeniemlak |
| Bayıl parkı | — | bina, kub, yeniemlak |
| Beşmərtəbə | — | bina, kub, yeniemlak |
| Binə ticarət mərkəzi | — | bina, kub, yeniemlak |
| Bridge Plaza | — | kub, yeniemlak |
| C.Cabbarlı heykəli | — | kub, yeniemlak |
| C.Naxçıvanski adına Hərbi Akademiya | — | yeniemlak |
| Caspian Plaza | — | kub, yeniemlak |
| Caspian Shopping Center | — | kub, yeniemlak |
| Cavanşir körpüsü | — | bina, kub, yeniemlak |
| Crescent Bay | — | bina |
| Crystal Plaza | — | kub, yeniemlak |
| Dalğa Plaza | — | kub, yeniemlak |
| Daxili İşlər Nazirliyi | — | kub, yeniemlak |
| Dağüstü parkı | — | bina, kub, yeniemlak |
| Dostluq kinoteatrı | — | bina, kub, yeniemlak |
| Dövlət İdarəçilik Akademiyası | — | bina, kub, yeniemlak |
| Dövlət İmtahan Mərkəzi | DİM, TQDK | bina, kub |
| Dövlət Statistika Komitəsi | — | bina, kub, yeniemlak |
| Dövlət Vergi Xidməti | Vergilər Nazirliyi | kub, yeniemlak |
| Dədə Qorqud parkı | — | kub, yeniemlak |
| Dəmirçi Plaza | — | kub, yeniemlak |
| Dənizkənarı Milli park | Bulvar | kub, yeniemlak |
| Ekologiya və Təbii Sərvətlər Nazirliyi | — | kub, yeniemlak |
| Elit ticarət mərkəzi | — | bina, kub, yeniemlak |
| Elm və Təhsil Nazirliyi | Təhsil Nazirliyi | bina, kub, yeniemlak |
| Energetika Nazirliyi | — | kub, yeniemlak |
| Eurohome Biləcəri Ticarət Mərkəzi | — | bina |
| Fairmont otel | — | kub, yeniemlak |
| Flame Towers | — | yeniemlak |
| Four Seasons otel | — | kub, yeniemlak |
| Fövqəladə Hallar Nazirliyi | — | kub, yeniemlak |
| Fövqəladə Hallar Nazirliyinin Akademiyası | — | yeniemlak |
| Fəvvarələr meydanı | Fontanlar bağı | bina, kub, yeniemlak |
| Grand Hayat Residence | — | bina |
| Gənclik Mall | — | yeniemlak |
| Gənclər və İdman Nazirliyi | — | kub, yeniemlak |
| Heydər məscidi | — | yeniemlak |
| Heydər Əliyev adına İdman Kompleksi | İdman kompleksi | bina, kub |
| Heydər Əliyev Mərkəzi | — | kub, yeniemlak |
| Heydər Əliyev sarayı | — | kub, yeniemlak |
| Hilton otel | — | kub, yeniemlak |
| Hyatt Regency | — | kub, yeniemlak |
| Hüseyn Cavid parkı | — | bina, kub, yeniemlak |
| Hərbi Hospital | — | kub, yeniemlak |
| ISR Plaza | — | kub, yeniemlak |
| İctimai telekanalı | İctimai TV | kub, yeniemlak |
| İncəsənət və Mədəniyyət Universiteti | İncəsənət və Mədəniyyət Un. | bina, kub, yeniemlak |
| İnqilab Residence | — | bina |
| İqtisadiyyat Nazirliyi | İqtisadi İnkişaf Nazirliyi | kub, yeniemlak |
| İqtisadiyyat Universiteti | UNEC, İqtisad Universiteti | bina, kub, yeniemlak |
| İran səfirliyi | İran İslam Respublikası səfirliyi | yeniemlak |
| İzmir parkı | — | bina, kub, yeniemlak |
| Javahir Residence | — | bina |
| Keşlə bazarı | — | bina, kub, yeniemlak |
| Koala parkı | — | bina, kub, yeniemlak |
| Kooperasiya Universiteti | — | kub, yeniemlak |
| Koroğlu parkı | — | yeniemlak |
| Kristal Abşeron Bayıl | — | bina |
| Kristal Abşeron Qara Qarayev | — | bina |
| Kristal Abşeron Yasamal | — | bina |
| Kristal Abşeron Əcəmi | — | bina |
| Landmark | — | kub, yeniemlak |
| Laçın Ticarət Mərkəzi | — | bina |
| Lider telekanalı | Lider TV | kub, yeniemlak |
| M.Hüseynzadə parkı | — | bina, kub, yeniemlak |
| M.Ə.Sabir parkı | — | bina, kub, yeniemlak |
| Maliyyə Nazirliyi | — | kub, yeniemlak |
| Megafun | — | kub, yeniemlak |
| Melissa Azadlıq | — | bina |
| Melissa Park | — | bina |
| Memarlıq və İnşaat Universiteti | İnşaat Universiteti | bina, kub, yeniemlak |
| Merida Premium | — | bina |
| Metropark | — | kub, yeniemlak |
| Meyvəli Ticarət Mərkəzi | — | bina |
| MIDA Hövsan | — | bina |
| MIDA Hövsan 2 | — | bina |
| MIDA Yasamal | — | bina |
| Milli Aviasiya Akademiyası | Aviasiya Akademiyası | kub, yeniemlak |
| Milli Konservatoriya | — | bina, kub, yeniemlak |
| Milli Məclis | — | yeniemlak |
| Milli Təhlükəsizlik Nazirliyi | — | yeniemlak |
| Molokan bağı | Malokan bağı | kub, yeniemlak |
| Montin adına park | — | kub, yeniemlak |
| Montin bazarı | — | bina, kub |
| Moskva univermağı | — | kub, yeniemlak |
| Musabəyov parkı | — | kub, yeniemlak |
| Müdafiə Sənayesi Nazirliyi | — | kub, yeniemlak |
| Mərkəzi Neftçilər Xəstəxanası | — | yeniemlak |
| Mərkəzi Nəbatat bağı | Botanika bağı | bina, kub, yeniemlak |
| Mərkəzi Park | — | bina |
| Mərkəzi Univermaq | MUM | bina, kub, yeniemlak |
| Nargiz ticarət mərkəzi | — | kub, yeniemlak |
| Neapol dairəsi | — | bina, kub, yeniemlak, araşdırma |
| Neftçi bazası | — | bina, kub, yeniemlak |
| Nizami kinoteatrı | — | bina, kub, yeniemlak |
| Nəriman Nərimanov parkı | — | bina, kub, yeniemlak |
| Nərimanov heykəli | — | bina, kub, yeniemlak |
| Nəsimi bazarı | — | bina, kub, yeniemlak |
| Nəsimi heykəli | — | kub, yeniemlak |
| Odlar Yurdu Universiteti | — | kub, yeniemlak |
| Olimpia stadionu | — | kub, yeniemlak |
| Olimpik Star | — | yeniemlak |
| Oskar şadlıq sarayı | — | yeniemlak |
| Park Azure | — | yeniemlak |
| Park Bulvar | — | kub, yeniemlak |
| Park Inn | — | kub, yeniemlak |
| Park Yasamal 2 | — | bina |
| Park Zorge | — | bina, kub, yeniemlak |
| Pedaqoji Universiteti | — | bina, kub, yeniemlak |
| Port Baku | — | bina, kub, yeniemlak |
| Prezident parkı | — | bina, kub, yeniemlak |
| Pullman Hotel | — | yeniemlak |
| Qafqaz Resort otel | — | kub, yeniemlak |
| Qafqaz Universiteti | — | kub, yeniemlak |
| Qubernator parkı | Filarmoniya bağı | bina, kub, yeniemlak |
| Qız Qalası | — | yeniemlak |
| Qış parkı | — | bina, kub, yeniemlak |
| Qələbə dairəsi | — | kub, yeniemlak |
| Qərb Universiteti | — | kub, yeniemlak |
| Respublika stadionu | — | bina, kub, yeniemlak |
| Riyad Ticarət Mərkəzi | — | bina |
| Royal Residence | — | bina |
| Rusiya səfirliyi | — | bina, kub, yeniemlak |
| Rəqəmsal İnkişaf və Nəqliyyat Nazirliyi | Nəqliyyat Nazirliyi, Rabitə və Yüksək Texnologiyalar Nazirliyi | kub, yeniemlak |
| Rəssamlıq Akademiyası | — | bina, kub, yeniemlak |
| Sahil bağı | — | bina, kub, yeniemlak |
| Sevgi parkı | — | yeniemlak |
| Sevil Qazıyeva parkı | — | bina, kub, yeniemlak |
| Sevinc kinoteatrı | Sevinc k/t | kub, yeniemlak |
| Sirk | — | bina, kub, yeniemlak |
| Space TV | — | bina, kub, yeniemlak |
| Sədərək tekstil bazarı | — | bina |
| Sədərək ticarət mərkəzi | — | bina, kub, yeniemlak |
| Sədərək təsərrüfat bazarı | — | bina |
| Sədərək xalça bazarı | — | bina |
| Sədərək «Elit» | — | bina |
| Sədərək şirniyyat bazarı | — | bina |
| Səhiyyə Nazirliyi | — | kub, yeniemlak |
| Səməd Vurğun parkı | — | bina, kub, yeniemlak |
| Sərhədçi İdman Kompleksi | — | yeniemlak |
| Tarqovu | Torqovı, Nizami küçəsi | yeniemlak |
| Texniki Universiteti | — | bina, kub, yeniemlak |
| Tibb Universiteti | — | bina, kub, yeniemlak |
| Tofiq Bəhramov stadionu | — | kub, yeniemlak |
| Türkiyə səfirliyi | — | kub, yeniemlak |
| Təfəkkür Universiteti | — | kub, yeniemlak |
| Təzə bazar | — | kub, yeniemlak |
| Ukrayna dairəsi | — | bina, kub, yeniemlak |
| Vətən kinoteatrı | — | kub, yeniemlak |
| World Business Center | — | kub, yeniemlak |
| Xalça Muzeyi | — | bina, kub, yeniemlak |
| Xaqani bağı | — | bina |
| Xaqani ticarət mərkəzi | Xəqani ticarət mərkəzi | bina, kub, yeniemlak |
| Xarici İşlər Nazirliyi | — | kub, yeniemlak |
| Xəzər Universiteti | — | kub, yeniemlak |
| Yasamal bazarı | — | bina, kub, yeniemlak |
| Yasamal parkı | — | kub, yeniemlak |
| Yaşıl bazar | — | kub, yeniemlak |
| Zabitlər parkı | — | bina, kub, yeniemlak |
| Zoopark | — | bina, kub, yeniemlak |
| Zərifə Əliyeva adına park | — | bina, kub, yeniemlak |
| Çin səfirliyi | — | yeniemlak |
| Çıraq Plaza | — | kub, yeniemlak |
| Özbəkistan səfirliyi | — | yeniemlak |
| Şüvəlan Park ticarət mərkəzi | Şüvəlan ticarət mərkəzi | kub, yeniemlak |
| Şəfa stadionu | — | bina, kub, yeniemlak |
| Şəhidlər xiyabanı | — | bina, kub, yeniemlak |
| Şəlalə parkı | — | bina, kub, yeniemlak |
| Şərq bazarı | — | bina, kub, yeniemlak |
| Ədliyyə Nazirliyi | — | kub, yeniemlak |
| Əmək və Əhalinin Sosial Müdafiəsi Nazirliyi | — | kub, yeniemlak |

## Digər şəhər və rayonlar (Ünvan Reyestri)

| Şəhər/rayon | Kod | Rəsmi qəsəbə / şəhər | Rəsmi kənd | Rəsmi küçə |
|---|---|---:|---:|---:|
| Abşeron | `30800001` | 10 | 7 | 2472 |
| Ağcabədi | `60800001` | 2 | 44 | 953 |
| Ağdam | `60900001` | 14 | 56 | 1180 |
| Ağdaş | `90300001` | 3 | 71 | 1091 |
| Ağdərə | `61200001` | 2 | 29 | 89 |
| Ağstafa | `50200001` | 10 | 29 | 691 |
| Ağsu | `40900001` | 1 | 79 | 826 |
| Astara | `80100001` | 3 | 88 | 656 |
| Babək | `10300001` | 0 | 30 | 3 |
| Balakən | `40100001` | 2 | 56 | 788 |
| Beyləqan | `60700001` | 16 | 23 | 861 |
| Bərdə | `61000001` | 1 | 110 | 1589 |
| Biləsuvar | `80800001` | 1 | 25 | 846 |
| Cəbrayıl | `60500001` | 1 | 22 | 106 |
| Cəlilabad | `80600001` | 3 | 118 | 1571 |
| Culfa | `10600001` | 1 | 22 | 0 |
| Daşkəsən | `50600001` | 6 | 43 | 243 |
| Füzuli | `60600001` | 18 | 40 | 662 |
| Gədəbəy | `50500001` | 1 | 107 | 670 |
| Gəncə | `20000002` | 6 | 0 | 1310 |
| Goranboy | `50900001` | 8 | 79 | 1196 |
| Göyçay | `40800001` | 1 | 55 | 782 |
| Göygöl | `50800001` | 7 | 38 | 860 |
| Hacıqabul | `91000001` | 6 | 25 | 553 |
| Xaçmaz | `30200001` | 14 | 137 | 2261 |
| Xankəndi | `70400002` | 1 | 0 | 0 |
| Xızı | `30600001` | 4 | 25 | 147 |
| Xocalı | `70100001` | 2 | 19 | 134 |
| Xocavənd | `70300001` | 3 | 38 | 109 |
| İmişli | `90700001` | 2 | 49 | 914 |
| İsmayıllı | `40700001` | 3 | 105 | 891 |
| Kəlbəcər | `60100001` | 2 | 41 | 66 |
| Kəngərli | `10800001` | 1 | 10 | 0 |
| Kürdəmir | `90600001` | 3 | 59 | 800 |
| Qax | `40300001` | 1 | 58 | 684 |
| Qazax | `50100001` | 1 | 28 | 656 |
| Qəbələ | `40600001` | 4 | 60 | 974 |
| Qobustan | `30700001` | 2 | 30 | 359 |
| Quba | `30300001` | 8 | 149 | 1620 |
| Qubadlı | `60300001` | 1 | 30 | 0 |
| Qusar | `30100001` | 2 | 88 | 1196 |
| Laçın | `60200001` | 2 | 47 | 92 |
| Lerik | `80300001` | 1 | 161 | 599 |
| Lənkəran | `80200002` | 9 | 83 | 1233 |
| Masallı | `80500001` | 3 | 99 | 1678 |
| Mingəçevir | `90200002` | 0 | 0 | 274 |
| Naftalan | `51000002` | 0 | 2 | 57 |
| Naxçıvan | `10400002` | 1 | 5 | 106 |
| Neftçala | `80700001` | 4 | 48 | 641 |
| Oğuz | `40500001` | 1 | 33 | 459 |
| Ordubad | `10700001` | 4 | 36 | 0 |
| Saatlı | `90800001` | 1 | 43 | 842 |
| Sabirabad | `90900001` | 1 | 74 | 1453 |
| Salyan | `80900001` | 3 | 48 | 1035 |
| Samux | `50700001` | 7 | 28 | 728 |
| Sədərək | `10100001` | 1 | 3 | 0 |
| Siyəzən | `30500001` | 2 | 32 | 322 |
| Sumqayıt | `30900002` | 2 | 0 | 820 |
| Şabran | `30400001` | 1 | 67 | 555 |
| Şahbuz | `10500001` | 2 | 22 | 0 |
| Şamaxı | `41000001` | 6 | 57 | 973 |
| Şəki | `40400002` | 2 | 68 | 1671 |
| Şəmkir | `50400001` | 8 | 58 | 1837 |
| Şərur | `10200001` | 1 | 57 | 0 |
| Şirvan | `91100002` | 2 | 0 | 211 |
| Şuşa | `70200001` | 2 | 10 | 113 |
| Tərtər | `61100001` | 1 | 48 | 598 |
| Tovuz | `50300001` | 2 | 99 | 1540 |
| Ucar | `90400001` | 1 | 29 | 570 |
| Yardımlı | `80400001` | 1 | 84 | 465 |
| Yevlax | `90100002` | 3 | 46 | 772 |
| Zaqatala | `40200001` | 2 | 60 | 1010 |
| Zəngilan | `60400001` | 2 | 20 | 75 |
| Zərdab | `90500001` | 2 | 40 | 583 |

Abşeron bazar massivləri (rəsmi vahid deyil, 5): Qurtuluş 93 (bina, arenda, yeniemlak), Abşeron Gənclər Şəhərciyi (arenda, yeniemlak), Yeni Bakı (arenda), Atyalı (bina, kub, yeniemlak, emlak), Nübar (kub, yeniemlak, rəsmi/xəbər).

Sumqayıt bazar massivləri (rəsmi vahid deyil, 67): 1-ci mikrorayon (arenda, yeniemlak), 2-ci mikrorayon (arenda, yeniemlak), 3-cü mikrorayon (arenda, yeniemlak, emlak), 4-cü mikrorayon (arenda, yeniemlak), 5-ci mikrorayon (arenda, yeniemlak), 6-cı mikrorayon (arenda, yeniemlak), 8-ci mikrorayon (arenda, yeniemlak), 9-cu mikrorayon (arenda, yeniemlak), 10-cu mikrorayon (arenda, yeniemlak), 11-ci mikrorayon (arenda, yeniemlak), 12-ci mikrorayon (arenda, yeniemlak), 13-cü mikrorayon (arenda, yeniemlak), 16-cı mikrorayon (arenda, yeniemlak), 17-ci mikrorayon (arenda, yeniemlak), 18-ci mikrorayon (arenda, yeniemlak), 20-ci mikrorayon (arenda, yeniemlak), 21-ci mikrorayon (arenda, yeniemlak), 1-ci məhəllə (arenda, yeniemlak), 2-ci məhəllə (arenda, yeniemlak), 3-cü məhəllə (arenda, yeniemlak), 4-cü məhəllə (arenda, yeniemlak), 5-ci məhəllə (arenda, yeniemlak), 7-ci məhəllə (arenda, yeniemlak), 8-ci məhəllə (arenda, yeniemlak), 9-cu məhəllə (arenda, yeniemlak), 12-ci məhəllə (arenda, yeniemlak), 13-cü məhəllə (arenda, yeniemlak), 14-cü məhəllə (arenda, yeniemlak), 15-ci məhəllə (arenda, yeniemlak), 16-cı məhəllə (arenda, yeniemlak), 17-ci məhəllə (arenda, yeniemlak), 18-ci məhəllə (arenda, yeniemlak), 19-cu məhəllə (arenda, yeniemlak), 20-ci məhəllə (arenda, yeniemlak), 21-ci məhəllə (arenda, yeniemlak), 22-ci məhəllə (arenda, yeniemlak), 23-cü məhəllə (arenda, yeniemlak), 24-cü məhəllə (arenda, yeniemlak), 25-ci məhəllə (arenda, yeniemlak), 26-cı məhəllə (arenda, yeniemlak), 29-cu məhəllə (arenda, yeniemlak), 30-cu məhəllə (arenda, yeniemlak), 34-cü məhəllə (arenda, yeniemlak), 36-cı məhəllə (arenda, yeniemlak), 40-cı məhəllə (arenda, yeniemlak), 41-ci məhəllə (arenda, yeniemlak), 42-ci məhəllə (arenda, yeniemlak), 43-cü məhəllə (arenda, yeniemlak), 44-cü məhəllə (arenda, yeniemlak), 45-ci məhəllə (arenda, yeniemlak), 46-cı məhəllə (arenda, yeniemlak), 47-ci məhəllə (arenda, yeniemlak), 48-ci məhəllə (arenda, yeniemlak), 49-cu məhəllə (arenda, yeniemlak), 50-ci məhəllə (arenda, yeniemlak), 51-ci məhəllə (arenda, yeniemlak), 52-ci məhəllə (arenda, yeniemlak), Birləşmiş məhəllə (arenda, yeniemlak), İnşaatçılar (arenda, yeniemlak, tap), Kotec (arenda, yeniemlak), Qurd dərəsi (arenda, yeniemlak), Yaşıl dərə (arenda, yeniemlak), BTZ bağları (arenda, yeniemlak), Xəzər bağları (arenda, yeniemlak), Corat bağları (arenda, yeniemlak), Yeni Corat (arenda, yeniemlak), Yaşma bağları (arenda, yeniemlak).

Gəncə bazar massivləri (rəsmi vahid deyil, 2): Yeni Gəncə (tap, rəsmi/xəbər), Gülüstan (tap, rəsmi/xəbər).


Naxçıvan şəhərinin ərazisində rəsmi olaraq Əliabad qəsəbəsi və Bulqan, Hacıniyyət, Qaraçuq, Qaraxanbəyli, Tumbul kəndləri var; Naftalanda Qasımbəyli və Qaşaltı Qaraqoyunlu kəndləri. Gəncə üçün Ünvan Reyestri qəsəbələri rayon (Kəpəz/Nizami) üzrə bölmür — onlar şəhərə bağlı qalır.

## Saytda harada tətbiq olunur

| Yer | Nə dəyişdi |
|---|---|
| Elan forması (admin və kabinet, `LocationFields`) | Region → şəhər → rayon → qəsəbə/kənd → massiv; **metro** (kabinetdə ilk dəfə), **nişangah** və rəsmi **küçə təklifləri** (seçilmiş vahidin kodu ilə `public/data/kuceler/<kod>.json`) |
| Server validasiyası | Nişangah mövcud, `LANDMARK` növündə və seçilmiş şəhərə aid olmalıdır (admin + kabinet) |
| `/emlaklar` filtri | `?nisangah=<slug>` — desktop panel, mobil sheet, aktiv çiplər, boş nəticədə «filtri çıxar» təklifi |
| Mətn axtarışı | Alias-lar `searchName`-də (Müşfiqabad → Müşviqabad, 8 km → 8-ci kilometr); massivdəki elan rayon adı ilə də tapılır; nişangah adı ilə axtarış |
| Elan səhifəsi | «Əsas göstəricilər»də nişangah; eyni nişangahlı elanlara keçid |
| Yadda saxlanmış axtarış | `landmarkSlug` saxlanılır, xülasədə və «nəticələrə bax» keçidində göstərilir |
| CSV idxalı | Yeni `landmark` sütunu; rayon sütunu nişangahla qarışmır |
| Semantik axtarış | Embedding mətninə nişangah əlavə olunur |
| Kəndlər (~3 600) | Filtrdə yalnız ictimai elanı olanlar; formada seçilmiş rayonun kəndləri `/api/yerler/kendler`-dən yüklənir, redaktə olunan elanın kəndi server tərəfdə əlavə edilir |
| AI axtarışı | Nişangahlar və kəndlər prompta göndərilmir (token qənaəti) |
| Admin «ictimai imkanlar» | Məhəllə profili siyahısına yalnız profili olan kəndlər düşür |
| Baza | `Location.officialCode`, `Property.landmarkId`; miqrasiyalar `0050`–`0053` özü-yetərlidir (~8 000 ifadə ardıcıl hissələrdə) |

## Yeniləmə axını

```bash
# Mənbəni yenilə: prisma/baku-market-locations.json (massiv, metro, nişangah, alias)
# və ya Ünvan Reyestri snapshot-larını (prisma/unvanportali-*.json), sonra:
npm run db:locations:build   # prisma/locations-data.ts — ziddiyyətdə dayanır
npm run db:streets:build     # public/data/kuceler/*.json
npm run db:taxonomy:build    # prisma/taxonomy.sql
npm run db:locations:report  # bu sənəd
npm run db:locations:migrations  # taxonomy.sql-in yerləşmə bölməsi → migrations/0050–0053
```

## Açıq qalan məsələlər

- **emlak.az** yalnız axtarış indeksi ilə yoxlanıb; Cloudflare yoxlaması keçildikdən sonra tam filtr siyahısı tutuşdurula bilər.
- Nişangahların EN/RU adları hələlik transliterasiyadır (`localizeLocation`).
- Nişangahlar hələlik şəhərə bağlıdır; koordinatla rayona bağlamaq sonrakı mərhələdir.
