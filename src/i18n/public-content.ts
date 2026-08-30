import type { Locale } from "@/lib/constants";

export type FaqGroup = {
  title: string;
  items: { question: string; answer: string }[];
};

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: { label?: string; text: string }[];
};

export type LegalDocument = {
  title: string;
  metaDescription: string;
  description: string;
  updatedAt: string;
  introduction: string;
  sections: LegalSection[];
};

type CompanyFacts = {
  name: string;
  legalName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
};

const REAL_ESTATE_FAQ_CONTENT: Record<Locale, FaqGroup[]> = {
  az: [
    {
      title: "Alqı-satqı",
      items: [
        {
          question: "Əmlakı almaq üçün hansı sənədlər tələb olunur?",
          answer: "Alıcıdan şəxsiyyət vəsiqəsi, satıcıdan isə mülkiyyət sənədi (kupça/çıxarış) və ərizə tələb olunur. Əmlak nikah dövründə alınıbsa, ər-arvadın notarial razılığı da lazımdır. Sənədləşmə Əmlak Məsələləri Dövlət Xidmətinin filiallarında aparılır.",
        },
        {
          question: "Kupça ilə müqavilə arasındakı fərq nədir?",
          answer: "Kupça (çıxarış) dövlət reyestrindən verilən mülkiyyət sənədidir və tam hüquq verir. Müqavilə isə adətən yeni tikilidə tikinti şirkəti ilə bağlanan sənəddir; mülkiyyət hüququ çıxarış alındıqdan sonra rəsmiləşir. Qiymət fərqi məhz bu səbəbdəndir.",
        },
        {
          question: "Beh nə qədər olur və geri qaytarılırmı?",
          answer: "Beh adətən əmlakın dəyərinin 5–10 %-i həcmində olur və beh müqaviləsi ilə rəsmiləşdirilir. Alıcı imtina edərsə beh qalır, satıcı imtina edərsə adətən ikiqat qaytarılır — şərtlər müqavilədə dəqiq yazılmalıdır.",
        },
      ],
    },
    {
      title: "İpoteka və kredit",
      items: [
        {
          question: "İpoteka üçün hansı şərtlər var?",
          answer: "İpoteka Fondunun sosial və adi ipoteka məhsulları mövcuddur. Ümumi tələblər: rəsmi gəlir, ilkin ödəniş (adətən 15–20 %), əmlakın çıxarışının olması və bankın qiymətləndirməsindən keçməsi. Yeni tikilidə müqavilə ilə satılan mənzillər çox vaxt ipotekaya uyğun gəlmir.",
        },
        {
          question: "«Hazır ipoteka» nə deməkdir?",
          answer: "Satıcı bankla razılaşmanı əvvəlcədən tamamlayıb: əmlak qiymətləndirilib, sənədlər yoxlanılıb və ipoteka üçün təsdiqlənib. Alıcı üçün bu, prosesin bir neçə həftə qısalması deməkdir.",
        },
        {
          question: "Barter mümkündürmü?",
          answer: "Bəli. Bazarda mənzilin mənzilə, torpağa və ya avtomobilə dəyişdirilməsi geniş yayılıb. Filtrdə «Barter» seçimini işarələməklə yalnız belə elanları görə bilərsiniz.",
        },
      ],
    },
    {
      title: "Kirayə",
      items: [
        {
          question: "Aylıq və günlük kirayə arasında fərq nədir?",
          answer: "Aylıq kirayə uzunmüddətli yaşayış üçündür və adətən bir aylıq depozit tələb olunur. Günlük kirayə qısa səfərlər üçündür, qiymət gündəlik göstərilir və əşyalı təhvil verilir. Saytda hər iki kateqoriya ayrıca filtrlənir.",
        },
        {
          question: "Kirayə müqaviləsi bağlamaq lazımdırmı?",
          answer: "Bəli. Yazılı müqavilə həm kirayəçini, həm ev sahibini qoruyur: müddət, ödəniş tarixi, depozit və kommunal xərclərin kimin üzərinə düşdüyü orada göstərilir.",
        },
      ],
    },
    {
      title: "Sayt və xidmətlər",
      items: [
        {
          question: "Elan yerləşdirmək üçün nə etməliyəm?",
          answer: "Mülk sahibi və ya agentlik kimi qeydiyyatdan keçin, kabinetdən «Yeni elan» bölməsini açın və məlumatları doldurun. Elanlar dərc edilməzdən əvvəl yoxlanılır; təsdiqlənmiş agentliklərin elanları dərhal saytda görünür.",
        },
        {
          question: "Elanın yoxlanılması nə qədər çəkir?",
          answer: "Adətən iş günü ərzində. Şəkillərin keyfiyyəti, ünvanın dəqiqliyi və qiymətin real olması yoxlanılır — bu, saytdakı elanların etibarlılığını qorumaq üçündür.",
        },
        {
          question: "Xidmət haqqı nə qədərdir?",
          answer: "Komissiya əməliyyatın növündən asılıdır və hər müştəri ilə əvvəlcədən razılaşdırılır. Dəqiq şərtlər üçün bizimlə əlaqə saxlayın.",
        },
      ],
    },
  ],
  en: [
    {
      title: "Buying and selling",
      items: [
        {
          question: "Which documents are required to buy a property?",
          answer: "The buyer must provide an identity document, while the seller must provide the title deed (extract from the state register) and an application. If the property was acquired during marriage, the spouse's notarised consent is also required. Registration is completed through the branches of the State Service on Property Issues.",
        },
        {
          question: "What is the difference between a title deed and a contract?",
          answer: "A title deed is issued by the state register and confirms full ownership. A contract is usually signed with a developer for a unit in a new building; ownership is formalised only after the title deed is issued. This distinction often explains the price difference.",
        },
        {
          question: "How much is the deposit, and is it refundable?",
          answer: "The deposit is usually 5–10% of the property value and should be documented in a deposit agreement. If the buyer withdraws, the deposit is normally retained; if the seller withdraws, it is usually repaid at twice the amount. The exact terms must be written in the agreement.",
        },
      ],
    },
    {
      title: "Mortgage and finance",
      items: [
        {
          question: "What are the mortgage requirements?",
          answer: "The Mortgage and Credit Guarantee Fund offers social and standard mortgage products. General requirements include documented income, a down payment (usually 15–20%), a title deed for the property and a bank valuation. Units sold only under a developer contract often do not qualify.",
        },
        {
          question: "What does “mortgage-ready” mean?",
          answer: "The seller has already completed the preliminary process with the bank: the property has been valued, the documents checked and the property approved for a mortgage. This can shorten the buyer's process by several weeks.",
        },
        {
          question: "Is a property exchange possible?",
          answer: "Yes. Exchanges of an apartment for another apartment, land or a vehicle are common in the market. Select the “Exchange” filter to see only listings where this option is available.",
        },
      ],
    },
    {
      title: "Rentals",
      items: [
        {
          question: "What is the difference between monthly and daily rent?",
          answer: "Monthly rent is intended for longer stays and normally requires a one-month deposit. Daily rent is designed for short visits, is priced per day and is usually offered furnished. The two categories can be filtered separately on the site.",
        },
        {
          question: "Do I need a rental agreement?",
          answer: "Yes. A written agreement protects both tenant and landlord by recording the term, payment date, deposit and responsibility for utilities.",
        },
      ],
    },
    {
      title: "Website and services",
      items: [
        {
          question: "How can I publish a listing?",
          answer: "Register as an owner or agency, open “New listing” in your account and complete the property details. Listings are reviewed before publication; listings from verified agencies appear immediately after approval.",
        },
        {
          question: "How long does listing review take?",
          answer: "Usually within one business day. We check image quality, address accuracy and whether the price is realistic to help keep listings reliable.",
        },
        {
          question: "How much is the service fee?",
          answer: "The commission depends on the type of transaction and is agreed with each client in advance. Contact us for exact terms.",
        },
      ],
    },
  ],
  ru: [
    {
      title: "Покупка и продажа",
      items: [
        {
          question: "Какие документы нужны для покупки недвижимости?",
          answer: "Покупатель предоставляет удостоверение личности, а продавец — документ о праве собственности (выписку из государственного реестра) и заявление. Если недвижимость приобретена в браке, также требуется нотариальное согласие супруга. Оформление проводится в филиалах Государственной службы по имущественным вопросам.",
        },
        {
          question: "Чем выписка о собственности отличается от договора?",
          answer: "Выписка выдаётся государственным реестром и подтверждает полное право собственности. Договор обычно заключается с застройщиком на квартиру в новостройке; право собственности оформляется после получения выписки. Этим часто объясняется разница в цене.",
        },
        {
          question: "Каков размер задатка и возвращается ли он?",
          answer: "Задаток обычно составляет 5–10% стоимости недвижимости и оформляется отдельным соглашением. Если покупатель отказывается от сделки, задаток, как правило, остаётся у продавца; если отказывается продавец, сумма обычно возвращается в двойном размере. Точные условия необходимо указать в договоре.",
        },
      ],
    },
    {
      title: "Ипотека и кредит",
      items: [
        {
          question: "Каковы условия ипотеки?",
          answer: "Ипотечный и кредитно-гарантийный фонд предлагает социальные и стандартные ипотечные продукты. Общие требования: подтверждённый доход, первоначальный взнос (обычно 15–20%), наличие выписки на объект и банковская оценка. Квартиры в новостройках, продаваемые только по договору с застройщиком, часто не подходят для ипотеки.",
        },
        {
          question: "Что означает «готовая ипотека»?",
          answer: "Продавец заранее прошёл предварительные процедуры с банком: объект оценён, документы проверены, а недвижимость одобрена для ипотеки. Для покупателя это может сократить процесс на несколько недель.",
        },
        {
          question: "Возможен ли обмен недвижимости?",
          answer: "Да. На рынке распространён обмен квартиры на квартиру, земельный участок или автомобиль. Выберите фильтр «Обмен», чтобы увидеть только такие объявления.",
        },
      ],
    },
    {
      title: "Аренда",
      items: [
        {
          question: "Чем помесячная аренда отличается от посуточной?",
          answer: "Помесячная аренда рассчитана на длительное проживание и обычно требует депозит за один месяц. Посуточная аренда подходит для коротких поездок, оплачивается за сутки и, как правило, предлагается с мебелью. Обе категории можно фильтровать отдельно.",
        },
        {
          question: "Нужно ли заключать договор аренды?",
          answer: "Да. Письменный договор защищает и арендатора, и владельца: в нём указываются срок, дата оплаты, депозит и ответственность за коммунальные расходы.",
        },
      ],
    },
    {
      title: "Сайт и услуги",
      items: [
        {
          question: "Как разместить объявление?",
          answer: "Зарегистрируйтесь как собственник или агентство, откройте раздел «Новое объявление» в кабинете и заполните данные. Объявления проверяются до публикации; объявления подтверждённых агентств появляются на сайте сразу после одобрения.",
        },
        {
          question: "Сколько длится проверка объявления?",
          answer: "Обычно в течение одного рабочего дня. Мы проверяем качество фотографий, точность адреса и реалистичность цены, чтобы поддерживать надёжность объявлений.",
        },
        {
          question: "Каков размер комиссии?",
          answer: "Комиссия зависит от вида сделки и заранее согласовывается с каждым клиентом. Свяжитесь с нами, чтобы узнать точные условия.",
        },
      ],
    },
  ],
};

