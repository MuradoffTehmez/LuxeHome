import type { KnowledgeGuide } from "./types";
import { ACT, SRC } from "./sources";

/** Əmlak növləri üzrə ayrıca bələdçilər. */
export const PROPERTY_TYPE_GUIDES: KnowledgeGuide[] = [
  {
    slug: "menzil-alarken-praktiki-beledci",
    title: "Mənzil alarkən praktiki bələdçi: mərtəbə, plan, təmir və sənəd",
    excerpt:
      "Çoxmənzilli binada mənzil seçərkən mərtəbə, plan, istiqamət, təmir səviyyəsi, sahə anlayışları və sənəd statusu kimi amilləri necə qiymətləndirmək — mənzil alıcısı üçün xüsusi bələdçi.",
    categorySlug: "emlak-novleri",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["mənzil", "yoxlama siyahısı", "təmir", "yeni tikili", "köhnə tikili"],
    legalActs: [ACT.housingCode, ACT.registryLaw],
    sources: [SRC.housingCode, SRC.registryLaw, SRC.urbanCode],
    content: `
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
`,
  },
  {
    slug: "heyet-evi-alarken-beledci",
    title: "Həyət evi alarkən bələdçi: torpaq, tikili, kommunikasiya və sənədlər",
    excerpt:
      "Həyət evi və bağ evi alarkən yoxlanmalı xüsusi məqamlar: torpaq sahəsi ilə evin ayrı-ayrılıqda sənədləşdirilməsi, torpağın təyinatı, sərhədlər, qeydiyyatsız tikililər, su, qaz, işıq və kanalizasiya.",
    categorySlug: "emlak-novleri",
    audience: "BUYER",
    level: "INTERMEDIATE",
    tags: ["həyət evi", "torpaq", "çıxarış", "kommunal", "yoxlama siyahısı"],
    legalActs: [ACT.landCode, ACT.civilCode, ACT.registryLaw, ACT.urbanCode],
    sources: [SRC.landCode, SRC.civilCode, SRC.registryLaw, SRC.urbanCode, SRC.emdx],
    content: `
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
`,
  },
  {
    slug: "torpaq-sahesi-alarken-beledci",
    title: "Torpaq sahəsi alarkən bələdçi: təyinat, mülkiyyət forması və tikinti imkanı",
    excerpt:
      "Torpaq alarkən təyinatı, kateqoriyası, mülkiyyət formasını, sərhədləri, yüklülükləri və tikinti imkanını necə yoxlamalı; kənd təsərrüfatı torpağında ev tikməyin riskləri və əsas sənədlər.",
    categorySlug: "emlak-novleri",
    audience: "INVESTOR",
    level: "INTERMEDIATE",
    tags: ["torpaq", "təyinat", "çıxarış", "tikinti icazəsi", "risklər"],
    legalActs: [ACT.landCode, ACT.civilCode, ACT.registryLaw, ACT.urbanCode],
    sources: [SRC.landCode, SRC.civilCode, SRC.registryLaw, SRC.urbanCode, SRC.emdx],
    content: `
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
`,
  },
  {
    slug: "kommersiya-obyekti-beledcisi",
    title: "Kommersiya obyekti alarkən və icarəyə götürərkən bələdçi",
    excerpt:
      "Ofis, mağaza, anbar və ya obyekt alarkən yaxud icarəyə götürərkən: təyinat, yerləşmə və axın, texniki göstəricilər, gəlirlilik hesabı, icarə müqaviləsinin xüsusiyyətləri və vergi məsələləri.",
    categorySlug: "emlak-novleri",
    audience: "INVESTOR",
    level: "ADVANCED",
    tags: ["kommersiya", "icarə", "investisiya", "gəlirlilik", "vergi"],
    legalActs: [ACT.civilCode, ACT.taxCode, ACT.urbanCode, ACT.registryLaw],
    sources: [SRC.civilCode, SRC.taxCode, SRC.urbanCode, SRC.registryLaw, SRC.taxes],
    content: `
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
`,
  },
];
