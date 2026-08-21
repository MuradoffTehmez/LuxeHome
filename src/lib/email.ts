import { Resend } from "resend";
import { SETTING_KEYS, getSetting } from "@/lib/settings";

/**
 * Cloudflare Workers-də `process.env` yalnız sorğu kontekstində doldurulur —
 * modul yüklənərkən oxunsa, dəyərlər boş qalır. Ona görə bütün konfiqurasiya
 * ilk istifadə anında (lazy) oxunur.
 */
const DEFAULT_FROM_EMAIL = "Luxe Home Estate <onboarding@resend.dev>";
const FALLBACK_NOTIFICATION_EMAIL = "info@luxehomeestate.az";

function fromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

/**
 * Bildiriş ünvanı.
 *
 * Sıra: paneldəki parametr → mühit dəyişəni → sabit ehtiyat ünvan. Paneldən
 * dəyişmək mümkün olmalıdır ki, məsul əməkdaş dəyişəndə yayım gözlənilməsin.
 */
async function notificationEmail(): Promise<string> {
  const configured = await getSetting(SETTING_KEYS.LEAD_NOTIFICATION_EMAIL);
  return configured || process.env.NOTIFICATION_EMAIL || FALLBACK_NOTIFICATION_EMAIL;
}

let resendClient: Resend | null | undefined;

