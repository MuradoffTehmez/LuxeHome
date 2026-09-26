-- Luxe Home Estate — D1 seed məlumatı
-- Avtomatik yaradılıb: npm run db:seed:build

-- BlogCategory (6)
INSERT OR IGNORE INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1srtz6004tuadw4lywejkj', 'Daşınmaz əmlak', 'dasinmaz-emlak', NULL, 0);
INSERT OR IGNORE INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1srtzh004uuadwwybsqt27', 'Bazar xəbərləri', 'bazar-xeberleri', NULL, 1);
INSERT OR IGNORE INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1srtzr004vuadwo0wjji9g', 'Məsləhətlər', 'meslehetler', NULL, 2);
INSERT OR IGNORE INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1sru01004wuadw7vja22bg', 'İnteryer', 'interyer', NULL, 3);
INSERT OR IGNORE INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1sru0a004xuadwmu4ayyk1', 'Tikinti', 'tikinti', NULL, 4);
INSERT OR IGNORE INTO "BlogCategory" ("id", "name", "slug", "description", "order") VALUES ('cmt1sru0k004yuadwgi4aue39', 'Luxe Home Estate xəbərləri', 'luxehomeestate-xeberleri', NULL, 5);

-- Feature (20)
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtgd0023uadw82bi9ouq', 'Hovuz', 'hovuz', 'Waves', 'OUTDOOR', 0);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtgm0024uadwvqc5jj5j', 'Qaraj', 'qaraj', 'Car', 'OUTDOOR', 1);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtgt0025uadwbc2hy9ut', 'Həyət', 'heyet', 'Trees', 'OUTDOOR', 2);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srth10026uadwk5j6yhlh', 'Bağça / landşaft', 'bagca', 'Flower2', 'OUTDOOR', 3);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srthc0027uadw4e9ampkd', 'Mangal zonası', 'mangal', 'Flame', 'OUTDOOR', 4);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srthr0028uadw9bxonlnn', 'Lift', 'lift', 'MoveVertical', 'INDOOR', 5);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srti80029uadw3jca0h1c', 'Kombi', 'kombi', 'Thermometer', 'INDOOR', 6);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtim002auadw6o0o6s6w', 'Kondisioner', 'kondisioner', 'Wind', 'INDOOR', 7);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtj1002buadw3m8nrsjz', 'Mebel', 'mebel', 'Sofa', 'INDOOR', 8);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtjj002cuadwexy650vm', 'Kamin', 'kamin', 'Flame', 'INDOOR', 9);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtjz002duadwya3cczgm', 'Balkon / eyvan', 'balkon', 'Columns2', 'INDOOR', 10);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtkh002euadwby11wviz', 'Hamam / sauna', 'sauna', 'Droplets', 'INDOOR', 11);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtl3002fuadwkngju9if', 'Mərkəzi istilik', 'merkezi-istilik', 'Radiation', 'INDOOR', 12);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtlj002guadwkwu7fr9f', 'Təhlükəsizlik kamerası', 'kamera', 'Cctv', 'SECURITY', 13);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtlv002huadw6hag6ovc', '24/7 mühafizə', 'muhafize', 'ShieldCheck', 'SECURITY', 14);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtmj002iuadwrr071uq4', 'Domofon', 'domofon', 'Bell', 'SECURITY', 15);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtn2002juadwudbcoo5i', 'Qapalı ərazi', 'qapali-erazi', 'Fence', 'SECURITY', 16);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtng002kuadwhn7g5j0b', 'İnternet', 'internet', 'Wifi', 'GENERAL', 17);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtnx002luadwqwzfdrgq', 'Parkinq', 'parkinq', 'SquareParking', 'GENERAL', 18);
INSERT OR IGNORE INTO "Feature" ("id", "name", "slug", "icon", "group", "order") VALUES ('cmt1srtol002muadws8joq3a0', 'Dəniz mənzərəsi', 'deniz-menzeresi', 'Sailboat', 'GENERAL', 19);

