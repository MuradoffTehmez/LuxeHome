import type { PropertyFilters } from "@/lib/queries";
import type { Locale } from "@/lib/constants";

export const MIN_INDEXABLE_LISTINGS = 3;

/**
 * Az inventarlı landing istifadəçi üçün işlək qalır, lakin kifayət qədər real
 * elan toplanana qədər axtarış indeksinə buraxılmır.
 */
export function seoLandingIndexPolicy(total: number): "index" | "noindex-follow" {
  return total >= MIN_INDEXABLE_LISTINGS ? "index" : "noindex-follow";
}

export type SeoLanding = {
  slug: string;
  path: `/${string}`;
  title: string;
  description: string;
  h1: string;
  overline: string;
  filters: PropertyFilters;
  content: string[];
  faq: Array<{ question: string; answer: string }>;
  relatedPaths: string[];
};

const commonGuidance = [
  "Elanları müqayisə edərkən yalnız qiymətə deyil, ümumi sahəyə, otaq planına, mərtəbəyə, təmir vəziyyətinə, sənəd məlumatına və göstərilən ünvanın dəqiqliyinə birlikdə baxmaq faydalıdır. Şəkillər obyekt barədə ilkin təsəvvür yaratsa da, yerində baxış zamanı binanın və ya sahənin faktiki vəziyyəti, giriş imkanları, kommunikasiya xətləri və ətraf mühit ayrıca qiymətləndirilməlidir. Elan kartlarında yalnız bazada olan məlumat göstərilir; çatışmayan göstərici barədə qərar verməzdən əvvəl məsul şəxsdən dəqiqləşdirmə istəmək olar.",
  "Luxe Home Estate-də bu səhifəyə yalnız silinməmiş, demo olmayan və ictimai statusda olan elanlar daxil edilir. Nəticə sayı cari aktiv portfeli ifadə edir və bazarın ümumi statistikası kimi təqdim olunmur. Uyğun variant tapdıqda əmlak detalından telefon, WhatsApp və ya müraciət forması ilə əlaqə saxlamaq mümkündür. Büdcə, ərazi və istifadə məqsədinizi əvvəlcədən müəyyənləşdirmək seçimləri daraltmağa, baxışları daha məqsədli planlaşdırmağa və müqavilə mərhələsində vacib sualları vaxtında verməyə kömək edir.",
] as const;

function content(first: string, second: string): string[] {
  return [first, second, ...commonGuidance];
}

