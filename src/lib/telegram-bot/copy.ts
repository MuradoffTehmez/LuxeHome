import type { Locale } from "@/lib/constants";

/**
 * Bot çatındakı mətnlər (AZ əsas, EN, RU). Mesaj bazaya yox, birbaşa Telegram-a gedir, ona görə
 * `account-notices.ts`-dəki kimi kodda saxlanılır: webhook marşrutu next-intl request konfiqurasiyası
 * olmadan işləyir. Dinamik dəyəri olan funksiyalar **xam** mətn qaytarır — çağıran `escapeTelegramHtml` işlədir.
 */

export function botLocale(value: string | null | undefined): Locale {
  if (!value) return "az";
  const short = value.slice(0, 2).toLowerCase();
  return short === "en" || short === "ru" ? short : "az";
}

type BotCopy = {
  welcome: (name: string) => string;
  welcomeBody: string;
  help: string;
  menuSettings: string;
  menuNotifications: string;
  menuSupport: string;
  menuAccount: string;
  menuLanguage: string;
  menuSite: string;
  openSite: string;
  openCabinet: string;
  settings: string;
  notLinked: string;
  linkAction: string;
  linkedAs: (name: string) => string;
  accountStatus: (enabled: boolean) => string;
  notificationsOn: string;
  notificationsOff: string;
  enableNotifications: string;
  disableNotifications: string;
  stopDone: string;
  stopNotLinked: string;
  enabledDone: string;
  linkSuccess: (name: string) => string;
  linkExpired: string;
  linkTaken: string;
  linkFailed: string;
  linkPrivateOnly: string;
  languagePrompt: string;
  languageSaved: string;
  supportPrompt: string;
  supportReceived: (id: string) => string;
  supportAppended: string;
  supportTooLong: (max: number) => string;
  supportLimited: string;
  supportReply: string;
  supportClosed: string;
  supportTextOnly: string;
  unknown: string;
  groupOnly: string;
  rateLimited: string;
  testTitle: string;
  testBody: string;
  notificationOpen: string;
  notificationSettings: string;
};

