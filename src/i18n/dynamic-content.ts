import type { Locale } from "@/lib/constants";

type TranslationFields = Record<string, string | null>;
export type TranslationCatalog = Record<string, { en: TranslationFields; ru: TranslationFields }>;

const LOCATION_NAMES: Record<string, { en: string; ru: string }> = {
  "Bakı": { en: "Baku", ru: "Баку" },
  "Gəncə": { en: "Ganja", ru: "Гянджа" },
  "Sumqayıt": { en: "Sumgayit", ru: "Сумгаит" },
  "Xırdalan": { en: "Khirdalan", ru: "Хырдалан" },
  "Mingəçevir": { en: "Mingachevir", ru: "Мингячевир" },
  "Şirvan": { en: "Shirvan", ru: "Ширван" },
  "Naftalan": { en: "Naftalan", ru: "Нафталан" },
  "Naxçıvan": { en: "Nakhchivan", ru: "Нахчыван" },
  "Xankəndi": { en: "Khankendi", ru: "Ханкенди" },
  "Abşeron": { en: "Absheron", ru: "Апшерон" },
  "Qəbələ": { en: "Gabala", ru: "Габала" },
  "Şəki": { en: "Shaki", ru: "Шеки" },
  "Lənkəran": { en: "Lankaran", ru: "Ленкорань" },
  "Binəqədi": { en: "Binagadi", ru: "Бинагади" },
  "Nərimanov": { en: "Narimanov", ru: "Нариманов" },
  "Nəsimi": { en: "Nasimi", ru: "Насими" },
  "Qaradağ": { en: "Garadagh", ru: "Гарадаг" },
  "Sabunçu": { en: "Sabunchu", ru: "Сабунчи" },
  "Səbail": { en: "Sabail", ru: "Сабаиль" },
  "Suraxanı": { en: "Surakhani", ru: "Сураханы" },
  "Xəzər": { en: "Khazar", ru: "Хазар" },
  "Xətai": { en: "Khatai", ru: "Хатаи" },
  "Yasamal": { en: "Yasamal", ru: "Ясамал" },
  "Pirallahı": { en: "Pirallahi", ru: "Пираллахи" },
  "20 Yanvar": { en: "20 January", ru: "20 Января" },
  "28 May": { en: "28 May", ru: "28 Мая" },
  "8 Noyabr": { en: "8 November", ru: "8 Ноября" },
  "Avtovağzal": { en: "Avtovagzal", ru: "Автовокзал" },
  "Azadlıq prospekti": { en: "Azadlig Prospekti", ru: "Проспект Азадлыг" },
  "Bakmil": { en: "Bakmil", ru: "Бакмил" },
  "Cəfər Cabbarlı": { en: "Jafar Jabbarly", ru: "Джафар Джаббарлы" },
  "Dərnəgül": { en: "Darnagul", ru: "Дарнагюль" },
  "Elmlər Akademiyası": { en: "Elmlar Akademiyasi", ru: "Элмляр Академиясы" },
  "Əhmədli": { en: "Ahmadli", ru: "Ахмедлы" },
  "Gənclik": { en: "Ganjlik", ru: "Гянджлик" },
  "Həzi Aslanov": { en: "Hazi Aslanov", ru: "Ази Асланов" },
  "İçərişəhər": { en: "Icherisheher", ru: "Ичери Шехер" },
  "İnşaatçılar": { en: "Inshaatchilar", ru: "Иншаатчылар" },
  "Koroğlu": { en: "Koroglu", ru: "Кёроглу" },
  "Qara Qarayev": { en: "Gara Garayev", ru: "Кара Караев" },
  "Memar Əcəmi": { en: "Memar Ajami", ru: "Мемар Аджеми" },
  "Memar Əcəmi-2": { en: "Memar Ajami-2", ru: "Мемар Аджеми-2" },
  "Nəriman Nərimanov": { en: "Nariman Narimanov", ru: "Нариман Нариманов" },
  "Neftçilər": { en: "Neftchilar", ru: "Нефтчиляр" },
  "Sahil": { en: "Sahil", ru: "Сахиль" },
  "Ulduz": { en: "Ulduz", ru: "Улдуз" },
  "Xalqlar Dostluğu": { en: "Khalglar Dostlugu", ru: "Халглар Достлугу" },
  "Xocəsən": { en: "Khojasan", ru: "Ходжасан" },
  "Şah İsmayıl Xətai": { en: "Shah Ismail Khatai", ru: "Шах Исмаил Хатаи" },
  "Yevlax": { en: "Yevlakh", ru: "Евлах" },
  "Ağcabədi": { en: "Aghjabadi", ru: "Агджабеди" },
  "Ağdam": { en: "Aghdam", ru: "Агдам" },
  "Ağdaş": { en: "Aghdash", ru: "Агдаш" },
  "Ağdərə": { en: "Aghdara", ru: "Агдере" },
  "Ağstafa": { en: "Aghstafa", ru: "Агстафа" },
  "Ağsu": { en: "Aghsu", ru: "Агсу" },
  "Astara": { en: "Astara", ru: "Астара" },
  "Babək": { en: "Babek", ru: "Бабек" },
  "Balakən": { en: "Balakan", ru: "Белоканы" },
  "Beyləqan": { en: "Beylagan", ru: "Бейлаган" },
  "Bərdə": { en: "Barda", ru: "Барда" },
  "Biləsuvar": { en: "Bilasuvar", ru: "Биласувар" },
  "Cəbrayıl": { en: "Jabrayil", ru: "Джебраил" },
  "Cəlilabad": { en: "Jalilabad", ru: "Джалилабад" },
  "Culfa": { en: "Julfa", ru: "Джульфа" },
  "Daşkəsən": { en: "Dashkasan", ru: "Дашкесан" },
  "Füzuli": { en: "Fuzuli", ru: "Физули" },
  "Gədəbəy": { en: "Gadabay", ru: "Гедабек" },
  "Goranboy": { en: "Goranboy", ru: "Геранбой" },
  "Göyçay": { en: "Goychay", ru: "Гёйчай" },
  "Göygöl": { en: "Goygol", ru: "Гёйгёль" },
  "Hacıqabul": { en: "Hajigabul", ru: "Гаджигабул" },
  "İmişli": { en: "Imishli", ru: "Имишли" },
  "İsmayıllı": { en: "Ismayilli", ru: "Исмаиллы" },
  "Kəlbəcər": { en: "Kalbajar", ru: "Кельбаджар" },
  "Kəngərli": { en: "Kangarli", ru: "Кенгерли" },
  "Kürdəmir": { en: "Kurdamir", ru: "Кюрдамир" },
  "Qax": { en: "Gakh", ru: "Гах" },
  "Qazax": { en: "Gazakh", ru: "Газах" },
  "Qobustan": { en: "Gobustan", ru: "Гобустан" },
  "Quba": { en: "Guba", ru: "Губа" },
  "Qubadlı": { en: "Gubadli", ru: "Губадлы" },
  "Qusar": { en: "Gusar", ru: "Гусар" },
  "Laçın": { en: "Lachin", ru: "Лачин" },
  "Lerik": { en: "Lerik", ru: "Лерик" },
  "Masallı": { en: "Masally", ru: "Масаллы" },
  "Neftçala": { en: "Neftchala", ru: "Нефтчала" },
  "Oğuz": { en: "Oghuz", ru: "Огуз" },
  "Ordubad": { en: "Ordubad", ru: "Ордубад" },
  "Saatlı": { en: "Saatly", ru: "Саатлы" },
  "Sabirabad": { en: "Sabirabad", ru: "Сабирабад" },
  "Salyan": { en: "Salyan", ru: "Сальяны" },
  "Samux": { en: "Samukh", ru: "Самух" },
  "Sədərək": { en: "Sadarak", ru: "Садарак" },
  "Siyəzən": { en: "Siyazan", ru: "Сиазань" },
  "Şabran": { en: "Shabran", ru: "Шабран" },
  "Şahbuz": { en: "Shahbuz", ru: "Шахбуз" },
  "Şamaxı": { en: "Shamakhi", ru: "Шемаха" },
  "Şəmkir": { en: "Shamkir", ru: "Шамкир" },
  "Şərur": { en: "Sharur", ru: "Шарур" },
  "Şuşa": { en: "Shusha", ru: "Шуша" },
  "Tərtər": { en: "Tartar", ru: "Тертер" },
  "Tovuz": { en: "Tovuz", ru: "Товуз" },
  "Ucar": { en: "Ujar", ru: "Уджары" },
  "Xaçmaz": { en: "Khachmaz", ru: "Хачмаз" },
  "Xızı": { en: "Khizi", ru: "Хызы" },
  "Xocalı": { en: "Khojaly", ru: "Ходжалы" },
  "Xocavənd": { en: "Khojavend", ru: "Ходжавенд" },
  "Yardımlı": { en: "Yardimli", ru: "Ярдымлы" },
  "Zaqatala": { en: "Zagatala", ru: "Загатала" },
  "Zəngilan": { en: "Zangilan", ru: "Зангелан" },
  "Zərdab": { en: "Zardab", ru: "Зардаб" },
  "Nizami": { en: "Nizami", ru: "Низами" },
  "Kəpəz": { en: "Kapaz", ru: "Кяпаз" },
  "Maştağa": { en: "Mashtaga", ru: "Маштага" },
  "Buzovna": { en: "Buzovna", ru: "Бузовна" },
  "Mərdəkan": { en: "Mardakan", ru: "Мардакян" },
  "Şüvəlan": { en: "Shuvalan", ru: "Шувелян" },
  "Bilgəh": { en: "Bilgah", ru: "Бильгя" },
  "Nardaran": { en: "Nardaran", ru: "Нардаран" },
  "Zabrat": { en: "Zabrat", ru: "Забрат" },
  "Balaxanı": { en: "Balakhani", ru: "Балаханы" },
  "Bakıxanov": { en: "Bakikhanov", ru: "Бакиханов" },
  "Ramana": { en: "Ramana", ru: "Рамана" },
  "Pirşağı": { en: "Pirshaghi", ru: "Пиршаги" },
  "Kürdəxanı": { en: "Kurdakhani", ru: "Кюрдаханы" },
  "Qala": { en: "Gala", ru: "Гала" },
  "Türkan": { en: "Turkan", ru: "Тюркан" },
  "Zirə": { en: "Zira", ru: "Зиря" },
  "Şağan": { en: "Shaghan", ru: "Шаган" },
  "Binə": { en: "Bina", ru: "Бина" },
  "Badamdar": { en: "Badamdar", ru: "Бадамдар" },
  "Bibiheybət": { en: "Bibiheybat", ru: "Биби-Эйбат" },
  "Lökbatan": { en: "Lokbatan", ru: "Локбатан" },
  "Puta": { en: "Puta", ru: "Пута" },
  "Qızıldaş": { en: "Gizildash", ru: "Гызылдаш" },
  "Ələt": { en: "Alat", ru: "Алят" },
  "Sanqaçal": { en: "Sangachal", ru: "Сангачалы" },
  "Müşviqabad": { en: "Mushfigabad", ru: "Мушфигабад" },
  "Biləcəri": { en: "Bilajari", ru: "Биладжари" },
  "Sulutəpə": { en: "Sulutapa", ru: "Сулутепе" },
  "Keşlə": { en: "Keshla", ru: "Кешля" },
  "Bülbülə": { en: "Bulbula", ru: "Бюльбюля" },
  "Hövsan": { en: "Hovsan", ru: "Говсан" },
  "Qaraçuxur": { en: "Garachukhur", ru: "Гарачухур" },
  "Zığ": { en: "Zigh", ru: "Зых" },
  "Əmircan": { en: "Amirjan", ru: "Амирджан" },
  "Günəşli": { en: "Gunashli", ru: "Гюнешли" },
  "Gürgən": { en: "Gurgan", ru: "Гюрган" },
  "Masazır": { en: "Masazir", ru: "Масазыр" },
  "Novxanı": { en: "Novkhani", ru: "Новханы" },
  "Fatmayı": { en: "Fatmayi", ru: "Фатмаи" },
  "Görədil": { en: "Goradil", ru: "Гёредиль" },
  "Mehdiabad": { en: "Mehdiabad", ru: "Мехтиабад" },
  "Saray": { en: "Saray", ru: "Сарай" },
  "Ceyranbatan": { en: "Jeyranbatan", ru: "Джейранбатан" },
  "Digah": { en: "Digah", ru: "Дигях" },
  "Qobu": { en: "Gobu", ru: "Гобу" },
  "Hökməli": { en: "Hokmali", ru: "Гёкмалы" },
  "Güzdək": { en: "Guzdak", ru: "Гюздек" },
  "Pirəkəşkül": { en: "Pirakashkul", ru: "Пирекешкюль" },
  "Nabran": { en: "Nabran", ru: "Набрань" },
  "Yalama": { en: "Yalama", ru: "Ялама" },
  "Xudat": { en: "Khudat", ru: "Худат" },
  "Xınalıq": { en: "Khinalig", ru: "Хыналыг" },
  "Qırmızı Qəsəbə": { en: "Girmizi Gasaba", ru: "Красная Слобода" },
  "Laza": { en: "Laza", ru: "Лаза" },
  "Lahıc": { en: "Lahij", ru: "Лагич" },
  "Basqal": { en: "Basgal", ru: "Баскал" },
  "İvanovka": { en: "Ivanovka", ru: "Ивановка" },
  "Nic": { en: "Nij", ru: "Нидж" },
  "Vəndam": { en: "Vandam", ru: "Вендам" },
  "Kiş": { en: "Kish", ru: "Киш" },
  "İlisu": { en: "Ilisu", ru: "Илису" },
  "Altıağac": { en: "Altiaghaj", ru: "Алтыагадж" },
  "Qalaaltı": { en: "Galaalti", ru: "Галаалты" },
  "Corat": { en: "Jorat", ru: "Джорат" },
  "Hacı Zeynalabdin": { en: "Haji Zeynalabdin", ru: "Гаджи Зейналабдин" },
  "Liman": { en: "Liman", ru: "Лиман" },
  "Horadiz": { en: "Horadiz", ru: "Горадиз" },
};