export const SEO_LANDINGS: readonly SeoLanding[] = [
  {
    slug: "satilan-emlaklar",
    path: "/satilan-emlaklar",
    title: "Bakıda satılan əmlaklar",
    description:
      "Bakıda satılan mənzil, villa, həyət evi, torpaq, ofis və obyekt elanlarını qiymət, sahə və yerləşməyə görə müqayisə edin.",
    h1: "Bakıda satılan daşınmaz əmlaklar",
    overline: "Satış elanları",
    filters: { listingType: "SALE" },
    content: content(
      "Bakıda əmlak almaq yaşayış, investisiya və ya biznes fəaliyyəti kimi fərqli məqsədlərə xidmət edə bilər. Bu səhifə satışda olan mənzil, villa, həyət evi, torpaq, ofis və kommersiya obyektlərini vahid siyahıda birləşdirir. Nəticələr yeni dərc olunan elanlardan başlayır; hər kartda mövcud qiymət, əmlak növü, yerləşmə və əsas ölçülər görünür. Daha dar seçim üçün əmlak növü və rayon üzrə təmiz kateqoriya səhifələrinə keçmək mümkündür.",
      "Alış qərarından əvvəl mülkiyyət sənədinin növünü, satış səlahiyyətini, kommunal öhdəlikləri və müqavilədə göstəriləcək faktiki məbləği dəqiqləşdirmək vacibdir. Mənzil və evlərdə yaşayış planı ilə yanaşı binanın texniki vəziyyəti, həyət və parklanma imkanları nəzərə alınır. Torpaq və kommersiya obyektlərində isə təyinat, giriş yolu və kommunikasiya məlumatları ayrıca yoxlanmalıdır. Platformadakı təsvir ilkin seçim üçündür; hüquqi və texniki yoxlama real sənədlər əsasında aparılmalıdır.",
    ),
    faq: [
      { question: "Satış elanlarını necə daralda bilərəm?", answer: "Əmlak növü, şəhər, rayon, qiymət, sahə, otaq, təmir və sənəd filtrlərindən istifadə edə bilərsiniz." },
      { question: "Elanın qiyməti son qiymətdirmi?", answer: "Səhifədə satıcının bazaya daxil etdiyi cari qiymət göstərilir; yekun şərt birbaşa əlaqə zamanı dəqiqləşdirilir." },
    ],
    relatedPaths: ["/bakida-satilan-menziller", "/villalar", "/torpaq-saheleri"],
  },
  {
    slug: "kiraye-emlaklar",
    path: "/kiraye-emlaklar",
    title: "Bakıda kirayə əmlaklar",
    description:
      "Bakıda kirayə mənzil, villa, həyət evi, ofis və kommersiya obyektlərini aylıq şərt, sahə və yerləşməyə görə araşdırın.",
    h1: "Bakıda kirayə daşınmaz əmlaklar",
    overline: "Kirayə elanları",
    filters: { listingType: "RENT" },
    content: content(
      "Bakıda kirayə əmlak seçimi yaşayış müddəti, iş və təhsil marşrutu, ailə tərkibi və gündəlik nəqliyyat ehtiyacından asılıdır. Bu səhifədə kirayəyə təklif edilən mənzil, villa, həyət evi, ofis və obyektlər cari ictimai elanlar əsasında göstərilir. Əşyalı vəziyyət, otaq sayı, sahə, mərtəbə və yerləşmə kimi məlumatlar mövcud olduqda kart və detal səhifəsində görünür. Aylıq və günlük şərtlərin eyni olmadığını nəzərə alaraq qiymət dövrünü elanda ayrıca yoxlamaq lazımdır.",
      "Kirayə müqaviləsində aylıq ödənişdən başqa depozit, kommunal xərclər, vasitəçilik haqqı, müddət, vaxtından əvvəl çıxış və əmlakın təhvil vəziyyəti aydın yazılmalıdır. Baxış zamanı mebel və avadanlığın işləkliyi, internet və istilik imkanları, səs-küy, lift və parklanma kimi gündəlik detallar yoxlanıla bilər. Ofis və obyektlər üçün iş rejimi, müştəri girişi, reklam lövhəsi və fəaliyyət növünə uyğunluq barədə məlumat sahib və aidiyyəti sənədlərlə dəqiqləşdirilməlidir.",
    ),
    faq: [
      { question: "Kirayə qiymətinin dövrü harada göstərilir?", answer: "Elan məlumatında qiymətin aylıq və ya günlük olduğu ayrıca qeyd edilir; göstərilməyibsə əlaqə zamanı soruşun." },
      { question: "Depozit qiymətə daxildirmi?", answer: "Depozit və əlavə xərclər hər elan üzrə fərqlənir və müqavilədən əvvəl mülkiyyətçi ilə dəqiqləşdirilməlidir." },
    ],
    relatedPaths: ["/bakida-kiraye-menziller", "/villalar", "/ofisler"],
  },
  {
    slug: "bakida-satilan-menziller",
    path: "/bakida-satilan-menziller",
    title: "Bakıda satılan mənzillər",
    description:
      "Bakıda satılan mənzilləri otaq sayı, sahə, qiymət, rayon, bina tipi, təmir və sənəd məlumatına görə müqayisə edin.",
    h1: "Bakıda satılan mənzillər",
    overline: "Mənzil satışı",
    filters: { listingType: "SALE", typeSlug: "menziller" },
    content: content(
      "Bakıda mənzil alarkən rayon seçimi ilə yanaşı binanın yaşı, tikinti tipi, mərtəbə, lift, həyət, parklanma və gündəlik xidmətlərə çıxış kimi meyarlar qərara təsir edir. Bu səhifə yalnız satışda olan və əmlak növü mənzil kimi qeyd edilmiş real ictimai elanları toplayır. Otaq sayı, ümumi sahə, təmir və sənəd statusu bazada mövcud olduqda müqayisəni asanlaşdırır. Yeni tikili və köhnə tikili kimi daha konkret seçimlər ümumi mənzil kateqoriyasının daxilində ayrıca yoxlanıla bilər.",
      "Mənzilə baxış zamanı otaqların faktiki ölçüsü və planı, təbii işıq, havalandırma, su təzyiqi, istilik sistemi, pəncərə istiqaməti və ümumi sahələrin vəziyyəti nəzərdən keçirilə bilər. Çıxarış, müqavilə və digər hüquqi sənədlərin məzmunu elandakı qısa statusla məhdudlaşmır; sənədin əsli və mülkiyyətçi məlumatı ayrıca yoxlanmalıdır. İpoteka və ya taksit planlaşdırılırsa bankın və ya satıcının tələbləri əvvəlcədən öyrənilməli, elandakı uyğunluq qeydi avtomatik təsdiq kimi qəbul edilməməlidir.",
    ),
    faq: [
      { question: "Yeni və köhnə tikili mənzilləri ayırmaq mümkündürmü?", answer: "Bina tipi və əmlak növü filtrləri ilə mövcud elanları daha konkret seçimə görə daralda bilərsiniz." },
      { question: "Sənəd statusu nə deməkdir?", answer: "Elan sahibinin daxil etdiyi qısa göstəricidir; alışdan əvvəl sənədin əsli hüquqi qaydada yoxlanmalıdır." },
    ],
    relatedPaths: ["/satilan-emlaklar", "/bakida-kiraye-menziller", "/villalar"],
  },
  {
    slug: "bakida-kiraye-menziller",
    path: "/bakida-kiraye-menziller",
    title: "Bakıda kirayə mənzillər",
    description:
      "Bakıda kirayə mənzilləri rayon, otaq sayı, sahə, mərtəbə, əşya və aylıq qiymət məlumatına görə müqayisə edin.",
    h1: "Bakıda kirayə mənzillər",
    overline: "Mənzil kirayəsi",
    filters: { listingType: "RENT", typeSlug: "menziller" },
    content: content(
      "Bakıda kirayə mənzil axtarışı üçün işə, məktəbə və gündəlik xidmətlərə çatma vaxtı çox vaxt mənzilin öz xüsusiyyətləri qədər əhəmiyyətlidir. Bu səhifə kirayə statusunda olan mənzil elanlarını bir siyahıda göstərir və rayon, qiymət, otaq, sahə, mərtəbə və digər filtrlərlə seçimi daraltmağa imkan verir. Elanın əşyalı və ya əşyasız olması, qiymət dövrü və kommunal ödənişlər barədə məlumat yalnız bazada daxil edildiyi həddə görünür; çatışmayan şərtlər birbaşa soruşulmalıdır.",
      "Baxış zamanı mənzildə olan mebel və texnikanın siyahısını, sayğac göstəricilərini, mövcud zədələri və açar təhvilini yazılı aktla qeyd etmək sonrakı anlaşılmazlıqları azalda bilər. Müqavilədə yaşayacaq şəxslər, ödəniş tarixi, depozitin qaytarılma şərti, ev heyvanı və təmir məsuliyyəti kimi mövzular aydınlaşdırılmalıdır. Qısa müddətli və günlük kirayə ayrıca şərtlər daşıya bilər; aylıq yaşayış niyyəti olan istifadəçi qiymət dövrünü və minimum müddəti xüsusi diqqətlə yoxlamalıdır.",
    ),
    faq: [
      { question: "Əşyalı mənzilləri ayrıca seçə bilərəmmi?", answer: "Mövcud elanlarda əşya xüsusiyyəti daxil edilibsə xüsusiyyət filtri ilə seçimi daraltmaq mümkündür." },
      { question: "Kommunal ödəniş qiymətə daxildirmi?", answer: "Bu şərt elandan asılıdır; müqavilə bağlanmazdan əvvəl hansı xərclərin kim tərəfindən ödənəcəyi yazılı dəqiqləşdirilməlidir." },
    ],
    relatedPaths: ["/kiraye-emlaklar", "/bakida-satilan-menziller", "/ofisler"],
  },
  {
    slug: "villalar",
    path: "/villalar",
    title: "Bakıda villa elanları",
    description:
      "Bakıda satış və kirayə villa elanlarını torpaq sahəsi, ev sahəsi, otaq, təmir, sənəd və yerləşməyə görə araşdırın.",
    h1: "Bakıda satılan və kirayə villalar",
    overline: "Villa seçimi",
    filters: { typeSlug: "villalar" },
    content: content(
      "Villa seçərkən yaşayış sahəsi ilə torpaq sahəsini bir-birindən ayırmaq, həyətin funksional istifadəsini və tikilinin sənədlərdə necə qeyd olunduğunu anlamaq vacibdir. Bu səhifə əmlak növü villa kimi daxil edilmiş satış və kirayə elanlarını cari portfeldən göstərir. Otaq, yataq otağı, sanitar qovşaq, təmir, hovuz, qaraj və kommunikasiya kimi xüsusiyyətlər yalnız elan sahibinin təqdim etdiyi məlumat olduqda görünür. Sahə və ünvan göstəriciləri baxış və sənəd yoxlaması zamanı təsdiqlənməlidir.",
      "İlboyu yaşayış üçün nəzərdə tutulan villa ilə mövsümi bağ evi eyni ehtiyacları qarşılamaya bilər. İstilik və izolyasiya, su mənbəyi, kanalizasiya, elektrik gücü, qaz, yolun vəziyyəti və yağışlı havada giriş imkanı praktik seçimə təsir edir. Alış zamanı torpaq və tikili sənədlərinin uyğunluğu, sərhədlər və faktiki əlavə tikililər ayrıca yoxlanmalıdır. Kirayədə isə həyətə qulluq, hovuz xidməti, təhlükəsizlik, kommunal xərclər və mövsümi qiymət dəyişiklikləri müqavilədə aydın göstərilməlidir.",
    ),
    faq: [
      { question: "Villa sahəsi ilə torpaq sahəsi fərqlidirmi?", answer: "Bəli. Ev sahəsi tikilinin ölçüsünü, torpaq sahəsi isə həyət daxil olmaqla torpaq ölçüsünü ifadə edir; elanda hər ikisi ayrıca göstərilə bilər." },
      { question: "Kommunikasiya məlumatları necə yoxlanır?", answer: "Elan ilkin məlumat verir; qaz, su, işıq və kanalizasiya imkanları baxışda və aidiyyəti sənədlərlə dəqiqləşdirilməlidir." },
    ],
    relatedPaths: ["/satilan-emlaklar", "/kiraye-emlaklar", "/heyet-evleri"],
  },
  {
    slug: "heyet-evleri",
    path: "/heyet-evleri",
    title: "Bakıda həyət evi elanları",
    description:
      "Bakıda satış və kirayə həyət evlərini ev və torpaq sahəsi, otaq sayı, təmir, sənəd və yerləşməyə görə müqayisə edin.",
    h1: "Bakıda satılan və kirayə həyət evləri",
    overline: "Fərdi yaşayış",
    filters: { typeSlug: "heyet-evleri" },
    content: content(
      "Həyət evi axtaran istifadəçi üçün evin daxili planı qədər torpağın forması, giriş qapısı, avtomobil yeri və qonşu tikililərlə məsafə də önəmlidir. Bu səhifədə həyət evi kateqoriyasında dərc olunmuş satış və kirayə elanları göstərilir. Ev sahəsi, torpaq sahəsi, otaq sayı, təmir və sənəd məlumatları daxil edildiyi həddə seçimə kömək edir. Villa, bağ evi və həyət evi adlarının gündəlik istifadədə qarışa bildiyini nəzərə alaraq elanın faktiki xüsusiyyətlərini detallı oxumaq faydalıdır.",
      "Baxış zamanı dam və fasadın vəziyyəti, rütubət izləri, həyətin su axını, kommunikasiya xətlərinin müstəqil olub-olmaması və küçədən giriş şəraiti yoxlanıla bilər. Alışda torpaq sərhədi, tikilinin qeydiyyatı və sənəddəki sahə faktiki vəziyyətlə tutuşdurulmalıdır. Kirayədə həyətdən istifadə qaydası, yardımçı tikililər, kommunal və qulluq məsuliyyəti yazılı razılaşdırılır. Yerləşmə adı təkbaşına yetərli deyil; dəqiq ünvan və yaxın xidmətlər baxışdan əvvəl xəritədə dəqiqləşdirilə bilər.",
    ),
    faq: [
      { question: "Həyət evi və villa elanları niyə ayrıdır?", answer: "Kateqoriyalar elan sahibinin seçiminə əsaslanır; faktiki sahə, plan və imkanları müqayisə etməklə uyğun tipi müəyyənləşdirin." },
      { question: "Torpaq sənədi ayrıca yoxlanmalıdırmı?", answer: "Bəli. Ev və torpaq üzrə hüquqi status və faktiki sərhədlər alışdan əvvəl ayrıca yoxlanmalıdır." },
    ],
    relatedPaths: ["/villalar", "/torpaq-saheleri", "/satilan-emlaklar"],
  },
  {
    slug: "torpaq-saheleri",
    path: "/torpaq-saheleri",
    title: "Bakıda torpaq sahələri",
    description:
      "Bakıda satılan torpaq sahələrini sot, qiymət, təyinat, sənəd, kommunikasiya və yerləşmə məlumatına görə araşdırın.",
    h1: "Bakıda satılan torpaq sahələri",
    overline: "Torpaq satışı",
    filters: { listingType: "SALE", typeSlug: "torpaq" },
    content: content(
      "Torpaq sahəsi seçimi planlaşdırılan tikili və ya istifadə məqsədindən başlayır. Fərdi yaşayış evi, bağ, kommersiya fəaliyyəti və başqa məqsədlər üçün hüquqi təyinat və tikinti imkanları fərqli ola bilər. Bu səhifə satışda olan torpaq elanlarını cari public məlumat əsasında göstərir. Sot ölçüsü, ümumi qiymət, yerləşmə, sənəd və kommunikasiya qeydləri daxil edildikdə müqayisə üçün istifadə olunur. Elandakı təsvir rəsmi təyinat və tikinti icazəsini əvəz etmir.",
      "Baxışdan əvvəl kadastr planı, sərhəd koordinatları, giriş yolu və qonşu sahələrlə faktiki sərhədlər barədə sənədlər istənilə bilər. Su, qaz, elektrik və kanalizasiya xəttinin yaxınlıqda olması onun sahəyə qoşulmasının avtomatik mümkün olduğu demək deyil; texniki şərtlər ayrıca dəqiqləşdirilməlidir. Maililik, torpaq səviyyəsi, drenaj, geoloji xüsusiyyət və yol genişliyi gələcək tikinti büdcəsinə təsir edə bilər. Alış müqaviləsinə qədər mülkiyyətçi və yüklülük məlumatlarının hüquqi yoxlanması vacib mərhələdir.",
    ),
    faq: [
      { question: "Torpaq sahəsi hansı ölçü ilə göstərilir?", answer: "Elanlarda torpaq sahəsi adətən sotla göstərilir; 1 sot 100 kvadratmetrdir." },
      { question: "Kommunikasiya yaxınlığı qoşulma zəmanətidirmi?", answer: "Xeyr. Xəttin mövcudluğu və qoşulma üçün texniki imkan aidiyyəti qurumlarla ayrıca dəqiqləşdirilməlidir." },
    ],
    relatedPaths: ["/satilan-emlaklar", "/heyet-evleri", "/villalar"],
  },
  {
    slug: "kommersiya-obyektleri",
    path: "/kommersiya-obyektleri",
    title: "Bakıda kommersiya obyektləri",
    description:
      "Bakıda satış və kirayə kommersiya obyektlərini sahə, giriş, yerləşmə, sənəd, təmir və qiymət məlumatına görə müqayisə edin.",
    h1: "Bakıda kommersiya obyektləri",
    overline: "Biznes məkanları",
    filters: { typeSlug: "obyektler" },
    content: content(
      "Kommersiya obyekti seçimi biznes modelinə, müştəri axınına, logistika və texniki tələblərə uyğun aparılmalıdır. Bu səhifə obyekt kateqoriyasında olan satış və kirayə elanlarını cari portfeldən göstərir. Sahə, qiymət, mərtəbə, təmir, ünvan və sənəd məlumatları mövcud olduqda ilkin müqayisə üçün istifadə edilə bilər. Mağaza, xidmət sahəsi, anbar və iaşə kimi fəaliyyətlərin hər biri giriş, havalandırma, elektrik gücü və qonşuluq baxımından fərqli şərtlər tələb edir.",
      "Baxış zamanı küçədən görünmə, vitrin, piyada və avtomobil girişi, yükləmə imkanı, tavan hündürlüyü, sanitar qovşaq və təhlükəsizlik çıxışları qiymətləndirilə bilər. Fəaliyyət növünün həmin ünvanda mümkünlüyü, qeyri-yaşayış statusu, reklam lövhəsi və yenidənqurma icazələri elandakı qısa mətnlə təsdiqlənmir. Kirayə müqaviləsində təmir xərci, indeksasiya, depozit və fəaliyyət məhdudiyyətləri; alışda isə mülkiyyət, yüklülük və ümumi sahələrdən istifadə qaydası ayrıca yoxlanmalıdır.",
    ),
    faq: [
      { question: "Obyektin fəaliyyət növünə uyğunluğu necə bilinir?", answer: "Texniki imkanlar, hüquqi status və yerli tələblər aidiyyəti sənədlər və qurumlarla ayrıca yoxlanmalıdır." },
      { question: "Küçədən ayrıca giriş elanda göstərilirmi?", answer: "Yalnız elan sahibi bu məlumatı daxil edibsə görünür; baxışdan əvvəl birbaşa dəqiqləşdirmək faydalıdır." },
    ],
    relatedPaths: ["/ofisler", "/kiraye-emlaklar", "/satilan-emlaklar"],
  },
  {
    slug: "ofisler",
    path: "/ofisler",
    title: "Bakıda ofis elanları",
    description:
      "Bakıda satış və kirayə ofisləri sahə, otaq planı, biznes mərkəzi, təmir, parklanma və yerləşməyə görə araşdırın.",
    h1: "Bakıda satılan və kirayə ofislər",
    overline: "İş məkanları",
    filters: { typeSlug: "ofisler" },
    content: content(
      "Ofis seçərkən komanda ölçüsü, iş formatı, müştəri qəbulu və nəqliyyat əlçatanlığı əsas meyarları müəyyənləşdirir. Bu səhifə ofis kateqoriyasında dərc olunmuş satış və kirayə elanlarını göstərir. Ümumi sahə, otaq planı, mərtəbə, təmir, qiymət və ünvan məlumatları bazada olduqda variantları müqayisə etməyə kömək edir. Ayrı kabinetlərə ehtiyacı olan komanda ilə açıq planlı iş məkanı axtaran şirkətin eyni sahədən gözləntisi fərqli ola bilər.",
      "Baxış zamanı internet provayderi, elektrik gücü, generator, lift, giriş nəzarəti, kondisioner və havalandırma kimi davamlı iş üçün vacib imkanlar yoxlanıla bilər. Biznes mərkəzində əlavə service charge, resepsiyon, parklanma və iş saatı qaydaları ola bilər. Kirayə müqaviləsində hüquqi ünvan istifadəsi, təmir, mebel, depozit və artım şərtləri; alışda qeyri-yaşayış statusu və ümumi sahə öhdəlikləri aydınlaşdırılmalıdır. Elan məlumatı ilkin seçimdir, texniki və hüquqi uyğunluq ayrıca təsdiqlənir.",
    ),
    faq: [
      { question: "Ofis qiymətinə xidmət haqqı daxildirmi?", answer: "Bu, bina və müqavilədən asılıdır; service charge, kommunal və parklanma xərcləri ayrıca soruşulmalıdır." },
      { question: "Hüquqi ünvan kimi istifadə etmək mümkündürmü?", answer: "İmkan obyektin hüquqi statusu və mülkiyyətçi razılığından asılıdır; müqavilədən əvvəl dəqiqləşdirilməlidir." },
    ],
    relatedPaths: ["/kommersiya-obyektleri", "/kiraye-emlaklar", "/satilan-emlaklar"],
  },
] as const;

