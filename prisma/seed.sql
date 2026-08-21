-- Luxe Home Estate — D1 seed məlumatı
-- Avtomatik yaradılıb: npm run db:seed:build

DELETE FROM "Setting";
DELETE FROM "Service";
DELETE FROM "PropertyImage";
DELETE FROM "PropertyFeature";
DELETE FROM "ProjectImage";
DELETE FROM "Media";
DELETE FROM "Lead";
DELETE FROM "Feature";
DELETE FROM "Favorite";
DELETE FROM "Property";
DELETE FROM "PropertyType";
DELETE FROM "Project";
DELETE FROM "Location";
DELETE FROM "BlogPost";
DELETE FROM "User";
DELETE FROM "BlogCategory";

-- BlogCategory (6)
INSERT INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1srtz6004tuadw4lywejkj', 'Daşınmaz əmlak', 'dasinmaz-emlak', NULL, 0);
INSERT INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1srtzh004uuadwwybsqt27', 'Bazar xəbərləri', 'bazar-xeberleri', NULL, 1);
INSERT INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1srtzr004vuadwo0wjji9g', 'Məsləhətlər', 'meslehetler', NULL, 2);
INSERT INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1sru01004wuadw7vja22bg', 'İnteryer', 'interyer', NULL, 3);
INSERT INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1sru0a004xuadwmu4ayyk1', 'Tikinti', 'tikinti', NULL, 4);
INSERT INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1sru0k004yuadwgi4aue39', 'Luxe Home Estate xəbərləri', 'luxehomeestate-xeberleri', NULL, 5);

-- User (2)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmt1srsvv0000uadwxld8t2vl', 'Sistem Administratoru', 'admin@luxehomeestate.az', 'disabled', 'SUPER_ADMIN', 0, NULL, 1787247090426, 1787247090426);
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive", "lastLoginAt", "createdAt", "updatedAt") VALUES ('cmt1srt5o0001uadwybhh82r5', 'Məzmun Redaktoru', 'redaktor@luxehomeestate.az', 'disabled', 'EDITOR', 0, NULL, 1787247090780, 1787247090780);

-- BlogPost (6)
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt", "categoryId", "authorId", "status", "isDemo", "viewCount", "readMinutes", "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1sru0w0050uadwueyaih1p', '[Nümunə] Mənzil alarkən diqqət edilməli 7 məqam', 'numune-menzil-alarken-diqqet-edilmeli-7-meqam', 'Mənzil almaq böyük qərardır. Sənədlərdən kommunikasiyaya qədər nəyi yoxlamaq lazımdır — bu nümunə yazıda ümumi baxış.', 'Bu yazı platformanın bloq bölməsinin necə işlədiyini göstərmək üçün hazırlanmış NÜMUNƏ məzmundur.

## 1. Sənədləri yoxlayın

Əmlakın çıxarışı və ya müqaviləsi olub-olmadığını dəqiqləşdirin. Sənəd vəziyyəti gələcəkdə yarana biləcək problemlərin qarşısını alır.

## 2. Binanın texniki vəziyyəti

Binanın tikinti ili, materialı və ümumi vəziyyəti mənzilin uzunmüddətli dəyərinə birbaşa təsir edir.

## 3. Kommunikasiya xətləri

Su, qaz, elektrik və kanalizasiya sisteminin vəziyyətini yerində yoxlayın.

## 4. İnfrastruktur

Yaxınlıqda məktəb, bağça, ticarət mərkəzi və nəqliyyat çıxışının olması gündəlik həyatı asanlaşdırır.

## 5. Qonşuluq

Ərazini müxtəlif saatlarda ziyarət edin — səs-küy səviyyəsi və ümumi mühit haqqında daha dəqiq təsəvvür yaranar.

## 6. Real bazar qiyməti

Oxşar əmlakların qiymətlərini müqayisə edin. Luxe Home Estate portfelində eyni ərazi üzrə variantları nəzərdən keçirə bilərsiniz.

## 7. Peşəkar dəstək

Prosesin hər mərhələsində peşəkar məsləhət vaxta və vəsaitə qənaət etməyə kömək edir.

Real və detallı məzmun şirkət tərəfindən təsdiqləndikdən sonra dərc ediləcək.', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 'Ev açarları', 'cmt1srtzr004vuadwo0wjji9g', 'cmt1srsvv0000uadwxld8t2vl', 'PUBLISHED', 1, 69, 5, 1786987891903, '[Nümunə] Mənzil alarkən diqqət edilməli 7 məqam — Luxe Home Estate Blog', 'Mənzil almaq böyük qərardır. Sənədlərdən kommunikasiyaya qədər nəyi yoxlamaq lazımdır — bu nümunə yazıda ümumi baxış.', 1786987891903, 1787247091905, NULL);
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt", "categoryId", "authorId", "status", "isDemo", "viewCount", "readMinutes", "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1sru1a0052uadw06jnkatv', '[Nümunə] İpoteka ilə mənzil almaq: proses necə gedir?', 'numune-ipoteka-ile-menzil-almaq-proses-nece-gedir', 'İpoteka müraciətindən açarların təhvilinə qədər mərhələlərin ümumi izahı — nümunə məzmun.', 'NÜMUNƏ MƏZMUN. Bu yazı bloq strukturunu göstərmək məqsədi daşıyır.

## Mərhələ 1 — İlkin qiymətləndirmə

Ödəniş imkanınızı və ilkin ödəniş məbləğini müəyyənləşdirin.

## Mərhələ 2 — Əmlakın seçimi

Bütün əmlaklar ipoteka şərtlərinə uyğun olmur. Seçim zamanı bu meyar nəzərə alınmalıdır.

## Mərhələ 3 — Sənədlərin toplanması

Gəlir arayışı, şəxsiyyət sənədi və əmlakla bağlı sənədlər tələb olunur.

## Mərhələ 4 — Qiymətləndirmə

Əmlak müstəqil qiymətləndirmədən keçirilir.

## Mərhələ 5 — Rəsmiləşdirmə

Müqavilə imzalanır və mülkiyyət hüququ qeydiyyata alınır.

Konkret şərtlər maliyyə qurumları tərəfindən müəyyən edilir. Suallarınız üçün bizimlə əlaqə saxlaya bilərsiniz.', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80', 'İpoteka sənədləri', 'cmt1srtz6004tuadw4lywejkj', 'cmt1srsvv0000uadwxld8t2vl', 'PUBLISHED', 1, 195, 6, 1786555891916, '[Nümunə] İpoteka ilə mənzil almaq: proses necə gedir? — Luxe Home Estate Blog', 'İpoteka müraciətindən açarların təhvilinə qədər mərhələlərin ümumi izahı — nümunə məzmun.', 1786555891916, 1787247091918, NULL);
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt", "categoryId", "authorId", "status", "isDemo", "viewCount", "readMinutes", "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1sru1o0054uadwrke1pk47', '[Nümunə] Kiçik mənzildə məkanı genişləndirən interyer həlləri', 'numune-kicik-menzilde-mekani-genislendiren-interyer-helleri', 'Rəng, işıq və mebel seçimi ilə kiçik sahələri daha geniş göstərmək — nümunə interyer yazısı.', 'NÜMUNƏ MƏZMUN.

## Açıq rənglər

Açıq ton divarlar işığı əks etdirir və məkanı daha geniş göstərir.

## Güzgülərdən istifadə

Düzgün yerləşdirilmiş güzgü otağın dərinlik hissini artırır.

## Çoxfunksiyalı mebel

Saxlama sahəsi olan mebel həm yer qazandırır, həm nizam yaradır.

