import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

const COPY = {
  az: {
    verifySubject: "Luxe Home Estate hesabınızı təsdiqləyin",
    verifyTitle: "E-poçt ünvanınızı təsdiqləyin",
    verifyText: "Hesabınızı aktivləşdirmək üçün aşağıdakı düymədən istifadə edin. Link 24 saat etibarlıdır.",
    verifyButton: "E-poçtu təsdiqlə",
    resetSubject: "Luxe Home Estate parolunun bərpası",
    resetTitle: "Yeni parol yaradın",
    resetText: "Parolunuzu yeniləmək üçün aşağıdakı düymədən istifadə edin. Link 1 saat etibarlıdır.",
    resetButton: "Parolu yenilə",
    ignore: "Bu sorğunu siz etməmisinizsə, məktubu nəzərə almayın.",
  },
  en: {
    verifySubject: "Verify your Luxe Home Estate account",
    verifyTitle: "Verify your email address",
    verifyText: "Use the button below to activate your account. The link is valid for 24 hours.",
    verifyButton: "Verify email",
    resetSubject: "Reset your Luxe Home Estate password",
    resetTitle: "Create a new password",
    resetText: "Use the button below to update your password. The link is valid for 1 hour.",
    resetButton: "Reset password",
    ignore: "If you did not request this, you can ignore this email.",
  },
  ru: {
    verifySubject: "Подтвердите аккаунт Luxe Home Estate",
    verifyTitle: "Подтвердите электронную почту",
    verifyText: "Нажмите кнопку ниже, чтобы активировать аккаунт. Ссылка действует 24 часа.",
    verifyButton: "Подтвердить почту",
    resetSubject: "Восстановление пароля Luxe Home Estate",
    resetTitle: "Создайте новый пароль",
    resetText: "Нажмите кнопку ниже, чтобы изменить пароль. Ссылка действует 1 час.",
    resetButton: "Изменить пароль",
    ignore: "Если вы не отправляли этот запрос, проигнорируйте письмо.",
  },
} satisfies Record<Locale, Record<string, string>>;

function resolvedLocale(value: string | null | undefined): Locale {
  return value && (Object.values(LOCALES) as readonly string[]).includes(value) ? value as Locale : DEFAULT_LOCALE;
}

function emailHtml(title: string, text: string, button: string, url: string, ignore: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f1e8;font-family:Arial,sans-serif;color:#25282c"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #ded7c8"><tr><td style="padding:32px"><p style="margin:0 0 8px;color:#8c6a2f;font-size:12px;font-weight:700;letter-spacing:1.5px">LUXE HOME ESTATE</p><h1 style="margin:0 0 16px;font:600 28px Georgia,serif">${title}</h1><p style="margin:0 0 24px;line-height:1.6;color:#555b61">${text}</p><p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#d7b46a;color:#202327;text-decoration:none;padding:13px 20px;font-weight:700">${button}</a></p><p style="margin:0;font-size:12px;line-height:1.6;color:#737980">${ignore}</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendAccountVerificationEmail(email: string, token: string, localeValue?: string | null) {
  const locale = resolvedLocale(localeValue);
  const copy = COPY[locale];
  const url = siteUrl(`${localizePath("/hesab/e-poct-tesdiqi", locale)}?token=${encodeURIComponent(token)}`);
  return sendEmail({
    to: email,
    subject: copy.verifySubject,
    html: emailHtml(copy.verifyTitle, copy.verifyText, copy.verifyButton, url, copy.ignore),
  });
}

export async function sendPasswordResetEmail(email: string, token: string, localeValue?: string | null) {
  const locale = resolvedLocale(localeValue);
  const copy = COPY[locale];
  const url = siteUrl(`${localizePath("/hesab/parolu-yenile", locale)}?token=${encodeURIComponent(token)}`);
  return sendEmail({
    to: email,
    subject: copy.resetSubject,
    html: emailHtml(copy.resetTitle, copy.resetText, copy.resetButton, url, copy.ignore),
  });
}