export function findSeoLanding(slug: string): SeoLanding | null {
  return SEO_LANDINGS.find((landing) => landing.slug === slug) ?? null;
}

type LocalizedLandingHeading = Pick<SeoLanding, "title" | "description" | "h1" | "overline">;

const EN_LANDING_HEADINGS: Record<string, LocalizedLandingHeading> = {
  "satilan-emlaklar": { title: "Property for sale in Baku", description: "Compare apartments, villas, houses, land, offices and commercial property for sale in Baku by price, area and location.", h1: "Property for sale in Baku", overline: "Property sales" },
  "kiraye-emlaklar": { title: "Property for rent in Baku", description: "Explore apartments, villas, houses, offices and commercial property for rent in Baku by price, area and rental period.", h1: "Property for rent in Baku", overline: "Property rentals" },
  "bakida-satilan-menziller": { title: "Apartments for sale in Baku", description: "Compare apartments for sale in Baku by rooms, area, price, district, building type, condition and documents.", h1: "Apartments for sale in Baku", overline: "Apartment sales" },
  "bakida-kiraye-menziller": { title: "Apartments for rent in Baku", description: "Compare apartments for rent in Baku by district, rooms, area, floor, furnishing and monthly price.", h1: "Apartments for rent in Baku", overline: "Apartment rentals" },
  villalar: { title: "Villas in Baku", description: "Explore villas for sale and rent in Baku by land area, house area, rooms, condition, documents and location.", h1: "Villas for sale and rent in Baku", overline: "Villa selection" },
  "heyet-evleri": { title: "Detached houses in Baku", description: "Compare detached houses for sale and rent in Baku by house and land area, rooms, condition, documents and location.", h1: "Detached houses for sale and rent in Baku", overline: "Private homes" },
  "torpaq-saheleri": { title: "Land for sale in Baku", description: "Explore land for sale in Baku by plot size, price, permitted use, documents, utilities and location.", h1: "Land plots for sale in Baku", overline: "Land sales" },
  "kommersiya-obyektleri": { title: "Commercial property in Baku", description: "Compare commercial property for sale and rent in Baku by area, access, location, documents, condition and price.", h1: "Commercial property in Baku", overline: "Business premises" },
  ofisler: { title: "Offices in Baku", description: "Explore offices for sale and rent in Baku by area, layout, business centre, condition, parking and location.", h1: "Offices for sale and rent in Baku", overline: "Workspaces" },
};