## Şaquli saxlama

Divar boyu yüksək rəflər döşəmə sahəsini boşaldır.

## Təbii işıq

Ağır pərdələr əvəzinə yüngül materiallar seçin.

Real interyer məsləhətləri şirkət mütəxəssisləri tərəfindən hazırlandıqdan sonra dərc ediləcək.', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80', 'Müasir interyer dizaynı', 'cmt1sru01004wuadw7vja22bg', 'cmt1srsvv0000uadwxld8t2vl', 'PUBLISHED', 1, 59, 4, 1786037491930, '[Nümunə] Kiçik mənzildə məkanı genişləndirən interyer həlləri — Luxe Home Estate Blog', 'Rəng, işıq və mebel seçimi ilə kiçik sahələri daha geniş göstərmək — nümunə interyer yazısı.', 1786037491930, 1787247091932, NULL);
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt", "categoryId", "authorId", "status", "isDemo", "viewCount", "readMinutes", "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1sru1y0056uadw4tjj92m4', '[Nümunə] Bakı daşınmaz əmlak bazarına ümumi baxış', 'numune-baki-dasinmaz-emlak-bazarina-umumi-baxis', 'Bazar dinamikası, tələb istiqamətləri və alıcı davranışı haqqında nümunə icmal.', 'NÜMUNƏ MƏZMUN. Bu yazıda heç bir real statistik məlumat yoxdur.

## Ümumi mənzərə

Şəhərin müxtəlif rayonlarında tələb fərqli formalaşır. Mərkəzi rayonlarda mənzillərə, ətraf qəsəbələrdə isə həyət və bağ evlərinə maraq müşahidə olunur.

## Alıcı davranışı

Alıcılar getdikcə daha çox sənəd təmizliyinə və binanın texniki vəziyyətinə diqqət yetirir.

## Qeyd

Rəqəmlə ifadə olunan bazar statistikası yalnız təsdiqlənmiş mənbələrə əsaslandıqda dərc ediləcək.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80', 'Bakı şəhər panoraması', 'cmt1srtzh004uuadwwybsqt27', 'cmt1srsvv0000uadwxld8t2vl', 'PUBLISHED', 1, 215, 5, 1785519091941, '[Nümunə] Bakı daşınmaz əmlak bazarına ümumi baxış — Luxe Home Estate Blog', 'Bazar dinamikası, tələb istiqamətləri və alıcı davranışı haqqında nümunə icmal.', 1785519091941, 1787247091943, NULL);
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt", "categoryId", "authorId", "status", "isDemo", "viewCount", "readMinutes", "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1sru2a0058uadwntvgsw7p', '[Nümunə] Təmirə başlamazdan əvvəl hazırlanmalı plan', 'numune-temire-baslamazdan-evvel-hazirlanmali-plan', 'Smeta, material seçimi və iş qrafiki — təmir prosesini idarə etmək üçün nümunə yol xəritəsi.', 'NÜMUNƏ MƏZMUN.

## Smetanın hazırlanması

İşə başlamazdan əvvəl detallı smeta büdcənin nəzarətdə saxlanmasına imkan verir.

## Material seçimi

Materialın keyfiyyəti uzunmüddətli xərcə birbaşa təsir edir.

## İş qrafiki

Mərhələlərin ardıcıllığı və müddəti əvvəlcədən razılaşdırılmalıdır.

## Nəzarət

Hər mərhələnin təhvili sənədləşdirilməlidir.

Luxe Home Estate təmir-tikinti xidməti haqqında ətraflı məlumat üçün xidmətlər bölməsinə baxın.', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80', 'Təmir işləri', 'cmt1sru0a004xuadwmu4ayyk1', 'cmt1srsvv0000uadwxld8t2vl', 'PUBLISHED', 1, 167, 4, 1784914291953, '[Nümunə] Təmirə başlamazdan əvvəl hazırlanmalı plan — Luxe Home Estate Blog', 'Smeta, material seçimi və iş qrafiki — təmir prosesini idarə etmək üçün nümunə yol xəritəsi.', 1784914291953, 1787247091954, NULL);
INSERT INTO "BlogPost" ("id", "title", "slug", "excerpt", "content", "coverUrl", "coverAlt", "categoryId", "authorId", "status", "isDemo", "viewCount", "readMinutes", "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1sru77005auadwj2b637tf', '[Nümunə] Luxe Home Estate onlayn platforması istifadəyə verildi', 'numune-luxehomeestate-onlayn-platformasi-istifadeye-verildi', 'Əmlak axtarışı, filtrləmə və müraciət sistemi ilə yeni onlayn platforma — nümunə xəbər.', 'NÜMUNƏ MƏZMUN.

Bu yazı bloqun "şirkət xəbərləri" kateqoriyasının necə göründüyünü nümayiş etdirmək üçün hazırlanıb.

## Platformanın imkanları

- Əmlak kataloqu və detallı filtrləmə
- Hər əmlak üçün ayrıca səhifə və foto qalereya
- Favoritlərə əlavə etmə
- Birbaşa müraciət göndərmə

Real şirkət xəbərləri admin panel vasitəsilə dərc ediləcək.', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80', 'Müasir yaşayış binası', 'cmt1sru0k004yuadwgi4aue39', 'cmt1srsvv0000uadwxld8t2vl', 'PUBLISHED', 1, 105, 3, 1784223092130, '[Nümunə] Luxe Home Estate onlayn platforması istifadəyə verildi — Luxe Home Estate Blog', 'Əmlak axtarışı, filtrləmə və müraciət sistemi ilə yeni onlayn platforma — nümunə xəbər.', 1784223092130, 1787247092132, NULL);