const ENGLISH_TRANSLITERATION: Record<string, string> = {
  ə: "a", ı: "i", ö: "o", ü: "u", ş: "sh", ç: "ch", ğ: "gh", x: "kh", q: "g", c: "j", j: "zh",
  Ə: "A", İ: "I", Ö: "O", Ü: "U", Ş: "Sh", Ç: "Ch", Ğ: "Gh", X: "Kh", Q: "G", C: "J", J: "Zh",
};

const RUSSIAN_TRANSLITERATION: Record<string, string> = {
  a: "а", b: "б", c: "дж", ç: "ч", d: "д", e: "е", ə: "э", f: "ф", g: "г", ğ: "г",
  h: "х", x: "х", ı: "ы", i: "и", j: "ж", k: "к", q: "г", l: "л", m: "м", n: "н",
  o: "о", ö: "ё", p: "п", r: "р", s: "с", ş: "ш", t: "т", u: "у", ü: "ю", v: "в",
  y: "й", z: "з",
};

function transliterateLocation(name: string, locale: Exclude<Locale, "az">): string {
  const map = locale === "en" ? ENGLISH_TRANSLITERATION : RUSSIAN_TRANSLITERATION;
  return [...name].map((character) => {
    const direct = map[character];
    if (direct) return direct;
    if (locale === "ru") {
      const lower = character.toLocaleLowerCase("az-AZ");
      const translated = map[lower];
      if (translated) return character === lower ? translated : translated.toLocaleUpperCase("ru-RU");
    }
    return character;
  }).join("");
}

