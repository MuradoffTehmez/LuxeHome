import type { BlogPostSeed } from "./types";
import { SRC } from "./sources";

/**
 * İlk bloq yazıları. Bilik Mərkəzindəki bələdçilər məlumat bazasıdır; bloq isə
 * eyni mövzulara oxucu sualı ətrafında qurulmuş, bələdçilərə yönləndirən
 * məqalələrdir. Bloq səhifəsi `references` sahəsini göstərmədiyi üçün mənbələr
 * mətnin sonunda da verilir.
 */
export const BLOG_POSTS: BlogPostSeed[] = [
  {
    slug: "azerbaycanda-emlak-nece-alinmalidir",
    title: "Azərbaycanda əmlak necə alınmalıdır? Addım-addım yol xəritəsi",
    excerpt:
      "Büdcənin planlaşdırılmasından çıxarışın alınmasına qədər Azərbaycanda mənzil və ev alışının bütün mərhələləri: axtarış, yoxlama, beh, notarius, qeydiyyat və təhvil.",
    categorySlug: "meslehetler",
    tags: ["alqı-satqı", "yol xəritəsi", "notarius", "çıxarış"],
    references: [SRC.civilCode, SRC.registryLaw, SRC.notaryLaw],
    metaTitle: "Azərbaycanda əmlak necə alınır: addım-addım bələdçi",
    metaDescription:
      "Büdcədən çıxarışa qədər: Azərbaycanda mənzil və ev alışının mərhələləri, sənəd yoxlaması, beh, notariat və dövlət qeydiyyatı.",
    content: `
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
`,
  },
  {
    slug: "menzil-alarken-yoxlanilmali-15-esas-meqam",
    title: "Mənzil alarkən yoxlanılmalı 15 əsas məqam",
    excerpt:
      "Çıxarışdan qonşulara, kommunal borclardan səs izolyasiyasına qədər — mənzil alışından əvvəl mütləq yoxlamalı olduğunuz 15 məqamın qısa və praktiki siyahısı.",
    categorySlug: "meslehetler",
    tags: ["mənzil", "yoxlama siyahısı", "çıxarış", "risklər"],
    references: [SRC.registryLaw, SRC.familyCode],
    metaTitle: "Mənzil alarkən yoxlanılmalı 15 əsas məqam",
    metaDescription:
      "Sənəd, satıcı, bina, kommunikasiya və ərazi: mənzil almazdan əvvəl yoxlanmalı 15 məqamın praktiki siyahısı.",
    content: `
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
`,
  },
  {
    slug: "yeni-tikili-yoxsa-kohne-tikili-hansini-secmeli",
    title: "Yeni tikili, yoxsa köhnə tikili? Hansını seçməli",
    excerpt:
      "Müasir komfort və parkinq, yoxsa formalaşmış infrastruktur və çıxarış? Yeni və köhnə tikilinin real üstünlükləri, gizli xərcləri və hansı ailə üçün hansının uyğun olduğu.",
    categorySlug: "dasinmaz-emlak",
    tags: ["yeni tikili", "köhnə tikili", "mənzil", "MTK"],
    references: [SRC.urbanCode, SRC.housingCode],
    metaTitle: "Yeni tikili, yoxsa köhnə tikili? Seçim bələdçisi",
    metaDescription:
      "Yeni və köhnə tikilinin sənəd, kommunikasiya, infrastruktur və qiymət baxımından müqayisəsi; hansı halda hansını seçmək lazımdır.",
    content: `
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
`,
  },
  {
    slug: "emlak-alarken-senedlerin-yoxlanilmasi",
    title: "Əmlak alarkən sənədlərin yoxlanılması: çıxarışdan etibarnaməyə",
    excerpt:
      "Çıxarışda hansı sahələrə baxmalı, yüklülük nədir, etibarnamə ilə alışda nəyə diqqət etməli, vərəsəlik və MTK sənədlərinin riskləri — sənəd yoxlamasının praktiki izahı.",
    categorySlug: "meslehetler",
    tags: ["çıxarış", "kupça", "etibarnamə", "yüklülük", "MTK"],
    references: [SRC.registryLaw, SRC.notaryLaw, SRC.emdx],
    metaTitle: "Əmlak alarkən sənədlər necə yoxlanılır",
    metaDescription:
      "Çıxarış, yüklülük, etibarnamə, vərəsəlik şəhadətnaməsi və MTK sənədləri: alışdan əvvəl sənəd yoxlamasının praktiki qaydaları.",
    content: `
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
`,
  },
  {
    slug: "ipoteka-ile-ev-alma-prosesi-nece-isleyir",
    title: "İpoteka ilə ev alma prosesi necə işləyir?",
    excerpt:
      "İKZF-nin güzəştli və adi ipotekasının şərtləri, e-gov.az üzərindən müraciət, qiymətləndirmə, notarial əqd və aylıq ödənişin hesablanması — ipoteka prosesinin sadə izahı və nümunə.",
    categorySlug: "meslehetler",
    tags: ["ipoteka", "İKZF", "ilkin ödəniş", "kredit"],
    references: [SRC.mcgf, SRC.mortgageLaw, SRC.eGov],
    metaTitle: "İpoteka ilə ev almaq: proses, şərtlər və hesablama",
    metaDescription:
      "İKZF ipotekasının şərtləri, müraciət qaydası, qiymətləndirmə, notarial əqd və aylıq ödəniş nümunəsi — ipoteka prosesinin sadə izahı.",
    content: `
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
`,
  },
  {
    slug: "kiraye-menzil-goturerken-neye-diqqet-etmeli",
    title: "Kirayə mənzil götürərkən nələrə diqqət etmək lazımdır?",
    excerpt:
      "Saxta elanlardan müqaviləyə, depozitdən təhvil-qəbul aktına qədər — kirayə mənzil axtaranlar üçün itkisiz və mübahisəsiz kirayənin praktiki qaydaları.",
    categorySlug: "meslehetler",
    tags: ["kirayə", "depozit", "müqavilə", "saxta elan"],
    references: [SRC.civilCode, SRC.housingCode],
    metaTitle: "Kirayə mənzil götürərkən nələrə diqqət etməli",
    metaDescription:
      "Saxta elan, ev sahibinin yoxlanması, müqavilə, depozit və təhvil-qəbul aktı: kirayə mənzil götürərkən praktiki qaydalar.",
    content: `
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
`,
  },
  {
    slug: "emlakin-bazar-qiymeti-nece-mueyyen-edilir",
    title: "Əmlakın bazar qiyməti necə müəyyən edilir?",
    excerpt:
      "Müqayisəli təhlil, 1 m² median qiymət, qiymətə təsir edən amillər və elan qiyməti ilə real satış qiyməti arasındakı fərq — əmlakın dəyərini özünüz necə təxmin edə bilərsiniz.",
    categorySlug: "bazar-xeberleri",
    tags: ["bazar qiyməti", "qiymətləndirmə", "1 m² qiymət"],
    references: [SRC.stat],
    metaTitle: "Əmlakın bazar qiyməti necə müəyyən edilir",
    metaDescription:
      "Müqayisəli təhlil, median 1 m² qiymət, düzəliş amilləri və peşəkar qiymətləndirmə: əmlakın real bazar dəyərini hesablamaq üsulları.",
    content: `
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
`,
  },
  {
    slug: "menzil-satarken-duzgun-qiymet-nece-secilmelidir",
    title: "Mənzil satarkən düzgün qiymət necə seçilməlidir?",
    excerpt:
      "Yüksək qiymət elanı «köhnəldir», aşağı qiymət pul itkisidir. Satıcı üçün qiymət strategiyası: bazar təhlili, danışıq ehtiyatı, ilk həftələrin siqnalları və qiymət düzəlişinin vaxtı.",
    categorySlug: "meslehetler",
    tags: ["satış", "bazar qiyməti", "elan", "danışıqlar"],
    references: [SRC.taxCode],
    metaTitle: "Mənzil satarkən düzgün qiymət necə seçilir",
    metaDescription:
      "Satıcı üçün qiymət strategiyası: bazar təhlili, danışıq ehtiyatı, ilk həftələrin siqnalları və qiyməti nə vaxt dəyişmək lazımdır.",
    content: `
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
`,
  },
  {
    slug: "emlak-elaninda-hansi-melumatlar-mutleq-gosterilmelidir",
    title: "Əmlak elanında hansı məlumatlar mütləq göstərilməlidir?",
    excerpt:
      "Yaxşı elan boş baxışları azaldır və ciddi alıcı gətirir. Elanda mütləq olmalı məlumatlar, fotoların qaydaları, təsvirin strukturu və alıcını uzaqlaşdıran səhvlər.",
    categorySlug: "meslehetler",
    tags: ["elan", "satış", "kirayə", "foto"],
    references: [],
    metaTitle: "Əmlak elanında hansı məlumatlar mütləq olmalıdır",
    metaDescription:
      "Qiymət, sahə, mərtəbə, sənəd statusu, dəqiq ərazi və keyfiyyətli foto: effektiv əmlak elanının strukturu və tipik səhvlər.",
    content: `
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
`,
  },
  {
    slug: "baki-ve-regionlarda-emlak-secerken-erazi-nece-qiymetlendirilmelidir",
    title: "Bakı və regionlarda əmlak seçərkən ərazi necə qiymətləndirilməlidir?",
    excerpt:
      "Mərkəz, yaşayış rayonları, şəhərətrafı qəsəbələr və regionlar: nəqliyyat, infrastruktur, ekologiya, inkişaf planları və likvidlik meyarları ilə ərazini düzgün qiymətləndirmək.",
    categorySlug: "dasinmaz-emlak",
    tags: ["ərazi", "Bakı", "regionlar", "infrastruktur", "investisiya"],
    references: [SRC.adminDivisions, SRC.stat],
    metaTitle: "Bakı və regionlarda ərazini necə qiymətləndirmək",
    metaDescription:
      "Nəqliyyat, infrastruktur, ekologiya, inkişaf planları və likvidlik: Bakıda və regionlarda əmlak üçün ərazi seçiminin meyarları.",
    content: `
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
`,
  },
];