-- Location (36)
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt7g0009uadw3shuvtzf', 'Bakı', 'baki', 'CITY', NULL, 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt7s000buadw3iyxdeju', 'Səbail', 'baki-sebail', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt81000duadwisl035ld', 'Nəsimi', 'baki-nesimi', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 1);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt89000fuadw126fgssr', 'Yasamal', 'baki-yasamal', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 2);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt8i000huadwff75kgrm', 'Nərimanov', 'baki-nerimanov', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 3);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt8v000juadwt7opt9xq', 'Xətai', 'baki-xetai', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 4);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt94000luadwpz0hkxz9', 'Nizami', 'baki-nizami', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 5);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9b000nuadwv20clbta', 'Binəqədi', 'baki-bineqedi', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 6);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9j000puadw0y28etm4', 'Xəzər', 'baki-xezer', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 7);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9r000ruadw0a33cb8i', 'Sabunçu', 'baki-sabuncu', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 8);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9z000tuadwr9x5p099', 'Suraxanı', 'baki-suraxani', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 9);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srta8000vuadwqtocx1cq', 'Qaradağ', 'baki-qaradag', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 10);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtah000xuadwro8q5l8n', 'Pirallahı', 'baki-pirallahi', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 11);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtap000zuadwprywft8f', 'Mərdəkan', 'baki-merdekan', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 12);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtaz0011uadwdiz35izv', 'Şüvəlan', 'baki-suvelan', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 13);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtb70013uadwhr5o2aen', 'Buzovna', 'baki-buzovna', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 14);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtbf0015uadwkgedm4k8', 'Novxanı', 'baki-novxani', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 15);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtbl0017uadwn26l6dsd', 'Bilgəh', 'baki-bilgeh', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 16);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtbu0018uadwfe1c1vv4', 'Sumqayıt', 'sumqayit', 'CITY', NULL, 1);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtc5001auadwxbnmw5h7', 'Mərkəz', 'sumqayit-merkez', 'DISTRICT', 'cmt1srtbu0018uadwfe1c1vv4', 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtcf001cuadw7iro4qn7', 'Corat', 'sumqayit-corat', 'DISTRICT', 'cmt1srtbu0018uadwfe1c1vv4', 1);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtcn001euadwz1rf57mg', 'Haci Zeynalabdin', 'sumqayit-haci-zeynalabdin', 'DISTRICT', 'cmt1srtbu0018uadwfe1c1vv4', 2);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtcx001fuadw4zx16opk', 'Xırdalan', 'xirdalan', 'CITY', NULL, 2);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtd6001huadwzxcd1efq', 'Mərkəz', 'xirdalan-merkez', 'DISTRICT', 'cmt1srtcx001fuadw4zx16opk', 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtde001juadwov8tgney', 'Masazır', 'xirdalan-masazir', 'DISTRICT', 'cmt1srtcx001fuadw4zx16opk', 1);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtdo001luadw9d19jurl', 'Digah', 'xirdalan-digah', 'DISTRICT', 'cmt1srtcx001fuadw4zx16opk', 2);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtdw001muadwtgzvfmnb', 'Qəbələ', 'qebele', 'CITY', NULL, 3);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srte4001ouadwq4dt7oq5', 'Mərkəz', 'qebele-merkez', 'DISTRICT', 'cmt1srtdw001muadwtgzvfmnb', 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtec001quadwjyetvp61', 'Həmzəli', 'qebele-hemzeli', 'DISTRICT', 'cmt1srtdw001muadwtgzvfmnb', 1);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtej001suadwz1q3239t', 'Vəndam', 'qebele-vendam', 'DISTRICT', 'cmt1srtdw001muadwtgzvfmnb', 2);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtes001tuadwgpe5bual', 'Şəki', 'seki', 'CITY', NULL, 4);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtf0001vuadwmxxwk2md', 'Mərkəz', 'seki-merkez', 'DISTRICT', 'cmt1srtes001tuadwgpe5bual', 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtfa001xuadw8q0jxuk0', 'Kiş', 'seki-kis', 'DISTRICT', 'cmt1srtes001tuadwgpe5bual', 1);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtfk001yuadwlvhafy2k', 'Quba', 'quba', 'CITY', NULL, 5);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtft0020uadw6r62fvkb', 'Mərkəz', 'quba-merkez', 'DISTRICT', 'cmt1srtfk001yuadwlvhafy2k', 0);
INSERT INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtg20022uadwxsjq0gxk', 'Qriz', 'quba-qriz', 'DISTRICT', 'cmt1srtfk001yuadwlvhafy2k', 1);

-- Project (3)
INSERT INTO "Project" ("id", "name", "slug", "description", "summary", "projectType", "status", "cityId", "address", "latitude", "longitude", "startDate", "deliveryDate", "year", "totalArea", "floors", "unitCount", "highlights", "timeline", "coverUrl", "isDemo", "isActive", "order", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1srtrm002vuadww8ij2lwz', '[Nümunə] Ağ Şəhər Rezidens', 'numune-ag-seher-rezidens', 'Bu qeyd platformanın layihə bölməsinin necə işlədiyini göstərmək üçün yaradılmış NÜMUNƏ məlumatdır və real Luxe Home Estate layihəsi deyil.

Real layihə əlavə edildikdə admin panel vasitəsilə bu qeyd silinməli və yerinə şirkətin təsdiqlədiyi məlumatlar daxil edilməlidir.', 'Şəhərin mərkəzi hissəsində müasir yaşayış kompleksi — nümunə layihə məlumatı.', 'RESIDENTIAL', 'ONGOING', 'cmt1srt7g0009uadw3shuvtzf', 'Nümunə ünvan, Bakı', NULL, NULL, NULL, NULL, 2026, 18500, 16, 120, '["Yeraltı parkinq","Qapalı həyət və landşaft","24/7 mühafizə","Fitness zonası","Uşaq oyun meydançası"]', '[{"step":"01","title":"Layihələndirmə","done":true},{"step":"02","title":"Fundament","done":true},{"step":"03","title":"Konstruksiya","done":true},{"step":"04","title":"İnteryer","done":false},{"step":"05","title":"Eksteryer","done":false},{"step":"06","title":"Təhvil","done":false}]', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80', 1, 1, 0, '[Nümunə] Ağ Şəhər Rezidens — Luxe Home Estate', 'Şəhərin mərkəzi hissəsində müasir yaşayış kompleksi — nümunə layihə məlumatı.', 1787247091570, 1787247091570, NULL);
INSERT INTO "Project" ("id", "name", "slug", "description", "summary", "projectType", "status", "cityId", "address", "latitude", "longitude", "startDate", "deliveryDate", "year", "totalArea", "floors", "unitCount", "highlights", "timeline", "coverUrl", "isDemo", "isActive", "order", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1srtsa0031uadwyemlqblo', '[Nümunə] Mərdəkan Villa Park', 'numune-merdekan-villa-park', 'Bu qeyd NÜMUNƏ məlumatdır və real Luxe Home Estate layihəsi deyil. Layihə bölməsinin strukturunu göstərmək üçün yaradılıb.

Real layihə məlumatları rəhbərlik tərəfindən təsdiqləndikdən sonra admin panel vasitəsilə əlavə edilməlidir.', 'Qapalı ərazidə villa kompleksi — nümunə layihə məlumatı.', 'VILLA', 'COMPLETED', 'cmt1srt7g0009uadw3shuvtzf', 'Nümunə ünvan, Mərdəkan', NULL, NULL, NULL, NULL, 2024, 12000, 2, 18, '["Fərdi hovuz","Qapalı ərazi","Landşaft dizaynı","Mangal zonası"]', '[{"step":"01","title":"Layihələndirmə","done":true},{"step":"02","title":"Fundament","done":true},{"step":"03","title":"Konstruksiya","done":true},{"step":"04","title":"İnteryer","done":true},{"step":"05","title":"Eksteryer","done":true},{"step":"06","title":"Təhvil","done":true}]', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80', 1, 1, 1, '[Nümunə] Mərdəkan Villa Park — Luxe Home Estate', 'Qapalı ərazidə villa kompleksi — nümunə layihə məlumatı.', 1787247091594, 1787247091594, NULL);
INSERT INTO "Project" ("id", "name", "slug", "description", "summary", "projectType", "status", "cityId", "address", "latitude", "longitude", "startDate", "deliveryDate", "year", "totalArea", "floors", "unitCount", "highlights", "timeline", "coverUrl", "isDemo", "isActive", "order", "metaTitle", "metaDescription", "createdAt", "updatedAt", "deletedAt") VALUES ('cmt1srtsu0036uadwqo4c0k5h', '[Nümunə] Xırdalan Biznes Mərkəzi', 'numune-xirdalan-biznes-merkezi', 'Bu qeyd NÜMUNƏ məlumatdır. Real kommersiya layihələri şirkət tərəfindən təsdiqləndikdən sonra əlavə ediləcək.', 'Kommersiya təyinatlı biznes mərkəzi — nümunə layihə məlumatı.', 'COMMERCIAL', 'PLANNED', 'cmt1srtcx001fuadw4zx16opk', 'Nümunə ünvan, Xırdalan', NULL, NULL, NULL, NULL, 2027, 9200, 8, 46, '["Açıq planlı ofis sahələri","Yeraltı parkinq","Konfrans zalı","Enerji səmərəli fasad"]', '[{"step":"01","title":"Layihələndirmə","done":true},{"step":"02","title":"Fundament","done":false},{"step":"03","title":"Konstruksiya","done":false},{"step":"04","title":"İnteryer","done":false},{"step":"05","title":"Eksteryer","done":false},{"step":"06","title":"Təhvil","done":false}]', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80', 1, 1, 2, '[Nümunə] Xırdalan Biznes Mərkəzi — Luxe Home Estate', 'Kommersiya təyinatlı biznes mərkəzi — nümunə layihə məlumatı.', 1787247091614, 1787247091614, NULL);

-- PropertyType (7)
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt5w0002uadwl2otnc2z', 'Mənzillər', 'menziller', 'Yeni tikili və köhnə fondda mənzillər.', 'Building2', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', 0, 1);
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt630003uadwkvc0ruvd', 'Villalar', 'villalar', 'Premium villa və malikanələr.', 'Home', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', 1, 1);
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt6b0004uadw9cv2yegx', 'Həyət evləri', 'heyet-evleri', 'Şəhər və qəsəbələrdə həyət evləri.', 'House', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80', 2, 1);
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt6k0005uadw1zgwp9qi', 'Bağ evləri', 'bag-evleri', 'İstirahət üçün bağ evləri.', 'Trees', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', 3, 1);
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt6s0006uadwsw3y12sz', 'Torpaq', 'torpaq', 'Tikinti və kənd təsərrüfatı üçün torpaq sahələri.', 'LandPlot', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 4, 1);
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt700007uadwzzntrmmp', 'Ofislər', 'ofisler', 'Biznes mərkəzlərində ofis sahələri.', 'Briefcase', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', 5, 1);
INSERT INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt770008uadwg9offwkr', 'Obyektlər', 'obyektler', 'Kommersiya obyektləri və ticarət sahələri.', 'Store', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', 6, 1);