/** Şəhər, rayon, qəsəbə və metro adlarını seçilmiş dilin yazılışına çevirir. */
export function localizeLocation<T extends { name: string }>(value: T, locale: Locale): T {
  if (locale === "az") return value;
  const name = LOCATION_NAMES[value.name]?.[locale] ?? transliterateLocation(value.name, locale);
  return { ...value, name };
}

const PROPERTY_TYPES: TranslationCatalog = {
  menziller: { en: { name: "Apartments" }, ru: { name: "Квартиры" } },
  "yeni-tikili": { en: { name: "New-build apartments" }, ru: { name: "Новостройки" } },
  "kohne-tikili": { en: { name: "Resale apartments" }, ru: { name: "Вторичное жильё" } },
  villalar: { en: { name: "Villas" }, ru: { name: "Виллы" } },
  "heyet-evleri": { en: { name: "Detached houses" }, ru: { name: "Частные дома" } },
  "bag-evleri": { en: { name: "Country houses" }, ru: { name: "Дачные дома" } },
  torpaq: { en: { name: "Land" }, ru: { name: "Земельные участки" } },
  ofisler: { en: { name: "Offices" }, ru: { name: "Офисы" } },
  obyektler: { en: { name: "Commercial property" }, ru: { name: "Коммерческие объекты" } },
  qarajlar: { en: { name: "Garages" }, ru: { name: "Гаражи" } },
  "mini-otel": { en: { name: "Mini-hotels / hostels" }, ru: { name: "Мини-отели / хостелы" } },
  "istirahet-merkezleri": { en: { name: "Holiday resorts" }, ru: { name: "Базы отдыха" } },
  "konteyner-evler": { en: { name: "Container homes" }, ru: { name: "Контейнерные дома" } },
  "a-frame-evler": { en: { name: "A-frame homes" }, ru: { name: "A-frame дома" } },
  "xarici-emlak": { en: { name: "International property" }, ru: { name: "Зарубежная недвижимость" } },
};

