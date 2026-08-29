"use client";

import { useEffect, useRef, useState } from "react";

const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "always";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "response-field": true;
      "response-field-name": string;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-luxe-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script error")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.luxeTurnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script error"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  action,
  resetSignal,
}: {
  action: string;
  resetSignal?: unknown;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const initialResetRef = useRef(true);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/security/turnstile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((value) => {
        const result = value as { siteKey?: string };
        if (active && result.siteKey) setSiteKey(result.siteKey);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let active = true;
    loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "always",
          "response-field": true,
          "response-field-name": TURNSTILE_RESPONSE_FIELD,
          callback: () => setFailed(false),
          "expired-callback": () => undefined,
          "error-callback": () => {
            setFailed(true);
          },
        });
      })
      .catch(() => setFailed(true));
    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, siteKey]);

  useEffect(() => {
    if (initialResetRef.current) {
      initialResetRef.current = false;
      return;
    }
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  return (
    <div className="min-h-[65px]" aria-label="Təhlükəsizlik yoxlaması">
      <div ref={containerRef} />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Təhlükəsizlik yoxlaması yüklənmədi. Səhifəni yeniləyib yenidən cəhd edin.
        </p>
      )}
    </div>
  );
}
