"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  analyticsConfigured,
  analyticsRuntimeEnabled,
  sanitizeAnalyticsPageLocation,
} from "@/lib/client-analytics";
import { ConsentBanner } from "./consent-banner";
import {
  closeConsentPreferences,
  setConsent,
  setGaDisabled,
  useAnalyticsConsent,
  usePreferencesOpen,
  withdrawAnalytics,
} from "./consent-store";

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
  const pathname = usePathname();
  const onAdmin = isAdminRoute(pathname);
  // Seçim yalnız brauzerdə oxunur: server və hidratasiyanın ilk render-i `pending` alır, ona görə
  // banner server HTML-inə düşmür və artıq seçim edən istifadəçi onu bir an belə görmür.
  const consent = useAnalyticsConsent();
  const preferencesOpen = usePreferencesOpen();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const measurementId = gaId || gtmId;
  const configured = analyticsConfigured() && !onAdmin;

  // Cloudflare Web Analytics (#105) — cookie işlətmir və fərdi məlumat toplamır, ona görə
  // razılıq gözləmir: GA-dan imtina edən ziyarətçi də ümumi trafik statistikasına düşür.
  // Beacon SPA keçidlərini özü izləyir; panel marşrutlarında işə salınmır.
  const cfBeaconToken = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN?.trim();
  useEffect(() => {
    if (onAdmin || process.env.NODE_ENV !== "production" || !cfBeaconToken) return;
    if (document.getElementById("luxe-cf-beacon")) return;
    const script = document.createElement("script");
    script.id = "luxe-cf-beacon";
    script.defer = true;
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.dataset.cfBeacon = JSON.stringify({ token: cfBeaconToken });
    document.head.appendChild(script);
  }, [cfBeaconToken, onAdmin]);

  useEffect(() => {
    if (onAdmin) return;
    if (!analyticsRuntimeEnabled({ production: process.env.NODE_ENV === "production", measurementId, consent: consent === "granted" })) return;
    if (gaId) setGaDisabled(gaId, false);
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

  // Razılıq geri çəkilib (bu və ya başqa tabda): yüklənmiş analitika dayandırılır (təfərrüat və
  // GTM üçün yenilənmə qaydası `withdrawAnalytics`-də).
  useEffect(() => {
    if (!configured || consent === "pending" || consent === "granted") return;
    withdrawAnalytics({ gaId });
  }, [configured, consent, gaId]);

  if (!configured) return null;

  const showBanner = consent === "unset" || (preferencesOpen && consent !== "pending");

  return (
    <>
      {consent === "granted" && gtmId && !gaId ? (
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
          height="0"
          width="0"
          className="hidden"
          title="Google Tag Manager"
          aria-hidden="true"
        />
      ) : null}
      {showBanner ? (
        <ConsentBanner
          mode={preferencesOpen ? "preferences" : "initial"}
          choice={consent}
          onAccept={() => setConsent("granted")}
          onDecline={() => setConsent("denied")}
          onClose={closeConsentPreferences}
        />
      ) : null}
    </>
  );
}
