# SEO üçün biznes məlumatı və giriş blocker-ləri

Bu siyahı kodla təhlükəsiz həll edilə bilməyən qərarları göstərir. Təsdiq gələnədək həmin məlumat UI, schema, GBP və kataloqlara əlavə edilmir.

| Prioritet | Blocker | Cari təhlükəsiz davranış | Tələb olunan qərar/sübut |
| --- | --- | --- | --- |
| P0 | Ünvan ziddiyyəti: layihə mənbəyi `Əliyar Əliyev 109A`, Seobility PDF-də `45A` | Saytın təsdiqlənmiş mənbə dəyəri 109A saxlanılır; 45A tətbiq edilmir | Hüquqi sənəd və GBP/Maps faktı ilə vahid ünvan qərarı |
| P0 | GSC giriş və Domain property sahiblik təsdiqi | Env əsaslı verification hazırdır, canlı təqdimat edilməyib | DNS/Cloudflare girişli məsul şəxs və verification icazəsi |
| P0 | Cloudflare zone/rule girişləri | Kod fallback redirect və header verir; edge qaydaları manualdır | Zone admin girişi, rule təsdiqi və rollback sahibi |
| P0 | Google Business Profile giriş/sahiblik | GBP və Maps məlumatı koddan yaradılmır | Profil owner/manager dəvəti və duplicate profil yoxlaması |
| P1 | Dəqiq geo pin/koordinat | Təxmini koordinat UI və schema-dan çıxarılıb | Ofis girişində çəkilmiş Maps pin və biznes təsdiqi |
| P1 | İş saatları və bayram rejimi | UI və schema-da göstərilmir | Həftəlik cədvəl, fasilə, bayram/istisna saatları |
| P1 | Analytics/cookie consent hüquqi qərarı | Analytics açıq razılıq olmadan yüklənmir | Hüquqi mətn, consent kateqoriyaları, retention və DPO/owner təsdiqi |
| P1 | Real logo və social preview assetlərinin yekun təsdiqi | Mövcud repo assetləri istifadə olunur; saxta sertifikat/badge yoxdur | SVG/PNG master, istifadə hüququ və brand təsdiqi |
| P1 | Real ofis/komanda fotoları | Şəkil slotu URL olmayanda render olunmur; stok team fotosu yoxdur | Foto faylları, şəxslərin istifadə icazəsi, doğru alt konteksti |
| P1 | Prioritet rayon/metro siyahısı | Yalnız DB-də 3+ public elan olan taxonomy landing indexable-dir | Satış prioriteti, inventar davamlılığı və təsdiqli sıra |
| P2 | Müəllif bio və ekspert sübutları | Məqalədə DB müəllifi, yoxdursa hüquqi publisher görünür | Müəllif adı, vəzifə, bio, foto və real ixtisas sübutu |
| P2 | Etik review sorğu prosesi | Review/rating schema yaradılmır | Əməliyyatdan sonrakı neytral sorğu mətni, məsul şəxs və platforma qaydası |

## Artıq məlum olan, yenidən tələb edilməyən data

- Hüquqi ad: `Luxe Home Estate MMC`.
- VÖEN: `1507750271`.
- Brend və markanın sahibi: `Əmiyev Bahadur Qafar oğlu`.
- Telefon və e-poçt `src/config/site.ts`-də mərkəzləşdirilib.

VÖEN yenidən istənilmir. Yalnız onun public sayt, schema və üçüncü tərəf profillərində dərcinə səlahiyyət və hüquqi mətnlə uyğunluğu biznes sahibi tərəfindən təsdiqlənməlidir.

## Qəbul formatı

Hər qərar üçün tarix, qərar verən şəxs, sübut linki/faylı və təsir edən sistemlər (sayt/schema/GBP/Maps/kataloq) qeyd olunmalıdır. Şifahi təsdiq production data dəyişikliyi üçün kifayət sayılmır.
