import { Resend } from "resend";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { corporateEmails, siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants";
import { recordEmailActivity } from "@/lib/email-activity";
import { runtimeEnv } from "@/lib/runtime-env";

/**
 * E-poçt mətnləri.
 *
 * `next-intl` kataloqları qəsdən işlədilmir: `getTranslations()` sorğu
 * konfiqurasiyasına bağlıdır, məktub isə cron kimi sorğusuz kontekstdə də
 * göndərilir. Məktub həm də ayrıca təqdimat səthidir — sayt UI-ının açarları
 * ilə eyni kataloqda saxlanılsaydı, biri dəyişəndə digəri səssizcə sürüşərdi.
 */
type EmailCopy = {
  locale: Locale;
  eyebrow: string;
  matchLead: string;
  viewListing: string;
  matchSubject: (searchName: string) => string;
  matchFooter: (searchName: string) => string;
  digestSubject: (searchName: string, count: number) => string;
  digestLead: (count: number) => string;
  digestMore: (count: number) => string;
  digestFooter: (searchName: string, frequency: string) => string;
  /** Tezlik adları — məktubun altındakı «niyə bunu alıram» sətri üçün. */
  frequencyLabels: Record<"DAILY" | "WEEKLY", string>;
  viewAll: string;
};

const EMAIL_COPY: Record<Locale, EmailCopy> = {
  az: {
    locale: "az",
    eyebrow: "SAXLANMIŞ AXTARIŞ",
    matchLead: "Axtarışınıza uyğun yeni elan dərc olundu.",
    viewListing: "Elana bax",
    matchSubject: (name) => `"${name}" axtarışınıza uyğun yeni elan`,
    matchFooter: (name) =>
      `Bu bildirişi «${name}» saxlanmış axtarışınız üçün «Dərhal» tezliyi seçdiyinizə görə alırsınız.`,
    digestSubject: (name, count) => `"${name}" axtarışınıza uyğun ${count} yeni elan`,
    digestLead: (count) => `Axtarışınıza uyğun ${count} yeni elan dərc olundu.`,
    digestMore: (count) => `və daha ${count} elan`,
    digestFooter: (name, frequency) =>
      `Bu bildirişi «${name}» saxlanmış axtarışınız üçün «${frequency}» tezliyi seçdiyinizə görə alırsınız.`,
    frequencyLabels: { DAILY: "Gündəlik", WEEKLY: "Həftəlik" },
    viewAll: "Hamısına bax",
  },
  en: {
    locale: "en",
    eyebrow: "SAVED SEARCH",
    matchLead: "A new listing matching your search has been published.",
    viewListing: "View listing",
    matchSubject: (name) => `New listing matching your “${name}” search`,
    matchFooter: (name) =>
      `You are receiving this because your saved search “${name}” is set to “Immediate”.`,
    digestSubject: (name, count) => `${count} new listings matching your “${name}” search`,
    digestLead: (count) => `${count} new listings matching your search have been published.`,
    digestMore: (count) => `and ${count} more`,
    digestFooter: (name, frequency) =>
      `You are receiving this because your saved search “${name}” is set to “${frequency}”.`,
    frequencyLabels: { DAILY: "Daily", WEEKLY: "Weekly" },
    viewAll: "View all",
  },
  ru: {
    locale: "ru",
    eyebrow: "СОХРАНЁННЫЙ ПОИСК",
    matchLead: "Опубликовано новое объявление по вашему поиску.",
    viewListing: "Смотреть объявление",
    matchSubject: (name) => `Новое объявление по вашему поиску «${name}»`,
    matchFooter: (name) =>
      `Вы получаете это уведомление, потому что для поиска «${name}» выбрана частота «Сразу».`,
    digestSubject: (name, count) => `${count} новых объявлений по поиску «${name}»`,
    digestLead: (count) => `По вашему поиску опубликовано ${count} новых объявлений.`,
    digestMore: (count) => `и ещё ${count}`,
    digestFooter: (name, frequency) =>
      `Вы получаете это уведомление, потому что для поиска «${name}» выбрана частота «${frequency}».`,
    frequencyLabels: { DAILY: "Ежедневно", WEEKLY: "Еженедельно" },
    viewAll: "Смотреть все",
  },
};

const LOCALE_VALUES = Object.values(LOCALES) as readonly string[];

/** Naməlum dil dəyəri saytın əsas dilinə düşür. */
function emailCopy(locale: string | null | undefined): EmailCopy {
  return EMAIL_COPY[
    locale && LOCALE_VALUES.includes(locale) ? (locale as Locale) : DEFAULT_LOCALE
  ];
}

/**
 * Cloudflare Workers-də `process.env` yalnız sorğu kontekstində doldurulur —
 * modul yüklənərkən oxunsa, dəyərlər boş qalır. Ona görə bütün konfiqurasiya
 * ilk istifadə anında (lazy) oxunur.
 */
const DEFAULT_FROM_EMAIL = `Luxe Home Estate <${corporateEmails.notifications}>`;
const FALLBACK_NOTIFICATION_EMAIL = corporateEmails.sales;

function fromEmail(): string {
  return runtimeEnv("RESEND_FROM_EMAIL") || DEFAULT_FROM_EMAIL;
}

/**
 * Bildiriş ünvanı.
 *
 * Sıra: paneldəki parametr → mühit dəyişəni → sabit ehtiyat ünvan. Paneldən
 * dəyişmək mümkün olmalıdır ki, məsul əməkdaş dəyişəndə yayım gözlənilməsin.
 */
async function notificationEmail(): Promise<string> {
  const configured = await getSetting(SETTING_KEYS.LEAD_NOTIFICATION_EMAIL);
  return configured || runtimeEnv("NOTIFICATION_EMAIL") || FALLBACK_NOTIFICATION_EMAIL;
}

let resendClient: Resend | null | undefined;

/** Resend klienti — açar yoxdursa `null` qaytarır. */
export function getResend(): Resend | null {
  if (resendClient === undefined) {
    const apiKey = runtimeEnv("RESEND_API_KEY");
    resendClient = apiKey ? new Resend(apiKey) : null;
  }
  return resendClient;
}

export type SendEmailOptions = {
  to?: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

export type LeadEmailPayload = {
  name: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  source?: string;
  propertyTitle?: string;
};

/**
 * Ümumi e-poçt göndərmə funksiyası
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailOptions) {
  const resend = getResend();
  const resolvedTo = to ?? (await notificationEmail());
  const resolvedFrom = from ?? fromEmail();
  const toAddresses = Array.isArray(resolvedTo) ? resolvedTo : [resolvedTo];

  if (!resend) {
    console.warn("⚠️ Resend API açarı (RESEND_API_KEY) tapılmadı. E-poçt göndərilmədi.");
    await recordEmailActivity({
      providerId: `local-${crypto.randomUUID()}`,
      direction: "OUTBOUND",
      eventType: "email.failed",
      fromAddress: resolvedFrom,
      toAddresses,
      subject,
    });
    return { success: false, error: "RESEND_API_KEY təyin edilməyib" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolvedFrom,
      to: resolvedTo,
      subject,
      html,
      replyTo: replyTo || corporateEmails.support,
    });

    if (error) {
      console.error("❌ Resend e-poçt göndərmə xətası:", error);
      await recordEmailActivity({
        providerId: `local-${crypto.randomUUID()}`,
        direction: "OUTBOUND",
        eventType: "email.failed",
        fromAddress: resolvedFrom,
        toAddresses,
        subject,
      });
      return { success: false, error: error.message };
    }

    await recordEmailActivity({
      providerId: data?.id ?? `local-${crypto.randomUUID()}`,
      direction: "OUTBOUND",
      eventType: "email.sent",
      fromAddress: resolvedFrom,
      toAddresses,
      subject,
    });
    return { success: true, data };
  } catch (err) {
    console.error("❌ Resend gözlənilməz xəta:", err);
    await recordEmailActivity({
      providerId: `local-${crypto.randomUUID()}`,
      direction: "OUTBOUND",
      eventType: "email.failed",
      fromAddress: resolvedFrom,
      toAddresses,
      subject,
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Naməlum xəta",
    };
  }
}

/**
 * Saytdan gələn yeni müraciət üçün rəhbərliyə / adminə bildiriş e-poçtu
 */
export async function sendLeadNotificationEmail(payload: LeadEmailPayload) {
  // Bildiriş paneldən söndürülə bilər — məsələn məzuniyyət dövründə
  if ((await getSetting(SETTING_KEYS.LEAD_NOTIFY_ENABLED)) === "0") {
    return { success: false, error: "Bildiriş paneldən söndürülüb" };
  }

  const recipient = await notificationEmail();
  const timeFormatted = new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Baku",
  }).format(new Date());

  const subject = `🔔 Yeni Müraciət: ${payload.name} — ${payload.subject || "Luxe Home Estate"}`;

  const html = `
<!DOCTYPE html>
<html lang="az" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f1ed;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    img {
      border: 0;
      display: block;
      max-width: 100%;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .hero-title {
        font-size: 26px !important;
        line-height: 32px !important;
      }
      .action-btn {
        display: block !important;
        width: 100% !important;
        margin-bottom: 8px !important;
      }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#f3f1ed;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f1ed;">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:32px 30px 24px 30px; background-color:#ffffff;">
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:24px;
                letter-spacing:2px;
                font-weight:bold;
                color:#171717;
              ">
                LUXE HOME ESTATE
              </div>
              <div style="height:8px; line-height:8px;">&nbsp;</div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:10px;
                letter-spacing:4px;
                color:#B89B5E;
                text-transform:uppercase;
                font-weight:600;
              ">
                LUXURY REAL ESTATE
              </div>
            </td>
          </tr>

          <!-- GOLD ACCENT LINE -->
          <tr>
            <td style="height:2px; background-color:#B89B5E; font-size:0; line-height:0;">
              &nbsp;
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td align="center" class="mobile-padding" style="padding:36px 40px 28px 40px; background-color:#ffffff;">
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:11px;
                letter-spacing:3px;
                color:#B89B5E;
                text-transform:uppercase;
                font-weight:bold;
              ">
                YENİ MÜŞTƏRİ MÜRACİƏTİ
              </div>

              <div style="height:12px; line-height:12px;">&nbsp;</div>

              <div class="hero-title" style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:30px;
                line-height:38px;
                color:#171717;
                font-weight:normal;
              ">
                ${payload.name}
              </div>

              <div style="height:10px; line-height:10px;">&nbsp;</div>

              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:14px;
                line-height:22px;
                color:#777777;
              ">
                ${payload.subject || "Sayt üzərindən əlaqə müraciəti daxil oldu"}
              </div>
            </td>
          </tr>

          <!-- DETAILS CARD -->
          <tr>
            <td style="padding:0 35px 30px 35px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e7e3dc; background-color:#faf9f6; border-radius:2px;">
                <tr>
                  <td style="padding:24px;">

                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1px; color:#B89B5E; text-transform:uppercase; font-weight:600; width:35%;">
                          Müştəri:
                        </td>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#171717; font-weight:bold;">
                          ${payload.name}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1px; color:#B89B5E; text-transform:uppercase; font-weight:600;">
                          Telefon:
                        </td>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#171717; font-weight:bold;">
                          <a href="tel:${payload.phone}" style="color:#171717;">${payload.phone}</a>
                        </td>
                      </tr>

                      ${
                        payload.email
                          ? `
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1px; color:#B89B5E; text-transform:uppercase; font-weight:600;">
                          E-poçt:
                        </td>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#171717;">
                          <a href="mailto:${payload.email}" style="color:#171717; text-decoration:underline;">${payload.email}</a>
                        </td>
                      </tr>`
                          : ""
                      }

                      ${
                        payload.propertyTitle
                          ? `
                      <tr>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1px; color:#B89B5E; text-transform:uppercase; font-weight:600;">
                          Əmlak / Layihə:
                        </td>
                        <td style="padding:8px 0; border-bottom:1px solid #ede9e1; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#171717; font-weight:bold;">
                          ${payload.propertyTitle}
                        </td>
                      </tr>`
                          : ""
                      }

                      <tr>
                        <td style="padding:8px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1px; color:#B89B5E; text-transform:uppercase; font-weight:600;">
                          Tarix:
                        </td>
                        <td style="padding:8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#777777;">
                          ${timeFormatted}
                        </td>
                      </tr>
                    </table>

                    <div style="height:18px; line-height:18px;">&nbsp;</div>

                    <!-- MESSAGE BLOCK -->
                    <div style="
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:11px;
                      letter-spacing:1.5px;
                      color:#B89B5E;
                      text-transform:uppercase;
                      font-weight:bold;
                      margin-bottom:8px;
                    ">
                      MÜRACİƏT MƏTNİ:
                    </div>

                    <div style="
                      background-color:#ffffff;
                      border:1px solid #ede9e1;
                      border-left:3px solid #B89B5E;
                      padding:16px;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:14px;
                      line-height:22px;
                      color:#2b2b2b;
                      white-space:pre-wrap;
                    ">${payload.message}</div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QUICK ACTIONS -->
          <tr>
            <td align="center" style="padding:0 35px 35px 35px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:4px;">
                    <a href="tel:${payload.phone}" class="action-btn" style="
                      display:inline-block;
                      background-color:#171717;
                      color:#ffffff;
                      padding:14px 28px;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:11px;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      font-weight:600;
                      border-radius:2px;
                    ">
                      📞 Müştəriyə Zəng Et
                    </a>
                  </td>
                  <td align="center" style="padding:4px;">
                    <a href="https://wa.me/994519228585?text=${encodeURIComponent(`Salam Luxe Home Estate. Saytdan yeni müraciət daxil oldu: ${payload.name} (${payload.phone}) — Mövzu: ${payload.subject || "Ümumi müraciət"}`)}" class="action-btn" style="
                      display:inline-block;
                      background-color:#25D366;
                      color:#ffffff;
                      padding:14px 28px;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:11px;
                      letter-spacing:1.5px;
                      text-transform:uppercase;
                      font-weight:600;
                      border-radius:2px;
                    ">
                      💬 WhatsApp (+994 51 922 85 85)
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ABOUT BRAND SECTION -->
          <tr>
            <td align="center" style="padding:40px 35px; background-color:#171717;">
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:10px;
                letter-spacing:3px;
                color:#B89B5E;
                text-transform:uppercase;
              ">
                LUXE HOME ESTATE
              </div>
              <div style="height:12px; line-height:12px;">&nbsp;</div>
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:24px;
                line-height:32px;
                color:#ffffff;
              ">
                Həyatınızın ən dəyərli ünvanı.
              </div>
              <div style="height:12px; line-height:12px;">&nbsp;</div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:13px;
                line-height:21px;
                color:#bcbcbc;
                max-width:440px;
              ">
                Bakıda premium daşınmaz əmlakların alqı-satqısı, icarəsi və peşəkar konsaltinq xidmətləri.
              </div>
              <div style="height:22px; line-height:22px;">&nbsp;</div>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border:1px solid #B89B5E; border-radius:2px;">
                    <a href="https://luxehomeestate.az/admin" style="
                      display:inline-block;
                      padding:12px 24px;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:11px;
                      letter-spacing:1.5px;
                      color:#B89B5E;
                      text-transform:uppercase;
                    ">
                      İdarə Panelinə Keç
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:28px 25px; background-color:#111111; border-top:1px solid #292929;">
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:16px;
                color:#ffffff;
                letter-spacing:1px;
              ">
                LUXE HOME ESTATE MMC
              </div>
              <div style="height:10px; line-height:10px;">&nbsp;</div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:12px;
                line-height:18px;
                color:#8f8f8f;
              ">
                Əliyar Əliyev 109A, Bakı, Azərbaycan
              </div>
              <div style="height:6px; line-height:6px;">&nbsp;</div>
              <div>
                <a href="https://luxehomeestate.az" style="
                  font-family:Arial, Helvetica, sans-serif;
                  font-size:12px;
                  color:#B89B5E;
                ">
                  www.luxehomeestate.az
                </a>
              </div>
              <div style="height:16px; line-height:16px;">&nbsp;</div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:10px;
                color:#666666;
              ">
                © 2026 Luxe Home Estate. Bütün hüquqlar qorunur.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: recipient,
    subject,
    html,
    replyTo: payload.email || corporateEmails.info,
  });
}

export type SavedSearchMatchEmailProperty = {
  title: string;
  slug: string;
};

/**
 * Saxlanmış axtarışa uyğun yeni elan barədə istifadəçiyə "dərhal" tezliyində
 * göndərilən e-poçt bildirişi. `DAILY`/`WEEKLY` tezliklər üçün çağırılmır —
 * onların toplu göndərməsi cron infrastrukturu qurulanda əlavə olunacaq
 * (bax spec bölmə 3, "Əhatə dairəsindən kənar").
 */
export async function sendSavedSearchMatchEmail(
  userEmail: string,
  locale: string,
  property: SavedSearchMatchEmailProperty,
  searchName: string,
) {
  const copy = emailCopy(locale);
  const propertyUrl = siteUrl(localizePath(`/emlaklar/${property.slug}`, copy.locale));
  const subject = `🏠 ${copy.matchSubject(searchName)}`;

  const html = `
<!DOCTYPE html>
<html lang="${copy.locale}" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f1ed; font-family: Arial, Helvetica, sans-serif; }
    table { border-spacing: 0; border-collapse: collapse; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f3f1ed;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f1ed;">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff;">

          <tr>
            <td align="center" style="padding:32px 30px 24px 30px;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:24px; letter-spacing:2px; font-weight:bold; color:#171717;">
                LUXE HOME ESTATE
              </div>
            </td>
          </tr>

          <tr><td style="height:2px; background-color:#B89B5E; font-size:0; line-height:0;">&nbsp;</td></tr>

          <tr>
            <td align="center" class="mobile-padding" style="padding:36px 40px 28px 40px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; color:#B89B5E; text-transform:uppercase; font-weight:bold;">
                ${copy.eyebrow} — «${searchName}»
              </div>
              <div style="height:12px; line-height:12px;">&nbsp;</div>
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:34px; color:#171717;">
                ${property.title}
              </div>
              <div style="height:10px; line-height:10px;">&nbsp;</div>
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; color:#777777;">
                ${copy.matchLead}
              </div>
              <div style="height:26px; line-height:26px;">&nbsp;</div>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#171717; border-radius:2px;">
                    <a href="${propertyUrl}" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1.5px; color:#ffffff; text-transform:uppercase; font-weight:600;">
                      ${copy.viewListing}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 25px; background-color:#111111; border-top:1px solid #292929;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:16px; color:#ffffff; letter-spacing:1px;">
                LUXE HOME ESTATE MMC
              </div>
              <div style="height:10px; line-height:10px;">&nbsp;</div>
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#8f8f8f;">
                ${copy.matchFooter(searchName)}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
    replyTo: corporateEmails.sales,
  });
}


