"use client";

import { useReportWebVitals } from "next/web-vitals";

function transmit(endpoint: string, payload: object) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon?.(endpoint, new Blob([body], { type: "application/json" }))) return;
  void fetch(endpoint, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
}

/** PII-siz real-user Core Web Vitals: query string və istifadəçi identifikatoru göndərilmir. */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
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
