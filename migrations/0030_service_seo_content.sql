-- Xidmət səhifələrinin SEO metadata-sını, cover şəkillərini və natamam kontentini tamamla.
-- Yeniləmələr slug üzrə idempotentdir və yalnız idarə olunan xidmət qeydlərinə toxunur.

UPDATE "Service"
SET "metaTitle" = 'Alqı-Satqı — Luxe Home Estate',
    "metaDescription" = 'Bakıda daşınmaz əmlak alqı-satqısı: qiymətləndirmə, sənəd yoxlanışı, danışıqlar və notarial rəsmiləşdirmə üzrə peşəkar müşayiət.',
    "imageUrl" = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'alqi-satqi';

UPDATE "Service"
SET "metaTitle" = 'Bakıda Əmlak İcarəsi — Luxe Home Estate',
    "metaDescription" = 'Bakıda mənzil, villa, ofis və kommersiya obyektlərinin qısa və uzunmüddətli icarəsi üzrə seçim, baxış və müqavilə dəstəyi.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'icare';

UPDATE "Service"
SET "metaTitle" = 'İpoteka — Luxe Home Estate',
    "metaDescription" = 'İpoteka ilə mənzil alışı üçün uyğun əmlak seçimi, sənədlərin hazırlanması, qiymətləndirmə və bank tələbləri üzrə peşəkar dəstək.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'ipoteka';

UPDATE "Service"
SET "metaTitle" = 'Daxili Kredit — Luxe Home Estate',
    "metaDescription" = 'Seçilmiş əmlaklar üçün fərdi ilkin ödəniş və mərhələli ödəniş qrafiki ilə şirkətdaxili kredit imkanları və müqavilə dəstəyi.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'daxili-kredit';

UPDATE "Service"
SET "metaTitle" = 'Təmir-Tikinti — Luxe Home Estate',
    "metaDescription" = 'Bakıda mənzil və kommersiya obyektləri üçün kosmetik və əsaslı təmir, tikinti, daxili dizayn, smeta və mərhələli təhvil xidmətləri.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'temir-tikinti';

UPDATE "Service"
SET "metaTitle" = 'Reklam — Luxe Home Estate',
    "metaDescription" = 'Əmlak elanının hazırlanması, peşəkar təqdimatı, sosial media yayımı və hədəflənmiş rəqəmsal reklam kampaniyaları üzrə xidmət.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'reklam';

UPDATE "Service"
SET "metaTitle" = 'Çəkiliş — Luxe Home Estate',
    "metaDescription" = 'Əmlaklar üçün peşəkar interyer və eksteryer fotoçəkilişi, video təqdimat, dron çəkilişi, 360° panorama və şəkil emalı.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'cekilis';

UPDATE "Service"
SET "description" = 'Daşınmaz əmlakın real bazar dəyərini satış, icarə və investisiya məqsədləri üçün peşəkar şəkildə müəyyən edirik. Qiymətləndirmə zamanı yerləşmə, sahə, təmir vəziyyəti, sənədlər, binanın xüsusiyyətləri və oxşar bazar təklifləri müqayisə olunur. Nəticələr müştəriyə əsaslandırılmış qiymət aralığı və praktik tövsiyələrlə təqdim edilir. Bu yanaşma əmlakı düzgün qiymətlə bazara çıxarmağa və riskli qərarlardan yayınmağa kömək edir.',
    "bullets" = '["Oxşar bazar təkliflərinin müqayisəsi","Yerləşmə və texniki vəziyyətin təhlili","Sənəd və təyinat amillərinin nəzərə alınması","Əsaslandırılmış qiymət aralığı","Satış və investisiya üzrə praktik tövsiyələr"]',
    "imageUrl" = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80',
    "metaTitle" = 'Əmlak Qiymətləndirilməsi — Luxe Home Estate',
    "metaDescription" = 'Bakıda daşınmaz əmlakın satış, icarə və investisiya məqsədləri üçün bazar dəyərinin peşəkar təhlili və qiymətləndirilməsi.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'qiymetlendirme';