-- Location (36)
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt7g0009uadw3shuvtzf', 'Bakı', 'baki', 'CITY', NULL, 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt7s000buadw3iyxdeju', 'Səbail', 'baki-sebail', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt81000duadwisl035ld', 'Nəsimi', 'baki-nesimi', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 1);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt89000fuadw126fgssr', 'Yasamal', 'baki-yasamal', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 2);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt8i000huadwff75kgrm', 'Nərimanov', 'baki-nerimanov', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 3);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt8v000juadwt7opt9xq', 'Xətai', 'baki-xetai', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 4);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt94000luadwpz0hkxz9', 'Nizami', 'baki-nizami', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 5);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9b000nuadwv20clbta', 'Binəqədi', 'baki-bineqedi', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 6);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9j000puadw0y28etm4', 'Xəzər', 'baki-xezer', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 7);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9r000ruadw0a33cb8i', 'Sabunçu', 'baki-sabuncu', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 8);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srt9z000tuadwr9x5p099', 'Suraxanı', 'baki-suraxani', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 9);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srta8000vuadwqtocx1cq', 'Qaradağ', 'baki-qaradag', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 10);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtah000xuadwro8q5l8n', 'Pirallahı', 'baki-pirallahi', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 11);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtap000zuadwprywft8f', 'Mərdəkan', 'baki-merdekan', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 12);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtaz0011uadwdiz35izv', 'Şüvəlan', 'baki-suvelan', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 13);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtb70013uadwhr5o2aen', 'Buzovna', 'baki-buzovna', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 14);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtbf0015uadwkgedm4k8', 'Novxanı', 'baki-novxani', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 15);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtbl0017uadwn26l6dsd', 'Bilgəh', 'baki-bilgeh', 'DISTRICT', 'cmt1srt7g0009uadw3shuvtzf', 16);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtbu0018uadwfe1c1vv4', 'Sumqayıt', 'sumqayit', 'CITY', NULL, 1);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtc5001auadwxbnmw5h7', 'Mərkəz', 'sumqayit-merkez', 'DISTRICT', 'cmt1srtbu0018uadwfe1c1vv4', 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtcf001cuadw7iro4qn7', 'Corat', 'sumqayit-corat', 'DISTRICT', 'cmt1srtbu0018uadwfe1c1vv4', 1);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtcn001euadwz1rf57mg', 'Haci Zeynalabdin', 'sumqayit-haci-zeynalabdin', 'DISTRICT', 'cmt1srtbu0018uadwfe1c1vv4', 2);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtcx001fuadw4zx16opk', 'Xırdalan', 'xirdalan', 'CITY', NULL, 2);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtd6001huadwzxcd1efq', 'Mərkəz', 'xirdalan-merkez', 'DISTRICT', 'cmt1srtcx001fuadw4zx16opk', 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtde001juadwov8tgney', 'Masazır', 'xirdalan-masazir', 'DISTRICT', 'cmt1srtcx001fuadw4zx16opk', 1);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtdo001luadw9d19jurl', 'Digah', 'xirdalan-digah', 'DISTRICT', 'cmt1srtcx001fuadw4zx16opk', 2);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtdw001muadwtgzvfmnb', 'Qəbələ', 'qebele', 'CITY', NULL, 3);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srte4001ouadwq4dt7oq5', 'Mərkəz', 'qebele-merkez', 'DISTRICT', 'cmt1srtdw001muadwtgzvfmnb', 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtec001quadwjyetvp61', 'Həmzəli', 'qebele-hemzeli', 'DISTRICT', 'cmt1srtdw001muadwtgzvfmnb', 1);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtej001suadwz1q3239t', 'Vəndam', 'qebele-vendam', 'DISTRICT', 'cmt1srtdw001muadwtgzvfmnb', 2);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtes001tuadwgpe5bual', 'Şəki', 'seki', 'CITY', NULL, 4);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtf0001vuadwmxxwk2md', 'Mərkəz', 'seki-merkez', 'DISTRICT', 'cmt1srtes001tuadwgpe5bual', 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtfa001xuadw8q0jxuk0', 'Kiş', 'seki-kis', 'DISTRICT', 'cmt1srtes001tuadwgpe5bual', 1);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtfk001yuadwlvhafy2k', 'Quba', 'quba', 'CITY', NULL, 5);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtft0020uadw6r62fvkb', 'Mərkəz', 'quba-merkez', 'DISTRICT', 'cmt1srtfk001yuadwlvhafy2k', 0);
INSERT OR IGNORE INTO "Location" ("id", "name", "slug", "kind", "parentId", "order") VALUES ('cmt1srtg20022uadwxsjq0gxk', 'Qriz', 'quba-qriz', 'DISTRICT', 'cmt1srtfk001yuadwlvhafy2k', 1);

