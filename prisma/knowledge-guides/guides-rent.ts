import type { KnowledgeGuide } from "./types";
import { ACT, SRC } from "./sources";

/** Kirayə və əmlakın idarə olunması üzrə bələdçilər. */
export const RENT_GUIDES: KnowledgeGuide[] = [
  {
    slug: "kiraye-muqavilesinin-duzgun-hazirlanmasi",
    title: "Kirayə müqaviləsinin düzgün hazırlanması",
    excerpt:
      "Yaşayış sahəsinin kirayə müqaviləsində mütləq olmalı bəndlər: tərəflər, əmlak, müddət, kirayə haqqı və ödəniş qaydası, depozit, kommunal xərclər, təmir, xitam şərtləri və təhvil-qəbul aktı. Hazır struktur və nümunə bəndlər.",
    categorySlug: "kiraye",
    audience: "RENTER",
    level: "BEGINNER",
    featured: true,
    tags: ["kirayə", "müqavilə", "depozit", "təhvil-qəbul aktı"],
    legalActs: [ACT.civilCode, ACT.housingCode, ACT.taxCode],
    sources: [SRC.civilCode, SRC.housingCode, SRC.taxCode, SRC.taxes],
    content: `
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
`,
  },
  {
    slug: "kiraye-menzil-goturerken-yoxlama-siyahisi",
    title: "Kirayə mənzil götürərkən yoxlama siyahısı",
    excerpt:
      "Kirayə mənzilə baxışda nəyi yoxlamalı: ev sahibinin mülkiyyət hüququ, mənzilin vəziyyəti, kommunikasiyalar, qonşular və ərazi, ödənişlər, depozit və müqavilə — kirayəçi üçün praktiki siyahı.",
    categorySlug: "kiraye",
    audience: "RENTER",
    level: "BEGINNER",
    tags: ["kirayə", "yoxlama siyahısı", "depozit", "saxta elan"],
    legalActs: [ACT.civilCode],
    sources: [SRC.civilCode, SRC.registryLaw],
    content: `
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
`,
  },
  {
    slug: "emlaki-kirayeye-verenler-ucun-beledci",
    title: "Əmlakı kirayəyə verənlər üçün bələdçi",
    excerpt:
      "Ev sahibi üçün: mənzilin kirayəyə hazırlanması, düzgün kirayə haqqı, kirayəçinin seçilməsi, müqavilə və depozit, vergi öhdəliyi, sığorta və mübahisələrin qarşısının alınması.",
    categorySlug: "emlak-idareetmesi",
    audience: "LANDLORD",
    level: "BEGINNER",
    tags: ["kirayə", "ev sahibi", "vergi", "depozit", "sığorta"],
    legalActs: [ACT.civilCode, ACT.taxCode, ACT.insuranceLaw],
    sources: [SRC.civilCode, SRC.taxCode, SRC.insuranceLaw, SRC.taxes],
    content: `
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
`,
  },
  {
    slug: "emlakin-idare-olunmasi-kommunal-sigorta-temir",
    title: "Əmlakın idarə olunması: kommunal, bina idarəetməsi, sığorta və təmir",
    excerpt:
      "Mülkiyyətçinin gündəlik öhdəlikləri: kommunal abunəçilik və borclar, binanın idarə edilməsi və xidmət haqqı, əmlak vergisi, icbari və könüllü sığorta, təmir və yenidənplanlaşdırma qaydaları.",
    categorySlug: "emlak-idareetmesi",
    audience: "LANDLORD",
    level: "BEGINNER",
    tags: ["kommunal", "sığorta", "əmlak vergisi", "təmir", "bina idarəetməsi"],
    legalActs: [ACT.housingCode, ACT.taxCode, ACT.insuranceLaw, ACT.urbanCode],
    sources: [SRC.housingCode, SRC.taxCode, SRC.insuranceLaw, SRC.urbanCode, SRC.taxes],
    content: `
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
`,
  },
];
