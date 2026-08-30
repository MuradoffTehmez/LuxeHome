-- Avtomatik yaradılıb: npm run db:knowledge:build
-- Hüquqi yoxlama tamamlanana qədər bütün bələdçilər DRAFT-dır.
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_alqi-satqi','alqi-satqi','Alqı-satqı','alqi satqi','Alqı-satqı üzrə hüquqi və praktiki bələdçilər.','Home',0,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_kiraye','kiraye','Kirayə','kiraye','Kirayə üzrə hüquqi və praktiki bələdçilər.','KeyRound',10,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_vereselik','vereselik','Vərəsəlik','vereselik','Vərəsəlik üzrə hüquqi və praktiki bələdçilər.','ScrollText',20,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_ipoteka-maliyye','ipoteka-maliyye','İpoteka və maliyyə','ipoteka maliyye','İpoteka və maliyyə üzrə hüquqi və praktiki bələdçilər.','Landmark',30,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_qeydiyyat-notariat','qeydiyyat-notariat','Qeydiyyat və notariat','qeydiyyat notariat','Qeydiyyat və notariat üzrə hüquqi və praktiki bələdçilər.','FileCheck2',40,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_vergi-rusum','vergi-rusum','Vergi və rüsumlar','vergi rusum','Vergi və rüsumlar üzrə hüquqi və praktiki bələdçilər.','ReceiptText',50,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_yeni-tikili','yeni-tikili','Tikinti və yeni tikililər','yeni tikili','Tikinti və yeni tikililər üzrə hüquqi və praktiki bələdçilər.','Building2',60,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_torpaq','torpaq','Torpaq hüququ','torpaq','Torpaq hüququ üzrə hüquqi və praktiki bələdçilər.','Map',70,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_mehkemeler','mehkemeler','Məhkəmə təcrübəsi','mehkemeler','Məhkəmə təcrübəsi üzrə hüquqi və praktiki bələdçilər.','Scale',80,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_agentlik-brokerlik','agentlik-brokerlik','Agentlik və brokerlik','agentlik brokerlik','Agentlik və brokerlik üzrə hüquqi və praktiki bələdçilər.','Handshake',90,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_menzil-ve-diger-dasinmaz-emlakin-alqi-satqisi','menzil-ve-diger-dasinmaz-emlakin-alqi-satqisi','Mənzil və digər daşınmaz əmlakın alqı-satqısı','mənzil və digər daşınmaz əmlakın alqı-satqısı azərbaycan hüququnda hazır mənzilin təhlükəsiz alışı üçün əsas model belədir: əmlakın dövlət reyestrində mövcudluğunun və satıcının hüququnun yoxlanılması → həbs, ipoteka və digər yüklülüklərin yoxlanılması → ailə və razılıq məsələlərinin həlli → notariat müqaviləsi → ödənişin qanuni kanalla aparılması → müqavilənin elektron qaydada reyestrə göndərilməsi → alıcının hüququnun qeydiyyatı v','Azərbaycan hüququnda hazır mənzilin təhlükəsiz alışı üçün əsas model belədir: əmlakın dövlət reyestrində mövcudluğunun və satıcının hüququnun yoxlanılması → həbs, ipoteka və digər yüklülüklərin yoxlanılması → ailə və razılıq məsələlərinin həlli → notariat müqaviləsi → ödənişin qanuni kanalla aparılması → müqavilənin elektron qaydada reyestrə göndərilməsi → alıcının hüququnun qeydiyyatı v','<p>İcra xülasəsi. Azərbaycan hüququnda hazır mənzilin təhlükəsiz alışı üçün əsas model belədir: əmlakın dövlət reyestrində mövcudluğunun və satıcının hüququnun yoxlanılması → həbs, ipoteka və digər yüklülüklərin yoxlanılması → ailə və razılıq məsələlərinin həlli → notariat müqaviləsi → ödənişin qanuni kanalla aparılması → müqavilənin elektron qaydada reyestrə göndərilməsi → alıcının hüququnun qeydiyyatı və elektron çıxarış. Dövlət reyestrində qeydiyyatı olmayan daşınmaz əmlakın adi satış müqaviləsini “çıxarışlı mənzil” kimi rəsmiləşdirmək mümkün deyil; belə obyektlərdə ilkin müqavilə, MTK sənədi və ya investisiya müqaviləsi mülkiyyət hüququ ilə eyniləşdirilməməlidir.</p>
<p>Mülki Məcəllənin 144-cü maddəsinə görə dövlət reyestrində qeydiyyata alınmış daşınmaz əmlak üzərində sərəncam verilməsinə yönələn müqavilələr notariat qaydasında təsdiqlənir. Notarius satıcının sərəncam səlahiyyətini, əmlakın hüquqi vəziyyətini və müqavilənin qanunauyğunluğunu yoxlamalıdır. Notarial müqavilə elektron qaydada dövlət reyestrinə göndərilir və bu göndəriş qeydiyyat üçün ərizə funksiyası daşıyır.</p>
<p>ASAN xidmətin 2026-cı il üzrə daşınmaz əmlak alqı-satqısı səhifəsi mülkiyyət sənədini, əmlak üzərində yüklülük/həbs barədə məlumatı, satıcı nikahdadırsa nikah şəhadətnaməsi və həyat yoldaşının notarial razılığını, mənzil/ev kimi yaşayış sahələrində qeydiyyatda olan yetkin ailə üzvlərinin razılığını tələb olunan sənədlər sırasında göstərir.</p>
<p>Yoxlama	Praktik sənəd / məlumat	Əsas risk</p>
<p>Satıcının hüququ	Elektron çıxarış və reyestr məlumatı	Saxta və ya köhnə sənəd</p>
<p>Yüklülük	İpoteka, həbs, qadağa, servitut məlumatı	Alıcı sərbəst mülkiyyət əldə etmir</p>
<p>Texniki məlumat	Plan, sahə, ünvan, təyinat	Faktiki sahə reyestrə uyğun deyil</p>
<p>Ailə vəziyyəti	Nikah və zəruri razılıqlar	Sonradan əqdin mübahisələndirilməsi</p>
<p>Səlahiyyət	Şəxsiyyət sənədi / etibarnamə	Səlahiyyətsiz satış</p>
<p>Ödəniş	Notariusun depozit hesabı / bank sənədi	Ödənişin sübut edilə bilməməsi</p>
<p>Notariat qaydalarında daşınmaz əmlaka sərəncam müqavilələri üzrə ödənişlərin notariusun bankdakı depozit hesabı vasitəsilə aparılmasına dair xüsusi mexanizm mövcuddur. Qaydalarda 5 500 manatdan yuxarı ödənişlərə dair hədd ayrıca göstərilsə də, sonrakı müddəalar daşınmaz əmlaka sərəncam üzrə ödənişlərin depozit hesabından keçirilməsini daha geniş formada tənzimləyir. Praktik baxımdan alıcı nağd şəkildə “əlbəəl” böyük məbləğ verməyi deyil, notariusun göstərdiyi qanuni ödəniş mexanizmini əsas götürməlidir.</p>
<p>Əmlak seçilir</p>
<p>Çıxarış və reyestr yoxlanır</p>
<p>Yüklülük, ipoteka, həbs yoxlanır</p>
<p>Ailə və digər razılıqlar alınır</p>
<p>Notarius müqaviləni hazırlayır</p>
<p>Ödəniş depozit/bank mexanizmi ilə</p>
<p>Notarial təsdiq</p>
<p>Müqavilə elektron reyestrə ötürülür</p>
<p>Alıcının hüququ qeydiyyata alınır</p>
<p>Elektron çıxarış</p>
<p>Show code</p>
<p>Cari notariat xərcləri. ASAN-ın cari tarifinə əsasən yaxın qohumlar arasında daşınmaz əmlakın alqı-satqısında dövlət rüsumu 25 manat, xidmət haqqı 3,75 manatdır. Digər şəxslər arasında Bakı şəhərində müvafiq olaraq 280 və 42 manat; Sumqayıt, Gəncə və Abşeron rayonunda 196 və 29,40 manat; digər şəhər və rayonlarda 140 və 21 manatdır.</p>
<p>Hüququn dövlət qeydiyyatına alınmasına dair elektron çıxarış üçün dövlət rüsumu 50 manatdır. Mənzil üzrə ASAN xidmət səhifəsi adi 10 iş günlük xidmət üçün 36 manat, 7 iş günü üçün 54 manat, 3 iş günü üçün 72 manat, 1 iş günü üçün 108 manat xidmət haqqı göstərir. Texniki pasport və plan-ölçü lazım olduqda ayrıca 75 manat dövlət rüsumu və ərazi/sahə/sürət əsasında xidmət haqqı yaranır.</p>
<p>Vergi. Fiziki şəxsin yaşayış sahəsini təqdim etməsi zamanı Vergi Məcəlləsinin 218-1 və 220.8-ci maddələri əsasdır. Şəxsin azı 3 təqvim ili həmin yaşayış sahəsində qeydiyyatda olması müəyyən hallarda satışın sadələşdirilmiş vergidən azad edilməsinə əsas verir. Bu şərt ödənilmədikdə yaşayış sahəsinin ilk 30 m² hissəsi azad edilir, qalan sahəyə hər m² üçün 15 manat baza məbləği və ərazi əmsalı tətbiq edilir. Dövlət Vergi Xidməti 2026-cı ildə də məhz bu mexanizmi izah edir.</p>
<p>Risk–tövsiyə cədvəli</p>
<p>Risk	Risk səviyyəsi	Tövsiyə</p>
<p>“Kupçasız” mənzilə tam pul ödəmək	Çox yüksək	Hüquqi status və developer sənədləri ayrıca yoxlanılsın</p>
<p>Etibarnamə ilə satış	Orta–yüksək	Etibarnamənin qüvvəsi və əhatəsi notariusda yoxlanılsın</p>
<p>Faktiki sahə ilə çıxarış fərqi	Yüksək	Texniki plan müqayisə edilsin</p>
<p>İpotekalı mənzil	Yüksək	İpoteka saxlayanın hüquqları həll edilmədən ödəniş edilməsin</p>
<p>Şifahi razılaşma/əlbəəl avans	Yüksək	Yazılı və bank izi olan mexanizm seçilsin</p>
<p>Alıcı check-listi</p>
<p>☐ Elektron çıxarışı yoxladım</p>
<p>☐ Satıcının şəxsiyyətini yoxladım</p>
<p>☐ Əmlakın sahə və ünvanını faktiki vəziyyətlə tutuşdurdum</p>
<p>☐ İpoteka/həbs/qadağanı yoxladım</p>
<p>☐ Nikah və ailə razılıqları müəyyən edildi</p>
<p>☐ Kommunal və idarəetmə borcları soruşuldu</p>
<p>☐ Qiymət və ödəniş mexanizmi müqavilədə tam yazılıb</p>
<p>☐ Təhvil-təslim tarixi müəyyən edilib</p>
<p>☐ Açarların və faktiki sahibliyin verilməsi ayrıca sənədləşdirilir</p>
<p>Nümunə — alqı-satqı müqaviləsinə əsas kommersiya şərtləri</p>
<p>text</p>
<p>Copy</p>
<p>DAŞINMAZ ƏMLAKIN ALQI-SATQISI ÜZRƏ ŞƏRTLƏR</p>
<p>Satıcı: [F.A.A., FİN]</p>
<p>Alıcı: [F.A.A., FİN]</p>
<p>Əmlak:</p>
<p>Ünvan: [...]</p>
<p>Reyestr/çıxarış məlumatı: [...]</p>
<p>Ümumi sahə: [...] m²</p>
<p>Təyinat: [...]</p>
<p>Satış qiyməti: [...] AZN.</p>
<p>Satıcı bəyan edir ki:</p>
<p>1. Əmlak üzərində müqavilədə göstərilməyən yüklülük yoxdur;</p>
<p>2. Təqdim edilmiş sənədlər həqiqidir;</p>
<p>3. Əmlak üçüncü şəxsin mübahisəsinin predmeti deyil;</p>
<p>4. Zəruri ailə və digər razılıqlar əldə edilmişdir.</p>
<p>Ödəniş:</p>
<p>Notariat qanunvericiliyinin tələb etdiyi depozit/bank mexanizmi ilə.</p>
<p>Təhvil:</p>
<p>Əmlak və açarlar ən geci [...] tarixdə alıcıya təhvil verilir.</p>
<p>Tərəflər əlavə olaraq təhvil-təslim aktı imzalayırlar.</p>
<p>FAQ. Çıxarış olmadan notarial mənzil satışı mümkündürmü? Dövlət reyestrində qeydiyyat tələb olunan əmlak üçün adi mülkiyyət satışının əsas şərti qeydiyyatdır.</p>
<p>İlkin müqavilə məni avtomatik mülkiyyətçi edir? Xeyr. Konstitusiya Məhkəməsinin 12 may 2026-cı il mövqeyi ilkin müqavilənin özü ilə əmlak hüququnun yaranmadığını və gələcək əşyanın bu müqavilə ilə avtomatik yüklənmədiyini vurğulayır.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Mülki Məcəllə, xüsusilə 144, 146 və daşınmaz əmlak satışına dair normalar.","“Daşınmaz əmlakın dövlət reyestri haqqında” Qanun.","ASAN — daşınmaz əmlakın alqı-satqı müqaviləsinin təsdiqi.","Dövlət Vergi Xidməti — Vergi Məcəlləsinin 218-1 və 220.8-ci maddələrinin tətbiqi."]','<p>İcra xülasəsi. Azərbaycan hüququnda hazır mənzilin təhlükəsiz alışı üçün əsas model belədir: əmlakın dövlət reyestrində mövcudluğunun və satıcının hüququnun yoxlanılması → həbs, ipoteka və digər yüklülüklərin yoxlanılması → ailə və razılıq məsələlərinin həlli → notariat müqaviləsi → ödənişin qanuni kanalla aparılması → müqavilənin elektron qaydada reyestrə göndərilməsi → alıcının hüququnun qeydiyyatı və elektron çıxarış. Dövlət reyestrində qeydiyyatı olmayan daşınmaz əmlakın adi satış müqaviləsini “çıxarışlı mənzil” kimi rəsmiləşdirmək mümkün deyil; belə obyektlərdə ilkin müqavilə, MTK sənədi və ya investisiya müqaviləsi mülkiyyət hüququ ilə eyniləşdirilməməlidir.</p>',0,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_kiraye-munasibetleri','kiraye-munasibetleri','Kirayə münasibətləri','kirayə münasibətləri kirayə münasibətlərində ən çox edilən hüquqi səhv “müqavilə yazmağa ehtiyac yoxdur” yanaşmasıdır. azərbaycan mülki məcəlləsi əmlak kirayəsi və icarə münasibətlərini ayrıca müqavilə institutları kimi tənzimləyir. mülki məcəllənin 700.1-ci maddəsində icarə müqaviləsi əmlak kirayəsi müqaviləsi kimi müəyyən edilir və icarəçinin əmlakdan istifadə etməsi müqabilində icarə haqqı ödəməsi nəzərdə','Kirayə münasibətlərində ən çox edilən hüquqi səhv “müqavilə yazmağa ehtiyac yoxdur” yanaşmasıdır. Azərbaycan Mülki Məcəlləsi əmlak kirayəsi və icarə münasibətlərini ayrıca müqavilə institutları kimi tənzimləyir. Mülki Məcəllənin 700.1-ci maddəsində icarə müqaviləsi əmlak kirayəsi müqaviləsi kimi müəyyən edilir və icarəçinin əmlakdan istifadə etməsi müqabilində icarə haqqı ödəməsi nəzərdə','<p>İcra xülasəsi. Kirayə münasibətlərində ən çox edilən hüquqi səhv “müqavilə yazmağa ehtiyac yoxdur” yanaşmasıdır. Azərbaycan Mülki Məcəlləsi əmlak kirayəsi və icarə münasibətlərini ayrıca müqavilə institutları kimi tənzimləyir. Mülki Məcəllənin 700.1-ci maddəsində icarə müqaviləsi əmlak kirayəsi müqaviləsi kimi müəyyən edilir və icarəçinin əmlakdan istifadə etməsi müqabilində icarə haqqı ödəməsi nəzərdə tutulur.</p>
<p>Yaşayış mənzili üzrə müqavilədə minimum olaraq tərəflər, əmlak, aylıq haqq, ödəniş tarixi, kommunal ödənişlər, depozit, təmir, subkirayə, müqavilənin müddəti, xitam mexanizmi və əmlakın qaytarılması vəziyyəti göstərilməlidir. Müqavilə azadlığı prinsipi tərəflərə qanunun imperativ tələblərinə zidd olmayan əlavə şərtləri müəyyən etməyə imkan verir.</p>
<p>Daşınmaz əmlak üzərində 11 aydan çox müddətə icarə və ya istifadə hüququ “Daşınmaz əmlakın dövlət reyestri haqqında” Qanunun 19.1-ci maddəsi əsasında dövlət qeydiyyatına alınmalıdır. Bu, xüsusilə uzunmüddətli kommersiya icarələrində kritikdir.</p>
<p>ASAN xidmət yaşayış sahəsinin kirayəyə verilməsi müqaviləsinin notarial təsdiqi üçün mülkiyyət sənədi, mülkiyyətçi nikahdadırsa nikah sənədi və zəruri halda həyat yoldaşının razılığı, habelə qeydiyyatda olan yetkin ailə üzvlərinin notarial razılığı kimi sənədləri göstərir. Cari tarif dövlət rüsumu üzrə 35 manat, xidmət haqqı üzrə 5,25 manatdır.</p>
<p>Depozit. Yaşayış kirayəsində “bir aylıq depozit mütləqdir” və ya “maksimum iki aylıq ola bilər” kimi ümumi qanuni limit müəyyən edən norma rəsmi mənbələrdə təsdiq edilmir. Təminat depozitinin məbləği və qaytarılma halları müqavilədə müəyyən edilməlidir; bu, Mülki Məcəllənin müqavilə azadlığı və öhdəliyin təmin edilməsi prinsiplərinə əsaslanan müqavilə mexanizmidir.</p>
<p>Ən düzgün formul:</p>
<p>text</p>
<p>Copy</p>
<p>Depozit: 1 000 AZN.</p>
<p>Depozit son ayın kirayə haqqı hesab edilmir.</p>
<p>Müqavilə bitdikdə mənzil təhvil-təslim aktına uyğun qaytarıldıqda</p>
<p>və sənədlə təsdiqlənmiş borc/zərər olmadıqda depozit [...] iş günü</p>
<p>ərzində kirayəçiyə qaytarılır.</p>
<p>Adi istifadə nəticəsində yaranan normal aşınma zərər hesab edilmir.</p>
<p>Bu cümlə “depoziti hər halda saxlayaram” kimi hüquqi cəhətdən mübahisəli yanaşmadan daha təhlükəsizdir.</p>
<p>Müqavilədə olmalı şərt	Niyə vacibdir?</p>
<p>Dəqiq ünvan və sahə	Müqavilənin predmetini müəyyən edir</p>
<p>Müddət	Xitam və qeydiyyat rejiminə təsir edir</p>
<p>Aylıq haqq	Borc iddiasının əsasını yaradır</p>
<p>Depozit	Qaytarma mübahisəsini azaldır</p>
<p>Kommunal xərclər	Kimin nə ödədiyini ayırır</p>
<p>Təmir	Xırda və əsaslı təmir məsuliyyətini bölür</p>
<p>Subkirayə	İcazəsiz üçüncü şəxs riskini azaldır</p>
<p>Xitam bildirişi	Qəfil çıxarılma/mübahisəni azaldır</p>
<p>Təhvil-təslim aktı	Zərəri sübut etməyə imkan verir</p>
<p>Kirayə müqaviləsinə xitam məsələsində yalnız “ev sahibi istəyəndə çıxara bilər” formasında şərt yazmaq risklidir. Müqavilə müddəti, gecikmiş kirayə haqqı, əmlakdan təyinatdan kənar istifadə, ciddi zərər, subkirayənin pozulması və digər əsaslar ayrıca müəyyən edilməli, bildiriş müddəti göstərilməlidir. Mübahisəli halda özbaşına qapının dəyişdirilməsi və əşyaların çıxarılması əvəzinə müqavilə və məhkəmə mexanizmlərindən istifadə daha təhlükəsiz hüquqi strategiyadır. Müqavilələrin bağlayıcılığı və birtərəfli xitamın yalnız qanun/müqavilə çərçivəsində mümkünlüyü Mülki Məcəllənin ümumi müqavilə qaydalarından irəli gəlir.</p>
<p>Kirayə gəlirinin vergisi. Burada 2026-cı il üçün vacib yenilik-mübahisə var: yaşayış sahələrinin fiziki şəxslərə kirayəsi üzrə dərəcənin 14%-dən 10%-ə endirilməsi barədə təklif rəsmi şəkildə ictimailəşdirilmişdi, lakin Dövlət Vergi Xidmətinin 6 avqust 2026-cı il tarixində indekslənmiş cari izahında Vergi Məcəlləsinin 124.1-ci maddəsi üzrə rezident fiziki şəxsin icarə gəlirinə hələ də 14% dərəcə göstərilir. Buna görə bu materialda cari tətbiq kimi 14% əsas götürülür.</p>
<p>İcarə haqqını vergi uçotunda olan şəxs ödəyirsə, 14% ödəmə mənbəyində tutulur.</p>
<p>Kirayə proses axını</p>
<p>Bəli</p>
<p>Xeyr</p>
<p>Mülkiyyətçi və kirayəçi razılaşır</p>
<p>Çıxarış və şəxsiyyət yoxlanır</p>
<p>Mənzilin inventarı və fotoakt hazırlanır</p>
<p>Müqavilə imzalanır</p>
<p>Müddət 11 aydan çoxdur?</p>
<p>İcarə hüququ dövlət qeydiyyatına alınır</p>
<p>Müqavilə üzrə istifadə başlanır</p>
<p>Aylıq ödəniş və vergi uçotu</p>
<p>Xitam və təhvil-təslim</p>
<p>Depozitin hesablaşması</p>
<p>Show code</p>
<p>Kirayəçi üçün check-list: çıxarış, ev sahibinin kimliyi, etibarnamə varsa səlahiyyət, faktiki inventar, sayğac göstəriciləri, açarlar, depozit şərti, kommunal borc, xitam müddəti və vergi məsələsi müqavilədən əvvəl yoxlanmalıdır.</p>
<p>Nümunə — kirayə müqaviləsi</p>
<p>text</p>
<p>Copy</p>
<p>YAŞAYIŞ SAHƏSİNİN KİRAYƏ MÜQAVİLƏSİ</p>
<p>Kirayəyə verən: [...]</p>
<p>Kirayəçi: [...]</p>
<p>Mənzil: [ünvan, reyestr məlumatı, sahə]</p>
<p>Müddət: [...] - [...]</p>
<p>Aylıq kirayə haqqı: [...] AZN</p>
<p>Ödəniş günü: hər ayın [...] günü</p>
<p>Depozit: [...] AZN</p>
<p>Kommunal:</p>
<p>Elektrik/qaz/su/internet: [kirayəçi]</p>
<p>Bina idarəetmə haqqı: [...]</p>
<p>Kirayəçi:</p>
<p>- əmlakı təyinatı üzrə istifadə edir;</p>
<p>- yazılı razılıq olmadan subkirayəyə vermir;</p>
<p>- əmlaka vurduğu zərəri ödəyir.</p>
<p>Kirayəyə verən:</p>
<p>- mənzildən müqaviləyə uyğun istifadəni təmin edir;</p>
<p>- qanuni əsas olmadan istifadəyə mane olmur.</p>
<p>Xitam:</p>
<p>Tərəf müqavilədə nəzərdə tutulan hallarda digər tərəfə [...]</p>
<p>gün əvvəl yazılı bildiriş verir.</p>
<p>Təhvil:</p>
<p>Müqaviləyə inventar və fotoakt əlavə olunur.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='kiraye'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Mülki Məcəllə, xüsusilə əmlak kirayəsi/icarə və müqavilə azadlığı normaları.","Dövlət reyestri haqqında Qanunun 19-cu maddəsi.","ASAN — yaşayış sahəsinin kirayə müqaviləsi.","Dövlət Vergi Xidməti — icarə gəlirlərinin cari vergitutması."]','<p>İcra xülasəsi. Kirayə münasibətlərində ən çox edilən hüquqi səhv “müqavilə yazmağa ehtiyac yoxdur” yanaşmasıdır. Azərbaycan Mülki Məcəlləsi əmlak kirayəsi və icarə münasibətlərini ayrıca müqavilə institutları kimi tənzimləyir. Mülki Məcəllənin 700.1-ci maddəsində icarə müqaviləsi əmlak kirayəsi müqaviləsi kimi müəyyən edilir və icarəçinin əmlakdan istifadə etməsi müqabilində icarə haqqı ödəməsi nəzərdə tutulur.</p>',0,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_miras-ve-mulkiyyetin-oturulmesi','miras-ve-mulkiyyetin-oturulmesi','Miras və mülkiyyətin ötürülməsi','miras və mülkiyyətin ötürülməsi bu sahədə köhnə internet məqalələrinə etibar etmək xüsusilə təhlükəlidir. 26 dekabr 2023-cü ildə konstitusiya məhkəməsi mülki məcəllənin mirasın qəbuluna xüsusi müddət müəyyən edən 1246 və 1273-1-ci maddələrini konstitusiyaya uyğun hesab etməyərək qüvvədən düşmüş sayıb. buna görə “vərəsə altı ay ərzində mütləq mirası qəbul etməsə, hüququnu avtomatik itirir” cümləsi bu gün ümumi qayda kim','Bu sahədə köhnə internet məqalələrinə etibar etmək xüsusilə təhlükəlidir. 26 dekabr 2023-cü ildə Konstitusiya Məhkəməsi Mülki Məcəllənin mirasın qəbuluna xüsusi müddət müəyyən edən 1246 və 1273-1-ci maddələrini Konstitusiyaya uyğun hesab etməyərək qüvvədən düşmüş sayıb. Buna görə “vərəsə altı ay ərzində mütləq mirası qəbul etməsə, hüququnu avtomatik itirir” cümləsi bu gün ümumi qayda kim','<p>İcra xülasəsi. Bu sahədə köhnə internet məqalələrinə etibar etmək xüsusilə təhlükəlidir. 26 dekabr 2023-cü ildə Konstitusiya Məhkəməsi Mülki Məcəllənin mirasın qəbuluna xüsusi müddət müəyyən edən 1246 və 1273-1-ci maddələrini Konstitusiyaya uyğun hesab etməyərək qüvvədən düşmüş sayıb. Buna görə “vərəsə altı ay ərzində mütləq mirası qəbul etməsə, hüququnu avtomatik itirir” cümləsi bu gün ümumi qayda kimi düzgün deyil.</p>
<p>Miras iki əsas qaydada açılır: qanun üzrə və vəsiyyətnamə üzrə. Qanun üzrə vərəsəlikdə Mülki Məcəllə növbəli vərəsəlik sistemi müəyyən edir; birinci növbədə, ümumi qayda etibarilə, ölənin uşaqları, həyat yoldaşı və valideynləri çıxış edir. Vəsiyyətnamə isə miras qoyanın ölümündən sonra əmlakın kimə keçəcəyini əvvəlcədən müəyyən etməsinə imkan verir; bununla belə məcburi pay institutunun ayrıca nəzərə alınması tələb oluna bilər.</p>
<p>Konstitusiya Məhkəməsinin 2024 və 2025-ci il qərarları 2023-cü il dəyişən hüquqi vəziyyəti daha da dəqiqləşdirib. 30 iyul 2024-cü il qərarında 1246 və 1273-1-ci maddələrin qüvvədən düşməsi təsdiqlənib; 19 iyun 2025-ci il hüquqi mövqeyində isə vərəsənin mirasdan imtinasının ayrıca rejimi vurğulanıb. Mülki Məcəllənin 1256-cı maddəsi üzrə vərəsə mirasa çağırıldığını bildiyi və ya bilməli olduğu gündən etibarən üç ay ərzində imtina edə bilər; müəyyən hallarda məhkəmə müddəti maksimum iki ay uzada bilər.</p>
<p>Burada kritik fərq var:</p>
<p>“Mirası qəbul etmək üçün altı aylıq son tarix” ilə “vərəsəlik şəhadətnaməsinin verilməsinin notariat müddəti” eyni şey deyil.</p>
<p>Notariat hərəkətləri qaydalarında vərəsəlik hüququ haqqında şəhadətnamənin, ümumi qayda olaraq, miras açıldıqdan altı ay sonra verilməsi mexanizmi qalır; notarius başqa vərəsələrin olmadığına kifayət qədər əmin olduqda daha əvvəl verilməsi də mümkün ola bilər. Bu prosedur müddətini 2023-cü ildə qüvvədən düşmüş “qəbul etmə müddəti” ilə qarışdırmaq olmaz.</p>
<p>ASAN-ın vərəsəlik xidməti ölüm haqqında şəhadətnamə, miras qoyanın son yaşayış yeri barədə məlumat, qohumluğu təsdiq edən sənədlər və ya məhkəmə qərarı, miras əmlakına dair mülkiyyət sənədi, daşınmaz əmlak olduqda hüquqi status/yüklülük məlumatları kimi sənədləri tələb edir.</p>
<p>Sənəd	Məqsəd</p>
<p>Ölüm haqqında şəhadətnamə	Mirasın açılmasını təsdiq edir</p>
<p>Vərəsənin şəxsiyyət sənədi	Şəxsin identifikasiyası</p>
<p>Qohumluğu təsdiq edən sənədlər	Qanun üzrə vərəsəlik</p>
<p>Vəsiyyətnamə	Vəsiyyət üzrə vərəsəlik</p>
<p>Çıxarış	Miras qoyanın əmlak hüququ</p>
<p>Nikah/doğum sənədləri	Vərəsəlik əlaqəsinin sübutu</p>
<p>Məhkəmə qərarı	Qohumluq və ya hüquq mübahisəsi olduqda</p>
<p>Yüklülük məlumatı	Əmlakın ipoteka/həbs vəziyyəti</p>
<p>Vərəsə təkcə aktivləri deyil, qanunun universal hüquq varisliyi prinsipləri çərçivəsində mirasla əlaqəli öhdəliklərin hüquqi nəticələrini də nəzərə almalıdır. Konstitusiya Məhkəməsinin 19 iyun 2025-ci il qərarı kreditorların ölən borclunun vərəsələrinə qarşı tələblərinin mümkünlüyünü və borclunun ölümünün öz-özlüyündə iddia müddətini dayandırmamasını ayrıca vurğulayır.</p>
<p>Bu səbəbdən miras alınan mənzildə yalnız “çıxarış var” yoxlaması kifayət etmir. İpoteka, həbs, üçüncü şəxsin istifadə hüququ, kommunal və müqavilə borcları, bir neçə vərəsənin payları və ər-arvadın ümumi əmlak rejimi ayrıca təhlil olunmalıdır.</p>
<p>Notariat rüsumu. ASAN-ın cari səhifəsində qanunla müəyyən edilmiş növbə üzrə vərəsələr üçün vərəsəlik şəhadətnaməsinə görə 25 manat, digər fiziki və hüquqi şəxslər üçün 50 manat dövlət rüsumu göstərilir.</p>
<p>Proses</p>
<p>Bəli</p>
<p>Xeyr</p>
<p>Şəxsin ölümü - mirasın açılması</p>
<p>Notariusa müraciət</p>
<p>Vərəsələrin və vəsiyyətnamənin müəyyən edilməsi</p>
<p>Miras əmlakının və borcların yoxlanılması</p>
<p>Vərəsə imtina edir?</p>
<p>Qanuni müddətdə notarial imtina</p>
<p>Vərəsəlik işi davam edir</p>
<p>Vərəsəlik hüququ haqqında şəhadətnamə</p>
<p>Daşınmaz əmlak hüququnun reyestr qeydiyyatı</p>
<p>Elektron çıxarış</p>
<p>Show code</p>
<p>Risklər</p>
<p>Risk	Tövsiyə</p>
<p>Köhnə “6 aylıq qəbul” qaydasına kor-koranə əsaslanmaq	2023 Konstitusiya Məhkəməsi qərarı nəzərə alınsın</p>
<p>Digər vərəsəni gizlətmək	Ailə əlaqələri və arxiv sənədləri tam yoxlanılsın</p>
<p>Borclu əmlakı qəbul etmək	İpoteka, icra və kreditor tələbləri araşdırılsın</p>
<p>Şifahi “mirasdan imtina”	Qanuni notarial prosedur tətbiq edilsin</p>
<p>Miras şəhadətnaməsi alıb reyestri dəyişməmək	Daşınmaz hüquq ayrıca dövlət qeydiyyatına alınsın</p>
<p>Nümunə — notariusa miras ərizəsi</p>
<p>text</p>
<p>Copy</p>
<p>NOTARİUSA ƏRİZƏ</p>
<p>Mən, [F.A.A., FİN], [ölənin F.A.A.] adlı şəxsin</p>
<p>[tarix]-də vəfat etməsi ilə açılmış miras üzrə vərəsəyəm.</p>
<p>Qohumluq əlaqəm: [...]</p>
<p>Miras əmlakı: [ünvan / reyestr məlumatı]</p>
<p>Xahiş edirəm:</p>
<p>1. vərəsəlik işi açılsın / mövcud işə daxil olum;</p>
<p>2. digər vərəsələr və vəsiyyətnamə barədə qanunla mümkün</p>
<p>məlumatlar yoxlanılsın;</p>
<p>3. təqdim etdiyim sənədlər əsasında vərəsəlik hüququ haqqında</p>
<p>şəhadətnamənin verilməsi məsələsinə baxılsın.</p>
<p>Əlavələr:</p>
<p>[ölüm şəhadətnaməsi]</p>
<p>[qohumluq sənədləri]</p>
<p>[çıxarış]</p>
<p>[digər sənədlər]</p>
<p>Tarix / imza</p>
<p>FAQ. Altı ay keçibsə miras hüququ mütləq itirilir? Xeyr; 1246 və 1273-1-ci maddələr 26 dekabr 2023-cü il Konstitusiya Məhkəməsi qərarı ilə qüvvədən düşmüş sayılıb.</p>
<p>Vərəsəlik şəhadətnaməsi avtomatik çıxarışdır? Xeyr; daşınmaz əmlak üzrə vərəsəlik hüququ sonradan dövlət reyestrində rəsmiləşdirilməlidir.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='vereselik'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Mülki Məcəllənin vərəsəlik normaları.","Konstitusiya Məhkəməsinin 26 dekabr 2023-cü il qərarı.","30 iyul 2024 və 19 iyun 2025 qərarları.","ASAN vərəsəlik xidməti.","Maliyyələşmə, ipoteka, notariat və vergi"]','<p>İcra xülasəsi. Bu sahədə köhnə internet məqalələrinə etibar etmək xüsusilə təhlükəlidir. 26 dekabr 2023-cü ildə Konstitusiya Məhkəməsi Mülki Məcəllənin mirasın qəbuluna xüsusi müddət müəyyən edən 1246 və 1273-1-ci maddələrini Konstitusiyaya uyğun hesab etməyərək qüvvədən düşmüş sayıb. Buna görə “vərəsə altı ay ərzində mütləq mirası qəbul etməsə, hüququnu avtomatik itirir” cümləsi bu gün ümumi qayda kimi düzgün deyil.</p>',0,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_ipoteka-ve-kreditlesme','ipoteka-ve-kreditlesme','İpoteka və kreditləşmə','ipoteka və kreditləşmə ipoteka mənzilin banka “keçməsi” deyil; borc öhdəliyinin daşınmaz əmlakla təmin edilməsidir. borcalan əmlakın mülkiyyətçisi olaraq qalır, lakin ipoteka hüququ dövlət reyestrində yüklülük kimi qeydiyyata alınır. öhdəlik icra edilməzsə, qanunla müəyyən edilən prosedurla ipoteka predmetinə tutma yönəldilə bilər. əsas normativ akt “ipoteka haqqında” qanundur.','İpoteka mənzilin banka “keçməsi” deyil; borc öhdəliyinin daşınmaz əmlakla təmin edilməsidir. Borcalan əmlakın mülkiyyətçisi olaraq qalır, lakin ipoteka hüququ dövlət reyestrində yüklülük kimi qeydiyyata alınır. Öhdəlik icra edilməzsə, qanunla müəyyən edilən prosedurla ipoteka predmetinə tutma yönəldilə bilər. Əsas normativ akt “İpoteka haqqında” Qanundur.','<p>İcra xülasəsi. İpoteka mənzilin banka “keçməsi” deyil; borc öhdəliyinin daşınmaz əmlakla təmin edilməsidir. Borcalan əmlakın mülkiyyətçisi olaraq qalır, lakin ipoteka hüququ dövlət reyestrində yüklülük kimi qeydiyyata alınır. Öhdəlik icra edilməzsə, qanunla müəyyən edilən prosedurla ipoteka predmetinə tutma yönəldilə bilər. Əsas normativ akt “İpoteka haqqında” Qanundur.</p>
<p>İpoteka hüququnun effektivliyi onun qeydiyyatı ilə bağlıdır. Əmlakın reyestr məlumatında ipoteka yüklülüyü görünür və sonrakı alıcı üçün də hüquqi risk yaradır. Buna görə “satıcı bank kreditini özü bağlayacaq” vədi bankın və reyestrin iştirakı olmadan təhlükəsiz mexanizm deyil.</p>
<p>İpoteka üzrə borc icra edilmədikdə “İpoteka haqqında” Qanunun 33-cü və sonrakı maddələri tutmanın yönəldilməsi mexanizmini tənzimləyir. Qanunda məhkəmədənkənar realizasiya yalnız xüsusi hüquqi əsaslar olduqda mümkündür; məsələn, bunun müqavilədə nəzərdə tutulması və qanunun tələb etdiyi digər formal şərtlərin olması. Əks halda məhkəmə yolu əhəmiyyət kəsb edir.</p>
<p>Azərbaycan İpoteka və Kredit Zəmanət Fondunun dövlət ipoteka proqramını adi kommersiya bank kreditindən fərqləndirmək vacibdir. Fondun cari qaydalarına əsasən adi ipoteka üzrə maksimum kredit 150 000 manat, güzəştli ipoteka üzrə 100 000 manatdır; maksimal müddət müvafiq olaraq 25 və 30 il, minimal ilkin ödəniş isə 15% və 10%-dir. Fondun göstərdiyi maksimal illik faizlər zəmanətsiz adi ipotekada 8%, güzəştlidə 4%, zəmanətli kreditlərdə isə müvafiq olaraq 7% və 3,7%-dir. Bu rəqəmlər Fond xətti üçündür, bazardakı bütün bank kreditlərinə şamil edilən universal qanuni faiz həddi deyil.</p>
<p>Fond ipotekası	Adi	Güzəştli</p>
<p>Maksimum kredit	150 000 AZN	100 000 AZN</p>
<p>Maksimum müddət	25 il	30 il</p>
<p>Minimum ilkin ödəniş	15%	10%</p>
<p>Maks. illik faiz, zəmanətsiz	8%	4%</p>
<p>Maks. illik faiz, zəmanətli	7%	3,7%</p>
<p>Fondun cari meyarları mənzilin dövlət qeydiyyatında olmasını, müstəqil qiymətləndirməni, ipotekanın qeydiyyatını, əmlak və həyat sığortasını, kredit qabiliyyətinin qiymətləndirilməsini və digər maliyyə meyarlarını nəzərdə tutur. Aylıq ödənişlə gəlir nisbətinə və ailənin yaşayış minimumuna dair ayrıca meyarlar da tətbiq edilir.</p>
<p>Kommersiya bankları isə kredit risk siyasətlərinə görə daha sərt gəlir, iş stajı, yaş, ilkin ödəniş, kredit tarixçəsi və əmlakın likvidliyi şərtləri tətbiq edə bilərlər. Bunları qanunun universal tələbi kimi deyil, konkret bankın kredit siyasəti kimi təqdim etmək lazımdır.</p>
<p>İpotekalı mənzil alarkən təhlükəsiz model</p>
<p>Satıcı mənzilin ipotekalı olduğunu bildirir</p>
<p>Reyestr və bank məlumatı yoxlanır</p>
<p>Qalıq borc müəyyən edilir</p>
<p>Bankla razılaşdırılmış satış sxemi</p>
<p>Borcun bağlanması / bank razılığı</p>
<p>İpotekanın xitamı və ya yeni borcalana strukturlaşdırma</p>
<p>Notarial alqı-satqı</p>
<p>Reyestr qeydiyyatı</p>
<p>Show code</p>
<p>İpoteka saxlayanın razılığı məsələsində Konstitusiya Məhkəməsi 1 iyul 2022-ci il qərarında mühüm mövqe formalaşdırıb: ipoteka saxlayanın predmet üzərində sərəncama razılıq verməməsi hüquqi baxımdan əsaslandırılmalı, ipoteka qoyan isə belə imtinanı məhkəmədə mübahisələndirə bilməlidir.</p>
<p>İpoteka predmetinin məcburi satışında ilkin satış qiyməti də mühüm mübahisə mənbəyidir. Ali Məhkəmə 6 avqust 2020-ci ildə bu məsələ üzrə məhkəmə təcrübəsinin vahidliyini təmin edən qərar qəbul edib və qiymətin müəyyənləşdirilməsi yanaşmasını dəqiqləşdirib.</p>
<p>Notariat xərci. ASAN xidmətin ipoteka müqaviləsinin təsdiqi üzrə tarifində müqavilə məbləğindən asılı olaraq 2 000 manatadək ipotekada 6 manat dövlət rüsumu + 0,90 manat xidmət haqqı; 2 000–5 000 manat intervalında 25 + 3,75 manat; 5 000 manatdan yuxarı olduqda 40 + 6 manat göstərilir. Qiymətləndirmə, bank komissiyası və sığorta bu dövlət/notariat tarifinə daxil deyil.</p>
<p>Borcalan check-listi: effektiv illik faiz dərəcəsi, aylıq ödəniş, gecikmə faizləri, vaxtından əvvəl ödəmə, sığorta, qiymətləndirmə, notariat, qeydiyyat, zamin/borcalanların statusu, defolt müddəti və tutmanın yönəldilməsi şərtləri ayrıca oxunmalıdır.</p>
<p>Nümunə — ipoteka müqaviləsi üçün yoxlama əlavəsi</p>
<p>text</p>
<p>Copy</p>
<p>İPOTEKA ÜZRƏ ƏSAS KOMMERSİYA ŞƏRTLƏRİ</p>
<p>Əsas borc: [...] AZN</p>
<p>Müddət: [...]</p>
<p>Nominal faiz: [...] %</p>
<p>Effektiv faiz: [...] %</p>
<p>Aylıq ödəniş: [...]</p>
<p>İlkin ödəniş: [...]</p>
<p>İpoteka predmeti: [...]</p>
<p>Qiymətləndirilmiş dəyər: [...]</p>
<p>Sığorta: [...]</p>
<p>Gecikmə halında əlavə ödənişlər: [...]</p>
<p>Vaxtından əvvəl ödəniş şərti: [...]</p>
<p>Tutmanın yönəldilməsi əsasları: [...]</p>
<p>İpoteka qeydiyyatı: [...]</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: “İpoteka haqqında” Qanun.","Azərbaycan İpoteka və Kredit Zəmanət Fondunun cari tələbləri.","Konstitusiya Məhkəməsinin 1 iyul 2022-ci il qərarı.","Ali Məhkəmənin 6 avqust 2020-ci il ipoteka qərarı."]','<p>İcra xülasəsi. İpoteka mənzilin banka “keçməsi” deyil; borc öhdəliyinin daşınmaz əmlakla təmin edilməsidir. Borcalan əmlakın mülkiyyətçisi olaraq qalır, lakin ipoteka hüququ dövlət reyestrində yüklülük kimi qeydiyyata alınır. Öhdəlik icra edilməzsə, qanunla müəyyən edilən prosedurla ipoteka predmetinə tutma yönəldilə bilər. Əsas normativ akt “İpoteka haqqında” Qanundur.</p>',0,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_notariat-elektron-xidmetler-ve-dovlet-qeydiyyati','notariat-elektron-xidmetler-ve-dovlet-qeydiyyati','Notariat, elektron xidmətlər və dövlət qeydiyyatı','notariat, elektron xidmətlər və dövlət qeydiyyatı azərbaycan daşınmaz əmlak sisteminin ən mühüm institusional üstünlüklərindən biri notariat ilə dövlət reyestri arasında elektron inteqrasiyadır. notarius əmlakın reyestr məlumatlarına real vaxt rejimində çıxış əldə edə, müqavilə təsdiqləndikdən sonra onu elektron qaydada qeydiyyat orqanına ötürə bilir. notarial müqavilənin elektron göndərilməsi dövlət qeydiyyatına müraciət kimi qəbul olu','Azərbaycan daşınmaz əmlak sisteminin ən mühüm institusional üstünlüklərindən biri notariat ilə dövlət reyestri arasında elektron inteqrasiyadır. Notarius əmlakın reyestr məlumatlarına real vaxt rejimində çıxış əldə edə, müqavilə təsdiqləndikdən sonra onu elektron qaydada qeydiyyat orqanına ötürə bilir. Notarial müqavilənin elektron göndərilməsi dövlət qeydiyyatına müraciət kimi qəbul olu','<p>İcra xülasəsi. Azərbaycan daşınmaz əmlak sisteminin ən mühüm institusional üstünlüklərindən biri notariat ilə dövlət reyestri arasında elektron inteqrasiyadır. Notarius əmlakın reyestr məlumatlarına real vaxt rejimində çıxış əldə edə, müqavilə təsdiqləndikdən sonra onu elektron qaydada qeydiyyat orqanına ötürə bilir. Notarial müqavilənin elektron göndərilməsi dövlət qeydiyyatına müraciət kimi qəbul olunur.</p>
<p>“Notariat haqqında” Qanun və Nazirlər Kabinetinin notariat hərəkətlərinə dair təlimatı notariusun tərəflərin şəxsiyyətini, hüquq qabiliyyətini, nümayəndənin səlahiyyətini və əqdin qanuniliyini yoxlamasına hüquqi əsas verir.</p>
<p>Daşınmaz əmlak üzrə tipik axın:</p>
<p>Bank/Depozit hesabı</p>
<p>Dövlət Reyestri</p>
<p>Notarius</p>
<p>Alıcı</p>
<p>Satıcı</p>
<p>Bank/Depozit hesabı</p>
<p>Dövlət Reyestri</p>
<p>Notarius</p>
<p>Alıcı</p>
<p>Satıcı</p>
<p>Mülkiyyət və şəxsiyyət məlumatları</p>
<p>Şəxsiyyət və ödəniş məlumatı</p>
<p>Reyestr/yüklülük sorğusu</p>
<p>Hüquq və yüklülük məlumatları</p>
<p>Ödəniş mexanizmi</p>
<p>Ödəniş təsdiqi</p>
<p>Müqavilənin notarial təsdiqi</p>
<p>Elektron müqavilə</p>
<p>Yeni hüququn qeydiyyatı</p>
<p>Elektron çıxarış</p>
<p>Show code</p>
<p>Dövlət reyestrində yalnız mülkiyyətçinin adı deyil, obyektin hüquqi və texniki göstəriciləri, hüquqlar və yüklülüklər üzrə məlumatlar saxlanılır.</p>
<p>Mənzilin ilkin dövlət qeydiyyatında ASAN şəxsiyyət sənədi, ərizə, hüquqmüəyyənedici əsas və dövlət rüsumu tələb edir. Məsələn, MTK mənzilində ümumi yığıncağın qərarı və pay haqqının tam ödənildiyini təsdiq edən maliyyə arayışı hüquqmüəyyənedici sənədlər sırasında ola bilər.</p>
<p>Xidmət	Dövlət rüsumu	Tipik xidmət müddəti/xidmət haqqı</p>
<p>Elektron çıxarış	50 AZN	10 iş günü — 36 AZN</p>
<p>Elektron çıxarış	50 AZN	7 iş günü — 54 AZN</p>
<p>Elektron çıxarış	50 AZN	3 iş günü — 72 AZN</p>
<p>Elektron çıxarış	50 AZN	1 iş günü — 108 AZN</p>
<p>Texniki pasport/plan	75 AZN	Ərazi, sahə və müddətə görə dəyişir</p>
<p>Bu rəqəmlər yaşayış obyektləri üçün cari ASAN tariflərindən götürülüb. Qeyri-yaşayış sahələri üçün xidmət haqqı fərqlidir və xeyli yüksək ola bilər.</p>
<p>Fərdi yaşayış evlərində 2013-cü il 1 yanvardan sonrakı tikililər üçün qeydiyyat sənədləri tikintinin hüquqi rejimindən asılıdır. Tikintiyə icazə tələb olunan fərdi evdə torpaq hüququnu təsdiq edən sənəd, tikintiyə icazə qərarı, layihənin memarlıq-planlaşdırma bölməsi və obyektin istismarına icazə tələb olunur. Məlumatlandırma icraatına aid tikilidə isə torpaq hüququ, layihə və tikintinin başa çatması barədə məlumatlandırmanı sübut edən sənəd əsas rol oynayır.</p>
<p>Ən vacib reyestr riskləri</p>
<p>Problem	Nəticə	Həll</p>
<p>Ünvan uyğunsuzluğu	Qeydiyyat gecikir	Ünvan məlumatı əvvəlcədən dəqiqləşdirilir</p>
<p>Sahə uyğunsuzluğu	Texniki inventar tələb olunur	Plan-ölçü aparılır</p>
<p>Əvvəlki hüquq qeydiyyatsızdır	Satış mümkün olmaya bilər	İlkin qeydiyyat tamamlanır</p>
<p>Həbs/qadağa	Sərəncam bloklanır	Hüquqi əsas aradan qaldırılır</p>
<p>Etibarnamə problemi	Notarius əqddən imtina edə bilər	Yeni/uyğun etibarnamə təqdim edilir</p>
<p>Nümunə — qeydiyyat ərizəsi</p>
<p>text</p>
<p>Copy</p>
<p>DAŞINMAZ ƏMLAK ÜZƏRİNDƏ HÜQUQUN DÖVLƏT</p>
<p>QEYDİYYATINA ALINMASI BARƏDƏ ƏRİZƏ</p>
<p>Ərizəçi: [F.A.A., FİN]</p>
<p>Əlaqə: [...]</p>
<p>Daşınmaz əmlak:</p>
<p>Ünvan: [...]</p>
<p>Növ: mənzil / fərdi ev / torpaq / qeyri-yaşayış</p>
<p>Sahə: [...]</p>
<p>Hüququn yaranma əsası:</p>
<p>[notarial alqı-satqı müqaviləsi / vərəsəlik şəhadətnaməsi /</p>
<p>məhkəmə qərarı / MTK sənədi / digər]</p>
<p>Xahiş edirəm, göstərilən daşınmaz əmlak üzərində</p>
<p>[mülkiyyət / icarə / ipoteka / digər] hüququ dövlət</p>
<p>reyestrində qeydiyyata alınsın.</p>
<p>Tarix / imza</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: “Daşınmaz əmlakın dövlət reyestri haqqında” Qanun.","Dövlət qeydiyyatı sənədlərinin qəbulu və yoxlanılması qaydaları.","Notariat haqqında Qanun və notariat təlimatı.","ASAN dövlət qeydiyyatı xidmətləri."]','<p>İcra xülasəsi. Azərbaycan daşınmaz əmlak sisteminin ən mühüm institusional üstünlüklərindən biri notariat ilə dövlət reyestri arasında elektron inteqrasiyadır. Notarius əmlakın reyestr məlumatlarına real vaxt rejimində çıxış əldə edə, müqavilə təsdiqləndikdən sonra onu elektron qaydada qeydiyyat orqanına ötürə bilir. Notarial müqavilənin elektron göndərilməsi dövlət qeydiyyatına müraciət kimi qəbul olunur.</p>',0,2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_vergiler-dovlet-rusumlari-ve-emeliyyat-xercleri','vergiler-dovlet-rusumlari-ve-emeliyyat-xercleri','Vergilər, dövlət rüsumları və əməliyyat xərcləri','vergilər, dövlət rüsumları və əməliyyat xərcləri daşınmaz əmlak əməliyyatlarında “vergi”, “dövlət rüsumu”, “xidmət haqqı”, “bank komissiyası” və “sığorta haqqı” bir-birindən fərqli hüquqi ödənişlərdir. portalda bunları vahid “transaction cost” kimi deyil, ayrıca göstərmək istifadəçini ciddi yanlışlıqdan qoruyur. cari hüquqi baza vergi məcəlləsi və “dövlət rüsumu haqqında” qanundur.','Daşınmaz əmlak əməliyyatlarında “vergi”, “dövlət rüsumu”, “xidmət haqqı”, “bank komissiyası” və “sığorta haqqı” bir-birindən fərqli hüquqi ödənişlərdir. Portalda bunları vahid “transaction cost” kimi deyil, ayrıca göstərmək istifadəçini ciddi yanlışlıqdan qoruyur. Cari hüquqi baza Vergi Məcəlləsi və “Dövlət rüsumu haqqında” Qanundur.','<p>İcra xülasəsi. Daşınmaz əmlak əməliyyatlarında “vergi”, “dövlət rüsumu”, “xidmət haqqı”, “bank komissiyası” və “sığorta haqqı” bir-birindən fərqli hüquqi ödənişlərdir. Portalda bunları vahid “transaction cost” kimi deyil, ayrıca göstərmək istifadəçini ciddi yanlışlıqdan qoruyur. Cari hüquqi baza Vergi Məcəlləsi və “Dövlət rüsumu haqqında” Qanundur.</p>
<p>Yaşayış sahəsinin satışı</p>
<p>Fiziki şəxsin yaşayış sahəsinin satışı üzrə əsas rejim klassik “mənfəətdən gəlir vergisi” deyil, Vergi Məcəlləsinin 218-1 və 220.8-ci maddələrindəki daşınmaz əmlakın təqdim edilməsinə görə sadələşdirilmiş vergidir. Vergi praktikada notariat əməliyyatı ilə əlaqəli hesablanır.</p>
<p>Əgər fiziki şəxs həmin yaşayış sahəsində azı 3 təqvim ili yaşayış yeri üzrə qeydiyyatda olubsa, qanundakı azadolma tətbiq edilə bilər. Bu şərt ödənmirsə, yaşayış sahəsinin 30 m² hissəsi vergidən azad olunur, qalan hissə üçün baza dərəcəsi hər m²-ə 15 AZN olmaqla ərazi əmsalı tətbiq edilir.</p>
<p>Sadə formula:</p>
<p>Vergi tutulan sahə = ümumi sahə – 30 m²</p>
<p>Sadələşdirilmiş vergi = vergi tutulan sahə × 15 AZN × ərazi əmsalı</p>
<p>Üçillik qeydiyyat azadolması tətbiq edilirsə bu formula ümumiyyətlə tətbiq olunmaya bilər. Konkret azadolmanın tətbiqi notariatda və Vergi Məcəlləsinin cari redaksiyası əsasında yoxlanmalıdır.</p>
<p>Fiziki şəxsin illik əmlak vergisi</p>
<p>Fiziki şəxslərin mülkiyyətindəki yaşayış binalarında ilk 30 m² çıxıldıqdan sonra sahəyə yerindən asılı tarif tətbiq edilir. Dövlət Vergi Xidmətinin bələdiyyə vergiləri metodikasında Bakı üçün baza dərəcəsi 0,4 AZN/m² olmaqla zonadan asılı əlavə əmsal, Gəncə, Sumqayıt və Abşeron üçün 0,3 AZN/m², digər şəhər və rayon mərkəzləri üçün 0,2 AZN/m², qəsəbə və kəndlər üçün 0,1 AZN/m² prinsipi tətbiq olunur. Bakı üzrə əlavə əmsallar Nazirlər Kabinetinin qərarı ilə 0,7–1,5 intervalında müəyyən edilir.</p>
<p>Məsələn, Dövlət Vergi Xidmətinin öz izahında Sumqayıtda 120 m² mənzil üçün:</p>
<p>(120 – 30) × 0,3 = 27 AZN</p>
<p>illik əmlak vergisi nümunəsi göstərilir.</p>
<p>Kirayə gəliri</p>
<p>2026-cı ilin avqust ayındakı rəsmi Dövlət Vergi Xidməti izahında Vergi Məcəlləsinin 124.1-ci maddəsinə əsasən daşınmaz əmlakın icarəsindən rezident fiziki şəxsə ödənilən gəlir üzrə 14% ödəmə mənbəyində vergi göstərilir.</p>
<p>Cari əsas dövlət/notariat tarifləri</p>
<p>Əməliyyat	Dövlət rüsumu	Xidmət haqqı	Mənbə</p>
<p>Satış — yaxın qohumlar	25 AZN	3,75 AZN	ASAN</p>
<p>Satış — Bakı, digər şəxslər	280 AZN	42 AZN	ASAN</p>
<p>Satış — Gəncə/Sumqayıt/Abşeron	196 AZN	29,40 AZN	ASAN</p>
<p>Satış — digər rayon/şəhər	140 AZN	21 AZN	ASAN</p>
<p>Yaşayış kirayə müqaviləsi	35 AZN	5,25 AZN	ASAN</p>
<p>Elektron çıxarış	50 AZN	36–108 AZN sürətə görə	ASAN</p>
<p>Texniki pasport/plan	75 AZN	Dəyişən	ASAN</p>
<p>Vərəsəlik — qanun üzrə müvafiq vərəsələr	25 AZN	xidmətə görə ayrıca	ASAN</p>
<p>Vərəsəlik — digər şəxslər	50 AZN	xidmətə görə ayrıca	ASAN</p>
<p>İpoteka, qiymətləndirmə, bank komissiyası, icbari daşınmaz əmlak sığortası, həyat sığortası və sürətləndirilmiş texniki inventarlaşdırma ayrıca xərc yarada bilər. Fond ipotekasında əmlak və həyat sığortası kredit mexanizminin tərkib hissəsidir.</p>
<p>Torpaq vergisi torpağın kateqoriyası, yerləşməsi və istifadəsi üzrə ayrıca qaydalarla hesablanır. Fiziki şəxslərin xüsusi mülkiyyətində olan torpağa görə vergini mülkiyyətçi ödəyir; dövlət/bələdiyyə torpağı icarədə və ya istifadədə olduqda isə müəyyən hallarda istifadəçi vergi ödəyicisi olur.</p>
<p>Vergi check-listi</p>
<p>☐ Satıcı fiziki şəxsdir, yoxsa sahibkar/hüquqi şəxs?</p>
<p>☐ Əmlak yaşayış, qeyri-yaşayış, yoxsa torpaqdır?</p>
<p>☐ 3 təqvim ili qeydiyyat azadolması varmı?</p>
<p>☐ 30 m² güzəşti tətbiq olunurmu?</p>
<p>☐ Ərazi əmsalı hansıdır?</p>
<p>☐ Kirayədə ödəyici vergi agentidirmi?</p>
<p>☐ Dövlət rüsumu ilə xidmət haqqı ayrıca hesablanıbmı?</p>
<p>☐ Bank/sığorta/qiymətləndirmə ayrıca büdcələnibmi?</p>
<p>Nümunə — əməliyyat büdcəsi şablonu</p>
<p>text</p>
<p>Copy</p>
<p>ƏMLAK ƏMƏLİYYATI XƏRCLƏR CƏDVƏLİ</p>
<p>Satış qiyməti:                 ______ AZN</p>
<p>Satış üzrə vergi:              ______ AZN</p>
<p>Notariat dövlət rüsumu:        ______ AZN</p>
<p>Notariat xidmət haqqı:         ______ AZN</p>
<p>Reyestr dövlət rüsumu:         ______ AZN</p>
<p>Reyestr xidmət haqqı:          ______ AZN</p>
<p>Texniki sənəd:                 ______ AZN</p>
<p>Qiymətləndirmə:                ______ AZN</p>
<p>Sığorta:                       ______ AZN</p>
<p>Bank/depozit komissiyası:      ______ AZN</p>
<p>YEKUN TRANSAKSİYA XƏRCİ:       ______ AZN</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='vergi-rusum'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Vergi Məcəlləsinin cari redaksiyası.","Dövlət Vergi Xidmətinin daşınmaz əmlak satışına dair izahları.","Bələdiyyə vergiləri metodikası.","“Dövlət rüsumu haqqında” Qanun.","Tikinti, yeni tikililər və torpaq hüququ"]','<p>İcra xülasəsi. Daşınmaz əmlak əməliyyatlarında “vergi”, “dövlət rüsumu”, “xidmət haqqı”, “bank komissiyası” və “sığorta haqqı” bir-birindən fərqli hüquqi ödənişlərdir. Portalda bunları vahid “transaction cost” kimi deyil, ayrıca göstərmək istifadəçini ciddi yanlışlıqdan qoruyur. Cari hüquqi baza Vergi Məcəlləsi və “Dövlət rüsumu haqqında” Qanundur.</p>',0,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_tikinti-ve-yeni-tikililer','tikinti-ve-yeni-tikililer','Tikinti və yeni tikililər','tikinti və yeni tikililər yeni tikilidə əsas sual “bina tikilibmi?” deyil, “tikintinin hüquqi zənciri tamamlanıbmı?” olmalıdır: torpaq hüququ → tikinti rejimi → layihə → tikintiyə icazə və ya məlumatlandırma → tikintinin faktiki tamamlanması → istismara icazə → obyektin və mənzilin reyestr qeydiyyatı. bu zəncirin bir halqasının olmaması mənzilin çıxarışının verilməsinə, ipotekaya yararlılığına və gələcək satışına','Yeni tikilidə əsas sual “bina tikilibmi?” deyil, “tikintinin hüquqi zənciri tamamlanıbmı?” olmalıdır: torpaq hüququ → tikinti rejimi → layihə → tikintiyə icazə və ya məlumatlandırma → tikintinin faktiki tamamlanması → istismara icazə → obyektin və mənzilin reyestr qeydiyyatı. Bu zəncirin bir halqasının olmaması mənzilin çıxarışının verilməsinə, ipotekaya yararlılığına və gələcək satışına','<p>İcra xülasəsi. Yeni tikilidə əsas sual “bina tikilibmi?” deyil, “tikintinin hüquqi zənciri tamamlanıbmı?” olmalıdır: torpaq hüququ → tikinti rejimi → layihə → tikintiyə icazə və ya məlumatlandırma → tikintinin faktiki tamamlanması → istismara icazə → obyektin və mənzilin reyestr qeydiyyatı. Bu zəncirin bir halqasının olmaması mənzilin çıxarışının verilməsinə, ipotekaya yararlılığına və gələcək satışına birbaşa təsir edə bilər.</p>
<p>Şəhərsalma və Tikinti Məcəlləsinin 75-ci maddəsi tikintiyə icazənin ümumi rejimini müəyyən edir. Müəyyən tikililər isə Məcəllənin məlumatlandırma icraatı qaydalarına tabedir. Dövlət Şəhərsalma və Arxitektura Komitəsinin rəsmi FAQ-sına görə sifarişçi tikintiyə başlamazdan əvvəl ərazinin tikinti parametrləri — sıxlıq, hündürlük və digər planlaşdırma tələbləri — barədə sorğu verə və bu sorğuya 10 gün ərzində əsaslandırılmış cavab ala bilər.</p>
<p>Yeni tikili alıcısı aşağıdakı sənədləri developer-dən tələb etməlidir:</p>
<p>Sənəd	Nəyi sübut edir?</p>
<p>Torpaq üzərində hüquq sənədi	Developer/sifarişçinin torpaqla hüquqi əlaqəsi</p>
<p>Tikintiyə icazə	Tikinti fəaliyyətinin qanuni başlanğıcı</p>
<p>Təsdiq edilmiş layihə məlumatı	Mərtəbə, təyinat və plan</p>
<p>Tikintilərin Dövlət Reyestri məlumatı	Layihənin dövlət sistemində izi</p>
<p>İstismara icazə	Binanın hüquqi istismar mərhələsinə keçməsi</p>
<p>MTK/developer sənədi	Konkret mənzilin alıcıya aid edilməsi</p>
<p>Payın tam ödənilməsi sənədi	MTK modelində maliyyə öhdəliyinin tamamlanması</p>
<p>Mənzil üzrə çıxarış	Ən güclü fərdi mülkiyyət sübutu</p>
<p>2013-cü il 1 yanvardan sonra tikilmiş və tikintiyə icazə tələb edilən obyektlərdə ilkin qeydiyyat üçün torpaq hüququ, tikintiyə icazə, layihənin memarlıq-planlaşdırma bölməsi və istismara icazə kimi sənədlər tələb olunur.</p>
<p>Burada yeni tikili alıcısı üçün 2026-cı ilin ən əhəmiyyətli hüquqi mövqelərindən biri Konstitusiya Məhkəməsinin 12 may 2026-cı il qərarıdır. Məhkəmə ilkin müqavilənin gələcəkdə əsas müqavilə bağlamaq öhdəliyi yaratdığını, lakin ilkin müqavilənin özünün əmlak hüququ yaratmadığını və mövcud/gələcək əşyanı avtomatik yükləmədiyini vurğulayıb. Başqa sözlə, “mən developer-lə ilkin müqavilə imzalamışam, deməli mənzil artıq hüquqi baxımdan mənimdir” yanaşması düzgün deyil.</p>
<p>Bu xüsusilə tikinti mərhələsində olan layihələr üçün kritikdir. Alıcı yalnız müqaviləni deyil, konkret mənzilin başqa şəxsə satılması riskinin necə məhdudlaşdırıldığını, ödənişin hansı hüquqi təminatla qorunduğunu və gələcək əsas müqavilənin bağlanması şərtlərini də yoxlamalıdır. Konstitusiya Məhkəməsi ilkin müqavilədə gələcək müqavilənin predmetinin və əsas şərtlərinin müəyyən edilə bilməsini tələb edən Mülki Məcəllənin 402.3-cü maddəsinə də xüsusi diqqət yetirir.</p>
<p>Developer zəmanəti. “Bütün yeni tikililərə avtomatik 5 il developer zəmanəti verilir” kimi universal ifadə bu araşdırmada yoxlanılmış cari rəsmi mənbələr əsasında ümumi qayda kimi təqdim edilməməlidir. Keyfiyyət, qüsur, podrat, satış və istehlakçı hüquqları üzrə qanuni müdafiə vasitələri mövcuddur, lakin konkret zəmanət müddəti müqavilənin növündən və münasibətin hüquqi kvalifikasiyasından asılı ola bilər. Buna görə alıcı müqaviləyə ayrıca:</p>
<p>konstruktiv qüsur;</p>
<p>hidroizolyasiya;</p>
<p>mühəndis-kommunikasiya sistemləri;</p>
<p>ümumi sahələrin tamamlanması;</p>
<p>qüsurun aradan qaldırılması müddəti;</p>
<p>developer-in məsuliyyət müddəti</p>
<p>barədə aydın zəmanət şərtləri daxil etdirməlidir. Müqavilə azadlığı belə əlavə təminatların müəyyən edilməsinə imkan verir.</p>
<p>İcazə</p>
<p>Məlumatlandırma</p>
<p>Torpaq hüququ</p>
<p>Layihə və şəhərsalma uyğunluğu</p>
<p>Tikinti rejimi</p>
<p>Tikintiyə icazə</p>
<p>Məlumatlandırma icraatı</p>
<p>Tikinti</p>
<p>İstismara icazə / tələb olunan tamamlanma proseduru</p>
<p>Bina üzrə hüquqi qeydiyyat</p>
<p>Mənzil üzrə fərdi hüquqmüəyyənedici sənəd</p>
<p>Elektron çıxarış</p>
<p>Show code</p>
<p>Yeni tikili risk cədvəli</p>
<p>Risk	Nəticə	Tövsiyə</p>
<p>Torpaq başqa şəxsin adındadır	Layihə hüquqi riskli ola bilər	Torpaq sənədini yoxla</p>
<p>Tikintiyə icazə yoxdur	Qeydiyyat problemi	Rəsmi icazəni yoxla</p>
<p>İstismara icazə yoxdur	Çıxarış gecikə bilər	Satışdan əvvəl statusu dəqiqləşdir</p>
<p>Yalnız ilkin müqavilə var	Mülkiyyət yaranmayıb	Hüquqi təminat mexanizmi tələb et</p>
<p>Mənzil nömrəsi/planda uyğunsuzluq	İkiqat satış və qeydiyyat riski	Layihə planını müqaviləyə əlavə et</p>
<p>Müddət qeyri-müəyyəndir	Təhvil gecikir	Son tarix + məsuliyyət şərti</p>
<p>Nümunə — developer müqaviləsinə əlavə şərt</p>
<p>text</p>
<p>Copy</p>
<p>DEVELOPERİN TƏHVİL VƏ SƏNƏDLƏŞMƏ ÖHDƏLİYİ</p>
<p>Developer öhdəsinə götürür ki:</p>
<p>1. Mənzil № [...], mərtəbə [...], layihə sahəsi [...] m²-dir.</p>
<p>2. Mənzil müqaviləyə əlavə edilmiş plan üzrə təhvil veriləcək.</p>
<p>3. Tikintinin qanuni icazə sənədləri alıcıya tanış olmaq üçün təqdim edilir.</p>
<p>4. Binanın istismara verilməsi və fərdi qeydiyyat üçün developerdən</p>
<p>asılı sənədlər ən geci [...] tarixədək təmin ediləcək.</p>
<p>5. Mənzilin üçüncü şəxsə təkrar satılmasına/yüklənməsinə yol verilməyəcək.</p>
<p>6. Gecikməyə görə [...] qaydasında məsuliyyət tətbiq edilir.</p>
<p>7. Aşkar edilmiş qüsurlar barədə akt təqdim edildikdən sonra</p>
<p>[...] gün ərzində aradan qaldırılır.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='yeni-tikili'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Şəhərsalma və Tikinti Məcəlləsi.","Dövlət Şəhərsalma və Arxitektura Komitəsinin rəsmi məlumatları.","ASAN — fərdi yaşayış və qeyri-yaşayış obyektlərinin qeydiyyatı.","Konstitusiya Məhkəməsinin 12 may 2026-cı il ilkin müqavilə qərarı."]','<p>İcra xülasəsi. Yeni tikilidə əsas sual “bina tikilibmi?” deyil, “tikintinin hüquqi zənciri tamamlanıbmı?” olmalıdır: torpaq hüququ → tikinti rejimi → layihə → tikintiyə icazə və ya məlumatlandırma → tikintinin faktiki tamamlanması → istismara icazə → obyektin və mənzilin reyestr qeydiyyatı. Bu zəncirin bir halqasının olmaması mənzilin çıxarışının verilməsinə, ipotekaya yararlılığına və gələcək satışına birbaşa təsir edə bilər.</p>',0,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_torpaq-munasibetleri','torpaq-munasibetleri','Torpaq münasibətləri','torpaq münasibətləri torpağın “sənədi var” olması onun istənilən məqsədlə istifadə edilə bilməsi demək deyil. torpaq əməliyyatında üç ayrı sual cavablandırılmalıdır: kim mülkiyyətçidir, torpaq hansı kateqoriyaya/təyinata daxildir və alıcı hansı hüququ əldə edir? torpaq məcəlləsi torpaqları hüquqi rejimlərinə görə kateqoriyalara bölür və mülkiyyət, istifadə və icarə hüquqlarını fərqləndirir.','Torpağın “sənədi var” olması onun istənilən məqsədlə istifadə edilə bilməsi demək deyil. Torpaq əməliyyatında üç ayrı sual cavablandırılmalıdır: kim mülkiyyətçidir, torpaq hansı kateqoriyaya/təyinata daxildir və alıcı hansı hüququ əldə edir? Torpaq Məcəlləsi torpaqları hüquqi rejimlərinə görə kateqoriyalara bölür və mülkiyyət, istifadə və icarə hüquqlarını fərqləndirir.','<p>İcra xülasəsi. Torpağın “sənədi var” olması onun istənilən məqsədlə istifadə edilə bilməsi demək deyil. Torpaq əməliyyatında üç ayrı sual cavablandırılmalıdır: kim mülkiyyətçidir, torpaq hansı kateqoriyaya/təyinata daxildir və alıcı hansı hüququ əldə edir? Torpaq Məcəlləsi torpaqları hüquqi rejimlərinə görə kateqoriyalara bölür və mülkiyyət, istifadə və icarə hüquqlarını fərqləndirir.</p>
<p>Torpaq Məcəlləsinin sisteminə görə əsas kateqoriyalar kənd təsərrüfatı təyinatlı torpaqlar; yaşayış məntəqələrinin torpaqları; sənaye, nəqliyyat, rabitə, müdafiə və digər xüsusi təyinatlı torpaqlar; xüsusi qorunan ərazilər; meşə fondu; su fondu və ehtiyat fondu torpaqlarıdır. Torpağın kateqoriyası onun hüquqi istifadə imkanlarını müəyyən edən fundamental göstəricidir.</p>
<p>Məsələn, kənd təsərrüfatı təyinatlı torpağın alınması avtomatik olaraq həmin sahədə yaşayış kompleksi tikmək hüququ vermir. Tikinti üçün torpağın məqsədli təyinatı və şəhərsalma sənədləri uyğun olmalıdır. Torpaq Məcəlləsi tikinti ilə bağlı müraciətləri Şəhərsalma və Tikinti Məcəlləsinin rejimi ilə əlaqələndirir.</p>
<p>Torpaq hüququ üç əsas formada görülür:</p>
<p>Hüquq	Mahiyyət</p>
<p>Mülkiyyət	Sahiblik, istifadə və qanuni sərəncam səlahiyyəti</p>
<p>İstifadə	Mülkiyyət keçmədən qanuni istifadə hüququ</p>
<p>İcarə	Müqavilə əsasında müddətli/ödənişli istifadə</p>
<p>Əcnəbilər, vətəndaşlığı olmayan şəxslər, xarici hüquqi şəxslər və xarici dövlətlər üçün torpaq münasibətləri xüsusi məhdudiyyətlərə tabedir; Torpaq Məcəlləsinin cari rejimində onların torpaq əldə etməsi mülkiyyət deyil, əsasən icarə hüququ çərçivəsində nəzərdə tutulur. Buna görə xarici investor üçün “binanı almaq” və “binanın altındakı torpağa mülkiyyət əldə etmək” eyni hüquqi nəticə deyil.</p>
<p>11 aydan artıq torpaq icarəsi kimi daşınmaz əmlak üzrə uzunmüddətli icarə hüquqları da dövlət qeydiyyatı rejiminə düşür.</p>
<p>Dövlət və bələdiyyə torpaqlarının satılması və ya icarəyə verilməsi xüsusi prosedurlara, o cümlədən qanunda nəzərdə tutulan hallarda hərrac və müsabiqələrə tabedir. Əmlak Məsələləri Dövlət Xidmətinin rəsmi izahına görə torpaq hərracı və ya müsabiqəsinin qalibi ilə bələdiyyə torpağında müvafiq bələdiyyə, dövlət torpağında isə aidiyyəti dövlət qurumu arasında 20 gündən gec olmayaraq müqavilə bağlanır.</p>
<p>Torpaq alıcısının sənəd paketi</p>
<p>Yoxlanmalı	Praktik sual</p>
<p>Çıxarış	Torpaq kimin adınadır?</p>
<p>Plan-ölçü	Sərhədlər faktiki vəziyyətə uyğundur?</p>
<p>Kateqoriya	Kənd təsərrüfatı, yaşayış və s.?</p>
<p>Məqsədli təyinat	Alıcının planlaşdırdığı istifadəyə uyğundur?</p>
<p>Yüklülük	İpoteka, servitut, həbs varmı?</p>
<p>Giriş	Torpağın ümumi yola hüquqi çıxışı varmı?</p>
<p>Kommunikasiya	Elektrik, qaz, su hüquqi olaraq mümkündürmü?</p>
<p>Tikinti imkanı	Şəhərsalma parametrləri nədir?</p>
<p>Sərhəd mübahisəsi	Qonşu ilə üst-üstə düşmə varmı?</p>
<p>Torpaq alqı-satqısı da daşınmaz əmlaka sərəncam olduğuna görə notariat və dövlət qeydiyyatı rejiminə tabedir.</p>
<p>Ən təhlükəli praktik model “bələdiyyə kağızı var, deməli torpaq mənimdir” yanaşmasıdır. Hüquqmüəyyənedici ilkin sənəd ilə dövlət reyestrində qeydiyyata alınmış mülkiyyət hüququ bir-birindən fərqləndirilməlidir. Alıcı elektron çıxarışın mövcudluğunu və torpaq sərhədlərinin kadastr məlumatları ilə uyğunluğunu yoxlamalıdır.</p>
<p>Torpaq əməliyyatı axını</p>
<p>Ərazi seçilir</p>
<p>Çıxarış və kadastr planı</p>
<p>Kateqoriya və məqsədli təyinat</p>
<p>Sərhəd və giriş yolu yoxlanır</p>
<p>Yüklülüklər yoxlanır</p>
<p>Tikinti planlaşdırılırsa şəhərsalma uyğunluğu</p>
<p>Notarial müqavilə</p>
<p>Dövlət qeydiyyatı</p>
<p>Yeni elektron çıxarış</p>
<p>Show code</p>
<p>Nümunə — torpaq due-diligence sorğusu</p>
<p>text</p>
<p>Copy</p>
<p>TORPAQ SAHƏSİ ÜZRƏ YOXLAMA SİYAHISI</p>
<p>Ünvan / koordinatlar: [...]</p>
<p>Sahə: [...]</p>
<p>Reyestr nömrəsi: [...]</p>
<p>Mülkiyyətçi: [...]</p>
<p>Torpaq kateqoriyası: [...]</p>
<p>Məqsədli təyinat: [...]</p>
<p>Kadastr sərhədləri: [...]</p>
<p>Servitut: var / yoxdur</p>
<p>İpoteka/həbs: var / yoxdur</p>
<p>Ümumi yola çıxış: [...]</p>
<p>Tikinti parametrləri barədə rəsmi məlumat: [...]</p>
<p>Kommunikasiya imkanları: [...]</p>
<p>Qeyd:</p>
<p>Faktiki istifadə ilə reyestr/kadastr məlumatları arasında</p>
<p>uyğunsuzluq aşkar edilərsə alqı-satqı bağlanmadan əvvəl</p>
<p>aradan qaldırılması tələb olunur.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='torpaq'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Torpaq Məcəlləsi.","“Bələdiyyə torpaqlarının idarə edilməsi haqqında” Qanun.","Əmlak Məsələləri Dövlət Xidmətinin hərrac izahları.","Dövlət reyestri haqqında Qanun.","Məhkəmə praktikası və hüquqi mübahisələrin idarə edilməsi"]','<p>İcra xülasəsi. Torpağın “sənədi var” olması onun istənilən məqsədlə istifadə edilə bilməsi demək deyil. Torpaq əməliyyatında üç ayrı sual cavablandırılmalıdır: kim mülkiyyətçidir, torpaq hansı kateqoriyaya/təyinata daxildir və alıcı hansı hüququ əldə edir? Torpaq Məcəlləsi torpaqları hüquqi rejimlərinə görə kateqoriyalara bölür və mülkiyyət, istifadə və icarə hüquqlarını fərqləndirir.</p>',0,2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_mehkeme-praktikasindan-numuneler-ve-tez-tez-rastlanan-mubahiseler','mehkeme-praktikasindan-numuneler-ve-tez-tez-rastlanan-mubahiseler','Məhkəmə praktikasından nümunələr və tez-tez rastlanan mübahisələr','məhkəmə praktikasından nümunələr və tez-tez rastlanan mübahisələr daşınmaz əmlak üzrə məhkəmə praktikası göstərir ki, mübahisələrin əhəmiyyətli hissəsi “kimin haqlı olduğu”ndan əvvəl hansı hüquqi hüququn yaranıb-yaranmadığı, müqavilənin forması, dövlət qeydiyyatı, ipoteka proseduru, vərəsəliyin keçməsi və tərəfin sübut bazası ilə bağlıdır. daşınmaz əmlakda faktiki sahiblik həmişə qeydiyyatdan keçmiş mülkiyyət hüququ ilə eyni nəticəni vermir.','Daşınmaz əmlak üzrə məhkəmə praktikası göstərir ki, mübahisələrin əhəmiyyətli hissəsi “kimin haqlı olduğu”ndan əvvəl hansı hüquqi hüququn yaranıb-yaranmadığı, müqavilənin forması, dövlət qeydiyyatı, ipoteka proseduru, vərəsəliyin keçməsi və tərəfin sübut bazası ilə bağlıdır. Daşınmaz əmlakda faktiki sahiblik həmişə qeydiyyatdan keçmiş mülkiyyət hüququ ilə eyni nəticəni vermir.','<p>İcra xülasəsi. Daşınmaz əmlak üzrə məhkəmə praktikası göstərir ki, mübahisələrin əhəmiyyətli hissəsi “kimin haqlı olduğu”ndan əvvəl hansı hüquqi hüququn yaranıb-yaranmadığı, müqavilənin forması, dövlət qeydiyyatı, ipoteka proseduru, vərəsəliyin keçməsi və tərəfin sübut bazası ilə bağlıdır. Daşınmaz əmlakda faktiki sahiblik həmişə qeydiyyatdan keçmiş mülkiyyət hüququ ilə eyni nəticəni vermir.</p>
<p>İlkin müqavilə və gələcək mənzil — Konstitusiya Məhkəməsi, 12 may 2026. Bu qərar yeni tikili bazarı üçün xüsusilə əhəmiyyətlidir. Konstitusiya Məhkəməsi Mülki Məcəllənin 402-ci maddəsini şərh edərək ilkin müqavilənin gələcək əsas müqaviləni bağlamaq öhdəliyi yaratdığını, lakin birbaşa əmlak hüququ yaratmadığını qeyd edir. Hətta ilkin müqavilədə gələcək satış qiymətinin göstərilməsi həmin məbləği avtomatik əsas satış üzrə icra ödənişinə çevirmir. Tərəflər öhdəliyin icrasını ayrıca təminat mexanizmi ilə gücləndirə bilərlər.</p>
<p>Praktik nəticə: developerə böyük avans ödəyən alıcı üçün “müqavilə var” kifayət deyil. Müqavilənin növü, təminat, geri qaytarma, gecikmə və əsas satışın bağlanma mexanizmi ayrıca yazılmalıdır.</p>
<p>İpoteka saxlayanın satışa razılığı — Konstitusiya Məhkəməsi, 1 iyul 2022. Məhkəmə ipoteka saxlayanın əmlak üzərində sərəncama razılıq verməkdən imtinasının əsaslandırılması və belə imtinanın məhkəmə nəzarətinə açıq olması barədə hüquqi mövqe formalaşdırıb.</p>
<p>Praktik nəticə: ipotekalı mənzilin satışında bankın mövqeyi mühümdür, lakin bankın səlahiyyəti tamamilə nəzarətsiz mülahizə səlahiyyəti kimi başa düşülməməlidir.</p>
<p>İpoteka predmetinin ilkin satış qiyməti — Ali Məhkəmə, 6 avqust 2020. Ali Məhkəmə ipoteka predmetinin məcburi realizasiyasında ilkin satış qiymətinin müəyyən edilməsinə dair məhkəmə təcrübəsinin vahidləşdirilməsi məqsədilə hüquqi mövqe qəbul edib.</p>
<p>Praktik nəticə: borcalan üçün qiymətləndirmə yalnız kredit verilən gün vacib deyil; icra mərhələsində də bazar dəyəri və ilkin satış qiyməti ciddi iqtisadi nəticə yaradır.</p>
<p>Mirasın qəbul müddəti — Konstitusiya Məhkəməsi, 26 dekabr 2023. Mülki Məcəllənin 1246 və 1273-1-ci maddələri qüvvədən düşmüş hesab edildiyindən köhnə altı aylıq “qəbul etməsən hər şeyi itirirsən” yanaşması dəyişib.</p>
<p>Praktik nəticə: 2023-cü ildən sonrakı və qərarın tətbiq dairəsinə düşən miras mübahisələrində köhnə hüquqi mövqeyə əsaslanmaq ciddi səhv ola bilər.</p>
<p>Vərəsələr və kreditorlar — Konstitusiya Məhkəməsi, 19 iyun 2025. Qərarda universal hüquq varisliyi, mirasdan imtina və ölən şəxsin kreditor tələblərinin vərəsələrə münasibətdə davam etməsi üzrə mühüm izahlar verilib.</p>
<p>Ən çox rastlanan iddialar</p>
<p>Mübahisə	Əsas sübutlar</p>
<p>Mülkiyyət hüququnun tanınması	Hüquqmüəyyənedici sənədlər, reyestr, ödəniş</p>
<p>Müqavilənin etibarsızlığı	Əqdin forması, iradə, səlahiyyət, saxtakarlıq</p>
<p>Pulun geri qaytarılması	Müqavilə, bank ödənişi, qəbz</p>
<p>Developer gecikməsi	Müqavilə və təhvil tarixi</p>
<p>İpoteka icrası	Kredit, ipoteka, bildirişlər, qiymətləndirmə</p>
<p>Vərəsəlik	Ölüm, qohumluq, vəsiyyətnamə, notariat işi</p>
<p>Torpaq sərhədi	Kadastr planı, ölçmə, ekspertiza</p>
<p>Kirayə borcu	Müqavilə, bank ödənişləri, təhvil aktı</p>
<p>Mülkiyyət iddiasında yalnız kommunal qəbz və ya faktiki yaşayışın mövcudluğu avtomatik olaraq dövlət qeydiyyatlı mülkiyyət hüququ yaratmır. Reyestr hüququnun dövlət tərəfindən tanınması funksiyası ayrıca hüquqi əhəmiyyət daşıyır.</p>
<p>Məhkəmədən əvvəl check-list</p>
<p>☐ Müqavilənin əsli/surəti saxlanılıb</p>
<p>☐ Bank ödənişləri çıxarılıb</p>
<p>☐ WhatsApp/e-mail yazışmaları ayrıca arxivlənib</p>
<p>☐ Notarial sənədlər toplanıb</p>
<p>☐ Cari və əvvəlki çıxarış/reyestr məlumatı əldə edilib</p>
<p>☐ Təhvil-təslim aktı var</p>
<p>☐ Qarşı tərəfə yazılı tələb göndərilib</p>
<p>☐ İddia müddəti ayrıca hesablanıb</p>
<p>☐ Ekspertiza tələb olunacaqsa obyektin vəziyyəti qorunub</p>
<p>Nümunə — məhkəmədən əvvəl tələb</p>
<p>text</p>
<p>Copy</p>
<p>MƏHKƏMƏDƏN ƏVVƏL TƏLƏB</p>
<p>Kimə: [...]</p>
<p>Kimdən: [...]</p>
<p>[tarix] tarixli [...] müqaviləsinə əsasən tərəfiniz</p>
<p>[öhdəliyin təsviri] öhdəliyini üzərinə götürmüşdür.</p>
<p>Hazırda:</p>
<p>[pozuntunun konkret təsviri]</p>
<p>Tələb edirəm ki, bu məktubun alındığı tarixdən [...]</p>
<p>gün ərzində:</p>
<p>1. [...]</p>
<p>2. [...]</p>
<p>3. [...]</p>
<p>yerinə yetirilsin.</p>
<p>Əks halda hüquqlarımın müdafiəsi, zərərin və digər qanuni</p>
<p>tələblərin ödənilməsi üçün məhkəməyə müraciət edilməsi nəzərdən</p>
<p>keçiriləcək.</p>
<p>Əlavələr: [...]</p>
<p>Tarix / imza</p>
<p>Məhkəməyə getməzdən əvvəl iddia müddəti ayrıca yoxlanmalıdır. Konstitusiya Məhkəməsinin 2025-ci il qərarında müqavilə tələblərinə dair ümumi və daşınmaz əmlak müqavilələrinə dair xüsusi iddia müddətləri kontekstində Mülki Məcəllənin 373-cü maddəsi təhlil edilir.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='mehkemeler'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Konstitusiya Məhkəməsinin 12 may 2026-cı il ilkin müqavilə qərarı.","26 dekabr 2023 və 19 iyun 2025 vərəsəlik qərarları.","Ali Məhkəmənin ipoteka üzrə vahid məhkəmə təcrübəsi qərarı.","Əmlak agentliyi, brokerlik və peşəkar vasitəçilik"]','<p>İcra xülasəsi. Daşınmaz əmlak üzrə məhkəmə praktikası göstərir ki, mübahisələrin əhəmiyyətli hissəsi “kimin haqlı olduğu”ndan əvvəl hansı hüquqi hüququn yaranıb-yaranmadığı, müqavilənin forması, dövlət qeydiyyatı, ipoteka proseduru, vərəsəliyin keçməsi və tərəfin sübut bazası ilə bağlıdır. Daşınmaz əmlakda faktiki sahiblik həmişə qeydiyyatdan keçmiş mülkiyyət hüququ ilə eyni nəticəni vermir.</p>',0,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","legalBasis","isDemo","readMinutes","createdAt","updatedAt") VALUES ('knowledge_article_emlak-agentinin-huquqi-statusu-komissiya-ve-mesuliyyet','emlak-agentinin-huquqi-statusu-komissiya-ve-mesuliyyet','Əmlak agentinin hüquqi statusu, komissiya və məsuliyyət','əmlak agentinin hüquqi statusu, komissiya və məsuliyyət azərbaycanda əmlak agentliyi münasibətini yalnız “makler pulu” kimi şifahi razılaşma ilə qurmaq zəif hüquqi modeldir. mülki məcəllə ayrıca brokerlik müqaviləsini tənzimləyir; 787-ci maddə broker müqaviləsi anlayışını, 788-ci maddə isə brokerin muzd almaq hüququ və xərclərin əvəzini tənzimləyən əsas hüquqi çərçivəni müəyyən edir. tərəflər münasibətin xüsusiyyətindən asılı olaraq tapşırıq,','Azərbaycanda əmlak agentliyi münasibətini yalnız “makler pulu” kimi şifahi razılaşma ilə qurmaq zəif hüquqi modeldir. Mülki Məcəllə ayrıca brokerlik müqaviləsini tənzimləyir; 787-ci maddə broker müqaviləsi anlayışını, 788-ci maddə isə brokerin muzd almaq hüququ və xərclərin əvəzini tənzimləyən əsas hüquqi çərçivəni müəyyən edir. Tərəflər münasibətin xüsusiyyətindən asılı olaraq tapşırıq,','<p>İcra xülasəsi. Azərbaycanda əmlak agentliyi münasibətini yalnız “makler pulu” kimi şifahi razılaşma ilə qurmaq zəif hüquqi modeldir. Mülki Məcəllə ayrıca brokerlik müqaviləsini tənzimləyir; 787-ci maddə broker müqaviləsi anlayışını, 788-ci maddə isə brokerin muzd almaq hüququ və xərclərin əvəzini tənzimləyən əsas hüquqi çərçivəni müəyyən edir. Tərəflər münasibətin xüsusiyyətindən asılı olaraq tapşırıq, agentlik, komissiya və digər müqavilə institutlarından da istifadə edə bilərlər.</p>
<p>Real estate portal üçün terminologiya belə olmalıdır:</p>
<p>Agent — müştərinin marağında əmlak tapılması, təqdim edilməsi, danışıqlar və əməliyyatın koordinasiyasını həyata keçirən şəxs.</p>
<p>Broker — Mülki Məcəllənin brokerlik müqaviləsi rejimi əsasında müqavilənin bağlanmasına vasitəçilik edən şəxs.</p>
<p>Nümayəndə — yalnız ayrıca səlahiyyət, məsələn etibarnamə olduqda müştərinin adından hüquqi hərəkət edə bilən şəxs.</p>
<p>Bu rollar avtomatik olaraq eyni deyil. Agent “mən bu mənzili satıram” deməklə mülkiyyətçinin hüquqi nümayəndəsinə çevrilmir; satıcı adından müqavilə bağlamaq üçün lazımi səlahiyyət ayrıca olmalıdır.</p>
<p>Komissiya</p>
<p>Qanunvericilikdə bütün daşınmaz əmlak brokerləri üçün vahid “1%”, “2%” və ya “bir aylıq kirayə haqqı” kimi məcburi komissiya müəyyən edildiyini göstərən ümumi norma yoxdur. Brokerin haqqı müqavilə ilə aydın müəyyən edilməlidir. Mülki Məcəllənin müqavilə azadlığı və brokerlik normaları bu yanaşmanın hüquqi bazasını təşkil edir.</p>
<p>Ən vacib məsələ təkcə komissiya faizini yox, komissiyanın hansı anda yaranacağını yazmaqdır:</p>
<p>əmlaka baxış keçiriləndə?</p>
<p>tərəflər ilkin müqavilə imzalayanda?</p>
<p>notarial satış başa çatanda?</p>
<p>agentin təqdim etdiyi alıcı sonradan birbaşa satıcı ilə müqavilə bağlayanda?</p>
<p>əməliyyat müştərinin günahı olmadan baş tutmadıqda?</p>
<p>Müqavilə bunları müəyyən etməsə, komissiya mübahisəsi çox asan yaranır.</p>
<p>Eksklüziv və qeyri-eksklüziv müqavilə</p>
<p>Eksklüziv müqavilədə satıcı müəyyən müddətdə yalnız bir agentliklə işləməyi öhdəsinə götürə bilər. Bu halda agentlik marketinq və satış resurslarını daha rahat planlaşdırır, lakin satıcının öz alıcısını tapması halında komissiyanın yaranıb-yaranmaması açıq yazılmalıdır.</p>
<p>Qeyri-eksklüziv müqavilədə bir neçə agent eyni obyektlə işləyə bilər. Burada “effective cause” — yəni hansı brokerin konkret alıcını əməliyyata gətirdiyinin sübutu — daha çox əhəmiyyət daşıyır. Baxış aktı, elektron CRM qeydi və yazılı təqdimat bunun üçün faydalıdır.</p>
<p>AML/KYC öhdəlikləri</p>
<p>Əmlak agentliyi yalnız marketinq xidməti deyil. Azərbaycan Maliyyə Monitorinqi Xidmətinin rəsmi materiallarında daşınmaz əmlakın alqı-satqısı üzrə vasitəçilik xidmətləri göstərən fiziki və hüquqi şəxslər üçün ayrıca “öz müştərini tanı” təlimatı mövcuddur. Daşınmaz əmlak sektorunda şübhəli əməliyyat indikatorlarına üçüncü şəxsin ödənişi, bazar qiymətindən əsassız yüksək/aşağı qiymət, müştərinin əmlaka baxmadan alması, gəlirlə uyğun olmayan alış, üçüncü şəxsin hesabına ödəniş istəyi və sənədlərdə real qiymətdən fərqli qiymət göstərilməsi kimi hallar daxil edilib.</p>
<p>Cari AML qanunvericiliyi çərçivəsində daşınmaz əmlak vasitəçilərinin compliance funksiyasını ciddi qurması buna görə yalnız “bankların işi” deyil.</p>
<p>Praktik agentlik aşağıdakıları saxlamalıdır:</p>
<p>Agentlik sənədi	Funksiya</p>
<p>Müştəri identifikasiyası	KYC</p>
<p>Mülkiyyət sənədinin surəti/məlumatı	Elanın hüquqi bazası</p>
<p>Agentlik müqaviləsi	Səlahiyyət və komissiya</p>
<p>Baxış aktı	Alıcının kim tərəfindən təqdim edildiyini sübut edir</p>
<p>Elan təsdiqi	Qiymət və məlumatın razılaşdırılması</p>
<p>CRM tarixçəsi	Danışıqların izi</p>
<p>Komissiya hesabı/qəbzi	Ödənişin uçotu</p>
<p>AML qeydləri	Risk monitorinqi</p>
<p>Agentlik əmlak sənədlərinin “100% problemsiz” olduğunu yalnız reklam mətninə əsasən bəyan etməməlidir. Dövlət reyestri, notariat və hüquqi due diligence əvəzsizdir. Agent məlumatın mənbəyini göstərməli və sənədləşdirilməmiş faktı “təsdiqlənmiş məlumat” kimi təqdim etməməlidir.</p>
<p>Ən sağlam məsuliyyət modeli</p>
<p>Risk	Müqavilədə həll</p>
<p>Satıcı yanlış məlumat verir	Satıcının məlumatların doğruluğuna zəmanəti</p>
<p>Agent alıcı gətirir, tərəflər onu kənarlaşdırır	“Introduced client” müddəası</p>
<p>Satış baş tutmur	Komissiyanın yaranma anı</p>
<p>Marketinq xərci	Kim ödəyir və limit nədir</p>
<p>Eksklüzivlik	Müddət və xitam</p>
<p>Şəxsi məlumat	İstifadə məqsədi və məxfilik</p>
<p>Saxta sənəd	Agentin yoxlama çərçivəsi və bildiriş öhdəliyi</p>
<p>Nümunə — broker/agentlik müqaviləsi</p>
<p>text</p>
<p>Copy</p>
<p>DAŞINMAZ ƏMLAK ÜZRƏ VASİTƏÇİLİK MÜQAVİLƏSİ</p>
<p>Müştəri: [...]</p>
<p>Broker/Agentlik: [...]</p>
<p>Əmlak:</p>
<p>Ünvan: [...]</p>
<p>Reyestr məlumatı: [...]</p>
<p>Təklif qiyməti: [...] AZN</p>
<p>Xidmət:</p>
<p>1. Əmlakın marketinqi;</p>
<p>2. Potensial alıcıların seçilməsi;</p>
<p>3. Baxışların təşkili;</p>
<p>4. Danışıqların koordinasiyası;</p>
<p>5. Notariat və qeydiyyat prosesinin təşkilati müşayiəti.</p>
<p>Bu müqavilə brokerə müştəri adından əmlakı satmaq və ya</p>
<p>notarial müqavilə imzalamaq səlahiyyəti vermir; belə səlahiyyət</p>
<p>yalnız ayrıca qanuni etibarnamə ilə verilə bilər.</p>
<p>Komissiya:</p>
<p>Satış başa çatdıqda satış qiymətinin [...] %-i / [...] AZN.</p>
<p>Komissiya hüququ aşağıdakı hadisədə yaranır:</p>
<p>[notarial alqı-satqı müqaviləsinin bağlanması].</p>
<p>Eksklüzivlik:</p>
<p>[Var / yoxdur]</p>
<p>Varsa müddət: [...]</p>
<p>Broker tərəfindən təqdim edilmiş alıcı:</p>
<p>Baxış aktı və/və ya CRM qeydi ilə müəyyən olunur.</p>
<p>Müştərinin bəyanatı:</p>
<p>Müştəri əmlaka dair təqdim etdiyi hüquqi və texniki məlumatların</p>
<p>doğruluğuna görə məsuliyyət daşıdığını qəbul edir.</p>
<p>Broker:</p>
<p>Aşkar etdiyi mühüm hüquqi riskləri müştəridən gizlətməməlidir.</p>
<p>Xitam:</p>
<p>[...] gün əvvəl yazılı bildiriş.</p>
<p>Tarix / imzalar</p>
<p>Baxış aktı nümunəsi</p>
<p>text</p>
<p>Copy</p>
<p>ƏMLAKA BAXIŞ AKTI</p>
<p>Tarix: [...]</p>
<p>Əmlak: [...]</p>
<p>Alıcı: [...]</p>
<p>Agent: [...]</p>
<p>Alıcı təsdiq edir ki, yuxarıda göstərilən əmlak ona</p>
<p>[agentlik] tərəfindən təqdim edilmiş və baxış təşkil edilmişdir.</p>
<p>Bu akt özü alqı-satqı müqaviləsi və ya əmlakı almaq öhdəliyi yaratmır.</p>
<p>İmzalar:</p>
<p>Alıcı: [...]</p>
<p>Agent: [...]</p>
<p>Agentlik üçün compliance check-list</p>
<p>☐ Sahibkar/hüquqi şəxs və vergi statusu düzgün qurulub</p>
<p>☐ Hər obyekt üçün yazılı agentlik müqaviləsi mövcuddur</p>
<p>☐ Satıcının şəxsiyyəti müəyyən edilib</p>
<p>☐ Çıxarış məlumatı yoxlanıb</p>
<p>☐ Elan qiyməti müştəri tərəfindən təsdiq edilib</p>
<p>☐ Komissiya və yaranma anı yazılıb</p>
<p>☐ Eksklüzivlik varsa müddəti göstərilib</p>
<p>☐ Alıcı baxışları qeyd olunur</p>
<p>☐ KYC/AML proseduru mövcuddur</p>
<p>☐ Şübhəli ödəniş və qiymət strukturları eskalasiya edilir</p>
<p>☐ Agent müştəri adından hüquqi hərəkəti yalnız səlahiyyət daxilində edir</p>
<p>FAQ. Agent komissiyanı şifahi razılaşma əsasında tələb edə bilərmi? Faktiki münasibətin sübut edilməsindən asılı olaraq mübahisə mümkündür, lakin peşəkar model yazılı müqavilədir. Mülki Məcəllədə broker müqaviləsi ayrıca tənzimlənir.</p>
<p>Agent satıcının adından müqavilə imzalaya bilərmi? Yalnız buna qanuni nümayəndəlik səlahiyyəti verilibsə.</p>
<p>2% məcburi komissiyadırmı? Ümumi daşınmaz əmlak əməliyyatları üçün qanuni sabit 2% komissiya norması müəyyən edilmir; məbləğ müqavilədə müəyyən edilməlidir.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='agentlik-brokerlik'),'BUYER','INTERMEDIATE','DRAFT','MIXED','YELLOW','Azərbaycan Respublikası','["Prioritet rəsmi mənbələr: Mülki Məcəllənin brokerlik, agentlik, tapşırıq və müqavilə azadlığı normaları.","Maliyyə Monitorinqi Xidmətinin daşınmaz əmlak vasitəçiləri üçün KYC təlimatı.","Cinayət yolu ilə əldə edilmiş əmlakın leqallaşdırılmasına qarşı cari normativ çərçivə.","Real Estate Knowledge Hub üçün inteqrasiya edilmiş hüquqi standart","Yuxarıdakı araşdırmadan çıxan əsas nəticə budur ki, Azərbaycan üçün peşəkar Real Estate Knowledge Hub sadəcə məqalələr toplusu yox, istifadəçini əməliyyatın hər mərhələsində hüquqi riskə qarşı istiqamətləndirən sistem olmalıdır. Xüsusilə “çıxarış var/yoxdur”, “tikinti icazəsi”, “ipoteka”, “vərəsəlik”, “torpağın təyinatı”, “notarial razılıqlar”, “vergi” və “agent səlahiyyəti” ayrıca strukturlaşdırılmış data kimi təqdim edilməlidir. Bu yanaşma dövlət reyestrinin hüquqları, məhdudiyyətləri və obyekt məlumatlarını ayrıca saxlayan hüquqi quruluşu ilə də uzlaşır.","Knowledge Hub daxilində hər əmlak kateqoriyası üçün aşağıdakı vahid hüquqi blok faydalıdır:","Portal bloku\tİstifadəçiyə verilən cavab","Hüquqi əsas\tHansı qanun və maddələr tətbiq olunur?","Tələb olunan sənədlər\tHansı sənədlər olmadan əməliyyata girmək olmaz?","Prosedur\tHansı ardıcıllıqla hərəkət edilməlidir?","Vaxt\tDövlət xidməti neçə gün çəkir?","Xərc\tVergi, rüsum və xidmət haqqı nədir?","Risk\tƏn təhlükəli ssenarilər hansıdır?","Check-list\tİstifadəçi əməliyyatdan əvvəl nəyi işarələməlidir?","Şablon\tMüqavilə/ərizə/baxış aktı nümunəsi","Məhkəmə mövqeyi\tMəhkəmələr bu məsələni necə şərh edib?","Son yenilənmə\tQanunvericilik hansı tarixdə yoxlanılıb?","Praktik olaraq portalda hər məqalənin başında belə hüquqi status paneli yerləşdirmək məqsədəuyğundur:","text","Copy","HÜQUQİ STATUS","Son hüquqi yoxlama: Avqust 2026","Yurisdiksiya: Azərbaycan Respublikası","Əsas aktlar:","• Mülki Məcəllə","• Daşınmaz əmlakın dövlət reyestri haqqında Qanun","• Notariat haqqında Qanun","• Dövlət rüsumu haqqında Qanun","• Vergi Məcəlləsi","Məlumat xarakteri:","Ümumi hüquqi və praktiki bələdçi.","Konkret mübahisə və yüksək riskli əməliyyatlarda fərdi sənəd","yoxlanması tələb oluna bilər.","Xüsusilə vergi və dövlət rüsumu məqalələri statik saxlanmamalıdır. Dövlət Vergi Xidmətinin 2026-cı ilin avqustunda icarə gəliri üzrə hələ 14% dərəcəni göstərməsi, eyni zamanda bundan əvvəl 10%-ə endirmə təşəbbüsünün açıqlanması bunun yaxşı nümunəsidir: portal “xəbər/təklif” ilə “qüvvədə olan norma”nı ayrıca göstərməlidir.","Eyni prinsip vərəsəlik bölməsində daha da vacibdir. 2023-cü il Konstitusiya Məhkəməsi qərarından əvvəl yazılmış yüzlərlə internet materialı “6 ayda mirası qəbul etməsən hüquq itir” yanaşmasını təkrarlaya bilər, halbuki 1246 və 1273-1-ci maddələr artıq qüvvədə deyil. Buna görə Knowledge Hub məhkəmə qərarlarının qanun mətninə təsirini də izləməlidir.","Yeni tikililər üçün isə portalın ən güclü xəbərdarlığı belə olmalıdır:","“İlkin müqavilə və ödəniş qəbzi fərdi mülkiyyət çıxarışı deyil.”","Bu mövqe artıq yalnız ehtiyatlı hüquqi tövsiyə deyil; Konstitusiya Məhkəməsinin 12 may 2026-cı il qərarında ilkin müqavilənin özünün əmlak hüququ yaratmadığı açıq hüquqi əsaslandırma ilə göstərilib.","Bütün hub üçün “red flag” sistemi də tətbiq edilə bilər:","Status\tMənası","🟢\tƏsas hüquqi sənədlər mövcuddur və reyestrlə uyğunluq yoxlanıb","🟡\tƏlavə sənəd/yoxlama tələb olunur","🔴\tQeydiyyat, yüklülük, səlahiyyət və ya tikinti statusu üzrə ciddi risk","⚖️\tMəhkəmə mübahisəsi və ya hüquqi rəy tələb edən vəziyyət","Ən mühüm universal “əmlak almadan əvvəl 15 yoxlama” isə belə formalaşdırıla bilər:","Satıcının şəxsiyyəti.","Dövlət reyestrində hüquq.","Çıxarışın obyektlə uyğunluğu.","İpoteka.","Həbs və sərəncam qadağası.","Servitut və digər məhdudiyyətlər.","Nikah və həyat yoldaşı hüquqları.","Zəruri ailə razılıqları.","Etibarnamənin qüvvəsi.","Faktiki sahə və plan.","Torpağın kateqoriyası və təyinatı.","Yeni tikilidə tikinti və istismar statusu.","Vergi və rüsumların əvvəlcədən hesablanması.","Ödənişin notariat/bank izi ilə aparılması.","Təhvil-təslim aktı və yeni elektron çıxarışın alınması.","Bu model Mülki Məcəllənin daşınmaz əmlak əqdlərinə dair formallıqları, dövlət reyestrinin hüquqtəsdiqedici funksiyası və notariat-reyestr elektron inteqrasiyası ilə uyğun gəlir.","Belə qurulmuş Real Estate Knowledge Hub istifadəçiyə sadəcə “mənzili necə almaq olar?” cavabını vermir. O, mənzili hansı sənədlə almaq, hansı riski əvvəlcədən görmək, hansı ödənişi nə üçün ödəmək, hüququ hansı anda əldə etmək və problem yaranarsa hansı hüquqi mövqeyə istinad etmək lazım olduğunu göstərən Azərbaycan daşınmaz əmlak hüququ üzrə praktik məlumat infrastrukturu rolunu oynayır."]','<p>İcra xülasəsi. Azərbaycanda əmlak agentliyi münasibətini yalnız “makler pulu” kimi şifahi razılaşma ilə qurmaq zəif hüquqi modeldir. Mülki Məcəllə ayrıca brokerlik müqaviləsini tənzimləyir; 787-ci maddə broker müqaviləsi anlayışını, 788-ci maddə isə brokerin muzd almaq hüququ və xərclərin əvəzini tənzimləyən əsas hüquqi çərçivəni müəyyən edir. Tərəflər münasibətin xüsusiyyətindən asılı olaraq tapşırıq, agentlik, komissiya və digər müqavilə institutlarından da istifadə edə bilərlər.</p>',0,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
