self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "FOT10", body: event.data?.text() || "اعلان جدید" }; }
  const title = data.title || "FOT10";
  const options = {
    body: data.body || "اعلان جدید فوتبال",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    data: { url: data.url || "/notifications" },
    tag: data.tag || "fot10-notification",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/notifications";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const existing = list.find((client) => "focus" in client);
    if (existing) return existing.navigate(target).then((client) => client?.focus());
    return clients.openWindow(target);
  }));
});
