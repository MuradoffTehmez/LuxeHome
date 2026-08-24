"use client";

import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_COOKIE,
  analyticsRuntimeEnabled,
  hasAnalyticsConsent,
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

export function AnalyticsProvider() {
  const [consent, setConsent] = useState<Consent>(null);
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const measurementId = gtmId || gaId;
  const configured = process.env.NODE_ENV === "production" && Boolean(measurementId);

  useEffect(() => setConsent(readConsent()), []);

  useEffect(() => {
    if (!analyticsRuntimeEnabled({ production: process.env.NODE_ENV === "production", measurementId, consent: consent === "granted" })) return;
    window.dataLayer = window.dataLayer ?? [];
    if (gtmId) {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    } else if (gaId) {
      window.dataLayer.push({ event: "js", timestamp: Date.now() });
      window.dataLayer.push({ event: "config", measurement_id: gaId, anonymize_ip: true });
    }
    const id = gtmId || gaId!;
    const scriptId = gtmId ? "luxe-gtm" : "luxe-ga";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = gtmId
      ? `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`
      : `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }, [consent, gaId, gtmId, measurementId]);

  if (!configured || consent !== null) return null;
  return (
    <aside role="dialog" aria-label="Analitika seçimi" className="fixed inset-x-4 bottom-[calc(1rem+var(--safe-bottom))] z-[110] mx-auto max-w-2xl rounded-md border border-line-strong bg-paper p-4 shadow-lg sm:p-5">
      <p className="font-medium text-ink">Analitika seçimi</p>
      <p className="mt-1 text-sm leading-6 text-ink-soft">Saytın necə istifadə edildiyini şəxsi məlumat toplamadan ölçmək üçün analitika cookie-sinə icazə verə bilərsiniz. İmtina etdikdə analitika skripti yüklənmir.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => { writeConsent("granted"); setConsent("granted"); }} className="inline-flex min-h-11 items-center rounded-xs bg-gold px-4 text-sm font-medium text-ink hover:bg-gold-soft">İcazə verirəm</button>
        <button type="button" onClick={() => { writeConsent("denied"); setConsent("denied"); }} className="inline-flex min-h-11 items-center rounded-xs border border-line-strong px-4 text-sm font-medium text-ink hover:border-gold">İmtina edirəm</button>
      </div>
    </aside>
  );
}
