-- Avtomatik yaradılıb: npm run db:guides:build (prisma/build-knowledge-guides-sql.ts).
-- Əl ilə redaktə etmə — prisma/knowledge-guides/ altındakı məzmunu dəyiş və yenidən qur.
-- Bilik Mərkəzi: yeni mövzular, praktiki bələdçilər, lüğət terminləri; bloq yazıları;
-- mövcud bələdçilərin tag-ları və tam mətnli axtarış indeksi.

INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_alqi-satqi','alqi-satqi','Alqı-satqı','alqi satqi','Mənzil, ev və digər əmlakın alışı: seçimdən və yoxlamadan müqavilənin imzalanmasına, açarın təhvilinə qədər addım-addım bələdçilər.','Home',0,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Mənzil, ev və digər əmlakın alışı: seçimdən və yoxlamadan müqavilənin imzalanmasına, açarın təhvilinə qədər addım-addım bələdçilər.',"searchName"='alqi satqi',"order"=0,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='alqi-satqi' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_satis','satis','Əmlak satışı','emlak satisi','Əmlakını satmaq istəyənlər üçün: sənədlərin hazırlanması, düzgün qiymət, elanın tərtibi, alıcı ilə danışıqlar və təhvil.','Tags',5,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Əmlakını satmaq istəyənlər üçün: sənədlərin hazırlanması, düzgün qiymət, elanın tərtibi, alıcı ilə danışıqlar və təhvil.',"searchName"='emlak satisi',"order"=5,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='satis' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_kiraye','kiraye','Kirayə','kiraye','Kirayəçi və ev sahibi üçün: kirayə müqaviləsi, depozit, təhvil-qəbul aktı, kommunal xərclər və mübahisələrin qarşısının alınması.','KeyRound',10,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Kirayəçi və ev sahibi üçün: kirayə müqaviləsi, depozit, təhvil-qəbul aktı, kommunal xərclər və mübahisələrin qarşısının alınması.',"searchName"='kiraye',"order"=10,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='kiraye' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_emlak-idareetmesi','emlak-idareetmesi','Əmlakın idarə olunması','emlakin idare olunmasi','Mülkiyyətçinin gündəlik qayğıları: kommunal hesablar, bina idarəetməsi, sığorta, təmir, kirayəyə vermə və vergi öhdəlikləri.','ClipboardCheck',15,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Mülkiyyətçinin gündəlik qayğıları: kommunal hesablar, bina idarəetməsi, sığorta, təmir, kirayəyə vermə və vergi öhdəlikləri.',"searchName"='emlakin idare olunmasi',"order"=15,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='emlak-idareetmesi' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_vereselik','vereselik','Vərəsəlik','vereselik','Mirasın qəbulu, vərəsəlik şəhadətnaməsi, paylı mülkiyyət və miras qalmış əmlakın satışı üzrə hüquqi izahlar.','ScrollText',20,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Mirasın qəbulu, vərəsəlik şəhadətnaməsi, paylı mülkiyyət və miras qalmış əmlakın satışı üzrə hüquqi izahlar.',"searchName"='vereselik',"order"=20,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='vereselik' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_ipoteka-maliyye','ipoteka-maliyye','İpoteka və maliyyə','ipoteka ve maliyye','İpoteka krediti, İKZF-nin güzəştli və adi ipotekası, ilkin ödəniş, faiz, aylıq ödənişin hesablanması və kredit riskləri.','Landmark',30,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='İpoteka krediti, İKZF-nin güzəştli və adi ipotekası, ilkin ödəniş, faiz, aylıq ödənişin hesablanması və kredit riskləri.',"searchName"='ipoteka ve maliyye',"order"=30,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='ipoteka-maliyye' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_qeydiyyat-notariat','qeydiyyat-notariat','Qeydiyyat və notariat','qeydiyyat ve notariat','Çıxarışın yoxlanması, əmlakın hüquqi tarixçəsi, notariat qaydasında təsdiq və mülkiyyət hüququnun dövlət qeydiyyatı.','FileCheck2',40,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Çıxarışın yoxlanması, əmlakın hüquqi tarixçəsi, notariat qaydasında təsdiq və mülkiyyət hüququnun dövlət qeydiyyatı.',"searchName"='qeydiyyat ve notariat',"order"=40,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='qeydiyyat-notariat' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_vergi-rusum','vergi-rusum','Vergi və rüsumlar','vergi ve rusumlar','Alqı-satqıda ödənilən dövlət rüsumu, notariat xərcləri, satıcının vergisi, əmlak vergisi və əməliyyatın ümumi xərc smetası.','ReceiptText',50,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Alqı-satqıda ödənilən dövlət rüsumu, notariat xərcləri, satıcının vergisi, əmlak vergisi və əməliyyatın ümumi xərc smetası.',"searchName"='vergi ve rusumlar',"order"=50,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='vergi-rusum' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_yeni-tikili','yeni-tikili','Tikinti və yeni tikililər','tikinti ve yeni tikililer','Yeni tikilidə mənzil alarkən tikintiçinin, icazələrin, ilkin müqavilənin və təhvil şərtlərinin yoxlanması; köhnə tikili ilə müqayisə.','Building2',60,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Yeni tikilidə mənzil alarkən tikintiçinin, icazələrin, ilkin müqavilənin və təhvil şərtlərinin yoxlanması; köhnə tikili ilə müqayisə.',"searchName"='tikinti ve yeni tikililer',"order"=60,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='yeni-tikili' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_emlak-novleri','emlak-novleri','Əmlak növləri üzrə bələdçilər','emlak novleri uzre beledciler','Mənzil, həyət evi, torpaq sahəsi və kommersiya obyekti — hər birinin özünəməxsus yoxlama siyahısı, riskləri və sənədləri.','Blocks',65,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Mənzil, həyət evi, torpaq sahəsi və kommersiya obyekti — hər birinin özünəməxsus yoxlama siyahısı, riskləri və sənədləri.',"searchName"='emlak novleri uzre beledciler',"order"=65,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='emlak-novleri' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_torpaq','torpaq','Torpaq hüququ','torpaq huququ','Torpağın təyinatı, mülkiyyət və icarə formaları, sərhədlər, tikintiyə icazə və torpaq alqı-satqısının xüsusiyyətləri.','Map',70,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Torpağın təyinatı, mülkiyyət və icarə formaları, sərhədlər, tikintiyə icazə və torpaq alqı-satqısının xüsusiyyətləri.',"searchName"='torpaq huququ',"order"=70,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='torpaq' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_bazar-qiymet','bazar-qiymet','Bazar və qiymət','bazar ve qiymet','Əmlakın real bazar qiymətinin müəyyən edilməsi, ilkin və təkrar bazar, ərazinin qiymətləndirilməsi və investisiya gəlirliliyi.','BarChart3',75,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Əmlakın real bazar qiymətinin müəyyən edilməsi, ilkin və təkrar bazar, ərazinin qiymətləndirilməsi və investisiya gəlirliliyi.',"searchName"='bazar ve qiymet',"order"=75,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='bazar-qiymet' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_mehkemeler','mehkemeler','Məhkəmə təcrübəsi','mehkeme tecrubesi','Daşınmaz əmlak üzrə tipik mübahisələr: etibarsız əqd, beh, mülkiyyətin tanınması, kirayə və vərəsəlik iddiaları.','Scale',80,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Daşınmaz əmlak üzrə tipik mübahisələr: etibarsız əqd, beh, mülkiyyətin tanınması, kirayə və vərəsəlik iddiaları.',"searchName"='mehkeme tecrubesi',"order"=80,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='mehkemeler' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_tehlukesizlik','tehlukesizlik','Təhlükəsizlik və saxta elanlar','tehlukesizlik ve saxta elanlar','Saxta və yanıltıcı elanları, fırıldaqçılıq sxemlərini tanımaq, beh və ödənişlərdə özünüzü qorumaq üçün praktiki qaydalar.','ShieldAlert',85,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Saxta və yanıltıcı elanları, fırıldaqçılıq sxemlərini tanımaq, beh və ödənişlərdə özünüzü qorumaq üçün praktiki qaydalar.',"searchName"='tehlukesizlik ve saxta elanlar',"order"=85,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='tehlukesizlik' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_agentlik-brokerlik','agentlik-brokerlik','Agentlik və brokerlik','agentlik ve brokerlik','Əmlak agentliyi ilə işləyərkən müqavilə, komissiya, eksklüziv razılaşma, etibarnamə və agentin məsuliyyəti.','Handshake',90,1,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeCategory" SET "description"='Əmlak agentliyi ilə işləyərkən müqavilə, komissiya, eksklüziv razılaşma, etibarnamə və agentin məsuliyyəti.',"searchName"='agentlik ve brokerlik',"order"=90,"updatedAt"='2026-09-29T08:00:00.000Z' WHERE "slug"='agentlik-brokerlik' AND ("description" IS NULL OR "description" LIKE '% üzrə hüquqi və praktiki bələdçilər.');

INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_emlak-alarken-yoxlanilmali-meqamlar','emlak-alarken-yoxlanilmali-meqamlar','Əmlak alarkən nələr yoxlanılmalıdır: tam yoxlama siyahısı','emlak alarken neler yoxlanilmalidir tam yoxlama siyahisi menzil ve ya ev almazdan evvel sened satici bina erazi ve maliyye uzre yoxlanmali olan esas meqamlar beh vermezden evvel kecmeli oldugunuz addim addim siyahi yoxlama siyahisi cixaris beh alqi satqi riskler alqi satqi emlak alisi cox vaxt ailenin en boyuk maliyye qeraridir sehvlerin ekseriyyeti telesikden yaranir basqa alici var deyilir beh verilir senedler ise sonra yoxlanilir bu beledci yoxlamani duzgun ardicilliqla aparmaga komek edir evvel huquqi temizlik sonra fiziki veziyyet sonra qiymet ve odenis 1 huquqi yoxlama ilk ve en vacib addim azerbaycanda dasinmaz emlak uzerinde mulkiyyet huququ dovlet reyestrinde qeydiyyata alindigi andan yaranir buna gore esas sened dasinmaz emlakin dovlet reyestrinden cixarisdir xalq arasinda kupca cixarisin eslini gorun suret ve ya telefon sekli kifayet deyil reyestr nomresi unvan sahe mulkiyyetcinin adi ve senedin verilme tarixi aydin oxunmalidir satici cixarisdaki sexsdirmi sexsiyyet vesiqesi ile muqayise edin satici numayendedirse notarial etibarnamenin esli muddeti ve selahiyyetleri satmaq pul almaq yoxlanmalidir mulkiyyetciler nece neferdir payli ve ya birge mulkiyyetde butun mulkiyyetcilerin raziligi lazimdir yukluluk varmi ipoteka hebs qadaga mehkeme mubahisesi bunlar emlakin satisini mehdudlasdirir ve ya aliciya kece biler er arvadin raziligi nikah dovrunde elde edilmis emlak bir qayda olaraq er arvadin birge mulkiyyetidir satis ucun diger terefin notarial raziligi teleb olunur yetkinlik yasina catmayanlar emlakda azyaslinin payi varsa qeyyumluq ve himaye orqaninin raziligi olmadan satis mumkun deyil cixarisin etibarliligini ve yuklulukleri notarius eqdi tesdiq etmezden evvel reyestr uzre yoxlayir lakin bu yoxlamani beh vermezden evvel ozunuz de aparmalisiniz etrafli cixarisin ve huquqi senedlerin yoxlanilmasi 2 satici ve emlakin tarixcesi emlak saticiya nece kecib alqi satqi bagislama vereselik ozellesdirme son 3 ilde bir nece defe el deyisibse sebebini sorusun vereselik yolu ile alinibsa diger vereselerin iddiasi ola bilermi miras acilandan az vaxt kecibse risk yuksekdir emlakda kimler yasayis yeri uzre qeydiyyatdadir satisdan sonra qeydiyyatdan cixmaq ohdeliyi ve muddeti muqavilede yazilmalidir etrafli emlakin huquqi tarixcesinin yoxlanilmasi 3 fiziki veziyyet divar ve tavanda nem cat ve kif izleri pencere ve qapilarin veziyyeti elektrik xettinin gucu saygaclarin veziyyeti qaz ve su techizatinin fasilesizliyi icazesiz yenidenplanlasdirma sokulmus divar balkonun otaga birlesdirilmesi metbexin kocurulmesi bu deyisiklikler texniki pasportla uygun gelmelidirse sonradan problem yarada biler kommunal borclar isiq qaz su ve bina xidmeti uzre borcsuzluq arayislari 4 bina ve erazi binanin tikinti ili konstruksiyasi lift ve dam veziyyeti dayanacaq mekteb bagca neqliyyat ve ses kuy menbeleri menzilin ozu qeder vacibdir ayrica yoxlama siyahisi bina infrastruktur ve erazi uzre yoxlanilmali meqamlar 5 qiymet ve maliyye eyni erazide ve oxsar binada satilan menzillerin 1 m2 qiymetini muqayise edin elan qiymeti ile real satis qiymeti ferqlene biler emeliyyat xerclerini evvelceden hesablayin notariat dovlet rusumu qiymetlendirme ipotekada sigorta agentlik haqqi ipoteka ile alirsinizsa bankin emlaki qebul edeceyini beh vermezden evvel oyrenin cixarisi olmayan emlak ipoteka predmeti ola bilmez 6 beh ve odenis beh yalniz yazili razilasma ile verilmelidir mebleg emlakin tesviri esas muqavilenin baglanma tarixi ve tereflerden biri imtina etdikde neticeler gosterilmelidir nagd pul evezine bank kocurmesi ustunluk teskil edir odenisin izi qalir qisa yoxlama siyahisi merhele ne yoxlanir kim harada sened cixaris mulkiyyetciler yukluluk satici notarius emdx satici sexsiyyet etibarname er arvad raziligi notarius emlak planlasdirma kommunikasiyalar borclar ozunuz usta kommunal xidmetler maliyye bazar qiymeti xercler ipoteka imkani bank qiymetlendirici razilasma beh senedi odenis usulu tehvil tarixi terefler notarius qizil qayda sened yoxlanmayibsa pul verilmir','Mənzil və ya ev almazdan əvvəl sənəd, satıcı, bina, ərazi və maliyyə üzrə yoxlanmalı olan əsas məqamlar — beh verməzdən əvvəl keçməli olduğunuz addım-addım siyahı.','
<p>Əmlak alışı çox vaxt ailənin ən böyük maliyyə qərarıdır. Səhvlərin əksəriyyəti tələsikdən yaranır: «başqa alıcı var» deyilir, beh verilir, sənədlər isə sonra yoxlanılır. Bu bələdçi yoxlamanı düzgün ardıcıllıqla aparmağa kömək edir — əvvəl hüquqi təmizlik, sonra fiziki vəziyyət, sonra qiymət və ödəniş.</p>

<h2>1. Hüquqi yoxlama — ilk və ən vacib addım</h2>
<p>Azərbaycanda daşınmaz əmlak üzərində mülkiyyət hüququ dövlət reyestrində qeydiyyata alındığı andan yaranır. Buna görə əsas sənəd <strong>daşınmaz əmlakın dövlət reyestrindən çıxarışdır</strong> (xalq arasında «kupça»).</p>
<ul>
  <li><strong>Çıxarışın əslini görün.</strong> Surət və ya telefon şəkli kifayət deyil. Reyestr nömrəsi, ünvan, sahə, mülkiyyətçinin adı və sənədin verilmə tarixi aydın oxunmalıdır.</li>
  <li><strong>Satıcı çıxarışdakı şəxsdirmi?</strong> Şəxsiyyət vəsiqəsi ilə müqayisə edin. Satıcı nümayəndədirsə, notarial etibarnamənin əsli, müddəti və səlahiyyətləri (satmaq, pul almaq) yoxlanmalıdır.</li>
  <li><strong>Mülkiyyətçilər neçə nəfərdir?</strong> Paylı və ya birgə mülkiyyətdə bütün mülkiyyətçilərin razılığı lazımdır.</li>
  <li><strong>Yüklülük varmı?</strong> İpoteka, həbs, qadağa, məhkəmə mübahisəsi — bunlar əmlakın satışını məhdudlaşdırır və ya alıcıya keçə bilər.</li>
  <li><strong>Ər-arvadın razılığı.</strong> Nikah dövründə əldə edilmiş əmlak, bir qayda olaraq, ər-arvadın birgə mülkiyyətidir; satış üçün digər tərəfin notarial razılığı tələb olunur.</li>
  <li><strong>Yetkinlik yaşına çatmayanlar.</strong> Əmlakda azyaşlının payı varsa, qəyyumluq və himayə orqanının razılığı olmadan satış mümkün deyil.</li>
</ul>
<p>Çıxarışın etibarlılığını və yüklülükləri notarius əqdi təsdiq etməzdən əvvəl reyestr üzrə yoxlayır, lakin bu yoxlamanı beh verməzdən <em>əvvəl</em> özünüz də aparmalısınız. Ətraflı: <a href="/bilik-merkezi/cixarisin-ve-huquqi-senedlerin-yoxlanilmasi">Çıxarışın və hüquqi sənədlərin yoxlanılması</a>.</p>

<h2>2. Satıcı və əmlakın tarixçəsi</h2>
<ul>
  <li>Əmlak satıcıya necə keçib: alqı-satqı, bağışlama, vərəsəlik, özəlləşdirmə? Son 3 ildə bir neçə dəfə əl dəyişibsə, səbəbini soruşun.</li>
  <li>Vərəsəlik yolu ilə alınıbsa, digər vərəsələrin iddiası ola bilərmi? Miras açılandan az vaxt keçibsə, risk yüksəkdir.</li>
  <li>Əmlakda kimlər yaşayış yeri üzrə qeydiyyatdadır? Satışdan sonra qeydiyyatdan çıxmaq öhdəliyi və müddəti müqavilədə yazılmalıdır.</li>
</ul>
<p>Ətraflı: <a href="/bilik-merkezi/emlakin-huquqi-tarixcesinin-yoxlanilmasi">Əmlakın hüquqi tarixçəsinin yoxlanılması</a>.</p>

<h2>3. Fiziki vəziyyət</h2>
<ul>
  <li>Divar və tavanda nəm, çat və kif izləri; pəncərə və qapıların vəziyyəti.</li>
  <li>Elektrik xəttinin gücü, sayğacların vəziyyəti, qaz və su təchizatının fasiləsizliyi.</li>
  <li>İcazəsiz yenidənplanlaşdırma: sökülmüş divar, balkonun otağa birləşdirilməsi, mətbəxin köçürülməsi. Bu dəyişikliklər texniki pasportla uyğun gəlməlidirsə, sonradan problem yarada bilər.</li>
  <li>Kommunal borclar: işıq, qaz, su və bina xidməti üzrə borcsuzluq arayışları.</li>
</ul>

<h2>4. Bina və ərazi</h2>
<p>Binanın tikinti ili, konstruksiyası, lift və dam vəziyyəti, dayanacaq, məktəb, bağça, nəqliyyat və səs-küy mənbələri mənzilin özü qədər vacibdir. Ayrıca yoxlama siyahısı: <a href="/bilik-merkezi/bina-infrastruktur-ve-erazi-yoxlamasi">Bina, infrastruktur və ərazi üzrə yoxlanılmalı məqamlar</a>.</p>

<h2>5. Qiymət və maliyyə</h2>
<ul>
  <li>Eyni ərazidə və oxşar binada satılan mənzillərin 1 m² qiymətini müqayisə edin. Elan qiyməti ilə real satış qiyməti fərqlənə bilər.</li>
  <li>Əməliyyat xərclərini əvvəlcədən hesablayın: notariat, dövlət rüsumu, qiymətləndirmə (ipotekada), sığorta, agentlik haqqı.</li>
  <li>İpoteka ilə alırsınızsa, bankın əmlakı qəbul edəcəyini beh verməzdən əvvəl öyrənin — çıxarışı olmayan əmlak ipoteka predmeti ola bilməz.</li>
</ul>

<h2>6. Beh və ödəniş</h2>
<p>Beh yalnız yazılı razılaşma ilə verilməlidir: məbləğ, əmlakın təsviri, əsas müqavilənin bağlanma tarixi və tərəflərdən biri imtina etdikdə nəticələr göstərilməlidir. Nağd pul əvəzinə bank köçürməsi üstünlük təşkil edir — ödənişin izi qalır.</p>

<h2>Qısa yoxlama siyahısı</h2>
<table>
  <thead><tr><th>Mərhələ</th><th>Nə yoxlanır</th><th>Kim/harada</th></tr></thead>
  <tbody>
    <tr><td>Sənəd</td><td>Çıxarış, mülkiyyətçilər, yüklülük</td><td>Satıcı, notarius, ƏMDX</td></tr>
    <tr><td>Satıcı</td><td>Şəxsiyyət, etibarnamə, ər-arvad razılığı</td><td>Notarius</td></tr>
    <tr><td>Əmlak</td><td>Planlaşdırma, kommunikasiyalar, borclar</td><td>Özünüz, usta, kommunal xidmətlər</td></tr>
    <tr><td>Maliyyə</td><td>Bazar qiyməti, xərclər, ipoteka imkanı</td><td>Bank, qiymətləndirici</td></tr>
    <tr><td>Razılaşma</td><td>Beh sənədi, ödəniş üsulu, təhvil tarixi</td><td>Tərəflər, notarius</td></tr>
  </tbody>
</table>
<p><strong>Qızıl qayda:</strong> sənəd yoxlanmayıbsa — pul verilmir.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Ailə Məcəlləsi"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46946","https://e-emlak.gov.az/"]','["yoxlama siyahısı","çıxarış","beh","alqı-satqı","risklər"]',3,1,0,'Əmlak alarkən nələr yoxlanılmalıdır: tam yoxlama siyahısı','Mənzil və ya ev almazdan əvvəl sənəd, satıcı, bina, ərazi və maliyyə üzrə yoxlanmalı olan əsas məqamlar — beh verməzdən əvvəl keçməli olduğunuz addım-addım siyahı.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_bina-infrastruktur-ve-erazi-yoxlamasi','bina-infrastruktur-ve-erazi-yoxlamasi','Ev alarkən bina, infrastruktur və ərazi üzrə yoxlanmalı məqamlar','ev alarken bina infrastruktur ve erazi uzre yoxlanmali meqamlar menzilin ozu qeder onun yerlesdiyi bina ve mehelle de qiymeti ve gundelik rahatligi mueyyen edir binanin texniki veziyyeti kommunikasiyalar neqliyyat sosial obyektler ve riskler uzre praktiki siyahi yoxlama siyahisi infrastruktur erazi bina menzil alqi satqi temir deyisdirile biler bina ve erazi ise yox buna gore baxisa gedende menzilden evvel binaya ve etrafa diqqet edin en yaxsisi eyni yere iki defe is gunu axsam ve istirahet gunu gunduz baxmaqdir bina tikinti ili ve konstruksiya konstruksiya novu monolit karkas panel das kerpic binalarin istilik saxlama ses izolyasiyasi ve yenidenplanlasdirma imkanlari ferqlidir panel binada dasiyici divarlarin sokulmesi xususile tehlukelidir yasi kohne binalarda boru elektrik xetti ve dam temiri tez tez teleb olunur bu xercler bezen sakinlerin uzerine dusur yeni tikilide binanin istismara qebul edilib edilmediyini tikinti icazesini ve tikinticinin kecmis layihelerini oyrenin etrafli yeni tikili yoxsa kohne tikili umumi istifade saheleri giris pilleken zirzemi ve damin veziyyeti sakinlerin binaya munasibetinin gostericisidir lift isleyirmi nece liftdir texniki xidmet kim terefinden aparilir binani kim idare edir menzil istismar sahesi mtk idareetme sirketi ve ya mulkiyyetciler birliyi ayliq xidmet haqqi ne qederdir ve neyi ehate edir yangin tehlukesizliyi pilleken qefesinin aciq olmasi yanginsondurme vasiteleri texliye yollari kommunikasiyalar elektrik ayrilmis guc kifayetdirmi kondisioner elektrik sobasi gerginlik dusmeleri olurmu qaz ferdi saygac qaz kotlu kombi ucun icaze ve tustu kanali su suyun fasilesiz verilmesi tezyiq yuxari mertebelerde nasos lazimdirmi su saygaci kanalizasiya ve drenaj xususile birinci mertebe ve zirzemi ucun internet optik xett movcudlugu provayder secimi erazi ve infrastruktur meyar neye baxmali neqliyyat metro ve avtobus dayanacagina piyada mesafe pik saatlarda tixac esas yollara cixis tehsil yaxinliqdaki mekteb ve bagcalar onlarin dolulugu sehiyye poliklinika xestexana aptek gundelik ehtiyaclar market bazar bank asan xidmet merkezi istirahet park yasilliq usaq meydancasi idman obyektleri dayanacaq heyetde yer yeralti parkinq kucede gece veziyyeti riskler ve menfi amiller ses kuy magistral yol demir yolu gece klubu restoran tikinti meydancasi ekoloji amiller senaye obyektleri neft medenleri zibil poliqonu yuksek gerginlikli xetler su basma cokeklikde yerlesen kuceler yagisli havada su altinda qala biler qonsulardan sorusun gelecek tikinti pencerenin qarsisindaki bos sahede hundurmertebeli bina tikile bilermi sehersalma senedleri barede melumat ucun sehersalma ve arxitektura komitesine muraciet etmek olar qonsularla danisin 5 deqiqelik sohbet cox sey oyredir su ve isigin kesilmesi damin axmasi idareetme ile problemler ses izolyasiyasi saticinin deye bilmeyeceyi melumati en cox qonsular verir','Mənzilin özü qədər onun yerləşdiyi bina və məhəllə də qiyməti və gündəlik rahatlığı müəyyən edir. Binanın texniki vəziyyəti, kommunikasiyalar, nəqliyyat, sosial obyektlər və risklər üzrə praktiki siyahı.','
<p>Təmir dəyişdirilə bilər, bina və ərazi isə yox. Buna görə baxışa gedəndə mənzildən əvvəl binaya və ətrafa diqqət edin. Ən yaxşısı eyni yerə iki dəfə — iş günü axşam və istirahət günü gündüz baxmaqdır.</p>

<h2>Bina</h2>
<h3>Tikinti ili və konstruksiya</h3>
<ul>
  <li><strong>Konstruksiya növü:</strong> monolit-karkas, panel, daş (kərpic) binaların istilik saxlama, səs izolyasiyası və yenidənplanlaşdırma imkanları fərqlidir. Panel binada daşıyıcı divarların sökülməsi xüsusilə təhlükəlidir.</li>
  <li><strong>Yaşı:</strong> köhnə binalarda boru, elektrik xətti və dam təmiri tez-tez tələb olunur; bu xərclər bəzən sakinlərin üzərinə düşür.</li>
  <li><strong>Yeni tikilidə:</strong> binanın istismara qəbul edilib-edilmədiyini, tikinti icazəsini və tikintiçinin keçmiş layihələrini öyrənin. Ətraflı: <a href="/bilik-merkezi/yeni-tikili-yoxsa-kohne-tikili">Yeni tikili, yoxsa köhnə tikili?</a></li>
</ul>
<h3>Ümumi istifadə sahələri</h3>
<ul>
  <li>Giriş, pilləkən, zirzəmi və damın vəziyyəti — sakinlərin binaya münasibətinin göstəricisidir.</li>
  <li>Lift: işləyirmi, neçə liftdir, texniki xidmət kim tərəfindən aparılır?</li>
  <li>Binanı kim idarə edir: mənzil-istismar sahəsi, MTK, idarəetmə şirkəti və ya mülkiyyətçilər birliyi? Aylıq xidmət haqqı nə qədərdir və nəyi əhatə edir?</li>
  <li>Yanğın təhlükəsizliyi: pilləkən qəfəsinin açıq olması, yanğınsöndürmə vasitələri, təxliyə yolları.</li>
</ul>

<h2>Kommunikasiyalar</h2>
<ul>
  <li><strong>Elektrik:</strong> ayrılmış güc kifayətdirmi (kondisioner, elektrik sobası)? Gərginlik düşmələri olurmu?</li>
  <li><strong>Qaz:</strong> fərdi sayğac, qaz kotlu (kombi) üçün icazə və tüstü kanalı.</li>
  <li><strong>Su:</strong> suyun fasiləsiz verilməsi, təzyiq (yuxarı mərtəbələrdə nasos lazımdırmı?), su sayğacı.</li>
  <li><strong>Kanalizasiya və drenaj:</strong> xüsusilə birinci mərtəbə və zirzəmi üçün.</li>
  <li><strong>İnternet:</strong> optik xətt mövcudluğu, provayder seçimi.</li>
</ul>

<h2>Ərazi və infrastruktur</h2>
<table>
  <thead><tr><th>Meyar</th><th>Nəyə baxmalı</th></tr></thead>
  <tbody>
    <tr><td>Nəqliyyat</td><td>Metro və avtobus dayanacağına piyada məsafə, pik saatlarda tıxac, əsas yollara çıxış</td></tr>
    <tr><td>Təhsil</td><td>Yaxınlıqdakı məktəb və bağçalar, onların doluluğu</td></tr>
    <tr><td>Səhiyyə</td><td>Poliklinika, xəstəxana, aptek</td></tr>
    <tr><td>Gündəlik ehtiyaclar</td><td>Market, bazar, bank, ASAN xidmət mərkəzi</td></tr>
    <tr><td>İstirahət</td><td>Park, yaşıllıq, uşaq meydançası, idman obyektləri</td></tr>
    <tr><td>Dayanacaq</td><td>Həyətdə yer, yeraltı parkinq, küçədə gecə vəziyyəti</td></tr>
  </tbody>
</table>

<h2>Risklər və mənfi amillər</h2>
<ul>
  <li><strong>Səs-küy:</strong> magistral yol, dəmir yolu, gecə klubu, restoran, tikinti meydançası.</li>
  <li><strong>Ekoloji amillər:</strong> sənaye obyektləri, neft mədənləri, zibil poliqonu, yüksək gərginlikli xətlər.</li>
  <li><strong>Su basma:</strong> çökəklikdə yerləşən küçələr yağışlı havada su altında qala bilər — qonşulardan soruşun.</li>
  <li><strong>Gələcək tikinti:</strong> pəncərənin qarşısındakı boş sahədə hündürmərtəbəli bina tikilə bilərmi? Şəhərsalma sənədləri barədə məlumat üçün Şəhərsalma və Arxitektura Komitəsinə müraciət etmək olar.</li>
</ul>

<h2>Qonşularla danışın</h2>
<p>5 dəqiqəlik söhbət çox şey öyrədir: su və işığın kəsilməsi, damın axması, idarəetmə ilə problemlər, səs izolyasiyası. Satıcının deyə bilməyəcəyi məlumatı ən çox qonşular verir.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi","Azərbaycan Respublikasının Mənzil Məcəlləsi"]','["https://e-qanun.az/framework/46958","https://e-qanun.az/framework/46955","https://arxkom.gov.az/","https://fhn.gov.az/az"]','["yoxlama siyahısı","infrastruktur","ərazi","bina","mənzil"]',2,0,0,'Ev alarkən bina, infrastruktur və ərazi üzrə yoxlanmalı məqamlar',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_menzil-alqi-satqisinda-muqavile-merheleleri','menzil-alqi-satqisinda-muqavile-merheleleri','Mənzil alqı-satqısında müqavilə mərhələləri: behdən çıxarışa qədər','menzil alqi satqisinda muqavile merheleleri behden cixarisa qeder razilasmadan mulkiyyet huququnun qeydiyyatina qeder menzil alqi satqisinin merheleleri beh sazisi senedlerin toplanmasi notariat tesdiqi odenis dovlet qeydiyyati ve tehvil qebul muqavile beh notarius dovlet qeydiyyati alqi satqi alqi satqi dasinmaz emlakin alqi satqisi bir imza ile bitmir proses bir nece merheleden ibaretdir ve her birinde tereflerin huquq ve riskleri ferqlidir asagidaki ardicilliq tipik emeliyyati eks etdirir merhele 1 ilkin razilasma ve beh terefler qiymet ve sertler uzre razilasandan sonra alici cox vaxt beh verir mulki mecelleye gore beh yazili formada resmilesdirilmelidir senedde olmalidir tereflerin sexsiyyet melumatlari emlakin unvani ve reyestr nomresi tam satis qiymeti ve behin meblegi esas muqavilenin baglanacagi son tarix tereflerden biri imtina etdikde neticeler beh ve avans ferqi muqavile alicinin teqsiri ile baglanmasa beh saticida qalir saticinin teqsiri ile baglanmasa satici behi ikiqat qaytarir avans ise odenisin bir hissesidir ve eqd bas tutmasa qaytarilir senedde hansi anlayisin islendiyi neticeni deyisir merhele 2 senedlerin toplanmasi satici terefinden adeten teqdim edilir dasinmaz emlakin dovlet reyestrinden cixaris sexsiyyet vesiqesi numayende ucun notarial etibarname er arvadin notarial raziligi nikahdadirsa azyaslinin payi varsa qeyyumluq orqaninin icazesi kommunal xidmetler uzre borcsuzluq arayislari muqavilede ohdelik kimi de yazila biler merhele 3 notariat tesdiqi dasinmaz emlakin alqi satqi muqavilesi notarial qaydada tesdiqlenir notarius tereflerin sexsiyyetini ve fealiyyet qabiliyyetini yoxlayir reyestr uzre mulkiyyet huququnu ve yuklulukleri yoxlayir muqavilenin metnini tereflere izah edir dovlet rusumu ve qanunla nezerde tutulan vergilerin odenilmesini temin edir muqavileni tesdiq edir ve qeydiyyat ucun senedleri reyestr orqanina gonderir etrafli notariat proseduru addim addim merhele 4 odenis en tehlukesiz variant bank vasitesile odenisdir muqavilede qiymetin tam meblegi odenis usulu ve tarixi gosterilmelidir muqavilede real qiymetden asagi mebleg yazmaq alici ucun risklidir mubahise yarandiqda qaytarila bilecek mebleg muqaviledeki reqemle mehdudlasa biler merhele 5 dovlet qeydiyyati alicinin mulkiyyet huququ muqavilenin imzalandigi anda deyil reyestrde qeydiyyata alindigi andan yaranir qeydiyyatdan sonra alicinin adina yeni cixaris verilir cixarisi alana qeder eqdi tam bitmis saymayin merhele 6 tehvil qebul acarlarin saygac gostericilerinin ve emlakin veziyyetinin qeyd olundugu tehvil qebul akti tertib edin saticinin ve aile uzvlerinin yasayis yeri uzre qeydiyyatdan cixmasini yoxlayin kommunal abuneci muqavilelerini oz adiniza kecirin tez tez edilen sehvler beh sifahi razilasma ile verilir subut etmek cetinlesir saticinin er arvadi ve ya diger mulkiyyetciler prosesden kenarda qalir qiymetin bir hissesi qeyri resmi odenilir tehvil tarixi ve qeydiyyatdan cixma ohdeliyi yazilmir','Razılaşmadan mülkiyyət hüququnun qeydiyyatına qədər mənzil alqı-satqısının mərhələləri: beh sazişi, sənədlərin toplanması, notariat təsdiqi, ödəniş, dövlət qeydiyyatı və təhvil-qəbul.','
<p>Daşınmaz əmlakın alqı-satqısı bir imza ilə bitmir. Proses bir neçə mərhələdən ibarətdir və hər birində tərəflərin hüquq və riskləri fərqlidir. Aşağıdakı ardıcıllıq tipik əməliyyatı əks etdirir.</p>

<h2>Mərhələ 1. İlkin razılaşma və beh</h2>
<p>Tərəflər qiymət və şərtlər üzrə razılaşandan sonra alıcı çox vaxt beh verir. Mülki Məcəlləyə görə beh <strong>yazılı formada</strong> rəsmiləşdirilməlidir. Sənəddə olmalıdır:</p>
<ul>
  <li>tərəflərin şəxsiyyət məlumatları;</li>
  <li>əmlakın ünvanı və reyestr nömrəsi;</li>
  <li>tam satış qiyməti və behin məbləği;</li>
  <li>əsas müqavilənin bağlanacağı son tarix;</li>
  <li>tərəflərdən biri imtina etdikdə nəticələr.</li>
