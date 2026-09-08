"use client";

import { useEffect, useState } from "react";

const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushBell() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(vapidKey);
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setEnabled(Boolean(subscription));
    }).catch(() => {});
  }, []);

  const toggle = async () => {
    if (!supported || busy) return;
    setBusy(true);
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") return;
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) });
      const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error("ثبت اعلان‌ها ناموفق بود");
      setEnabled(true);
    } catch (error) {
      console.error("FOT10 push setup failed", error);
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;
  return <button onClick={toggle} disabled={busy} aria-label="اعلان‌های FOT10" className="fixed right-3 top-3 z-[60] rounded-2xl border border-emerald-400/20 bg-[#0b101a]/90 px-3 py-2 text-[11px] font-black text-emerald-300 shadow-lg backdrop-blur-xl">{busy ? "…" : enabled ? "🔔 اعلان روشن" : "🔔 اعلان‌ها"}</button>;
}