const RU_LANDING_HEADINGS: Record<string, LocalizedLandingHeading> = {
  "satilan-emlaklar": { title: "Недвижимость на продажу в Баку", description: "Сравнивайте квартиры, виллы, дома, участки, офисы и коммерческие объекты на продажу в Баку по цене, площади и расположению.", h1: "Недвижимость на продажу в Баку", overline: "Продажа недвижимости" },
  "kiraye-emlaklar": { title: "Недвижимость в аренду в Баку", description: "Подбирайте квартиры, виллы, дома, офисы и коммерческие объекты в аренду в Баку по цене, площади и сроку аренды.", h1: "Недвижимость в аренду в Баку", overline: "Аренда недвижимости" },
  "bakida-satilan-menziller": { title: "Квартиры на продажу в Баку", description: "Сравнивайте квартиры на продажу в Баку по количеству комнат, площади, цене, району, типу дома, ремонту и документам.", h1: "Квартиры на продажу в Баку", overline: "Продажа квартир" },
  "bakida-kiraye-menziller": { title: "Квартиры в аренду в Баку", description: "Сравнивайте квартиры в аренду в Баку по району, комнатам, площади, этажу, мебели и месячной цене.", h1: "Квартиры в аренду в Баку", overline: "Аренда квартир" },
  villalar: { title: "Виллы в Баку", description: "Подбирайте виллы на продажу и в аренду в Баку по площади дома и участка, комнатам, ремонту, документам и расположению.", h1: "Виллы на продажу и в аренду в Баку", overline: "Выбор виллы" },
  "heyet-evleri": { title: "Частные дома в Баку", description: "Сравнивайте частные дома на продажу и в аренду в Баку по площади дома и участка, комнатам, ремонту и документам.", h1: "Частные дома на продажу и в аренду в Баку", overline: "Частные дома" },
  "torpaq-saheleri": { title: "Земельные участки в Баку", description: "Подбирайте участки на продажу в Баку по площади, цене, назначению, документам, коммуникациям и расположению.", h1: "Земельные участки на продажу в Баку", overline: "Продажа земли" },
  "kommersiya-obyektleri": { title: "Коммерческая недвижимость в Баку", description: "Сравнивайте коммерческие объекты на продажу и в аренду в Баку по площади, входу, расположению, документам и цене.", h1: "Коммерческая недвижимость в Баку", overline: "Помещения для бизнеса" },
  ofisler: { title: "Офисы в Баку", description: "Подбирайте офисы на продажу и в аренду в Баку по площади, планировке, бизнес-центру, ремонту, парковке и расположению.", h1: "Офисы на продажу и в аренду в Баку", overline: "Рабочие пространства" },
};