export const FAQ_PAGE: Record<Locale, {
  title: string;
  metaDescription: string;
  eyebrow: string;
  description: string;
  breadcrumb: string;
  noAnswer: string;
  contactForm: string;
  whatsappMessage: string;
}> = {
  az: {
    title: "Tez-tez verilən suallar",
    metaDescription: "Alqı-satqı, ipoteka, kirayə və elan yerləşdirmə barədə ən çox soruşulan suallar və cavabları.",
    eyebrow: "Kömək mərkəzi",
    description: "Daşınmaz əmlak əməliyyatlarında ən çox soruşulan sualların qısa cavabları.",
    breadcrumb: "Suallar",
    noAnswer: "Cavabını tapmadınız? Bizimlə birbaşa əlaqə saxlayın.",
    contactForm: "Əlaqə forması",
    whatsappMessage: "Salam, saytdakı suallar bölməsindən yazıram.",
  },
  en: {
    title: "Frequently asked questions",
    metaDescription: "Answers to common questions about buying, selling, mortgages, rentals and publishing property listings in Azerbaijan.",
    eyebrow: "Help centre",
    description: "Clear answers to the questions we hear most often about property transactions.",
    breadcrumb: "FAQ",
    noAnswer: "Could not find your answer? Contact our team directly.",
    contactForm: "Contact form",
    whatsappMessage: "Hello, I am writing from the FAQ section of your website.",
  },
  ru: {
    title: "Часто задаваемые вопросы",
    metaDescription: "Ответы на частые вопросы о покупке, продаже, ипотеке, аренде и размещении объявлений о недвижимости в Азербайджане.",
    eyebrow: "Центр помощи",
    description: "Краткие ответы на самые частые вопросы о сделках с недвижимостью.",
    breadcrumb: "Вопросы",
    noAnswer: "Не нашли ответ? Свяжитесь с нашей командой напрямую.",
    contactForm: "Форма связи",
    whatsappMessage: "Здравствуйте, я пишу из раздела вопросов на вашем сайте.",
  },
};