export type SavedSearchDigestProperty = {
  title: string;
  slug: string;
  price: number;
  currency: string;
  imageUrl: string | null;
};

/**
 * HTML-ə qoyulan istifadəçi mətni.
 *
 * Elan başlığı və axtarış adı istifadəçidən gəlir; e-poçt klientləri HTML-i
 * icra etməsə də, məktub veb-önbaxışda (Gmail, Outlook Web) render olunur və
 * markup sınmamalıdır.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * «Gündəlik» / «Həftəlik» tezliyi üçün toplu bildiriş.
 *
 * Bir məktubda bir saxlanmış axtarışın bütün yeni nəticələri gedir — hər elan
 * üçün ayrıca məktub göndərmək məhz bu tezliklərin qarşısını almaq istədiyi
 * davranışdır.
 */
export async function sendSavedSearchDigestEmail(input: {
  userEmail: string;
  locale: string;
  searchName: string;
  /** DAILY | WEEKLY — etiket oxucunun dilində qurulur. */
  frequency: "DAILY" | "WEEKLY";
  properties: SavedSearchDigestProperty[];
  totalCount: number;
}) {
  const copy = emailCopy(input.locale);
  const searchName = escapeHtml(input.searchName);
  const subject = `🏠 ${copy.digestSubject(input.searchName, input.totalCount)}`;
  const listUrl = siteUrl(localizePath("/kabinet/axtarislarim", copy.locale));
  const remaining = input.totalCount - input.properties.length;

  const rows = input.properties
    .map((property) => {
      const url = siteUrl(localizePath(`/emlaklar/${property.slug}`, copy.locale));
      const price = `${property.price.toLocaleString("az-AZ")} ${escapeHtml(property.currency)}`;
      const thumb = property.imageUrl
        ? `<td width="96" style="padding:0 16px 0 0;"><img src="${siteUrl(property.imageUrl)}" width="96" height="72" alt="" style="display:block; width:96px; height:72px; object-fit:cover; border:0;"></td>`
        : "";

      return `
          <tr>
            <td class="mobile-padding" style="padding:16px 40px; border-top:1px solid #ececec;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${thumb}
                  <td valign="middle">
                    <a href="${url}" style="font-family:Georgia, 'Times New Roman', serif; font-size:17px; line-height:24px; color:#171717;">
                      ${escapeHtml(property.title)}
                    </a>
                    <div style="height:6px; line-height:6px;">&nbsp;</div>
                    <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#B89B5E; font-weight:bold;">
                      ${price}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
    })
    .join("");

  const moreRow =
    remaining > 0
      ? `
          <tr>
            <td align="center" class="mobile-padding" style="padding:8px 40px 0 40px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#777777;">
                ${copy.digestMore(remaining)}
              </div>
            </td>
          </tr>`
      : "";

  const html = `
<!DOCTYPE html>
<html lang="${copy.locale}" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f1ed; font-family: Arial, Helvetica, sans-serif; }
    table { border-spacing: 0; border-collapse: collapse; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f3f1ed;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f1ed;">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff;">

          <tr>
            <td align="center" style="padding:32px 30px 24px 30px;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:24px; letter-spacing:2px; font-weight:bold; color:#171717;">
                LUXE HOME ESTATE
              </div>
            </td>
          </tr>

          <tr><td style="height:2px; background-color:#B89B5E; font-size:0; line-height:0;">&nbsp;</td></tr>

          <tr>
            <td align="center" class="mobile-padding" style="padding:36px 40px 20px 40px;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; color:#B89B5E; text-transform:uppercase; font-weight:bold;">
                ${copy.eyebrow} — «${searchName}»
              </div>
              <div style="height:12px; line-height:12px;">&nbsp;</div>
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; color:#777777;">
                ${copy.digestLead(input.totalCount)}
              </div>
            </td>
          </tr>
${rows}
${moreRow}
          <tr>
            <td align="center" class="mobile-padding" style="padding:28px 40px 36px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#171717; border-radius:2px;">
                    <a href="${listUrl}" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:12px; letter-spacing:1.5px; color:#ffffff; text-transform:uppercase; font-weight:600;">
                      ${copy.viewAll}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 25px; background-color:#111111; border-top:1px solid #292929;">
              <div style="font-family:Georgia, 'Times New Roman', serif; font-size:16px; color:#ffffff; letter-spacing:1px;">
                LUXE HOME ESTATE MMC
              </div>
              <div style="height:10px; line-height:10px;">&nbsp;</div>
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#8f8f8f;">
                ${copy.digestFooter(searchName, copy.frequencyLabels[input.frequency])}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: input.userEmail,
    subject,
    html,
    replyTo: corporateEmails.sales,
  });
}