-- PropertyType (7)
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt5w0002uadwl2otnc2z', 'Mənzillər', 'menziller', 'Yeni tikili və köhnə fondda mənzillər.', 'Building2', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', 0, 1);
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt630003uadwkvc0ruvd', 'Villalar', 'villalar', 'Premium villa və malikanələr.', 'Home', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', 1, 1);
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt6b0004uadw9cv2yegx', 'Həyət evləri', 'heyet-evleri', 'Şəhər və qəsəbələrdə həyət evləri.', 'House', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80', 2, 1);
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt6k0005uadw1zgwp9qi', 'Bağ evləri', 'bag-evleri', 'İstirahət üçün bağ evləri.', 'Trees', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', 3, 1);
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt6s0006uadwsw3y12sz', 'Torpaq', 'torpaq', 'Tikinti və kənd təsərrüfatı üçün torpaq sahələri.', 'LandPlot', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 4, 1);
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt700007uadwzzntrmmp', 'Ofislər', 'ofisler', 'Biznes mərkəzlərində ofis sahələri.', 'Briefcase', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', 5, 1);
INSERT OR IGNORE INTO "PropertyType" ("id", "name", "slug", "description", "icon", "imageUrl", "order", "isActive") VALUES ('cmt1srt770008uadwg9offwkr', 'Obyektlər', 'obyektler', 'Kommersiya obyektləri və ticarət sahələri.', 'Store', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', 6, 1);

-- Service (11)
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtp2002nuadwtsuo42hj', 'Alqı-Satqı', 'alqi-satqi', 'Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.', 'Luxe Home Estate daşınmaz əmlakın alqı-satqısı prosesini əvvəldən sona qədər müşayiət edir. Əmlakın bazar dəyərinin qiymətləndirilməsindən başlayaraq, uyğun alıcı və ya satıcının tapılması, danışıqların aparılması, sənədlərin yoxlanılması və notarial rəsmiləşdirməyə qədər bütün mərhələlərdə yanınızdayıq.

Hər bir əmlak üzrə hüquqi təmizlik yoxlanılır, sənəd vəziyyəti dəqiqləşdirilir və tərəflər arasında şəffaf razılaşma təmin edilir.', 'Handshake', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', '["Əmlakın bazar dəyərinin qiymətləndirilməsi","Hüquqi sənədlərin yoxlanılması","Alıcı və satıcı arasında danışıqların aparılması","Notarial rəsmiləşdirmənin təşkili","Əməliyyat sonrası dəstək"]', 0, 1, 'Alqı-Satqı — Luxe Home Estate', 'Bakıda daşınmaz əmlak alqı-satqısı: qiymətləndirmə, sənəd yoxlanışı, danışıqlar və notarial rəsmiləşdirmə üzrə peşəkar müşayiət.', '2026-08-20T17:31:31.478Z', '2026-08-20T17:31:31.478Z');
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtpj002ouadw8xp901vj', 'İcarə', 'icare', 'Mənzil, villa, ofis və digər əmlakların icarəsi.', 'Qısa və uzunmüddətli icarə üzrə geniş portfel təqdim edirik. Mənzil, villa, bağ evi, ofis və kommersiya obyektləri üzrə tələbinizə uyğun variantları seçir, baxış təşkil edir və icarə müqaviləsinin hazırlanmasında dəstək göstəririk.