export function getRealEstateFaqContent(locale: Locale) {
  return REAL_ESTATE_FAQ_CONTENT[locale];
}

export function getLegalDocuments(locale: Locale, facts: CompanyFacts): Record<"privacy" | "terms" | "cookies", LegalDocument> {
  const documents: Record<Locale, Record<"privacy" | "terms" | "cookies", LegalDocument>> = {
    az: {
      privacy: {
        title: "Məxfilik siyasəti",
        metaDescription: "Luxe Home Estate saytında şəxsi məlumatların toplanması, istifadəsi və qorunması qaydaları.",
        description: "Şəxsi məlumatlarınızı necə topladığımız, istifadə etdiyimiz və qoruduğumuz barədə.",
        updatedAt: "20 avqust 2026",
        introduction: `Bu siyasət ${facts.legalName} (${facts.ownerName}) tərəfindən idarə olunan ${facts.name} saytına aiddir. Saytdan istifadə etməklə burada təsvir olunan qaydalarla razılaşmış olursunuz.`,
        sections: [
          { heading: "Hansı məlumatları toplayırıq", bullets: [
            { label: "Müraciət formaları:", text: "ad, telefon nömrəsi, e-poçt ünvanı (könüllü), mövzu və mesaj mətni." },
            { label: "Texniki məlumatlar:", text: "IP ünvanı, brauzer növü, cihaz tipi və səhifəyə giriş vaxtı — təhlükəsizlik və sui-istifadənin qarşısının alınması üçün." },
            { label: "Brauzer yaddaşı:", text: "favorit elanların siyahısı və tema seçimi yalnız sizin cihazınızda (localStorage) saxlanılır, serverə göndərilmir." },
          ] },
          { heading: "Məlumatlardan necə istifadə edirik", bullets: [
            { text: "Müraciətinizə cavab vermək və əmlak seçimi üzrə xidmət göstərmək." },
            { text: "Saytın texniki işini təmin etmək və təhlükəsizliyini qorumaq." },
            { text: "Qanunvericiliyin tələb etdiyi hallarda uçot aparmaq." },
          ], paragraphs: ["Məlumatlarınız reklam məqsədilə üçüncü tərəflərə satılmır və ötürülmür."] },
          { heading: "Məlumatların saxlanması", paragraphs: ["Sayt və verilənlər bazası Cloudflare infrastrukturunda yerləşir. Müraciət qeydləri xidmətin göstərilməsi üçün zəruri müddət ərzində, ən çoxu 3 il saxlanılır və sonra silinir. E-poçt bildirişləri Resend xidməti vasitəsilə göndərilir."] },
          { heading: "Hüquqlarınız", bullets: [
            { text: "Sizin haqqınızda saxlanılan məlumatları öyrənmək." },
            { text: "Yanlış məlumatın düzəldilməsini tələb etmək." },
            { text: "Məlumatlarınızın silinməsini tələb etmək." },
          ], paragraphs: [`Bu hüquqlardan istifadə üçün ${facts.email} ünvanına və ya ${facts.phone} nömrəsinə müraciət edin.`] },
          { heading: "Dəyişikliklər", paragraphs: ["Siyasətdə dəyişiklik edilərsə, yenilənmiş mətn bu səhifədə dərc olunur və yuxarıdakı tarix yenilənir."] },
        ],
      },
      terms: {
        title: "İstifadə şərtləri",
        metaDescription: "Luxe Home Estate saytından istifadə qaydaları, məsuliyyət hüdudları və müəllif hüquqları.",
        description: "Saytdan istifadə edərkən qüvvədə olan qaydalar.",
        updatedAt: "20 avqust 2026",
        introduction: `${facts.name} saytı ${facts.legalName} (${facts.ownerName}) tərəfindən idarə olunur. Saytı ziyarət etməklə aşağıdakı şərtləri qəbul edirsiniz.`,
        sections: [
          { heading: "Elanların statusu", paragraphs: ["Saytda yerləşdirilən əmlak elanları, qiymətlər və texniki göstəricilər məlumat xarakteri daşıyır və ictimai oferta sayılmır. Qiymət və mövcudluq xəbərdarlıq olmadan dəyişə bilər. Müqavilə bağlanmazdan əvvəl bütün məlumatlar şirkətlə birbaşa dəqiqləşdirilməlidir."] },
          { heading: "İstifadəçinin öhdəlikləri", bullets: [
            { text: "Müraciət formalarında doğru və özünüzə aid əlaqə məlumatı göstərmək." },
            { text: "Saytın işini pozan avtomatlaşdırılmış vasitələrdən istifadə etməmək." },
            { text: "Məzmunu icazəsiz kopyalayıb kommersiya məqsədilə yaymamaq." },
          ] },
          { heading: "Müəllif hüquqları", paragraphs: [`Saytın dizaynı, mətnləri, fotoşəkilləri, loqotipi və «Luxe Home Estate» brendi ${facts.ownerName}-na məxsusdur. Yazılı icazə olmadan istifadə qadağandır.`] },
          { heading: "Məsuliyyət hüdudu", paragraphs: ["Şirkət saytdakı məlumatların dolğunluğuna görə maksimum səy göstərsə də, texniki səhvlərdən və ya üçüncü tərəf mənbələrindən qaynaqlanan qeyri-dəqiqliyə görə məsuliyyət daşımır. Xarici saytlara olan linklərin məzmunu şirkətin nəzarətində deyil."] },
          { heading: "Əlaqə", paragraphs: [`Suallar üçün: ${facts.email}, ${facts.phone}, ${facts.address}.`] },
        ],
      },
      cookies: {
        title: "Cookie siyasəti",
        metaDescription: "Luxe Home Estate saytında istifadə olunan cookie və brauzer yaddaşı texnologiyaları.",
        description: "Saytda hansı cookie-lərin işlədiyi və onları necə idarə edə biləcəyiniz.",
        updatedAt: "20 avqust 2026",
        introduction: `Cookie — saytın brauzerinizdə saxladığı kiçik mətn faylıdır. ${facts.name} yalnız saytın işləməsi üçün zəruri olan minimal dəsti istifadə edir.`,
        sections: [
          { heading: "İstifadə olunan növlər", bullets: [
            { label: "Zəruri:", text: "təhlükəsizlik, sorğu balanslaşdırılması və sui-istifadənin qarşısının alınması üçün Cloudflare tərəfindən qoyulan texniki cookie-lər." },
            { label: "Seçim yaddaşı (localStorage):", text: "tema (işıqlı/tünd) və favorit elanların siyahısı. Bu məlumat yalnız sizin cihazınızda qalır, serverə göndərilmir." },
          ], paragraphs: ["Production mühitində Google Analytics və ya Google Tag Manager identifikatoru konfiqurasiya edildikdə analitika yalnız açıq razılığınızdan sonra aktivləşir. Razılıq verilməyənədək analitika skripti yüklənmir və event göndərilmir. Göndərilən eventlər telefon, e-poçt, ad, ünvan və müraciət mətni daşımır."] },
          { heading: "İdarə etmək", paragraphs: ["Cookie-ləri brauzerinizin parametrlərindən silə və ya bloklaya bilərsiniz. Zəruri cookie-lər bloklanarsa saytın bəzi hissələri düzgün işləməyə bilər. Brauzer yaddaşındakı favoritləri «Favoritlər» səhifəsindəki «Siyahını təmizlə» düyməsi ilə silmək mümkündür. Analitika seçimi analytics_consent cookie-sində bir il saxlanılır; cookie-ni silməklə seçim ekranını yenidən aça bilərsiniz."] },
          { heading: "Əlaqə", paragraphs: [`Suallarınız üçün: ${facts.email}.`] },
        ],
      },
    },
    en: {
      privacy: {
        title: "Privacy policy",
        metaDescription: "How Luxe Home Estate collects, uses, stores and protects personal information submitted through the website.",
        description: "How we collect, use and protect your personal information.",
        updatedAt: "20 August 2026",
        introduction: `This policy applies to the ${facts.name} website, operated by ${facts.legalName} (${facts.ownerName}). By using the website, you agree to the practices described here.`,
        sections: [
          { heading: "Information we collect", bullets: [
            { label: "Enquiry forms:", text: "name, phone number, email address (optional), subject and message." },
            { label: "Technical data:", text: "IP address, browser type, device type and access time for security and abuse prevention." },
            { label: "Browser storage:", text: "your favourites and theme preference are stored only on your device in localStorage and are not sent to the server." },
          ] },
          { heading: "How we use information", bullets: [
            { text: "To respond to your enquiry and provide property selection services." },
            { text: "To operate the website and protect its security." },
            { text: "To keep records where required by law." },
          ], paragraphs: ["We do not sell or transfer your information to third parties for advertising purposes."] },
          { heading: "Data retention", paragraphs: ["The website and database are hosted on Cloudflare infrastructure. Enquiry records are retained only as long as needed to provide the service, for no more than three years, and are then deleted. Email notifications are delivered through Resend."] },
          { heading: "Your rights", bullets: [
            { text: "Ask what information we hold about you." },
            { text: "Request correction of inaccurate information." },
            { text: "Request deletion of your information." },
          ], paragraphs: [`To exercise these rights, contact ${facts.email} or call ${facts.phone}.`] },
          { heading: "Changes to this policy", paragraphs: ["If this policy changes, the revised text will be published on this page and the date above will be updated."] },
        ],
      },
      terms: {
        title: "Terms of use",
        metaDescription: "Rules for using the Luxe Home Estate website, including listing status, liability and intellectual property.",
        description: "The terms that apply when you use this website.",
        updatedAt: "20 August 2026",
        introduction: `The ${facts.name} website is operated by ${facts.legalName} (${facts.ownerName}). By visiting the website, you accept the following terms.`,
        sections: [
          { heading: "Status of listings", paragraphs: ["Property listings, prices and technical details on the website are provided for information and do not constitute a public offer. Prices and availability may change without notice. All information must be confirmed directly with the company before an agreement is signed."] },
          { heading: "User responsibilities", bullets: [
            { text: "Provide accurate contact details that belong to you when submitting forms." },
            { text: "Do not use automated tools that disrupt the website." },
            { text: "Do not copy or distribute content commercially without permission." },
          ] },
          { heading: "Intellectual property", paragraphs: [`The website design, texts, photographs, logo and the “Luxe Home Estate” brand belong to ${facts.ownerName}. Use without written permission is prohibited.`] },
          { heading: "Limitation of liability", paragraphs: ["Although the company makes every reasonable effort to keep information complete, it is not liable for inaccuracies caused by technical errors or third-party sources. The company does not control the content of external websites linked from this site."] },
          { heading: "Contact", paragraphs: [`Questions: ${facts.email}, ${facts.phone}, ${facts.address}.`] },
        ],
      },
      cookies: {
        title: "Cookie policy",
        metaDescription: "Cookies and browser-storage technologies used by the Luxe Home Estate website and how you can manage them.",
        description: "Which cookies the website uses and how you can manage them.",
        updatedAt: "20 August 2026",
        introduction: `A cookie is a small text file stored by a website in your browser. ${facts.name} uses only the minimum set required to operate the website.`,
        sections: [
          { heading: "Technologies we use", bullets: [
            { label: "Essential cookies:", text: "technical cookies set by Cloudflare for security, request balancing and abuse prevention." },
            { label: "Preference storage (localStorage):", text: "your light or dark theme and favourites list. This information remains on your device and is not sent to the server." },
          ], paragraphs: ["If a Google Analytics or Google Tag Manager identifier is configured in production, analytics is activated only after your explicit consent. No analytics script is loaded and no event is sent before consent. Events do not include phone numbers, email addresses, names, addresses or enquiry text."] },
          { heading: "Managing your choices", paragraphs: ["You can delete or block cookies in your browser settings. Blocking essential cookies may prevent parts of the website from working correctly. You can delete stored favourites using “Clear list” on the Favourites page. Your analytics choice is stored in the analytics_consent cookie for one year; delete that cookie to reopen the consent choice."] },
          { heading: "Contact", paragraphs: [`Questions: ${facts.email}.`] },
        ],
      },
    },
    ru: {
      privacy: {
        title: "Политика конфиденциальности",
        metaDescription: "Как Luxe Home Estate собирает, использует, хранит и защищает персональные данные, отправленные через сайт.",
        description: "Как мы собираем, используем и защищаем ваши персональные данные.",
        updatedAt: "20 августа 2026 года",
        introduction: `Настоящая политика применяется к сайту ${facts.name}, которым управляет ${facts.legalName} (${facts.ownerName}). Используя сайт, вы соглашаетесь с описанными здесь правилами.`,
        sections: [
          { heading: "Какие данные мы собираем", bullets: [
            { label: "Формы обращения:", text: "имя, номер телефона, адрес электронной почты (необязательно), тема и текст сообщения." },
            { label: "Технические данные:", text: "IP-адрес, тип браузера и устройства, а также время посещения — для безопасности и предотвращения злоупотреблений." },
            { label: "Хранилище браузера:", text: "список избранного и выбор темы хранятся только на вашем устройстве в localStorage и не отправляются на сервер." },
          ] },
          { heading: "Как мы используем данные", bullets: [
            { text: "Чтобы ответить на обращение и помочь с подбором недвижимости." },
            { text: "Чтобы обеспечить работу и безопасность сайта." },
            { text: "Чтобы вести учёт в случаях, предусмотренных законом." },
          ], paragraphs: ["Мы не продаём и не передаём ваши данные третьим лицам в рекламных целях."] },
          { heading: "Хранение данных", paragraphs: ["Сайт и база данных размещены в инфраструктуре Cloudflare. Обращения хранятся только в течение срока, необходимого для оказания услуги, но не более трёх лет, после чего удаляются. Уведомления по электронной почте отправляются через Resend."] },
          { heading: "Ваши права", bullets: [
            { text: "Узнать, какие данные о вас хранятся." },
            { text: "Потребовать исправить неверные данные." },
            { text: "Потребовать удалить ваши данные." },
          ], paragraphs: [`Чтобы воспользоваться этими правами, напишите на ${facts.email} или позвоните по номеру ${facts.phone}.`] },
          { heading: "Изменения политики", paragraphs: ["Если политика изменится, обновлённый текст будет опубликован на этой странице, а дата выше будет изменена."] },
        ],
      },
      terms: {
        title: "Условия использования",
        metaDescription: "Правила использования сайта Luxe Home Estate, статус объявлений, ограничение ответственности и авторские права.",
        description: "Правила, действующие при использовании сайта.",
        updatedAt: "20 августа 2026 года",
        introduction: `Сайтом ${facts.name} управляет ${facts.legalName} (${facts.ownerName}). Посещая сайт, вы принимаете следующие условия.`,
        sections: [
          { heading: "Статус объявлений", paragraphs: ["Объявления, цены и технические характеристики на сайте носят информационный характер и не являются публичной офертой. Цена и наличие могут измениться без уведомления. До заключения договора все сведения необходимо подтвердить непосредственно у компании."] },
          { heading: "Обязанности пользователя", bullets: [
            { text: "Указывать в формах достоверные контактные данные, принадлежащие вам." },
            { text: "Не использовать автоматизированные средства, нарушающие работу сайта." },
            { text: "Не копировать и не распространять контент в коммерческих целях без разрешения." },
          ] },
          { heading: "Авторские права", paragraphs: [`Дизайн сайта, тексты, фотографии, логотип и бренд «Luxe Home Estate» принадлежат ${facts.ownerName}. Использование без письменного разрешения запрещено.`] },
          { heading: "Ограничение ответственности", paragraphs: ["Компания прилагает все разумные усилия для полноты информации, однако не отвечает за неточности, вызванные техническими ошибками или данными сторонних источников. Компания не контролирует содержание внешних сайтов, ссылки на которые размещены здесь."] },
          { heading: "Контакты", paragraphs: [`Вопросы: ${facts.email}, ${facts.phone}, ${facts.address}.`] },
        ],
      },
      cookies: {
        title: "Политика cookie",
        metaDescription: "Cookie и технологии хранения данных в браузере, используемые сайтом Luxe Home Estate, и способы управления ими.",
        description: "Какие cookie использует сайт и как ими управлять.",
        updatedAt: "20 августа 2026 года",
        introduction: `Cookie — это небольшой текстовый файл, который сайт сохраняет в браузере. ${facts.name} использует только минимальный набор, необходимый для работы сайта.`,
        sections: [
          { heading: "Используемые технологии", bullets: [
            { label: "Необходимые cookie:", text: "технические cookie Cloudflare для безопасности, балансировки запросов и предотвращения злоупотреблений." },
            { label: "Хранилище настроек (localStorage):", text: "светлая или тёмная тема и список избранного. Эти данные остаются на вашем устройстве и не отправляются на сервер." },
          ], paragraphs: ["Если в production настроен идентификатор Google Analytics или Google Tag Manager, аналитика активируется только после вашего явного согласия. До согласия скрипт аналитики не загружается и события не отправляются. События не содержат номер телефона, электронную почту, имя, адрес или текст обращения."] },
          { heading: "Управление настройками", paragraphs: ["Вы можете удалить или заблокировать cookie в настройках браузера. При блокировке необходимых cookie некоторые части сайта могут работать неправильно. Избранное можно удалить кнопкой «Очистить список» на странице «Избранное». Выбор аналитики хранится в cookie analytics_consent один год; удалите этот cookie, чтобы снова открыть окно выбора."] },
          { heading: "Контакты", paragraphs: [`Вопросы: ${facts.email}.`] },
        ],
      },
    },
  };

  return documents[locale];
}
