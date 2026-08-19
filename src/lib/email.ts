import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "Luxe Home Estate <onboarding@resend.dev>";
const defaultNotificationEmail =
  process.env.NOTIFICATION_EMAIL || "amiyevbahadur@gmail.com";

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
  to = defaultNotificationEmail,
  subject,
  html,
  from = resendFromEmail,
  replyTo,
}: SendEmailOptions) {
  if (!resend) {
    console.warn("⚠️ Resend API açarı (RESEND_API_KEY) tapılmadı. E-poçt göndərilmədi.");
    return { success: false, error: "RESEND_API_KEY təyin edilməyib" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
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
  const recipient = process.env.NOTIFICATION_EMAIL || defaultNotificationEmail;
  const timeFormatted = new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Baku",
  }).format(new Date());

  const subject = `🔔 Yeni Müraciət: ${payload.name} — ${payload.subject || "Luxe Home Estate"}`;

  const html = `
<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F7F4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#FFFFFF;border-radius:8px;border:1px solid #E6E2D8;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
          
          <!-- Başlıq -->
          <tr>
            <td style="background-color:#141414;padding:28px 32px;text-align:center;border-bottom:3px solid #C6A87D;">
              <h1 style="margin:0;font-size:22px;letter-spacing:1px;font-weight:600;color:#FFFFFF;">
                LUXE HOME ESTATE
              </h1>
              <p style="margin:4px 0 0 0;font-size:12px;color:#C6A87D;letter-spacing:2px;text-transform:uppercase;">
                Yeni Müştəri Müraciəti
              </p>
            </td>
          </tr>

          <!-- Əsas Məzmun -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#4A4A4A;">
                Sayt üzərindən yeni bir müraciət daxil oldu:
              </p>

              <!-- Məlumat Cədvəli -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF9F6;border:1px solid #EBE7DF;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:13px;font-weight:600;color:#706E6B;width:35%;">Ad, Soyad:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:14px;font-weight:600;color:#141414;">${payload.name}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:13px;font-weight:600;color:#706E6B;">Telefon:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:14px;font-weight:600;color:#141414;">
                    <a href="tel:${payload.phone}" style="color:#C6A87D;text-decoration:none;font-weight:bold;">${payload.phone}</a>
                  </td>
                </tr>
                ${
                  payload.email
                    ? `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:13px;font-weight:600;color:#706E6B;">E-poçt:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:14px;color:#141414;">
                    <a href="mailto:${payload.email}" style="color:#141414;text-decoration:underline;">${payload.email}</a>
                  </td>
                </tr>`
                    : ""
                }
                ${
                  payload.subject
                    ? `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:13px;font-weight:600;color:#706E6B;">Mövzu:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:14px;color:#141414;">${payload.subject}</td>
                </tr>`
                    : ""
                }
                ${
                  payload.propertyTitle
                    ? `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:13px;font-weight:600;color:#706E6B;">Əmlak / Layihə:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #EBE7DF;font-size:14px;color:#141414;">${payload.propertyTitle}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#706E6B;">Tarix:</td>
                  <td style="padding:12px 16px;font-size:13px;color:#706E6B;">${timeFormatted}</td>
                </tr>
              </table>

              <!-- Mesaj Bloku -->
              <div style="margin-bottom:24px;">
                <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#706E6B;text-transform:uppercase;letter-spacing:0.5px;">Mesaj:</p>
                <div style="background-color:#FAF9F6;border-left:3px solid #C6A87D;padding:14px 16px;font-size:14px;line-height:1.6;color:#1A1A1A;white-space:pre-wrap;">
${payload.message}
                </div>
              </div>

              <!-- Əlaqə Düymələri -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-top:8px;">
                    <a href="tel:${payload.phone}" style="display:inline-block;background-color:#141414;color:#FFFFFF;padding:12px 24px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;margin-right:8px;">
                      📞 Zəng et (${payload.phone})
                    </a>
                    <a href="https://wa.me/${payload.phone.replace(/[^0-9]/g, "")}" style="display:inline-block;background-color:#25D366;color:#FFFFFF;padding:12px 24px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;">
                      💬 WhatsApp-da yaz
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Altlıq -->
          <tr>
            <td style="background-color:#FAF9F6;padding:20px 32px;border-top:1px solid #EBE7DF;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8C8881;">
                Bu bildiriş <a href="https://www.luxehomeestate.az" style="color:#C6A87D;text-decoration:none;">Luxe Home Estate</a> saytından avtomatik göndərilib.
              </p>
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
