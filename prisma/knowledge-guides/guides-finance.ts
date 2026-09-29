import type { KnowledgeGuide } from "./types";
import { ACT, SRC } from "./sources";

/** İpoteka və maliyyə bələdçiləri. Rəqəmlər mcgf.gov.az-dan 29.09.2026-da götürülüb. */
export const FINANCE_GUIDES: KnowledgeGuide[] = [
  {
    slug: "ipoteka-ile-emlak-alinmasi-prosesi",
    title: "İpoteka ilə əmlak alınması prosesi: müraciətdən açara qədər",
    excerpt:
      "İKZF-nin güzəştli və adi ipotekası, bank ipotekası, ilkin ödəniş, tələb olunan sənədlər, e-gov.az üzərindən müraciət, qiymətləndirmə, sığorta və notarial əqd — ipoteka prosesinin bütün mərhələləri.",
    categorySlug: "ipoteka-maliyye",
    audience: "BUYER",
    level: "INTERMEDIATE",
    featured: true,
    tags: ["ipoteka", "İKZF", "ilkin ödəniş", "kredit", "sığorta"],
    legalActs: [ACT.mortgageLaw, ACT.civilCode, ACT.registryLaw],
    sources: [SRC.mcgf, SRC.mortgageLaw, SRC.civilCode, SRC.eGov, SRC.registryLaw],
    content: `
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
`,
  },
  {
    slug: "kredit-ipoteka-ve-ilkin-odenis-anlayislari",
    title: "Kredit, ipoteka və ilkin ödəniş anlayışları: sadə izah",
    excerpt:
      "İlkin ödəniş, kredit məbləği, faiz dərəcəsi, illik real faiz, annuitet və differensial ödəniş, LTV, zamin, girov, vaxtından əvvəl ödəmə — ipoteka müqaviləsində rast gəlinən əsas anlayışların sadə izahı və nümunə hesablama.",
    categorySlug: "ipoteka-maliyye",
    audience: "BUYER",
    level: "BEGINNER",
    tags: ["ipoteka", "kredit", "ilkin ödəniş", "faiz", "annuitet"],
    legalActs: [ACT.mortgageLaw, ACT.civilCode],
    sources: [SRC.mortgageLaw, SRC.civilCode, SRC.mcgf],
    content: `
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
`,
  },
];