</ul>
<p><strong>Beh və avans fərqi:</strong> müqavilə alıcının təqsiri ilə bağlanmasa, beh satıcıda qalır; satıcının təqsiri ilə bağlanmasa, satıcı behi ikiqat qaytarır. Avans isə ödənişin bir hissəsidir və əqd baş tutmasa, qaytarılır. Sənəddə hansı anlayışın işləndiyi nəticəni dəyişir.</p>

<h2>Mərhələ 2. Sənədlərin toplanması</h2>
<p>Satıcı tərəfindən adətən təqdim edilir:</p>
<ul>
  <li>daşınmaz əmlakın dövlət reyestrindən çıxarış;</li>
  <li>şəxsiyyət vəsiqəsi (nümayəndə üçün — notarial etibarnamə);</li>
  <li>ər-arvadın notarial razılığı (nikahdadırsa);</li>
  <li>azyaşlının payı varsa — qəyyumluq orqanının icazəsi;</li>
  <li>kommunal xidmətlər üzrə borcsuzluq arayışları (müqavilədə öhdəlik kimi də yazıla bilər).</li>
</ul>

<h2>Mərhələ 3. Notariat təsdiqi</h2>
<p>Daşınmaz əmlakın alqı-satqı müqaviləsi notarial qaydada təsdiqlənir. Notarius:</p>
<ol>
  <li>tərəflərin şəxsiyyətini və fəaliyyət qabiliyyətini yoxlayır;</li>
  <li>reyestr üzrə mülkiyyət hüququnu və yüklülükləri yoxlayır;</li>
  <li>müqavilənin mətnini tərəflərə izah edir;</li>
  <li>dövlət rüsumu və qanunla nəzərdə tutulan vergilərin ödənilməsini təmin edir;</li>
  <li>müqaviləni təsdiq edir və qeydiyyat üçün sənədləri reyestr orqanına göndərir.</li>
</ol>
<p>Ətraflı: <a href="/bilik-merkezi/notariat-proseduru-addim-addim">Notariat proseduru addım-addım</a>.</p>

<h2>Mərhələ 4. Ödəniş</h2>
<p>Ən təhlükəsiz variant bank vasitəsilə ödənişdir. Müqavilədə qiymətin tam məbləği, ödəniş üsulu və tarixi göstərilməlidir. Müqavilədə real qiymətdən aşağı məbləğ yazmaq alıcı üçün risklidir: mübahisə yarandıqda qaytarıla biləcək məbləğ müqavilədəki rəqəmlə məhdudlaşa bilər.</p>

<h2>Mərhələ 5. Dövlət qeydiyyatı</h2>
<p>Alıcının mülkiyyət hüququ müqavilənin imzalandığı anda deyil, <strong>reyestrdə qeydiyyata alındığı andan</strong> yaranır. Qeydiyyatdan sonra alıcının adına yeni çıxarış verilir. Çıxarışı alana qədər əqdi tam bitmiş saymayın.</p>

<h2>Mərhələ 6. Təhvil-qəbul</h2>
<ul>
  <li>Açarların, sayğac göstəricilərinin və əmlakın vəziyyətinin qeyd olunduğu təhvil-qəbul aktı tərtib edin.</li>
  <li>Satıcının və ailə üzvlərinin yaşayış yeri üzrə qeydiyyatdan çıxmasını yoxlayın.</li>
  <li>Kommunal abunəçi müqavilələrini öz adınıza keçirin.</li>
</ul>

<h2>Tez-tez edilən səhvlər</h2>
<ul>
  <li>Beh şifahi razılaşma ilə verilir — sübut etmək çətinləşir.</li>
  <li>Satıcının ər-arvadı və ya digər mülkiyyətçilər prosesdən kənarda qalır.</li>
  <li>Qiymətin bir hissəsi «qeyri-rəsmi» ödənilir.</li>
  <li>Təhvil tarixi və qeydiyyatdan çıxma öhdəliyi yazılmır.</li>
</ul>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'BUYER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","«Notariat haqqında» Azərbaycan Respublikasının Qanunu","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/107","https://e-qanun.az/framework/5456","https://emlak.gov.az/az"]','["müqavilə","beh","notarius","dövlət qeydiyyatı","alqı-satqı"]',2,1,0,'Mənzil alqı-satqısında müqavilə mərhələləri: behdən çıxarışa qədər',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_alici-ve-satici-ucun-riskler','alici-ve-satici-ucun-riskler','Alıcı və satıcı üçün risklər: ən çox rast gəlinən hallar və qorunma yolları','alici ve satici ucun riskler en cox rast gelinen hallar ve qorunma yollari ikiqat satis etibarname ile firildaq gizli yukluluk odenisin alinmamasi verese iddialari alqi satqida her iki terefin uzlesdiyi riskleri ve onlarin qarsisini almaq ucun praktiki addimlar riskler beh etibarname yukluluk alqi satqi alqi satqi riskler tekce aliciya aid deyil satici da odenisi ala bilmemek uzanan mubahise ve vergi problemleri ile uzlese biler her riskin qarsisinda onu azaldan konkret addim var alici ucun esas riskler risk nece bas verir nece qorunmali satici mulkiyyetci deyil saxta sened basqasinin adina olan emlak cixarisin esli reyestr yoxlamasi notarial tesdiq etibarname ile firildaq etibarname legv edilib ve ya saxtadir pul numayendede qalir etibarnameni veren notariusla yoxlamaq pulu birbasa mulkiyyetcinin hesabina kocurmek gizli yukluluk ipoteka hebs qadaga eqdden evvel reyestr yoxlamasi ipotekada bankla birge baglanis ikiqat satis ve ya beh satici eyni emlak ucun bir nece alicidan beh alir yazili beh sazisi qisa muddet bank kocurmesi verese ve ya er arvad iddiasi raziligi alinmamis sexs sonradan eqde etiraz edir butun mulkiyyetciler ve er arvadin notarial raziligi qeydiyyatda qalan sexsler kecmis sakinler menzilde qeydiyyatda qalir muqavilede qeydiyyatdan cixma muddeti ve sanksiya kommunal borclar borc emlakla birlikde qalir borcsuzluq arayislari son hesablasmanin akta yazilmasi cixarissiz emlak yalniz mtk muqavilesi ve ya ilkin muqavile var huquqi riskleri ayrica qiymetlendirmek ipoteka imkanini yoxlamaq satici ucun esas riskler odenisin alinmamasi ve ya gecikmesi qeydiyyatdan sonra alici odenisi yubadirsa mehkemeye muraciet etmek lazim gelir cixis yolu odenisi notarial tesdiq aninda bank vasitesile tamamlamaq saxta pul ve nagd hesablasma riski boyuk meblegin nagd odenisi hem tehlukesizlik hem subut baximindan risklidir behin esassiz teleb edilmesi alici ipoteka ala bilmedikde behin qaytarilmasini teleb edir beh sazisinde bu hal evvelceden yazilmalidir vergi ohdeliyi emlakin satisi zamani qanunla nezerde tutulan vergi notarial tesdiq zamani odenilir azadolma sertlerini evvelceden oyrenin etrafli dovlet rusumlari ve emeliyyat xercleri emlakin veziyyeti ile bagli iddialar satici bildiyi ciddi qusuru gizledirse alici sonradan teleb ireli sure biler qusurlari aciq yazmaq ve tehvil qebul aktinda qeyd etmek her iki terefi qoruyur her iki teref ucun universal qaydalar butun razilasmalari yazili formada resmilesdirin odenisi bank vasitesile aparin ve meqsedini qeyd edin muqavilede real qiymeti gosterin etibarname ile isleyirsinizse esas mulkiyyetci ile birbasa elaqe saxlayin subheli telesdirme ve bu gun beh vermeseniz satilacaq tezyiqine boyun eymeyin saxta elanlar ve firildaq sxemleri barede saxta ve yaniltici elanlari nece tanimaq olar','İkiqat satış, etibarnamə ilə fırıldaq, gizli yüklülük, ödənişin alınmaması, vərəsə iddiaları — alqı-satqıda hər iki tərəfin üzləşdiyi riskləri və onların qarşısını almaq üçün praktiki addımlar.','
<p>Risklər təkcə alıcıya aid deyil — satıcı da ödənişi ala bilməmək, uzanan mübahisə və vergi problemləri ilə üzləşə bilər. Hər riskin qarşısında onu azaldan konkret addım var.</p>

<h2>Alıcı üçün əsas risklər</h2>
<table>
  <thead><tr><th>Risk</th><th>Necə baş verir</th><th>Necə qorunmalı</th></tr></thead>
  <tbody>
    <tr><td>Satıcı mülkiyyətçi deyil</td><td>Saxta sənəd, başqasının adına olan əmlak</td><td>Çıxarışın əsli, reyestr yoxlaması, notarial təsdiq</td></tr>
    <tr><td>Etibarnamə ilə fırıldaq</td><td>Etibarnamə ləğv edilib və ya saxtadır, pul nümayəndədə qalır</td><td>Etibarnaməni verən notariusla yoxlamaq, pulu birbaşa mülkiyyətçinin hesabına köçürmək</td></tr>
    <tr><td>Gizli yüklülük</td><td>İpoteka, həbs, qadağa</td><td>Əqddən əvvəl reyestr yoxlaması; ipotekada bankla birgə bağlanış</td></tr>
    <tr><td>İkiqat satış və ya beh</td><td>Satıcı eyni əmlak üçün bir neçə alıcıdan beh alır</td><td>Yazılı beh sazişi, qısa müddət, bank köçürməsi</td></tr>
    <tr><td>Vərəsə və ya ər-arvad iddiası</td><td>Razılığı alınmamış şəxs sonradan əqdə etiraz edir</td><td>Bütün mülkiyyətçilər və ər-arvadın notarial razılığı</td></tr>
    <tr><td>Qeydiyyatda qalan şəxslər</td><td>Keçmiş sakinlər mənzildə qeydiyyatda qalır</td><td>Müqavilədə qeydiyyatdan çıxma müddəti və sanksiya</td></tr>
    <tr><td>Kommunal borclar</td><td>Borc əmlakla birlikdə «qalır»</td><td>Borcsuzluq arayışları, son hesablaşmanın akta yazılması</td></tr>
    <tr><td>Çıxarışsız əmlak</td><td>Yalnız MTK müqaviləsi və ya ilkin müqavilə var</td><td>Hüquqi riskləri ayrıca qiymətləndirmək, ipoteka imkanını yoxlamaq</td></tr>
  </tbody>
</table>

<h2>Satıcı üçün əsas risklər</h2>
<ul>
  <li><strong>Ödənişin alınmaması və ya gecikməsi.</strong> Qeydiyyatdan sonra alıcı ödənişi yubadırsa, məhkəməyə müraciət etmək lazım gəlir. Çıxış yolu — ödənişi notarial təsdiq anında bank vasitəsilə tamamlamaq.</li>
  <li><strong>Saxta pul və nağd hesablaşma riski.</strong> Böyük məbləğin nağd ödənişi həm təhlükəsizlik, həm sübut baxımından risklidir.</li>
  <li><strong>Behin əsassız tələb edilməsi.</strong> Alıcı ipoteka ala bilmədikdə behin qaytarılmasını tələb edir. Beh sazişində bu hal əvvəlcədən yazılmalıdır.</li>
  <li><strong>Vergi öhdəliyi.</strong> Əmlakın satışı zamanı qanunla nəzərdə tutulan vergi notarial təsdiq zamanı ödənilir; azadolma şərtlərini əvvəlcədən öyrənin. Ətraflı: <a href="/bilik-merkezi/dovlet-rusumlari-ve-emeliyyat-xercleri">Dövlət rüsumları və əməliyyat xərcləri</a>.</li>
  <li><strong>Əmlakın vəziyyəti ilə bağlı iddialar.</strong> Satıcı bildiyi ciddi qüsuru gizlədirsə, alıcı sonradan tələb irəli sürə bilər. Qüsurları açıq yazmaq və təhvil-qəbul aktında qeyd etmək hər iki tərəfi qoruyur.</li>
</ul>

<h2>Hər iki tərəf üçün universal qaydalar</h2>
<ol>
  <li>Bütün razılaşmaları yazılı formada rəsmiləşdirin.</li>
  <li>Ödənişi bank vasitəsilə aparın və məqsədini qeyd edin.</li>
  <li>Müqavilədə real qiyməti göstərin.</li>
  <li>Etibarnamə ilə işləyirsinizsə, əsas mülkiyyətçi ilə birbaşa əlaqə saxlayın.</li>
  <li>Şübhəli tələsdirmə və «bu gün beh verməsəniz, satılacaq» təzyiqinə boyun əyməyin.</li>
</ol>
<p>Saxta elanlar və fırıldaq sxemləri barədə: <a href="/bilik-merkezi/saxta-ve-yaniltici-elanlari-tanimaq">Saxta və yanıltıcı elanları necə tanımaq olar</a>.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'BUYER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456","https://e-qanun.az/framework/107"]','["risklər","beh","etibarnamə","yüklülük","alqı-satqı"]',2,0,0,NULL,NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_menzil-satisina-hazirliq','menzil-satisina-hazirliq','Mənzil satışına hazırlıq: sənədlər, qiymət, elan və təhvil','menzil satisina hazirliq senedler qiymet elan ve tehvil emlakini satmaq isteyenler ucun addim addim plan senedlerin qaydaya salinmasi borclarin baglanmasi bazar qiymetinin mueyyen edilmesi celbedici elan baxislar danisiqlar ve eqdin baglanmasi satis elan bazar qiymeti cixaris muqavile emlak satisi emlak ne qeder tez ve ne qeder yaxsi qiymete satilir bu esasen elan yerlesdirilmezden evvel gorulen hazirliqdan asilidir senedi qaydasinda olmayan qiymeti bazardan yuksek qoyulan ve ya fotolari zeif olan menzil aylarla satilmir 1 senedleri qaydaya salin cixaris oz adiniza olmali ve reyestrdeki melumat sahe unvan real veziyyetle uygun gelmelidir yenidenplanlasdirma edilibse senedlerde eks olunmayan deyisiklikler alici ve bank ucun problem yaradir mulkiyyetciler bir nece neferdirse hamisinin raziligini evvelceden alin xaricde yasayan mulkiyyetci ucun etibarname hazirlayin er arvadin raziligi teleb olunursa notarial qaydada hazirlayin yukluluk ipoteka ve s varsa baglanis planini bankla razilasdirin qeydiyyatda olan sexsler satisdan sonra qeydiyyatdan cixma plani olsun 2 borclari baglayin isiq qaz su bina xidmeti ve emlak vergisi uzre borclari odeyin ve arayislari saxlayin bu aliciya etibar verir ve danisiqlarda endirim telebinin qarsisini alir 3 duzgun qiymet secin qiymet hedden artiq yuksek olanda elan kohnelir alicilar onu otub kecir ve sonda bazardan asagi qiymete satmaq lazim gelir qiymeti mueyyen etmek ucun eyni binada ve yaxin erazide oxsar menzillerin 1 m2 qiymetine baxin yalniz elan qiymetine deyil real satis qiymetine agentlik notarius qiymetlendirici diqqet edin mertebe temir gorunus sened statusu kimi amillere duzelis edin etrafli emlakin real bazar qiymetinin mueyyen edilmesi saytda evimi qiymetlendir aleti ile ilkin texmin de ala bilersiniz 4 menzili teqdimata hazirlayin artiq esyalari yigisdirin bos ve isiqli otaq daha boyuk gorunur kicik qusurlari aradan qaldirin axan kran qiriq acar cat pesekar ve ya en azi gunduz isiginda cekilmis foto elanin en vacib hissesidir 5 elani duzgun tertib edin yaxsi elanda sahe otaq sayi mertebe binanin novu temir sened statusu ve deqiq erazi gosterilir yanlis ve ya natamam melumat baxislara vaxt itkisi demekdir etrafli emlak elaninda hansi melumatlar mutleq gosterilmelidir 6 baxislar ve danisiqlar baxislari bir birine yaxin vaxtlara planlasdirin maraq gorunende alici daha tez qerar verir endirim ucun asagi heddi evvelceden mueyyenlesdirin behi yalniz yazili sazisle qebul edin alici ipoteka ile alirsa bankin tesdiq muddetini sazisde nezere alin 7 eqd ve tehvil notariat tesdiqi odenis qeydiyyat ve tehvil ardicilligi muqavile merheleleri beledcisinde izah olunub satici ucun esas qayda emlaki odenis tam alinmadan tehvil vermeyin vergi barede qeyd fiziki sexsin emlak satisindan elde etdiyi gelir vergi mecellesine esasen vergiye celb oluna biler mueyyen hallarda meselen uzun muddet yasayis yeri kimi istifade edilen menzil azadolma nezerde tutulub deqiq meblegi ve azadolma sertlerini notariusdan ve dovlet vergi xidmetinden oyrenin','Əmlakını satmaq istəyənlər üçün addım-addım plan: sənədlərin qaydaya salınması, borcların bağlanması, bazar qiymətinin müəyyən edilməsi, cəlbedici elan, baxışlar, danışıqlar və əqdin bağlanması.','
<p>Əmlak nə qədər tez və nə qədər yaxşı qiymətə satılır — bu, əsasən elan yerləşdirilməzdən əvvəl görülən hazırlıqdan asılıdır. Sənədi qaydasında olmayan, qiyməti bazardan yüksək qoyulan və ya fotoları zəif olan mənzil aylarla satılmır.</p>

<h2>1. Sənədləri qaydaya salın</h2>
<ul>
  <li><strong>Çıxarış</strong> öz adınıza olmalı və reyestrdəki məlumat (sahə, ünvan) real vəziyyətlə uyğun gəlməlidir.</li>
  <li><strong>Yenidənplanlaşdırma</strong> edilibsə, sənədlərdə əks olunmayan dəyişikliklər alıcı və bank üçün problem yaradır.</li>
  <li><strong>Mülkiyyətçilər</strong> bir neçə nəfərdirsə, hamısının razılığını əvvəlcədən alın. Xaricdə yaşayan mülkiyyətçi üçün etibarnamə hazırlayın.</li>
  <li><strong>Ər-arvadın razılığı</strong> tələb olunursa, notarial qaydada hazırlayın.</li>
  <li><strong>Yüklülük</strong> (ipoteka və s.) varsa, bağlanış planını bankla razılaşdırın.</li>
  <li><strong>Qeydiyyatda olan şəxslər</strong> — satışdan sonra qeydiyyatdan çıxma planı olsun.</li>
</ul>

<h2>2. Borcları bağlayın</h2>
<p>İşıq, qaz, su, bina xidməti və əmlak vergisi üzrə borcları ödəyin və arayışları saxlayın. Bu, alıcıya etibar verir və danışıqlarda endirim tələbinin qarşısını alır.</p>

<h2>3. Düzgün qiymət seçin</h2>
<p>Qiymət həddən artıq yüksək olanda elan «köhnəlir», alıcılar onu ötüb keçir və sonda bazardan aşağı qiymətə satmaq lazım gəlir. Qiyməti müəyyən etmək üçün:</p>
<ul>
  <li>eyni binada və yaxın ərazidə oxşar mənzillərin 1 m² qiymətinə baxın;</li>
  <li>yalnız elan qiymətinə deyil, real satış qiymətinə (agentlik, notarius, qiymətləndirici) diqqət edin;</li>
  <li>mərtəbə, təmir, görünüş, sənəd statusu kimi amillərə düzəliş edin.</li>
</ul>
<p>Ətraflı: <a href="/bilik-merkezi/emlakin-real-bazar-qiymetinin-mueyyen-edilmesi">Əmlakın real bazar qiymətinin müəyyən edilməsi</a>. Saytda «Evimi qiymətləndir» aləti ilə ilkin təxmin də ala bilərsiniz.</p>

<h2>4. Mənzili təqdimata hazırlayın</h2>
<ul>
  <li>Artıq əşyaları yığışdırın — boş və işıqlı otaq daha böyük görünür.</li>
  <li>Kiçik qüsurları aradan qaldırın: axan kran, qırıq açar, çat.</li>
  <li>Peşəkar və ya ən azı gündüz işığında çəkilmiş foto — elanın ən vacib hissəsidir.</li>
</ul>

<h2>5. Elanı düzgün tərtib edin</h2>
<p>Yaxşı elanda sahə, otaq sayı, mərtəbə, binanın növü, təmir, sənəd statusu və dəqiq ərazi göstərilir. Yanlış və ya natamam məlumat baxışlara vaxt itkisi deməkdir. Ətraflı: <a href="/blog/emlak-elaninda-hansi-melumatlar-mutleq-gosterilmelidir">Əmlak elanında hansı məlumatlar mütləq göstərilməlidir?</a></p>

<h2>6. Baxışlar və danışıqlar</h2>
<ul>
  <li>Baxışları bir-birinə yaxın vaxtlara planlaşdırın — maraq görünəndə alıcı daha tez qərar verir.</li>
  <li>Endirim üçün aşağı həddi əvvəlcədən müəyyənləşdirin.</li>
  <li>Behi yalnız yazılı sazişlə qəbul edin; alıcı ipoteka ilə alırsa, bankın təsdiq müddətini sazişdə nəzərə alın.</li>
</ul>

<h2>7. Əqd və təhvil</h2>
<p>Notariat təsdiqi, ödəniş, qeydiyyat və təhvil ardıcıllığı <a href="/bilik-merkezi/menzil-alqi-satqisinda-muqavile-merheleleri">müqavilə mərhələləri</a> bələdçisində izah olunub. Satıcı üçün əsas qayda: əmlakı ödəniş tam alınmadan təhvil verməyin.</p>

<h2>Vergi barədə qeyd</h2>
<p>Fiziki şəxsin əmlak satışından əldə etdiyi gəlir Vergi Məcəlləsinə əsasən vergiyə cəlb oluna bilər; müəyyən hallarda (məsələn, uzun müddət yaşayış yeri kimi istifadə edilən mənzil) azadolma nəzərdə tutulub. Dəqiq məbləği və azadolma şərtlərini notariusdan və Dövlət Vergi Xidmətindən öyrənin.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='satis'),'SELLER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","Azərbaycan Respublikasının Vergi Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46948","https://e-qanun.az/framework/5456","https://www.taxes.gov.az/az"]','["satış","elan","bazar qiyməti","çıxarış","müqavilə"]',2,1,0,'Mənzil satışına hazırlıq: sənədlər, qiymət, elan və təhvil',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_cixarisin-ve-huquqi-senedlerin-yoxlanilmasi','cixarisin-ve-huquqi-senedlerin-yoxlanilmasi','Çıxarışın və digər hüquqi sənədlərin yoxlanılması','cixarisin ve diger huquqi senedlerin yoxlanilmasi dasinmaz emlakin dovlet reyestrinden cixarisda neye baxmali yukluluyu nece yoxlamali etibarname vereselik sehadetnamesi ilkin muqavile ve mtk senedlerinde hansi riskler var praktiki izah cixaris kupca yukluluk etibarname mtk notarius qeydiyyat ve notariat azerbaycanda dasinmaz emlaka mulkiyyet huququ dovlet reyestrinde qeydiyyat anindan yaranir reyestr iqtisadiyyat nazirliyi yaninda emlak meseleleri dovlet xidmeti emdx terefinden aparilir ve huququ tesdiq eden sened dasinmaz emlakin dovlet reyestrinden cixarisdir cixarisda neye baxmali sahe ne yoxlanir reyestr nomresi her emlakin unikal nomresi diger senedlerde eyni olmalidir unvan faktiki unvanla bina menzil nomresi uygunluq sahe umumi ve yasayis sahesi elandaki reqemle eynidirmi mulkiyyetci ler saticinin adi payli mulkiyyetde her kesin payi huququn esasi alqi satqi bagislama vereselik ozellesdirme ve s mehdudiyyetler ipoteka hebs qadaga ve diger yuklulukler cixarisdaki melumat kecmise aiddir sened verildikden sonra emlak uzerinde hebs qoyula ve ya ipoteka qeyde alina biler buna gore son veziyyeti eqd gunu notarius reyestr uzre yoxlayir emdx nin elektron xidmetler portali ve asan xidmet merkezleri vasitesile emlak barede melumat almaq imkanlari movcuddur xidmetin terkibini ve teleb olunan raziliqlari portalda deqiqlesdirin yukluluk nedir ve niye tehlukelidir ipoteka emlak bank kreditinin teminatidir kredit baglanmayinca bank emlak uzerinde huququnu saxlayir hebs mehkeme ve ya icra orqaninin qerari ile emlakin ozgeninkilesdirilmesine qadaga qadaga notarius ve ya diger selahiyyetli orqan terefinden qoyulan mehdudiyyet icare kiraye uzunmuddetli icare yeni mulkiyyetci ucun de quvvede qala biler yukluluklu emlakin alisi mumkundur lakin yalniz yukluluyun aradan qaldirilmasi mexanizmi meselen bankin istiraki ile kreditin baglanmasi evvelceden razilasdirildiqda diger senedler etibarname notarial qaydada tesdiqlenmelidir eslini gorun selahiyyetler mehz bu emlaki satmaq ve pulu almaq huququ yazilibmi muddet bitmeyibmi legv edilmeyibmi etibarnameni tesdiq eden notariusla yoxlamaq olar mumkunse mulkiyyetci ile birbasa video zeng de olsa elaqe saxlayin ve odenisi onun hesabina kocurun vereselik sehadetnamesi vereselik yolu ile kecen emlakda veresenin huququ da reyestrde qeyde alinmalidir diger vereselerin paylari mecburi paya malik sexsler ve mirasin qebul muddetleri ile bagli riskleri notariusla muzakire edin ilkin muqavile ve mtk senedleri yeni tikilide tez tez yalniz tikintici ile baglanmis ilkin muqavile ve ya menzil tikinti kooperativinin mtk uzvluk senedleri olur bu senedler mulkiyyet huququ yaratmir huquq cixaris verildikden sonra yaranir bele emlakin alisi daha yuksek risk dasiyir ve ipoteka ucun adeten qebul edilmir texniki pasport ve plan menzilin plani ile real veziyyeti muqayise edin senedlesdirilmemis yenidenplanlasdirma sonraki satisi ve ipotekani cetinlesdirir saticiya verilmeli suallar emlak size nece kecib ve ne vaxtdan mulkiyyetinizdedir nikahdasinizmi emlak nikah dovrunde alinibmi emlakda azyaslinin payi ve ya qeydiyyatda olan azyasli varmi kredit hebs mehkeme mubahisesi varmi kimler yasayis yeri uzre qeydiyyatdadir ve ne vaxt cixacaqlar cavablar senedlerle tesdiqlenmelidir sifahi zemanet kifayet deyil','Daşınmaz əmlakın dövlət reyestrindən çıxarışda nəyə baxmalı, yüklülüyü necə yoxlamalı, etibarnamə, vərəsəlik şəhadətnaməsi, ilkin müqavilə və MTK sənədlərində hansı risklər var — praktiki izah.','
<p>Azərbaycanda daşınmaz əmlaka mülkiyyət hüququ dövlət reyestrində qeydiyyat anından yaranır. Reyestr İqtisadiyyat Nazirliyi yanında Əmlak Məsələləri Dövlət Xidməti (ƏMDX) tərəfindən aparılır və hüququ təsdiq edən sənəd <strong>daşınmaz əmlakın dövlət reyestrindən çıxarışdır</strong>.</p>

<h2>Çıxarışda nəyə baxmalı</h2>
<table>
  <thead><tr><th>Sahə</th><th>Nə yoxlanır</th></tr></thead>
  <tbody>
    <tr><td>Reyestr nömrəsi</td><td>Hər əmlakın unikal nömrəsi — digər sənədlərdə eyni olmalıdır</td></tr>
    <tr><td>Ünvan</td><td>Faktiki ünvanla (bina, mənzil nömrəsi) uyğunluq</td></tr>
    <tr><td>Sahə</td><td>Ümumi və yaşayış sahəsi elandakı rəqəmlə eynidirmi?</td></tr>
    <tr><td>Mülkiyyətçi(lər)</td><td>Satıcının adı, paylı mülkiyyətdə hər kəsin payı</td></tr>
    <tr><td>Hüququn əsası</td><td>Alqı-satqı, bağışlama, vərəsəlik, özəlləşdirmə və s.</td></tr>
    <tr><td>Məhdudiyyətlər</td><td>İpoteka, həbs, qadağa və digər yüklülüklər</td></tr>
  </tbody>
</table>
<p>Çıxarışdakı məlumat keçmişə aiddir — sənəd verildikdən sonra əmlak üzərində həbs qoyula və ya ipoteka qeydə alına bilər. Buna görə son vəziyyəti əqd günü notarius reyestr üzrə yoxlayır. ƏMDX-nin elektron xidmətlər portalı və ASAN xidmət mərkəzləri vasitəsilə əmlak barədə məlumat almaq imkanları mövcuddur; xidmətin tərkibini və tələb olunan razılıqları portalda dəqiqləşdirin.</p>

<h2>Yüklülük nədir və niyə təhlükəlidir</h2>
<ul>
  <li><strong>İpoteka</strong> — əmlak bank kreditinin təminatıdır. Kredit bağlanmayınca bank əmlak üzərində hüququnu saxlayır.</li>
  <li><strong>Həbs</strong> — məhkəmə və ya icra orqanının qərarı ilə əmlakın özgəninkiləşdirilməsinə qadağa.</li>
  <li><strong>Qadağa</strong> — notarius və ya digər səlahiyyətli orqan tərəfindən qoyulan məhdudiyyət.</li>
  <li><strong>İcarə (kirayə)</strong> — uzunmüddətli icarə yeni mülkiyyətçi üçün də qüvvədə qala bilər.</li>
</ul>
<p>Yüklülüklü əmlakın alışı mümkündür, lakin yalnız yüklülüyün aradan qaldırılması mexanizmi (məsələn, bankın iştirakı ilə kreditin bağlanması) əvvəlcədən razılaşdırıldıqda.</p>

<h2>Digər sənədlər</h2>
<h3>Etibarnamə</h3>
<ul>
  <li>Notarial qaydada təsdiqlənməlidir; əslini görün.</li>
  <li>Səlahiyyətlər: məhz bu əmlakı satmaq və pulu almaq hüququ yazılıbmı?</li>
  <li>Müddət bitməyibmi, ləğv edilməyibmi? Etibarnaməni təsdiq edən notariusla yoxlamaq olar.</li>
  <li>Mümkünsə, mülkiyyətçi ilə birbaşa (video zəng də olsa) əlaqə saxlayın və ödənişi onun hesabına köçürün.</li>
</ul>
<h3>Vərəsəlik şəhadətnaməsi</h3>
<p>Vərəsəlik yolu ilə keçən əmlakda vərəsənin hüququ da reyestrdə qeydə alınmalıdır. Digər vərəsələrin payları, məcburi paya malik şəxslər və mirasın qəbul müddətləri ilə bağlı riskləri notariusla müzakirə edin.</p>
<h3>İlkin müqavilə və MTK sənədləri</h3>
<p>Yeni tikilidə tez-tez yalnız tikintiçi ilə bağlanmış ilkin müqavilə və ya mənzil-tikinti kooperativinin (MTK) üzvlük sənədləri olur. Bu sənədlər mülkiyyət hüququ yaratmır — hüquq çıxarış verildikdən sonra yaranır. Belə əmlakın alışı daha yüksək risk daşıyır və ipoteka üçün adətən qəbul edilmir.</p>
<h3>Texniki pasport və plan</h3>
<p>Mənzilin planı ilə real vəziyyəti müqayisə edin. Sənədləşdirilməmiş yenidənplanlaşdırma sonrakı satışı və ipotekanı çətinləşdirir.</p>

<h2>Satıcıya verilməli suallar</h2>
<ol>
  <li>Əmlak sizə necə keçib və nə vaxtdan mülkiyyətinizdədir?</li>
  <li>Nikahdasınızmı, əmlak nikah dövründə alınıbmı?</li>
  <li>Əmlakda azyaşlının payı və ya qeydiyyatda olan azyaşlı varmı?</li>
  <li>Kredit, həbs, məhkəmə mübahisəsi varmı?</li>
  <li>Kimlər yaşayış yeri üzrə qeydiyyatdadır və nə vaxt çıxacaqlar?</li>
</ol>
<p>Cavablar sənədlərlə təsdiqlənməlidir; şifahi zəmanət kifayət deyil.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Mülki Məcəlləsi","«Notariat haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Ailə Məcəlləsi"]','["https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46944","https://e-qanun.az/framework/107","https://emlak.gov.az/az","https://e-emlak.gov.az/"]','["çıxarış","kupça","yüklülük","etibarnamə","MTK","notarius"]',2,1,0,'Çıxarışın və digər hüquqi sənədlərin yoxlanılması',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_emlakin-huquqi-tarixcesinin-yoxlanilmasi','emlakin-huquqi-tarixcesinin-yoxlanilmasi','Əmlakın hüquqi tarixçəsinin yoxlanılması','emlakin huquqi tarixcesinin yoxlanilmasi emlak evveller kime mexsus olub nece el deyisib mubahise ve verese iddiasi ehtimali varmi huquqi tarixceni yoxlamagin usullari ve tehluke siqnallari huquqi tarixce cixaris vereselik riskler qeydiyyat ve notariat cixaris bu gunku mulkiyyetcini gosterir amma emlakin kecmisi de ehemiyyetlidir evvelki eqdlerden biri mubahiselidirse bu gun baglanan muqavile de risk altina duse biler tarixce yoxlamasi xususile vereselik bagislama ve etibarname ile kecmis emlaklarda vacibdir neyi oyrenmelisiniz huququn esasi saticiya emlak hansi senedle kecib muqavile vereselik sehadetnamesi bagislama mehkeme qerari el deyisme tezliyi qisa muddetde bir nece defe satilmis emlak tehluke siqnalidir saxta eqdler zenciri ile temiz alici yaratmaga cehd ola biler mulkiyyetcilerin terkibi evveller payli mulkiyyet olubsa butun paylarin saticiya qanuni kecdiyini yoxlayin ozellesdirme ozellesdirme zamani aile uzvlerinin istirak huququ olub olmadigini oyrenin tehluke siqnallari siqnal niye riskdir miras yaxin vaxtlarda acilib diger vereseler o cumleden mecburi paya malik sexsler iddia qaldira biler emlak bagislama ile alinib ve tez satilir bagislayanin aile uzvleri ve ya kreditorlari etiraz ede biler satis etibarname ile mulkiyyetci elcatmazdir etibarname legv edilmis ve ya saxta ola biler qiymet bazardan xeyli asagidir telesik satis sebebi gizledile biler borc mubahise satici nikahdadir amma heyat yoldasi prosesde yoxdur birge mulkiyyet huququ pozula biler emlakda mehkeme mubahisesi var qerar alicinin eleyhine ola biler yoxlama usullari senedlerin suretlerini isteyin saticinin huquq esasi olan muqavile ve ya sehadetname notariusla meslehetlesin notarius reyestr melumatlarini ve eqdin qanuniliyini yoxlayir mehkeme mubahiselerini sorusun saticidan yazili beyan alin ki emlak uzre mubahise yoxdur bu beyan muqavileye de daxil edile biler qonsu ve idareetme ile danisin emlakda kim yasayib mubahiseler olubmu huquqsunasa muraciet edin vereselik ve ya murekkeb mulkiyyet tarixcesi olan emlakda musteqil huquqi rey xerce deyer muqavileye elave edile bilecek qoruyucu muddealar saticinin emlakin mubahisesiz yukluluksuz ve ucuncu sexslerin huquqlarindan azad olmasi barede zemaneti bu zemanet pozulduqda odenilmis meblegin ve zererin qaytarilmasi ohdeliyi qeydiyyatda olan sexslerin cixma muddeti','Əmlak əvvəllər kimə məxsus olub, necə əl dəyişib, mübahisə və vərəsə iddiası ehtimalı varmı? Hüquqi tarixçəni yoxlamağın üsulları və təhlükə siqnalları.','
<p>Çıxarış bu günkü mülkiyyətçini göstərir, amma əmlakın keçmişi də əhəmiyyətlidir: əvvəlki əqdlərdən biri mübahisəlidirsə, bu gün bağlanan müqavilə də risk altına düşə bilər. Tarixçə yoxlaması xüsusilə vərəsəlik, bağışlama və etibarnamə ilə keçmiş əmlaklarda vacibdir.</p>

