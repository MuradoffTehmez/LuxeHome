import type { KnowledgeGuide } from "./types";
import { ACT, SRC } from "./sources";

/** Alış və satış prosesi üzrə praktiki bələdçilər. */
export const BUYING_GUIDES: KnowledgeGuide[] = [
  {
    slug: "emlak-alarken-yoxlanilmali-meqamlar",
    title: "Əmlak alarkən nələr yoxlanılmalıdır: tam yoxlama siyahısı",
    excerpt:
      "Mənzil və ya ev almazdan əvvəl sənəd, satıcı, bina, ərazi və maliyyə üzrə yoxlanmalı olan əsas məqamlar — beh verməzdən əvvəl keçməli olduğunuz addım-addım siyahı.",
    categorySlug: "alqi-satqi",
    audience: "BUYER",
    level: "BEGINNER",
    featured: true,
    tags: ["yoxlama siyahısı", "çıxarış", "beh", "alqı-satqı", "risklər"],
    legalActs: [ACT.civilCode, ACT.registryLaw, ACT.familyCode],
    sources: [SRC.civilCode, SRC.registryLaw, SRC.familyCode, SRC.eEmlak],
    content: `
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
`,
  },
  {
    slug: "bina-infrastruktur-ve-erazi-yoxlamasi",
    title: "Ev alarkən bina, infrastruktur və ərazi üzrə yoxlanmalı məqamlar",
    excerpt:
      "Mənzilin özü qədər onun yerləşdiyi bina və məhəllə də qiyməti və gündəlik rahatlığı müəyyən edir. Binanın texniki vəziyyəti, kommunikasiyalar, nəqliyyat, sosial obyektlər və risklər üzrə praktiki siyahı.",
    categorySlug: "alqi-satqi",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["yoxlama siyahısı", "infrastruktur", "ərazi", "bina", "mənzil"],
    legalActs: [ACT.urbanCode, ACT.housingCode],
    sources: [SRC.urbanCode, SRC.housingCode, SRC.arxkom, SRC.fhn],
    content: `
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
`,
  },
  {
    slug: "menzil-alqi-satqisinda-muqavile-merheleleri",
    title: "Mənzil alqı-satqısında müqavilə mərhələləri: behdən çıxarışa qədər",
    excerpt:
      "Razılaşmadan mülkiyyət hüququnun qeydiyyatına qədər mənzil alqı-satqısının mərhələləri: beh sazişi, sənədlərin toplanması, notariat təsdiqi, ödəniş, dövlət qeydiyyatı və təhvil-qəbul.",
    categorySlug: "alqi-satqi",
    audience: "BUYER",
    level: "INTERMEDIATE",
    featured: true,
    tags: ["müqavilə", "beh", "notarius", "dövlət qeydiyyatı", "alqı-satqı"],
    legalActs: [ACT.civilCode, ACT.notaryLaw, ACT.registryLaw],
    sources: [SRC.civilCode, SRC.notaryLaw, SRC.registryLaw, SRC.emdx],
    content: `
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
`,
  },
  {
    slug: "alici-ve-satici-ucun-riskler",
    title: "Alıcı və satıcı üçün risklər: ən çox rast gəlinən hallar və qorunma yolları",
    excerpt:
      "İkiqat satış, etibarnamə ilə fırıldaq, gizli yüklülük, ödənişin alınmaması, vərəsə iddiaları — alqı-satqıda hər iki tərəfin üzləşdiyi riskləri və onların qarşısını almaq üçün praktiki addımlar.",
    categorySlug: "alqi-satqi",
    audience: "BUYER",
    level: "INTERMEDIATE",
    tags: ["risklər", "beh", "etibarnamə", "yüklülük", "alqı-satqı"],
    legalActs: [ACT.civilCode, ACT.registryLaw],
    sources: [SRC.civilCode, SRC.registryLaw, SRC.notaryLaw],
    content: `
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
`,
  },
  {
    slug: "menzil-satisina-hazirliq",
    title: "Mənzil satışına hazırlıq: sənədlər, qiymət, elan və təhvil",
    excerpt:
      "Əmlakını satmaq istəyənlər üçün addım-addım plan: sənədlərin qaydaya salınması, borcların bağlanması, bazar qiymətinin müəyyən edilməsi, cəlbedici elan, baxışlar, danışıqlar və əqdin bağlanması.",
    categorySlug: "satis",
    audience: "SELLER",
    level: "BEGINNER",
    featured: true,
    tags: ["satış", "elan", "bazar qiyməti", "çıxarış", "müqavilə"],
    legalActs: [ACT.civilCode, ACT.taxCode, ACT.registryLaw],
    sources: [SRC.civilCode, SRC.taxCode, SRC.registryLaw, SRC.taxes],
    content: `
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
`,
  },
];