-- Property (12)
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtta003auadwtlgm0r74', '[Nümunə] Mərdəkanda hovuzlu premium villa', 'numune-merdekanda-hovuzlu-premium-villa', 'NÜMUNƏ ELAN. Bu qeyd platformanın necə işlədiyini göstərmək üçün yaradılıb və real satışda olan əmlak deyil.

İki mərtəbəli, geniş həyətyanı sahəsi olan villa. Birinci mərtəbədə geniş qonaq otağı, mətbəx və yeməkxana, ikinci mərtəbədə yataq otaqları yerləşir. Həyətdə hovuz, mangal zonası və landşaft işlənmiş yaşıllıq sahəsi var.

Real əmlak elanları admin panel vasitəsilə əlavə edilir.', 'SALE', 'PUBLISHED', 450000, 'AZN', NULL, 'cmt1srt630003uadwkvc0ruvd', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srtap000zuadwprywft8f', 'Nümunə ünvan, Mərdəkan qəsəbəsi', 40.4926, 50.1406, 5, 4, 3, 320, 8, 2, 2, 'DESIGNER', 'TITLE_DEED', NULL, 1, 1, 25, 1787074291628, NULL, 1787074291628, 1787247091630, '[Nümunə] Mərdəkanda hovuzlu premium villa — Luxe Home Estate', 'NÜMUNƏ ELAN. Bu qeyd platformanın necə işlədiyini göstərmək üçün yaradılıb və real satışda olan əmlak deyil.', 'cmt1srsvv0000uadwxld8t2vl', 'cmt1srtsa0031uadwyemlqblo');
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srttv003huadwppyic54j', '[Nümunə] Səbaildə dəniz mənzərəli 3 otaqlı mənzil', 'numune-sebaildei-deniz-menzereli-3-otaqli-menzil', 'NÜMUNƏ ELAN. Şəhərin mərkəzi hissəsində, yeni tikili binada dəniz mənzərəli mənzil.

Mənzil tam təmirli və mebelli vəziyyətdədir. Binada lift, yeraltı parkinq və 24 saat mühafizə xidməti mövcuddur.

Bu qeyd nümunədir — real elanlar admin panel vasitəsilə əlavə edilir.', 'SALE', 'PUBLISHED', 285000, 'AZN', NULL, 'cmt1srt5w0002uadwl2otnc2z', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srt7s000buadw3iyxdeju', 'Nümunə ünvan, Səbail rayonu', 40.3667, 49.8352, 3, 2, 2, 128, NULL, 12, 18, 'RENOVATED', 'TITLE_DEED', NULL, 1, 1, 116, 1786901491649, NULL, 1786901491649, 1787247091651, '[Nümunə] Səbaildə dəniz mənzərəli 3 otaqlı mənzil — Luxe Home Estate', 'NÜMUNƏ ELAN. Şəhərin mərkəzi hissəsində, yeni tikili binada dəniz mənzərəli mənzil.', 'cmt1srsvv0000uadwxld8t2vl', 'cmt1srtrm002vuadww8ij2lwz');
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtue003nuadwjxzh41ej', '[Nümunə] Nərimanovda 2 otaqlı mənzil kirayə', 'numune-nerimanovda-2-otaqli-menzil-kiraye', 'NÜMUNƏ ELAN. Metro stansiyasına yaxın məsafədə, yeni təmirli 2 otaqlı mənzil aylıq icarəyə verilir.

Mənzil tam mebelli və məişət texnikası ilə təchiz olunub. Uzunmüddətli icarə üstünlük təşkil edir.', 'RENT', 'PUBLISHED', 900, 'AZN', 'MONTH', 'cmt1srt5w0002uadwl2otnc2z', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srt8i000huadwff75kgrm', 'Nümunə ünvan, Nərimanov rayonu', 40.4093, 49.8671, 2, 1, 1, 74, NULL, 6, 12, 'RENOVATED', 'CONTRACT', NULL, 1, 1, 13, 1786728691667, NULL, 1786728691667, 1787247091670, '[Nümunə] Nərimanovda 2 otaqlı mənzil kirayə — Luxe Home Estate', 'NÜMUNƏ ELAN. Metro stansiyasına yaxın məsafədə, yeni təmirli 2 otaqlı mənzil aylıq icarəyə verilir.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtv2003suadwo8u7lf2m', '[Nümunə] Novxanıda bağ evi', 'numune-novxanida-bag-evi', 'NÜMUNƏ ELAN. Dənizə yaxın məsafədə, qapalı ərazidə bağ evi satılır.

Həyətdə meyvə ağacları, mangal zonası və avtomobil üçün örtülü sahə mövcuddur. Yay mövsümü üçün uyğun istirahət məkanı.', 'SALE', 'PUBLISHED', 165000, 'AZN', NULL, 'cmt1srt6k0005uadw1zgwp9qi', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srtbf0015uadwkgedm4k8', 'Nümunə ünvan, Novxanı qəsəbəsi', 40.5397, 49.7461, 4, 3, 2, 180, 6, 2, 2, 'RENOVATED', 'TITLE_DEED', NULL, 1, 1, 76, 1786469491693, NULL, 1786469491693, 1787247091695, '[Nümunə] Novxanıda bağ evi — Luxe Home Estate', 'NÜMUNƏ ELAN. Dənizə yaxın məsafədə, qapalı ərazidə bağ evi satılır.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtvj003xuadw46t2n2wg', '[Nümunə] Yasamalda 4 otaqlı həyət evi', 'numune-yasamalda-4-otaqli-heyet-evi', 'NÜMUNƏ ELAN. Şəhər daxilində, sakit küçədə yerləşən həyət evi.