Həm icarəyə verən, həm də icarəçi üçün şərtlərin aydın və qarşılıqlı sərfəli olmasına diqqət yetirilir.', 'KeyRound', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', '["Qısa və uzunmüddətli icarə variantları","Baxışların təşkili","İcarə müqaviləsinin hazırlanması","Əmlak sahibi üçün icarəçi seçimi","İcarə müddətində əlaqələndirmə"]', 1, 1, 'Bakıda Əmlak İcarəsi — Luxe Home Estate', 'Bakıda mənzil, villa, ofis və kommersiya obyektlərinin qısa və uzunmüddətli icarəsi üzrə seçim, baxış və müqavilə dəstəyi.', '2026-08-20T17:31:31.494Z', '2026-08-20T17:31:31.494Z');
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtpu002puadwe72925h2', 'İpoteka', 'ipoteka', 'İpoteka yolu ilə əmlak əldə etmək üçün dəstək.', 'İpoteka ilə mənzil almaq istəyən müştərilərə prosesin başa düşülməsində və sənədlərin hazırlanmasında kömək edirik. Hansı əmlakların ipoteka şərtlərinə uyğun olduğunu müəyyənləşdirir, bank tələblərinə uyğun sənəd paketinin toplanmasında yönləndiririk.

Qeyd: kredit qərarı və şərtləri müvafiq maliyyə qurumu tərəfindən müəyyən edilir.', 'Landmark', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80', '["İpotekaya uyğun əmlakların seçimi","Sənəd paketinin hazırlanmasında dəstək","Bank tələbləri üzrə məsləhət","Əmlakın qiymətləndirilməsinin təşkili","Rəsmiləşdirmə mərhələsində müşayiət"]', 2, 1, 'İpoteka — Luxe Home Estate', 'İpoteka ilə mənzil alışı üçün uyğun əmlak seçimi, sənədlərin hazırlanması, qiymətləndirmə və bank tələbləri üzrə peşəkar dəstək.', '2026-08-20T17:31:31.507Z', '2026-08-20T17:31:31.507Z');
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtq5002quadwsj7o7qgt', 'Daxili Kredit', 'daxili-kredit', 'Şirkətin təqdim etdiyi daxili kredit imkanları.', 'Bəzi əmlaklar üzrə şirkət daxili ödəniş imkanları təklif olunur. Bu imkan alıcıya ödənişi mərhələlərlə həyata keçirməyə şərait yaradır.

Daxili kredit şərtləri hər bir əmlak üzrə fərdi müəyyən edilir. Konkret şərtləri öyrənmək üçün bizimlə əlaqə saxlayın.', 'Wallet', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80', '["Əmlak üzrə fərdi ödəniş qrafiki","İlkin ödəniş variantları","Şəffaf şərtlər və razılaşma","Rəsmi müqavilə ilə rəsmiləşdirmə"]', 3, 1, 'Daxili Kredit — Luxe Home Estate', 'Seçilmiş əmlaklar üçün fərdi ilkin ödəniş və mərhələli ödəniş qrafiki ilə şirkətdaxili kredit imkanları və müqavilə dəstəyi.', '2026-08-20T17:31:31.517Z', '2026-08-20T17:31:31.517Z');
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtqf002ruadwk8h91k1m', 'Təmir-Tikinti', 'temir-tikinti', 'Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.', 'Aldığınız və ya mövcud əmlakınızın təmir və tikinti işlərini təşkil edirik. Kosmetik təmirdən başlayaraq tam yenidənqurma və daxili dizayn işlərinə qədər müxtəlif həcmli layihələr üzrə xidmət göstərilir.