<h2>Nəyi öyrənməlisiniz</h2>
<ul>
  <li><strong>Hüququn əsası:</strong> satıcıya əmlak hansı sənədlə keçib? Müqavilə, vərəsəlik şəhadətnaməsi, bağışlama, məhkəmə qərarı?</li>
  <li><strong>Əl dəyişmə tezliyi:</strong> qısa müddətdə bir neçə dəfə satılmış əmlak təhlükə siqnalıdır — saxta əqdlər zənciri ilə «təmiz» alıcı yaratmağa cəhd ola bilər.</li>
  <li><strong>Mülkiyyətçilərin tərkibi:</strong> əvvəllər paylı mülkiyyət olubsa, bütün payların satıcıya qanuni keçdiyini yoxlayın.</li>
  <li><strong>Özəlləşdirmə:</strong> özəlləşdirmə zamanı ailə üzvlərinin iştirak hüququ olub-olmadığını öyrənin.</li>
</ul>

<h2>Təhlükə siqnalları</h2>
<table>
  <thead><tr><th>Siqnal</th><th>Niyə riskdir</th></tr></thead>
  <tbody>
    <tr><td>Miras yaxın vaxtlarda açılıb</td><td>Digər vərəsələr, o cümlədən məcburi paya malik şəxslər iddia qaldıra bilər</td></tr>
    <tr><td>Əmlak bağışlama ilə alınıb və tez satılır</td><td>Bağışlayanın ailə üzvləri və ya kreditorları etiraz edə bilər</td></tr>
    <tr><td>Satış etibarnamə ilə, mülkiyyətçi əlçatmazdır</td><td>Etibarnamə ləğv edilmiş və ya saxta ola bilər</td></tr>
    <tr><td>Qiymət bazardan xeyli aşağıdır</td><td>Tələsik satış səbəbi gizlədilə bilər (borc, mübahisə)</td></tr>
    <tr><td>Satıcı nikahdadır, amma həyat yoldaşı prosesdə yoxdur</td><td>Birgə mülkiyyət hüququ pozula bilər</td></tr>
    <tr><td>Əmlakda məhkəmə mübahisəsi var</td><td>Qərar alıcının əleyhinə ola bilər</td></tr>
  </tbody>
</table>

<h2>Yoxlama üsulları</h2>
<ol>
  <li><strong>Sənədlərin surətlərini istəyin:</strong> satıcının hüquq əsası olan müqavilə və ya şəhadətnamə.</li>
  <li><strong>Notariusla məsləhətləşin:</strong> notarius reyestr məlumatlarını və əqdin qanuniliyini yoxlayır.</li>
  <li><strong>Məhkəmə mübahisələrini soruşun:</strong> satıcıdan yazılı bəyan alın ki, əmlak üzrə mübahisə yoxdur; bu bəyan müqaviləyə də daxil edilə bilər.</li>
  <li><strong>Qonşu və idarəetmə ilə danışın:</strong> əmlakda kim yaşayıb, mübahisələr olubmu?</li>
  <li><strong>Hüquqşünasa müraciət edin:</strong> vərəsəlik və ya mürəkkəb mülkiyyət tarixçəsi olan əmlakda müstəqil hüquqi rəy xərcə dəyər.</li>
</ol>

<h2>Müqaviləyə əlavə edilə biləcək qoruyucu müddəalar</h2>
<ul>
  <li>Satıcının əmlakın mübahisəsiz, yüklülüksüz və üçüncü şəxslərin hüquqlarından azad olması barədə zəmanəti.</li>
  <li>Bu zəmanət pozulduqda ödənilmiş məbləğin və zərərin qaytarılması öhdəliyi.</li>
  <li>Qeydiyyatda olan şəxslərin çıxma müddəti.</li>
</ul>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'BUYER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Mülki Məcəlləsi","Azərbaycan Respublikasının Ailə Məcəlləsi"]','["https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46946","https://emlak.gov.az/az"]','["hüquqi tarixçə","çıxarış","vərəsəlik","risklər"]',1,0,0,'Əmlakın hüquqi tarixçəsinin yoxlanılması','Əmlak əvvəllər kimə məxsus olub, necə əl dəyişib, mübahisə və vərəsə iddiası ehtimalı varmı? Hüquqi tarixçəni yoxlamağın üsulları və təhlükə siqnalları.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_notariat-proseduru-addim-addim','notariat-proseduru-addim-addim','Notariat prosedurları: alqı-satqının notarial təsdiqi addım-addım','notariat prosedurlari alqi satqinin notarial tesdiqi addim addim notariusa hansi senedlerle getmek lazimdir notarius neyi yoxlayir xercleri kim odeyir eqdden sonra qeydiyyat nece aparilir alqi satqinin notarial merhelesi haqqinda praktiki beledci notarius muqavile dovlet qeydiyyati dovlet rusumu qeydiyyat ve notariat dasinmaz emlakin alqi satqi muqavilesi notarial qaydada tesdiqlenir notarius dovlet adindan huquqi akti tesdiq eden sexsdir o tereflerin iradesinin azad olmasini eqdin qanuna uygunlugunu ve emlak uzerinde huquqlari yoxlayir notariat xidmetleri dovlet ve xususi notariuslar hemcinin asan xidmet merkezlerindeki notariat bolmeleri terefinden gosterilir notariusa getmezden evvel notariusla vaxt teyin edin ve teleb olunan senedlerin siyahisini sorusun muqavilenin esas sertlerini qiymet odenis usulu tehvil tarixi qeydiyyatdan cixma terefler evvelceden razilasdirsin odenisin nece aparilacagini deqiqlesdirin bank kocurmesi akkreditiv notarius yaninda hesablasma adeten teleb olunan senedler satici alici sexsiyyet vesiqesi sexsiyyet vesiqesi dasinmaz emlakin reyestrden cixarisi nikahdadirsa ve alinan emlak aile ucundurse aile veziyyeti ile bagli senedler notarius teleb ederse er arvadin notarial raziligi lazim olduqda ipoteka ile alisda bankin senedleri etibarname numayende vasitesile satisda etibarname numayende vasitesile alisda qeyyumluq orqaninin icazesi azyaslinin payi varsa konkret eqd ucun siyahi ferqlene biler son siyahini notarius verir notarius neyi yoxlayir tereflerin sexsiyyetini ve fealiyyet qabiliyyetini saticinin emlak uzerinde huququnu ve yuklulukleri reyestr melumatlari esasinda raziligi teleb olunan sexslerin er arvad diger mulkiyyetciler qeyyumluq orqani raziligini muqavilenin qanuna uygunlugunu ve tereflerin sertleri anladigini tesdiq gunu notarius muqavile layihesini oxuyur ve izah edir anlamadiginiz her bendi sorusun dovlet rusumu ve qanunla nezerde tutulan vergiler odenilir terefler muqavileni imzalayir notarius tesdiq edir notarius mulkiyyet huququnun dovlet qeydiyyati ucun senedleri reyestr orqanina teqdim edir xercler notarial hereketler ucun dovlet rusumunun meblegi dovlet rusumu haqqinda qanunla notariat xidmetleri ile bagli haqlar ise notariat haqqinda qanunla tenzimlenir xerclerin kim terefinden odenilmesi alici satici ve ya yari yariya tereflerin razilasmasidir ve muqavilede gosterile biler umumi smeta ucun dovlet rusumlari ve emeliyyat xercleri eqdden sonra qeydiyyat tamamlanandan sonra alicinin adina yeni cixaris verilir mulkiyyet huququ qeydiyyat anindan yaranir notarial muqavilenin nusxesini ve odenis senedlerini saxlayin kommunal abuneci muqavilelerini yeni mulkiyyetcinin adina kecirin','Notariusa hansı sənədlərlə getmək lazımdır, notarius nəyi yoxlayır, xərcləri kim ödəyir, əqddən sonra qeydiyyat necə aparılır — alqı-satqının notarial mərhələsi haqqında praktiki bələdçi.','
<p>Daşınmaz əmlakın alqı-satqı müqaviləsi notarial qaydada təsdiqlənir. Notarius dövlət adından hüquqi aktı təsdiq edən şəxsdir: o, tərəflərin iradəsinin azad olmasını, əqdin qanuna uyğunluğunu və əmlak üzərində hüquqları yoxlayır. Notariat xidmətləri dövlət və xüsusi notariuslar, həmçinin ASAN xidmət mərkəzlərindəki notariat bölmələri tərəfindən göstərilir.</p>

<h2>Notariusa getməzdən əvvəl</h2>
<ul>
  <li>Notariusla vaxt təyin edin və tələb olunan sənədlərin siyahısını soruşun.</li>
  <li>Müqavilənin əsas şərtlərini (qiymət, ödəniş üsulu, təhvil tarixi, qeydiyyatdan çıxma) tərəflər əvvəlcədən razılaşdırsın.</li>
  <li>Ödənişin necə aparılacağını dəqiqləşdirin — bank köçürməsi, akkreditiv, notarius yanında hesablaşma.</li>
</ul>

<h2>Adətən tələb olunan sənədlər</h2>
<table>
  <thead><tr><th>Satıcı</th><th>Alıcı</th></tr></thead>
  <tbody>
    <tr><td>Şəxsiyyət vəsiqəsi</td><td>Şəxsiyyət vəsiqəsi</td></tr>
    <tr><td>Daşınmaz əmlakın reyestrdən çıxarışı</td><td>Nikahdadırsa və alınan əmlak ailə üçündürsə — ailə vəziyyəti ilə bağlı sənədlər (notarius tələb edərsə)</td></tr>
    <tr><td>Ər-arvadın notarial razılığı (lazım olduqda)</td><td>İpoteka ilə alışda — bankın sənədləri</td></tr>
    <tr><td>Etibarnamə (nümayəndə vasitəsilə satışda)</td><td>Etibarnamə (nümayəndə vasitəsilə alışda)</td></tr>
    <tr><td>Qəyyumluq orqanının icazəsi (azyaşlının payı varsa)</td><td></td></tr>
  </tbody>
</table>
<p>Konkret əqd üçün siyahı fərqlənə bilər — son siyahını notarius verir.</p>

<h2>Notarius nəyi yoxlayır</h2>
<ol>
  <li>Tərəflərin şəxsiyyətini və fəaliyyət qabiliyyətini.</li>
  <li>Satıcının əmlak üzərində hüququnu və yüklülükləri — reyestr məlumatları əsasında.</li>
  <li>Razılığı tələb olunan şəxslərin (ər-arvad, digər mülkiyyətçilər, qəyyumluq orqanı) razılığını.</li>
  <li>Müqavilənin qanuna uyğunluğunu və tərəflərin şərtləri anladığını.</li>
</ol>

<h2>Təsdiq günü</h2>
<ol>
  <li>Notarius müqavilə layihəsini oxuyur və izah edir. Anlamadığınız hər bəndi soruşun.</li>
  <li>Dövlət rüsumu və qanunla nəzərdə tutulan vergilər ödənilir.</li>
  <li>Tərəflər müqaviləni imzalayır, notarius təsdiq edir.</li>
  <li>Notarius mülkiyyət hüququnun dövlət qeydiyyatı üçün sənədləri reyestr orqanına təqdim edir.</li>
</ol>

<h2>Xərclər</h2>
<p>Notarial hərəkətlər üçün dövlət rüsumunun məbləği «Dövlət rüsumu haqqında» Qanunla, notariat xidmətləri ilə bağlı haqlar isə «Notariat haqqında» Qanunla tənzimlənir. Xərclərin kim tərəfindən ödənilməsi (alıcı, satıcı və ya yarı-yarıya) tərəflərin razılaşmasıdır və müqavilədə göstərilə bilər. Ümumi smeta üçün: <a href="/bilik-merkezi/dovlet-rusumlari-ve-emeliyyat-xercleri">Dövlət rüsumları və əməliyyat xərcləri</a>.</p>

<h2>Əqddən sonra</h2>
<ul>
  <li>Qeydiyyat tamamlanandan sonra alıcının adına yeni çıxarış verilir. Mülkiyyət hüququ qeydiyyat anından yaranır.</li>
  <li>Notarial müqavilənin nüsxəsini və ödəniş sənədlərini saxlayın.</li>
  <li>Kommunal abunəçi müqavilələrini yeni mülkiyyətçinin adına keçirin.</li>
</ul>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["«Notariat haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Mülki Məcəlləsi","«Dövlət rüsumu haqqında» Azərbaycan Respublikasının Qanunu","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/107","https://e-qanun.az/framework/46944","https://e-qanun.az/framework/2860","https://justice.gov.az/az","https://asan.gov.az/"]','["notarius","müqavilə","dövlət qeydiyyatı","dövlət rüsumu"]',1,0,0,'Notariat prosedurları: alqı-satqının notarial təsdiqi addım-addım',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_dovlet-rusumlari-ve-emeliyyat-xercleri','dovlet-rusumlari-ve-emeliyyat-xercleri','Dövlət rüsumları və əmlak alqı-satqısında digər mümkün xərclər','dovlet rusumlari ve emlak alqi satqisinda diger mumkun xercler emlak alarken ve satarken odenilen xerclerin tam siyahisi dovlet rusumu notariat saticinin vergisi ipoteka ile bagli qiymetlendirme ve sigorta agentlik haqqi kocme ve temir smetani nece hazirlamali dovlet rusumu vergi xercler notarius ipoteka vergi ve rusumlar emlakin qiymeti alicinin odeyeceyi yegane mebleg deyil emeliyyat xerclerini evvelceden hesablamamaq budcede bosluq yaradir xususile ipoteka ile alisda ilkin odenis ve xercler eyni anda lazim olanda xerc novleri xerc adeten kim odeyir ne ile tenzimlenir notarial tesdiq ucun dovlet rusumu razilasmaya gore cox vaxt alici dovlet rusumu haqqinda qanun notariat xidmetleri texniki ve huquqi xidmet haqqi razilasmaya gore notariat haqqinda qanun saticinin emlak satisi uzre vergisi satici vergi mecellesi mulkiyyet huququnun dovlet qeydiyyati razilasmaya gore reyestr qanunvericiliyi dovlet rusumu qiymetlendirme ipotekada alici borcalan bank telebi emlak ve heyat sigortasi ipotekada alici borcalan kredit muqavilesi dasinmaz emlakin icbari sigortasi mulkiyyetci icbari sigortalar haqqinda qanun agentlik haqqi agentlikle muqavileye gore tereflerin muqavilesi kocme temir mebel alici saticinin vergisi fiziki sexs oz mulkiyyetinde olan yasayis ve qeyri yasayis sahesini satarken vergi mecellesine esasen sadelesdirilmis vergi odeyicisi ola biler vergi emlakin sahesi ve yerlesdiyi zonadan asili olaraq hesablanir ve notarial tesdiq zamani odenilir mecellede mueyyen hallar ucun azadolma nezerde tutulub dereceler ve azadolma sertleri deyise bildiyinden konkret meblegi eqdden evvel notariusdan ve ya dovlet vergi xidmetinden oyrenin ipoteka ile alisda elave xercler musteqil qiymetlendirme hesabati emlakin sigortasi kredit muddeti boyu borcalanin heyat sigortasi bank teleb ederse kreditin resmilesdirilmesi ile bagli bank komissiyalari ipoteka muqavilesinin notarial tesdiqi ve qeydiyyati ipoteka sertleri ucun ipoteka ile emlak alinmasi prosesi smetani nece hazirlamali emlakin qiymetini yazin notariusdan konkret eqd ucun rusum ve xidmet haqqinin meblegini sorusun ipoteka varsa bankdan qiymetlendirme sigorta ve komissiyalarin siyahisini alin agentlik haqqini muqavileden goturun kocme ve ilkin temir ucun ehtiyat ayirin kohne tikilide bu mebleg xeyli ola biler gozlenilmez xercler ucun umumi budcenin bir hissesini ehtiyatda saxlayin diqqet muqavilede real qiymet xercleri azaltmaq ucun muqavilede qiymeti asagi gostermek teklif oluna biler bu alici ucun ciddi riskdir eqd etibarsiz sayilarsa ve ya mubahise yaranarsa geri teleb edile bilen mebleg muqaviledeki reqemle mehdudlasa biler bundan elave vergi qanunvericiliyinin pozulmasi mesuliyyet yaradir','Əmlak alarkən və satarkən ödənilən xərclərin tam siyahısı: dövlət rüsumu, notariat, satıcının vergisi, ipoteka ilə bağlı qiymətləndirmə və sığorta, agentlik haqqı, köçmə və təmir — smetanı necə hazırlamalı.','
<p>Əmlakın qiyməti alıcının ödəyəcəyi yeganə məbləğ deyil. Əməliyyat xərclərini əvvəlcədən hesablamamaq büdcədə boşluq yaradır — xüsusilə ipoteka ilə alışda, ilkin ödəniş və xərclər eyni anda lazım olanda.</p>

<h2>Xərc növləri</h2>
<table>
  <thead><tr><th>Xərc</th><th>Adətən kim ödəyir</th><th>Nə ilə tənzimlənir</th></tr></thead>
  <tbody>
    <tr><td>Notarial təsdiq üçün dövlət rüsumu</td><td>Razılaşmaya görə (çox vaxt alıcı)</td><td>«Dövlət rüsumu haqqında» Qanun</td></tr>
    <tr><td>Notariat xidmətləri (texniki və hüquqi xidmət haqqı)</td><td>Razılaşmaya görə</td><td>«Notariat haqqında» Qanun</td></tr>
    <tr><td>Satıcının əmlak satışı üzrə vergisi</td><td>Satıcı</td><td>Vergi Məcəlləsi</td></tr>
    <tr><td>Mülkiyyət hüququnun dövlət qeydiyyatı</td><td>Razılaşmaya görə</td><td>Reyestr qanunvericiliyi, dövlət rüsumu</td></tr>
    <tr><td>Qiymətləndirmə (ipotekada)</td><td>Alıcı (borcalan)</td><td>Bank tələbi</td></tr>
    <tr><td>Əmlak və həyat sığortası (ipotekada)</td><td>Alıcı (borcalan)</td><td>Kredit müqaviləsi</td></tr>
    <tr><td>Daşınmaz əmlakın icbari sığortası</td><td>Mülkiyyətçi</td><td>«İcbari sığortalar haqqında» Qanun</td></tr>
    <tr><td>Agentlik haqqı</td><td>Agentliklə müqaviləyə görə</td><td>Tərəflərin müqaviləsi</td></tr>
    <tr><td>Köçmə, təmir, mebel</td><td>Alıcı</td><td>—</td></tr>
  </tbody>
</table>

<h2>Satıcının vergisi</h2>
<p>Fiziki şəxs öz mülkiyyətində olan yaşayış və qeyri-yaşayış sahəsini satarkən Vergi Məcəlləsinə əsasən sadələşdirilmiş vergi ödəyicisi ola bilər. Vergi əmlakın sahəsi və yerləşdiyi zonadan asılı olaraq hesablanır və notarial təsdiq zamanı ödənilir. Məcəllədə müəyyən hallar üçün azadolma nəzərdə tutulub. Dərəcələr və azadolma şərtləri dəyişə bildiyindən konkret məbləği əqddən əvvəl notariusdan və ya Dövlət Vergi Xidmətindən öyrənin.</p>

<h2>İpoteka ilə alışda əlavə xərclər</h2>
<ul>
  <li>müstəqil qiymətləndirmə hesabatı;</li>
  <li>əmlakın sığortası (kredit müddəti boyu);</li>
  <li>borcalanın həyat sığortası (bank tələb edərsə);</li>
  <li>kreditin rəsmiləşdirilməsi ilə bağlı bank komissiyaları;</li>
  <li>ipoteka müqaviləsinin notarial təsdiqi və qeydiyyatı.</li>
</ul>
<p>İpoteka şərtləri üçün: <a href="/bilik-merkezi/ipoteka-ile-emlak-alinmasi-prosesi">İpoteka ilə əmlak alınması prosesi</a>.</p>

<h2>Smetanı necə hazırlamalı</h2>
<ol>
  <li>Əmlakın qiymətini yazın.</li>
  <li>Notariusdan konkret əqd üçün rüsum və xidmət haqqının məbləğini soruşun.</li>
  <li>İpoteka varsa, bankdan qiymətləndirmə, sığorta və komissiyaların siyahısını alın.</li>
  <li>Agentlik haqqını müqavilədən götürün.</li>
  <li>Köçmə və ilkin təmir üçün ehtiyat ayırın — köhnə tikilidə bu məbləğ xeyli ola bilər.</li>
  <li>Gözlənilməz xərclər üçün ümumi büdcənin bir hissəsini ehtiyatda saxlayın.</li>
</ol>

<h2>Diqqət: müqavilədə real qiymət</h2>
<p>Xərcləri azaltmaq üçün müqavilədə qiyməti aşağı göstərmək təklif oluna bilər. Bu, alıcı üçün ciddi riskdir: əqd etibarsız sayılarsa və ya mübahisə yaranarsa, geri tələb edilə bilən məbləğ müqavilədəki rəqəmlə məhdudlaşa bilər. Bundan əlavə, vergi qanunvericiliyinin pozulması məsuliyyət yaradır.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='vergi-rusum'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["«Dövlət rüsumu haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Vergi Məcəlləsi","«Notariat haqqında» Azərbaycan Respublikasının Qanunu","«İcbari sığortalar haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/2860","https://e-qanun.az/framework/46948","https://e-qanun.az/framework/107","https://e-qanun.az/framework/22228","https://www.taxes.gov.az/az","https://mcgf.gov.az/az/ipoteka-krediti"]','["dövlət rüsumu","vergi","xərclər","notarius","ipoteka"]',2,0,0,'Dövlət rüsumları və əmlak alqı-satqısında digər mümkün xərclər',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_agentlikle-isleyerken-diqqet-edilmeli-meqamlar','agentlikle-isleyerken-diqqet-edilmeli-meqamlar','Əmlak agentliyi ilə işləyərkən diqqət edilməli məqamlar','emlak agentliyi ile isleyerken diqqet edilmeli meqamlar agentliyi nece secmek muqavilede neler yazilmali komissiya ne vaxt ve ne ucun odenilir ekskluziv razilasmanin ustunluk ve riskleri agentin selahiyyet hududlari agentlik komissiya muqavile etibarname broker agentlik ve brokerlik yaxsi agent vaxtiniza qenaet edir bazari taniyir sened yoxlamasinda ve danisiqlarda komek edir lakin agentlikle munasibet sifahi razilasmaya esaslandiqda komissiya mesuliyyet ve xidmetin hecmi barede mubahise yarana biler agentliyi nece secmek huquqi status qeydiyyatdan kecmis sirket ve ya ferdi sahibkar olmalidir voen ve ofis unvani olsun tecrube ve reyler erazide nece ildir isleyir real musteri reyleri varmi seffafliq komissiyani ve xidmetin hecmini ilk gorusde aciq deyirmi elanlarin keyfiyyeti real fotolar deqiq qiymet sened statusu gosterilirmi muqavilede neler olmalidir xidmetin predmeti emlak axtarisi satisi kirayesi sened yoxlamasi danisiqlar notariusda musayiet komissiyanin meblegi ve ya faizi qanunvericilikde mecburi sabit komissiya derecesi yoxdur mebleg razilasma ile mueyyen edilir komissiyanin odenilme ani notarial tesdiq gunu qeydiyyatdan sonra ve ya basqa hadise muddet muqavile ne vaxta qeder quvvededir ekskluzivlik emlak yalniz bu agentlik vasitesile satilirmi xercler reklam foto cekilis ve s kim terefinden odenilir mexfilik ve ferdi melumatlar ekskluziv muqavile ustunlukler ve riskler ustunlukler riskler agent reklama ve teqdimata daha cox vesait qoyur agent passiv olsa muddet boyu basqa kanal isletmek cetinlesir bir elan bir qiymet bazarda casqinliq yaranmir musteqil tapdiginiz alici ucun de komissiya teleb oluna biler vahid elaqe noqtesi muqavileni vaxtindan evvel legv etme sertleri agir ola biler agentin selahiyyet hududlari agentlik muqavilesi agente sizin adinizdan muqavile imzalamaq ve ya pul qebul etmek huququ vermir bunun ucun notarial etibarname lazimdir behi ve odenisi agente deyil mulkiyyetciye tercihen bank vasitesile odeyin senedlerin eslini agentlikde qoymayin suret kifayetdir tehluke siqnallari baxisdan evvel qeydiyyat haqqi ve ya baxis haqqi teleb olunur agent emlakin senedlerini gostermekden yayinir qiymet bazardan xeyli asagidir ve telesmek lazim oldugu deyilir komissiya meblegi yazili tesdiqlenmir bu saytda agentlik ve agent profillerini onlarin aktiv elanlarini ve musteri reylerini agentlikler bolmesinde gore bilersiniz','Agentliyi necə seçmək, müqavilədə nələr yazılmalı, komissiya nə vaxt və nə üçün ödənilir, eksklüziv razılaşmanın üstünlük və riskləri, agentin səlahiyyət hüdudları.','
<p>Yaxşı agent vaxtınıza qənaət edir, bazarı tanıyır, sənəd yoxlamasında və danışıqlarda kömək edir. Lakin agentliklə münasibət şifahi razılaşmaya əsaslandıqda, komissiya, məsuliyyət və xidmətin həcmi barədə mübahisə yarana bilər.</p>

<h2>Agentliyi necə seçmək</h2>
<ul>
  <li><strong>Hüquqi status:</strong> qeydiyyatdan keçmiş şirkət və ya fərdi sahibkar olmalıdır; VÖEN və ofis ünvanı olsun.</li>
  <li><strong>Təcrübə və rəylər:</strong> ərazidə neçə ildir işləyir, real müştəri rəyləri varmı?</li>
  <li><strong>Şəffaflıq:</strong> komissiyanı və xidmətin həcmini ilk görüşdə açıq deyirmi?</li>
  <li><strong>Elanların keyfiyyəti:</strong> real fotolar, dəqiq qiymət, sənəd statusu göstərilirmi?</li>
</ul>

<h2>Müqavilədə nələr olmalıdır</h2>
<ol>
  <li><strong>Xidmətin predmeti:</strong> əmlak axtarışı, satışı, kirayəsi, sənəd yoxlaması, danışıqlar, notariusda müşayiət.</li>
  <li><strong>Komissiyanın məbləği və ya faizi.</strong> Qanunvericilikdə məcburi sabit komissiya dərəcəsi yoxdur — məbləğ razılaşma ilə müəyyən edilir.</li>
  <li><strong>Komissiyanın ödənilmə anı:</strong> notarial təsdiq günü, qeydiyyatdan sonra və ya başqa hadisə.</li>
  <li><strong>Müddət:</strong> müqavilə nə vaxta qədər qüvvədədir?</li>
  <li><strong>Eksklüzivlik:</strong> əmlak yalnız bu agentlik vasitəsilə satılırmı?</li>
  <li><strong>Xərclər:</strong> reklam, foto çəkiliş və s. kim tərəfindən ödənilir?</li>
  <li><strong>Məxfilik və fərdi məlumatlar.</strong></li>
</ol>

<h2>Eksklüziv müqavilə: üstünlüklər və risklər</h2>
<table>
  <thead><tr><th>Üstünlüklər</th><th>Risklər</th></tr></thead>
  <tbody>
    <tr><td>Agent reklama və təqdimata daha çox vəsait qoyur</td><td>Agent passiv olsa, müddət boyu başqa kanal işlətmək çətinləşir</td></tr>
    <tr><td>Bir elan, bir qiymət — bazarda çaşqınlıq yaranmır</td><td>Müstəqil tapdığınız alıcı üçün də komissiya tələb oluna bilər</td></tr>
    <tr><td>Vahid əlaqə nöqtəsi</td><td>Müqaviləni vaxtından əvvəl ləğv etmə şərtləri ağır ola bilər</td></tr>
  </tbody>
</table>

<h2>Agentin səlahiyyət hüdudları</h2>
<ul>
  <li>Agentlik müqaviləsi agentə sizin adınızdan müqavilə imzalamaq və ya pul qəbul etmək hüququ vermir. Bunun üçün notarial etibarnamə lazımdır.</li>
  <li>Behi və ödənişi agentə deyil, mülkiyyətçiyə (tercihen bank vasitəsilə) ödəyin.</li>
  <li>Sənədlərin əslini agentlikdə qoymayın; surət kifayətdir.</li>
</ul>

<h2>Təhlükə siqnalları</h2>
<ul>
  <li>Baxışdan əvvəl «qeydiyyat haqqı» və ya «baxış haqqı» tələb olunur.</li>
  <li>Agent əmlakın sənədlərini göstərməkdən yayınır.</li>
  <li>Qiymət bazardan xeyli aşağıdır və «tələsmək» lazım olduğu deyilir.</li>
  <li>Komissiya məbləği yazılı təsdiqlənmir.</li>
</ul>
<p>Bu saytda agentlik və agent profillərini, onların aktiv elanlarını və müştəri rəylərini <a href="/agentlikler">Agentliklər</a> bölməsində görə bilərsiniz.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='agentlik-brokerlik'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi"]','["https://e-qanun.az/framework/46944"]','["agentlik","komissiya","müqavilə","etibarnamə","broker"]',1,0,0,'Əmlak agentliyi ilə işləyərkən diqqət edilməli məqamlar','Agentliyi necə seçmək, müqavilədə nələr yazılmalı, komissiya nə vaxt və nə üçün ödənilir, eksklüziv razılaşmanın üstünlük və riskləri, agentin səlahiyyət hüdudları.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_saxta-ve-yaniltici-elanlari-tanimaq','saxta-ve-yaniltici-elanlari-tanimaq','Əmlak elanlarında saxta və yanıltıcı məlumatları necə tanımaq olar','emlak elanlarinda saxta ve yaniltici melumatlari nece tanimaq olar bazardan xeyli ucuz qiymet basqa elandan goturulmus foto evvelceden odenis telebi uygunsuz sahe ve unvan saxta ve yaniltici elanlarin elametleri ve firildaqdan qorunma qaydalari saxta elan firildaq beh tehlukesizlik riskler tehlukesizlik ve saxta elanlar onlayn elanlar alici ve kirayeciye genis secim verir amma eyni zamanda firildaqcilar ucun de elverisli muhitdir bezi elanlar sadece yanilticidir sisirdilmis sahe kohne foto bezileri ise birbasa pul almaq ucun qurulmus saxta elanlardir saxta elanin elametleri qiymet bazardan xeyli asagidir eyni erazide oxsar menzillerden 20 30 ucuz teklif ilk tehluke siqnali evvelceden odenis telebi baxis ucun yer tutmaq acari kuryerle gondermek senedleri hazirlamaq adi ile baxisdan evvel pul istenilir sahib xaricdedir baxis mumkun deyil butun proses onlayn aparilmalidir fotolar basqa yerden goturulub seklin ters axtarisi reverse image search eyni fotonu basqa seher ve ya olkedeki elanda gosterir unvan deqiq deyil ve ya xeritedeki noqte tesvirle uygun gelmir tezyiq bu gun odemeseniz basqasina vereceyik elaqe yalniz mesajlasma ile zeng ve gorusden yayinma yaniltici qeyri deqiq elanin elametleri elanda realliqda ola biler nece yoxlamali kupcali cixaris yoxdur yalniz mtk ve ya ilkin muqavile var cixarisin eslini teleb edin temirli kosmetik kohne ve ya yarimciq temir baxis detal fotolar metroya yaxin piyada 20 25 deqiqe xeritede marsrut boyuk sahe balkon ve ya umumi sahe daxil edilib cixarisdaki sahe ile muqayise sahibinden agentlik elani komissiya teleb olunur ilk zengde birbasa sorusun ozunuzu nece qorumali baxisdan evvel hec bir odenis etmeyin emlaki sexsen gorun ve satici ile uzbeuz gorusun senedleri yoxlayin cixarisdaki mulkiyyetci ile gorusduyunuz sexsin sexsiyyet vesiqesi eyni olmalidir beh ve odenisi yalniz yazili sazisle ve mumkunse bank kocurmesi ile edin kart melumatlarinizi sms kodlarini ve sifreleri hec kime vermeyin odenisi qebul etmek ucun kod istemek klassik firildaq usuludur subheli elani bildirin bu saytdaki elanla bagli subheniz varsa elanin linkini elaqe formasi ile bize gonderin yoxlayib lazim olduqda dercden cixaririq kirayede xususi sxemler eyni menzil bir nece kirayeciye verilir her birinden depozit alinir menzili kirayeye goturmus sexs onu sahibin xeberi olmadan basqasina kirayeye verir qorunma yolu ev sahibinin mulkiyyetci oldugunu cixarisla yoxlamaq ve yazili kiraye muqavilesi baglamaq etrafli kiraye muqavilesinin duzgun hazirlanmasi firildaq qurbani olmusunuzsa subutlari yazisma odenis qebzi elan linki saxlayin ve huquq muhafize orqanlarina muraciet edin','Bazardan xeyli ucuz qiymət, başqa elandan götürülmüş foto, «əvvəlcədən ödəniş» tələbi, uyğunsuz sahə və ünvan — saxta və yanıltıcı elanların əlamətləri və fırıldaqdan qorunma qaydaları.','
<p>Onlayn elanlar alıcı və kirayəçiyə geniş seçim verir, amma eyni zamanda fırıldaqçılar üçün də əlverişli mühitdir. Bəzi elanlar sadəcə yanıltıcıdır (şişirdilmiş sahə, köhnə foto), bəziləri isə birbaşa pul almaq üçün qurulmuş saxta elanlardır.</p>

<h2>Saxta elanın əlamətləri</h2>
<ul>
  <li><strong>Qiymət bazardan xeyli aşağıdır.</strong> Eyni ərazidə oxşar mənzillərdən 20–30% ucuz təklif — ilk təhlükə siqnalı.</li>
  <li><strong>Əvvəlcədən ödəniş tələbi.</strong> «Baxış üçün yer tutmaq», «açarı kuryerlə göndərmək», «sənədləri hazırlamaq» adı ilə baxışdan əvvəl pul istənilir.</li>
  <li><strong>Sahib «xaricdədir».</strong> Baxış mümkün deyil, bütün proses onlayn aparılmalıdır.</li>
  <li><strong>Fotolar başqa yerdən götürülüb.</strong> Şəklin tərs axtarışı (reverse image search) eyni fotonu başqa şəhər və ya ölkədəki elanda göstərir.</li>
  <li><strong>Ünvan dəqiq deyil</strong> və ya xəritədəki nöqtə təsvirlə uyğun gəlmir.</li>
  <li><strong>Təzyiq:</strong> «bu gün ödəməsəniz, başqasına verəcəyik».</li>
  <li><strong>Əlaqə yalnız mesajlaşma ilə,</strong> zəng və görüşdən yayınma.</li>
</ul>

<h2>Yanıltıcı (qeyri-dəqiq) elanın əlamətləri</h2>
<table>
  <thead><tr><th>Elanda</th><th>Reallıqda ola bilər</th><th>Necə yoxlamalı</th></tr></thead>
  <tbody>
    <tr><td>«Kupçalı»</td><td>Çıxarış yoxdur, yalnız MTK və ya ilkin müqavilə var</td><td>Çıxarışın əslini tələb edin</td></tr>
    <tr><td>«Təmirli»</td><td>Kosmetik, köhnə və ya yarımçıq təmir</td><td>Baxış, detal fotolar</td></tr>
    <tr><td>«Metroya yaxın»</td><td>Piyada 20–25 dəqiqə</td><td>Xəritədə marşrut</td></tr>
    <tr><td>Böyük sahə</td><td>Balkon və ya ümumi sahə daxil edilib</td><td>Çıxarışdakı sahə ilə müqayisə</td></tr>
    <tr><td>«Sahibindən»</td><td>Agentlik elanı, komissiya tələb olunur</td><td>İlk zəngdə birbaşa soruşun</td></tr>
  </tbody>