const FEATURES: TranslationCatalog = {
  qaz: { en: { name: "Gas" }, ru: { name: "Газ" } },
  su: { en: { name: "Water" }, ru: { name: "Вода" } },
  isiq: { en: { name: "Electricity" }, ru: { name: "Электричество" } },
  telefon: { en: { name: "Telephone" }, ru: { name: "Телефон" } },
  "kabel-tv": { en: { name: "Cable TV" }, ru: { name: "Кабельное ТВ" } },
  kanalizasiya: { en: { name: "Sewerage" }, ru: { name: "Канализация" } },
  hovuz: { en: { name: "Swimming pool" }, ru: { name: "Бассейн" } },
  qaraj: { en: { name: "Garage" }, ru: { name: "Гараж" } },
  heyet: { en: { name: "Private yard" }, ru: { name: "Двор" } },
  bagca: { en: { name: "Garden / landscaping" }, ru: { name: "Сад / ландшафт" } },
  mangal: { en: { name: "Barbecue area" }, ru: { name: "Зона барбекю" } },
  lift: { en: { name: "Lift" }, ru: { name: "Лифт" } },
  "pvc-pencere": { en: { name: "PVC windows" }, ru: { name: "ПВХ-окна" } },
  kombi: { en: { name: "Individual heating" }, ru: { name: "Индивидуальное отопление" } },
  "merkezi-isitme": { en: { name: "Central heating" }, ru: { name: "Центральное отопление" } },
  kondisioner: { en: { name: "Air conditioning" }, ru: { name: "Кондиционер" } },
  "metbex-mebeli": { en: { name: "Fitted kitchen" }, ru: { name: "Кухонная мебель" } },
  esyali: { en: { name: "Furnished" }, ru: { name: "С мебелью" } },
  duzelme: { en: { name: "Converted layout" }, ru: { name: "Перепланировка" } },
  mebel: { en: { name: "Furnished" }, ru: { name: "Мебель" } },
  kamin: { en: { name: "Fireplace" }, ru: { name: "Камин" } },
  balkon: { en: { name: "Balcony" }, ru: { name: "Балкон" } },
  avtodayanacaq: { en: { name: "Car park" }, ru: { name: "Автостоянка" } },
  "bag-sahesi": { en: { name: "Garden plot" }, ru: { name: "Садовый участок" } },
  hamam: { en: { name: "Bath / sauna" }, ru: { name: "Баня / сауна" } },
  sauna: { en: { name: "Sauna" }, ru: { name: "Сауна" } },
  "merkezi-istilik": { en: { name: "Central heating" }, ru: { name: "Центральное отопление" } },
  kamera: { en: { name: "Security cameras" }, ru: { name: "Камеры видеонаблюдения" } },
  muhafize: { en: { name: "24/7 security" }, ru: { name: "Охрана 24/7" } },
  domofon: { en: { name: "Intercom" }, ru: { name: "Домофон" } },
  siqnalizasiya: { en: { name: "Alarm system" }, ru: { name: "Сигнализация" } },
  "bagli-erazi": { en: { name: "Gated grounds" }, ru: { name: "Закрытая территория" } },
  "qapali-erazi": { en: { name: "Gated grounds" }, ru: { name: "Закрытая территория" } },
  internet: { en: { name: "Internet" }, ru: { name: "Интернет" } },
  parkinq: { en: { name: "Parking" }, ru: { name: "Парковка" } },
  "deniz-menzeresi": { en: { name: "Sea view" }, ru: { name: "Вид на море" } },
  ipoteka: { en: { name: "Mortgage available" }, ru: { name: "Ипотека" } },
  "hazir-ipoteka": { en: { name: "Existing mortgage" }, ru: { name: "Готовая ипотека" } },
  kredit: { en: { name: "Credit" }, ru: { name: "Кредит" } },
  "faizsiz-kredit": { en: { name: "Interest-free credit" }, ru: { name: "Беспроцентный кредит" } },
  taksit: { en: { name: "Instalments" }, ru: { name: "Рассрочка" } },
  barter: { en: { name: "Barter" }, ru: { name: "Бартер" } },
};