export function localizeSeoLanding(landing: SeoLanding, locale: Locale): SeoLanding {
  if (locale === "az") return landing;
  const heading = (locale === "en" ? EN_LANDING_HEADINGS : RU_LANDING_HEADINGS)[landing.slug];
  if (!heading) return landing;

  const content = locale === "en"
    ? [
        `${heading.h1} are collected here from the current Luxe Home Estate portfolio. Use the listing cards and filters to compare price, area, rooms, location, condition and document details where those fields have been provided. The result count reflects active public listings in our database, not the size or statistics of the wider market.`,
        "A listing is a starting point for comparison. Before buying or renting, confirm the exact address, physical condition, utilities, ownership documents, payment terms and any additional costs with the responsible person. An in-person viewing and independent legal or technical checks may be appropriate before signing an agreement.",
      ]
    : [
        `${heading.h1} собраны на этой странице из актуального портфеля Luxe Home Estate. Карточки и фильтры помогают сравнить цену, площадь, комнаты, расположение, ремонт и документы, если эти данные указаны в объявлении. Количество результатов отражает активные публичные объявления в нашей базе, а не статистику всего рынка.`,
        "Объявление служит отправной точкой для сравнения. До покупки или аренды уточните точный адрес, фактическое состояние, коммуникации, документы о собственности, условия оплаты и дополнительные расходы у ответственного лица. Перед подписанием договора может потребоваться личный осмотр и независимая юридическая или техническая проверка.",
      ];
  const faq = locale === "en"
    ? [
        { question: "How can I narrow the results?", answer: "Use property type, sale or rent status, price, area, rooms, condition and document filters to refine the available listings." },
        { question: "What does the result count represent?", answer: "It shows current active public listings in the Luxe Home Estate database for this selection and is not a general market statistic." },
      ]
    : [
        { question: "Как сузить результаты поиска?", answer: "Используйте фильтры типа недвижимости, продажи или аренды, цены, площади, комнат, ремонта и документов." },
        { question: "Что означает количество результатов?", answer: "Это число активных публичных объявлений в базе Luxe Home Estate для выбранной категории, а не общая статистика рынка." },
      ];

  return { ...landing, ...heading, content, faq };
}