Ev iki mərtəbəlidir, həyətdə avtomobil üçün yer və kiçik yaşıllıq sahəsi var. Sənədləri qaydasındadır.', 'SALE', 'PUBLISHED', 240000, 'AZN', NULL, 'cmt1srt6b0004uadw9cv2yegx', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srt89000fuadw126fgssr', 'Nümunə ünvan, Yasamal rayonu', 40.3819, 49.8113, 4, 3, 2, 165, 3, 2, 2, 'COSMETIC', 'TITLE_DEED', NULL, 0, 1, 13, 1786210291708, NULL, 1786210291708, 1787247091711, '[Nümunə] Yasamalda 4 otaqlı həyət evi — Luxe Home Estate', 'NÜMUNƏ ELAN. Şəhər daxilində, sakit küçədə yerləşən həyət evi.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtvy0041uadwabdv8dgp', '[Nümunə] Xətaidə ofis sahəsi icarəyə verilir', 'numune-xetaide-ofis-sahesi-icareye-verilir', 'NÜMUNƏ ELAN. Biznes mərkəzində açıq planlı ofis sahəsi aylıq icarəyə verilir.

Sahə açıq plan formatındadır və tələbə uyğun bölünə bilər. Binada lift, parkinq və mühafizə xidməti mövcuddur.', 'RENT', 'PUBLISHED', 2400, 'AZN', 'MONTH', 'cmt1srt700007uadwzzntrmmp', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srt8v000juadwt7opt9xq', 'Nümunə ünvan, Xətai rayonu', 40.3833, 49.8833, 6, NULL, 2, 210, NULL, 5, 10, 'RENOVATED', 'CONTRACT', NULL, 0, 1, 93, 1785951091725, NULL, 1785951091725, 1787247091726, '[Nümunə] Xətaidə ofis sahəsi icarəyə verilir — Luxe Home Estate', 'NÜMUNƏ ELAN. Biznes mərkəzində açıq planlı ofis sahəsi aylıq icarəyə verilir.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtwd0045uadwraaawueq', '[Nümunə] Qəbələdə torpaq sahəsi', 'numune-qebelede-torpaq-sahesi', 'NÜMUNƏ ELAN. Dağ mənzərəli ərazidə tikinti üçün uyğun torpaq sahəsi satılır.

Sahəyə yol çıxışı və kommunikasiya xətləri mövcuddur. Bağ evi və ya turizm obyekti tikintisi üçün uyğundur.', 'SALE', 'PUBLISHED', 48000, 'AZN', NULL, 'cmt1srt6s0006uadwsw3y12sz', 'cmt1srtdw001muadwtgzvfmnb', 'cmt1srte4001ouadwq4dt7oq5', 'Nümunə ünvan, Qəbələ', 40.9812, 47.8489, NULL, NULL, NULL, NULL, 15, NULL, NULL, NULL, 'TITLE_DEED', NULL, 0, 1, 93, 1785691891739, NULL, 1785691891739, 1787247091741, '[Nümunə] Qəbələdə torpaq sahəsi — Luxe Home Estate', 'NÜMUNƏ ELAN. Dağ mənzərəli ərazidə tikinti üçün uyğun torpaq sahəsi satılır.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtwr0049uadwkfvditqf', '[Nümunə] Nizamidə ticarət obyekti', 'numune-nizamide-ticaret-obyekti', 'NÜMUNƏ ELAN. Sıx piyada axını olan küçədə birinci mərtəbədə yerləşən ticarət obyekti.

Vitrin sahəsi geniş, giriş küçə səviyyəsindədir. Müxtəlif ticarət fəaliyyətləri üçün uyğundur.', 'SALE', 'RESERVED', 320000, 'AZN', NULL, 'cmt1srt770008uadwg9offwkr', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srt94000luadwpz0hkxz9', 'Nümunə ünvan, Nizami rayonu', 40.4, 49.8, 3, NULL, 1, 145, NULL, 1, 9, 'RENOVATED', 'TITLE_DEED', NULL, 0, 1, 15, 1785346291753, NULL, 1785346291753, 1787247091755, '[Nümunə] Nizamidə ticarət obyekti — Luxe Home Estate', 'NÜMUNƏ ELAN. Sıx piyada axını olan küçədə birinci mərtəbədə yerləşən ticarət obyekti.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtx5004duadw8shat0ww', '[Nümunə] Şüvəlanda dənizkənarı villa', 'numune-suvelanda-denizkenari-villa', 'NÜMUNƏ ELAN. Dənizə yaxın məsafədə, qapalı villa şəhərciyində yerləşən ev.

Geniş terras, hovuz və landşaft dizaynı işlənmiş həyət mövcuddur.', 'SALE', 'SOLD', 620000, 'AZN', NULL, 'cmt1srt630003uadwkvc0ruvd', 'cmt1srt7g0009uadw3shuvtzf', 'cmt1srtaz0011uadwdiz35izv', 'Nümunə ünvan, Şüvəlan qəsəbəsi', 40.4667, 50.15, 6, 5, 4, 410, 12, 2, 2, 'DESIGNER', 'TITLE_DEED', NULL, 0, 1, 30, 1783791091767, NULL, 1783791091767, 1787247091769, '[Nümunə] Şüvəlanda dənizkənarı villa — Luxe Home Estate', 'NÜMUNƏ ELAN. Dənizə yaxın məsafədə, qapalı villa şəhərciyində yerləşən ev.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtxi004iuadwywrks4bz', '[Nümunə] Sumqayıtda 3 otaqlı mənzil', 'numune-sumqayitda-3-otaqli-menzil', 'NÜMUNƏ ELAN. Şəhər mərkəzində, infrastrukturu inkişaf etmiş ərazidə 3 otaqlı mənzil.

Mənzil orta təmirli vəziyyətdədir. Yaxınlıqda məktəb, bağça və ticarət mərkəzləri yerləşir.', 'SALE', 'PUBLISHED', 96000, 'AZN', NULL, 'cmt1srt5w0002uadwl2otnc2z', 'cmt1srtbu0018uadwfe1c1vv4', 'cmt1srtc5001auadwxbnmw5h7', 'Nümunə ünvan, Sumqayıt', 40.5892, 49.6686, 3, 2, 1, 88, NULL, 4, 9, 'COSMETIC', 'TITLE_DEED', NULL, 0, 1, 42, 1785000691780, NULL, 1785000691780, 1787247091782, '[Nümunə] Sumqayıtda 3 otaqlı mənzil — Luxe Home Estate', 'NÜMUNƏ ELAN. Şəhər mərkəzində, infrastrukturu inkişaf etmiş ərazidə 3 otaqlı mənzil.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srty5004muadwcot2830g', '[Nümunə] Xırdalanda yeni tikilidə mənzil', 'numune-xirdalanda-yeni-tikilide-menzil', 'NÜMUNƏ ELAN. Yeni istifadəyə verilmiş binada, təmirsiz vəziyyətdə mənzil satılır.

