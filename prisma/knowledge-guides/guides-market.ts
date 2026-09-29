import type { KnowledgeGuide } from "./types";
import { ACT, SRC } from "./sources";

/** Bazar, qiymət və seçim bələdçiləri. */
export const MARKET_GUIDES: KnowledgeGuide[] = [
  {
    slug: "ilkin-ve-tekrar-bazar-arasindaki-ferqler",
    title: "İlkin və təkrar mənzil bazarı arasındakı fərqlər",
    excerpt:
      "İlkin bazar (tikintiçidən yeni mənzil) və təkrar bazar (əvvəlki mülkiyyətçidən) arasında qiymət, sənəd, risk, ipoteka imkanı, təmir və köçmə vaxtı baxımından fərqlər və hansı halda hansını seçmək.",
    categorySlug: "bazar-qiymet",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["ilkin bazar", "təkrar bazar", "yeni tikili", "çıxarış", "ipoteka"],
    legalActs: [ACT.civilCode, ACT.urbanCode, ACT.registryLaw],
    sources: [SRC.civilCode, SRC.urbanCode, SRC.registryLaw, SRC.mida, SRC.mcgf],
    content: `
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
`,
  },
  {
    slug: "yeni-tikili-yoxsa-kohne-tikili",
    title: "Yeni tikili, yoxsa köhnə tikili? Seçim meyarları",
    excerpt:
      "Yeni və köhnə tikilinin konstruksiya, sənəd, kommunal xərclər, səs izolyasiyası, infrastruktur, təmir və qiymət baxımından müqayisəsi; köhnə binada ən çox rast gəlinən problemlər və yeni tikilidə risklər.",
    categorySlug: "yeni-tikili",
    audience: "BUYER",
    level: "BEGINNER",
    featured: true,
    tags: ["yeni tikili", "köhnə tikili", "mənzil", "MTK", "çıxarış"],
    legalActs: [ACT.urbanCode, ACT.housingCode, ACT.registryLaw],
    sources: [SRC.urbanCode, SRC.housingCode, SRC.registryLaw, SRC.arxkom],
    content: `
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
`,
  },
  {
    slug: "emlakin-real-bazar-qiymetinin-mueyyen-edilmesi",
    title: "Əmlakın real bazar qiymətinin müəyyən edilməsi",
    excerpt:
      "Müqayisəli təhlil, 1 m² üzrə median qiymət, düzəliş əmsalları, elan qiyməti ilə satış qiyməti arasındakı fərq və peşəkar qiymətləndirmə — alıcı və satıcı üçün əmlakın real dəyərini hesablamaq üsulları.",
    categorySlug: "bazar-qiymet",
    audience: "SELLER",
    level: "INTERMEDIATE",
    featured: true,
    tags: ["bazar qiyməti", "qiymətləndirmə", "satış", "investisiya"],
    legalActs: [ACT.civilCode],
    sources: [SRC.civilCode, SRC.stat],
    content: `
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
`,
  },
  {
    slug: "erazinin-qiymetlendirilmesi-baki-ve-regionlar",
    title: "Bakı və regionlarda əmlak seçərkən ərazini necə qiymətləndirmək",
    excerpt:
      "Bakının mərkəzi rayonları, şəhərətrafı qəsəbələr və regionlarda əmlak seçərkən nəqliyyat, infrastruktur, iş yerləri, ekologiya, inkişaf planları və likvidlik meyarları; ərazini yoxlamaq üçün praktiki üsullar.",
    categorySlug: "bazar-qiymet",
    audience: "BUYER",
    level: "INTERMEDIATE",
    tags: ["ərazi", "infrastruktur", "Bakı", "regionlar", "investisiya"],
    legalActs: [ACT.urbanCode],
    sources: [SRC.urbanCode, SRC.stat, SRC.arxkom, SRC.adminDivisions],
    content: `
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
`,
  },
];