İş başlamazdan əvvəl smeta hazırlanır, mərhələlər və müddət razılaşdırılır.', 'Hammer', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80', '["Kosmetik və əsaslı təmir","Daxili dizayn və planlaşdırma","Smeta və iş qrafikinin hazırlanması","Material seçimində dəstək","İşin mərhələli təhvili"]', 4, 1, 'Təmir-Tikinti — Luxe Home Estate', 'Bakıda mənzil və kommersiya obyektləri üçün kosmetik və əsaslı təmir, tikinti, daxili dizayn, smeta və mərhələli təhvil xidmətləri.', '2026-08-20T17:31:31.527Z', '2026-08-20T17:31:31.527Z');
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtqr002suadw6ffc8lyf', 'Reklam', 'reklam', 'Daşınmaz əmlakların tanıtımı və reklam xidmətləri.', 'Əmlakınızın daha geniş auditoriyaya çatması üçün tanıtım xidmətləri təqdim edirik. Elanın hazırlanması, sosial media və rəqəmsal platformalarda yerləşdirilməsi, hədəflənmiş reklam kampaniyalarının qurulması bu xidmətə daxildir.

Məqsəd əmlakın düzgün auditoriyaya, düzgün formatda təqdim edilməsidir.', 'Megaphone', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80', '["Elan mətninin peşəkar hazırlanması","Sosial media tanıtımı","Hədəflənmiş rəqəmsal reklam","Luxe Home Estate platformasında yerləşdirmə","Nəticələr üzrə hesabat"]', 5, 1, 'Reklam — Luxe Home Estate', 'Əmlak elanının hazırlanması, peşəkar təqdimatı, sosial media yayımı və hədəflənmiş rəqəmsal reklam kampaniyaları üzrə xidmət.', '2026-08-20T17:31:31.539Z', '2026-08-20T17:31:31.539Z');
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtr3002tuadwh0ts429k', 'Çəkiliş', 'cekilis', 'Professional foto və video çəkiliş xidmətləri.', 'Daşınmaz əmlakın satış sürətini ən çox təsir edən amillərdən biri keyfiyyətli vizual materialdır. Peşəkar foto və video çəkiliş, dron çəkilişi və 360° panoram materiallarının hazırlanması üzrə xidmət göstəririk.

Hər çəkiliş əmlakın güclü tərəflərini önə çıxaracaq şəkildə planlaşdırılır.', 'Camera', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', '["Peşəkar interyer və eksteryer fotoçəkilişi","Video təqdimat rolikləri","Dron ilə hava çəkilişi","Şəkillərin peşəkar emalı","Sosial media üçün format hazırlığı"]', 6, 1, 'Çəkiliş — Luxe Home Estate', 'Əmlaklar üçün peşəkar interyer və eksteryer fotoçəkilişi, video təqdimat, dron çəkilişi, 360° panorama və şəkil emalı.', '2026-08-20T17:31:31.551Z', '2026-08-20T17:31:31.551Z');