</table>

<h2>Özünüzü necə qorumalı</h2>
<ol>
  <li><strong>Baxışdan əvvəl heç bir ödəniş etməyin.</strong></li>
  <li><strong>Əmlakı şəxsən görün</strong> və satıcı ilə üzbəüz görüşün.</li>
  <li><strong>Sənədləri yoxlayın:</strong> çıxarışdakı mülkiyyətçi ilə görüşdüyünüz şəxsin şəxsiyyət vəsiqəsi eyni olmalıdır.</li>
  <li><strong>Beh və ödənişi yalnız yazılı sazişlə</strong> və mümkünsə bank köçürməsi ilə edin.</li>
  <li><strong>Kart məlumatlarınızı, SMS kodlarını və şifrələri heç kimə verməyin</strong> — «ödənişi qəbul etmək üçün» kod istəmək klassik fırıldaq üsuludur.</li>
  <li><strong>Şübhəli elanı bildirin.</strong> Bu saytdakı elanla bağlı şübhəniz varsa, elanın linkini <a href="/elaqe">əlaqə forması</a> ilə bizə göndərin — yoxlayıb lazım olduqda dərcdən çıxarırıq.</li>
</ol>

<h2>Kirayədə xüsusi sxemlər</h2>
<ul>
  <li>Eyni mənzil bir neçə kirayəçiyə «verilir», hər birindən depozit alınır.</li>
  <li>Mənzili kirayəyə götürmüş şəxs onu sahibin xəbəri olmadan başqasına kirayəyə verir.</li>
</ul>
<p>Qorunma yolu: ev sahibinin mülkiyyətçi olduğunu çıxarışla yoxlamaq və yazılı kirayə müqaviləsi bağlamaq. Ətraflı: <a href="/bilik-merkezi/kiraye-muqavilesinin-duzgun-hazirlanmasi">Kirayə müqaviləsinin düzgün hazırlanması</a>.</p>
<p>Fırıldaq qurbanı olmusunuzsa, sübutları (yazışma, ödəniş qəbzi, elan linki) saxlayın və hüquq-mühafizə orqanlarına müraciət edin.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='tehlukesizlik'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456"]','["saxta elan","fırıldaq","beh","təhlükəsizlik","risklər"]',2,1,0,'Əmlak elanlarında saxta və yanıltıcı məlumatları necə tanımaq olar',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_ipoteka-ile-emlak-alinmasi-prosesi','ipoteka-ile-emlak-alinmasi-prosesi','İpoteka ilə əmlak alınması prosesi: müraciətdən açara qədər','ipoteka ile emlak alinmasi prosesi muracietden acara qeder ikzf nin guzestli ve adi ipotekasi bank ipotekasi ilkin odenis teleb olunan senedler e gov az uzerinden muraciet qiymetlendirme sigorta ve notarial eqd ipoteka prosesinin butun merheleleri ipoteka ikzf ilkin odenis kredit sigorta ipoteka ve maliyye ipoteka alinan emlakin kredit ucun teminat girov kimi bankin xeyrine yuklu edilmesidir azerbaycanda ipoteka krediti iki esas yolla alinir ipoteka ve kredit zemanet fondunun ikzf vesaiti hesabina guzestli ve adi ipoteka ve banklarin oz vesaiti hesabina kommersiya ipotekasi ikzf ipotekasinin esas sertleri asagidaki reqemler fondun resmi saytinda mcgf gov az 29 sentyabr 2026 ci il tarixine derc olunmus sertlerdir sertler deyise biler muracietden evvel resmi menbede yoxlayin sert guzestli ipoteka adi ipoteka maksimal kredit meblegi 100 000 azn 150 000 azn maksimal muddet 30 il 25 il minimal ilkin odenis 10 15 illik faiz zemanetsiz 4 dek 8 dek illik faiz zemanetli 3 7 dek 7 dek kimler ucundur qanunvericilikde mueyyen edilmis kateqoriyalar meselen mueyyen staja malik dovlet qulluqculari muellimler herbciler genc aileler ve s teleblere cavab veren istenilen borcalan ipoteka predmeti mulkiyyet huququ dovlet qeydiyyatina alinmis yasayis sahesi olmalidir ferdi yasayis evi bag evi ve ya 1 yanvar 1970 ci ilden sonra tikilmis binada menzil cixarisi olmayan emlak yalniz mtk muqavilesi adeten qebul edilmir proses addim addim budceni hesablayin ayliq odenis aile gelirinin ehemiyyetli hissesini tutmamalidir saytdaki ipoteka kalkulyatoru ile muxtelif mebleg ve muddetleri muqayise edin uygunlugu yoxlayin guzestli kateqoriyaya dusursunuzmu resmi geliriniz ve kredit tarixceniz bankin teleblerine cavab verirmi muraciet edin ikzf ipotekasi ucun muraciet elektron ipoteka ve kredit zemanet sistemi vasitesile elektron hokumet portalinda guclendirilmis elektron imza ile teqdim olunur muraciet muvekkil bank terefinden baxilir emlaki secin ve yoxlayin senedleri beledcimizdeki kimi yoxlayin cixarisin yoxlanilmasi qiymetlendirme bankin qebul etdiyi qiymetlendirici emlakin bazar deyerini mueyyen edir kredit meblegi bu deyere gore hesablanir alis qiymetine gore yox kreditin tesdiqi bank yekun meblegi faizi ve muddeti tesdiqleyir notarial eqd alqi satqi ve ipoteka muqavileleri notarial qaydada tesdiqlenir emlak bankin xeyrine ipoteka ile yuklu edilir qeydiyyat ve odenis mulkiyyet huququ ve ipoteka reyestrde qeyde alinir bank vesaiti saticiya kocurur sigorta kredit muddeti boyu emlakin ve teleb olunarsa borcalanin heyatinin sigortasi saxlanilir teleb oluna bilecek senedler sexsiyyet vesiqesi borcalan ve zamin birge borcalan geliri tesdiq eden senedler emek muqavilesi emek haqqi arayisi sahibkar ucun vergi beyannamesi guzestli kateqoriyani tesdiq eden senedler aile veziyyeti ile bagli senedler emlakin senedleri cixaris saticinin senedleri son siyahini muvekkil bank mueyyen edir satici ile danisiqlarda nezere alin ipoteka prosesi nagd alisdan uzun cekir beh sazisinde bankin tesdiq muddetini nezere alan tarix yazin kredit tesdiqlenmedikde behin taleyi evvelceden razilasdirilmalidir saticinin oz ipotekasi varsa baglanis banklarin istiraki ile eyni gunde aparila biler riskler gelirin azalmasi odenisler 20 30 il davam edir ehtiyat fondu en azi bir nece ayliq odenis yaradin gecikme gecikmis odenis cerime ve kredit tarixcesinin pislesmesine uzun muddetde ise girovun satisina getirib cixara biler valyuta gelir manatla oldugu halda xarici valyutada kredit goturmek mezenne riskidir anlayislar barede kredit ipoteka ve ilkin odenis anlayislari','İKZF-nin güzəştli və adi ipotekası, bank ipotekası, ilkin ödəniş, tələb olunan sənədlər, e-gov.az üzərindən müraciət, qiymətləndirmə, sığorta və notarial əqd — ipoteka prosesinin bütün mərhələləri.','
<p>İpoteka — alınan əmlakın kredit üçün təminat (girov) kimi bankın xeyrinə yüklü edilməsidir. Azərbaycanda ipoteka krediti iki əsas yolla alınır: <strong>İpoteka və Kredit Zəmanət Fondunun (İKZF) vəsaiti hesabına</strong> — güzəştli və adi ipoteka — və bankların <strong>öz vəsaiti hesabına</strong> kommersiya ipotekası.</p>

<h2>İKZF ipotekasının əsas şərtləri</h2>
<p>Aşağıdakı rəqəmlər Fondun rəsmi saytında (mcgf.gov.az) 29 sentyabr 2026-cı il tarixinə dərc olunmuş şərtlərdir. Şərtlər dəyişə bilər — müraciətdən əvvəl rəsmi mənbədə yoxlayın.</p>
<table>
  <thead><tr><th>Şərt</th><th>Güzəştli ipoteka</th><th>Adi ipoteka</th></tr></thead>
  <tbody>
    <tr><td>Maksimal kredit məbləği</td><td>100 000 AZN</td><td>150 000 AZN</td></tr>
    <tr><td>Maksimal müddət</td><td>30 il</td><td>25 il</td></tr>
    <tr><td>Minimal ilkin ödəniş</td><td>10%</td><td>15%</td></tr>
    <tr><td>İllik faiz (zəmanətsiz)</td><td>4%-dək</td><td>8%-dək</td></tr>
    <tr><td>İllik faiz (zəmanətli)</td><td>3,7%-dək</td><td>7%-dək</td></tr>
    <tr><td>Kimlər üçündür</td><td>Qanunvericilikdə müəyyən edilmiş kateqoriyalar (məsələn, müəyyən staja malik dövlət qulluqçuları, müəllimlər, hərbçilər, gənc ailələr və s.)</td><td>Tələblərə cavab verən istənilən borcalan</td></tr>
  </tbody>
</table>
<p>İpoteka predmeti mülkiyyət hüququ dövlət qeydiyyatına alınmış yaşayış sahəsi olmalıdır — fərdi yaşayış evi, bağ evi və ya 1 yanvar 1970-ci ildən sonra tikilmiş binada mənzil. Çıxarışı olmayan əmlak (yalnız MTK müqaviləsi) adətən qəbul edilmir.</p>

<h2>Proses addım-addım</h2>
<ol>
  <li><strong>Büdcəni hesablayın.</strong> Aylıq ödəniş ailə gəlirinin əhəmiyyətli hissəsini tutmamalıdır. Saytdakı <a href="/kalkulyator">ipoteka kalkulyatoru</a> ilə müxtəlif məbləğ və müddətləri müqayisə edin.</li>
  <li><strong>Uyğunluğu yoxlayın.</strong> Güzəştli kateqoriyaya düşürsünüzmü? Rəsmi gəliriniz və kredit tarixçəniz bankın tələblərinə cavab verirmi?</li>
  <li><strong>Müraciət edin.</strong> İKZF ipotekası üçün müraciət «Elektron ipoteka və kredit zəmanət» sistemi vasitəsilə elektron hökumət portalında gücləndirilmiş elektron imza ilə təqdim olunur. Müraciət müvəkkil bank tərəfindən baxılır.</li>
  <li><strong>Əmlakı seçin və yoxlayın.</strong> Sənədləri bələdçimizdəki kimi yoxlayın: <a href="/bilik-merkezi/cixarisin-ve-huquqi-senedlerin-yoxlanilmasi">Çıxarışın yoxlanılması</a>.</li>
  <li><strong>Qiymətləndirmə.</strong> Bankın qəbul etdiyi qiymətləndirici əmlakın bazar dəyərini müəyyən edir. Kredit məbləği bu dəyərə görə hesablanır — alış qiymətinə görə yox.</li>
  <li><strong>Kreditin təsdiqi.</strong> Bank yekun məbləği, faizi və müddəti təsdiqləyir.</li>
  <li><strong>Notarial əqd.</strong> Alqı-satqı və ipoteka müqavilələri notarial qaydada təsdiqlənir; əmlak bankın xeyrinə ipoteka ilə yüklü edilir.</li>
  <li><strong>Qeydiyyat və ödəniş.</strong> Mülkiyyət hüququ və ipoteka reyestrdə qeydə alınır, bank vəsaiti satıcıya köçürür.</li>
  <li><strong>Sığorta.</strong> Kredit müddəti boyu əmlakın (və tələb olunarsa borcalanın həyatının) sığortası saxlanılır.</li>
</ol>

<h2>Tələb oluna biləcək sənədlər</h2>
<ul>
  <li>şəxsiyyət vəsiqəsi (borcalan və zamin/birgə borcalan);</li>
  <li>gəliri təsdiq edən sənədlər (əmək müqaviləsi, əmək haqqı arayışı, sahibkar üçün vergi bəyannaməsi);</li>
  <li>güzəştli kateqoriyanı təsdiq edən sənədlər;</li>
  <li>ailə vəziyyəti ilə bağlı sənədlər;</li>
  <li>əmlakın sənədləri (çıxarış, satıcının sənədləri).</li>
</ul>
<p>Son siyahını müvəkkil bank müəyyən edir.</p>

<h2>Satıcı ilə danışıqlarda nəzərə alın</h2>
<ul>
  <li>İpoteka prosesi nağd alışdan uzun çəkir — beh sazişində bankın təsdiq müddətini nəzərə alan tarix yazın.</li>
  <li>Kredit təsdiqlənmədikdə behin taleyi əvvəlcədən razılaşdırılmalıdır.</li>
  <li>Satıcının öz ipotekası varsa, bağlanış bankların iştirakı ilə eyni gündə aparıla bilər.</li>
</ul>

<h2>Risklər</h2>
<ul>
  <li><strong>Gəlirin azalması:</strong> ödənişlər 20–30 il davam edir. Ehtiyat fondu (ən azı bir neçə aylıq ödəniş) yaradın.</li>
  <li><strong>Gecikmə:</strong> gecikmiş ödəniş cərimə və kredit tarixçəsinin pisləşməsinə, uzun müddətdə isə girovun satışına gətirib çıxara bilər.</li>
  <li><strong>Valyuta:</strong> gəlir manatla olduğu halda xarici valyutada kredit götürmək məzənnə riskidir.</li>
</ul>
<p>Anlayışlar barədə: <a href="/bilik-merkezi/kredit-ipoteka-ve-ilkin-odenis-anlayislari">Kredit, ipoteka və ilkin ödəniş anlayışları</a>.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'BUYER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["«İpoteka haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Mülki Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://mcgf.gov.az/az/ipoteka-krediti","https://e-qanun.az/framework/9902","https://e-qanun.az/framework/46944","https://my.gov.az/","https://e-qanun.az/framework/5456"]','["ipoteka","İKZF","ilkin ödəniş","kredit","sığorta"]',2,1,0,'İpoteka ilə əmlak alınması prosesi: müraciətdən açara qədər',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_kredit-ipoteka-ve-ilkin-odenis-anlayislari','kredit-ipoteka-ve-ilkin-odenis-anlayislari','Kredit, ipoteka və ilkin ödəniş anlayışları: sadə izah','kredit ipoteka ve ilkin odenis anlayislari sade izah ilkin odenis kredit meblegi faiz derecesi illik real faiz annuitet ve differensial odenis ltv zamin girov vaxtindan evvel odeme ipoteka muqavilesinde rast gelinen esas anlayislarin sade izahi ve numune hesablama ipoteka kredit ilkin odenis faiz annuitet ipoteka ve maliyye ipoteka muqavilesi bir nece sehifelik maliyye ve huquq terminlerinden ibaretdir asagidaki anlayislari bilmek bank tekliflerini muqayise etmeye ve surprizlerden qacmaga komek edir esas anlayislar anlayis menasi ilkin odenis emlakin qiymetinin alicinin oz vesaiti ile odenilen hissesi meselen 100 000 azn lik menzil ucun 15 ilkin odenis 15 000 azn dir kredit meblegi bankin verdiyi vesait qiymet minus ilkin odenis bank qiymetlendirme deyerini esas goturur ltv kredit deyer nisbeti kredit mebleginin emlak deyerine nisbeti 15 ilkin odenisde ltv 85 olur nominal faiz derecesi muqavilede gosterilen illik faiz illik real effektiv faiz derecesi faizle yanasi komissiya sigorta ve diger mecburi xercleri eks etdiren gosterici banklari bu gostericiye gore muqayise edin annuitet odenis butun muddet boyu beraber ayliq odenis evvelce faiz hissesi boyuk esas borc hissesi kicik olur differensial odenis esas borc beraber hisselerle odenilir faiz qaliq borca hesablanir ilk odenisler yuksek sonra azalir girov ipoteka predmeti kredit odenilmeyende bankin telebini temin eden emlak zamin birge borcalan borcalan odemedikde ohdeliye cavabdeh olan sexs vaxtindan evvel odeme kreditin tam ve ya qismen vaxtindan evvel baglanmasi muqavilede sertleri yoxlayin numune hesablama ferz edek menzilin qiymeti 120 000 azn ilkin odenis 15 18 000 azn kredit 102 000 azn illik faiz 8 muddet 25 il annuitet odenis ayliq faiz 8 12 0 667 ayliq odenis texminen 787 azn olur 25 il erzinde umumi odenis 236 000 azn bunun 134 000 azn i faizdir eyni kredit 4 illik faizle guzestli sertler ayliq 538 azn edir faizdeki bir nece faiz bendi ferqi uzun muddetde on minlerle manat demekdir oz reqemlerinizi kalkulyatorda hesablayin ilkin odenisi nece planlasdirmali minimal ilkin odenis serti ikzf ucun guzestli ipotekada 10 adi ipotekada 15 dir mcgf gov az 29 09 2026 banklarin oz proqramlarinda ferqli ola biler ilkin odenis ne qeder boyuk olsa ayliq odenis ve umumi faiz bir o qeder az olur ilkin odenisden elave emeliyyat xercleri ucun de vesait saxlayin emeliyyat xercleri bank tekliflerini muqayise ederken illik real faiz derecesini muqayise edin yalniz nominal faizi yox sigorta teleblerini ve xerclerini sorusun vaxtindan evvel odeme sertlerini oyrenin faiz sabitdir yoxsa deyisken gecikme cerimelerini muqavilede tapin','İlkin ödəniş, kredit məbləği, faiz dərəcəsi, illik real faiz, annuitet və differensial ödəniş, LTV, zamin, girov, vaxtından əvvəl ödəmə — ipoteka müqaviləsində rast gəlinən əsas anlayışların sadə izahı və nümunə hesablama.','
<p>İpoteka müqaviləsi bir neçə səhifəlik maliyyə və hüquq terminlərindən ibarətdir. Aşağıdakı anlayışları bilmək bank təkliflərini müqayisə etməyə və sürprizlərdən qaçmağa kömək edir.</p>

<h2>Əsas anlayışlar</h2>
<table>
  <thead><tr><th>Anlayış</th><th>Mənası</th></tr></thead>
  <tbody>
    <tr><td>İlkin ödəniş</td><td>Əmlakın qiymətinin alıcının öz vəsaiti ilə ödənilən hissəsi. Məsələn, 100 000 AZN-lik mənzil üçün 15% ilkin ödəniş 15 000 AZN-dir.</td></tr>
    <tr><td>Kredit məbləği</td><td>Bankın verdiyi vəsait: qiymət minus ilkin ödəniş (bank qiymətləndirmə dəyərini əsas götürür).</td></tr>
    <tr><td>LTV (kredit/dəyər nisbəti)</td><td>Kredit məbləğinin əmlak dəyərinə nisbəti. 15% ilkin ödənişdə LTV 85% olur.</td></tr>
    <tr><td>Nominal faiz dərəcəsi</td><td>Müqavilədə göstərilən illik faiz.</td></tr>
    <tr><td>İllik real (effektiv) faiz dərəcəsi</td><td>Faizlə yanaşı komissiya, sığorta və digər məcburi xərcləri əks etdirən göstərici. Bankları bu göstəriciyə görə müqayisə edin.</td></tr>
    <tr><td>Annuitet ödəniş</td><td>Bütün müddət boyu bərabər aylıq ödəniş; əvvəlcə faiz hissəsi böyük, əsas borc hissəsi kiçik olur.</td></tr>
    <tr><td>Differensial ödəniş</td><td>Əsas borc bərabər hissələrlə ödənilir, faiz qalıq borca hesablanır — ilk ödənişlər yüksək, sonra azalır.</td></tr>
    <tr><td>Girov (ipoteka predmeti)</td><td>Kredit ödənilməyəndə bankın tələbini təmin edən əmlak.</td></tr>
    <tr><td>Zamin / birgə borcalan</td><td>Borcalan ödəmədikdə öhdəliyə cavabdeh olan şəxs.</td></tr>
    <tr><td>Vaxtından əvvəl ödəmə</td><td>Kreditin tam və ya qismən vaxtından əvvəl bağlanması; müqavilədə şərtləri yoxlayın.</td></tr>
  </tbody>
</table>

<h2>Nümunə hesablama</h2>
<p>Fərz edək: mənzilin qiyməti 120 000 AZN, ilkin ödəniş 15% (18 000 AZN), kredit 102 000 AZN, illik faiz 8%, müddət 25 il, annuitet ödəniş.</p>
<ul>
  <li>Aylıq faiz: 8% / 12 ≈ 0,667%.</li>
  <li>Aylıq ödəniş təxminən <strong>787 AZN</strong> olur.</li>
  <li>25 il ərzində ümumi ödəniş ≈ 236 000 AZN, bunun ≈ 134 000 AZN-i faizdir.</li>
</ul>
<p>Eyni kredit 4% illik faizlə (güzəştli şərtlər) aylıq ≈ 538 AZN edir. Faizdəki bir neçə faiz bəndi fərqi uzun müddətdə on minlərlə manat deməkdir. Öz rəqəmlərinizi <a href="/kalkulyator">kalkulyatorda</a> hesablayın.</p>

<h2>İlkin ödənişi necə planlaşdırmalı</h2>
<ul>
  <li>Minimal ilkin ödəniş şərti İKZF üçün güzəştli ipotekada 10%, adi ipotekada 15%-dir (mcgf.gov.az, 29.09.2026). Bankların öz proqramlarında fərqli ola bilər.</li>
  <li>İlkin ödəniş nə qədər böyük olsa, aylıq ödəniş və ümumi faiz bir o qədər az olur.</li>
  <li>İlkin ödənişdən əlavə əməliyyat xərcləri üçün də vəsait saxlayın: <a href="/bilik-merkezi/dovlet-rusumlari-ve-emeliyyat-xercleri">Əməliyyat xərcləri</a>.</li>
</ul>

<h2>Bank təkliflərini müqayisə edərkən</h2>
<ol>
  <li>İllik real faiz dərəcəsini müqayisə edin, yalnız nominal faizi yox.</li>
  <li>Sığorta tələblərini və xərclərini soruşun.</li>
  <li>Vaxtından əvvəl ödəmə şərtlərini öyrənin.</li>
  <li>Faiz sabitdir, yoxsa dəyişkən?</li>
  <li>Gecikmə cərimələrini müqavilədə tapın.</li>
</ol>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["«İpoteka haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Mülki Məcəlləsi"]','["https://e-qanun.az/framework/9902","https://e-qanun.az/framework/46944","https://mcgf.gov.az/az/ipoteka-krediti"]','["ipoteka","kredit","ilkin ödəniş","faiz","annuitet"]',2,0,0,'Kredit, ipoteka və ilkin ödəniş anlayışları: sadə izah',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_kiraye-muqavilesinin-duzgun-hazirlanmasi','kiraye-muqavilesinin-duzgun-hazirlanmasi','Kirayə müqaviləsinin düzgün hazırlanması','kiraye muqavilesinin duzgun hazirlanmasi yasayis sahesinin kiraye muqavilesinde mutleq olmali bendler terefler emlak muddet kiraye haqqi ve odenis qaydasi depozit kommunal xercler temir xitam sertleri ve tehvil qebul akti hazir struktur ve numune bendler kiraye muqavile depozit tehvil qebul akti kiraye kiraye munasibetlerinde mubahiselerin coxu sifahi razilasmadan yaranir depozit qaytarilmir kiraye haqqi birterefli artirilir kirayeci xeberdarliqsiz cixarilir yazili muqavile her iki terefi qoruyur kiraye munasibetleri esasen mulki mecelle ve menzil mecellesi ile tenzimlenir muqavilenin strukturu 1 terefler ev sahibinin ve kirayecinin tam adi sexsiyyet vesiqesi melumatlari elaqe nomresi ev sahibinin mulkiyyetci oldugunu cixarisla yoxlayin numayendedirse etibarnamesinde kirayeye vermek selahiyyeti olmalidir 2 emlak unvan reyestr nomresi sahe otaq sayi mebel ve texnikanin siyahisi ayrica elavede tehvil qebul aktinda gosterilir 3 muddet baslangic ve bitme tarixi muddetin avtomatik uzadilib uzadilmamasi uzadilma sertleri 4 kiraye haqqi mebleg ve valyuta manatla gostermek meslehetdir odenis tarixi meselen her ayin 5 dek ve usulu bank kocurmesi tovsiye olunur qiymetin deyisdirile bileceyi hallar ve xeberdarliq muddeti gecikme halinda neticeler 5 depozit teminat meblegi mebleg qaytarilma muddeti ve hansi hallarda tutula bileceyi zede odenilmemis kommunal borc depozitin qebulu yazili tesdiqlenmelidir 6 kommunal xercler isiq qaz su internet bina xidmeti kim odeyir saygac gostericileri tehvil qebul aktinda qeyd edilir 7 temir ve istifade qaydalari cari xirda temir adeten kirayecinin esasli temir ve kommunikasiya qezalari ev sahibinin ohdeliyidir muqavilede aydin yazin ev heyvani siqaret qonaqlar emlakin basqasina kirayeye verilmesi subkiraye qaydalari ev sahibinin menzile baxis ucun gelmesi evvelceden xeberdarliqla 8 xitam tereflerden birinin muqavileni vaxtindan evvel legv etmesi ucun xeberdarliq muddeti meselen 30 gun depozitin taleyi hansi pozuntularin derhal xitam esasi oldugu 9 imzalar ve elaveler her sehife imzalanir tehvil qebul akti emlak siyahisi cixarisin sureti elave edilir tehvil qebul akti aktda menzilin veziyyeti divar doseme santexnika mebel ve texnika siyahisi saygac gostericileri ve acarlarin sayi qeyd olunur tarixli fotolar elave edin cixis zamani eyni akt esasinda muqayise aparilir depozit mubahisesinin qarsisini alan en effektiv sened budur vergi ohdeliyi emlaki kirayeye veren fiziki sexsin kiraye geliri vergi mecellesine esasen gelir vergisine celb olunur kirayeci huquqi sexs ve ya ferdi sahibkardirsa vergi adeten odeme menbeyinde tutulur fiziki sexse kirayede ucot ve beyanname ohdeliyi ev sahibinin uzerine duse biler derece ve qaydalari dovlet vergi xidmetinin resmi menbelerinden deqiqlesdirin kirayeci ucun yoxlama muqavileni imzalamazdan evvel menzile nece baxmaq lazim oldugu barede kiraye menzil goturerken yoxlama siyahisi','Yaşayış sahəsinin kirayə müqaviləsində mütləq olmalı bəndlər: tərəflər, əmlak, müddət, kirayə haqqı və ödəniş qaydası, depozit, kommunal xərclər, təmir, xitam şərtləri və təhvil-qəbul aktı. Hazır struktur və nümunə bəndlər.','
<p>Kirayə münasibətlərində mübahisələrin çoxu şifahi razılaşmadan yaranır: depozit qaytarılmır, kirayə haqqı birtərəfli artırılır, kirayəçi xəbərdarlıqsız çıxarılır. Yazılı müqavilə hər iki tərəfi qoruyur. Kirayə münasibətləri əsasən Mülki Məcəllə və Mənzil Məcəlləsi ilə tənzimlənir.</p>

<h2>Müqavilənin strukturu</h2>
<h3>1. Tərəflər</h3>
<p>Ev sahibinin və kirayəçinin tam adı, şəxsiyyət vəsiqəsi məlumatları, əlaqə nömrəsi. Ev sahibinin mülkiyyətçi olduğunu çıxarışla yoxlayın; nümayəndədirsə, etibarnaməsində kirayəyə vermək səlahiyyəti olmalıdır.</p>
<h3>2. Əmlak</h3>
<p>Ünvan, reyestr nömrəsi, sahə, otaq sayı. Mebel və texnikanın siyahısı ayrıca əlavədə (təhvil-qəbul aktında) göstərilir.</p>
<h3>3. Müddət</h3>
<p>Başlanğıc və bitmə tarixi, müddətin avtomatik uzadılıb-uzadılmaması, uzadılma şərtləri.</p>
<h3>4. Kirayə haqqı</h3>
<ul>
  <li>məbləğ və valyuta (manatla göstərmək məsləhətdir);</li>
  <li>ödəniş tarixi (məsələn, hər ayın 5-dək) və üsulu (bank köçürməsi tövsiyə olunur);</li>
  <li>qiymətin dəyişdirilə biləcəyi hallar və xəbərdarlıq müddəti;</li>
  <li>gecikmə halında nəticələr.</li>
</ul>
<h3>5. Depozit (təminat məbləği)</h3>
<p>Məbləğ, qaytarılma müddəti və hansı hallarda tutula biləcəyi (zədə, ödənilməmiş kommunal borc). Depozitin qəbulu yazılı təsdiqlənməlidir.</p>
<h3>6. Kommunal xərclər</h3>
<p>İşıq, qaz, su, internet, bina xidməti — kim ödəyir? Sayğac göstəriciləri təhvil-qəbul aktında qeyd edilir.</p>
<h3>7. Təmir və istifadə qaydaları</h3>
<ul>
  <li>Cari xırda təmir adətən kirayəçinin, əsaslı təmir və kommunikasiya qəzaları ev sahibinin öhdəliyidir — müqavilədə aydın yazın.</li>
  <li>Ev heyvanı, siqaret, qonaqlar, əmlakın başqasına kirayəyə verilməsi (subkirayə) qaydaları.</li>
  <li>Ev sahibinin mənzilə baxış üçün gəlməsi — əvvəlcədən xəbərdarlıqla.</li>
</ul>
<h3>8. Xitam</h3>
<p>Tərəflərdən birinin müqaviləni vaxtından əvvəl ləğv etməsi üçün xəbərdarlıq müddəti (məsələn, 30 gün), depozitin taleyi, hansı pozuntuların dərhal xitam əsası olduğu.</p>
<h3>9. İmzalar və əlavələr</h3>
<p>Hər səhifə imzalanır; təhvil-qəbul aktı, əmlak siyahısı, çıxarışın surəti əlavə edilir.</p>

<h2>Təhvil-qəbul aktı</h2>
<p>Aktda mənzilin vəziyyəti (divar, döşəmə, santexnika), mebel və texnika siyahısı, sayğac göstəriciləri və açarların sayı qeyd olunur. Tarixli fotolar əlavə edin. Çıxış zamanı eyni akt əsasında müqayisə aparılır — depozit mübahisəsinin qarşısını alan ən effektiv sənəd budur.</p>

<h2>Vergi öhdəliyi</h2>
<p>Əmlakı kirayəyə verən fiziki şəxsin kirayə gəliri Vergi Məcəlləsinə əsasən gəlir vergisinə cəlb olunur. Kirayəçi hüquqi şəxs və ya fərdi sahibkardırsa, vergi adətən ödəmə mənbəyində tutulur; fiziki şəxsə kirayədə uçot və bəyannamə öhdəliyi ev sahibinin üzərinə düşə bilər. Dərəcə və qaydaları Dövlət Vergi Xidmətinin rəsmi mənbələrindən dəqiqləşdirin.</p>

<h2>Kirayəçi üçün yoxlama</h2>
<p>Müqaviləni imzalamazdan əvvəl mənzilə necə baxmaq lazım olduğu barədə: <a href="/bilik-merkezi/kiraye-menzil-goturerken-yoxlama-siyahisi">Kirayə mənzil götürərkən yoxlama siyahısı</a>.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='kiraye'),'RENTER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","Azərbaycan Respublikasının Mənzil Məcəlləsi","Azərbaycan Respublikasının Vergi Məcəlləsi"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46955","https://e-qanun.az/framework/46948","https://www.taxes.gov.az/az"]','["kirayə","müqavilə","depozit","təhvil-qəbul aktı"]',2,1,0,'Kirayə müqaviləsinin düzgün hazırlanması',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_kiraye-menzil-goturerken-yoxlama-siyahisi','kiraye-menzil-goturerken-yoxlama-siyahisi','Kirayə mənzil götürərkən yoxlama siyahısı','kiraye menzil goturerken yoxlama siyahisi kiraye menzile baxisda neyi yoxlamali ev sahibinin mulkiyyet huququ menzilin veziyyeti kommunikasiyalar qonsular ve erazi odenisler depozit ve muqavile kirayeci ucun praktiki siyahi kiraye yoxlama siyahisi depozit saxta elan kiraye kiraye menzil secimi alisdan sade gorunse de sehv qerar aylarla narahatliq ve itirilmis depozit demekdir baxisa bu siyahi ile gedin 1 ev sahibi kimdir cixarisi ve sexsiyyet vesiqesini gorun mulkiyyetci ile muqavile bagladiginiza emin olun vasiteci ve ya evvelki kirayeci menzili tehvil verirse mulkiyyetcinin raziligini yazili teleb edin baxisdan evvel hec bir odenis etmeyin etrafli saxta elanlari tanimaq 2 menzilin veziyyeti nem kif catlar pencerelerin kip baglanmasi santexnika kranlar unitaz dus su tezyiqi isti su elektrik butun rozetkalar avtomatlar isiqlandirma istilik ve soyutma kombi radiatorlar kondisioner islek veziyyetdedirmi mebel ve texnika soyuducu paltaryuyan plite hamisini yoxlayin qapi kilidleri evvelki kirayecilerde acar qala biler kilidin deyisdirilmesini razilasdirin 3 odenisler sual niye vacibdir ayliq kiraye haqqina ne daxildir bina xidmeti internet kommunal ayrica ola biler depozit ne qederdir ve ne vaxt qaytarilir muqavilede yazilmalidir nece ayin odenisi qabaqcadan istenilir baslangic budceni mueyyen edir kommunal borc varmi evvelki borcun sizden teleb edilmesinin qarsisini alir agentlik haqqi varmi kimin odediyi evvelceden bilinmelidir 4 bina ve erazi lift giris isiqlandirma tehlukesizlik ise ve mektebe gedis vaxti ictimai neqliyyat axsam saatlarinda ses kuy dayanacaq imkani 5 muqavile ve tehvil yazili muqavile baglayin muqavilede olmali bendler tehvil qebul aktini fotolarla tertib edin saygac gostericilerini qeyd edin odenisleri bank vasitesile edin ve ya her odenise qebz alin cixis zamani muqaviledeki xeberdarliq muddetine emel edin menzili temiz tehvil verin son saygac gostericilerini qeyd edin ve depozitin qaytarilmasini aktla resmilesdirin','Kirayə mənzilə baxışda nəyi yoxlamalı: ev sahibinin mülkiyyət hüququ, mənzilin vəziyyəti, kommunikasiyalar, qonşular və ərazi, ödənişlər, depozit və müqavilə — kirayəçi üçün praktiki siyahı.','
<p>Kirayə mənzil seçimi alışdan sadə görünsə də, səhv qərar aylarla narahatlıq və itirilmiş depozit deməkdir. Baxışa bu siyahı ilə gedin.</p>

<h2>1. Ev sahibi kimdir?</h2>
<ul>
  <li>Çıxarışı və şəxsiyyət vəsiqəsini görün — mülkiyyətçi ilə müqavilə bağladığınıza əmin olun.</li>
  <li>Vasitəçi və ya əvvəlki kirayəçi mənzili «təhvil verirsə», mülkiyyətçinin razılığını yazılı tələb edin.</li>
  <li>Baxışdan əvvəl heç bir ödəniş etməyin. Ətraflı: <a href="/bilik-merkezi/saxta-ve-yaniltici-elanlari-tanimaq">Saxta elanları tanımaq</a>.</li>
</ul>

<h2>2. Mənzilin vəziyyəti</h2>
<ul>
  <li>Nəm, kif, çatlar; pəncərələrin kip bağlanması.</li>
  <li>Santexnika: kranlar, unitaz, duş, su təzyiqi, isti su.</li>
  <li>Elektrik: bütün rozetkalar, avtomatlar, işıqlandırma.</li>
  <li>İstilik və soyutma: kombi, radiatorlar, kondisioner — işlək vəziyyətdədirmi?</li>
  <li>Mebel və texnika: soyuducu, paltaryuyan, plitə — hamısını yoxlayın.</li>
  <li>Qapı kilidləri: əvvəlki kirayəçilərdə açar qala bilər — kilidin dəyişdirilməsini razılaşdırın.</li>