const az: BotCopy = {
  welcome: (name) => `Salam, ${name}!`,
  welcomeBody: "Luxe Home Estate botu elanlar, müraciətlər və hesab bildirişlərini Telegram-a çatdırır. Aşağıdakı menyudan seçin.",
  help:
    "<b>Bot nə edə bilir</b>\n\n" +
    "/start — salamlama və əsas menyu\n" +
    "/account — Telegram bağlantısının statusu\n" +
    "/notifications — bildirişlərin vəziyyəti\n" +
    "/settings — bildiriş ayarları (kabinet)\n" +
    "/stop — Telegram bildirişlərini dayandır\n" +
    "/support — dəstəyə yaz\n" +
    "/language — dil seçimi\n\n" +
    "Bildiriş almaq üçün saytda kabinetin «Bildirişlər» bölməsindən Telegram hesabınızı bağlayın.",
  menuSettings: "⚙️ Ayarlar",
  menuNotifications: "🔔 Bildirişlər",
  menuSupport: "💬 Dəstək",
  menuAccount: "👤 Hesab",
  menuLanguage: "🌐 Dil",
  menuSite: "🏠 Sayta keç",
  openSite: "Sayta keç",
  openCabinet: "Kabineti aç",
  settings: "Bildiriş kateqoriyaları, sakit saatlar və Telegram razılığı kabinetin «Bildirişlər» bölməsindədir.",
  notLinked: "Bu Telegram hesabı hələ Luxe Home Estate hesabına bağlanmayıb. Saytda daxil olun və kabinetin «Bildirişlər» bölməsində «Telegram-ı bağla» düyməsini seçin.",
  linkAction: "Hesabı bağla",
  linkedAs: (name) => `Bu Telegram hesabı «${name}» hesabına bağlıdır.`,
  accountStatus: (enabled) => (enabled ? "Telegram bildirişləri: aktivdir." : "Telegram bildirişləri: söndürülüb."),
  notificationsOn: "🔔 Telegram bildirişləri aktivdir. Hansı kateqoriyaların gələcəyini kabinetdə seçə bilərsiniz.",
  notificationsOff: "🔕 Telegram bildirişləri söndürülüb.",
  enableNotifications: "🔔 Bildirişləri aç",
  disableNotifications: "🔕 Bildirişləri söndür",
  stopDone: "Telegram bildirişləri dayandırıldı. Yenidən açmaq üçün /notifications yazın və ya kabinetdən aktivləşdirin. Təhlükəsizlik bildirişləri e-poçtla gəlməyə davam edir.",
  stopNotLinked: "Bu çata heç bir bildiriş göndərilmir — Telegram hesabı sayt hesabına bağlı deyil.",
  enabledDone: "Telegram bildirişləri aktivləşdirildi.",
  linkSuccess: (name) => `✅ Telegram hesabınız «${name}» hesabına bağlandı. Bildirişləri almaq üçün aşağıdakı düyməni seçin.`,
  linkExpired: "Bağlantı linkinin müddəti bitib və ya o artıq istifadə olunub. Kabinetdən yeni link yaradın.",
  linkTaken: "Bu Telegram hesabı artıq başqa Luxe Home Estate hesabına bağlıdır. Əvvəlcə o hesabdan ayırın.",
  linkFailed: "Hesabı bağlamaq alınmadı. Bir az sonra yenidən cəhd edin.",
  linkPrivateOnly: "Hesab yalnız botla şəxsi çatda bağlana bilər.",
  languagePrompt: "Dili seçin:",
  languageSaved: "Dil yadda saxlanıldı.",
  supportPrompt: "Sualınızı və ya probleminizi bir mesajla yazın (ən çox 2000 simvol). Operator cavabı bu çata gələcək. Ləğv etmək üçün /start yazın.",
  supportReceived: (id) => `✅ Müraciətiniz qəbul edildi (№ ${id}). Operator cavab verəndə bu çatda görəcəksiniz.`,
  supportAppended: "✅ Mesajınız açıq müraciətinizə əlavə olundu.",
  supportTooLong: (max) => `Mesaj çox uzundur — ən çox ${max} simvol yazın.`,
  supportLimited: "Qısa müddətdə çox mesaj göndərdiniz. Bir saat sonra yenidən yazın.",
  supportReply: "💬 <b>Dəstək xidmətinin cavabı</b>",
  supportClosed: "Müraciətiniz bağlandı. Yeni sual üçün /support yazın.",
  supportTextOnly: "Hazırda yalnız mətn mesajı qəbul olunur.",
  unknown: "Bu əmri tanımadım. Mövcud əmrlər üçün /help yazın.",
  groupOnly: "Bu əmr yalnız botla şəxsi çatda işləyir.",
  rateLimited: "Çox sürətli yazırsınız — bir dəqiqə sonra yenidən cəhd edin.",
  testTitle: "🔔 Test bildirişi",
  testBody: "Telegram bildirişləri düzgün işləyir.",
  notificationOpen: "Bax",
  notificationSettings: "Bildiriş ayarları",
};

