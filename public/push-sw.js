self.addEventListener("push", (event) => {
  let payload = { title: "Luxe Home Estate", body: "Yeni bildirişiniz var.", url: "/kabinet/bildirisler" };
  try { payload = { ...payload, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/logo-mark.png",
    badge: "/logo-mark.png",
    data: { url: payload.url },
    tag: payload.tag,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/kabinet/bildirisler", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((windowClient) => windowClient.url === target);
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});