</ul>

<h2>3. Ödənişlər</h2>
<table>
  <thead><tr><th>Sual</th><th>Niyə vacibdir</th></tr></thead>
  <tbody>
    <tr><td>Aylıq kirayə haqqına nə daxildir?</td><td>Bina xidməti, internet, kommunal ayrıca ola bilər</td></tr>
    <tr><td>Depozit nə qədərdir və nə vaxt qaytarılır?</td><td>Müqavilədə yazılmalıdır</td></tr>
    <tr><td>Neçə ayın ödənişi qabaqcadan istənilir?</td><td>Başlanğıc büdcəni müəyyən edir</td></tr>
    <tr><td>Kommunal borc varmı?</td><td>Əvvəlki borcun sizdən tələb edilməsinin qarşısını alır</td></tr>
    <tr><td>Agentlik haqqı varmı?</td><td>Kimin ödədiyi əvvəlcədən bilinməlidir</td></tr>
  </tbody>
</table>

<h2>4. Bina və ərazi</h2>
<ul>
  <li>Lift, giriş, işıqlandırma, təhlükəsizlik.</li>
  <li>İşə və məktəbə gediş vaxtı, ictimai nəqliyyat.</li>
  <li>Axşam saatlarında səs-küy, dayanacaq imkanı.</li>
</ul>

<h2>5. Müqavilə və təhvil</h2>
<ol>
  <li>Yazılı müqavilə bağlayın: <a href="/bilik-merkezi/kiraye-muqavilesinin-duzgun-hazirlanmasi">müqavilədə olmalı bəndlər</a>.</li>
  <li>Təhvil-qəbul aktını fotolarla tərtib edin.</li>
  <li>Sayğac göstəricilərini qeyd edin.</li>
  <li>Ödənişləri bank vasitəsilə edin və ya hər ödənişə qəbz alın.</li>
</ol>

<h2>Çıxış zamanı</h2>
<p>Müqavilədəki xəbərdarlıq müddətinə əməl edin, mənzili təmiz təhvil verin, son sayğac göstəricilərini qeyd edin və depozitin qaytarılmasını aktla rəsmiləşdirin.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='kiraye'),'RENTER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456"]','["kirayə","yoxlama siyahısı","depozit","saxta elan"]',1,0,0,'Kirayə mənzil götürərkən yoxlama siyahısı',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_emlaki-kirayeye-verenler-ucun-beledci','emlaki-kirayeye-verenler-ucun-beledci','Əmlakı kirayəyə verənlər üçün bələdçi','emlaki kirayeye verenler ucun beledci ev sahibi ucun menzilin kirayeye hazirlanmasi duzgun kiraye haqqi kirayecinin secilmesi muqavile ve depozit vergi ohdeliyi sigorta ve mubahiselerin qarsisinin alinmasi kiraye ev sahibi vergi depozit sigorta emlakin idare olunmasi kiraye geliri sabit gorunse de duzgun teskil edilmeyende bos qalan aylar zedelenmis emlak ve vergi problemleri geliri usteleye biler bu beledci ev sahibinin esas addimlarini umumilesdirir 1 menzili hazirlayin kommunikasiyalari yoxlayin ve nasazliqlari aradan qaldirin kirayecinin ilk ayda sikayeti munasibeti korlayir neytral temiz interyer esas mebel ve texnika kiraye haqqini artirir butun esyalarin siyahisini ve fotolarini hazirlayin 2 kiraye haqqini mueyyen edin eyni erazide oxsar menzillerin kiraye elanlarini muqayise edin bazardan yuksek qiymet bos qalan aylara sebeb olur bir ay bos qalan menzil illik gelirin texminen 8 ni itirir investor baxisindan gelirlilik barede bazar qiymeti beledcisi ve saytdaki investisiya kalkulyatoru 3 kirayecini secin sexsiyyet vesiqesini gorun is yeri ve geliri barede sorusun kimler yasayacaq ev heyvani varmi evvelki ev sahibinden rey almaq mumkundurmu 4 muqavile ve depozit yazili muqavile baglayin struktur kiraye muqavilesi beledcisinde verilib depozit emlakin zedelenmesi ve odenilmemis kommunal xercler ucun teminatdir qaytarilma sertleri muqavilede yazilmalidir 5 vergi ohdeliyi kiraye geliri vergi mecellesine esasen vergiye celb olunan gelirdir kirayeci huquqi sexs ve ya ferdi sahibkar olduqda vergi odeme menbeyinde tutula biler kirayeci fiziki sexs olduqda gelirin ucotu ve beyan edilmesi ev sahibinin ohdeliyidir qeydiyyat derece ve beyanname muddetleri barede dovlet vergi xidmetinin resmi melumatlarina baxin vergiden yayinma cerime ve faiz riskidir 6 sigorta fiziki sexslerin mulkiyyetinde olan dasinmaz emlak ucun icbari sigorta icbari sigortalar haqqinda qanunla tenzimlenir bundan elave konullu emlak sigortasi su basma yangin ve qonsulara deyen zerer kimi risklerde kiraye gelirinizi qoruyur 7 munasibetler ve mubahiseler kirayecinin sexsi heyatina hormet edin baxis ucun evvelceden xeberdarliq edin temir muracietlerine vaxtinda cavab verin odenis gecikmesinde evvelce yazili xatirlatma gonderin muqavileye xitam yalniz muqavile ve qanunda nezerde tutulan esaslarla mumkundur kirayecini zorla cixarmaq kilidi deyismek ve ya kommunal xidmetleri kesmek qanunsuzdur mubahise mehkemede hell olunur','Ev sahibi üçün: mənzilin kirayəyə hazırlanması, düzgün kirayə haqqı, kirayəçinin seçilməsi, müqavilə və depozit, vergi öhdəliyi, sığorta və mübahisələrin qarşısının alınması.','
<p>Kirayə gəliri sabit görünsə də, düzgün təşkil edilməyəndə boş qalan aylar, zədələnmiş əmlak və vergi problemləri gəliri üstələyə bilər. Bu bələdçi ev sahibinin əsas addımlarını ümumiləşdirir.</p>

<h2>1. Mənzili hazırlayın</h2>
<ul>
  <li>Kommunikasiyaları yoxlayın və nasazlıqları aradan qaldırın — kirayəçinin ilk ayda şikayəti münasibəti korlayır.</li>
  <li>Neytral, təmiz interyer; əsas mebel və texnika kirayə haqqını artırır.</li>
  <li>Bütün əşyaların siyahısını və fotolarını hazırlayın.</li>
</ul>

<h2>2. Kirayə haqqını müəyyən edin</h2>
<p>Eyni ərazidə oxşar mənzillərin kirayə elanlarını müqayisə edin. Bazardan yüksək qiymət boş qalan aylara səbəb olur: bir ay boş qalan mənzil illik gəlirin təxminən 8%-ni itirir. İnvestor baxışından gəlirlilik barədə: <a href="/bilik-merkezi/emlakin-real-bazar-qiymetinin-mueyyen-edilmesi">bazar qiyməti bələdçisi</a> və saytdakı <a href="/investisiya">investisiya kalkulyatoru</a>.</p>

<h2>3. Kirayəçini seçin</h2>
<ul>
  <li>Şəxsiyyət vəsiqəsini görün, iş yeri və gəliri barədə soruşun.</li>
  <li>Kimlər yaşayacaq, ev heyvanı varmı?</li>
  <li>Əvvəlki ev sahibindən rəy almaq mümkündürmü?</li>
</ul>

<h2>4. Müqavilə və depozit</h2>
<p>Yazılı müqavilə bağlayın — struktur <a href="/bilik-merkezi/kiraye-muqavilesinin-duzgun-hazirlanmasi">kirayə müqaviləsi bələdçisində</a> verilib. Depozit əmlakın zədələnməsi və ödənilməmiş kommunal xərclər üçün təminatdır; qaytarılma şərtləri müqavilədə yazılmalıdır.</p>

<h2>5. Vergi öhdəliyi</h2>
<p>Kirayə gəliri Vergi Məcəlləsinə əsasən vergiyə cəlb olunan gəlirdir. Kirayəçi hüquqi şəxs və ya fərdi sahibkar olduqda vergi ödəmə mənbəyində tutula bilər; kirayəçi fiziki şəxs olduqda gəlirin uçotu və bəyan edilməsi ev sahibinin öhdəliyidir. Qeydiyyat, dərəcə və bəyannamə müddətləri barədə Dövlət Vergi Xidmətinin rəsmi məlumatlarına baxın. Vergidən yayınma cərimə və faiz riskidir.</p>

<h2>6. Sığorta</h2>
<p>Fiziki şəxslərin mülkiyyətində olan daşınmaz əmlak üçün icbari sığorta «İcbari sığortalar haqqında» Qanunla tənzimlənir. Bundan əlavə, könüllü əmlak sığortası su basma, yanğın və qonşulara dəyən zərər kimi risklərdə kirayə gəlirinizi qoruyur.</p>

<h2>7. Münasibətlər və mübahisələr</h2>
<ul>
  <li>Kirayəçinin şəxsi həyatına hörmət edin — baxış üçün əvvəlcədən xəbərdarlıq edin.</li>
  <li>Təmir müraciətlərinə vaxtında cavab verin.</li>
  <li>Ödəniş gecikməsində əvvəlcə yazılı xatırlatma göndərin; müqaviləyə xitam yalnız müqavilə və qanunda nəzərdə tutulan əsaslarla mümkündür.</li>
  <li>Kirayəçini zorla çıxarmaq, kilidi dəyişmək və ya kommunal xidmətləri kəsmək qanunsuzdur — mübahisə məhkəmədə həll olunur.</li>
</ul>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='emlak-idareetmesi'),'LANDLORD','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","Azərbaycan Respublikasının Vergi Məcəlləsi","«İcbari sığortalar haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46948","https://e-qanun.az/framework/22228","https://www.taxes.gov.az/az"]','["kirayə","ev sahibi","vergi","depozit","sığorta"]',1,0,0,'Əmlakı kirayəyə verənlər üçün bələdçi','Ev sahibi üçün: mənzilin kirayəyə hazırlanması, düzgün kirayə haqqı, kirayəçinin seçilməsi, müqavilə və depozit, vergi öhdəliyi, sığorta və mübahisələrin qarşısının alınması.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_emlakin-idare-olunmasi-kommunal-sigorta-temir','emlakin-idare-olunmasi-kommunal-sigorta-temir','Əmlakın idarə olunması: kommunal, bina idarəetməsi, sığorta və təmir','emlakin idare olunmasi kommunal bina idareetmesi sigorta ve temir mulkiyyetcinin gundelik ohdelikleri kommunal abunecilik ve borclar binanin idare edilmesi ve xidmet haqqi emlak vergisi icbari ve konullu sigorta temir ve yenidenplanlasdirma qaydalari kommunal sigorta emlak vergisi temir bina idareetmesi emlakin idare olunmasi emlaki almaq isin baslangicidir mulkiyyetci kimi kommunal xidmetler binanin saxlanmasi vergi ve sigorta ohdelikleriniz var onlari vaxtinda yerine yetirmek hem emlakin deyerini qoruyur hem de gelecek satisi asanlasdirir kommunal xidmetler abuneciliyi oz adiniza kecirin elektrik qaz su alisdan sonra bu addim evvelki mulkiyyetcinin borclari ile bagli mubahiselerin qarsisini alir saygac gostericilerini tehvil gunu qeyd edin borcsuzlugu vaxtasiri yoxlayin kirayeye verilmis menzilde kirayecinin borcu mulkiyyetci ucun problem yarada biler binanin idare edilmesi coxmenzilli binada umumi emlakin pilleken lift dam heyet saxlanmasi mulkiyyetcilerin ortaq ohdeliyidir menzil mecellesi binanin idare edilmesi formalarini mueyyen edir mulkiyyetciler musterek idareetme qurumu yarada idareetmeni ixtisaslasmis teskilata hevale ede bilerler ayliq xidmet haqqinin neyi ehate etdiyini oyrenin sakinlerin umumi yigincaqlarinda istirak edin dam ve lift temiri kimi xercler orada qerarlasdirilir emlak vergisi fiziki sexslerin mulkiyyetinde olan binalar menziller uzre emlak vergisi yerli belediyye vergisidir ve vergi mecellesinde mueyyen edilmis qaydada hesablanir bildiris ve odenis qaydasini yerli belediyyeden ve ya dovlet vergi xidmetinin melumat merkezinden oyrenin sigorta nov neyi ehate edir dasinmaz emlakin icbari sigortasi qanunla mueyyen edilmis riskler yangin tebii felaket ve s uzre emlakin ozune deyen zerer konullu emlak sigortasi daha genis riskler su basma ogurluq esyalar mulki mesuliyyet sigortasi qonsulara deyen zerer meselen su sizmasi ipoteka sigortasi bank telebi ile kredit muddeti boyu emlak ve ve ya heyat temir ve yenidenplanlasdirma dasiyici divarlarin sokulmesi qaz avadanliginin kocurulmesi balkonun otaga birlesdirilmesi kimi deyisiklikler icaze teleb ede biler ve binanin tehlukesizliyine tesir edir senedlesdirilmemis deyisiklik satis ve ipoteka zamani problem yaradir texniki senedlerle real plan uygun gelmir temir islerini qonsularla razilasdirilmis saatlarda aparin senedlerin saxlanmasi cixaris alqi satqi muqavilesi odenis senedleri texniki pasport sigorta polisleri ve kommunal muqavileleri bir qovluqda hem kagiz hem skan saxlayin satis ve ya vereselik zamani bu qovluq aylarla vaxta qenaet edir','Mülkiyyətçinin gündəlik öhdəlikləri: kommunal abunəçilik və borclar, binanın idarə edilməsi və xidmət haqqı, əmlak vergisi, icbari və könüllü sığorta, təmir və yenidənplanlaşdırma qaydaları.','
<p>Əmlakı almaq işin başlanğıcıdır. Mülkiyyətçi kimi kommunal xidmətlər, binanın saxlanması, vergi və sığorta öhdəlikləriniz var. Onları vaxtında yerinə yetirmək həm əmlakın dəyərini qoruyur, həm də gələcək satışı asanlaşdırır.</p>

<h2>Kommunal xidmətlər</h2>
<ul>
  <li><strong>Abunəçiliyi öz adınıza keçirin:</strong> elektrik, qaz, su. Alışdan sonra bu addım əvvəlki mülkiyyətçinin borcları ilə bağlı mübahisələrin qarşısını alır.</li>
  <li><strong>Sayğac göstəricilərini</strong> təhvil günü qeyd edin.</li>
  <li><strong>Borcsuzluğu</strong> vaxtaşırı yoxlayın — kirayəyə verilmiş mənzildə kirayəçinin borcu mülkiyyətçi üçün problem yarada bilər.</li>
</ul>

<h2>Binanın idarə edilməsi</h2>
<p>Çoxmənzilli binada ümumi əmlakın (pilləkən, lift, dam, həyət) saxlanması mülkiyyətçilərin ortaq öhdəliyidir. Mənzil Məcəlləsi binanın idarə edilməsi formalarını müəyyən edir: mülkiyyətçilər müştərək idarəetmə qurumu yarada, idarəetməni ixtisaslaşmış təşkilata həvalə edə bilərlər.</p>
<ul>
  <li>Aylıq xidmət haqqının nəyi əhatə etdiyini öyrənin.</li>
  <li>Sakinlərin ümumi yığıncaqlarında iştirak edin — dam və lift təmiri kimi xərclər orada qərarlaşdırılır.</li>
</ul>

<h2>Əmlak vergisi</h2>
<p>Fiziki şəxslərin mülkiyyətində olan binalar (mənzillər) üzrə əmlak vergisi yerli (bələdiyyə) vergisidir və Vergi Məcəlləsində müəyyən edilmiş qaydada hesablanır. Bildiriş və ödəniş qaydasını yerli bələdiyyədən və ya Dövlət Vergi Xidmətinin məlumat mərkəzindən öyrənin.</p>

<h2>Sığorta</h2>
<table>
  <thead><tr><th>Növ</th><th>Nəyi əhatə edir</th></tr></thead>
  <tbody>
    <tr><td>Daşınmaz əmlakın icbari sığortası</td><td>Qanunla müəyyən edilmiş risklər (yanğın, təbii fəlakət və s.) üzrə əmlakın özünə dəyən zərər</td></tr>
    <tr><td>Könüllü əmlak sığortası</td><td>Daha geniş risklər: su basma, oğurluq, əşyalar</td></tr>
    <tr><td>Mülki məsuliyyət sığortası</td><td>Qonşulara dəyən zərər (məsələn, su sızması)</td></tr>
    <tr><td>İpoteka sığortası</td><td>Bank tələbi ilə kredit müddəti boyu əmlak və/və ya həyat</td></tr>
  </tbody>
</table>

<h2>Təmir və yenidənplanlaşdırma</h2>
<ul>
  <li>Daşıyıcı divarların sökülməsi, qaz avadanlığının köçürülməsi, balkonun otağa birləşdirilməsi kimi dəyişikliklər icazə tələb edə bilər və binanın təhlükəsizliyinə təsir edir.</li>
  <li>Sənədləşdirilməmiş dəyişiklik satış və ipoteka zamanı problem yaradır: texniki sənədlərlə real plan uyğun gəlmir.</li>
  <li>Təmir işlərini qonşularla razılaşdırılmış saatlarda aparın.</li>
</ul>

<h2>Sənədlərin saxlanması</h2>
<p>Çıxarış, alqı-satqı müqaviləsi, ödəniş sənədləri, texniki pasport, sığorta polisləri və kommunal müqavilələri bir qovluqda (həm kağız, həm skan) saxlayın. Satış və ya vərəsəlik zamanı bu qovluq aylarla vaxta qənaət edir.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='emlak-idareetmesi'),'LANDLORD','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mənzil Məcəlləsi","Azərbaycan Respublikasının Vergi Məcəlləsi","«İcbari sığortalar haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi"]','["https://e-qanun.az/framework/46955","https://e-qanun.az/framework/46948","https://e-qanun.az/framework/22228","https://e-qanun.az/framework/46958","https://www.taxes.gov.az/az"]','["kommunal","sığorta","əmlak vergisi","təmir","bina idarəetməsi"]',1,0,0,'Əmlakın idarə olunması: kommunal, bina idarəetməsi, sığorta və təmir',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_menzil-alarken-praktiki-beledci','menzil-alarken-praktiki-beledci','Mənzil alarkən praktiki bələdçi: mərtəbə, plan, təmir və sənəd','menzil alarken praktiki beledci mertebe plan temir ve sened coxmenzilli binada menzil secerken mertebe plan istiqamet temir seviyyesi sahe anlayislari ve sened statusu kimi amilleri nece qiymetlendirmek menzil alicisi ucun xususi beledci menzil yoxlama siyahisi temir yeni tikili kohne tikili emlak novleri uzre beledciler menzil azerbaycanda en cox alinan emlak novudur eyni binada eyni sahede iki menzilin qiymeti mertebe plan temir ve sened statusuna gore xeyli ferqlene biler bu beledci hemin amilleri sistemlesdirir sahe anlayislari umumi sahe menzilin butun otaqlari ve komekci saheleri yasayis sahesi yalniz yasayis otaqlari elanda gosterilen sahe ile cixarisdaki saheni muqayise edin balkon ve ya umumi dehliz payi saheye elave edile biler mertebe mertebe ustunlukler diqqet birinci lift asililigi yoxdur kommersiya meqsedi mumkundur ses kuy tehlukesizlik rutubet zirzemi qoxusu orta en cox teleb olunan balansli secim sonuncu sakitlik gorunus damin axmasi yayda isti su tezyiqi saytdaki filtrlerde birinci mertebe olmasin ve sonuncu mertebe olmasin secimleri var plan ve istiqamet otaqlar ayridirmi kecid otaq varmi metbex sahesi ve penceresi sanitar qovsaq ayri ve ya birge pencerelerin istiqameti cenub ve serq teref daha isiqli simal teref yayda serindir gorunus heyet kuce deniz qonsu binanin divari temir seviyyesi temirsiz qara karkas qiymet asagidir amma temire elave xerc ve vaxt lazimdir orta kohne temir kommunikasiyalarin deyisdirilmesi lazim ola biler yeni temir materiallarin keyfiyyetine ve gizli islere elektrik boru diqqet edin temir qusurlari gizlede biler sened statusu menzilin cixarisi varsa alis ve ipoteka standart qaydada aparilir yeni tikilide cixaris olmaya biler bu halda tikinticinin statusu ve muqavilenin novu ayrica qiymetlendirilmelidir etrafli cixarisin yoxlanilmasi ve yeni tikili yoxsa kohne tikili bina ve erazi binanin tikinti ili konstruksiyasi lift dayanacaq ve erazinin infrastrukturu menzilin ozu qeder vacibdir bina ve erazi yoxlamasi qisa yoxlama sahe cixarisla uygundurmu plan texniki senedlerle eynidirmi kommunal borc varmi mertebe ve istiqamet ehtiyaciniza uygundurmu temir ucun elave budce lazimdirmi','Çoxmənzilli binada mənzil seçərkən mərtəbə, plan, istiqamət, təmir səviyyəsi, sahə anlayışları və sənəd statusu kimi amilləri necə qiymətləndirmək — mənzil alıcısı üçün xüsusi bələdçi.','
<p>Mənzil Azərbaycanda ən çox alınan əmlak növüdür. Eyni binada, eyni sahədə iki mənzilin qiyməti mərtəbə, plan, təmir və sənəd statusuna görə xeyli fərqlənə bilər. Bu bələdçi həmin amilləri sistemləşdirir.</p>

<h2>Sahə anlayışları</h2>
<ul>
  <li><strong>Ümumi sahə</strong> — mənzilin bütün otaqları və köməkçi sahələri.</li>
  <li><strong>Yaşayış sahəsi</strong> — yalnız yaşayış otaqları.</li>
  <li>Elanda göstərilən sahə ilə çıxarışdakı sahəni müqayisə edin. Balkon və ya ümumi dəhliz payı sahəyə «əlavə» edilə bilər.</li>
</ul>

<h2>Mərtəbə</h2>
<table>
  <thead><tr><th>Mərtəbə</th><th>Üstünlüklər</th><th>Diqqət</th></tr></thead>
  <tbody>
    <tr><td>Birinci</td><td>Lift asılılığı yoxdur, kommersiya məqsədi mümkündür</td><td>Səs-küy, təhlükəsizlik, rütubət, zirzəmi qoxusu</td></tr>
    <tr><td>Orta</td><td>Ən çox tələb olunan, balanslı seçim</td><td>—</td></tr>
    <tr><td>Sonuncu</td><td>Sakitlik, görünüş</td><td>Damın axması, yayda isti, su təzyiqi</td></tr>
  </tbody>
</table>
<p>Saytdakı filtrlərdə «birinci mərtəbə olmasın» və «sonuncu mərtəbə olmasın» seçimləri var.</p>

<h2>Plan və istiqamət</h2>
<ul>
  <li>Otaqlar ayrıdırmı, keçid otaq varmı?</li>
  <li>Mətbəx sahəsi və pəncərəsi.</li>
  <li>Sanitar qovşaq ayrı və ya birgə.</li>
  <li>Pəncərələrin istiqaməti: cənub və şərq tərəf daha işıqlı, şimal tərəf yayda sərindir.</li>
  <li>Görünüş: həyət, küçə, dəniz, qonşu binanın divarı.</li>
</ul>

<h2>Təmir səviyyəsi</h2>
<ul>
  <li><strong>Təmirsiz (qara karkas):</strong> qiymət aşağıdır, amma təmirə əlavə xərc və vaxt lazımdır.</li>
  <li><strong>Orta/köhnə təmir:</strong> kommunikasiyaların dəyişdirilməsi lazım ola bilər.</li>
  <li><strong>Yeni təmir:</strong> materialların keyfiyyətinə və gizli işlərə (elektrik, boru) diqqət edin — təmir qüsurları gizlədə bilər.</li>
</ul>

<h2>Sənəd statusu</h2>
<p>Mənzilin çıxarışı varsa, alış və ipoteka standart qaydada aparılır. Yeni tikilidə çıxarış olmaya bilər — bu halda tikintiçinin statusu və müqavilənin növü ayrıca qiymətləndirilməlidir. Ətraflı: <a href="/bilik-merkezi/cixarisin-ve-huquqi-senedlerin-yoxlanilmasi">Çıxarışın yoxlanılması</a> və <a href="/bilik-merkezi/yeni-tikili-yoxsa-kohne-tikili">Yeni tikili, yoxsa köhnə tikili?</a></p>

<h2>Bina və ərazi</h2>
<p>Binanın tikinti ili, konstruksiyası, lift, dayanacaq və ərazinin infrastrukturu mənzilin özü qədər vacibdir: <a href="/bilik-merkezi/bina-infrastruktur-ve-erazi-yoxlamasi">Bina və ərazi yoxlaması</a>.</p>

<h2>Qısa yoxlama</h2>
<ol>
  <li>Sahə çıxarışla uyğundurmu?</li>
  <li>Plan texniki sənədlərlə eynidirmi?</li>
  <li>Kommunal borc varmı?</li>
  <li>Mərtəbə və istiqamət ehtiyacınıza uyğundurmu?</li>
  <li>Təmir üçün əlavə büdcə lazımdırmı?</li>
</ol>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='emlak-novleri'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mənzil Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46955","https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46958"]','["mənzil","yoxlama siyahısı","təmir","yeni tikili","köhnə tikili"]',1,0,0,'Mənzil alarkən praktiki bələdçi: mərtəbə, plan, təmir və sənəd',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_heyet-evi-alarken-beledci','heyet-evi-alarken-beledci','Həyət evi alarkən bələdçi: torpaq, tikili, kommunikasiya və sənədlər','heyet evi alarken beledci torpaq tikili kommunikasiya ve senedler heyet evi ve bag evi alarken yoxlanmali xususi meqamlar torpaq sahesi ile evin ayri ayriliqda senedlesdirilmesi torpagin teyinati serhedler qeydiyyatsiz tikililer su qaz isiq ve kanalizasiya heyet evi torpaq cixaris kommunal yoxlama siyahisi emlak novleri uzre beledciler heyet evi menzilden ferqli olaraq iki obyektden ibaretdir torpaq sahesi ve onun uzerindeki tikili ler her ikisinin huquqi statusu ayrica yoxlanmalidir heyet evi alisinda en cox problem yaradan mehz senedde olmayan tikililer ve torpagin statusudur senedler cixarisda hem torpaq hem ev gosterilibmi bezen yalniz ev ve ya yalniz torpaq qeydiyyatdadir torpagin sahesi ve serhedleri cixarisdaki sahe real hasarla uygun gelirmi qonsu ile serhed mubahisesi varmi torpagin teyinati ferdi yasayis evi tikintisi ucun teyinatli olmalidir kend teserrufati teyinatli torpaqda tikilmis ev qanuni problem yarada biler mulkiyyet formasi torpaq xususi mulkiyyetdedir yoxsa belediyye dovlet torpaginin icaresidir qeydiyyatsiz tikililer heyetde sonradan tikilmis ikinci mertebe elave otaq qaraj anbar tez tez senedlerde olmur neticeleri cixarisdaki sahe real saheden azdir qiymet ise real saheye gore istenilir ipoteka ve qiymetlendirme zamani bu tikililer nezere alinmir icazesiz tikinti ile bagli huquqi riskler aliciya kece biler qiymeti seneddeki saheye gore muzakire edin qeydiyyatsiz tikililerin leqallasdirilmasi imkanini ve xercini ayrica oyrenin kommunikasiyalar xidmet neyi yoxlamali elektrik abunecilik ayrilmis guc xettin veziyyeti qaz resmi qosulma ve saygac qaz yoxdursa qosulma imkani ve xerci su merkezi su quyu ve ya dasinan su qrafik uzre verilirmi kanalizasiya merkezi xett ve ya septik tullanti quyusu yol qis ve yagis movsumunde eve cixis fiziki veziyyet bunovre ve divarlarda catlar torpaq cokmesi elametleri dam ortuyu drenaj yagis suyunun axini qrunt sulari zirzemide rutubet istilik sistemi ve izolyasiya qis xercleri ucun vacibdir erazi mekteb market neqliyyat mesafesi seheretrafi qesebelerde gundelik gedis vaxti helledicidir qonsuluqda senaye obyekti heyvandarliq yuksek gerginlik xetti sel ve surusme riski olan eraziler torpagin ozu ile bagli etrafli melumat torpaq sahesi alarken beledci','Həyət evi və bağ evi alarkən yoxlanmalı xüsusi məqamlar: torpaq sahəsi ilə evin ayrı-ayrılıqda sənədləşdirilməsi, torpağın təyinatı, sərhədlər, qeydiyyatsız tikililər, su, qaz, işıq və kanalizasiya.','
<p>Həyət evi mənzildən fərqli olaraq iki obyektdən ibarətdir: <strong>torpaq sahəsi</strong> və onun üzərindəki <strong>tikili(lər)</strong>. Hər ikisinin hüquqi statusu ayrıca yoxlanmalıdır. Həyət evi alışında ən çox problem yaradan məhz sənəddə olmayan tikililər və torpağın statusudur.</p>

<h2>Sənədlər</h2>
<ul>
  <li><strong>Çıxarışda həm torpaq, həm ev göstərilibmi?</strong> Bəzən yalnız ev və ya yalnız torpaq qeydiyyatdadır.</li>
  <li><strong>Torpağın sahəsi və sərhədləri:</strong> çıxarışdakı sahə real hasarla uyğun gəlirmi? Qonşu ilə sərhəd mübahisəsi varmı?</li>
  <li><strong>Torpağın təyinatı:</strong> fərdi yaşayış evi tikintisi üçün təyinatlı olmalıdır. Kənd təsərrüfatı təyinatlı torpaqda tikilmiş ev qanuni problem yarada bilər.</li>
  <li><strong>Mülkiyyət forması:</strong> torpaq xüsusi mülkiyyətdədir, yoxsa bələdiyyə/dövlət torpağının icarəsidir?</li>
</ul>

<h2>Qeydiyyatsız tikililər</h2>
<p>Həyətdə sonradan tikilmiş ikinci mərtəbə, əlavə otaq, qaraj, anbar tez-tez sənədlərdə olmur. Nəticələri:</p>
<ul>
  <li>çıxarışdakı sahə real sahədən azdır, qiymət isə real sahəyə görə istənilir;</li>
  <li>ipoteka və qiymətləndirmə zamanı bu tikililər nəzərə alınmır;</li>
  <li>icazəsiz tikinti ilə bağlı hüquqi risklər alıcıya keçə bilər.</li>
</ul>
<p>Qiyməti sənəddəki sahəyə görə müzakirə edin, qeydiyyatsız tikililərin leqallaşdırılması imkanını və xərcini ayrıca öyrənin.</p>

<h2>Kommunikasiyalar</h2>
<table>
  <thead><tr><th>Xidmət</th><th>Nəyi yoxlamalı</th></tr></thead>
  <tbody>
    <tr><td>Elektrik</td><td>Abunəçilik, ayrılmış güc, xəttin vəziyyəti</td></tr>
    <tr><td>Qaz</td><td>Rəsmi qoşulma və sayğac; qaz yoxdursa, qoşulma imkanı və xərci</td></tr>
    <tr><td>Su</td><td>Mərkəzi su, quyu və ya daşınan su; qrafik üzrə verilirmi?</td></tr>
    <tr><td>Kanalizasiya</td><td>Mərkəzi xətt və ya septik (tullantı quyusu)</td></tr>
    <tr><td>Yol</td><td>Qış və yağış mövsümündə evə çıxış</td></tr>
  </tbody>
</table>

<h2>Fiziki vəziyyət</h2>
<ul>
  <li>Bünövrə və divarlarda çatlar, torpaq çökməsi əlamətləri.</li>
  <li>Dam örtüyü, drenaj, yağış suyunun axını.</li>
  <li>Qrunt suları, zirzəmidə rütubət.</li>
  <li>İstilik sistemi və izolyasiya — qış xərcləri üçün vacibdir.</li>
</ul>

<h2>Ərazi</h2>
<ul>
  <li>Məktəb, market, nəqliyyat məsafəsi — şəhərətrafı qəsəbələrdə gündəlik gediş vaxtı həlledicidir.</li>
  <li>Qonşuluqda sənaye obyekti, heyvandarlıq, yüksək gərginlik xətti.</li>
  <li>Sel və sürüşmə riski olan ərazilər.</li>
</ul>
<p>Torpağın özü ilə bağlı ətraflı məlumat: <a href="/bilik-merkezi/torpaq-sahesi-alarken-beledci">Torpaq sahəsi alarkən bələdçi</a>.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='emlak-novleri'),'BUYER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Torpaq Məcəlləsi","Azərbaycan Respublikasının Mülki Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi"]','["https://e-qanun.az/framework/46942","https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46958","https://emlak.gov.az/az"]','["həyət evi","torpaq","çıxarış","kommunal","yoxlama siyahısı"]',1,0,0,'Həyət evi alarkən bələdçi: torpaq, tikili, kommunikasiya və sənədlər',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_torpaq-sahesi-alarken-beledci','torpaq-sahesi-alarken-beledci','Torpaq sahəsi alarkən bələdçi: təyinat, mülkiyyət forması və tikinti imkanı','torpaq sahesi alarken beledci teyinat mulkiyyet formasi ve tikinti imkani torpaq alarken teyinati kateqoriyasi mulkiyyet formasini serhedleri yuklulukleri ve tikinti imkanini nece yoxlamali kend teserrufati torpaginda ev tikmeyin riskleri ve esas senedler torpaq teyinat cixaris tikinti icazesi riskler emlak novleri uzre beledciler torpaq sahesi uzunmuddetli investisiya ve ya gelecek ev ucun yer kimi alinir lakin torpaq uzerinde ne tikile bileceyi onun teyinatindan ve sehersalma teleblerinden asilidir sehv secilmis torpaqda ev tikmek huquqi baximdan mumkun olmaya biler torpagin kateqoriyasi ve teyinati torpaq mecellesi torpaqlari teyinatina gore kateqoriyalara bolur kend teserrufati teyinatli torpaqlar yasayis menteqelerinin torpaqlari senaye neqliyyat ve diger teyinatli torpaqlar mese ve su fondu torpaqlari ve s ev tikmek ucun torpagin teyinati ferdi yasayis evi tikintisine uygun olmalidir kend teserrufati teyinatli torpaqda yasayis evi tikintisi qanunla mehdudlasdirilir teyinatin deyisdirilmesi ayrica prosedur teleb edir ve zemanetli deyil teyinat cixarisda ve ya torpaqla bagli senedlerde gosterilir saticinin sozune deyil senede baxin mulkiyyet formasi forma menasi alici ucun xususi mulkiyyet torpaq saticiya mexsusdur alqi satqi mumkundur belediyye mulkiyyeti torpaq belediyyeye mexsusdur satici yalniz icare ve ya istifade huququnu oture biler sertler daxilinde dovlet mulkiyyeti torpaq dovlete mexsusdur saticinin mulkiyyet huququ yoxdur serhedler ve sahe cixarisdaki sahe ile faktiki serhedleri muqayise edin lazim olduqda mutexessise olcu apardirin qonsularla serhed mubahisesi yol ve ya kommunikasiya xetti ucun servitut kecid huququ varmi saheye ictimai yoldan qanuni giris movcuddurmu tikinti imkani sehersalma ve tikinti mecellesine gore tikinti layihe ve icaze telebleri ile aparilir erazinin sehersalma senedleri tikintini mehdudlasdira biler muhafize zonalari yuksek gerginlik xetleri qaz ve neft kemerleri su obyektleri demir yolu bu zonalarda tikinti qadagan ve ya mehdud ola biler qrunt ve relyef surusme sel qrunt suyu tikinti xercini artirir kommunikasiyalar en yaxin elektrik qaz ve su xettine mesafeni ve qosulma xercini evvelceden oyrenin kommunikasiyasiz torpaq ucuz gorunse de qosulma xercleri ferqi beraberlesdire biler yoxlama siyahisi cixaris ve saticinin mulkiyyet huququ torpagin kateqoriyasi ve teyinati yuklulukler ipoteka hebs icare serhedler ve giris yolu muhafize zonalari ve tikinti mehdudiyyetleri kommunikasiyaya qosulma imkani','Torpaq alarkən təyinatı, kateqoriyası, mülkiyyət formasını, sərhədləri, yüklülükləri və tikinti imkanını necə yoxlamalı; kənd təsərrüfatı torpağında ev tikməyin riskləri və əsas sənədlər.','
<p>Torpaq sahəsi uzunmüddətli investisiya və ya gələcək ev üçün yer kimi alınır. Lakin torpaq üzərində nə tikilə biləcəyi onun <strong>təyinatından</strong> və şəhərsalma tələblərindən asılıdır. Səhv seçilmiş torpaqda ev tikmək hüquqi baxımdan mümkün olmaya bilər.</p>