export function getSeoLandingRouteLabels(locale: Locale) {
  if (locale === "en") return { home: "Home", properties: "Properties", pageSuffix: (page: number) => ` — page ${page}` };
  if (locale === "ru") return { home: "Главная", properties: "Недвижимость", pageSuffix: (page: number) => ` — страница ${page}` };
  return { home: "Ana səhifə", properties: "Əmlaklar", pageSuffix: (page: number) => ` — ${page}-ci səhifə` };
}

function activeFilterEntries(filters: PropertyFilters): Array<[string, unknown]> {
  return Object.entries(filters).filter(([, value]) => value !== undefined);
}

export function propertyFiltersToLandingPath(filters: PropertyFilters): string | null {
  const entries = activeFilterEntries(filters);
  const landing = SEO_LANDINGS.find((candidate) => {
    const candidateEntries = activeFilterEntries(candidate.filters);
    return (
      candidateEntries.length === entries.length &&
      candidateEntries.every(([key, value]) => filters[key as keyof PropertyFilters] === value)
    );
  });
  return landing?.path ?? null;
}

type TaxonomyLocation = {
  name: string;
  slug: string;
  parent: { name: string } | null;
};

/**
 * Rayon və metro səhifələrini eyni keyfiyyət kontraktı ilə qurur. Mətn yalnız
 * verilən location adından istifadə edir; ərazi haqqında təsdiqlənməmiş rəqəm,
 * nəqliyyat vaxtı və ya bazar iddiası yaratmır.
 */