const en: BotCopy = {
  welcome: (name) => `Hello, ${name}!`,
  welcomeBody: "The Luxe Home Estate bot delivers listing, enquiry and account notifications to Telegram. Choose from the menu below.",
  help:
    "<b>What the bot can do</b>\n\n" +
    "/start — welcome and main menu\n" +
    "/account — Telegram link status\n" +
    "/notifications — notification status\n" +
    "/settings — notification settings (account)\n" +
    "/stop — stop Telegram notifications\n" +
    "/support — contact support\n" +
    "/language — choose language\n\n" +
    "To receive notifications, link your Telegram in the «Notifications» section of your account on the website.",
  menuSettings: "⚙️ Settings",
  menuNotifications: "🔔 Notifications",
  menuSupport: "💬 Support",
  menuAccount: "👤 Account",
  menuLanguage: "🌐 Language",
  menuSite: "🏠 Open website",
  openSite: "Open website",
  openCabinet: "Open account",
  settings: "Notification categories, quiet hours and Telegram consent are in the «Notifications» section of your account.",
  notLinked: "This Telegram account is not linked to a Luxe Home Estate account yet. Sign in on the website and choose «Link Telegram» in the «Notifications» section.",
  linkAction: "Link account",
  linkedAs: (name) => `This Telegram account is linked to «${name}».`,
  accountStatus: (enabled) => (enabled ? "Telegram notifications: on." : "Telegram notifications: off."),
  notificationsOn: "🔔 Telegram notifications are on. You can choose categories in your account.",
  notificationsOff: "🔕 Telegram notifications are off.",
  enableNotifications: "🔔 Turn on notifications",
  disableNotifications: "🔕 Turn off notifications",
  stopDone: "Telegram notifications stopped. Send /notifications or enable them in your account to resume. Security notices still arrive by email.",
  stopNotLinked: "No notifications are sent to this chat — the Telegram account is not linked to a website account.",
  enabledDone: "Telegram notifications enabled.",
  linkSuccess: (name) => `✅ Your Telegram is now linked to «${name}». Tap the button below to receive notifications.`,
  linkExpired: "This link has expired or was already used. Create a new one in your account.",
  linkTaken: "This Telegram account is already linked to another Luxe Home Estate account. Unlink it there first.",
  linkFailed: "Could not link the account. Please try again later.",
  linkPrivateOnly: "Accounts can only be linked in a private chat with the bot.",
  languagePrompt: "Choose a language:",
  languageSaved: "Language saved.",
  supportPrompt: "Describe your question or problem in one message (up to 2000 characters). The operator's reply will arrive in this chat. Send /start to cancel.",
  supportReceived: (id) => `✅ Your request has been received (No. ${id}). You will see the operator's reply in this chat.`,
  supportAppended: "✅ Your message was added to your open request.",
  supportTooLong: (max) => `The message is too long — please keep it under ${max} characters.`,
  supportLimited: "You have sent too many messages. Please try again in an hour.",
  supportReply: "💬 <b>Reply from support</b>",
  supportClosed: "Your request has been closed. Send /support for a new question.",
  supportTextOnly: "Only text messages are accepted at the moment.",
  unknown: "I don't know this command. Send /help for the list of commands.",
  groupOnly: "This command only works in a private chat with the bot.",
  rateLimited: "You're sending messages too quickly — try again in a minute.",
  testTitle: "🔔 Test notification",
  testBody: "Telegram notifications are working.",
  notificationOpen: "View",
  notificationSettings: "Notification settings",
};