Bina qapalı həyət, parkinq və uşaq oyun meydançası ilə təchiz olunub.', 'SALE', 'PUBLISHED', 78000, 'AZN', NULL, 'cmt1srt5w0002uadwl2otnc2z', 'cmt1srtcx001fuadw4zx16opk', 'cmt1srtd6001huadwzxcd1efq', 'Nümunə ünvan, Xırdalan', 40.4497, 49.7561, 2, 1, 1, 68, NULL, 8, 14, 'NEW_BUILDING', 'CONTRACT', NULL, 0, 1, 49, 1784655091803, NULL, 1784655091803, 1787247091805, '[Nümunə] Xırdalanda yeni tikilidə mənzil — Luxe Home Estate', 'NÜMUNƏ ELAN. Yeni istifadəyə verilmiş binada, təmirsiz vəziyyətdə mənzil satılır.', 'cmt1srsvv0000uadwxld8t2vl', NULL);
INSERT INTO "Property" ("id", "title", "slug", "description", "listingType", "status", "price", "currency", "pricePeriod", "typeId", "cityId", "districtId", "address", "latitude", "longitude", "rooms", "bedrooms", "bathrooms", "area", "landArea", "floor", "totalFloors", "renovation", "documentStatus", "videoUrl", "isFeatured", "isDemo", "viewCount", "publishedAt", "deletedAt", "createdAt", "updatedAt", "metaTitle", "metaDescription", "authorId", "projectId") VALUES ('cmt1srtyn004quadw747w0s0v', '[Nümunə] Qubada bağ evi kirayə', 'numune-qubada-bag-evi-kiraye', 'NÜMUNƏ ELAN. Dağ ərazisində, təbiətin qoynunda bağ evi günlük icarəyə verilir.

Ev istirahət üçün tam təchiz olunub. Mangal zonası və geniş həyət mövcuddur.', 'RENT', 'PUBLISHED', 150, 'AZN', 'DAY', 'cmt1srt6k0005uadw1zgwp9qi', 'cmt1srtfk001yuadwlvhafy2k', 'cmt1srtft0020uadw6r62fvkb', 'Nümunə ünvan, Quba', 41.3606, 48.5136, 4, 3, 2, 150, 10, 2, 2, 'RENOVATED', 'CONTRACT', NULL, 0, 1, 117, 1784309491822, NULL, 1784309491822, 1787247091824, '[Nümunə] Qubada bağ evi kirayə — Luxe Home Estate', 'NÜMUNƏ ELAN. Dağ ərazisində, təbiətin qoynunda bağ evi günlük icarəyə verilir.', 'cmt1srsvv0000uadwxld8t2vl', NULL);

-- Feature (20)
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtgd0023uadw82bi9ouq', 'Hovuz', 'hovuz', 'Waves', 'OUTDOOR', 0);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtgm0024uadwvqc5jj5j', 'Qaraj', 'qaraj', 'Car', 'OUTDOOR', 1);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtgt0025uadwbc2hy9ut', 'Həyət', 'heyet', 'Trees', 'OUTDOOR', 2);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srth10026uadwk5j6yhlh', 'Bağça / landşaft', 'bagca', 'Flower2', 'OUTDOOR', 3);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srthc0027uadw4e9ampkd', 'Mangal zonası', 'mangal', 'Flame', 'OUTDOOR', 4);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srthr0028uadw9bxonlnn', 'Lift', 'lift', 'MoveVertical', 'INDOOR', 5);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srti80029uadw3jca0h1c', 'Kombi', 'kombi', 'Thermometer', 'INDOOR', 6);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtim002auadw6o0o6s6w', 'Kondisioner', 'kondisioner', 'Wind', 'INDOOR', 7);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtj1002buadw3m8nrsjz', 'Mebel', 'mebel', 'Sofa', 'INDOOR', 8);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtjj002cuadwexy650vm', 'Kamin', 'kamin', 'Flame', 'INDOOR', 9);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtjz002duadwya3cczgm', 'Balkon / eyvan', 'balkon', 'Columns2', 'INDOOR', 10);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtkh002euadwby11wviz', 'Hamam / sauna', 'sauna', 'Droplets', 'INDOOR', 11);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtl3002fuadwkngju9if', 'Mərkəzi istilik', 'merkezi-istilik', 'Radiation', 'INDOOR', 12);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtlj002guadwkwu7fr9f', 'Təhlükəsizlik kamerası', 'kamera', 'Cctv', 'SECURITY', 13);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtlv002huadw6hag6ovc', '24/7 mühafizə', 'muhafize', 'ShieldCheck', 'SECURITY', 14);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtmj002iuadwrr071uq4', 'Domofon', 'domofon', 'Bell', 'SECURITY', 15);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtn2002juadwudbcoo5i', 'Qapalı ərazi', 'qapali-erazi', 'Fence', 'SECURITY', 16);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtng002kuadwhn7g5j0b', 'İnternet', 'internet', 'Wifi', 'GENERAL', 17);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtnx002luadwqwzfdrgq', 'Parkinq', 'parkinq', 'SquareParking', 'GENERAL', 18);
INSERT INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtol002muadws8joq3a0', 'Dəniz mənzərəsi', 'deniz-menzeresi', 'Sailboat', 'GENERAL', 19);

-- ProjectImage (9)
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtrm002wuadwuehuylpy', 'cmt1srtrm002vuadww8ij2lwz', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə layihə — bina fasadı', 'EXTERIOR', 0);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtrm002xuadwx0nrjync', 'cmt1srtrm002vuadww8ij2lwz', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə layihə — interyer', 'INTERIOR', 1);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtrm002yuadwzwsl55od', 'cmt1srtrm002vuadww8ij2lwz', 'https://images.unsplash.com/photo-1590644365607-1c5a0d1b0a4a?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə layihə — tikinti prosesi', 'CONSTRUCTION', 2);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtrm002zuadwbjkh4ebj', 'cmt1srtrm002vuadww8ij2lwz', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə layihə — landşaft', 'LANDSCAPE', 3);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtsa0032uadwx8iekfy6', 'cmt1srtsa0031uadwyemlqblo', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa layihəsi — eksteryer', 'EXTERIOR', 0);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtsa0033uadw4br8cjtk', 'cmt1srtsa0031uadwyemlqblo', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa layihəsi — hovuz', 'LANDSCAPE', 1);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtsa0034uadwzntmnc5a', 'cmt1srtsa0031uadwyemlqblo', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa layihəsi — qonaq otağı', 'INTERIOR', 2);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtsu0037uadwia1rcpwg', 'cmt1srtsu0036uadwqo4c0k5h', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə biznes mərkəzi — fasad', 'EXTERIOR', 0);
INSERT INTO "ProjectImage" ("id", "projectId", "url", "thumbUrl", "alt", "category", "order") VALUES ('cmt1srtsu0038uadwhrziphyn', 'cmt1srtsu0036uadwqo4c0k5h', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə biznes mərkəzi — ofis sahəsi', 'INTERIOR', 1);

-- PropertyFeature (66)
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srtgd0023uadw82bi9ouq');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srtgm0024uadwvqc5jj5j');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srtgt0025uadwbc2hy9ut');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srth10026uadwk5j6yhlh');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srthc0027uadw4e9ampkd');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srtlj002guadwkwu7fr9f');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srtlv002huadw6hag6ovc');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtta003auadwtlgm0r74', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srthr0028uadw9bxonlnn');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srti80029uadw3jca0h1c');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srtim002auadw6o0o6s6w');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srtj1002buadw3m8nrsjz');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srtjz002duadwya3cczgm');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srtnx002luadwqwzfdrgq');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srtol002muadws8joq3a0');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srttv003huadwppyic54j', 'cmt1srtlv002huadw6hag6ovc');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srthr0028uadw9bxonlnn');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srti80029uadw3jca0h1c');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srtim002auadw6o0o6s6w');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srtj1002buadw3m8nrsjz');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srtjz002duadwya3cczgm');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtue003nuadwjxzh41ej', 'cmt1srtmj002iuadwrr071uq4');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtv2003suadwo8u7lf2m', 'cmt1srtgt0025uadwbc2hy9ut');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtv2003suadwo8u7lf2m', 'cmt1srth10026uadwk5j6yhlh');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtv2003suadwo8u7lf2m', 'cmt1srthc0027uadw4e9ampkd');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtv2003suadwo8u7lf2m', 'cmt1srtgm0024uadwvqc5jj5j');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtv2003suadwo8u7lf2m', 'cmt1srtn2002juadwudbcoo5i');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtv2003suadwo8u7lf2m', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvj003xuadw46t2n2wg', 'cmt1srtgt0025uadwbc2hy9ut');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvj003xuadw46t2n2wg', 'cmt1srtgm0024uadwvqc5jj5j');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvj003xuadw46t2n2wg', 'cmt1srti80029uadw3jca0h1c');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvj003xuadw46t2n2wg', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvj003xuadw46t2n2wg', 'cmt1srtmj002iuadwrr071uq4');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvy0041uadwabdv8dgp', 'cmt1srthr0028uadw9bxonlnn');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvy0041uadwabdv8dgp', 'cmt1srtim002auadw6o0o6s6w');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvy0041uadwabdv8dgp', 'cmt1srtnx002luadwqwzfdrgq');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvy0041uadwabdv8dgp', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvy0041uadwabdv8dgp', 'cmt1srtlv002huadw6hag6ovc');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtvy0041uadwabdv8dgp', 'cmt1srtlj002guadwkwu7fr9f');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtwd0045uadwraaawueq', 'cmt1srtn2002juadwudbcoo5i');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtwr0049uadwkfvditqf', 'cmt1srtim002auadw6o0o6s6w');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtwr0049uadwkfvditqf', 'cmt1srtlj002guadwkwu7fr9f');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtwr0049uadwkfvditqf', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtgd0023uadw82bi9ouq');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtgt0025uadwbc2hy9ut');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srth10026uadwk5j6yhlh');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtgm0024uadwvqc5jj5j');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtkh002euadwby11wviz');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtjj002cuadwexy650vm');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtlv002huadw6hag6ovc');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtx5004duadw8shat0ww', 'cmt1srtol002muadws8joq3a0');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtxi004iuadwywrks4bz', 'cmt1srthr0028uadw9bxonlnn');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtxi004iuadwywrks4bz', 'cmt1srti80029uadw3jca0h1c');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtxi004iuadwywrks4bz', 'cmt1srtjz002duadwya3cczgm');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtxi004iuadwywrks4bz', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srty5004muadwcot2830g', 'cmt1srthr0028uadw9bxonlnn');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srty5004muadwcot2830g', 'cmt1srtnx002luadwqwzfdrgq');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srty5004muadwcot2830g', 'cmt1srtn2002juadwudbcoo5i');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srty5004muadwcot2830g', 'cmt1srtmj002iuadwrr071uq4');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtyn004quadw747w0s0v', 'cmt1srtgt0025uadwbc2hy9ut');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtyn004quadw747w0s0v', 'cmt1srthc0027uadw4e9ampkd');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtyn004quadw747w0s0v', 'cmt1srth10026uadwk5j6yhlh');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtyn004quadw747w0s0v', 'cmt1srtjj002cuadwexy650vm');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtyn004quadw747w0s0v', 'cmt1srtng002kuadwhn7g5j0b');
INSERT INTO "PropertyFeature" ("propertyId", "featureId") VALUES ('cmt1srtyn004quadw747w0s0v', 'cmt1srtn2002juadwudbcoo5i');