/** Resend klienti — açar yoxdursa `null` qaytarır. */
export function getResend(): Resend | null {
  if (resendClient === undefined) {
    const apiKey = process.env.RESEND_API_KEY;
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

export type PropertyItem = {
  title: string;
  location: string;
  price: string;
  type: string;
  imageUrl: string;
  url: string;
};

export type ShowcaseEmailPayload = {
  to: string | string[];
  subject?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  properties?: PropertyItem[];
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

  if (!resend) {
    console.warn("⚠️ Resend API açarı (RESEND_API_KEY) tapılmadı. E-poçt göndərilmədi.");
    return { success: false, error: "RESEND_API_KEY təyin edilməyib" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from ?? fromEmail(),
      to: to ?? (await notificationEmail()),
      subject,
      html,
      replyTo: replyTo || undefined,
    });

    if (error) {
      console.error("❌ Resend e-poçt göndərmə xətası:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Resend gözlənilməz xəta:", err);
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
    replyTo: payload.email || undefined,
  });
}

/**
 * Müştərilər üçün premium əmlak bülleteni / marketinq e-poçt şablonu
 */
export async function sendShowcaseEmail(payload: ShowcaseEmailPayload) {
  const subject = payload.subject || "Luxe Home Estate — Seçilmiş Premium Əmlaklar";
  const heroTitle = payload.heroTitle || "Yeni həyatınızı<br>burada kəşf edin";
  const heroSubtitle =
    payload.heroSubtitle ||
    "Bakının seçilmiş premium daşınmaz əmlaklarını sizin üçün bir araya gətiririk.";

  const properties = payload.properties || [
    {
      title: "Premium Residence",
      location: "Bakı, Nəsimi rayonu",
      price: "₼ 485,000",
      type: "SATIŞ",
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      url: "https://luxehomeestate.az/emlaklar",
    },
    {
      title: "Modern Dənizkənarı Villa",
      location: "Bakı, Mərdəkan",
      price: "₼ 1,250,000",
      type: "SATIŞ",
      imageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      url: "https://luxehomeestate.az/emlaklar",
    },
  ];

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
        font-size: 30px !important;
        line-height: 36px !important;
      }
      .property-image {
        width: 100% !important;
      }
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#f3f1ed;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f1ed;">
    <tr>
      <td align="center" style="padding:30px 15px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:30px 30px 25px 30px; background-color:#ffffff;">
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:24px;
                letter-spacing:2px;
                font-weight:bold;
                color:#171717;
              ">
                LUXE HOME ESTATE
              </div>
              <div style="height:10px; line-height:10px;">&nbsp;</div>
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

          <!-- GOLD LINE -->
          <tr>
            <td style="height:2px; background-color:#B89B5E; font-size:0; line-height:0;">
              &nbsp;
            </td>
          </tr>

          <!-- HERO CONTENT -->
          <tr>
            <td align="center" class="mobile-padding" style="padding:42px 50px 40px 50px;">
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:11px;
                letter-spacing:3px;
                color:#B89B5E;
                text-transform:uppercase;
                font-weight:600;
              ">
                SİZİN ÜÇÜN SEÇİLMİŞ
              </div>

              <div style="height:14px; line-height:14px;">&nbsp;</div>

              <div class="hero-title" style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:36px;
                line-height:43px;
                color:#171717;
                font-weight:normal;
              ">
                ${heroTitle}
              </div>

              <div style="height:18px; line-height:18px;">&nbsp;</div>

              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:15px;
                line-height:25px;
                color:#666666;
              ">
                ${heroSubtitle}
              </div>

              <div style="height:28px; line-height:28px;">&nbsp;</div>

              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#171717; border-radius:2px;">
                    <a href="https://luxehomeestate.az/emlaklar" style="
                      display:inline-block;
                      padding:15px 30px;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:12px;
                      letter-spacing:1.5px;
                      color:#ffffff;
                      text-transform:uppercase;
                      font-weight:600;
                    ">
                      Əmlaklara bax
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECTION TITLE -->
          <tr>
            <td align="center" class="mobile-padding" style="padding:15px 40px 30px 40px;">
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:10px;
                letter-spacing:3px;
                color:#B89B5E;
                text-transform:uppercase;
                font-weight:600;
              ">
                PREMIUM SEÇİMLƏR
              </div>
              <div style="height:10px; line-height:10px;">&nbsp;</div>
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:28px;
                line-height:35px;
                color:#171717;
              ">
                Seçilmiş əmlaklar
              </div>
            </td>
          </tr>

          <!-- PROPERTY LIST -->
          ${properties
            .map(
              (prop) => `
          <tr>
            <td style="padding:0 30px 35px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e7e3dc; background-color:#ffffff;">
                <tr>
                  <td>
                    <img
                      class="property-image"
                      src="${prop.imageUrl}"
                      width="538"
                      alt="${prop.title}"
                      style="width:538px; max-width:100%; height:auto; display:block;"
                    >
                  </td>
                </tr>
                <tr>
                  <td style="padding:25px;">
                    <div style="
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:10px;
                      letter-spacing:2px;
                      color:#B89B5E;
                      text-transform:uppercase;
                      font-weight:600;
                    ">
                      ${prop.type}
                    </div>
                    <div style="height:8px; line-height:8px;">&nbsp;</div>
                    <div style="
                      font-family:Georgia, 'Times New Roman', serif;
                      font-size:24px;
                      color:#171717;
                    ">
                      ${prop.title}
                    </div>
                    <div style="height:8px; line-height:8px;">&nbsp;</div>
                    <div style="
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:13px;
                      color:#777777;
                    ">
                      ${prop.location}
                    </div>
                    <div style="height:18px; line-height:18px;">&nbsp;</div>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="left">
                          <div style="
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:20px;
                            color:#171717;
                            font-weight:bold;
                          ">
                            ${prop.price}
                          </div>
                        </td>
                        <td align="right">
                          <a href="${prop.url}" style="
                            font-family:Arial, Helvetica, sans-serif;
                            font-size:11px;
                            letter-spacing:1px;
                            color:#B89B5E;
                            text-transform:uppercase;
                            font-weight:600;
                          ">
                            Ətraflı →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
            )
            .join("")}

          <!-- ABOUT / CTA SECTION -->
          <tr>
            <td align="center" style="padding:45px 40px; background-color:#171717;">
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:10px;
                letter-spacing:3px;
                color:#B89B5E;
                text-transform:uppercase;
              ">
                LUXE HOME ESTATE
              </div>
              <div style="height:15px; line-height:15px;">&nbsp;</div>
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:28px;
                line-height:36px;
                color:#ffffff;
              ">
                Doğru məkan.<br>
                Doğru seçim.
              </div>
              <div style="height:15px; line-height:15px;">&nbsp;</div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:14px;
                line-height:23px;
                color:#bcbcbc;
              ">
                Premium daşınmaz əmlak axtarırsınız?
                Biz sizin üçün doğru seçimi tapmağa kömək edirik.
              </div>
              <div style="height:25px; line-height:25px;">&nbsp;</div>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:4px;">
                    <a href="https://wa.me/994519228585?text=${encodeURIComponent('Salam, Luxe Home Estate. Seçilmiş premium əmlaklarla bağlı məlumat almaq istəyirəm.')}" style="
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
                      💬 WhatsApp-da yaz (+994 51 922 85 85)
                    </a>
                  </td>
                  <td style="padding:4px;">
                    <a href="https://luxehomeestate.az/elaqe" style="
                      display:inline-block;
                      border:1px solid #B89B5E;
                      padding:13px 26px;
                      font-family:Arial, Helvetica, sans-serif;
                      font-size:11px;
                      letter-spacing:1.5px;
                      color:#B89B5E;
                      text-transform:uppercase;
                      font-weight:600;
                      border-radius:2px;
                    ">
                      Əlaqə Səhifəsi
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:30px 25px; background-color:#111111; border-top:1px solid #292929;">
              <div style="
                font-family:Georgia, 'Times New Roman', serif;
                font-size:18px;
                color:#ffffff;
                letter-spacing:1px;
              ">
                LUXE HOME ESTATE
              </div>
              <div style="height:12px; line-height:12px;">&nbsp;</div>
              <div style="
                font-family:Arial, Helvetica, sans-serif;
                font-size:12px;
                line-height:20px;
                color:#8f8f8f;
              ">
                Əliyar Əliyev 109A, Bakı, Azərbaycan
              </div>
              <div style="height:8px; line-height:8px;">&nbsp;</div>
              <div>
                <a href="https://luxehomeestate.az" style="
                  font-family:Arial, Helvetica, sans-serif;
                  font-size:12px;
                  color:#B89B5E;
                ">
                  www.luxehomeestate.az
                </a>
              </div>
              <div style="height:20px; line-height:20px;">&nbsp;</div>
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
    to: payload.to,
    subject,
    html,
  });
}