<h2>Torpağın kateqoriyası və təyinatı</h2>
<p>Torpaq Məcəlləsi torpaqları təyinatına görə kateqoriyalara bölür: kənd təsərrüfatı təyinatlı torpaqlar, yaşayış məntəqələrinin torpaqları, sənaye, nəqliyyat və digər təyinatlı torpaqlar, meşə və su fondu torpaqları və s.</p>
<ul>
  <li><strong>Ev tikmək üçün</strong> torpağın təyinatı fərdi yaşayış evi tikintisinə uyğun olmalıdır.</li>
  <li><strong>Kənd təsərrüfatı təyinatlı</strong> torpaqda yaşayış evi tikintisi qanunla məhdudlaşdırılır; təyinatın dəyişdirilməsi ayrıca prosedur tələb edir və zəmanətli deyil.</li>
  <li>Təyinat çıxarışda və ya torpaqla bağlı sənədlərdə göstərilir — satıcının sözünə deyil, sənədə baxın.</li>
</ul>

<h2>Mülkiyyət forması</h2>
<table>
  <thead><tr><th>Forma</th><th>Mənası</th><th>Alıcı üçün</th></tr></thead>
  <tbody>
    <tr><td>Xüsusi mülkiyyət</td><td>Torpaq satıcıya məxsusdur</td><td>Alqı-satqı mümkündür</td></tr>
    <tr><td>Bələdiyyə mülkiyyəti</td><td>Torpaq bələdiyyəyə məxsusdur</td><td>Satıcı yalnız icarə və ya istifadə hüququnu ötürə bilər (şərtlər daxilində)</td></tr>
    <tr><td>Dövlət mülkiyyəti</td><td>Torpaq dövlətə məxsusdur</td><td>Satıcının mülkiyyət hüququ yoxdur</td></tr>
  </tbody>
</table>

<h2>Sərhədlər və sahə</h2>
<ul>
  <li>Çıxarışdakı sahə ilə faktiki sərhədləri müqayisə edin; lazım olduqda mütəxəssisə ölçü apardırın.</li>
  <li>Qonşularla sərhəd mübahisəsi, yol və ya kommunikasiya xətti üçün servitut (keçid hüququ) varmı?</li>
  <li>Sahəyə ictimai yoldan qanuni giriş mövcuddurmu?</li>
</ul>

<h2>Tikinti imkanı</h2>
<ul>
  <li>Şəhərsalma və Tikinti Məcəlləsinə görə tikinti layihə və icazə tələbləri ilə aparılır; ərazinin şəhərsalma sənədləri tikintini məhdudlaşdıra bilər.</li>
  <li>Mühafizə zonaları: yüksək gərginlik xətləri, qaz və neft kəmərləri, su obyektləri, dəmir yolu — bu zonalarda tikinti qadağan və ya məhdud ola bilər.</li>
  <li>Qrunt və relyef: sürüşmə, sel, qrunt suyu tikinti xərcini artırır.</li>
</ul>

<h2>Kommunikasiyalar</h2>
<p>Ən yaxın elektrik, qaz və su xəttinə məsafəni və qoşulma xərcini əvvəlcədən öyrənin. Kommunikasiyasız torpaq ucuz görünsə də, qoşulma xərcləri fərqi bərabərləşdirə bilər.</p>

<h2>Yoxlama siyahısı</h2>
<ol>
  <li>Çıxarış və satıcının mülkiyyət hüququ.</li>
  <li>Torpağın kateqoriyası və təyinatı.</li>
  <li>Yüklülüklər (ipoteka, həbs, icarə).</li>
  <li>Sərhədlər və giriş yolu.</li>
  <li>Mühafizə zonaları və tikinti məhdudiyyətləri.</li>
  <li>Kommunikasiyaya qoşulma imkanı.</li>
</ol>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='emlak-novleri'),'INVESTOR','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Torpaq Məcəlləsi","Azərbaycan Respublikasının Mülki Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu","Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi"]','["https://e-qanun.az/framework/46942","https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46958","https://emlak.gov.az/az"]','["torpaq","təyinat","çıxarış","tikinti icazəsi","risklər"]',1,0,0,NULL,NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_kommersiya-obyekti-beledcisi','kommersiya-obyekti-beledcisi','Kommersiya obyekti alarkən və icarəyə götürərkən bələdçi','kommersiya obyekti alarken ve icareye goturerken beledci ofis magaza anbar ve ya obyekt alarken yaxud icareye goturerken teyinat yerlesme ve axin texniki gostericiler gelirlilik hesabi icare muqavilesinin xususiyyetleri ve vergi meseleleri kommersiya icare investisiya gelirlilik vergi emlak novleri uzre beledciler kommersiya emlaki yasayis emlakindan ferqli mentiqle qiymetlendirilir esas sual burada yasamaq rahatdirmi deyil bu yer ne qeder gelir getirecek sualidir yerlesme axin texniki imkanlar ve huquqi teyinat helledicidir huquqi yoxlama teyinat obyekt qeyri yasayis sahesi kimi qeydiyyatdadirmi yasayis menzilinde kommersiya fealiyyeti mehdudiyyetlerle uzlese biler cixaris ve yuklulukler yasayis emlakinda oldugu kimi movcud icareciler obyekt icarededirse icare muqavilesi yeni mulkiyyetci ucun de quvvede qala biler sertleri oyrenin fealiyyet novu ucun telebler ictimai iase tibb tehsil kimi saheler ucun xususi sanitar yangin ve texniki telebler var yerlesme ve axin piyada ve avtomobil axini gorunme vitrin lovhe imkani dayanacaq yukleme bosaltma imkani anbar ve magaza ucun hedef auditoriyanin yaxinligi ve reqibler texniki gostericiler gosterici niye vacibdir elektrik gucu avadanliq soyuducular kondisionerler tavan hundurluyu ve doseme yuku anbar ve istehsal ucun ventilyasiya ve tustu cixisi restoran ve kafe ucun ayrica giris yasayis binasinda kommersiya obyekti ucun yangin tehlukesizliyi fealiyyet icazesi ucun gelirlilik hesabi sade gosterici illik xalis icare gelirinin alis qiymetine nisbetidir umumi gelirlilik illik icare haqqi alis qiymeti 100 xalis gelirlilik vergileri bos qalan aylari temir ve idareetme xerclerini cixdiqdan sonra hesablanir numune 200 000 azn lik obyekt ayda 1 800 azn icareye verilir illik umumi gelir 21 600 azn umumi gelirlilik 10 8 bir ay bos qalma vergi ve xercler cixildiqdan sonra xalis gelirlilik xeyli asagi olacaq saytdaki investisiya kalkulyatoru ile hesablayin icare muqavilesinin xususiyyetleri muddet cox vaxt uzundur 1 5 il ve indeksasiya illik artim bendi olur temir ve yenidenqurma kimin hesabinadir muqavile bitdikde edilmis yaxsilasdirmalarin taleyi kommunal ve umumi xerclerin bolgusu subicare huququ erken xitam ve cerime sertleri vergi kommersiya obyektinin icaresinden gelir emlak vergisi ve torpaq vergisi vergi mecellesi ile tenzimlenir huquqi sexs ve ferdi sahibkar ucun qaydalar ferqlidir investisiya qerarindan evvel vergi meslehetcisi ile hesablama aparin','Ofis, mağaza, anbar və ya obyekt alarkən yaxud icarəyə götürərkən: təyinat, yerləşmə və axın, texniki göstəricilər, gəlirlilik hesabı, icarə müqaviləsinin xüsusiyyətləri və vergi məsələləri.','
<p>Kommersiya əmlakı yaşayış əmlakından fərqli məntiqlə qiymətləndirilir: əsas sual «burada yaşamaq rahatdırmı?» deyil, «bu yer nə qədər gəlir gətirəcək?» sualıdır. Yerləşmə, axın, texniki imkanlar və hüquqi təyinat həlledicidir.</p>

<h2>Hüquqi yoxlama</h2>
<ul>
  <li><strong>Təyinat:</strong> obyekt qeyri-yaşayış sahəsi kimi qeydiyyatdadırmı? Yaşayış mənzilində kommersiya fəaliyyəti məhdudiyyətlərlə üzləşə bilər.</li>
  <li><strong>Çıxarış və yüklülüklər</strong> — yaşayış əmlakında olduğu kimi.</li>
  <li><strong>Mövcud icarəçilər:</strong> obyekt icarədədirsə, icarə müqaviləsi yeni mülkiyyətçi üçün də qüvvədə qala bilər — şərtləri öyrənin.</li>
  <li><strong>Fəaliyyət növü üçün tələblər:</strong> ictimai iaşə, tibb, təhsil kimi sahələr üçün xüsusi sanitar, yanğın və texniki tələblər var.</li>
</ul>

<h2>Yerləşmə və axın</h2>
<ul>
  <li>Piyada və avtomobil axını, görünmə (vitrin, lövhə imkanı).</li>
  <li>Dayanacaq, yükləmə-boşaltma imkanı (anbar və mağaza üçün).</li>
  <li>Hədəf auditoriyanın yaxınlığı və rəqiblər.</li>
</ul>

<h2>Texniki göstəricilər</h2>
<table>
  <thead><tr><th>Göstərici</th><th>Niyə vacibdir</th></tr></thead>
  <tbody>
    <tr><td>Elektrik gücü</td><td>Avadanlıq, soyuducular, kondisionerlər</td></tr>
    <tr><td>Tavan hündürlüyü və döşəmə yükü</td><td>Anbar və istehsal üçün</td></tr>
    <tr><td>Ventilyasiya və tüstü çıxışı</td><td>Restoran və kafe üçün</td></tr>
    <tr><td>Ayrıca giriş</td><td>Yaşayış binasında kommersiya obyekti üçün</td></tr>
    <tr><td>Yanğın təhlükəsizliyi</td><td>Fəaliyyət icazəsi üçün</td></tr>
  </tbody>
</table>

<h2>Gəlirlilik hesabı</h2>
<p>Sadə göstərici — illik xalis icarə gəlirinin alış qiymətinə nisbətidir:</p>
<ul>
  <li><strong>Ümumi gəlirlilik</strong> = illik icarə haqqı / alış qiyməti × 100%.</li>
  <li><strong>Xalis gəlirlilik</strong> vergiləri, boş qalan ayları, təmir və idarəetmə xərclərini çıxdıqdan sonra hesablanır.</li>
</ul>
<p>Nümunə: 200 000 AZN-lik obyekt ayda 1 800 AZN icarəyə verilir. İllik ümumi gəlir 21 600 AZN, ümumi gəlirlilik 10,8%. Bir ay boş qalma, vergi və xərclər çıxıldıqdan sonra xalis gəlirlilik xeyli aşağı olacaq. Saytdakı <a href="/investisiya">investisiya kalkulyatoru</a> ilə hesablayın.</p>

<h2>İcarə müqaviləsinin xüsusiyyətləri</h2>
<ul>
  <li>Müddət çox vaxt uzundur (1–5 il) və indeksasiya (illik artım) bəndi olur.</li>
  <li>Təmir və yenidənqurma kimin hesabınadır, müqavilə bitdikdə edilmiş yaxşılaşdırmaların taleyi.</li>
  <li>Kommunal və ümumi xərclərin bölgüsü.</li>
  <li>Subicarə hüququ, erkən xitam və cərimə şərtləri.</li>
</ul>

<h2>Vergi</h2>
<p>Kommersiya obyektinin icarəsindən gəlir, əmlak vergisi və torpaq vergisi Vergi Məcəlləsi ilə tənzimlənir; hüquqi şəxs və fərdi sahibkar üçün qaydalar fərqlidir. İnvestisiya qərarından əvvəl vergi məsləhətçisi ilə hesablama aparın.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='emlak-novleri'),'INVESTOR','ADVANCED','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","Azərbaycan Respublikasının Vergi Məcəlləsi","Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46948","https://e-qanun.az/framework/46958","https://e-qanun.az/framework/5456","https://www.taxes.gov.az/az"]','["kommersiya","icarə","investisiya","gəlirlilik","vergi"]',1,0,0,'Kommersiya obyekti alarkən və icarəyə götürərkən bələdçi',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_ilkin-ve-tekrar-bazar-arasindaki-ferqler','ilkin-ve-tekrar-bazar-arasindaki-ferqler','İlkin və təkrar mənzil bazarı arasındakı fərqlər','ilkin ve tekrar menzil bazari arasindaki ferqler ilkin bazar tikinticiden yeni menzil ve tekrar bazar evvelki mulkiyyetciden arasinda qiymet sened risk ipoteka imkani temir ve kocme vaxti baximindan ferqler ve hansi halda hansini secmek ilkin bazar tekrar bazar yeni tikili cixaris ipoteka bazar ve qiymet ilkin bazar menzilin ilk defe satildigi bazardir alici tikintici ve ya tikinti teskilati ile muqavile baglayir cox vaxt bina hele tikilir tekrar bazar artiq kiminse mulkiyyetinde olan menzilin yeni aliciya satilmasidir muqayise meyar ilkin bazar tekrar bazar qiymet tikintinin erken merhelesinde adeten asagi hisse hisse odenis imkani bazar qiymeti tam odenis ve ya ipoteka sened ekser hallarda ilkin muqavile cixaris bina istismara qebul edilenden sonra cixaris movcuddur olmalidir risk tikintinin gecikmesi ve ya dayanmasi keyfiyyet senedlesmenin uzanmasi huquqi tarixce yukluluk gizli qusurlar ipoteka cixaris olmadan adeten mumkun deyil bezi layiheler bank proqramlarina daxildir standart qaydada mumkundur temir cox vaxt qara karkas elave budce ve vaxt temirli secim var kohne temir yenilenmeli ola biler kocme vaxti aylar ve ya iller eqdden qisa muddet sonra bina muasir layihe lift parkinq tikinti ili ve veziyyeti ferqli ilkin bazarda neyi yoxlamali tikinticinin huquqi statusu ve evvelki layiheleri tehvil verilibmi cixarislar alinibmi tikinti icazesi ve torpaq sahesi uzerinde huquq muqavilede tehvil tarixi gecikme ucun mesuliyyet menzilin deqiq tesviri mertebe nomre sahe temir seviyyesi cixarisin alinmasi ucun ohdeliyi kim dasiyir ve hansi muddetde dovlet terefinden tikilen ve guzestli sertlerle satilan menziller mida layiheleri ayrica qaydalarla satilir sertleri menzil insaati dovlet agentliyinin resmi saytinda izleyin tekrar bazarda neyi yoxlamali cixaris mulkiyyetciler yuklulukler cixarisin yoxlanilmasi huquqi tarixce huquqi tarixcenin yoxlanilmasi binanin ve kommunikasiyalarin veziyyeti hansini secmek derhal kocmek ve ya ipoteka ile almaq lazimdirsa tekrar bazar ve ya istismara qebul edilmis cixarisi olan yeni tikili vaxt ve risk tolerantliginiz varsa qiymet ustunluyu axtarirsinizsa etibarli tikinticiden ilkin bazar investisiya meqsedi ile tikintinin merhelesi ve tikinticinin reputasiyasi gelirlilikden daha vacibdir','İlkin bazar (tikintiçidən yeni mənzil) və təkrar bazar (əvvəlki mülkiyyətçidən) arasında qiymət, sənəd, risk, ipoteka imkanı, təmir və köçmə vaxtı baxımından fərqlər və hansı halda hansını seçmək.','
<p><strong>İlkin bazar</strong> — mənzilin ilk dəfə satıldığı bazardır: alıcı tikintiçi və ya tikinti təşkilatı ilə müqavilə bağlayır, çox vaxt bina hələ tikilir. <strong>Təkrar bazar</strong> — artıq kiminsə mülkiyyətində olan mənzilin yeni alıcıya satılmasıdır.</p>

<h2>Müqayisə</h2>
<table>
  <thead><tr><th>Meyar</th><th>İlkin bazar</th><th>Təkrar bazar</th></tr></thead>
  <tbody>
    <tr><td>Qiymət</td><td>Tikintinin erkən mərhələsində adətən aşağı; hissə-hissə ödəniş imkanı</td><td>Bazar qiyməti; tam ödəniş və ya ipoteka</td></tr>
    <tr><td>Sənəd</td><td>Əksər hallarda ilkin müqavilə; çıxarış bina istismara qəbul ediləndən sonra</td><td>Çıxarış mövcuddur (olmalıdır)</td></tr>
    <tr><td>Risk</td><td>Tikintinin gecikməsi və ya dayanması, keyfiyyət, sənədləşmənin uzanması</td><td>Hüquqi tarixçə, yüklülük, gizli qüsurlar</td></tr>
    <tr><td>İpoteka</td><td>Çıxarış olmadan adətən mümkün deyil; bəzi layihələr bank proqramlarına daxildir</td><td>Standart qaydada mümkündür</td></tr>
    <tr><td>Təmir</td><td>Çox vaxt qara karkas — əlavə büdcə və vaxt</td><td>Təmirli seçim var; köhnə təmir yenilənməli ola bilər</td></tr>
    <tr><td>Köçmə vaxtı</td><td>Aylar və ya illər</td><td>Əqddən qısa müddət sonra</td></tr>
    <tr><td>Bina</td><td>Müasir layihə, lift, parkinq</td><td>Tikinti ili və vəziyyəti fərqli</td></tr>
  </tbody>
</table>

<h2>İlkin bazarda nəyi yoxlamalı</h2>
<ul>
  <li>Tikintiçinin hüquqi statusu və əvvəlki layihələri — təhvil verilibmi, çıxarışlar alınıbmı?</li>
  <li>Tikinti icazəsi və torpaq sahəsi üzərində hüquq.</li>
  <li>Müqavilədə təhvil tarixi, gecikmə üçün məsuliyyət, mənzilin dəqiq təsviri (mərtəbə, nömrə, sahə), təmir səviyyəsi.</li>
  <li>Çıxarışın alınması üçün öhdəliyi kim daşıyır və hansı müddətdə?</li>
</ul>
<p>Dövlət tərəfindən tikilən və güzəştli şərtlərlə satılan mənzillər (MİDA layihələri) ayrıca qaydalarla satılır; şərtləri Mənzil İnşaatı Dövlət Agentliyinin rəsmi saytında izləyin.</p>

<h2>Təkrar bazarda nəyi yoxlamalı</h2>
<ul>
  <li>Çıxarış, mülkiyyətçilər, yüklülüklər: <a href="/bilik-merkezi/cixarisin-ve-huquqi-senedlerin-yoxlanilmasi">Çıxarışın yoxlanılması</a>.</li>
  <li>Hüquqi tarixçə: <a href="/bilik-merkezi/emlakin-huquqi-tarixcesinin-yoxlanilmasi">Hüquqi tarixçənin yoxlanılması</a>.</li>
  <li>Binanın və kommunikasiyaların vəziyyəti.</li>
</ul>

<h2>Hansını seçmək?</h2>
<ul>
  <li><strong>Dərhal köçmək və ya ipoteka ilə almaq lazımdırsa</strong> — təkrar bazar və ya istismara qəbul edilmiş, çıxarışı olan yeni tikili.</li>
  <li><strong>Vaxt və risk tolerantlığınız varsa, qiymət üstünlüyü axtarırsınızsa</strong> — etibarlı tikintiçidən ilkin bazar.</li>
  <li><strong>İnvestisiya məqsədi ilə</strong> — tikintinin mərhələsi və tikintiçinin reputasiyası gəlirlilikdən daha vacibdir.</li>
</ul>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='bazar-qiymet'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi","Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46958","https://e-qanun.az/framework/5456","https://www.mida.gov.az/","https://mcgf.gov.az/az/ipoteka-krediti"]','["ilkin bazar","təkrar bazar","yeni tikili","çıxarış","ipoteka"]',1,0,0,'İlkin və təkrar mənzil bazarı arasındakı fərqlər',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_yeni-tikili-yoxsa-kohne-tikili','yeni-tikili-yoxsa-kohne-tikili','Yeni tikili, yoxsa köhnə tikili? Seçim meyarları','yeni tikili yoxsa kohne tikili secim meyarlari yeni ve kohne tikilinin konstruksiya sened kommunal xercler ses izolyasiyasi infrastruktur temir ve qiymet baximindan muqayisesi kohne binada en cox rast gelinen problemler ve yeni tikilide riskler yeni tikili kohne tikili menzil mtk cixaris tikinti ve yeni tikililer bakida yeni tikili adeten son 15 20 ilde tikilmis monolit karkas binalari kohne tikili ise sovet dovrunde tikilmis das panel ve ya blok binalari ifade edir her birinin oz ustunlukleri ve riskleri var secim sizin prioritetlerinizden asilidir muqayise cedveli meyar yeni tikili kohne tikili konstruksiya monolit karkas serbest plan imkani das divarlar yaxsi istilik saxlama ve ya panel mehdud yenidenplanlasdirma sened cixaris olmaya biler mtk ilkin muqavile adeten cixaris var kommunikasiyalar yeni ferdi kombi muasir elektrik xetti kohne borular ve xetler deyisdirilmesi lazim ola biler lift ve parkinq adeten var cox vaxt kohne lift ve ya yoxdur parkinq cetin ses izolyasiyasi tikinticiden asili bezen zeif das binalarda yaxsi panel binalarda zeif infrastruktur yeni mehellelerde hele formalasa biler formalasmis mekteb poliklinika neqliyyat ayliq xercler bina xidmeti haqqi daha yuksek ola biler adeten asagi qiymet 1 m2 eraziden asili cox vaxt yuksek merkezi erazilerde yuksek digerlerinde asagi yeni tikilide riskler senedlesme bina istismara qebul edilmeyibse cixaris alinmayib mtk senedi mulkiyyet huququ yaratmir ve ipoteka ucun qebul edilmir tikinti keyfiyyeti catlar nemlik zeif izolyasiya ilk illerde uze cixir icaze ve layihe tikinti icazesi mertebe sayinin layiheye uygunlugu bina idareetmesi mtk ve ya idareetme sirketinin xidmet haqqi ve keyfiyyeti sened deyisikliyi ucun elave odenis telebi her teleb olunan odenisin huquqi ve muqavile esasi yazili gosterilmelidir kohne tikilide riskler kommunikasiyalar su kanalizasiya ve elektrik xetleri kohnelib temir budcesine daxil edin dam ve fasad sonuncu mertebede dam axmasi tipik problemdir icazesiz yenidenplanlasdirma evvelki sakinlerin etdiyi deyisiklikler sokulmus divar qapadilmis balkon seysmik davamliliq binanin veziyyeti barede mutexessis reyi faydalidir nece qerar vermek ipoteka lazimdirsa cixarisi olan emlak sertdir kohne tikili ve ya istismara qebul edilmis yeni bina formalasmis infrastruktur vacibdirse merkezi erazilerde kohne tikili ustunluk teskil edir muasir komfort lift parkinq kombi vacibdirse yeni tikili budce mehduddursa kohne tikili merheleli temir ve ya etibarli tikinticiden erken merhelede yeni menzil risk nezere alinmaqla bazar seviyyesinde ferqler ilkin ve tekrar bazar','Yeni və köhnə tikilinin konstruksiya, sənəd, kommunal xərclər, səs izolyasiyası, infrastruktur, təmir və qiymət baxımından müqayisəsi; köhnə binada ən çox rast gəlinən problemlər və yeni tikilidə risklər.','
<p>Bakıda «yeni tikili» adətən son 15–20 ildə tikilmiş monolit-karkas binaları, «köhnə tikili» isə sovet dövründə tikilmiş daş, panel və ya blok binaları ifadə edir. Hər birinin öz üstünlükləri və riskləri var — seçim sizin prioritetlərinizdən asılıdır.</p>

<h2>Müqayisə cədvəli</h2>
<table>
  <thead><tr><th>Meyar</th><th>Yeni tikili</th><th>Köhnə tikili</th></tr></thead>
  <tbody>
    <tr><td>Konstruksiya</td><td>Monolit-karkas, sərbəst plan imkanı</td><td>Daş divarlar (yaxşı istilik saxlama) və ya panel (məhdud yenidənplanlaşdırma)</td></tr>
    <tr><td>Sənəd</td><td>Çıxarış olmaya bilər (MTK, ilkin müqavilə)</td><td>Adətən çıxarış var</td></tr>
    <tr><td>Kommunikasiyalar</td><td>Yeni; fərdi kombi, müasir elektrik xətti</td><td>Köhnə borular və xətlər, dəyişdirilməsi lazım ola bilər</td></tr>
    <tr><td>Lift və parkinq</td><td>Adətən var</td><td>Çox vaxt köhnə lift və ya yoxdur, parkinq çətin</td></tr>
    <tr><td>Səs izolyasiyası</td><td>Tikintiçidən asılı, bəzən zəif</td><td>Daş binalarda yaxşı, panel binalarda zəif</td></tr>
    <tr><td>İnfrastruktur</td><td>Yeni məhəllələrdə hələ formalaşa bilər</td><td>Formalaşmış: məktəb, poliklinika, nəqliyyat</td></tr>
    <tr><td>Aylıq xərclər</td><td>Bina xidməti haqqı daha yüksək ola bilər</td><td>Adətən aşağı</td></tr>
    <tr><td>Qiymət (1 m²)</td><td>Ərazidən asılı, çox vaxt yüksək</td><td>Mərkəzi ərazilərdə yüksək, digərlərində aşağı</td></tr>
  </tbody>
</table>

<h2>Yeni tikilidə risklər</h2>
<ul>
  <li><strong>Sənədləşmə:</strong> bina istismara qəbul edilməyibsə, çıxarış alınmayıb. MTK sənədi mülkiyyət hüququ yaratmır və ipoteka üçün qəbul edilmir.</li>
  <li><strong>Tikinti keyfiyyəti:</strong> çatlar, nəmlik, zəif izolyasiya ilk illərdə üzə çıxır.</li>
  <li><strong>İcazə və layihə:</strong> tikinti icazəsi, mərtəbə sayının layihəyə uyğunluğu.</li>
  <li><strong>Bina idarəetməsi:</strong> MTK və ya idarəetmə şirkətinin xidmət haqqı və keyfiyyəti.</li>
  <li><strong>Sənəd dəyişikliyi üçün əlavə ödəniş tələbi:</strong> hər tələb olunan ödənişin hüquqi və müqavilə əsası yazılı göstərilməlidir.</li>
</ul>

<h2>Köhnə tikilidə risklər</h2>
<ul>
  <li><strong>Kommunikasiyalar:</strong> su, kanalizasiya və elektrik xətləri köhnəlib — təmir büdcəsinə daxil edin.</li>
  <li><strong>Dam və fasad:</strong> sonuncu mərtəbədə dam axması tipik problemdir.</li>
  <li><strong>İcazəsiz yenidənplanlaşdırma:</strong> əvvəlki sakinlərin etdiyi dəyişikliklər (sökülmüş divar, qapadılmış balkon).</li>
  <li><strong>Seysmik davamlılıq:</strong> binanın vəziyyəti barədə mütəxəssis rəyi faydalıdır.</li>
</ul>

<h2>Necə qərar vermək</h2>
<ol>
  <li><strong>İpoteka lazımdırsa:</strong> çıxarışı olan əmlak şərtdir — köhnə tikili və ya istismara qəbul edilmiş yeni bina.</li>
  <li><strong>Formalaşmış infrastruktur vacibdirsə:</strong> mərkəzi ərazilərdə köhnə tikili üstünlük təşkil edir.</li>
  <li><strong>Müasir komfort (lift, parkinq, kombi) vacibdirsə:</strong> yeni tikili.</li>
  <li><strong>Büdcə məhduddursa:</strong> köhnə tikili + mərhələli təmir, və ya etibarlı tikintiçidən erkən mərhələdə yeni mənzil (risk nəzərə alınmaqla).</li>
</ol>
<p>Bazar səviyyəsində fərqlər: <a href="/bilik-merkezi/ilkin-ve-tekrar-bazar-arasindaki-ferqler">İlkin və təkrar bazar</a>.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='yeni-tikili'),'BUYER','BEGINNER','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi","Azərbaycan Respublikasının Mənzil Məcəlləsi","«Daşınmaz əmlakın dövlət reyestri haqqında» Azərbaycan Respublikasının Qanunu"]','["https://e-qanun.az/framework/46958","https://e-qanun.az/framework/46955","https://e-qanun.az/framework/5456","https://arxkom.gov.az/"]','["yeni tikili","köhnə tikili","mənzil","MTK","çıxarış"]',2,1,0,'Yeni tikili, yoxsa köhnə tikili? Seçim meyarları',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_emlakin-real-bazar-qiymetinin-mueyyen-edilmesi','emlakin-real-bazar-qiymetinin-mueyyen-edilmesi','Əmlakın real bazar qiymətinin müəyyən edilməsi','emlakin real bazar qiymetinin mueyyen edilmesi muqayiseli tehlil 1 m2 uzre median qiymet duzelis emsallari elan qiymeti ile satis qiymeti arasindaki ferq ve pesekar qiymetlendirme alici ve satici ucun emlakin real deyerini hesablamaq usullari bazar qiymeti qiymetlendirme satis investisiya bazar ve qiymet emlakin real qiymeti alici ile saticinin azad bazarda tezyiq olmadan razilasa bileceyi qiymetdir satici qiymeti yuksek qoyanda elan aylarla satilmir alici ise bazardan yuksek odeye biler qiymeti mueyyen etmek ucun bir nece usulu birlikde isletmek lazimdir 1 muqayiseli tehlil en cox isledilen usul oxsar obyektleri secin eyni erazi mumkunse eyni bina eyni nov yeni kohne tikili yaxin sahe ve otaq sayi 1 m2 qiymetini hesablayin qiymet sahe mediani goturun ortalama deyil median bir nece hedden artiq yuksek ve ya asagi elan neticeni tehrif etmesin duzelisler edin asagidaki cedvel uzre median sahe ilkin qiymet texmini qiymete tesir eden amiller amil tesir istiqameti cixarisin olmasi artirir ipoteka imkani asagi risk mertebe birinci sonuncu adeten azaldir temir seviyyesi yeni keyfiyyetli temir artirir temirsiz azaldir metroya ve esas yola yaxinliq artirir gorunus deniz park artirir binanin veziyyeti lift parkinq artirir ses kuy ekoloji problemler azaldir senedlesdirilmemis deyisiklikler azaldir 2 elan qiymeti satis qiymeti elan qiymeti saticinin isteyidir danisiqlardan sonra real satis qiymeti cox vaxt asagi olur uzun muddet satilmayan elanlar qiymetin yuksek oldugunu gosterir elanin yerlesdirilme tarixine ve qiymet deyisikliyi tarixcesine diqqet edin bu saytda elanin qiymet tarixcesi elan sehifesinde gosterilir 3 saytdaki qiymet gostericisi elan sehifesinde emlakin 1 m2 qiymeti eyni rayonda numune azdirsa seherde eyni nov ve elan tipindeki elanlarin median qiymeti ile muqayise edilir en azi 5 muqayise olunan elan olduqda gosterici cixir 10 ferq bazara uygun sayilir saticilar evimi qiymetlendir aleti ile ilkin texmin ala bilerler bu gostericiler pesekar qiymetlendirmeni evez etmir 4 pesekar qiymetlendirme ipoteka vereselik bolgusu mehkeme mubahisesi ve ya boyuk investisiya qerarinda musteqil qiymetlendiricinin hesabati lazimdir qiymetlendirici bazar xerc ve gelir yanasmalarini tetbiq edir ve resmi hesabat verir 5 gelir yanasmasi investor ucun kirayeye verilecek emlakda qiymet gozlenilen gelire gore de yoxlanilir illik xalis kiraye geliri alis qiymeti gelirlilik erazi uzre orta gostericiden xeyli asagidirsa qiymet yuksekdir satici ucun praktiki meslehet qiymeti medianin etrafinda danisiq ucun kicik ehtiyatla qoyun ilk 2 3 heftede zeng ve baxis azdirsa qiymeti yeniden qiymetlendirin hazirliq barede menzil satisina hazirliq','Müqayisəli təhlil, 1 m² üzrə median qiymət, düzəliş əmsalları, elan qiyməti ilə satış qiyməti arasındakı fərq və peşəkar qiymətləndirmə — alıcı və satıcı üçün əmlakın real dəyərini hesablamaq üsulları.','
<p>Əmlakın «real» qiyməti — alıcı ilə satıcının azad bazarda, təzyiq olmadan razılaşa biləcəyi qiymətdir. Satıcı qiyməti yüksək qoyanda elan aylarla satılmır, alıcı isə bazardan yüksək ödəyə bilər. Qiyməti müəyyən etmək üçün bir neçə üsulu birlikdə işlətmək lazımdır.</p>

<h2>1. Müqayisəli təhlil (ən çox işlədilən üsul)</h2>
<ol>
  <li><strong>Oxşar obyektləri seçin:</strong> eyni ərazi (mümkünsə eyni bina), eyni növ (yeni/köhnə tikili), yaxın sahə və otaq sayı.</li>
  <li><strong>1 m² qiymətini hesablayın:</strong> qiymət / sahə.</li>
  <li><strong>Medianı götürün:</strong> ortalama deyil, median — bir neçə həddən artıq yüksək və ya aşağı elan nəticəni təhrif etməsin.</li>
  <li><strong>Düzəlişlər edin</strong> — aşağıdakı cədvəl üzrə.</li>
  <li><strong>Median × sahə</strong> — ilkin qiymət təxmini.</li>
</ol>

<h2>Qiymətə təsir edən amillər</h2>
<table>
  <thead><tr><th>Amil</th><th>Təsir istiqaməti</th></tr></thead>
  <tbody>
    <tr><td>Çıxarışın olması</td><td>Artırır — ipoteka imkanı, aşağı risk</td></tr>
    <tr><td>Mərtəbə (birinci/sonuncu)</td><td>Adətən azaldır</td></tr>
    <tr><td>Təmir səviyyəsi</td><td>Yeni, keyfiyyətli təmir artırır; təmirsiz — azaldır</td></tr>
    <tr><td>Metroya və əsas yola yaxınlıq</td><td>Artırır</td></tr>
    <tr><td>Görünüş (dəniz, park)</td><td>Artırır</td></tr>
    <tr><td>Binanın vəziyyəti, lift, parkinq</td><td>Artırır</td></tr>
    <tr><td>Səs-küy, ekoloji problemlər</td><td>Azaldır</td></tr>
    <tr><td>Sənədləşdirilməmiş dəyişikliklər</td><td>Azaldır</td></tr>
  </tbody>
</table>

<h2>2. Elan qiyməti ≠ satış qiyməti</h2>
<p>Elan qiyməti satıcının istəyidir; danışıqlardan sonra real satış qiyməti çox vaxt aşağı olur. Uzun müddət satılmayan elanlar qiymətin yüksək olduğunu göstərir. Elanın yerləşdirilmə tarixinə və qiymət dəyişikliyi tarixçəsinə diqqət edin — bu saytda elanın qiymət tarixçəsi elan səhifəsində göstərilir.</p>

