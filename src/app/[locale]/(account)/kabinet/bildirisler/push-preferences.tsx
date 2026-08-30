"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removePushSubscription, savePushSubscription } from "./push-actions";

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function PushPreferences() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (!available) return;
    navigator.serviceWorker.register("/push-sw.js").then((registration) => registration.pushManager.getSubscription()).then((subscription) => setEnabled(Boolean(subscription))).catch(() => setSupported(false));
  }, []);

  function toggle() {
    startTransition(async () => {
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (current) {
        const endpoint = current.endpoint;
        await current.unsubscribe();
        const result = await removePushSubscription(endpoint);
        if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
        if (result.status === "success") setEnabled(false);
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) { toast("Push açarı konfiqurasiya edilməyib.", "error"); return; }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { toast("Brauzer bildiriş icazəsi verilmədi.", "error"); return; }
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
      const json = subscription.toJSON();
      const result = await savePushSubscription({ endpoint: subscription.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } });
      if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
      if (result.status === "success") setEnabled(true);
    });
  }

  return (
    <section className="mb-6 flex flex-col gap-4 rounded-md border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><BellRing className="size-5" /></span><div><h2 className="font-medium text-ink">Web Push</h2><p className="mt-0.5 text-sm text-ink-muted">Qiymət endirimi, yeni uyğun elan və rezervasiya yeniliklərini brauzerdə alın.</p></div></div>
      <Button type="button" variant={enabled ? "outline" : "primary"} size="sm" onClick={toggle} loading={pending} disabled={!supported}>{!supported ? "Dəstəklənmir" : enabled ? "Söndür" : "Aktiv et"}</Button>
    </section>
  );
}
