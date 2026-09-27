# Bloq məzmun planı — Oktyabr–Dekabr 2026

Yol xəritəsi 2-ci mərhələ, maddə 37 (#105). Production-da bloq boşdur (0 yazı); bu plan
ilk 12 yazının mövzusunu, axtarış niyyətini və daxili keçidlərini müəyyən edir.

## Qaydalar

- **Uydurma rəqəm yazılmır.** Qiymət, faiz və müddət yalnız mənbə ilə verilir:
  saytın `/bazar-analitikasi` hesabatı (aktiv elanlardan hesablanır), rəsmi qurum
  (Dövlət Statistika Komitəsi, Əmlak Məsələləri Dövlət Xidməti, Mərkəzi Bank) və ya
  şirkətin öz sövdələşmə təcrübəsi. Mənbə yazının sonunda göstərilir.
- **Hüquqi məzmun** (sənəd, vergi, notarius) Bilik Mərkəzindəki təsdiqlənmiş məqaləyə
  keçid verir və hüquqşünas baxışından keçməmiş iddia irəli sürmür.
- Hər yazı **AZ əsas dildə**, sonra EN/RU tərcümə modulu ilə (`/admin/tercumeler`).
- Hər yazıda ən azı 3 daxili keçid və 1 CTA olur. SEO başlığı ≤ 60, təsvir ≤ 155 simvol.
- Ritm: həftədə 1 yazı (bazar ertəsi), ayda 4 yazı.

## Mövzular

| # | Ay | Başlıq (işçi) | Əsas açar söz | Niyyət | Daxili keçidlər | CTA |
|---|---|---|---|---|---|---|
| 1 | Okt | Bakıda mənzil alarkən sənədləri necə yoxlamalı: addım-addım | mənzil alarkən sənəd yoxlaması | Məlumat | Bilik Mərkəzi (çıxarış), `/lugat`, `/emlaklar` | Sənəd yoxlaması xidməti |
| 2 | Okt | Kupçalı və kupçasız mənzil: fərqlər və risklər | kupçalı mənzil | Məlumat | `/lugat/kupca`, `/emlaklar?sened=TITLE_DEED` | Kupçalı elanlara bax |
| 3 | Okt | Yeni tikili yoxsa köhnə tikili: kimə hansı uyğundur | yeni tikili köhnə tikili | Müqayisə | `/emlaklar?tikili=NEW`, `/emlaklar?tikili=OLD`, `/kalkulyator` | «Mənə əmlak tap» |
| 4 | Okt | Evinizi satmazdan əvvəl: qiyməti düzgün qoymağın 6 qaydası | ev satmaq qiymət | Satıcı | `/emlakimi-sat#qiymetlendir`, `/bazar-analitikasi` | Evimi qiymətləndir |
| 5 | Noy | İpoteka ilə mənzil almaq: sənədlər, ilkin ödəniş, mərhələlər | ipoteka ilə mənzil | Məlumat | `/kalkulyator`, Bilik Mərkəzi (ipoteka), `/emlaklar?xususiyyet=ipoteka` | İpoteka kalkulyatoru |
| 6 | Noy | Nərimanov rayonu: məhəllələr, metro, mənzil bazarı | Nərimanov mənzil | Yerli | `/rayon/baki-nerimanov`, `/metro/...`, `/bazar-analitikasi/...` | Rayondakı elanlar |
| 7 | Noy | Mənzili kirayə verərkən müqavilədə nələr olmalıdır | kirayə müqaviləsi | Sahib | Bilik Mərkəzi (icarə), `/emlakimi-sat` | Kirayə vermək üçün müraciət |
| 8 | Noy | Onlayn elanlarda saxtakarlıqdan necə qorunmalı | əmlak saxtakarlığı | Etibar | `/haqqimizda`, `/terefdaslar`, `/suallar` | Yoxlanılmış elanlar |
| 9 | Dek | Yasamal və Nəsimi: mərkəzdə yaşamaq üçün bələdçi | Yasamal mənzil | Yerli | `/rayon/baki-yasamal`, `/rayon/baki-nesimi` | Rayondakı elanlar |
| 10 | Dek | Əmlaka investisiya: icarə gəlirliyini necə hesablamalı | icarə gəlirliyi | İnvestor | `/bazar-analitikasi`, `/kalkulyator` | Satıcı/investor müraciəti |
| 11 | Dek | Abşeron bağ evləri: alış öncəsi yoxlama siyahısı | bağ evi almaq | Məlumat | `/emlaklar?tip=bag-evleri`, `/rayon/abseron-...` | Bağ evləri |
| 12 | Dek | 2026-nın sonu: Luxe Home Estate bazar icmalı | Bakı əmlak bazarı 2026 | Bazar | `/bazar-analitikasi`, `/emlaklar`, `/emlakimi-sat` | Evimi qiymətləndir |

## Yazı şablonu

1. **Giriş (2–3 cümlə)** — oxucunun problemi, yazının nə verəcəyi.
2. **Əsas hissə** — H2 başlıqlarla 3–6 bölmə; siyahı və cədvəllər mobil ekrana uyğun.
3. **Praktik yoxlama siyahısı** — çap edilə bilən qısa bəndlər.
4. **Tez-tez verilən 3 sual** — Bilik Mərkəzi FAQ-ına keçidlə.
5. **CTA bloku** — cədvəldəki hədəf səhifə.
6. **Mənbələr** — rəsmi link və ya «saytdakı aktiv elanlar, tarix» qeydi.

## Ölçmə

- Search Console: hər yazının göstərmə/klik sayı 30 və 90 gün sonra (`/admin/serp/search-console`).
- Konversiya: yazıdan gələn müraciətlər `Lead.landingPage` və UTM sahələri ilə
  `/admin/huni` hesabatında görünür.
- 90 gündən sonra klik gətirməyən yazı yenilənir və ya birləşdirilir.
