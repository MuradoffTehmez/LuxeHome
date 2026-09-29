import type { KnowledgeGuide } from "./types";
import { ACT, SRC } from "./sources";

/** Sənəd, notariat, xərc, agentlik və təhlükəsizlik bələdçiləri. */
export const LEGAL_GUIDES: KnowledgeGuide[] = [
  {
    slug: "cixarisin-ve-huquqi-senedlerin-yoxlanilmasi",
    title: "Çıxarışın və digər hüquqi sənədlərin yoxlanılması",
    excerpt:
      "Daşınmaz əmlakın dövlət reyestrindən çıxarışda nəyə baxmalı, yüklülüyü necə yoxlamalı, etibarnamə, vərəsəlik şəhadətnaməsi, ilkin müqavilə və MTK sənədlərində hansı risklər var — praktiki izah.",
    categorySlug: "qeydiyyat-notariat",
    audience: "BUYER",
    level: "BEGINNER",
    featured: true,
    tags: ["çıxarış", "kupça", "yüklülük", "etibarnamə", "MTK", "notarius"],
    legalActs: [ACT.registryLaw, ACT.civilCode, ACT.notaryLaw, ACT.familyCode],
    sources: [SRC.registryLaw, SRC.civilCode, SRC.notaryLaw, SRC.emdx, SRC.eEmlak],
    content: `
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
`,
  },
  {
    slug: "emlakin-huquqi-tarixcesinin-yoxlanilmasi",
    title: "Əmlakın hüquqi tarixçəsinin yoxlanılması",
    excerpt:
      "Əmlak əvvəllər kimə məxsus olub, necə əl dəyişib, mübahisə və vərəsə iddiası ehtimalı varmı? Hüquqi tarixçəni yoxlamağın üsulları və təhlükə siqnalları.",
    categorySlug: "qeydiyyat-notariat",
    audience: "BUYER",
    level: "INTERMEDIATE",
    tags: ["hüquqi tarixçə", "çıxarış", "vərəsəlik", "risklər"],
    legalActs: [ACT.registryLaw, ACT.civilCode, ACT.familyCode],
    sources: [SRC.registryLaw, SRC.civilCode, SRC.familyCode, SRC.emdx],
    content: `
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
`,
  },
  {
    slug: "notariat-proseduru-addim-addim",
    title: "Notariat prosedurları: alqı-satqının notarial təsdiqi addım-addım",
    excerpt:
      "Notariusa hansı sənədlərlə getmək lazımdır, notarius nəyi yoxlayır, xərcləri kim ödəyir, əqddən sonra qeydiyyat necə aparılır — alqı-satqının notarial mərhələsi haqqında praktiki bələdçi.",
    categorySlug: "qeydiyyat-notariat",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["notarius", "müqavilə", "dövlət qeydiyyatı", "dövlət rüsumu"],
    legalActs: [ACT.notaryLaw, ACT.civilCode, ACT.stateDutyLaw, ACT.registryLaw],
    sources: [SRC.notaryLaw, SRC.civilCode, SRC.stateDutyLaw, SRC.justice, SRC.asan],
    content: `
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
`,
  },
  {
    slug: "dovlet-rusumlari-ve-emeliyyat-xercleri",
    title: "Dövlət rüsumları və əmlak alqı-satqısında digər mümkün xərclər",
    excerpt:
      "Əmlak alarkən və satarkən ödənilən xərclərin tam siyahısı: dövlət rüsumu, notariat, satıcının vergisi, ipoteka ilə bağlı qiymətləndirmə və sığorta, agentlik haqqı, köçmə və təmir — smetanı necə hazırlamalı.",
    categorySlug: "vergi-rusum",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["dövlət rüsumu", "vergi", "xərclər", "notarius", "ipoteka"],
    legalActs: [ACT.stateDutyLaw, ACT.taxCode, ACT.notaryLaw, ACT.insuranceLaw],
    sources: [SRC.stateDutyLaw, SRC.taxCode, SRC.notaryLaw, SRC.insuranceLaw, SRC.taxes, SRC.mcgf],
    content: `
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
`,
  },
  {
    slug: "agentlikle-isleyerken-diqqet-edilmeli-meqamlar",
    title: "Əmlak agentliyi ilə işləyərkən diqqət edilməli məqamlar",
    excerpt:
      "Agentliyi necə seçmək, müqavilədə nələr yazılmalı, komissiya nə vaxt və nə üçün ödənilir, eksklüziv razılaşmanın üstünlük və riskləri, agentin səlahiyyət hüdudları.",
    categorySlug: "agentlik-brokerlik",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["agentlik", "komissiya", "müqavilə", "etibarnamə", "broker"],
    legalActs: [ACT.civilCode],
    sources: [SRC.civilCode],
    content: `
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
`,
  },
  {
    slug: "saxta-ve-yaniltici-elanlari-tanimaq",
    title: "Əmlak elanlarında saxta və yanıltıcı məlumatları necə tanımaq olar",
    excerpt:
      "Bazardan xeyli ucuz qiymət, başqa elandan götürülmüş foto, «əvvəlcədən ödəniş» tələbi, uyğunsuz sahə və ünvan — saxta və yanıltıcı elanların əlamətləri və fırıldaqdan qorunma qaydaları.",
    categorySlug: "tehlukesizlik",
    audience: "BUYER",
    level: "BEGINNER",
    featured: true,
    tags: ["saxta elan", "fırıldaq", "beh", "təhlükəsizlik", "risklər"],
    legalActs: [ACT.civilCode],
    sources: [SRC.civilCode, SRC.registryLaw],
    content: `
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
`,
  },
];