-- Sonradan əlavə edilən xidmətlər üçün tam public və SEO məzmunu.
-- Yeni mühitdə eyni məlumat `prisma/seed.ts` vasitəsilə də yaradılır.
INSERT OR IGNORE INTO "Service" (
  id, title, slug, shortDescription, description, icon, imageUrl, bullets,
  "order", isActive, metaTitle, metaDescription, createdAt, updatedAt
) VALUES
(
  'svc_qiymetlendirme', 'Əmlakın Qiymətləndirilməsi', 'qiymetlendirme',
  'Daşınmaz əmlakın bazar dəyərinin peşəkar şəkildə müəyyən edilməsi.',
  'Daşınmaz əmlakın real bazar dəyərini satış, icarə və investisiya məqsədləri üçün peşəkar şəkildə müəyyən edirik. Qiymətləndirmə zamanı yerləşmə, sahə, təmir vəziyyəti, sənədlər, binanın xüsusiyyətləri və oxşar bazar təklifləri müqayisə olunur. Nəticələr müştəriyə əsaslandırılmış qiymət aralığı və praktik tövsiyələrlə təqdim edilir. Bu yanaşma əmlakı düzgün qiymətlə bazara çıxarmağa və riskli qərarlardan yayınmağa kömək edir.',
  'Calculator',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
  '["Oxşar bazar təkliflərinin müqayisəsi","Yerləşmə və texniki vəziyyətin təhlili","Sənəd və təyinat amillərinin nəzərə alınması","Əsaslandırılmış qiymət aralığı","Satış və investisiya üzrə praktik tövsiyələr"]',
  7, 1, 'Əmlak Qiymətləndirilməsi — Luxe Home Estate',
  'Bakıda daşınmaz əmlakın satış, icarə və investisiya məqsədləri üçün bazar dəyərinin peşəkar təhlili və qiymətləndirilməsi.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'svc_konsultasiya', 'Konsultasiya', 'konsultasiya',
  'Daşınmaz əmlak alqı-satqısı, hüquqi məsələlər və bazar trendləri üzrə fərdi məsləhət xidməti.',
  'Daşınmaz əmlakın alınması, satılması, icarəsi və investisiya məqsədilə seçilməsi üzrə fərdi konsultasiya təqdim edirik. Mütəxəssislərimiz bazar vəziyyətini, qiymət dinamikasını, sənəd risklərini və mümkün alternativləri izah edir. Görüş zamanı müştərinin məqsədi, büdcəsi və vaxt planı dəqiqləşdirilir, sonra atılacaq addımlar üzrə aydın yol xəritəsi hazırlanır. Qərarınızı faktlara əsaslanan və riskləri nəzərə alan yanaşma ilə verməyinizə kömək edirik.',
  'MessageCircle',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
  '["Alqı-satqı və icarə strategiyası","Bazar və qiymət dinamikasının izahı","Sənəd və əməliyyat risklərinin təhlili","Alternativ əmlak variantlarının müqayisəsi","Fərdi addım planının hazırlanması"]',
  8, 1, 'Konsultasiya — Luxe Home Estate',
  'Daşınmaz əmlak alqı-satqısı, sənədlər, bazar vəziyyəti və investisiya qərarları üzrə fərdi ekspert konsultasiyası.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'svc_a_frame_evler', 'A-frame Evlər', 'a-frame-evler-xidmeti',
  'A-frame tipli evlərin layihələndirilməsi, tikintisi və satışına dair tam xidmət paketi.',
  'A-frame tipli evlərin ideyadan təhvilə qədər layihələndirilməsi və tikintisi üzrə kompleks xidmət təqdim edirik. Torpaq sahəsinin xüsusiyyətləri, evin ölçüsü, plan həlli, material seçimi, istilik izolyasiyası və kommunikasiya ehtiyacları birlikdə qiymətləndirilir. Layihə mərhələli iş qrafiki və razılaşdırılmış smeta əsasında idarə olunur. Məqsədimiz müasir dizaynı, enerji səmərəliliyini və rahat yaşayış standartlarını birləşdirən funksional A-frame ev yaratmaqdır.',
  'Triangle',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=80',
  '["Torpaq sahəsi və ehtiyacların ilkin təhlili","Memarlıq və planlaşdırma həlli","Material və enerji səmərəliliyi seçimi","Mərhələli tikinti və keyfiyyət nəzarəti","Hazır evin təhvili və satış dəstəyi"]',
  9, 1, 'A-frame Evlər — Luxe Home Estate',
  'A-frame evlərin layihələndirilməsi, tikintisi və satışı: planlama, material seçimi, enerji səmərəliliyi və mərhələli icra dəstəyi.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'svc_havalandirma', 'Havalandırma Sistemi', 'havalandirma-sistemi',
  'Yaşayış və ofis məkanları üçün peşəkar havalandırma sistemlərinin quraşdırılması və texniki xidməti.',
  'Yaşayış, ofis və kommersiya məkanları üçün havalandırma sistemlərinin layihələndirilməsi, quraşdırılması və texniki xidmətini təşkil edirik. Məkanın sahəsi, istifadə təyinatı, hava dövriyyəsi ehtiyacı və enerji sərfiyyatı təhlil olunur. Uyğun avadanlıq və kanal sistemi seçildikdən sonra montaj, sazlama və yoxlama aparılır. Dövri texniki baxış və filtr xidməti sistemin səmərəli işləməsinə, təmiz havanın və rahat temperaturun qorunmasına kömək edir.',
  'Wind',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80',
  '["Məkan və hava dövriyyəsi ehtiyacının təhlili","Sistem layihəsi və avadanlıq seçimi","Kanal və avadanlıqların quraşdırılması","Sazlama, balanslaşdırma və işəsalma yoxlaması","Dövri texniki baxış və filtr xidməti"]',
  10, 1, 'Havalandırma Sistemləri — Luxe Home Estate',
  'Yaşayış və ofis məkanları üçün havalandırma sistemlərinin layihələndirilməsi, quraşdırılması, sazlanması və texniki xidməti.',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);