-- PropertyImage (32)
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtta003buadwxcgq9e3k', 'cmt1srtta003auadwtlgm0r74', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — eksteryer görünüş', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtta003cuadwbh9791yr', 'cmt1srtta003auadwtlgm0r74', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — hovuz sahəsi', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtta003duadwwzvhia87', 'cmt1srtta003auadwtlgm0r74', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — qonaq otağı', NULL, NULL, 2, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtta003euadwpzdlnamn', 'cmt1srtta003auadwtlgm0r74', 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — mətbəx', NULL, NULL, 3, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtta003fuadwmopc60q0', 'cmt1srtta003auadwtlgm0r74', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — yataq otağı', NULL, NULL, 4, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srttv003iuadwae3mmoue', 'cmt1srttv003huadwppyic54j', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə mənzil — daxili görünüş', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srttv003juadwozzsrt76', 'cmt1srttv003huadwppyic54j', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə mənzil — qonaq otağı', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srttv003kuadwipen1gnq', 'cmt1srttv003huadwppyic54j', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə mənzil — mətbəx', NULL, NULL, 2, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srttv003luadwvb441q3x', 'cmt1srttv003huadwppyic54j', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə mənzil — sanitar qovşaq', NULL, NULL, 3, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtue003ouadw2uisx5zc', 'cmt1srtue003nuadwjxzh41ej', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə kirayə mənzil — qonaq otağı', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtue003puadwasyj0fwd', 'cmt1srtue003nuadwjxzh41ej', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə kirayə mənzil — mətbəx', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtue003quadwlvfq5u05', 'cmt1srtue003nuadwjxzh41ej', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə kirayə mənzil — otaq', NULL, NULL, 2, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtv2003tuadwb939eac2', 'cmt1srtv2003suadwo8u7lf2m', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə bağ evi — ümumi görünüş', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtv2003uuadwcyraaorq', 'cmt1srtv2003suadwo8u7lf2m', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə bağ evi — həyət', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtv2003vuadwdmnj1684', 'cmt1srtv2003suadwo8u7lf2m', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə bağ evi — daxili görünüş', NULL, NULL, 2, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtvj003yuadwa3y1zumc', 'cmt1srtvj003xuadw46t2n2wg', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə həyət evi — fasad', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtvj003zuadwt7qpb3p6', 'cmt1srtvj003xuadw46t2n2wg', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə həyət evi — həyət', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtvy0042uadwc0wyw20n', 'cmt1srtvy0041uadwabdv8dgp', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə ofis — iş sahəsi', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtvy0043uadw98m12add', 'cmt1srtvy0041uadwabdv8dgp', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə ofis — bina', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtwd0046uadwfscoq12h', 'cmt1srtwd0045uadwraaawueq', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə torpaq sahəsi', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtwd0047uadw1ngkk8u4', 'cmt1srtwd0045uadwraaawueq', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə torpaq sahəsi — ətraf mühit', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtwr004auadwtwlwe63f', 'cmt1srtwr0049uadwkfvditqf', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə ticarət obyekti', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtwr004buadw0sayifb6', 'cmt1srtwr0049uadwkfvditqf', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə ticarət obyekti — daxili', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtx5004euadwjh2lvt30', 'cmt1srtx5004duadw8shat0ww', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə dənizkənarı villa', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtx5004fuadw4eiw5mq5', 'cmt1srtx5004duadw8shat0ww', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — hovuz', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtx5004guadw0ody2chb', 'cmt1srtx5004duadw8shat0ww', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə villa — yataq otağı', NULL, NULL, 2, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtxi004juadwjhrc5fbo', 'cmt1srtxi004iuadwywrks4bz', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə mənzil — otaq', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtxi004kuadwli4xcyi9', 'cmt1srtxi004iuadwywrks4bz', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə mənzil — qonaq otağı', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srty6004nuadwt81hsrma', 'cmt1srty5004muadwcot2830g', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə yeni tikili — bina', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srty6004ouadwm50wlsyo', 'cmt1srty5004muadwcot2830g', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə yeni tikili — mənzil', NULL, NULL, 1, 0);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtyo004ruadwehygg2fs', 'cmt1srtyn004quadw747w0s0v', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə bağ evi — Quba', NULL, NULL, 0, 1);
INSERT INTO "PropertyImage" ("id", "propertyId", "url", "thumbUrl", "alt", "width", "height", "order", "isCover") VALUES ('cmt1srtyo004suadwhb7y44ca', 'cmt1srtyn004quadw747w0s0v', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80', NULL, 'Nümunə bağ evi — ətraf mühit', NULL, NULL, 1, 0);

-- Service (7)
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtp2002nuadwtsuo42hj', 'Alqı-Satqı', 'alqi-satqi', 'Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.', 'Luxe Home Estate daşınmaz əmlakın alqı-satqısı prosesini əvvəldən sona qədər müşayiət edir. Əmlakın bazar dəyərinin qiymətləndirilməsindən başlayaraq, uyğun alıcı və ya satıcının tapılması, danışıqların aparılması, sənədlərin yoxlanılması və notarial rəsmiləşdirməyə qədər bütün mərhələlərdə yanınızdayıq.

Hər bir əmlak üzrə hüquqi təmizlik yoxlanılır, sənəd vəziyyəti dəqiqləşdirilir və tərəflər arasında şəffaf razılaşma təmin edilir.', 'Handshake', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', '["Əmlakın bazar dəyərinin qiymətləndirilməsi","Hüquqi sənədlərin yoxlanılması","Alıcı və satıcı arasında danışıqların aparılması","Notarial rəsmiləşdirmənin təşkili","Əməliyyat sonrası dəstək"]', 0, 1, 'Alqı-Satqı — Luxe Home Estate', 'Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.', 1787247091478, 1787247091478);
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtpj002ouadw8xp901vj', 'İcarə', 'icare', 'Mənzil, villa, ofis və digər əmlakların icarəsi.', 'Qısa və uzunmüddətli icarə üzrə geniş portfel təqdim edirik. Mənzil, villa, bağ evi, ofis və kommersiya obyektləri üzrə tələbinizə uyğun variantları seçir, baxış təşkil edir və icarə müqaviləsinin hazırlanmasında dəstək göstəririk.

