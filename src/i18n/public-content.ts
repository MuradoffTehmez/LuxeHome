import type { Locale } from "@/lib/constants";

export type FaqGroup = {
  title: string;
  items: { question: string; answer: string }[];
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
