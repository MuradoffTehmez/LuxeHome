-- Sonradan əlavə edilən xidmətlər üçün tam public və SEO məzmunu.
-- Yeni mühitdə eyni məlumat `prisma/seed.ts` vasitəsilə də yaradılır.
INSERT INTO Service (
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