const PROPERTIES: TranslationCatalog = {
  "xetai-rayonunda-3-otaqli-yeni-tikili-menzil": {
    en: { title: "Three-room apartment in a new building in Khatai", description: "A three-room apartment in a new building in Khatai district. Contact us to confirm the current condition, documents and viewing details.", address: "1st Nakhchivan Street" },
    ru: { title: "Трёхкомнатная квартира в новостройке в Хатаинском районе", description: "Трёхкомнатная квартира в новостройке в Хатаинском районе. Свяжитесь с нами, чтобы уточнить состояние, документы и условия просмотра.", address: "1-я Нахчыванская улица" },
  },
  "muqasiye-ucun": {
    en: { title: "Property for comparison", description: "Contact the responsible person to confirm the property's condition, amenities, documents and viewing details.", address: "Nakhchivan City" },
    ru: { title: "Объект для сравнения", description: "Свяжитесь с ответственным лицом, чтобы уточнить состояние объекта, удобства, документы и условия просмотра.", address: "Город Нахчыван" },
  },
};

/**
 * Client komponentləri də (`PropertyCard`, müqayisə cədvəli) bu modulu işlədir, ona görə
 * burada yalnız onlara lazım olan kataloqlar qalır. Xidmət mətnləri (uzun tərcümələr) ayrıca
 * server modulundadır — `service-content.ts` (#187); `CATALOGS`-a qaytarsan, hər ictimai
 * səhifənin bundle-ına düşər.
 */
const CATALOGS = {
  propertyType: PROPERTY_TYPES,
  feature: FEATURES,
  property: PROPERTIES,
} as const;

export function localizeKnownContent<T extends { slug: string }>(
  kind: keyof typeof CATALOGS,
  value: T,
  locale: Locale,
): T {
  return applyKnownTranslation(CATALOGS[kind], value, locale, kind === "property");
}

/** Kataloq tərcüməsini tətbiq edir; sənəd tipli məzmunda (elan, xidmət) SEO sahələri də yenilənir. */
export function applyKnownTranslation<T extends { slug: string }>(
  catalog: TranslationCatalog,
  value: T,
  locale: Locale,
  isDocument: boolean,
): T {
  if (locale === "az") return value;
  const translated = catalog[value.slug]?.[locale];
  if (!translated) return value;

  if (isDocument) {
    const metaTitle = translated.title;
    const metaDescription = translated.shortDescription ?? translated.description;
    return {
      ...value,
      ...translated,
      ...(metaTitle ? { metaTitle, ogTitle: metaTitle } : {}),
      ...(metaDescription ? { metaDescription, ogDescription: metaDescription } : {}),
    };
  }

  return { ...value, ...translated };
}
