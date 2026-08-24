import type { Locale } from "@/lib/constants";

type TranslationFields = Record<string, string | null>;
type TranslationCatalog = Record<string, { en: TranslationFields; ru: TranslationFields }>;

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
  "Nariman Nərimanov": { en: "Nariman Narimanov", ru: "Нариман Нариманов" },
  "Neftçilər": { en: "Neftchilar", ru: "Нефтчиляр" },
  "Sahil": { en: "Sahil", ru: "Сахиль" },
  "Ulduz": { en: "Ulduz", ru: "Улдуз" },
  "Xalqlar Dostluğu": { en: "Khalglar Dostlugu", ru: "Халглар Достлугу" },
  "Xocəsən": { en: "Khojasan", ru: "Ходжасан" },
  "Şah İsmayıl Xətai": { en: "Shah Ismail Khatai", ru: "Шах Исмаил Хатаи" },
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

const SERVICES: TranslationCatalog = {
  "alqi-satqi": {
    en: {
      title: "Buying and selling",
      shortDescription: "Professional support for property purchase and sale.",
      description: "Luxe Home Estate supports the entire property purchase and sale process. We assist with market-value assessment, finding the right buyer or seller, negotiations, document checks and preparation for notarised completion.\n\nFor each property, we clarify the legal and document status and help the parties reach a transparent agreement.",
      bullets: JSON.stringify(["Property market-value assessment", "Review of legal documents", "Buyer and seller negotiations", "Coordination of notarised completion", "Post-transaction support"]),
    },
    ru: {
      title: "Покупка и продажа",
      shortDescription: "Профессиональное сопровождение покупки и продажи недвижимости.",
      description: "Luxe Home Estate сопровождает процесс покупки и продажи недвижимости от начала до завершения. Мы помогаем оценить рыночную стоимость, найти подходящего покупателя или продавца, провести переговоры, проверить документы и подготовить нотариальное оформление.\n\nПо каждому объекту уточняются юридическая чистота и состояние документов, а между сторонами обеспечивается прозрачное соглашение.",
      bullets: JSON.stringify(["Оценка рыночной стоимости", "Проверка юридических документов", "Переговоры между покупателем и продавцом", "Организация нотариального оформления", "Поддержка после сделки"]),
    },
  },
  icare: {
    en: {
      title: "Rentals",
      shortDescription: "Rental services for apartments, villas, offices and other property.",
      description: "We offer a broad portfolio for short- and long-term rent. We select apartments, villas, country houses, offices and commercial premises that match your requirements, arrange viewings and assist with preparing the rental agreement.\n\nWe aim to make the terms clear and mutually fair for both owner and tenant.",
      bullets: JSON.stringify(["Short- and long-term rental options", "Viewing coordination", "Rental agreement preparation", "Tenant selection for owners", "Support during the rental term"]),
    },
    ru: {
      title: "Аренда",
      shortDescription: "Аренда квартир, вилл, офисов и других объектов недвижимости.",
      description: "Мы предлагаем широкий выбор объектов для краткосрочной и долгосрочной аренды. Подбираем квартиры, виллы, дачные дома, офисы и коммерческие помещения, организуем просмотры и помогаем подготовить договор аренды.\n\nМы стремимся сделать условия понятными и взаимовыгодными как для владельца, так и для арендатора.",
      bullets: JSON.stringify(["Краткосрочная и долгосрочная аренда", "Организация просмотров", "Подготовка договора аренды", "Подбор арендатора для владельца", "Сопровождение в течение срока аренды"]),
    },
  },
  ipoteka: {
    en: {
      title: "Mortgage support",
      shortDescription: "Guidance for purchasing property with a mortgage.",
      description: "We help clients understand the mortgage process and prepare the required documents. We identify properties that may meet mortgage requirements and guide clients through collecting a document package suitable for the bank.\n\nPlease note that the lending decision and terms are determined by the relevant financial institution.",
      bullets: JSON.stringify(["Selection of potentially mortgage-eligible property", "Document-package support", "Guidance on bank requirements", "Coordination of property valuation", "Support during formal completion"]),
    },
    ru: {
      title: "Ипотека",
      shortDescription: "Сопровождение покупки недвижимости в ипотеку.",
      description: "Мы помогаем клиентам разобраться в ипотечном процессе и подготовить необходимые документы. Определяем объекты, которые могут соответствовать требованиям ипотеки, и сопровождаем сбор пакета документов для банка.\n\nОбратите внимание: решение о выдаче кредита и его условия определяет соответствующая финансовая организация.",
      bullets: JSON.stringify(["Подбор объектов, подходящих для ипотеки", "Помощь с пакетом документов", "Консультация по требованиям банка", "Организация оценки недвижимости", "Сопровождение оформления"]),
    },
  },
  "daxili-kredit": {
    en: {
      title: "Internal instalment plans",
      shortDescription: "Developer or company instalment options for selected properties.",
      description: "Internal staged-payment options are available for selected properties. They allow the buyer to spread payments over an agreed schedule.\n\nTerms are set individually for each property. Contact us to learn the exact down payment, schedule and contractual conditions.",
      bullets: JSON.stringify(["Individual payment schedule", "Down-payment options", "Clear agreed terms", "Formal written agreement"]),
    },
    ru: {
      title: "Внутренняя рассрочка",
      shortDescription: "Варианты поэтапной оплаты для отдельных объектов.",
      description: "Для отдельных объектов доступны внутренние варианты поэтапной оплаты. Они позволяют покупателю вносить платежи по согласованному графику.\n\nУсловия определяются индивидуально для каждого объекта. Свяжитесь с нами, чтобы уточнить первоначальный взнос, график и договорные условия.",
      bullets: JSON.stringify(["Индивидуальный график платежей", "Варианты первоначального взноса", "Прозрачные согласованные условия", "Оформление письменным договором"]),
    },
  },
  "temir-tikinti": {
    en: {
      title: "Renovation and construction",
      shortDescription: "Organisation of property renovation and construction work.",
      description: "We organise renovation and construction work for newly purchased or existing property, from cosmetic improvements to full reconstruction and interior design projects.\n\nBefore work begins, an estimate is prepared and the stages and delivery schedule are agreed.",
      bullets: JSON.stringify(["Cosmetic and major renovation", "Interior design and planning", "Estimate and work schedule", "Material-selection support", "Phased handover"]),
    },
    ru: {
      title: "Ремонт и строительство",
      shortDescription: "Организация ремонтных и строительных работ.",
      description: "Мы организуем ремонт и строительные работы в приобретённой или существующей недвижимости — от косметического ремонта до полной реконструкции и интерьерного дизайна.\n\nДо начала работ составляется смета, согласовываются этапы и сроки.",
      bullets: JSON.stringify(["Косметический и капитальный ремонт", "Дизайн интерьера и планирование", "Смета и график работ", "Помощь в выборе материалов", "Поэтапная сдача работ"]),
    },
  },
  reklam: {
    en: {
      title: "Property marketing",
      shortDescription: "Promotion and advertising services for property.",
      description: "We help present your property to a wider, relevant audience. The service can include preparing the listing, publishing it on social and digital platforms and setting up targeted advertising campaigns.\n\nThe goal is to present the property to the right audience in the right format.",
      bullets: JSON.stringify(["Professional listing copy", "Social-media promotion", "Targeted digital advertising", "Publication on Luxe Home Estate", "Results reporting"]),
    },
    ru: {
      title: "Реклама недвижимости",
      shortDescription: "Продвижение и рекламные услуги для недвижимости.",
      description: "Мы помогаем представить объект более широкой и релевантной аудитории. Услуга может включать подготовку объявления, размещение в социальных сетях и на цифровых площадках, а также настройку таргетированной рекламы.\n\nЦель — показать недвижимость подходящей аудитории в правильном формате.",
      bullets: JSON.stringify(["Профессиональный текст объявления", "Продвижение в социальных сетях", "Таргетированная цифровая реклама", "Размещение на Luxe Home Estate", "Отчёт о результатах"]),
    },
  },
  cekilis: {
    en: {
      title: "Photo and video production",
      shortDescription: "Professional property photography and video services.",
      description: "Strong visual material can materially improve how a property is presented. We provide professional photo and video production, drone footage and 360-degree panoramic content.\n\nEach shoot is planned to show the property's strongest features clearly and accurately.",
      bullets: JSON.stringify(["Professional interior and exterior photography", "Video presentation", "Drone footage", "Professional image processing", "Social-media formats"]),
    },
    ru: {
      title: "Фото- и видеосъёмка",
      shortDescription: "Профессиональная фото- и видеосъёмка недвижимости.",
      description: "Качественные визуальные материалы заметно влияют на презентацию недвижимости. Мы выполняем профессиональную фото- и видеосъёмку, съёмку с дрона и создаём панорамы 360°.\n\nКаждая съёмка планируется так, чтобы точно и выразительно показать сильные стороны объекта.",
      bullets: JSON.stringify(["Профессиональная съёмка интерьера и экстерьера", "Презентационные видеоролики", "Аэросъёмка с дрона", "Профессиональная обработка фотографий", "Форматы для социальных сетей"]),
    },
  },
  qiymetlendirme: {
    en: { title: "Property valuation", shortDescription: "Professional assessment of a property's market value.", description: "Professional assessment of a property's market value, providing clients with a clear price analysis for sale, rental and investment decisions." },
    ru: { title: "Оценка недвижимости", shortDescription: "Профессиональное определение рыночной стоимости недвижимости.", description: "Профессиональная оценка рыночной стоимости недвижимости с понятным ценовым анализом для продажи, аренды и инвестиционных решений." },
  },
  konsultasiya: {
    en: { title: "Consulting", shortDescription: "Personal guidance on transactions, legal questions and property-market trends.", description: "Individual advice on property transactions, legal questions and market trends, helping clients make well-informed decisions with expert support." },
    ru: { title: "Консультация", shortDescription: "Индивидуальные консультации по сделкам, юридическим вопросам и тенденциям рынка.", description: "Индивидуальные консультации по сделкам с недвижимостью, юридическим вопросам и тенденциям рынка, помогающие принимать обоснованные решения при поддержке эксперта." },
  },
  "a-frame-evler-xidmeti": {
    en: { title: "A-frame houses", shortDescription: "A complete service for the design, construction and sale of A-frame houses.", description: "A complete service for designing, building and selling A-frame houses, with a focus on modern design, energy efficiency and comfortable living standards." },
    ru: { title: "A-frame дома", shortDescription: "Полный комплекс услуг по проектированию, строительству и продаже A-frame домов.", description: "Полный комплекс услуг по проектированию, строительству и продаже A-frame домов с современным дизайном, энергоэффективностью и комфортными условиями проживания." },
  },
  "havalandirma-sistemi": {
    en: { title: "Ventilation systems", shortDescription: "Professional installation and maintenance of ventilation systems for homes and offices.", description: "Professional installation and maintenance of ventilation systems for residential and office spaces, supporting clean air, comfortable temperatures and energy efficiency." },
    ru: { title: "Системы вентиляции", shortDescription: "Профессиональный монтаж и обслуживание вентиляции для жилых и офисных помещений.", description: "Профессиональный монтаж и техническое обслуживание вентиляционных систем для жилых и офисных помещений, обеспечивающих чистый воздух, комфортную температуру и энергоэффективность." },
  },
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

const CATALOGS = {
  propertyType: PROPERTY_TYPES,
  feature: FEATURES,
  service: SERVICES,
  property: PROPERTIES,
} as const;

export function localizeKnownContent<T extends { slug: string }>(
  kind: keyof typeof CATALOGS,
  value: T,
  locale: Locale,
): T {
  if (locale === "az") return value;
  const translated = CATALOGS[kind][value.slug]?.[locale];
  if (!translated) return value;

  if (kind === "property" || kind === "service") {
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