const ru: BotCopy = {
  welcome: (name) => `Здравствуйте, ${name}!`,
  welcomeBody: "Бот Luxe Home Estate присылает в Telegram уведомления об объявлениях, заявках и аккаунте. Выберите пункт меню ниже.",
  help:
    "<b>Что умеет бот</b>\n\n" +
    "/start — приветствие и главное меню\n" +
    "/account — статус привязки Telegram\n" +
    "/notifications — состояние уведомлений\n" +
    "/settings — настройки уведомлений (кабинет)\n" +
    "/stop — остановить уведомления в Telegram\n" +
    "/support — написать в поддержку\n" +
    "/language — выбор языка\n\n" +
    "Чтобы получать уведомления, привяжите Telegram в разделе «Уведомления» личного кабинета на сайте.",
  menuSettings: "⚙️ Настройки",
  menuNotifications: "🔔 Уведомления",
  menuSupport: "💬 Поддержка",
  menuAccount: "👤 Аккаунт",
  menuLanguage: "🌐 Язык",
  menuSite: "🏠 Перейти на сайт",
  openSite: "Перейти на сайт",
  openCabinet: "Открыть кабинет",
  settings: "Категории уведомлений, тихие часы и согласие на Telegram находятся в разделе «Уведомления» личного кабинета.",
  notLinked: "Этот Telegram-аккаунт ещё не привязан к аккаунту Luxe Home Estate. Войдите на сайт и выберите «Привязать Telegram» в разделе «Уведомления».",
  linkAction: "Привязать аккаунт",
  linkedAs: (name) => `Этот Telegram-аккаунт привязан к «${name}».`,
  accountStatus: (enabled) => (enabled ? "Уведомления в Telegram: включены." : "Уведомления в Telegram: выключены."),
  notificationsOn: "🔔 Уведомления в Telegram включены. Категории можно выбрать в кабинете.",
  notificationsOff: "🔕 Уведомления в Telegram выключены.",
  enableNotifications: "🔔 Включить уведомления",
  disableNotifications: "🔕 Выключить уведомления",
  stopDone: "Уведомления в Telegram остановлены. Отправьте /notifications или включите их в кабинете. Уведомления безопасности продолжат приходить по e-mail.",
  stopNotLinked: "В этот чат уведомления не отправляются — Telegram не привязан к аккаунту сайта.",
  enabledDone: "Уведомления в Telegram включены.",
  linkSuccess: (name) => `✅ Ваш Telegram привязан к «${name}». Нажмите кнопку ниже, чтобы получать уведомления.`,
  linkExpired: "Срок действия ссылки истёк или она уже использована. Создайте новую в кабинете.",
  linkTaken: "Этот Telegram-аккаунт уже привязан к другому аккаунту Luxe Home Estate. Сначала отвяжите его там.",
  linkFailed: "Не удалось привязать аккаунт. Попробуйте позже.",
  linkPrivateOnly: "Привязать аккаунт можно только в личном чате с ботом.",
  languagePrompt: "Выберите язык:",
  languageSaved: "Язык сохранён.",
  supportPrompt: "Опишите вопрос или проблему одним сообщением (до 2000 символов). Ответ оператора придёт в этот чат. Чтобы отменить, отправьте /start.",
  supportReceived: (id) => `✅ Обращение принято (№ ${id}). Ответ оператора появится в этом чате.`,
  supportAppended: "✅ Сообщение добавлено к вашему открытому обращению.",
  supportTooLong: (max) => `Сообщение слишком длинное — не более ${max} символов.`,
  supportLimited: "Вы отправили слишком много сообщений. Попробуйте через час.",
  supportReply: "💬 <b>Ответ службы поддержки</b>",
  supportClosed: "Обращение закрыто. Для нового вопроса отправьте /support.",
  supportTextOnly: "Сейчас принимаются только текстовые сообщения.",
  unknown: "Я не знаю такой команды. Отправьте /help, чтобы увидеть список.",
  groupOnly: "Эта команда работает только в личном чате с ботом.",
  rateLimited: "Вы пишете слишком быстро — попробуйте через минуту.",
  testTitle: "🔔 Тестовое уведомление",
  testBody: "Уведомления в Telegram работают.",
  notificationOpen: "Открыть",
  notificationSettings: "Настройки уведомлений",
};

export const BOT_COPY: Record<Locale, BotCopy> = { az, en, ru };

export const LANGUAGE_LABELS: Record<Locale, string> = { az: "🇦🇿 Azərbaycan", en: "🇬🇧 English", ru: "🇷🇺 Русский" };

/** `setMyCommands` üçün — BotFather-dəki siyahı ilə eyni saxlanılır. */
export const BOT_COMMANDS: Record<Locale, { command: string; description: string }[]> = {
  az: [
    { command: "start", description: "Botu başlat və əsas menyu" },
    { command: "help", description: "Botun imkanları" },
    { command: "account", description: "Hesab bağlantısının statusu" },
    { command: "notifications", description: "Bildirişlərin vəziyyəti" },
    { command: "settings", description: "Bildiriş ayarları" },
    { command: "stop", description: "Telegram bildirişlərini dayandır" },
    { command: "support", description: "Dəstəyə yaz" },
    { command: "language", description: "Dil seçimi" },
  ],
  en: [
    { command: "start", description: "Start the bot and open the menu" },
    { command: "help", description: "What the bot can do" },
    { command: "account", description: "Account link status" },
    { command: "notifications", description: "Notification status" },
    { command: "settings", description: "Notification settings" },
    { command: "stop", description: "Stop Telegram notifications" },
    { command: "support", description: "Contact support" },
    { command: "language", description: "Choose language" },
  ],
  ru: [
    { command: "start", description: "Запустить бота и открыть меню" },
    { command: "help", description: "Возможности бота" },
    { command: "account", description: "Статус привязки аккаунта" },
    { command: "notifications", description: "Состояние уведомлений" },
    { command: "settings", description: "Настройки уведомлений" },
    { command: "stop", description: "Остановить уведомления в Telegram" },
    { command: "support", description: "Написать в поддержку" },
    { command: "language", description: "Выбор языка" },
  ],
};