UPDATE "Service"
SET "description" = 'Daşınmaz əmlakın alınması, satılması, icarəsi və investisiya məqsədilə seçilməsi üzrə fərdi konsultasiya təqdim edirik. Mütəxəssislərimiz bazar vəziyyətini, qiymət dinamikasını, sənəd risklərini və mümkün alternativləri izah edir. Görüş zamanı müştərinin məqsədi, büdcəsi və vaxt planı dəqiqləşdirilir, sonra atılacaq addımlar üzrə aydın yol xəritəsi hazırlanır. Qərarınızı faktlara əsaslanan və riskləri nəzərə alan yanaşma ilə verməyinizə kömək edirik.',
    "bullets" = '["Alqı-satqı və icarə strategiyası","Bazar və qiymət dinamikasının izahı","Sənəd və əməliyyat risklərinin təhlili","Alternativ əmlak variantlarının müqayisəsi","Fərdi addım planının hazırlanması"]',
    "imageUrl" = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
    "metaTitle" = 'Konsultasiya — Luxe Home Estate',
    "metaDescription" = 'Daşınmaz əmlak alqı-satqısı, sənədlər, bazar vəziyyəti və investisiya qərarları üzrə fərdi ekspert konsultasiyası.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'konsultasiya';

UPDATE "Service"
SET "description" = 'A-frame tipli evlərin ideyadan təhvilə qədər layihələndirilməsi və tikintisi üzrə kompleks xidmət təqdim edirik. Torpaq sahəsinin xüsusiyyətləri, evin ölçüsü, plan həlli, material seçimi, istilik izolyasiyası və kommunikasiya ehtiyacları birlikdə qiymətləndirilir. Layihə mərhələli iş qrafiki və razılaşdırılmış smeta əsasında idarə olunur. Məqsədimiz müasir dizaynı, enerji səmərəliliyini və rahat yaşayış standartlarını birləşdirən funksional A-frame ev yaratmaqdır.',
    "bullets" = '["Torpaq sahəsi və ehtiyacların ilkin təhlili","Memarlıq və planlaşdırma həlli","Material və enerji səmərəliliyi seçimi","Mərhələli tikinti və keyfiyyət nəzarəti","Hazır evin təhvili və satış dəstəyi"]',
    "imageUrl" = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=80',
    "metaTitle" = 'A-frame Evlər — Luxe Home Estate',
    "metaDescription" = 'A-frame evlərin layihələndirilməsi, tikintisi və satışı: planlama, material seçimi, enerji səmərəliliyi və mərhələli icra dəstəyi.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'a-frame-evler-xidmeti';

UPDATE "Service"
SET "description" = 'Yaşayış, ofis və kommersiya məkanları üçün havalandırma sistemlərinin layihələndirilməsi, quraşdırılması və texniki xidmətini təşkil edirik. Məkanın sahəsi, istifadə təyinatı, hava dövriyyəsi ehtiyacı və enerji sərfiyyatı təhlil olunur. Uyğun avadanlıq və kanal sistemi seçildikdən sonra montaj, sazlama və yoxlama aparılır. Dövri texniki baxış və filtr xidməti sistemin səmərəli işləməsinə, təmiz havanın və rahat temperaturun qorunmasına kömək edir.',
    "bullets" = '["Məkan və hava dövriyyəsi ehtiyacının təhlili","Sistem layihəsi və avadanlıq seçimi","Kanal və avadanlıqların quraşdırılması","Sazlama, balanslaşdırma və işəsalma yoxlaması","Dövri texniki baxış və filtr xidməti"]',
    "imageUrl" = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80',
    "metaTitle" = 'Havalandırma Sistemləri — Luxe Home Estate',
    "metaDescription" = 'Yaşayış və ofis məkanları üçün havalandırma sistemlərinin layihələndirilməsi, quraşdırılması, sazlanması və texniki xidməti.',
    "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE "slug" = 'havalandirma-sistemi';