export function buildTaxonomyLandingDescriptor(
  kind: "DISTRICT" | "METRO",
  location: TaxonomyLocation,
  locale: Locale = "az",
): SeoLanding {
  if (locale !== "az") {
    const isDistrict = kind === "DISTRICT";
    const prefix = isDistrict ? "rayon" : "metro";
    const place = location.name;
    const heading = locale === "en"
      ? `${isDistrict ? `Property in ${place} district` : `Property near ${place} metro`}`
      : `${isDistrict ? `Недвижимость в районе ${place}` : `Недвижимость у метро ${place}`}`;
    return {
      slug: location.slug,
      path: `/${prefix}/${location.slug}`,
      title: heading,
      description: locale === "en"
        ? `Compare active properties for sale and rent ${isDistrict ? `in ${place} district` : `near ${place} metro`} by price, area, rooms and property type.`
        : `Сравнивайте активные предложения о продаже и аренде ${isDistrict ? `в районе ${place}` : `у метро ${place}`} по цене, площади, комнатам и типу недвижимости.`,
      h1: heading,
      overline: locale === "en" ? (isDistrict ? "Search by district" : "Search near metro") : (isDistrict ? "Поиск по району" : "Поиск у метро"),
      filters: isDistrict ? { districtSlug: location.slug } : { metroSlug: location.slug },
      content: locale === "en"
        ? [
            `This page groups current public Luxe Home Estate listings ${isDistrict ? `in ${place} district` : `near ${place} metro`}. Available property types depend on the active portfolio, and listing cards show only information entered for each property.`,
            "Compare the exact location, daily transport needs, building or plot condition, documents and payment terms before making a decision. Confirm any missing details with the responsible person and arrange an in-person viewing.",
          ]
        : [
            `На этой странице собраны актуальные публичные объявления Luxe Home Estate ${isDistrict ? `в районе ${place}` : `у метро ${place}`}. Доступные типы недвижимости зависят от текущего портфеля, а карточки показывают только сведения, указанные для конкретного объекта.`,
            "До принятия решения сравните точное расположение, ежедневные маршруты, состояние здания или участка, документы и условия оплаты. Уточните недостающие сведения у ответственного лица и договоритесь о личном просмотре.",
          ],
      faq: locale === "en"
        ? [
            { question: `How can I refine listings for ${place}?`, answer: "Use filters for property type, sale or rent, price, area, rooms, condition and documents." },
            { question: "What does the result count represent?", answer: "It shows active public listings linked to this location in the Luxe Home Estate database, not general market statistics." },
          ]
        : [
            { question: `Как уточнить поиск по локации ${place}?`, answer: "Используйте фильтры типа недвижимости, продажи или аренды, цены, площади, комнат, ремонта и документов." },
            { question: "Что означает количество результатов?", answer: "Это активные публичные объявления, связанные с этой локацией в базе Luxe Home Estate, а не общая статистика рынка." },
          ],
      relatedPaths: ["/satilan-emlaklar", "/kiraye-emlaklar", "/bakida-satilan-menziller"],
    };
  }
  const isDistrict = kind === "DISTRICT";
  const prefix = isDistrict ? "rayon" : "metro";
  const placeLabel = isDistrict ? `${location.name} rayonunda` : `${location.name} metrosu yaxınlığında`;
  const areaContext = location.parent?.name ? `${location.parent.name} şəhərinin ${location.name} ərazisi` : location.name;

  return {
    slug: location.slug,
    path: `/${prefix}/${location.slug}`,
    title: `${placeLabel} daşınmaz əmlak elanları`,
    description: `${placeLabel} satılan və kirayə mənzil, ev, ofis və obyektləri qiymət, sahə, otaq və əmlak növünə görə müqayisə edin.`,
    h1: `${placeLabel} daşınmaz əmlaklar`,
    overline: isDistrict ? "Rayon üzrə seçim" : "Metro yaxınlığında seçim",
    filters: isDistrict ? { districtSlug: location.slug } : { metroSlug: location.slug },
    content: content(
      `${areaContext} üzrə əmlak axtarışı yaşayış, investisiya və ya biznes məqsədinə uyğun meyarların əvvəlcədən müəyyənləşdirilməsi ilə daha səmərəli olur. Bu səhifə yalnız cari bazada ${placeLabel.toLocaleLowerCase("az-AZ")} qeyd edilmiş, ictimai statusda olan real elanları bir siyahıda göstərir. Mənzil, villa, həyət evi, torpaq, ofis və kommersiya obyekti kimi fərqli əmlak növləri mövcud portfeldən asılı olaraq nəticələrə daxil ola bilər. Kartlarda qiymət, sahə, otaq və ünvan göstəriciləri yalnız elan üçün daxil edilmiş həddə görünür və həmin məlumatlar seçimləri müqayisə etmək üçün ilkin əsas yaradır.`,
      `${placeLabel} variantları nəzərdən keçirərkən konkret binanın və ya küçənin gündəlik ehtiyaclara uyğunluğu yerində qiymətləndirilməlidir. İctimai nəqliyyat, avtomobil girişi, parklanma, məktəb, iş yeri və xidmət nöqtələrinə münasibət hər istifadəçinin marşrutuna görə dəyişir; buna görə səhifə ümumi üstünlük və ya zəmanətli çatma vaxtı iddiası vermir. Satış elanında mülkiyyət və sənəd məlumatı, kirayədə isə müddət, depozit, kommunal və təhvil şərtləri müqavilədən əvvəl ayrıca dəqiqləşdirilməlidir. Dəqiq ünvan paylaşılmayıbsa baxış təyin edilərkən lokasiya məsul şəxsdən təsdiqlənə bilər.`,
    ),
    faq: [
      {
        question: `${location.name} üzrə elanları necə daralda bilərəm?`,
        answer: "Əmlak növü, satış və ya kirayə statusu, qiymət, sahə, otaq, təmir və sənəd meyarlarını elan siyahısında müqayisə edə bilərsiniz.",
      },
      {
        question: "Səhifədəki nəticə sayı nəyi göstərir?",
        answer: "Say yalnız Luxe Home Estate bazasında həmin location ilə əlaqələndirilmiş cari aktiv ictimai elanları göstərir; ümumi bazar statistikası deyil.",
      },
    ],
    relatedPaths: ["/satilan-emlaklar", "/kiraye-emlaklar", "/bakida-satilan-menziller"],
  };
}
