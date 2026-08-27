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

-- Service (7)
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtp2002nuadwtsuo42hj', 'Alqı-Satqı', 'alqi-satqi', 'Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.', 'Luxe Home Estate daşınmaz əmlakın alqı-satqısı prosesini əvvəldən sona qədər müşayiət edir. Əmlakın bazar dəyərinin qiymətləndirilməsindən başlayaraq, uyğun alıcı və ya satıcının tapılması, danışıqların aparılması, sənədlərin yoxlanılması və notarial rəsmiləşdirməyə qədər bütün mərhələlərdə yanınızdayıq.

Hər bir əmlak üzrə hüquqi təmizlik yoxlanılır, sənəd vəziyyəti dəqiqləşdirilir və tərəflər arasında şəffaf razılaşma təmin edilir.', 'Handshake', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', '["Əmlakın bazar dəyərinin qiymətləndirilməsi","Hüquqi sənədlərin yoxlanılması","Alıcı və satıcı arasında danışıqların aparılması","Notarial rəsmiləşdirmənin təşkili","Əməliyyat sonrası dəstək"]', 0, 1, 'Alqı-Satqı — Luxe Home Estate', 'Daşınmaz əmlakın alqı-satqısı üzrə peşəkar xidmət.', 1787247091478, 1787247091478);
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtpj002ouadw8xp901vj', 'İcarə', 'icare', 'Mənzil, villa, ofis və digər əmlakların icarəsi.', 'Qısa və uzunmüddətli icarə üzrə geniş portfel təqdim edirik. Mənzil, villa, bağ evi, ofis və kommersiya obyektləri üzrə tələbinizə uyğun variantları seçir, baxış təşkil edir və icarə müqaviləsinin hazırlanmasında dəstək göstəririk.

Həm icarəyə verən, həm də icarəçi üçün şərtlərin aydın və qarşılıqlı sərfəli olmasına diqqət yetirilir.', 'KeyRound', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80', '["Qısa və uzunmüddətli icarə variantları","Baxışların təşkili","İcarə müqaviləsinin hazırlanması","Əmlak sahibi üçün icarəçi seçimi","İcarə müddətində əlaqələndirmə"]', 1, 1, 'İcarə — Luxe Home Estate', 'Mənzil, villa, ofis və digər əmlakların icarəsi.', 1787247091494, 1787247091494);
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtpu002puadwe72925h2', 'İpoteka', 'ipoteka', 'İpoteka yolu ilə əmlak əldə etmək üçün dəstək.', 'İpoteka ilə mənzil almaq istəyən müştərilərə prosesin başa düşülməsində və sənədlərin hazırlanmasında kömək edirik. Hansı əmlakların ipoteka şərtlərinə uyğun olduğunu müəyyənləşdirir, bank tələblərinə uyğun sənəd paketinin toplanmasında yönləndiririk.

Qeyd: kredit qərarı və şərtləri müvafiq maliyyə qurumu tərəfindən müəyyən edilir.', 'Landmark', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80', '["İpotekaya uyğun əmlakların seçimi","Sənəd paketinin hazırlanmasında dəstək","Bank tələbləri üzrə məsləhət","Əmlakın qiymətləndirilməsinin təşkili","Rəsmiləşdirmə mərhələsində müşayiət"]', 2, 1, 'İpoteka — Luxe Home Estate', 'İpoteka yolu ilə əmlak əldə etmək üçün dəstək.', 1787247091507, 1787247091507);
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtq5002quadwsj7o7qgt', 'Daxili Kredit', 'daxili-kredit', 'Şirkətin təqdim etdiyi daxili kredit imkanları.', 'Bəzi əmlaklar üzrə şirkət daxili ödəniş imkanları təklif olunur. Bu imkan alıcıya ödənişi mərhələlərlə həyata keçirməyə şərait yaradır.

Daxili kredit şərtləri hər bir əmlak üzrə fərdi müəyyən edilir. Konkret şərtləri öyrənmək üçün bizimlə əlaqə saxlayın.', 'Wallet', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80', '["Əmlak üzrə fərdi ödəniş qrafiki","İlkin ödəniş variantları","Şəffaf şərtlər və razılaşma","Rəsmi müqavilə ilə rəsmiləşdirmə"]', 3, 1, 'Daxili Kredit — Luxe Home Estate', 'Şirkətin təqdim etdiyi daxili kredit imkanları.', 1787247091517, 1787247091517);
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtqf002ruadwk8h91k1m', 'Təmir-Tikinti', 'temir-tikinti', 'Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.', 'Aldığınız və ya mövcud əmlakınızın təmir və tikinti işlərini təşkil edirik. Kosmetik təmirdən başlayaraq tam yenidənqurma və daxili dizayn işlərinə qədər müxtəlif həcmli layihələr üzrə xidmət göstərilir.

