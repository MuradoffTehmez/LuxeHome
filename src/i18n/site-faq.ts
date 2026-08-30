import type { Locale } from "@/lib/constants";
import type { FaqGroup } from "@/i18n/public-content";

type Item = { question: string; answer: string };

const TITLES: Record<Locale, string[]> = {
  az: ["Hesab və giriş", "Elanlar və moderasiya", "Axtarış və şəxsi seçimlər", "Xidmət, əlaqə və təhlükəsizlik"],
  en: ["Account and sign-in", "Listings and moderation", "Search and personal tools", "Service, contact and security"],
  ru: ["Аккаунт и вход", "Объявления и модерация", "Поиск и личные инструменты", "Сервис, связь и безопасность"],
};

const ITEMS: Record<Locale, Item[]> = {
  az: [
    { question: "Saytda hesab yaratmaq məcburidirmi?", answer: "Xeyr. Elanlara baxmaq, axtarış və filtrdən istifadə etmək hesabsız mümkündür. Elan vermək, saxlanmış axtarış və bildirişlər üçün hesab lazımdır." },
    { question: "Hansı hesab növləri mövcuddur?", answer: "Adi istifadəçi, mülk sahibi və agentlik hesabı mövcuddur. Hesab növü kabinetdə görünən imkanları müəyyən edir." },
    { question: "E-poçtumu niyə təsdiqləməliyəm?", answer: "Təsdiq hesabın sizə məxsus olduğunu yoxlayır, parol bərpasını və vacib bildirişlərin etibarlı çatdırılmasını təmin edir." },
    { question: "Parolumu unutmuşamsa nə etməliyəm?", answer: "Giriş səhifəsində “Parolu unutdum” keçidindən istifadə edin. Birdəfəlik yeniləmə linki qeydiyyat e-poçtunuza göndəriləcək." },
    { question: "Hesab məlumatlarımı ixrac və ya silə bilərəm?", answer: "Bəli. Profil bölməsindən məlumat ixracı tələb edə və parol təsdiqi ilə hesabınızı silə bilərsiniz." },
    { question: "Elanı necə yerləşdirim?", answer: "Mülk sahibi və ya agentlik hesabı ilə kabinetdə “Yeni elan” bölməsini açın, məlumatları və şəkilləri əlavə edib moderasiyaya göndərin." },
    { question: "Elan niyə moderasiyaya düşür?", answer: "Komanda məlumatın tamlığını, şəkilləri və platforma qaydalarına uyğunluğu yoxlayır. Məqsəd saxta və yanıltıcı elanları azaltmaqdır." },
    { question: "Rədd edilmiş elanı düzəldə bilərəm?", answer: "Bəli. Kabinetdə moderator qeydini görəcək, çatışmayan məlumatı düzəldib elanı yenidən göndərə biləcəksiniz." },
    { question: "Elana neçə şəkil əlavə etmək olar?", answer: "Bir elana maksimum 20 şəkil əlavə edilə bilər. İlk seçilən üz qabığı şəkli kartlarda əsas şəkil kimi göstərilir." },
    { question: "Elanı premium etmək nə verir?", answer: "Aktiv premium müddətində elan xüsusi nişan alır və uyğun siyahılarda daha ön sırada göstərilir. Müddət bitəndə üstünlük avtomatik dayanır." },
    { question: "Favorit və müqayisə üçün hesab lazımdırmı?", answer: "Xeyr. Favorit və müqayisə brauzerdə hesabsız işləyir; giriş etdikdə favoritlər hesabınızla sinxronlaşdırıla bilər." },
    { question: "Saxlanmış axtarış nədir?", answer: "Seçdiyiniz filtrləri adla saxlayır və uyğun yeni elan dərc olunanda seçdiyiniz kanal və tezliklə bildiriş göndərir." },
    { question: "Bildiriş tezliyini dəyişə bilərəm?", answer: "Bəli. Saxlanmış axtarış üçün dərhal, gündəlik və ya həftəlik tezlik seçə; e-poçt, sayt və push kanallarını idarə edə bilərsiniz." },
    { question: "Son baxdığım elanlar harada görünür?", answer: "Giriş etmiş istifadəçi kabinetdə “Son baxılanlar” bölməsində elanları ən son baxış tarixinə görə görür." },
    { question: "Uyğun əmlak tövsiyələri necə yaranır?", answer: "Tövsiyələr seçdiyiniz filtrlər, saxlanmış axtarışlar və platformadakı məxfilik qaydalarına uyğun davranış siqnalları əsasında sıralanır." },
    { question: "Luxe Home Estate ilə necə əlaqə saxlayım?", answer: "Əlaqə forması, telefon və WhatsApp vasitəsilə müraciət edə bilərsiniz. Əmlak səhifəsindəki düymələr elan kontekstini də ötürür." },
    { question: "Rezervasiya nə deməkdir?", answer: "Rezervasiya aktiv olan elanda baxış və ya ilkin maraq sorğusu göndərirsiniz. Bu, alqı-satqı müqaviləsi və mülkiyyət hüququ yaratmır." },
    { question: "Saytdakı ipoteka kalkulyatoru bank təklifidirmi?", answer: "Xeyr. Hesablama yalnız məlumat xarakterlidir; faktiki faiz, komissiya və uyğunluq bank tərəfindən müəyyən edilir." },
    { question: "Şəxsi məlumatlarım necə qorunur?", answer: "Məlumatlar məqsədlə məhdud saxlanılır, yazma əməliyyatları CSRF və sürət limiti ilə qorunur. Ətraflı qaydalar Məxfilik siyasətindədir." },
    { question: "Saxta və ya yanlış elan görsəm nə edim?", answer: "Elanın linkini əlaqə forması və ya WhatsApp vasitəsilə göndərin. Komanda qeydi yoxlayıb lazım olduqda elanı gizlədəcək və müəlliflə əlaqə saxlayacaq." },
  ],
  en: [
    { question: "Do I need an account to use the website?", answer: "No. Browsing and filtering listings works without an account. An account is required to publish listings, save searches and receive notifications." },
    { question: "Which account types are available?", answer: "You can register as a regular user, property owner or agency. The account type determines the tools available in your dashboard." },
    { question: "Why must I verify my email?", answer: "Verification confirms ownership of the address and enables reliable password recovery and important account notifications." },
    { question: "What if I forgot my password?", answer: "Use the “Forgot password” link on the sign-in page. A single-use reset link will be sent to your registered email." },
    { question: "Can I export or delete my account data?", answer: "Yes. The profile page lets you request an export and permanently delete the account after password confirmation." },
    { question: "How do I publish a listing?", answer: "Sign in as an owner or agency, open “New listing”, add the property details and photos, and submit it for moderation." },
    { question: "Why is my listing moderated?", answer: "The team checks completeness, images and compliance with platform rules to reduce misleading and fraudulent listings." },
    { question: "Can I correct a rejected listing?", answer: "Yes. The moderator's note appears in your dashboard. Correct the issue and submit the listing again." },
    { question: "How many photos can I upload?", answer: "You can add up to 20 photos per listing. The selected cover image is used on listing cards." },
    { question: "What does a premium listing provide?", answer: "During its active premium period the listing receives a badge and priority in relevant result lists. Priority ends automatically when the period expires." },
    { question: "Do favourites and comparison require an account?", answer: "No. Both work locally without an account; after sign-in, favourites can be synchronised with your account." },
    { question: "What is a saved search?", answer: "It stores your filters under a name and notifies you when a matching new listing is published." },
    { question: "Can I change notification frequency?", answer: "Yes. Choose immediate, daily or weekly delivery and manage email, in-app and push channels." },
    { question: "Where can I find recently viewed listings?", answer: "Signed-in users can open “Recently viewed” in the dashboard, ordered by the most recent view." },
    { question: "How are property recommendations created?", answer: "Recommendations use your selected filters, saved searches and privacy-compliant activity signals to rank relevant listings." },
    { question: "How can I contact Luxe Home Estate?", answer: "Use the contact form, phone or WhatsApp. Buttons on a property page also include the listing context." },
    { question: "What does reservation mean?", answer: "On enabled listings it submits a viewing or initial-interest request. It is not a sale contract and does not create ownership rights." },
    { question: "Is the mortgage calculator a bank offer?", answer: "No. Results are informational; the bank determines actual rates, fees and eligibility." },
    { question: "How is my personal data protected?", answer: "Data is purpose-limited and write operations use CSRF protection and rate limits. See the Privacy Policy for details." },
    { question: "What should I do if a listing looks false?", answer: "Send the listing link through the contact form or WhatsApp. The team will review it and take action where necessary." },
  ],
  ru: [
    { question: "Нужен ли аккаунт для использования сайта?", answer: "Нет. Просматривать и фильтровать объявления можно без аккаунта. Аккаунт нужен для публикации, сохранённых поисков и уведомлений." },
    { question: "Какие типы аккаунтов доступны?", answer: "Можно зарегистрироваться как обычный пользователь, собственник или агентство. Тип аккаунта определяет возможности кабинета." },
    { question: "Зачем подтверждать e-mail?", answer: "Подтверждение удостоверяет принадлежность адреса и обеспечивает безопасное восстановление пароля и важные уведомления." },
    { question: "Что делать, если я забыл пароль?", answer: "Используйте ссылку «Забыли пароль» на странице входа. Одноразовая ссылка придёт на зарегистрированный e-mail." },
    { question: "Можно ли экспортировать или удалить данные аккаунта?", answer: "Да. В профиле можно запросить экспорт и удалить аккаунт после подтверждения пароля." },
    { question: "Как разместить объявление?", answer: "Войдите как собственник или агентство, откройте «Новое объявление», добавьте сведения и фотографии и отправьте на модерацию." },
    { question: "Зачем объявления проходят модерацию?", answer: "Команда проверяет полноту, изображения и соблюдение правил, чтобы уменьшить число ложных и вводящих в заблуждение объявлений." },
    { question: "Можно ли исправить отклонённое объявление?", answer: "Да. В кабинете отображается комментарий модератора. Исправьте замечание и отправьте объявление повторно." },
    { question: "Сколько фотографий можно загрузить?", answer: "До 20 фотографий на объявление. Выбранная обложка используется в карточках." },
    { question: "Что даёт премиум-объявление?", answer: "На активный срок оно получает специальный значок и приоритет в подходящих списках. После окончания срока приоритет снимается автоматически." },
    { question: "Нужен ли аккаунт для избранного и сравнения?", answer: "Нет. Они работают локально без аккаунта; после входа избранное можно синхронизировать с аккаунтом." },
    { question: "Что такое сохранённый поиск?", answer: "Он сохраняет выбранные фильтры и уведомляет о новых подходящих объявлениях." },
    { question: "Можно ли изменить частоту уведомлений?", answer: "Да. Доступны мгновенные, ежедневные и еженедельные уведомления, а также управление e-mail, сайтом и push-каналом." },
    { question: "Где найти недавно просмотренные объявления?", answer: "Вошедшие пользователи видят их в разделе «Недавно просмотренные» кабинета." },
    { question: "Как формируются рекомендации?", answer: "Рекомендации учитывают фильтры, сохранённые поиски и допустимые политикой конфиденциальности сигналы активности." },
    { question: "Как связаться с Luxe Home Estate?", answer: "Через форму связи, телефон или WhatsApp. Кнопки на странице объекта также передают контекст объявления." },
    { question: "Что означает резервирование?", answer: "Это запрос на просмотр или фиксация интереса к доступному объекту. Он не является договором купли-продажи и не создаёт право собственности." },
    { question: "Ипотечный калькулятор является предложением банка?", answer: "Нет. Результат информационный; фактические ставки, комиссии и соответствие требованиям определяет банк." },
    { question: "Как защищаются персональные данные?", answer: "Данные используются только по назначению, а операции записи защищены CSRF и ограничением частоты. Подробнее — в Политике конфиденциальности." },
    { question: "Что делать с подозрительным объявлением?", answer: "Отправьте ссылку через форму связи или WhatsApp. Команда проверит объявление и при необходимости скроет его." },
  ],
};

export function getSiteFaqContent(locale: Locale): FaqGroup[] {
  return TITLES[locale].map((title, index) => ({
    title,
    items: ITEMS[locale].slice(index * 5, index * 5 + 5),
  }));
}
