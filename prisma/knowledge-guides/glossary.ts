/**
 * Lüğətə əlavə olunan terminlər. İlk 12 termin `build-knowledge-hub-sql.ts`-dədir
 * (çıxarış, paylı/birgə mülkiyyət, ipoteka, beh, ...) — slug-lar təkrarlanmamalıdır.
 */
export type GlossaryTermSeed = {
  slug: string;
  term: string;
  shortDefinition: string;
  definition: string;
  categorySlug: string;
  related: string[];
};

export const GLOSSARY_TERMS: GlossaryTermSeed[] = [
  {
    slug: "yukluluk",
    term: "Yüklülük",
    shortDefinition: "Əmlak üzərində mülkiyyətçinin sərəncam hüququnu məhdudlaşdıran və reyestrdə qeydə alınan hüquq və ya qadağa (ipoteka, həbs, icarə və s.).",
    definition: "<p>Yüklülük əmlakın satışını, bağışlanmasını və ya girov qoyulmasını məhdudlaşdıra bilər. Ən çox rast gəlinən növləri ipoteka, məhkəmə və ya icra orqanının həbsi, notarial qadağa və uzunmüddətli icarədir. Alışdan əvvəl yüklülüyün olub-olmadığı reyestr üzrə yoxlanmalıdır.</p>",
    categorySlug: "qeydiyyat-notariat",
    related: ["cixaris-kupca", "ipoteka", "hebs"],
  },
  {
    slug: "hebs",
    term: "Həbs (əmlak üzərində)",
    shortDefinition: "Məhkəmə və ya icra orqanının qərarı ilə əmlakın özgəninkiləşdirilməsinə qoyulan məhdudiyyət.",
    definition: "<p>Həbs qoyulmuş əmlak həbs götürülənə qədər satıla və ya bağışlana bilməz. Həbs çox vaxt borc və ya məhkəmə mübahisəsi ilə bağlı olur və reyestrdə qeydə alınır.</p>",
    categorySlug: "qeydiyyat-notariat",
    related: ["yukluluk", "cixaris-kupca"],
  },
  {
    slug: "etibarname",
    term: "Etibarnamə",
    shortDefinition: "Bir şəxsin digər şəxsə öz adından hüquqi hərəkətlər etmək səlahiyyəti verdiyi yazılı sənəd; daşınmaz əmlak əqdləri üçün notarial qaydada təsdiqlənir.",
    definition: "<p>Etibarnamədə nümayəndənin konkret səlahiyyətləri (satmaq, pul almaq, sənəd imzalamaq) və müddəti göstərilir. Etibarnamə ilə alışda onun əslini, müddətini və ləğv edilmədiyini yoxlamaq, ödənişi isə mümkünsə mülkiyyətçinin öz hesabına köçürmək tövsiyə olunur.</p>",
    categorySlug: "agentlik-brokerlik",
    related: ["numayende", "notarius"],
  },
  {
    slug: "notarius",
    term: "Notarius",
    shortDefinition: "Qanunla müəyyən edilmiş notarial hərəkətləri, o cümlədən daşınmaz əmlak müqavilələrinin təsdiqini həyata keçirən səlahiyyətli şəxs.",
    definition: "<p>Notarius tərəflərin şəxsiyyətini, fəaliyyət qabiliyyətini, əmlak üzərində hüquqları və əqdin qanuniliyini yoxlayır, müqaviləni təsdiq edir və qeydiyyat üçün sənədləri reyestr orqanına təqdim edir. Azərbaycanda dövlət və xüsusi notariuslar fəaliyyət göstərir.</p>",
    categorySlug: "qeydiyyat-notariat",
    related: ["dovlet-rusumu", "alqi-satqi-muqavilesi"],
  },
  {
    slug: "alqi-satqi-muqavilesi",
    term: "Alqı-satqı müqaviləsi",
    shortDefinition: "Satıcının əmlakı alıcının mülkiyyətinə verməyi, alıcının isə onu qəbul edib qiymətini ödəməyi öhdəsinə götürdüyü müqavilə.",
    definition: "<p>Daşınmaz əmlakın alqı-satqı müqaviləsi notarial qaydada təsdiqlənir; alıcının mülkiyyət hüququ isə dövlət reyestrində qeydiyyat anından yaranır. Müqavilədə əmlakın dəqiq təsviri, qiymət, ödəniş qaydası və təhvil şərtləri göstərilməlidir.</p>",
    categorySlug: "alqi-satqi",
    related: ["beh", "notarius", "cixaris-kupca"],
  },
  {
    slug: "avans",
    term: "Avans",
    shortDefinition: "Gələcək ödənişin qabaqcadan verilən hissəsi; əqd baş tutmasa, qaytarılır — behdən fərqli olaraq cərimə funksiyası daşımır.",
    definition: "<p>Avans və beh tez-tez qarışdırılır. Beh müqavilənin icrasını təmin edir: onu verən tərəf imtina etsə, beh itirilir, alan tərəf imtina etsə, ikiqat qaytarılır. Avans isə sadəcə ödənişin bir hissəsidir. Sənəddə hansı termin işləndiyi nəticəni müəyyən edir.</p>",
    categorySlug: "alqi-satqi",
    related: ["beh", "alqi-satqi-muqavilesi"],
  },
  {
    slug: "ilkin-odenis",
    term: "İlkin ödəniş",
    shortDefinition: "İpoteka ilə alışda əmlak dəyərinin alıcının öz vəsaiti hesabına ödənilən hissəsi.",
    definition: "<p>İKZF-nin güzəştli ipotekasında minimal ilkin ödəniş 10%, adi ipotekasında 15%-dir (mcgf.gov.az, 29.09.2026). İlkin ödəniş nə qədər böyükdürsə, kredit məbləği, aylıq ödəniş və ümumi faiz xərci bir o qədər az olur.</p>",
    categorySlug: "ipoteka-maliyye",
    related: ["ipoteka", "ikzf", "annuitet"],
  },
  {
    slug: "ikzf",
    term: "İKZF (İpoteka və Kredit Zəmanət Fondu)",
    shortDefinition: "Güzəştli və adi ipoteka kreditlərini müvəkkil banklar vasitəsilə maliyyələşdirən və kreditlərə zəmanət verən dövlət fondu.",
    definition: "<p>Fondun ipoteka krediti üçün müraciət elektron hökumət portalı üzərindən «Elektron ipoteka və kredit zəmanət» sistemi ilə təqdim olunur. Şərtlər (məbləğ, müddət, faiz, ilkin ödəniş) Fondun rəsmi saytında (mcgf.gov.az) dərc edilir.</p>",
    categorySlug: "ipoteka-maliyye",
    related: ["ipoteka", "ilkin-odenis"],
  },
  {
    slug: "annuitet",
    term: "Annuitet ödəniş",
    shortDefinition: "Kredit müddəti boyu bərabər məbləğdə aylıq ödəniş; əvvəlcə faiz hissəsi böyük, əsas borc hissəsi kiçik olur.",
    definition: "<p>İpoteka kreditlərində ən çox işlədilən ödəniş sxemidir. Alternativ — differensial ödənişdir: əsas borc bərabər hissələrlə ödənilir və aylıq məbləğ zamanla azalır.</p>",
    categorySlug: "ipoteka-maliyye",
    related: ["ilkin-odenis", "illik-real-faiz"],
  },
  {
    slug: "illik-real-faiz",
    term: "İllik real faiz dərəcəsi",
    shortDefinition: "Nominal faizlə yanaşı komissiya, sığorta və digər məcburi xərcləri əks etdirən, kreditin real dəyərini göstərən illik faiz.",
    definition: "<p>Bank təkliflərini nominal faizə görə deyil, illik real (effektiv) faiz dərəcəsinə görə müqayisə etmək lazımdır — eyni nominal faizli iki kreditin real dəyəri komissiyalar səbəbindən xeyli fərqlənə bilər.</p>",
    categorySlug: "ipoteka-maliyye",
    related: ["annuitet", "ipoteka"],
  },
  {
    slug: "mtk",
    term: "MTK (Mənzil-tikinti kooperativi)",
    shortDefinition: "Üzvlərin vəsaiti hesabına yaşayış binası tikən təşkilat; MTK sənədi özü mülkiyyət hüququnu təsdiq etmir.",
    definition: "<p>MTK üzvlüyü və ya MTK ilə bağlanmış müqavilə mülkiyyət hüququ yaratmır — hüquq çıxarış verildikdən sonra yaranır. Buna görə «kupçasız» mənzillərin alışı daha yüksək risk daşıyır və adətən ipoteka üçün qəbul edilmir. MTK tərəfindən tələb edilən hər ödənişin hüquqi əsası yazılı göstərilməlidir.</p>",
    categorySlug: "yeni-tikili",
    related: ["ilkin-muqavile", "cixaris-kupca", "istismara-qebul"],
  },
  {
    slug: "istismara-qebul",
    term: "İstismara qəbul",
    shortDefinition: "Tikintisi başa çatmış binanın layihəyə və normalara uyğunluğunun yoxlanılaraq istifadəyə verilməsi.",
    definition: "<p>Bina istismara qəbul edilənə qədər orada mənzillər üzrə mülkiyyət hüququnun qeydiyyatı, adətən, mümkün olmur. Yeni tikilidə alış edərkən binanın istismara qəbul edilib-edilmədiyini və çıxarışların nə vaxt veriləcəyini öyrənin.</p>",
    categorySlug: "yeni-tikili",
    related: ["mtk", "ilkin-muqavile"],
  },
  {
    slug: "ilkin-bazar",
    term: "İlkin bazar",
    shortDefinition: "Mənzilin tikintiçidən ilk dəfə satıldığı bazar; çox vaxt bina tikinti mərhələsində olur.",
    definition: "<p>İlkin bazarda qiymət tikintinin erkən mərhələsində aşağı ola bilər, lakin tikintinin gecikməsi və sənədləşmənin uzanması riskləri mövcuddur.</p>",
    categorySlug: "bazar-qiymet",
    related: ["tekrar-bazar", "mtk"],
  },
  {
    slug: "tekrar-bazar",
    term: "Təkrar bazar",
    shortDefinition: "Artıq kiminsə mülkiyyətində olan əmlakın yeni alıcıya satıldığı bazar.",
    definition: "<p>Təkrar bazarda əmlakın adətən çıxarışı olur və ipoteka ilə alış mümkündür; əsas yoxlama obyekti isə hüquqi tarixçə və əmlakın fiziki vəziyyətidir.</p>",
    categorySlug: "bazar-qiymet",
    related: ["ilkin-bazar", "cixaris-kupca"],
  },
  {
    slug: "depozit",
    term: "Depozit (kirayədə təminat məbləği)",
    shortDefinition: "Kirayəçinin müqavilə başlananda ev sahibinə verdiyi, əmlakın zədələnməsi və ödənilməmiş xərclər üçün təminat rolunu oynayan məbləğ.",
    definition: "<p>Depozitin məbləği, qaytarılma müddəti və hansı hallarda tutula biləcəyi kirayə müqaviləsində yazılmalıdır. Təhvil-qəbul aktı depozit mübahisəsinin qarşısını alan əsas sənəddir.</p>",
    categorySlug: "kiraye",
    related: ["tehvil-qebul-akti"],
  },
  {
    slug: "tehvil-qebul-akti",
    term: "Təhvil-qəbul aktı",
    shortDefinition: "Əmlakın vəziyyətini, əşyaların siyahısını, sayğac göstəricilərini və açarları təhvil anında qeyd edən sənəd.",
    definition: "<p>Alqı-satqıda və kirayədə tərtib edilir. Tarixli fotolarla birlikdə sonradan yaranan «bu zədə əvvəl də var idi» mübahisələrinin qarşısını alır.</p>",
    categorySlug: "kiraye",
    related: ["depozit"],
  },
  {
    slug: "dovlet-rusumu",
    term: "Dövlət rüsumu",
    shortDefinition: "Notarial hərəkətlər və digər hüquqi əhəmiyyətli hərəkətlər üçün dövlət büdcəsinə ödənilən məcburi ödəniş.",
    definition: "<p>Dövlət rüsumunun məbləği və ödəniş qaydası «Dövlət rüsumu haqqında» Qanunla müəyyən edilir. Daşınmaz əmlak əqdində rüsumun konkret məbləğini əqddən əvvəl notariusdan öyrənmək olar.</p>",
    categorySlug: "vergi-rusum",
    related: ["notarius"],
  },
  {
    slug: "eksklyuziv-muqavile",
    term: "Eksklüziv müqavilə (agentliklə)",
    shortDefinition: "Əmlakın müəyyən müddət ərzində yalnız bir agentlik vasitəsilə satılması və ya kirayəyə verilməsi barədə razılaşma.",
    definition: "<p>Eksklüziv müqavilədə agentlik adətən reklama daha çox vəsait qoyur, lakin mülkiyyətçi müstəqil tapdığı alıcı üçün də komissiya ödəmək öhdəliyi ilə üzləşə bilər. Müddət və vaxtından əvvəl ləğv şərtlərini diqqətlə oxuyun.</p>",
    categorySlug: "agentlik-brokerlik",
    related: ["agent", "broker"],
  },
];