İş başlamazdan əvvəl smeta hazırlanır, mərhələlər və müddət razılaşdırılır.', 'Hammer', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80', '["Kosmetik və əsaslı təmir","Daxili dizayn və planlaşdırma","Smeta və iş qrafikinin hazırlanması","Material seçimində dəstək","İşin mərhələli təhvili"]', 4, 1, 'Təmir-Tikinti — Luxe Home Estate', 'Əmlakların təmir və tikinti işlərinin həyata keçirilməsi.', 1787247091527, 1787247091527);
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtqr002suadw6ffc8lyf', 'Reklam', 'reklam', 'Daşınmaz əmlakların tanıtımı və reklam xidmətləri.', 'Əmlakınızın daha geniş auditoriyaya çatması üçün tanıtım xidmətləri təqdim edirik. Elanın hazırlanması, sosial media və rəqəmsal platformalarda yerləşdirilməsi, hədəflənmiş reklam kampaniyalarının qurulması bu xidmətə daxildir.

Məqsəd əmlakın düzgün auditoriyaya, düzgün formatda təqdim edilməsidir.', 'Megaphone', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80', '["Elan mətninin peşəkar hazırlanması","Sosial media tanıtımı","Hədəflənmiş rəqəmsal reklam","Luxe Home Estate platformasında yerləşdirmə","Nəticələr üzrə hesabat"]', 5, 1, 'Reklam — Luxe Home Estate', 'Daşınmaz əmlakların tanıtımı və reklam xidmətləri.', 1787247091539, 1787247091539);
INSERT OR IGNORE INTO "Service" ("id", "title", "slug", "shortDescription", "description", "icon", "imageUrl", "bullets", "order", "isActive", "metaTitle", "metaDescription", "createdAt", "updatedAt") VALUES ('cmt1srtr3002tuadwh0ts429k', 'Çəkiliş', 'cekilis', 'Professional foto və video çəkiliş xidmətləri.', 'Daşınmaz əmlakın satış sürətini ən çox təsir edən amillərdən biri keyfiyyətli vizual materialdır. Peşəkar foto və video çəkiliş, dron çəkilişi və 360° panoram materiallarının hazırlanması üzrə xidmət göstəririk.

Hər çəkiliş əmlakın güclü tərəflərini önə çıxaracaq şəkildə planlaşdırılır.', 'Camera', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80', '["Peşəkar interyer və eksteryer fotoçəkilişi","Video təqdimat rolikləri","Dron ilə hava çəkilişi","Şəkillərin peşəkar emalı","Sosial media üçün format hazırlığı"]', 6, 1, 'Çəkiliş — Luxe Home Estate', 'Professional foto və video çəkiliş xidmətləri.', 1787247091551, 1787247091551);

-- Partner (1)
INSERT OR IGNORE INTO "Partner" ("id", "name", "slug", "websiteUrl", "partnershipType", "status", "verified", "officialPartner", "featured", "showPublicly", "showOnHomepage", "sortOrder", "createdAt", "updatedAt") VALUES ('cm0treva00000000000000000', 'TREVA', 'treva', 'https://treva.realestate/az', 'OTHER', 'ACTIVE', 1, 1, 1, 1, 1, 0, 1787850000000, 1787850000000);

-- Setting (6)
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('site.title', 'Luxe Home Estate — Həyatınızın ən dəyərli ünvanı', 1787247092242);
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('site.description', 'Luxe Home Estate — Bakıda mənzil, villa, həyət evi, torpaq, ofis və obyektlərin alqı-satqısı və icarəsi.', 1787247092390);
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.phone', '+994 51 922 85 85', 1787247092490);
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.address', 'Əliyar Əliyev 109A', 1787247092502);
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('contact.instagram', 'luxe_home_estate', 1787247092530);
INSERT OR IGNORE INTO "Setting" ("key", "value", "updatedAt") VALUES ('leads.notifyEmail', '', 1787247092548);
