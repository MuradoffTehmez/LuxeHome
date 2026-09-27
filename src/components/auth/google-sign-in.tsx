import { getLocale, getTranslations } from "next-intl/server";
import { isGoogleLoginConfigured } from "@/lib/auth/google-oauth";
import { safePublicTarget } from "@/lib/auth/public-account-policy";

const ERROR_KEYS = {
  xeta: "failed",
  limit: "rateLimited",
  emekdas: "staff",
  tesdiqsiz: "unverified",
  hesab: "unavailable",
} as const;

/**
 * «Google ilə davam et» (#109). `GOOGLE_CLIENT_ID`/`SECRET` secret-ləri yoxdursa heç nə
 * render olunmur. Keçid adi `<a>`-dır: OAuth tam səhifə yönləndirməsi tələb edir.
 */
export async function GoogleSignIn({
  next,
  error,
  placement = "after",
}: {
  next?: string;
  error?: string;
  /** `before` — düymə formadan əvvəl, ayırıcı («və ya e-poçt ilə») onun altında. */
  placement?: "before" | "after";
}) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("auth.google")]);
  const errorKey = error && error in ERROR_KEYS ? ERROR_KEYS[error as keyof typeof ERROR_KEYS] : null;
  if (!isGoogleLoginConfigured()) return null;

  const params = new URLSearchParams({ l: locale });
  const target = safePublicTarget(next);
  if (target) params.set("davam", target);

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
      {errorKey ? (
        <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          {t(`errors.${errorKey}`)}
        </p>
      ) : null}
      <a
        href={`/api/auth/google/start?${params.toString()}`}
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-sm border border-line-strong bg-paper px-5 text-sm font-medium text-ink transition-colors hover:border-ink-muted"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
        </svg>
        {t("continue")}
      </a>
      {placement === "before" ? divider : null}
    </div>
  );
}