<h2>3. Saytdakı qiymət göstəricisi</h2>
<p>Elan səhifəsində əmlakın 1 m² qiyməti eyni rayonda (nümunə azdırsa, şəhərdə), eyni növ və elan tipindəki elanların median qiyməti ilə müqayisə edilir. Ən azı 5 müqayisə olunan elan olduqda göstərici çıxır; ±10% fərq «bazara uyğun» sayılır. Satıcılar <a href="/emlakimi-sat">«Evimi qiymətləndir»</a> aləti ilə ilkin təxmin ala bilərlər. Bu göstəricilər peşəkar qiymətləndirməni əvəz etmir.</p>

<h2>4. Peşəkar qiymətləndirmə</h2>
<p>İpoteka, vərəsəlik bölgüsü, məhkəmə mübahisəsi və ya böyük investisiya qərarında müstəqil qiymətləndiricinin hesabatı lazımdır. Qiymətləndirici bazar, xərc və gəlir yanaşmalarını tətbiq edir və rəsmi hesabat verir.</p>

<h2>5. Gəlir yanaşması (investor üçün)</h2>
<p>Kirayəyə veriləcək əmlakda qiymət gözlənilən gəlirə görə də yoxlanılır: illik xalis kirayə gəliri / alış qiyməti. Gəlirlilik ərazi üzrə orta göstəricidən xeyli aşağıdırsa, qiymət yüksəkdir.</p>

<h2>Satıcı üçün praktiki məsləhət</h2>
<ul>
  <li>Qiyməti medianın ətrafında, danışıq üçün kiçik ehtiyatla qoyun.</li>
  <li>İlk 2–3 həftədə zəng və baxış azdırsa, qiyməti yenidən qiymətləndirin.</li>
  <li>Hazırlıq barədə: <a href="/bilik-merkezi/menzil-satisina-hazirliq">Mənzil satışına hazırlıq</a>.</li>
</ul>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='bazar-qiymet'),'SELLER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Mülki Məcəlləsi"]','["https://e-qanun.az/framework/46944","https://www.stat.gov.az/"]','["bazar qiyməti","qiymətləndirmə","satış","investisiya"]',2,1,0,'Əmlakın real bazar qiymətinin müəyyən edilməsi',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","tags","readMinutes","isFeatured","isDemo","metaTitle","metaDescription","publishedAt","createdAt","updatedAt") VALUES ('knowledge_guide_erazinin-qiymetlendirilmesi-baki-ve-regionlar','erazinin-qiymetlendirilmesi-baki-ve-regionlar','Bakı və regionlarda əmlak seçərkən ərazini necə qiymətləndirmək','baki ve regionlarda emlak secerken erazini nece qiymetlendirmek bakinin merkezi rayonlari seheretrafi qesebeler ve regionlarda emlak secerken neqliyyat infrastruktur is yerleri ekologiya inkisaf planlari ve likvidlik meyarlari erazini yoxlamaq ucun praktiki usullar erazi infrastruktur baki regionlar investisiya bazar ve qiymet emlakin deyerini mueyyen eden en guclu amil yerlesmedir eyni menzil merkezde ve seheretrafi qesebede bir nece defe ferqli qiymete satilir eyni zamanda gundelik heyat keyfiyyeti ve gelecekde satis asanligi likvidlik da eraziden asilidir baki erazi tipleri erazi tipi ustunlukler diqqet merkezi rayonlar sebail nesimi yasamal nerimanov formalasmis infrastruktur metro yuksek likvidlik yuksek qiymet tixac dayanacaq cetinliyi yasayis rayonlari bineqedi xetai nizami suraxani ve s qiymet keyfiyyet balansi metroya cixis binadan binaya keyfiyyet ferqi boyukdur seheretrafi qesebeler abseron yarimadasi heyet evi torpaq asagi qiymet neqliyyat asililigi kommunikasiya ve sened problemleri rayon qesebe ve kend bolgusu resmi inzibati erazi bolgusu tesnifati na esaslanir elanlarda qesebe kimi yazilan bezi yerler eslinde massiv ve ya mehelledir unvani resmi bolgu ile yoxlayin regionlar boyuk seherler gence sumqayit mingecevir lenkeran seki ve s formalasmis bazar kiraye telebi universitet ve is yerleri ile baglidir turizm erazileri qebele quba seki lenkeran sahili movsumi kiraye imkani amma teleb ilboyu sabit deyil rayon merkezleri ve kendler qiymet asagidir likvidlik de asagidir satis uzun ceke biler qiymetlendirme meyarlari neqliyyat is yerine ve mektebe pik saatda real gedis vaxti sosial infrastruktur mekteb bagca poliklinika market kommunikasiyalar qaz su elektrik internetin sabitliyi xususile qesebelerde ekologiya senaye neft medenleri poliqonlar gollere yaxinliq tehlukesizlik ve isiqlandirma inkisaf planlari yeni yol metro stansiyasi ve ya park deyeri artirir yaxinliqda senaye obyekti ve ya hundur bina azalda biler likvidlik bu erazide elanlar ne qeder tez satilir oxsar elanlarin sayi ve qiymet dinamikasi erazini nece yoxlamali gunun muxtelif vaxtlarinda seher pik saati axsam istirahet gunu gezin sakinlerle ve yerli dukancilarla danisin xeritede mesafeleri deyil marsrut vaxtini olcun saytdaki bazar analitikasi ve rayon sehifelerinde erazi uzre qiymet gostericilerine baxin resmi statistika ucun dovlet statistika komitesinin melumatlarina muraciet edin yekun erazi seciminde en ucuz deyil sizin gundelik heyatiniz ucun en uygun ve gelecekde satila bilen yeri axtarin bina ve menzil seviyyesinde yoxlama bina infrastruktur ve erazi yoxlamasi','Bakının mərkəzi rayonları, şəhərətrafı qəsəbələr və regionlarda əmlak seçərkən nəqliyyat, infrastruktur, iş yerləri, ekologiya, inkişaf planları və likvidlik meyarları; ərazini yoxlamaq üçün praktiki üsullar.','
<p>Əmlakın dəyərini müəyyən edən ən güclü amil yerləşmədir. Eyni mənzil mərkəzdə və şəhərətrafı qəsəbədə bir neçə dəfə fərqli qiymətə satılır; eyni zamanda gündəlik həyat keyfiyyəti və gələcəkdə satış asanlığı (likvidlik) da ərazidən asılıdır.</p>

<h2>Bakı: ərazi tipləri</h2>
<table>
  <thead><tr><th>Ərazi tipi</th><th>Üstünlüklər</th><th>Diqqət</th></tr></thead>
  <tbody>
    <tr><td>Mərkəzi rayonlar (Səbail, Nəsimi, Yasamal, Nərimanov)</td><td>Formalaşmış infrastruktur, metro, yüksək likvidlik</td><td>Yüksək qiymət, tıxac, dayanacaq çətinliyi</td></tr>
    <tr><td>Yaşayış rayonları (Binəqədi, Xətai, Nizami, Suraxanı və s.)</td><td>Qiymət/keyfiyyət balansı, metroya çıxış</td><td>Binadan-binaya keyfiyyət fərqi böyükdür</td></tr>
    <tr><td>Şəhərətrafı qəsəbələr (Abşeron yarımadası)</td><td>Həyət evi, torpaq, aşağı qiymət</td><td>Nəqliyyat asılılığı, kommunikasiya və sənəd problemləri</td></tr>
  </tbody>
</table>
<p>Rayon, qəsəbə və kənd bölgüsü rəsmi «İnzibati ərazi bölgüsü təsnifatı»na əsaslanır. Elanlarda «qəsəbə» kimi yazılan bəzi yerlər əslində massiv və ya məhəllədir — ünvanı rəsmi bölgü ilə yoxlayın.</p>

<h2>Regionlar</h2>
<ul>
  <li><strong>Böyük şəhərlər</strong> (Gəncə, Sumqayıt, Mingəçevir, Lənkəran, Şəki və s.): formalaşmış bazar, kirayə tələbi universitet və iş yerləri ilə bağlıdır.</li>
  <li><strong>Turizm əraziləri</strong> (Qəbələ, Quba, Şəki, Lənkəran sahili): mövsümi kirayə imkanı, amma tələb ilboyu sabit deyil.</li>
  <li><strong>Rayon mərkəzləri və kəndlər:</strong> qiymət aşağıdır, likvidlik də aşağıdır — satış uzun çəkə bilər.</li>
</ul>

<h2>Qiymətləndirmə meyarları</h2>
<ol>
  <li><strong>Nəqliyyat:</strong> iş yerinə və məktəbə pik saatda real gediş vaxtı.</li>
  <li><strong>Sosial infrastruktur:</strong> məktəb, bağça, poliklinika, market.</li>
  <li><strong>Kommunikasiyalar:</strong> qaz, su, elektrik, internetin sabitliyi — xüsusilə qəsəbələrdə.</li>
  <li><strong>Ekologiya:</strong> sənaye, neft mədənləri, poliqonlar, göllərə yaxınlıq.</li>
  <li><strong>Təhlükəsizlik və işıqlandırma.</strong></li>
  <li><strong>İnkişaf planları:</strong> yeni yol, metro stansiyası və ya park dəyəri artırır; yaxınlıqda sənaye obyekti və ya hündür bina — azalda bilər.</li>
  <li><strong>Likvidlik:</strong> bu ərazidə elanlar nə qədər tez satılır? Oxşar elanların sayı və qiymət dinamikası.</li>
</ol>

<h2>Ərazini necə yoxlamalı</h2>
<ul>
  <li>Günün müxtəlif vaxtlarında (səhər pik saatı, axşam, istirahət günü) gəzin.</li>
  <li>Sakinlərlə və yerli dükançılarla danışın.</li>
  <li>Xəritədə məsafələri deyil, marşrut vaxtını ölçün.</li>
  <li>Saytdakı <a href="/bazar-analitikasi">bazar analitikası</a> və rayon səhifələrində ərazi üzrə qiymət göstəricilərinə baxın.</li>
  <li>Rəsmi statistika üçün Dövlət Statistika Komitəsinin məlumatlarına müraciət edin.</li>
</ul>

<h2>Yekun</h2>
<p>Ərazi seçimində «ən ucuz» deyil, «sizin gündəlik həyatınız üçün ən uyğun və gələcəkdə satıla bilən» yeri axtarın. Bina və mənzil səviyyəsində yoxlama: <a href="/bilik-merkezi/bina-infrastruktur-ve-erazi-yoxlamasi">Bina, infrastruktur və ərazi yoxlaması</a>.</p>
',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='bazar-qiymet'),'BUYER','INTERMEDIATE','PUBLISHED','CURRENT','YELLOW','Azərbaycan Respublikası','["Azərbaycan Respublikasının Şəhərsalma və Tikinti Məcəlləsi"]','["https://e-qanun.az/framework/46958","https://www.stat.gov.az/","https://arxkom.gov.az/","https://e-qanun.az/framework/57325"]','["ərazi","infrastruktur","Bakı","regionlar","investisiya"]',2,0,0,'Bakı və regionlarda əmlak seçərkən ərazini necə qiymətləndirmək',NULL,'2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');

UPDATE "KnowledgeArticle" SET "tags"='["alqı-satqı","müqavilə","notarius","çıxarış","beh"]' WHERE "slug"='menzil-ve-diger-dasinmaz-emlakin-alqi-satqisi' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["kirayə","müqavilə","depozit"]' WHERE "slug"='kiraye-munasibetleri' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["vərəsəlik","miras","paylı mülkiyyət"]' WHERE "slug"='miras-ve-mulkiyyetin-oturulmesi' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["ipoteka","kredit","İKZF"]' WHERE "slug"='ipoteka-ve-kreditlesme' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["notarius","dövlət qeydiyyatı","çıxarış"]' WHERE "slug"='notariat-elektron-xidmetler-ve-dovlet-qeydiyyati' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["vergi","dövlət rüsumu","xərclər"]' WHERE "slug"='vergiler-dovlet-rusumlari-ve-emeliyyat-xercleri' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["yeni tikili","MTK","tikinti icazəsi"]' WHERE "slug"='tikinti-ve-yeni-tikililer' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["torpaq","təyinat"]' WHERE "slug"='torpaq-munasibetleri' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["məhkəmə","mübahisə","risklər"]' WHERE "slug"='mehkeme-praktikasindan-numuneler-ve-tez-tez-rastlanan-mubahiseler' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "tags"='["agentlik","komissiya","broker"]' WHERE "slug"='emlak-agentinin-huquqi-statusu-komissiya-ve-mesuliyyet' AND ("tags" IS NULL OR "tags"='[]');
UPDATE "KnowledgeArticle" SET "searchText"=replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower("title" || ' ' || "excerpt" || ' ' || COALESCE("tags",'') || ' ' || COALESCE("legalBasis",'') || ' ' || COALESCE("requiredDocuments",'') || ' ' || COALESCE("procedure",'') || ' ' || COALESCE("costs",'') || ' ' || COALESCE("risks",'') || ' ' || COALESCE("checklist",'') || ' ' || "content"), 'Ə', 'e'), 'ə', 'e'), 'Ş', 's'), 'ş', 's'), 'Ç', 'c'), 'ç', 'c'), 'Ğ', 'g'), 'ğ', 'g'), 'İ', 'i'), 'ı', 'i'), 'Ö', 'o'), 'ö', 'o'), 'Ü', 'u'), 'ü', 'u'), '<', ' '), '>', ' ') WHERE "id" NOT LIKE 'knowledge_guide_%';

INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_yukluluk','yukluluk','Yüklülük','yukluluk emlak uzerinde mulkiyyetcinin serencam huququnu mehdudlasdiran ve reyestrde qeyde alinan huquq ve ya qadaga ipoteka hebs icare ve s','Əmlak üzərində mülkiyyətçinin sərəncam hüququnu məhdudlaşdıran və reyestrdə qeydə alınan hüquq və ya qadağa (ipoteka, həbs, icarə və s.).','<p>Yüklülük əmlakın satışını, bağışlanmasını və ya girov qoyulmasını məhdudlaşdıra bilər. Ən çox rast gəlinən növləri ipoteka, məhkəmə və ya icra orqanının həbsi, notarial qadağa və uzunmüddətli icarədir. Alışdan əvvəl yüklülüyün olub-olmadığı reyestr üzrə yoxlanmalıdır.</p>','Y',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'PUBLISHED',200,'["cixaris-kupca","ipoteka","hebs"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_hebs','hebs','Həbs (əmlak üzərində)','hebs emlak uzerinde mehkeme ve ya icra orqaninin qerari ile emlakin ozgeninkilesdirilmesine qoyulan mehdudiyyet','Məhkəmə və ya icra orqanının qərarı ilə əmlakın özgəninkiləşdirilməsinə qoyulan məhdudiyyət.','<p>Həbs qoyulmuş əmlak həbs götürülənə qədər satıla və ya bağışlana bilməz. Həbs çox vaxt borc və ya məhkəmə mübahisəsi ilə bağlı olur və reyestrdə qeydə alınır.</p>','H',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'PUBLISHED',210,'["yukluluk","cixaris-kupca"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_etibarname','etibarname','Etibarnamə','etibarname bir sexsin diger sexse oz adindan huquqi hereketler etmek selahiyyeti verdiyi yazili sened dasinmaz emlak eqdleri ucun notarial qaydada tesdiqlenir','Bir şəxsin digər şəxsə öz adından hüquqi hərəkətlər etmək səlahiyyəti verdiyi yazılı sənəd; daşınmaz əmlak əqdləri üçün notarial qaydada təsdiqlənir.','<p>Etibarnamədə nümayəndənin konkret səlahiyyətləri (satmaq, pul almaq, sənəd imzalamaq) və müddəti göstərilir. Etibarnamə ilə alışda onun əslini, müddətini və ləğv edilmədiyini yoxlamaq, ödənişi isə mümkünsə mülkiyyətçinin öz hesabına köçürmək tövsiyə olunur.</p>','E',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='agentlik-brokerlik'),'PUBLISHED',220,'["numayende","notarius"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_notarius','notarius','Notarius','notarius qanunla mueyyen edilmis notarial hereketleri o cumleden dasinmaz emlak muqavilelerinin tesdiqini heyata keciren selahiyyetli sexs','Qanunla müəyyən edilmiş notarial hərəkətləri, o cümlədən daşınmaz əmlak müqavilələrinin təsdiqini həyata keçirən səlahiyyətli şəxs.','<p>Notarius tərəflərin şəxsiyyətini, fəaliyyət qabiliyyətini, əmlak üzərində hüquqları və əqdin qanuniliyini yoxlayır, müqaviləni təsdiq edir və qeydiyyat üçün sənədləri reyestr orqanına təqdim edir. Azərbaycanda dövlət və xüsusi notariuslar fəaliyyət göstərir.</p>','N',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='qeydiyyat-notariat'),'PUBLISHED',230,'["dovlet-rusumu","alqi-satqi-muqavilesi"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_alqi-satqi-muqavilesi','alqi-satqi-muqavilesi','Alqı-satqı müqaviləsi','alqi satqi muqavilesi saticinin emlaki alicinin mulkiyyetine vermeyi alicinin ise onu qebul edib qiymetini odemeyi ohdesine goturduyu muqavile','Satıcının əmlakı alıcının mülkiyyətinə verməyi, alıcının isə onu qəbul edib qiymətini ödəməyi öhdəsinə götürdüyü müqavilə.','<p>Daşınmaz əmlakın alqı-satqı müqaviləsi notarial qaydada təsdiqlənir; alıcının mülkiyyət hüququ isə dövlət reyestrində qeydiyyat anından yaranır. Müqavilədə əmlakın dəqiq təsviri, qiymət, ödəniş qaydası və təhvil şərtləri göstərilməlidir.</p>','A',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'PUBLISHED',240,'["beh","notarius","cixaris-kupca"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_avans','avans','Avans','avans gelecek odenisin qabaqcadan verilen hissesi eqd bas tutmasa qaytarilir behden ferqli olaraq cerime funksiyasi dasimir','Gələcək ödənişin qabaqcadan verilən hissəsi; əqd baş tutmasa, qaytarılır — behdən fərqli olaraq cərimə funksiyası daşımır.','<p>Avans və beh tez-tez qarışdırılır. Beh müqavilənin icrasını təmin edir: onu verən tərəf imtina etsə, beh itirilir, alan tərəf imtina etsə, ikiqat qaytarılır. Avans isə sadəcə ödənişin bir hissəsidir. Sənəddə hansı termin işləndiyi nəticəni müəyyən edir.</p>','A',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='alqi-satqi'),'PUBLISHED',250,'["beh","alqi-satqi-muqavilesi"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_ilkin-odenis','ilkin-odenis','İlkin ödəniş','ilkin odenis ipoteka ile alisda emlak deyerinin alicinin oz vesaiti hesabina odenilen hissesi','İpoteka ilə alışda əmlak dəyərinin alıcının öz vəsaiti hesabına ödənilən hissəsi.','<p>İKZF-nin güzəştli ipotekasında minimal ilkin ödəniş 10%, adi ipotekasında 15%-dir (mcgf.gov.az, 29.09.2026). İlkin ödəniş nə qədər böyükdürsə, kredit məbləği, aylıq ödəniş və ümumi faiz xərci bir o qədər az olur.</p>','I',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'PUBLISHED',260,'["ipoteka","ikzf","annuitet"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_ikzf','ikzf','İKZF (İpoteka və Kredit Zəmanət Fondu)','ikzf ipoteka ve kredit zemanet fondu guzestli ve adi ipoteka kreditlerini muvekkil banklar vasitesile maliyyelesdiren ve kreditlere zemanet veren dovlet fondu','Güzəştli və adi ipoteka kreditlərini müvəkkil banklar vasitəsilə maliyyələşdirən və kreditlərə zəmanət verən dövlət fondu.','<p>Fondun ipoteka krediti üçün müraciət elektron hökumət portalı üzərindən «Elektron ipoteka və kredit zəmanət» sistemi ilə təqdim olunur. Şərtlər (məbləğ, müddət, faiz, ilkin ödəniş) Fondun rəsmi saytında (mcgf.gov.az) dərc edilir.</p>','I',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'PUBLISHED',270,'["ipoteka","ilkin-odenis"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_annuitet','annuitet','Annuitet ödəniş','annuitet odenis kredit muddeti boyu beraber meblegde ayliq odenis evvelce faiz hissesi boyuk esas borc hissesi kicik olur','Kredit müddəti boyu bərabər məbləğdə aylıq ödəniş; əvvəlcə faiz hissəsi böyük, əsas borc hissəsi kiçik olur.','<p>İpoteka kreditlərində ən çox işlədilən ödəniş sxemidir. Alternativ — differensial ödənişdir: əsas borc bərabər hissələrlə ödənilir və aylıq məbləğ zamanla azalır.</p>','A',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'PUBLISHED',280,'["ilkin-odenis","illik-real-faiz"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_illik-real-faiz','illik-real-faiz','İllik real faiz dərəcəsi','illik real faiz derecesi nominal faizle yanasi komissiya sigorta ve diger mecburi xercleri eks etdiren kreditin real deyerini gosteren illik faiz','Nominal faizlə yanaşı komissiya, sığorta və digər məcburi xərcləri əks etdirən, kreditin real dəyərini göstərən illik faiz.','<p>Bank təkliflərini nominal faizə görə deyil, illik real (effektiv) faiz dərəcəsinə görə müqayisə etmək lazımdır — eyni nominal faizli iki kreditin real dəyəri komissiyalar səbəbindən xeyli fərqlənə bilər.</p>','I',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='ipoteka-maliyye'),'PUBLISHED',290,'["annuitet","ipoteka"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_mtk','mtk','MTK (Mənzil-tikinti kooperativi)','mtk menzil tikinti kooperativi uzvlerin vesaiti hesabina yasayis binasi tiken teskilat mtk senedi ozu mulkiyyet huququnu tesdiq etmir','Üzvlərin vəsaiti hesabına yaşayış binası tikən təşkilat; MTK sənədi özü mülkiyyət hüququnu təsdiq etmir.','<p>MTK üzvlüyü və ya MTK ilə bağlanmış müqavilə mülkiyyət hüququ yaratmır — hüquq çıxarış verildikdən sonra yaranır. Buna görə «kupçasız» mənzillərin alışı daha yüksək risk daşıyır və adətən ipoteka üçün qəbul edilmir. MTK tərəfindən tələb edilən hər ödənişin hüquqi əsası yazılı göstərilməlidir.</p>','M',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='yeni-tikili'),'PUBLISHED',300,'["ilkin-muqavile","cixaris-kupca","istismara-qebul"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_istismara-qebul','istismara-qebul','İstismara qəbul','istismara qebul tikintisi basa catmis binanin layiheye ve normalara uygunlugunun yoxlanilaraq istifadeye verilmesi','Tikintisi başa çatmış binanın layihəyə və normalara uyğunluğunun yoxlanılaraq istifadəyə verilməsi.','<p>Bina istismara qəbul edilənə qədər orada mənzillər üzrə mülkiyyət hüququnun qeydiyyatı, adətən, mümkün olmur. Yeni tikilidə alış edərkən binanın istismara qəbul edilib-edilmədiyini və çıxarışların nə vaxt veriləcəyini öyrənin.</p>','I',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='yeni-tikili'),'PUBLISHED',310,'["mtk","ilkin-muqavile"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_ilkin-bazar','ilkin-bazar','İlkin bazar','ilkin bazar menzilin tikinticiden ilk defe satildigi bazar cox vaxt bina tikinti merhelesinde olur','Mənzilin tikintiçidən ilk dəfə satıldığı bazar; çox vaxt bina tikinti mərhələsində olur.','<p>İlkin bazarda qiymət tikintinin erkən mərhələsində aşağı ola bilər, lakin tikintinin gecikməsi və sənədləşmənin uzanması riskləri mövcuddur.</p>','I',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='bazar-qiymet'),'PUBLISHED',320,'["tekrar-bazar","mtk"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_tekrar-bazar','tekrar-bazar','Təkrar bazar','tekrar bazar artiq kiminse mulkiyyetinde olan emlakin yeni aliciya satildigi bazar','Artıq kiminsə mülkiyyətində olan əmlakın yeni alıcıya satıldığı bazar.','<p>Təkrar bazarda əmlakın adətən çıxarışı olur və ipoteka ilə alış mümkündür; əsas yoxlama obyekti isə hüquqi tarixçə və əmlakın fiziki vəziyyətidir.</p>','T',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='bazar-qiymet'),'PUBLISHED',330,'["ilkin-bazar","cixaris-kupca"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_depozit','depozit','Depozit (kirayədə təminat məbləği)','depozit kirayede teminat meblegi kirayecinin muqavile baslananda ev sahibine verdiyi emlakin zedelenmesi ve odenilmemis xercler ucun teminat rolunu oynayan mebleg','Kirayəçinin müqavilə başlananda ev sahibinə verdiyi, əmlakın zədələnməsi və ödənilməmiş xərclər üçün təminat rolunu oynayan məbləğ.','<p>Depozitin məbləği, qaytarılma müddəti və hansı hallarda tutula biləcəyi kirayə müqaviləsində yazılmalıdır. Təhvil-qəbul aktı depozit mübahisəsinin qarşısını alan əsas sənəddir.</p>','D',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='kiraye'),'PUBLISHED',340,'["tehvil-qebul-akti"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_tehvil-qebul-akti','tehvil-qebul-akti','Təhvil-qəbul aktı','tehvil qebul akti emlakin veziyyetini esyalarin siyahisini saygac gostericilerini ve acarlari tehvil aninda qeyd eden sened','Əmlakın vəziyyətini, əşyaların siyahısını, sayğac göstəricilərini və açarları təhvil anında qeyd edən sənəd.','<p>Alqı-satqıda və kirayədə tərtib edilir. Tarixli fotolarla birlikdə sonradan yaranan «bu zədə əvvəl də var idi» mübahisələrinin qarşısını alır.</p>','T',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='kiraye'),'PUBLISHED',350,'["depozit"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_dovlet-rusumu','dovlet-rusumu','Dövlət rüsumu','dovlet rusumu notarial hereketler ve diger huquqi ehemiyyetli hereketler ucun dovlet budcesine odenilen mecburi odenis','Notarial hərəkətlər və digər hüquqi əhəmiyyətli hərəkətlər üçün dövlət büdcəsinə ödənilən məcburi ödəniş.','<p>Dövlət rüsumunun məbləği və ödəniş qaydası «Dövlət rüsumu haqqında» Qanunla müəyyən edilir. Daşınmaz əmlak əqdində rüsumun konkret məbləğini əqddən əvvəl notariusdan öyrənmək olar.</p>','D',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='vergi-rusum'),'PUBLISHED',360,'["notarius"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeTerm" ("id","slug","term","searchName","shortDefinition","definition","initial","categoryId","status","order","relatedSlugs","createdAt","updatedAt") VALUES ('knowledge_term_eksklyuziv-muqavile','eksklyuziv-muqavile','Eksklüziv müqavilə (agentliklə)','ekskluziv muqavile agentlikle emlakin mueyyen muddet erzinde yalniz bir agentlik vasitesile satilmasi ve ya kirayeye verilmesi barede razilasma','Əmlakın müəyyən müddət ərzində yalnız bir agentlik vasitəsilə satılması və ya kirayəyə verilməsi barədə razılaşma.','<p>Eksklüziv müqavilədə agentlik adətən reklama daha çox vəsait qoyur, lakin mülkiyyətçi müstəqil tapdığı alıcı üçün də komissiya ödəmək öhdəliyi ilə üzləşə bilər. Müddət və vaxtından əvvəl ləğv şərtlərini diqqətlə oxuyun.</p>','E',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug"='agentlik-brokerlik'),'PUBLISHED',370,'["agent","broker"]','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
UPDATE "KnowledgeTerm" SET "searchName"=replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower("term" || ' ' || "shortDefinition"), 'Ə', 'e'), 'ə', 'e'), 'Ş', 's'), 'ş', 's'), 'Ç', 'c'), 'ç', 'c'), 'Ğ', 'g'), 'ğ', 'g'), 'İ', 'i'), 'ı', 'i'), 'Ö', 'o'), 'ö', 'o'), 'Ü', 'u'), 'ü', 'u'), '<', ' '), '>', ' ') WHERE "id" NOT IN ('knowledge_term_yukluluk','knowledge_term_hebs','knowledge_term_etibarname','knowledge_term_notarius','knowledge_term_alqi-satqi-muqavilesi','knowledge_term_avans','knowledge_term_ilkin-odenis','knowledge_term_ikzf','knowledge_term_annuitet','knowledge_term_illik-real-faiz','knowledge_term_mtk','knowledge_term_istismara-qebul','knowledge_term_ilkin-bazar','knowledge_term_tekrar-bazar','knowledge_term_depozit','knowledge_term_tehvil-qebul-akti','knowledge_term_dovlet-rusumu','knowledge_term_eksklyuziv-muqavile');

INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_azerbaycanda-emlak-nece-alinmalidir','Azərbaycanda əmlak necə alınmalıdır? Addım-addım yol xəritəsi','azerbaycanda-emlak-nece-alinmalidir','Büdcənin planlaşdırılmasından çıxarışın alınmasına qədər Azərbaycanda mənzil və ev alışının bütün mərhələləri: axtarış, yoxlama, beh, notarius, qeydiyyat və təhvil.','
<p>İlk dəfə əmlak alan ailənin ən çox verdiyi sual budur: «Haradan başlayaq?» Proses mürəkkəb görünür, amma onu ardıcıl mərhələlərə böləndə hər addım aydınlaşır. Aşağıda Azərbaycanda əmlak alışının praktiki yol xəritəsini təqdim edirik.</p>

<h2>1. Büdcəni və maliyyələşməni müəyyənləşdirin</h2>
<p>Əvvəlcə nə qədər vəsaitiniz olduğunu və əlavə olaraq nə qədər kredit götürə biləcəyinizi hesablayın. Unutmayın ki, əmlakın qiymətindən əlavə notariat, dövlət rüsumu, qiymətləndirmə, sığorta, agentlik haqqı və təmir xərcləri də olacaq. İpoteka ilə alacaqsınızsa, İKZF və bankların şərtlərini əvvəlcədən öyrənin — bu, axtarış sərhədlərinizi müəyyən edəcək.</p>

<h2>2. Nə axtardığınızı dəqiqləşdirin</h2>
<ul>
  <li>Mənzil, yoxsa həyət evi?</li>
  <li>Yeni tikili, yoxsa köhnə tikili?</li>
  <li>Hansı rayon: iş yerinə, məktəbə, valideynlərə yaxınlıq?</li>
  <li>Neçə otaq, hansı mərtəbə, təmirli və ya təmirsiz?</li>
</ul>
<p>«Olmalı» və «olsa yaxşıdır» meyarlarını ayırın — kompromis zamanı bu siyahı sizə kömək edəcək.</p>

<h2>3. Axtarış və baxışlar</h2>
<p>Elanları filtrlərlə daraldın, qiymətləri müqayisə edin və bir neçə obyektə baxın. Baxışda yalnız mənzilə deyil, binaya və ərazisinə də diqqət edin. Bazardan xeyli ucuz elanlara ehtiyatla yanaşın.</p>

<h2>4. Sənədləri yoxlayın — beh verməzdən əvvəl</h2>
<p>Ən vacib qayda: <strong>sənəd yoxlanmayıbsa, pul verilmir.</strong> Çıxarışın əslini görün, satıcının mülkiyyətçi olduğunu, əmlak üzərində ipoteka və ya həbs olmadığını, ər-arvadın və digər mülkiyyətçilərin razılığını yoxlayın.</p>

<h2>5. Beh sazişi</h2>
<p>Razılığa gəldikdən sonra yazılı beh sazişi bağlanır: məbləğ, əmlak, tam qiymət, əsas müqavilənin tarixi və imtina halında nəticələr. Behi mümkünsə bank köçürməsi ilə ödəyin.</p>

<h2>6. Notarius və ödəniş</h2>
<p>Alqı-satqı müqaviləsi notarial qaydada təsdiqlənir. Notarius tərəfləri, hüquqları və yüklülükləri yoxlayır, dövlət rüsumunun ödənilməsini təmin edir və sənədləri qeydiyyata göndərir. Ödənişi bu mərhələdə bank vasitəsilə tamamlamaq ən təhlükəsiz yoldur.</p>

<h2>7. Dövlət qeydiyyatı və çıxarış</h2>
<p>Mülkiyyət hüququnuz müqavilənin imzalandığı gün deyil, reyestrdə qeydiyyat anından yaranır. Adınıza yeni çıxarış verildikdən sonra əqd tamamlanmış sayılır.</p>

<h2>8. Təhvil və köçmə</h2>
<p>Təhvil-qəbul aktı tərtib edin, sayğac göstəricilərini qeyd edin, kommunal abunəçiliyi öz adınıza keçirin və satıcının qeydiyyatdan çıxmasını yoxlayın.</p>

<h2>Ətraflı bələdçilər</h2>
<ul>
  <li><a href="/bilik-merkezi/emlak-alarken-yoxlanilmali-meqamlar">Əmlak alarkən nələr yoxlanılmalıdır</a></li>
  <li><a href="/bilik-merkezi/menzil-alqi-satqisinda-muqavile-merheleleri">Alqı-satqıda müqavilə mərhələləri</a></li>
  <li><a href="/bilik-merkezi/dovlet-rusumlari-ve-emeliyyat-xercleri">Dövlət rüsumları və əməliyyat xərcləri</a></li>