Həm icarəyə verən, həm də icarəçi üçün şərtlərin aydın və qarşılıqlı sərfəli olmasına diqqət yetirilir.', 'KeyRound', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', '["Qısa və uzunmüddətli icarə variantları","Baxışların təşkili","İcarə müqaviləsinin hazırlanması","Əmlak sahibi üçün icarəçi seçimi","İcarə müddətində əlaqələndirmə"]', 1, 1, 'İcarə — Luxe Home Estate', 'Mənzil, villa, ofis və digər əmlakların icarəsi.', 1787247091494, 1787247091494);
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtpu002puadwe72925h2', 'İpoteka', 'ipoteka', 'İpoteka yolu ilə əmlak əldə etmək üçün dəstək.', 'İpoteka ilə mənzil almaq istəyən müştərilərə prosesin başa düşülməsində və sənədlərin hazırlanmasında kömək edirik. Hansı əmlakların ipoteka şərtlərinə uyğun olduğunu müəyyənləşdirir, bank tələblərinə uyğun sənəd paketinin toplanmasında yönləndiririk.

Qeyd: kredit qərarı və şərtləri müvafiq maliyyə qurumu tərəfindən müəyyən edilir.', 'Landmark', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80', '["İpotekaya uyğun əmlakların seçimi","Sənəd paketinin hazırlanmasında dəstək","Bank tələbləri üzrə məsləhət","Əmlakın qiymətləndirilməsinin təşkili","Rəsmiləşdirmə mərhələsində müşayiət"]', 2, 1, 'İpoteka — Luxe Home Estate', 'İpoteka yolu ilə əmlak əldə etmək üçün dəstək.', 1787247091507, 1787247091507);
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtq5002quadwsj7o7qgt', 'Daxili Kredit', 'daxili-kredit', 'Şirkətin təqdim etdiyi daxili kredit imkanları.', 'Bəzi əmlaklar üzrə şirkət daxili ödəniş imkanları təklif olunur. Bu imkan alıcıya ödənişi mərhələlərlə həyata keçirməyə şərait yaradır.

Daxili kredit şərtləri hər bir əmlak üzrə fərdi müəyyən edilir. Konkret şərtləri öyrənmək üçün bizimlə əlaqə saxlayın.', 'Wallet', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80', '["Əmlak üzrə fərdi ödəniş qrafiki","İlkin ödəniş variantları","Şəffaf şərtlər və razılaşma","Rəsmi müqavilə ilə rəsmiləşdirmə"]', 3, 1, 'Daxili Kredit — Luxe Home Estate', 'Şirkətin təqdim etdiyi daxili kredit imkanları.', 1787247091517, 1787247091517);
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtqf002ruadwk8h91k1m', 'Təmir-Tikinti', 'temir-tikinti', 'Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.', 'Aldığınız və ya mövcud əmlakınızın təmir və tikinti işlərini təşkil edirik. Kosmetik təmirdən başlayaraq tam yenidənqurma və daxili dizayn işlərinə qədər müxtəlif həcmli layihələr üzrə xidmət göstərilir.

İş başlamazdan əvvəl smeta hazırlanır, mərhələlər və müddət razılaşdırılır.', 'Hammer', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80', '["Kosmetik və əsaslı təmir","Daxili dizayn və planlaşdırma","Smeta və iş qrafikinin hazırlanması","Material seçimində dəstək","İşin mərhələli təhvili"]', 4, 1, 'Təmir-Tikinti — Luxe Home Estate', 'Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.', 1787247091527, 1787247091527);
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtqr002suadw6ffc8lyf', 'Reklam', 'reklam', 'Daşınmaz əmlakların tanıtımı və reklam xidmətləri.', 'Əmlakınızın daha geniş auditoriyaya çatması üçün tanıtım xidmətləri təqdim edirik. Elanın hazırlanması, sosial media və rəqəmsal platformalarda yerləşdirilməsi, hədəflənmiş reklam kampaniyalarının qurulması bu xidmətə daxildir.

Məqsəd əmlakın düzgün auditoriyaya, düzgün formatda təqdim edilməsidir.', 'Megaphone', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80', '["Elan mətninin peşəkar hazırlanması","Sosial media tanıtımı","Hədəflənmiş rəqəmsal reklam","Luxe Home Estate platformasında yerləşdirmə","Nəticələr üzrə hesabat"]', 5, 1, 'Reklam — Luxe Home Estate', 'Daşınmaz əmlakların tanıtımı və reklam xidmətləri.', 1787247091539, 1787247091539);
INSERT INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtr3002tuadwh0ts429k', 'Çəkiliş', 'cekilis', 'Professional foto və video çəkiliş xidmətləri.', 'Daşınmaz əmlakın satış sürətini ən çox təsir edən amillərdən biri keyfiyyətli vizual materialdır. Peşəkar foto və video çəkiliş, dron çəkilişi və 360° panoram materiallarının hazırlanması üzrə xidmət göstəririk.

Hər çəkiliş əmlakın güclü tərəflərini önə çıxaracaq şəkildə planlaşdırılır.', 'Camera', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', '["Peşəkar interyer və eksteryer fotoçəkilişi","Video təqdimat rolikləri","Dron ilə hava çəkilişi","Şəkillərin peşəkar emalı","Sosial media üçün format hazırlığı"]', 6, 1, 'Çəkiliş — Luxe Home Estate', 'Professional foto və video çəkiliş xidmətləri.', 1787247091551, 1787247091551);

-- Setting (6)
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('site.title', 'Luxe Home Estate — Həyatınızın ən dəyərli ünvanı', 1787247092242);
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('site.description', 'Luxe Home Estate — Bakıda mənzil, villa, həyət evi, torpaq, ofis və obyektlərin alqı-satqısı və icarəsi.', 1787247092390);
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.phone', '+994 51 922 85 85', 1787247092490);
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.address', 'Əliyar Əliyev 109A', 1787247092502);
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.instagram', 'luxe_home_estate', 1787247092530);
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('leads.notifyEmail', '', 1787247092548);
