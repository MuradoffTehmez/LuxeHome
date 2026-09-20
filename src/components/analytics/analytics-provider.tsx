"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ANALYTICS_CONSENT_COOKIE,
  analyticsRuntimeEnabled,
  hasAnalyticsConsent,
  sanitizeAnalyticsPageLocation,
} from "@/lib/client-analytics";

type Consent = "granted" | "denied" | null;

function readConsent(): Consent {
  if (hasAnalyticsConsent()) return "granted";
  return document.cookie.split(";").some((part) => part.trim() === `${ANALYTICS_CONSENT_COOKIE}=denied`)
    ? "denied"
    : null;
}

function writeConsent(value: Exclude<Consent, null>) {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

/**
 * Provider kök layout-dadır, yəni `/admin` da onun altındadır. Panel isə marketinq
 * analitikasının yeri deyil: `ADMIN_CSP` `googletagmanager.com`-a icazə vermir
 * (skript və `ns.html` freymi konsolda bloklanırdı) və əməkdaşın panel daxilindəki
 * hərəkətini izləmək razılıq banneri ilə birlikdə oraya heç düşməməlidir.
 */
export function isAdminRoute(pathname: string | null): boolean {
  return pathname === "/admin" || (pathname?.startsWith("/admin/") ?? false);
}

export function AnalyticsProvider() {
  const t = useTranslations("common.analytics");
  const pathname = usePathname();
  const onAdmin = isAdminRoute(pathname);
  const [consent, setConsent] = useState<Consent>(null);
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const measurementId = gaId || gtmId;
  const configured = process.env.NODE_ENV === "production" && Boolean(measurementId) && !onAdmin;

  useEffect(() => setConsent(readConsent()), []);

  useEffect(() => {
    if (onAdmin) return;
    if (!analyticsRuntimeEnabled({ production: process.env.NODE_ENV === "production", measurementId, consent: consent === "granted" })) return;
    window.dataLayer = window.dataLayer ?? [];
    const id = gaId || gtmId!;
    const scriptId = gaId ? "luxe-ga" : "luxe-gtm";
    const scriptExists = Boolean(document.getElementById(scriptId));
    if (gaId) {
      window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer!.push(args));
      if (!scriptExists) window.gtag("js", new Date());
      window.gtag("config", gaId, {
        anonymize_ip: true,
        page_location: sanitizeAnalyticsPageLocation(window.location.href),
      });
      for (const pending of window.pendingAnalyticsEvents ?? []) {
        window.gtag("event", pending.event, pending.payload);
      }
      window.pendingAnalyticsEvents = [];
    } else if (gtmId && !scriptExists) {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    }
    if (scriptExists) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = gaId
      ? `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
      : `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }, [consent, gaId, gtmId, measurementId, onAdmin, pathname]);

  if (!configured) return null;

  if (consent === "granted" && gtmId && !gaId) {
    return (
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
        height="0"
        width="0"
        className="hidden"
        title="Google Tag Manager"
        aria-hidden="true"
      />
    );
  }

  if (consent !== null) return null;
  return (
    <aside role="dialog" aria-label={t("ariaLabel")} className="fixed inset-x-4 bottom-[calc(1rem+var(--safe-bottom))] z-[110] mx-auto max-w-2xl rounded-md border border-line-strong bg-paper p-4 shadow-lg sm:p-5">
      <p className="font-medium text-ink">{t("title")}</p>
      <p className="mt-1 text-sm leading-6 text-ink-soft">{t("description")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { writeConsent("granted"); setConsent("granted"); }} className="inline-flex min-h-11 items-center rounded-xs bg-gold px-4 text-sm font-medium text-on-gold hover:bg-gold-soft">{t("accept")}</button>
        <button type="button" onClick={() => { writeConsent("denied"); setConsent("denied"); }} className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-4 text-sm font-medium text-ink hover:border-gold">{t("decline")}</button>
      </div>
    </aside>
  );
}