-- Partner (1). TREVA məlumatları yalnız rəsmi açıq mənbələrə əsaslanır;
-- hüquqi ad, müqavilə və əməkdaşlıq tarixləri təsdiqlənmədiyi üçün boş saxlanılır.
INSERT INTO "Partner" ("id", "name", "slug", "shortDescription", "shortDescriptionEn", "shortDescriptionRu", "description", "descriptionEn", "descriptionRu", "websiteUrl", "email", "phone", "logoDark", "coverImage", "country", "city", "address", "partnershipType", "status", "verified", "officialPartner", "featured", "showPublicly", "showOnHomepage", "sortOrder", "seoTitle", "seoDescription", "seoKeywords", "ogImage", "createdAt", "updatedAt") VALUES (
  'cm0treva00000000000000000',
  'TREVA Real Estate',
  'treva-real-estate',
  'TREVA developerləri, brokerləri və alıcıları vahid satış infrastrukturu üzərində birləşdirən Bakı əsaslı daşınmaz əmlak platformasıdır.',
  'TREVA is a Baku-based real estate sales platform connecting developers, brokers and buyers through a unified sales infrastructure.',
  'TREVA — бакинская платформа продаж недвижимости, объединяющая девелоперов, брокеров и покупателей в единой инфраструктуре.',
  '<p>TREVA daşınmaz əmlak layihələrinin satışı və marketinqi üzrə fəaliyyət göstərən Bakı əsaslı platformadır. Şirkət developerləri, brokerləri və alıcıları vahid satış infrastrukturu üzərində birləşdirir.</p><h3>Developerlər üçün</h3><p>TREVA bazar araşdırması, rəqib təhlili, mövqeləndirmə və qiymət strategiyasından başlayaraq marketinq, potensial müştəri cəlbi, CRM, broker şəbəkəsi və satışın bağlanmasına qədər layihənin bazara çıxış prosesini dəstəkləyir.</p><h3>Broker və agentliklər üçün</h3><p>Platforma eksklüziv layihələrə çıxış, hazır marketinq materialları, satış dəstəyi və peşəkar şəbəkəni genişləndirmək imkanı təqdim edir.</p><h3>Alıcı və investorlar üçün</h3><p>Komanda uyğun layihə və əmlak seçimi, bazar üzrə məlumatlandırma və alış prosesinin mərhələləri üzrə dəstək göstərir.</p>',
  '<p>TREVA is a Baku-based platform specialising in the sales and marketing of real estate projects. It connects developers, brokers and buyers through a unified sales infrastructure.</p><h3>For developers</h3><p>TREVA supports a project from market research, competitor analysis, positioning and pricing strategy through marketing, lead generation, CRM, broker outreach and closing support.</p><h3>For brokers and agencies</h3><p>The platform provides access to exclusive projects, ready-to-use marketing materials, sales support and opportunities to expand a professional network.</p><h3>For buyers and investors</h3><p>The team assists with selecting suitable projects and properties, understanding the market and navigating the stages of the purchase process.</p>',
  '<p>TREVA — бакинская платформа, специализирующаяся на продажах и маркетинге проектов недвижимости. Она объединяет девелоперов, брокеров и покупателей в единой инфраструктуре продаж.</p><h3>Для девелоперов</h3><p>TREVA сопровождает вывод проекта на рынок: от исследования рынка, анализа конкурентов, позиционирования и ценовой стратегии до маркетинга, привлечения клиентов, CRM, работы с брокерской сетью и поддержки закрытия сделок.</p><h3>Для брокеров и агентств</h3><p>Платформа предоставляет доступ к эксклюзивным проектам, готовым маркетинговым материалам, поддержке продаж и возможностям расширения профессиональной сети.</p><h3>Для покупателей и инвесторов</h3><p>Команда помогает подобрать подходящий проект или объект, разобраться в рыночной информации и пройти основные этапы процесса покупки.</p>',
  'https://treva.realestate/az',
  'info@treva.realestate',
  '+994 50 277 26 62',
  'https://treva.realestate/cdn-assets/c06d6deb09-685d6b08f6dce7040049422e_treva-logo.svg',
  'https://treva.realestate/images/treva-hero-bg.jpg',
  'Azərbaycan',
  'Bakı',
  'Ziya Yusifzadə küçəsi 10, Sabah Residence',
  'REAL_ESTATE_AGENCY',
  'ACTIVE',
  1, 1, 1, 1, 1, 0,
  'TREVA Real Estate — rəsmi tərəfdaş',
  'TREVA Real Estate — Bakıda developer, broker və alıcıları birləşdirən daşınmaz əmlak satış platforması. Xidmətlər və əlaqə məlumatları.',
  'TREVA Real Estate, TREVA, daşınmaz əmlak, Bakı daşınmaz əmlak, əmlak satış platforması, developer, broker, investisiya',
  'https://treva.realestate/images/treva-hero-bg.jpg',
  '2026-08-27T17:00:00.000Z',
  '2026-08-27T17:00:00.000Z'
)
ON CONFLICT("id") DO UPDATE SET
  "name" = excluded."name",
  "slug" = excluded."slug",
  "legalName" = NULL,
  "shortDescription" = excluded."shortDescription",
  "shortDescriptionEn" = excluded."shortDescriptionEn",
  "shortDescriptionRu" = excluded."shortDescriptionRu",
  "description" = excluded."description",
  "descriptionEn" = excluded."descriptionEn",
  "descriptionRu" = excluded."descriptionRu",
  "websiteUrl" = excluded."websiteUrl",
  "email" = excluded."email",
  "phone" = excluded."phone",
  "logoUrl" = NULL,
  "logoLight" = NULL,
  "logoDark" = excluded."logoDark",
  "coverImage" = excluded."coverImage",
  "country" = excluded."country",
  "city" = excluded."city",
  "address" = excluded."address",
  "partnershipType" = excluded."partnershipType",
  "status" = excluded."status",
  "verified" = excluded."verified",
  "officialPartner" = excluded."officialPartner",
  "featured" = excluded."featured",
  "showPublicly" = excluded."showPublicly",
  "showOnHomepage" = excluded."showOnHomepage",
  "officialSince" = NULL,
  "sortOrder" = excluded."sortOrder",
  "seoTitle" = excluded."seoTitle",
  "seoDescription" = excluded."seoDescription",
  "seoKeywords" = excluded."seoKeywords",
  "ogImage" = excluded."ogImage",
  "updatedAt" = excluded."updatedAt";

-- Setting (6)
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('site.title', 'Luxe Home Estate — Həyatınızın ən dəyərli ünvanı', '2026-08-20T17:31:32.242Z');
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('site.description', 'Luxe Home Estate — Bakıda mənzil, villa, həyət evi, torpaq, ofis və obyektlərin alqı-satqısı və icarəsi.', '2026-08-20T17:31:32.390Z');
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.phone', '+994 51 922 85 85', '2026-08-20T17:31:32.490Z');
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.address', 'Əliyar Əliyev 109A', '2026-08-20T17:31:32.502Z');
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.instagram', 'luxe_home_estate', '2026-08-20T17:31:32.530Z');
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('leads.notifyEmail', '', '2026-08-20T17:31:32.548Z');