</ul>
<p><em>Mənbələr: Azərbaycan Respublikasının Mülki Məcəlləsi; «Daşınmaz əmlakın dövlət reyestri haqqında» və «Notariat haqqında» qanunlar (e-qanun.az). Bu yazı ümumi məlumat xarakteri daşıyır və hüquqi məsləhət deyil.</em></p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["alqı-satqı","yol xəritəsi","notarius","çıxarış"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/5456","https://e-qanun.az/framework/107"]','PUBLISHED',0,2,'2026-09-29T08:00:00.000Z','Azərbaycanda əmlak necə alınır: addım-addım bələdçi','Büdcədən çıxarışa qədər: Azərbaycanda mənzil və ev alışının mərhələləri, sənəd yoxlaması, beh, notariat və dövlət qeydiyyatı.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_menzil-alarken-yoxlanilmali-15-esas-meqam','Mənzil alarkən yoxlanılmalı 15 əsas məqam','menzil-alarken-yoxlanilmali-15-esas-meqam','Çıxarışdan qonşulara, kommunal borclardan səs izolyasiyasına qədər — mənzil alışından əvvəl mütləq yoxlamalı olduğunuz 15 məqamın qısa və praktiki siyahısı.','
<p>Mənzilə baxışa gedəndə emosiyalar qərarı idarə etməsin deyə bu siyahını telefonunuzda saxlayın. 15 sualın hər birinə «bəli» cavabı yoxdursa, bu, danışıqlar və ya əlavə yoxlama üçün səbəbdir.</p>

<h2>Sənədlər və satıcı</h2>
<ul>
  <li><strong>1. Çıxarışın əsli var və satıcının adınadır.</strong> Surət və ya şəkil kifayət deyil.</li>
  <li><strong>2. Çıxarışdakı sahə və ünvan real vəziyyətlə uyğundur.</strong></li>
  <li><strong>3. İpoteka, həbs və ya qadağa yoxdur.</strong> Son vəziyyəti əqd günü notarius yoxlayır, amma sualı indi verin.</li>
  <li><strong>4. Bütün mülkiyyətçilər və ər-arvad satışa razıdır.</strong> Nikah dövründə alınmış mənzil üçün həyat yoldaşının notarial razılığı lazımdır.</li>
  <li><strong>5. Azyaşlının payı yoxdur</strong> və ya qəyyumluq orqanının icazəsi var.</li>
  <li><strong>6. Mənzildə qeydiyyatda olan şəxslər</strong> satışdan sonra çıxacaq — müddət müqavilədə yazılacaq.</li>
</ul>

<h2>Mənzilin özü</h2>
<ul>
  <li><strong>7. Plan sənədlərlə uyğundur</strong> — sökülmüş divar, balkona birləşdirilmiş otaq yoxdur və ya rəsmiləşdirilib.</li>
  <li><strong>8. Nəm, kif, çat izləri yoxdur</strong> — xüsusilə künclərdə, pəncərə ətrafında, tavanda.</li>
  <li><strong>9. Elektrik, qaz və su fasiləsiz işləyir</strong>; sayğaclar qaydasındadır.</li>
  <li><strong>10. Kommunal borc yoxdur</strong> — arayış istəyin.</li>
  <li><strong>11. Səs izolyasiyası qənaətbəxşdir</strong> — qonşunun səsini, küçə səs-küyünü yoxlayın.</li>
</ul>

<h2>Bina və ərazi</h2>
<ul>
  <li><strong>12. Lift, giriş, dam qaydasındadır</strong>; bina idarəetməsi və aylıq xidmət haqqı məlumdur.</li>
  <li><strong>13. Nəqliyyat, məktəb, market</strong> sizin gündəlik marşrutunuza uyğundur.</li>
  <li><strong>14. Dayanacaq problemi yoxdur</strong> — axşam saatlarında baxın.</li>
</ul>

<h2>Qiymət</h2>
<ul>
  <li><strong>15. Qiymət bazara uyğundur</strong> — eyni ərazidə oxşar mənzillərin 1 m² qiyməti ilə müqayisə edin. Bu saytda elan səhifəsindəki qiymət göstəricisi median qiymətlə müqayisəni göstərir.</li>
</ul>

<h2>Bonus: iki qızıl qayda</h2>
<ul>
  <li>Baxışa ən azı iki dəfə — fərqli vaxtlarda gedin.</li>
  <li>Beh yalnız yazılı sazişlə və sənəd yoxlamasından sonra verilir.</li>
</ul>
<p>Hər maddənin ətraflı izahı: <a href="/bilik-merkezi/emlak-alarken-yoxlanilmali-meqamlar">Əmlak alarkən nələr yoxlanılmalıdır</a> və <a href="/bilik-merkezi/bina-infrastruktur-ve-erazi-yoxlamasi">Bina, infrastruktur və ərazi yoxlaması</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["mənzil","yoxlama siyahısı","çıxarış","risklər"]','["https://e-qanun.az/framework/5456","https://e-qanun.az/framework/46946"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Mənzil alarkən yoxlanılmalı 15 əsas məqam','Sənəd, satıcı, bina, kommunikasiya və ərazi: mənzil almazdan əvvəl yoxlanmalı 15 məqamın praktiki siyahısı.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_yeni-tikili-yoxsa-kohne-tikili-hansini-secmeli','Yeni tikili, yoxsa köhnə tikili? Hansını seçməli','yeni-tikili-yoxsa-kohne-tikili-hansini-secmeli','Müasir komfort və parkinq, yoxsa formalaşmış infrastruktur və çıxarış? Yeni və köhnə tikilinin real üstünlükləri, gizli xərcləri və hansı ailə üçün hansının uyğun olduğu.','
<p>Bakıda mənzil axtaranların demək olar ki, hamısı bu dilemma ilə üzləşir. Hər iki seçimin tərəfdarları var — və hər ikisi haqlıdır, çünki düzgün cavab sizin prioritetlərinizdən asılıdır.</p>

<h2>Yeni tikilinin üstünlükləri</h2>
<ul>
  <li>Müasir planlaşdırma, geniş mətbəx, iki sanitar qovşaq imkanı.</li>
  <li>Lift, çox vaxt yeraltı parkinq və qapalı həyət.</li>
  <li>Fərdi qaz kombisi, yeni elektrik və su xətləri.</li>
  <li>Təmiri öz zövqünüzə görə etmək imkanı.</li>
</ul>

<h2>Yeni tikilinin riskləri</h2>
<ul>
  <li><strong>Sənəd:</strong> bina istismara qəbul edilməyibsə, çıxarış yoxdur. MTK sənədi və ya ilkin müqavilə mülkiyyət hüququ yaratmır, ipoteka üçün də adətən qəbul edilmir.</li>
  <li><strong>Gizli xərclər:</strong> qara karkas mənzilin təmiri gözləniləndən baha və uzun ola bilər.</li>
  <li><strong>İnfrastruktur:</strong> yeni məhəllədə məktəb və poliklinika hələ çatışmaya bilər.</li>
  <li><strong>Keyfiyyət:</strong> tikintiçinin reputasiyası hər şeydir.</li>
</ul>

<h2>Köhnə tikilinin üstünlükləri</h2>
<ul>
  <li>Çıxarış adətən var — alış və ipoteka standart qaydada.</li>
  <li>Formalaşmış infrastruktur, çox vaxt metroya yaxınlıq.</li>
  <li>Daş binalarda qalın divarlar: yaxşı istilik və səs izolyasiyası.</li>
  <li>Dərhal köçmək mümkündür.</li>
</ul>

<h2>Köhnə tikilinin riskləri</h2>
<ul>
  <li>Köhnə kommunikasiyalar və dam problemləri.</li>
  <li>Lift və parkinq çatışmazlığı.</li>
  <li>Əvvəlki sakinlərin icazəsiz yenidənplanlaşdırması.</li>
</ul>

<h2>Kimə nə uyğundur?</h2>
<table>
  <thead><tr><th>Vəziyyət</th><th>Tövsiyə</th></tr></thead>
  <tbody>
    <tr><td>İpoteka ilə alırsınız</td><td>Çıxarışı olan əmlak: köhnə tikili və ya istismara qəbul edilmiş yeni bina</td></tr>
    <tr><td>Uşaqlı ailə, məktəb vacibdir</td><td>Formalaşmış məhəllə — çox vaxt köhnə tikili</td></tr>
    <tr><td>Avtomobil, parkinq, müasir komfort vacibdir</td><td>Yeni tikili</td></tr>
    <tr><td>Dərhal köçmək lazımdır</td><td>Təmirli köhnə və ya təhvil verilmiş yeni mənzil</td></tr>
    <tr><td>İnvestisiya, gözləməyə hazırsınız</td><td>Etibarlı tikintiçidən erkən mərhələdə yeni mənzil (risk nəzərə alınmaqla)</td></tr>
  </tbody>
</table>

<p>Ətraflı müqayisə cədvəli və yoxlama siyahıları: <a href="/bilik-merkezi/yeni-tikili-yoxsa-kohne-tikili">Yeni tikili, yoxsa köhnə tikili? Seçim meyarları</a> və <a href="/bilik-merkezi/ilkin-ve-tekrar-bazar-arasindaki-ferqler">İlkin və təkrar bazar arasındakı fərqlər</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='dasinmaz-emlak'),'["yeni tikili","köhnə tikili","mənzil","MTK"]','["https://e-qanun.az/framework/46958","https://e-qanun.az/framework/46955"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Yeni tikili, yoxsa köhnə tikili? Seçim bələdçisi','Yeni və köhnə tikilinin sənəd, kommunikasiya, infrastruktur və qiymət baxımından müqayisəsi; hansı halda hansını seçmək lazımdır.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_emlak-alarken-senedlerin-yoxlanilmasi','Əmlak alarkən sənədlərin yoxlanılması: çıxarışdan etibarnaməyə','emlak-alarken-senedlerin-yoxlanilmasi','Çıxarışda hansı sahələrə baxmalı, yüklülük nədir, etibarnamə ilə alışda nəyə diqqət etməli, vərəsəlik və MTK sənədlərinin riskləri — sənəd yoxlamasının praktiki izahı.','
<p>Əmlak alışında ən bahalı səhvlər sənəd səhvləridir: təmir sonradan edilə bilər, amma saxta və ya mübahisəli sənədlə alınmış mənzil illərlə məhkəmə deməkdir. Yaxşı xəbər odur ki, əsas yoxlamaları özünüz edə bilərsiniz.</p>

<h2>Çıxarış — əsas sənəd</h2>
<p>Azərbaycanda mülkiyyət hüququ dövlət reyestrində qeydiyyat anından yaranır və bunu təsdiq edən sənəd çıxarışdır. Çıxarışda bunlara baxın:</p>
<ul>
  <li>reyestr nömrəsi və ünvan;</li>
  <li>ümumi və yaşayış sahəsi;</li>
  <li>mülkiyyətçi(lər) və paylar;</li>
  <li>hüququn əsası (alqı-satqı, vərəsəlik, bağışlama);</li>
  <li>məhdudiyyətlər (ipoteka, həbs, qadağa).</li>
</ul>

<h2>Yüklülük — gizli təhlükə</h2>
<p>Çıxarış verildikdən sonra əmlak üzərində həbs qoyula və ya ipoteka qeydə alına bilər. Buna görə son vəziyyəti əqd günü notarius reyestr üzrə yoxlayır. Satıcının krediti varsa, bağlanış bankın iştirakı ilə planlaşdırılmalıdır.</p>

<h2>Etibarnamə ilə alış</h2>
<ul>
  <li>Etibarnamə notarial qaydada təsdiqlənməli, səlahiyyətlər (satmaq, pul almaq) açıq yazılmalıdır.</li>
  <li>Müddəti və ləğv edilmədiyini yoxlayın.</li>
  <li>Mülkiyyətçi ilə birbaşa əlaqə saxlayın; ödənişi onun hesabına köçürün.</li>
</ul>

<h2>Vərəsəlik yolu ilə keçən əmlak</h2>
<p>Miras yaxın vaxtlarda açılıbsa, digər vərəsələrin iddia ehtimalı yüksəkdir. Bütün vərəsələrin hüquqlarının rəsmiləşdirildiyini və payların düzgün bölündüyünü yoxlayın.</p>

<h2>MTK və ilkin müqavilə</h2>
<p>«Kupçasız» mənzil alışında satıcının əlində yalnız MTK sənədi və ya tikintiçi ilə ilkin müqavilə olur. Bu sənədlər mülkiyyət hüququ yaratmır. Belə alış daha yüksək riskdir və ipoteka ilə adətən mümkün deyil.</p>

<h2>Satıcıya verilməli 5 sual</h2>
<ol>
  <li>Əmlak sizə necə keçib?</li>
  <li>Nikahdasınızmı, həyat yoldaşınız razıdırmı?</li>
  <li>Kredit, həbs və ya məhkəmə mübahisəsi varmı?</li>
  <li>Azyaşlının payı varmı?</li>
  <li>Kimlər qeydiyyatdadır və nə vaxt çıxacaq?</li>
</ol>
<p>Ətraflı: <a href="/bilik-merkezi/cixarisin-ve-huquqi-senedlerin-yoxlanilmasi">Çıxarışın və hüquqi sənədlərin yoxlanılması</a>, <a href="/bilik-merkezi/emlakin-huquqi-tarixcesinin-yoxlanilmasi">Əmlakın hüquqi tarixçəsi</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["çıxarış","kupça","etibarnamə","yüklülük","MTK"]','["https://e-qanun.az/framework/5456","https://e-qanun.az/framework/107","https://emlak.gov.az/az"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Əmlak alarkən sənədlər necə yoxlanılır','Çıxarış, yüklülük, etibarnamə, vərəsəlik şəhadətnaməsi və MTK sənədləri: alışdan əvvəl sənəd yoxlamasının praktiki qaydaları.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_ipoteka-ile-ev-alma-prosesi-nece-isleyir','İpoteka ilə ev alma prosesi necə işləyir?','ipoteka-ile-ev-alma-prosesi-nece-isleyir','İKZF-nin güzəştli və adi ipotekasının şərtləri, e-gov.az üzərindən müraciət, qiymətləndirmə, notarial əqd və aylıq ödənişin hesablanması — ipoteka prosesinin sadə izahı və nümunə.','
<p>İpoteka bir çox ailə üçün öz evinə sahib olmağın yeganə real yoludur. Proses bir neçə həftə çəkir və bank, qiymətləndirici, notarius kimi bir neçə tərəfi əhatə edir. Onu mərhələlərlə izah edək.</p>

<h2>İKZF ipotekası: əsas rəqəmlər</h2>
<p>İpoteka və Kredit Zəmanət Fondunun rəsmi saytında (mcgf.gov.az) 29 sentyabr 2026-cı il tarixinə dərc olunmuş şərtlər:</p>
<table>
  <thead><tr><th></th><th>Güzəştli</th><th>Adi</th></tr></thead>
  <tbody>
    <tr><td>Maksimal məbləğ</td><td>100 000 AZN</td><td>150 000 AZN</td></tr>
    <tr><td>Maksimal müddət</td><td>30 il</td><td>25 il</td></tr>
    <tr><td>Minimal ilkin ödəniş</td><td>10%</td><td>15%</td></tr>
    <tr><td>İllik faiz</td><td>3,7–4%-dək</td><td>7–8%-dək</td></tr>
  </tbody>
</table>
<p>Güzəştli ipoteka qanunvericilikdə müəyyən edilmiş kateqoriyalar üçündür. Şərtlər dəyişə bilər — müraciətdən əvvəl rəsmi saytı yoxlayın.</p>

<h2>Proses 6 addımda</h2>
<ol>
  <li><strong>Hesablama:</strong> nə qədər ödəyə biləcəyinizi kalkulyatorla müəyyən edin.</li>
  <li><strong>Müraciət:</strong> elektron hökumət portalında «Elektron ipoteka və kredit zəmanət» sistemi vasitəsilə, gücləndirilmiş elektron imza ilə.</li>
  <li><strong>Əmlak seçimi:</strong> mülkiyyət hüququ qeydiyyata alınmış yaşayış sahəsi olmalıdır; 1970-ci ildən sonra tikilmiş binada mənzil və ya fərdi ev.</li>
  <li><strong>Qiymətləndirmə:</strong> bankın qəbul etdiyi qiymətləndirici bazar dəyərini müəyyən edir.</li>
  <li><strong>Notarial əqd:</strong> alqı-satqı və ipoteka müqavilələri təsdiqlənir.</li>
  <li><strong>Qeydiyyat və ödəniş:</strong> hüquq və ipoteka reyestrdə qeydə alınır, bank vəsaiti satıcıya köçürür.</li>
</ol>

<h2>Nümunə hesablama</h2>
<p>120 000 AZN-lik mənzil, 15% ilkin ödəniş (18 000 AZN), 102 000 AZN kredit, 25 il:</p>
<ul>
  <li>8% illik faizlə aylıq ödəniş ≈ <strong>787 AZN</strong>;</li>
  <li>4% illik faizlə aylıq ödəniş ≈ <strong>538 AZN</strong>.</li>
</ul>
<p>Fərq ayda təxminən 250 AZN, 25 ildə isə 70 000 AZN-dən çoxdur. Öz rəqəmlərinizi saytdakı <a href="/kalkulyator">kalkulyatorda</a> hesablayın.</p>

<h2>Tez-tez verilən suallar</h2>
<p><strong>Kupçasız mənzili ipoteka ilə almaq olarmı?</strong> Adətən xeyr: ipoteka predmeti mülkiyyət hüququ qeydiyyata alınmış əmlak olmalıdır.</p>
<p><strong>Kredit məbləği alış qiymətinə görə hesablanır?</strong> Xeyr, bank qiymətləndirmə dəyərini əsas götürür. Qiymətləndirmə alış qiymətindən aşağı çıxsa, fərqi öz vəsaitinizlə ödəməli olacaqsınız.</p>
<p><strong>Kreditdən əvvəl beh vermək təhlükəlidirmi?</strong> Beh sazişində kreditin təsdiqlənməməsi halını əvvəlcədən yazın.</p>
<p>Ətraflı: <a href="/bilik-merkezi/ipoteka-ile-emlak-alinmasi-prosesi">İpoteka ilə əmlak alınması prosesi</a> və <a href="/bilik-merkezi/kredit-ipoteka-ve-ilkin-odenis-anlayislari">Kredit, ipoteka və ilkin ödəniş anlayışları</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["ipoteka","İKZF","ilkin ödəniş","kredit"]','["https://mcgf.gov.az/az/ipoteka-krediti","https://e-qanun.az/framework/9902","https://my.gov.az/"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','İpoteka ilə ev almaq: proses, şərtlər və hesablama','İKZF ipotekasının şərtləri, müraciət qaydası, qiymətləndirmə, notarial əqd və aylıq ödəniş nümunəsi — ipoteka prosesinin sadə izahı.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_kiraye-menzil-goturerken-neye-diqqet-etmeli','Kirayə mənzil götürərkən nələrə diqqət etmək lazımdır?','kiraye-menzil-goturerken-neye-diqqet-etmeli','Saxta elanlardan müqaviləyə, depozitdən təhvil-qəbul aktına qədər — kirayə mənzil axtaranlar üçün itkisiz və mübahisəsiz kirayənin praktiki qaydaları.','
<p>Kirayə bazarı sürətlidir: yaxşı mənzillər bir neçə gün ərzində tutulur. Bu sürət fırıldaqçılar üçün də əlverişlidir. Aşağıdakı qaydalar həm pulunuzu, həm əsəblərinizi qoruyacaq.</p>

<h2>1. Baxışdan əvvəl pul verməyin</h2>
<p>«Mənzili sizin üçün saxlayım, kartıma 50 manat atın» — klassik sxemdir. Heç bir ödəniş baxışdan və ev sahibi ilə görüşdən əvvəl edilmir.</p>

<h2>2. Ev sahibinin mülkiyyətçi olduğunu yoxlayın</h2>
<p>Çıxarışı və şəxsiyyət vəsiqəsini görün. Mənzili «əvvəlki kirayəçi» və ya vasitəçi təqdim edirsə, mülkiyyətçinin razılığını tələb edin. Əks halda, bir neçə ay sonra əsl sahib qapını döyə bilər.</p>

<h2>3. Mənzili diqqətlə yoxlayın</h2>
<ul>
  <li>Su, isti su, təzyiq, kanalizasiya.</li>
  <li>Elektrik, rozetkalar, kombi, kondisioner.</li>
  <li>Nəm və kif — xüsusilə qışda problem yaradır.</li>
  <li>Mebel və texnika — hər biri işləyirmi?</li>
</ul>

<h2>4. Yazılı müqavilə bağlayın</h2>
<p>Müqavilədə kirayə haqqı, ödəniş tarixi, depozit, kommunal xərclərin bölgüsü, təmir öhdəlikləri, müddət və xitam şərtləri olmalıdır. Şifahi razılaşma mübahisədə heç nəyi sübut etmir.</p>

<h2>5. Depozit və təhvil-qəbul aktı</h2>
<p>Depozitin qaytarılma şərtlərini yazın və mənzilin vəziyyətini fotolarla təhvil-qəbul aktında qeyd edin. Çıxış zamanı eyni aktla müqayisə aparılır — «bu cızıq əvvəl də var idi» mübahisəsi bitir.</p>

<h2>6. Ödənişləri sənədləşdirin</h2>
<p>Bank köçürməsi və ya hər ödəniş üçün qəbz. Nağd verdiyiniz pulu sübut etmək çətindir.</p>

<h2>7. Çıxarkən</h2>
<p>Müqavilədəki xəbərdarlıq müddətinə əməl edin, sayğacları qeyd edin, depozitin qaytarılmasını yazılı rəsmiləşdirin.</p>

<p>Ətraflı: <a href="/bilik-merkezi/kiraye-menzil-goturerken-yoxlama-siyahisi">Kirayə mənzil götürərkən yoxlama siyahısı</a>, <a href="/bilik-merkezi/kiraye-muqavilesinin-duzgun-hazirlanmasi">Kirayə müqaviləsinin hazırlanması</a>, <a href="/bilik-merkezi/saxta-ve-yaniltici-elanlari-tanimaq">Saxta elanları tanımaq</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["kirayə","depozit","müqavilə","saxta elan"]','["https://e-qanun.az/framework/46944","https://e-qanun.az/framework/46955"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Kirayə mənzil götürərkən nələrə diqqət etməli','Saxta elan, ev sahibinin yoxlanması, müqavilə, depozit və təhvil-qəbul aktı: kirayə mənzil götürərkən praktiki qaydalar.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_emlakin-bazar-qiymeti-nece-mueyyen-edilir','Əmlakın bazar qiyməti necə müəyyən edilir?','emlakin-bazar-qiymeti-nece-mueyyen-edilir','Müqayisəli təhlil, 1 m² median qiymət, qiymətə təsir edən amillər və elan qiyməti ilə real satış qiyməti arasındakı fərq — əmlakın dəyərini özünüz necə təxmin edə bilərsiniz.','
<p>«Bu mənzil nə qədər edir?» sualına iki fərqli cavab var: satıcının istədiyi qiymət və bazarın ödəməyə hazır olduğu qiymət. Real bazar qiyməti ikincisidir. Onu təxmin etmək üçün peşəkar olmaq vacib deyil — düzgün üsul kifayətdir.</p>

<h2>Müqayisəli təhlil: 5 addım</h2>
<ol>
  <li>Eyni ərazidə (ideal halda eyni binada) oxşar 8–10 mənzil tapın.</li>
  <li>Hər birinin 1 m² qiymətini hesablayın.</li>
  <li>Ortalama deyil, <strong>median</strong> götürün — həddən artıq ucuz və ya baha elanlar nəticəni təhrif etməsin.</li>
  <li>Mənzilinizin fərqlərinə görə düzəliş edin.</li>
  <li>Median × sahə = təxmini qiymət.</li>
</ol>

<h2>Qiymətə nə təsir edir?</h2>
<ul>
  <li><strong>Artırır:</strong> çıxarış, metroya yaxınlıq, yeni keyfiyyətli təmir, görünüş, lift və parkinq.</li>
  <li><strong>Azaldır:</strong> birinci və sonuncu mərtəbə, təmirsizlik, səs-küy, sənədləşdirilməmiş yenidənplanlaşdırma.</li>
</ul>

<h2>Elan qiyməti niyə aldadıcıdır</h2>
<p>Elanlar satıcıların istəyini göstərir. Real satış çox vaxt danışıqlardan sonra aşağı qiymətə baş tutur. Aylarla dayanan elanlar isə qiymətin yüksək olduğunun işarəsidir. Elanın qiymət dəyişikliyi tarixçəsi — ən dürüst göstəricidir.</p>

<h2>Saytdakı alətlər</h2>
<p>Luxe Home Estate-də elan səhifəsində əmlakın 1 m² qiyməti eyni rayondakı oxşar elanların median qiyməti ilə müqayisə edilir (ən azı 5 müqayisə olunan elan olduqda). Satıcılar <a href="/emlakimi-sat">«Evimi qiymətləndir»</a> aləti ilə ilkin təxmin ala bilərlər. Bu göstəricilər rəsmi qiymətləndirmə deyil, amma danışıqlar üçün yaxşı başlanğıcdır.</p>

<h2>Nə vaxt peşəkar qiymətləndirici lazımdır?</h2>
<p>İpoteka, vərəsəlik bölgüsü, məhkəmə mübahisəsi, kommersiya obyekti və ya böyük investisiya zamanı — müstəqil qiymətləndiricinin rəsmi hesabatı.</p>
<p>Ətraflı: <a href="/bilik-merkezi/emlakin-real-bazar-qiymetinin-mueyyen-edilmesi">Əmlakın real bazar qiymətinin müəyyən edilməsi</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='bazar-xeberleri'),'["bazar qiyməti","qiymətləndirmə","1 m² qiymət"]','["https://www.stat.gov.az/"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Əmlakın bazar qiyməti necə müəyyən edilir','Müqayisəli təhlil, median 1 m² qiymət, düzəliş amilləri və peşəkar qiymətləndirmə: əmlakın real bazar dəyərini hesablamaq üsulları.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_menzil-satarken-duzgun-qiymet-nece-secilmelidir','Mənzil satarkən düzgün qiymət necə seçilməlidir?','menzil-satarken-duzgun-qiymet-nece-secilmelidir','Yüksək qiymət elanı «köhnəldir», aşağı qiymət pul itkisidir. Satıcı üçün qiymət strategiyası: bazar təhlili, danışıq ehtiyatı, ilk həftələrin siqnalları və qiymət düzəlişinin vaxtı.','
<p>Satıcıların ən çox etdiyi səhv qiyməti «emosional» qoymaqdır: təmirə xərclənən pul, xatirələr, qonşunun «filan qiymətə satdı» sözü. Alıcı isə yalnız bazarla müqayisə edir. Düzgün qiymət strategiyası satışı həftələrlə sürətləndirir.</p>

<h2>Yüksək qiymətin gizli bahası</h2>
<p>Bazardan yüksək qiymətli elan ilk günlərdə baxış toplamır. Alıcılar onu «baha» kimi yadda saxlayır, elan köhnəlir, sonra qiymət endiriləndə də maraq əvvəlki kimi olmur. Nəticədə mənzil çox vaxt ilkin bazar qiymətindən aşağı satılır.</p>

<h2>Qiymət necə qurulur</h2>
<ol>
  <li><strong>Bazarı öyrənin:</strong> eyni ərazidə oxşar mənzillərin 1 m² qiymətinin medianı.</li>
  <li><strong>Fərqlərə düzəliş edin:</strong> mərtəbə, təmir, görünüş, sənəd statusu.</li>
  <li><strong>Danışıq ehtiyatı qoyun:</strong> alıcılar endirim istəyəcək — kiçik ehtiyat normaldır, amma elan qiyməti bazardan çox uzaqlaşmamalıdır.</li>
  <li><strong>Minimal həddi əvvəlcədən müəyyən edin:</strong> danışıq zamanı tələsik qərarın qarşısını alır.</li>
</ol>

<h2>İlk 2–3 həftənin siqnalları</h2>
<table>
  <thead><tr><th>Siqnal</th><th>Mənası</th></tr></thead>
  <tbody>
    <tr><td>Çox zəng, çox baxış, təklif yoxdur</td><td>Mənzil bəyənilir, qiymət bir az yüksəkdir</td></tr>
    <tr><td>Az zəng</td><td>Qiymət və ya elanın təqdimatı (foto, təsvir) zəifdir</td></tr>
    <tr><td>İlk həftədə bir neçə təklif</td><td>Qiymət bazara uyğun və ya aşağıdır</td></tr>
  </tbody>
</table>

<h2>Qiymətdən başqa nə satışı sürətləndirir</h2>
<ul>
  <li>Qaydasında sənədlər: çıxarış, razılıqlar, borcsuzluq.</li>
  <li>Keyfiyyətli foto və dolğun elan təsviri.</li>
  <li>Baxışa hazır, təmiz və işıqlı mənzil.</li>
</ul>

<h2>Vergini unutmayın</h2>
<p>Əmlak satışı Vergi Məcəlləsinə əsasən vergiyə cəlb oluna bilər; bəzi hallarda azadolma var. Xalis gəliri hesablayanda bunu nəzərə alın və məbləği notariusdan dəqiqləşdirin.</p>
<p>Ətraflı: <a href="/bilik-merkezi/menzil-satisina-hazirliq">Mənzil satışına hazırlıq</a> və <a href="/bilik-merkezi/emlakin-real-bazar-qiymetinin-mueyyen-edilmesi">Real bazar qiymətinin müəyyən edilməsi</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["satış","bazar qiyməti","elan","danışıqlar"]','["https://e-qanun.az/framework/46948"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Mənzil satarkən düzgün qiymət necə seçilir','Satıcı üçün qiymət strategiyası: bazar təhlili, danışıq ehtiyatı, ilk həftələrin siqnalları və qiyməti nə vaxt dəyişmək lazımdır.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_emlak-elaninda-hansi-melumatlar-mutleq-gosterilmelidir','Əmlak elanında hansı məlumatlar mütləq göstərilməlidir?','emlak-elaninda-hansi-melumatlar-mutleq-gosterilmelidir','Yaxşı elan boş baxışları azaldır və ciddi alıcı gətirir. Elanda mütləq olmalı məlumatlar, fotoların qaydaları, təsvirin strukturu və alıcını uzaqlaşdıran səhvlər.','
<p>Alıcı və kirayəçi elanları saniyələr ərzində gözdən keçirir. Natamam elan ya ötürülür, ya da eyni sualları verən onlarla zəngə səbəb olur. Dolğun elan isə vaxtınıza qənaət edir və yalnız həqiqətən maraqlanan şəxsləri gətirir.</p>

<h2>Mütləq göstərilməli məlumatlar</h2>
<table>
  <thead><tr><th>Məlumat</th><th>Niyə vacibdir</th></tr></thead>
  <tbody>
    <tr><td>Qiymət (və valyuta)</td><td>«Qiymət razılaşma ilə» elanları filtrlərdə itir</td></tr>
    <tr><td>Elanın növü: satış və ya kirayə</td><td>Əsas filtr</td></tr>
    <tr><td>Əmlakın növü</td><td>Mənzil (yeni/köhnə tikili), həyət evi, ofis, torpaq</td></tr>
    <tr><td>Sahə (m²)</td><td>Çıxarışdakı rəqəmlə eyni olmalıdır</td></tr>
    <tr><td>Otaq sayı</td><td>Əsas axtarış meyarı</td></tr>
    <tr><td>Mərtəbə / binanın mərtəbə sayı</td><td>Birinci və sonuncu mərtəbəni axtarmayanlar üçün</td></tr>
    <tr><td>Dəqiq ərazi</td><td>Şəhər, rayon, qəsəbə, yaxın metro və ya nişangah</td></tr>
    <tr><td>Sənəd statusu</td><td>Çıxarış var/yox — ipoteka imkanını müəyyən edir</td></tr>
    <tr><td>Təmir vəziyyəti</td><td>Əlavə xərcləri anlamaq üçün</td></tr>
    <tr><td>Kirayədə: depozit, kommunal, müddət</td><td>Ümumi aylıq xərci göstərir</td></tr>
  </tbody>
</table>

<h2>Fotolar</h2>
<ul>
  <li>Gündüz işığında, pəncərələr açıq, səliqəli otaqlar.</li>
  <li>Hər otaq, mətbəx, sanitar qovşaq, balkon və binanın girişi.</li>
  <li>Real fotolar — başqa elandan və ya internetdən götürülmüş şəkil etibarı sarsıdır.</li>
  <li>Plan şəkli varsa, mütləq əlavə edin.</li>
</ul>

<h2>Təsvir necə yazılmalı</h2>
<ol>
  <li>Birinci cümlədə ən güclü üstünlük: «Metroya 3 dəqiqə, yeni təmirli, çıxarışlı».</li>
  <li>Mənzilin planı və vəziyyəti.</li>
  <li>Bina: lift, parkinq, mühafizə.</li>
  <li>Ərazi: məktəb, park, nəqliyyat.</li>
  <li>Şərtlər: baxış vaxtları, qiymətə nə daxildir.</li>
</ol>

<h2>Alıcını uzaqlaşdıran səhvlər</h2>
<ul>
  <li>Sahənin şişirdilməsi, «metroya yaxın» deyib 20 dəqiqəlik məsafə.</li>
  <li>«Kupçalı» yazıb çıxarışın olmaması.</li>
  <li>Hər şeyin böyük hərflə yazılması və təkrar nida işarələri.</li>
  <li>Köhnə və ya başqa mənzilin fotoları.</li>
</ul>
<p>Yanlış məlumat baxışda üzə çıxır və alıcı həm vaxtını, həm də sizə etibarını itirir. Bu saytda elan yerləşdirərkən forma addım-addım bütün vacib sahələri doldurmağınıza kömək edir: <a href="/elan-yerlesdir">elan yerləşdir</a>.</p>
<p>Satış prosesi barədə: <a href="/bilik-merkezi/menzil-satisina-hazirliq">Mənzil satışına hazırlıq</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='meslehetler'),'["elan","satış","kirayə","foto"]',NULL,'PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Əmlak elanında hansı məlumatlar mütləq olmalıdır','Qiymət, sahə, mərtəbə, sənəd statusu, dəqiq ərazi və keyfiyyətli foto: effektiv əmlak elanının strukturu və tipik səhvlər.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
INSERT OR IGNORE INTO "BlogPost" ("id","title","slug","excerpt","content","coverAlt","categoryId","tags","references","status","isDemo","readMinutes","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ('blog_post_baki-ve-regionlarda-emlak-secerken-erazi-nece-qiymetlendirilmelidir','Bakı və regionlarda əmlak seçərkən ərazi necə qiymətləndirilməlidir?','baki-ve-regionlarda-emlak-secerken-erazi-nece-qiymetlendirilmelidir','Mərkəz, yaşayış rayonları, şəhərətrafı qəsəbələr və regionlar: nəqliyyat, infrastruktur, ekologiya, inkişaf planları və likvidlik meyarları ilə ərazini düzgün qiymətləndirmək.','
<p>Daşınmaz əmlakda köhnə qayda hələ də qüvvədədir: dəyəri müəyyən edən üç amil — yer, yer və yenə də yer. Amma «yaxşı yer» hər kəs üçün fərqlidir: gənc cütlük üçün metroya yaxınlıq, uşaqlı ailə üçün məktəb, investor üçün kirayə tələbi.</p>

<h2>Bakıda ərazi tipləri</h2>
<ul>
  <li><strong>Mərkəz:</strong> yüksək qiymət, yüksək likvidlik, hazır infrastruktur; tıxac və parkinq problemi.</li>
  <li><strong>Yaşayış rayonları:</strong> qiymət və keyfiyyət balansı; binadan-binaya fərq böyükdür.</li>
  <li><strong>Abşeron qəsəbələri:</strong> həyət evi və torpaq üçün; nəqliyyat və kommunikasiya asılılığı, sənəd problemləri daha çoxdur.</li>
</ul>
<p>Qəsəbə, kənd və rayon adlarını rəsmi inzibati ərazi bölgüsü ilə yoxlayın: elanlarda «qəsəbə» yazılan bəzi yerlər əslində massiv və ya məhəllədir.</p>

<h2>Regionlarda</h2>
<ul>
  <li>Böyük şəhərlərdə (Gəncə, Sumqayıt, Mingəçevir, Lənkəran, Şəki) bazar formalaşıb, kirayə tələbi universitet və iş yerləri ilə bağlıdır.</li>
  <li>Turizm bölgələrində mövsümi kirayə imkanı var, lakin gəlir ilboyu sabit deyil.</li>
  <li>Kiçik rayon mərkəzlərində qiymət aşağıdır, amma satış uzun çəkə bilər.</li>
</ul>

<h2>7 meyar</h2>
<ol>
  <li>Pik saatda iş yerinə və məktəbə real gediş vaxtı.</li>
  <li>Məktəb, bağça, poliklinika, market.</li>
  <li>Qaz, su, işıq və internetin sabitliyi.</li>
  <li>Ekologiya: sənaye, mədənlər, poliqonlar.</li>
  <li>Təhlükəsizlik və gecə işıqlandırması.</li>
  <li>İnkişaf planları: yeni yol, metro, park — yoxsa sənaye obyekti?</li>
  <li>Likvidlik: bu ərazidə elanlar nə qədər tez satılır?</li>
</ol>

<h2>Praktiki üsullar</h2>
<ul>
  <li>Ərazini səhər, axşam və istirahət günü gəzin.</li>
  <li>Sakinlər və yerli dükançılarla danışın.</li>
  <li>Saytdakı <a href="/bazar-analitikasi">bazar analitikası</a> və rayon səhifələrində qiymət dinamikasına baxın.</li>
</ul>
<p>Ətraflı: <a href="/bilik-merkezi/erazinin-qiymetlendirilmesi-baki-ve-regionlar">Bakı və regionlarda ərazinin qiymətləndirilməsi</a>, <a href="/bilik-merkezi/bina-infrastruktur-ve-erazi-yoxlamasi">Bina və ərazi yoxlaması</a>.</p>
','',(SELECT "id" FROM "BlogCategory" WHERE "slug"='dasinmaz-emlak'),'["ərazi","Bakı","regionlar","infrastruktur","investisiya"]','["https://e-qanun.az/framework/57325","https://www.stat.gov.az/"]','PUBLISHED',0,1,'2026-09-29T08:00:00.000Z','Bakı və regionlarda ərazini necə qiymətləndirmək','Nəqliyyat, infrastruktur, ekologiya, inkişaf planları və likvidlik: Bakıda və regionlarda əmlak üçün ərazi seçiminin meyarları.','2026-09-29T08:00:00.000Z','2026-09-29T08:00:00.000Z');
