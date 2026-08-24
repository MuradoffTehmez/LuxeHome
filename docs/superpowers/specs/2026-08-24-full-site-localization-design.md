# Luxe Home Estate tam sayt lokalizasiyası — dizayn

Tarix: 24 avqust 2026
Status: təsdiqlənmiş istifadəçi tələbi üzrə implementasiya

## Məqsəd

Public Luxe Home Estate saytının Azərbaycan, ingilis və rus dillərində tam işləməsini təmin etmək:
dil dəyişdirildikdə naviqasiya, səhifə mətnləri, formalar, vəziyyətlər, metadata, struktur data,
formatlar və redaktə olunan public məzmun eyni URL-in seçilmiş locale variantına uyğun dəyişməlidir.

## Sərhəd

- `src/app/[locale]/(site)` altındakı bütün səhifələr və onların ortaq komponentləri daxildir.
- Public giriş/qeydiyyat keçidləri və hesab menyusunun görünən hissəsi daxildir.
- `/admin` və locale route ağacından kənardakı daxili əməliyyat paneli bu mərhələdə Azərbaycan
  dilində qalır; public dil dəyişdiricisi həmin səthə tətbiq edilmir.
- Proper noun, telefon, e-poçt, qiymət və ünvan kimi tərcümə edilməyən faktlar dəyişdirilmir.

## Arxitektura

1. `next-intl` public statik UI və route copy-si üçün tək render mexanizmidir.
2. Mesajlar domen üzrə namespace-lərə bölünür və AZ/EN/RU kataloqları eyni açar strukturunu daşıyır.
3. Server component-lər `getTranslations`, client component-lər `useTranslations` istifadə edir.
4. Linklər `src/i18n/navigation.ts` wrapper-ları ilə cari locale-i qoruyur.
5. Tarix və rəqəmlər `next-intl` formatter-ləri ilə locale üzrə formatlanır.
6. DB ilə idarə olunan public məzmun locale translation qeydləri ilə saxlanılır. Seçilmiş dildə
   tam tərcümə yoxdursa route indekslənmir və UI lokal xəbərdarlıq/fallback siyasəti tətbiq edir;
   Azərbaycan məzmunu başqa dil kimi təqdim olunmur.
7. Metadata, JSON-LD və görünən məzmun eyni lokal data mənbəyindən qurulur.

## Qəbul meyarları

- AZ, EN və RU kataloqlarının namespace və açar paritet testi keçir.
- Public source auditində istifadəçiyə görünən hardcode Azərbaycan UI mətni qalmır.
- Dil dəyişdiricisi path və query-ni qoruyur, cookie/profil seçimini yadda saxlayır.
- Əsas route matrisi hər üç locale-də 200 verir və HTML uyğun `lang`, title və H1 göstərir.
- Əmlak, layihə, xidmət, bloq və agentlik kart/detal məzmunu lokal data seçir.
- `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` keçir.
- Production deploy-dan sonra canlı brauzerdə desktop və mobil dil dəyişməsi yoxlanılır.

## Təhlükəsizlik və SEO

- Tam lokal məzmunu olmayan EN/RU route indeksə açılmır.
- Locale canonical/hreflang yalnız semantik ekvivalent səhifələr üçün yaradılır.
- Public query-lər mövcud status, `isDemo: false` və soft-delete qorumasını saxlayır.
- Tərcümə işi auth, admin səlahiyyəti və D1 data görünürlüğü qaydalarını dəyişmir.
