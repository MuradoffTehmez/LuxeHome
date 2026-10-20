import { getLocale, getTranslations } from "next-intl/server";
import { isGoogleLoginConfigured } from "@/lib/auth/google-oauth";
import { isTelegramLoginConfigured } from "@/lib/auth/telegram-oidc";
import { isAppleLoginConfigured } from "@/lib/auth/apple-oauth";
import { isFacebookLoginConfigured } from "@/lib/auth/facebook-oauth";
import { safePublicTarget } from "@/lib/auth/public-account-policy";

const GOOGLE_ERROR_KEYS = {
  xeta: "failed",
  limit: "rateLimited",
  emekdas: "staff",
  tesdiqsiz: "unverified",
  hesab: "unavailable",
} as const;

const TELEGRAM_ERROR_KEYS = {
  xeta: "failed",
  limit: "rateLimited",
  emekdas: "staff",
  hesab: "unavailable",
} as const;

const SOCIAL_ERROR_KEYS = {
  xeta: "xeta",
  limit: "limit",
  emekdas: "emekdas",
  hesab: "hesab",
  epost: "epost",
  movcud: "movcud",
} as const;

function errorKey<T extends Record<string, string>>(keys: T, value: string | undefined): T[keyof T] | null {
  return value && value in keys ? keys[value as keyof T] : null;
}

const buttonClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-sm border border-line-strong bg-paper px-5 text-sm font-medium text-ink transition-colors hover:border-ink-muted";

/**
 * Sosial giriş düymələri: Google (#109), Apple, Facebook və Telegram (OIDC). Açarları olmayan provayder render olunmur;
 * heç biri yoxdursa komponent heç nə göstərmir. Keçidlər adi `<a>`-dır: OAuth tam səhifə yönləndirməsi tələb edir.
 */
export async function SocialSignIn({
  next,
  googleError,
  telegramError,
  appleError,
  facebookError,
  placement = "after",
}: {
  next?: string;
  googleError?: string;
  telegramError?: string;
  appleError?: string;
  facebookError?: string;
  /** `before` — düymələr formadan əvvəl, ayırıcı («və ya e-poçt ilə») onların altında. */
  placement?: "before" | "after";
}) {
  const google = isGoogleLoginConfigured();
  const telegram = isTelegramLoginConfigured();
  const apple = isAppleLoginConfigured();
  const facebook = isFacebookLoginConfigured();
  if (!google && !telegram && !apple && !facebook) return null;
  const [locale, t, telegramT, socialT] = await Promise.all([getLocale(), getTranslations("auth.google"), getTranslations("auth.telegram"), getTranslations("auth.social")]);

  const params = new URLSearchParams({ l: locale });
  const target = safePublicTarget(next);
  if (target) params.set("davam", target);
  const googleKey = errorKey(GOOGLE_ERROR_KEYS, googleError);
  const telegramKey = errorKey(TELEGRAM_ERROR_KEYS, telegramError);
  const appleKey = apple ? errorKey(SOCIAL_ERROR_KEYS, appleError) : null;
  const facebookKey = facebook ? errorKey(SOCIAL_ERROR_KEYS, facebookError) : null;
  const socialKey = appleKey ?? facebookKey;

  const divider = (
    <div className="flex items-center gap-3 text-xs text-ink-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      {placement === "before" ? t("orEmail") : t("or")}
      <span className="h-px flex-1 bg-line" />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {placement === "after" ? divider : null}
      {google && googleKey ? (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{t(`errors.${googleKey}`)}</p>
      ) : null}
      {telegram && telegramKey ? (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">{telegramT(`errors.${telegramKey}`)}</p>
      ) : null}
      {socialKey ? (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {socialT(`errors.${socialKey}`, { provider: appleKey ? "Apple" : "Facebook" })}
        </p>
      ) : null}
      {google ? (
        <a href={`/api/auth/google/start?${params.toString()}`} className={buttonClass}>
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
          </svg>
          {t("continue")}
        </a>
      ) : null}
      {apple ? (
        <a href={`/api/auth/apple/start?${params.toString()}`} className={buttonClass} data-testid="apple-sign-in">
          <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
            <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.65.8-3.33.8-.7 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.2-1.54 2.67-.4 6.61 1.1 8.78.74 1.06 1.61 2.25 2.75 2.2 1.1-.04 1.52-.71 2.86-.71 1.33 0 1.7.71 2.87.69 1.19-.02 1.94-1.07 2.66-2.14.85-1.23 1.19-2.43 1.21-2.49-.03-.01-2.31-.89-2.33-3.53ZM14.18 6.15c.6-.74 1.01-1.75.9-2.77-.87.04-1.94.59-2.56 1.32-.56.64-1.05 1.7-.92 2.69.97.08 1.96-.49 2.58-1.24Z" />
          </svg>
          {socialT("apple")}
        </a>
      ) : null}
      {facebook ? (
        <a href={`/api/auth/facebook/start?${params.toString()}`} className={buttonClass} data-testid="facebook-sign-in">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#1877F2" />
            <path fill="#fff" d="M15.12 15.47 15.65 12h-3.33V9.75c0-.95.47-1.87 1.96-1.87h1.51V4.92s-1.37-.23-2.69-.23c-2.74 0-4.53 1.66-4.53 4.66V12H5.53v3.47h3.04v8.39a12.1 12.1 0 0 0 3.75 0v-8.39h2.8Z" />
          </svg>
          {socialT("facebook")}
        </a>
      ) : null}
      {telegram ? (
        <a href={`/api/auth/telegram/start?${params.toString()}`} className={buttonClass} data-testid="telegram-sign-in">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#229ED9" />
            <path fill="#fff" d="M5.4 11.8 16.9 7.3c.53-.2 1 .13.83.93l-1.96 9.24c-.14.66-.53.82-1.08.51l-3-2.2-1.44 1.39c-.16.16-.3.3-.6.3l.21-3.05 5.55-5.01c.24-.21-.05-.33-.38-.12l-6.86 4.32-2.95-.92c-.64-.2-.65-.64.13-.95Z" />
          </svg>
          {telegramT("continue")}
        </a>
      ) : null}
      {placement === "before" ? divider : null}
    </div>
  );
}
