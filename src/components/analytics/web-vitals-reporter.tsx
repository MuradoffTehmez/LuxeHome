"use client";

import { useReportWebVitals } from "next/web-vitals";
import { WEB_VITAL_NAMES } from "@/lib/monitoring";

function transmit(endpoint: string, payload: object) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: "application/json" }))) return;
  void fetch(endpoint, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
}

/**
 * `useReportWebVitals` yalnız Core Web Vitals-ı deyil, Next.js-in öz ölçülərini də
 * verir (`Next.js-hydration`, `Next.js-render`, `Next.js-route-change-to-render`).
 * Onların adı server sxemindəki enum-a düşmür və `rating` sahəsi yoxdur, ona görə
 * hər səhifə yüklənişində `/api/monitoring/vitals` **400** qaytarırdı. Süzgəc
 * serverlə eyni sabitdən oxuyur ki, siyahı bir yerdə qalsın.
 */
const REPORTED_NAMES = new Set<string>(WEB_VITAL_NAMES);

/** PII-siz real-user Core Web Vitals: query string və istifadəçi identifikatoru göndərilmir. */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (!REPORTED_NAMES.has(metric.name)) return;
    transmit("/api/monitoring/vitals", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    });
  });
  return null;
}
