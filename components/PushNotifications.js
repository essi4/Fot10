"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}

function arrayBufferToBase64(value) {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

export default function PushNotifications() {
  const supabase = getSupabaseBrowserClient();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function check() {
      const ok = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      if (!active) return;
      setSupported(ok);
      if (!ok) return;
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const subscription = await registration.pushManager.getSubscription();
        if (active) setEnabled(Boolean(subscription));
      } catch {
        if (active) setError("ثبت اعلان روی این مرورگر انجام نشد.");
      }
    }
    check();
    return () => { active = false; };
  }, []);

  async function enablePush() {
    setBusy(true); setError(""); setMessage("");
    try {
      if (!supported) throw new Error("مرورگر این گوشی از اعلان پوش پشتیبانی نمی‌کند.");
      if (!PUBLIC_KEY) throw new Error("کلید Push روی سرور تنظیم نشده است.");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error("برای فعال‌سازی اعلان واقعی، ابتدا وارد حساب FOT10 شو.");
      if (Notification.permission === "denied") throw new Error("اجازه اعلان برای FOT10 مسدود شده؛ از تنظیمات مرورگر آن را فعال کن.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("اجازه نمایش اعلان داده نشد.");

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        });
      }
      const json = subscription.toJSON();
      const p256dh = json.keys?.p256dh;
      const authKey = json.keys?.auth;
      if (!subscription.endpoint || !p256dh || !authKey) throw new Error("اطلاعات اشتراک اعلان ناقص است.");

      const { error: dbError } = await supabase.from("fot10_push_subscriptions").upsert({
        user_id: auth.user.id,
        endpoint: subscription.endpoint,
        p256dh: p256dh || arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: authKey || arrayBufferToBase64(subscription.getKey("auth")),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,endpoint" });
      if (dbError) throw dbError;
      setEnabled(true);
      setMessage("اعلان‌های FOT10 فعال شد ✓");
    } catch (e) {
      setError(e?.message || "فعال‌سازی اعلان انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        if (auth?.user) {
          const { error: dbError } = await supabase.from("fot10_push_subscriptions").delete().eq("user_id", auth.user.id).eq("endpoint", endpoint);
          if (dbError) throw dbError;
        }
      }
      setEnabled(false);
      setMessage("اعلان‌های FOT10 غیرفعال شد.");
    } catch (e) {
      setError(e?.message || "غیرفعال‌سازی اعلان انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass card p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-2xl bg-emerald-400/10 grid place-items-center text-emerald-300 shrink-0">
          {enabled ? <Bell size={19} /> : <Smartphone size={19} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">اعلان‌های هوشمند FOT10</h2>
            <span className={`text-[9px] font-black ${enabled ? "text-emerald-300" : "text-slate-500"}`}>{enabled ? "فعال" : "خاموش"}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-5">گل، شروع بازی، پایان مسابقه و اعلان‌های مهم را مستقیم روی گوشی دریافت کن.</p>
        </div>
      </div>

      {!supported && <div className="mt-3 text-[10px] text-amber-200/80">این مرورگر از Web Push پشتیبانی نمی‌کند.</div>}
      {supported && !enabled && <button disabled={busy} onClick={enablePush} className="w-full mt-4 rounded-2xl bg-emerald-400 text-slate-950 py-3.5 font-black text-xs disabled:opacity-50">{busy ? "در حال فعال‌سازی…" : "فعال‌سازی اعلان‌های FOT10"}</button>}
      {supported && enabled && <button disabled={busy} onClick={disablePush} className="w-full mt-4 rounded-2xl bg-white/[.05] border border-white/10 py-3.5 font-black text-xs text-slate-300 disabled:opacity-50"><span className="inline-flex items-center gap-2"><BellOff size={15}/> غیرفعال‌سازی اعلان‌ها</span></button>}
      {(message || error) && <div className={`mt-3 rounded-2xl p-3 text-[10px] font-bold ${error ? "bg-rose-400/[.06] text-rose-200 border border-rose-400/10" : "bg-emerald-400/[.05] text-emerald-200 border border-emerald-400/10"}`}>{error || message}</div>}
    </section>
  );
}
