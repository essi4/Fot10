"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, Flame, RefreshCw, ShieldAlert, Trophy, Goal, CircleAlert, Zap, Repeat2, Clock3 } from "lucide-react";
import Link from "next/link";

const PROFILE_KEY = "fot10-profile";
const SETTINGS_KEY = "fot10-settings";

function readFavorites() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return Array.isArray(profile.favorites) ? profile.favorites.filter(Boolean) : [];
  } catch { return []; }
}

function readSettings() {
  try { return { liveAlerts: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
  catch { return { liveAlerts: true }; }
}

const visual = {
  goal: [Trophy, "گل", "text-emerald-300 bg-emerald-400/10"],
  penalty: [Goal, "پنالتی", "text-amber-300 bg-amber-400/10"],
  var: [ShieldAlert, "VAR", "text-violet-300 bg-violet-400/10"],
  "red-card": [CircleAlert, "کارت قرمز", "text-rose-300 bg-rose-400/10"],
  started: [Zap, "شروع", "text-cyan-300 bg-cyan-400/10"],
  substitution: [Repeat2, "تعویض", "text-sky-300 bg-sky-400/10"],
  "result-changed": [Trophy, "نتیجه", "text-lime-300 bg-lime-400/10"],
  result: [Trophy, "پایان", "text-amber-300 bg-amber-400/10"],
  live: [Flame, "زنده", "text-red-300 bg-red-400/10"],
  match: [Clock3, "بازی", "text-slate-300 bg-white/5"],
};

export default function LiveAlertsPage() {
  const [favorites, setFavorites] = useState(readFavorites());
  const [settings, setSettings] = useState(readSettings());
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (manual = false) => {
    if (manual) setRefreshing(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/football/smart-notifications?teams=${encodeURIComponent(favorites.join(","))}`, { cache: "no-store" });
      const data = await response.json();
      const next = Array.isArray(data.notifications) ? data.notifications : [];
      setAlerts(settings.liveAlerts ? next.filter((item) => item.is_live_alert !== false) : []);
    } catch { setAlerts([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const sync = () => { setFavorites(readFavorites()); setSettings(readSettings()); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("fot10-profile-changed", sync);
    window.addEventListener("fot10-settings-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("fot10-profile-changed", sync);
      window.removeEventListener("fot10-settings-changed", sync);
    };
  }, []);

  useEffect(() => { if (favorites.length) load(); else { setAlerts([]); setLoading(false); } }, [favorites.join("|"), settings.liveAlerts]);
  useEffect(() => { if (!favorites.length || !settings.liveAlerts) return; const id = setInterval(() => load(), 30000); return () => clearInterval(id); }, [favorites.join("|"), settings.liveAlerts]);

  const urgent = useMemo(() => alerts.filter((item) => Number(item.priority) >= 90), [alerts]);

  return <main className="min-h-screen bg-[#05070d] text-white">
    <div className="fot-container pb-24">
      <header className="flex items-center justify-between py-5">
        <Link href="/notifications" className="glass rounded-2xl px-3 py-2 text-xs font-bold inline-flex items-center gap-2"><ChevronLeft size={16}/> اعلان‌ها</Link>
        <div className="text-right"><div className="text-[10px] text-red-300 font-black tracking-widest">LIVE ALERTS</div><h1 className="text-xl font-black">هشدار لحظه‌ای تیم‌های محبوب</h1></div>
      </header>

      <section className="rounded-3xl border border-red-400/15 bg-gradient-to-br from-red-500/[.10] via-white/[.025] to-transparent p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-300 grid place-items-center"><Bell size={22}/></div><div><h2 className="font-black">نبض هشدار FOT10</h2><p className="text-[10px] text-slate-500 mt-1">اولویت‌بندی خودکار؛ اتفاق‌های مهم همیشه بالاتر.</p></div></div>
          <button onClick={() => load(true)} disabled={refreshing} className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="به‌روزرسانی"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/></button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-red-500/10 p-3"><b className="block text-lg text-red-200">{alerts.length}</b><span className="text-[8px] text-slate-500">هشدار</span></div><div className="rounded-2xl bg-amber-400/10 p-3"><b className="block text-lg text-amber-200">{urgent.length}</b><span className="text-[8px] text-slate-500">فوری</span></div><div className="rounded-2xl bg-emerald-400/10 p-3"><b className="block text-lg text-emerald-200">{favorites.length}</b><span className="text-[8px] text-slate-500">تیم محبوب</span></div></div>
      </section>

      {!favorites.length ? <section className="glass card mt-5 p-7 text-center"><Flame className="mx-auto text-slate-500" size={30}/><h2 className="mt-3 font-black">هنوز تیم محبوبی نداری</h2><p className="mt-2 text-xs text-slate-500">از حساب من تیم‌هایت را انتخاب کن تا هشدارهای اختصاصی دریافت کنی.</p><Link href="/account" className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950">انتخاب تیم محبوب</Link></section> : !settings.liveAlerts ? <section className="glass card mt-5 p-7 text-center"><Bell className="mx-auto text-slate-500" size={30}/><h2 className="mt-3 font-black">هشدار لحظه‌ای خاموش است</h2><p className="mt-2 text-xs text-slate-500">از تنظیمات FOT10 گزینه هشدارهای زنده را فعال کن.</p><Link href="/settings" className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950">رفتن به تنظیمات</Link></section> : loading ? <section className="glass card mt-5 p-8 text-center text-xs text-slate-500">در حال دریافت هشدارهای واقعی تیم‌های محبوب…</section> : !alerts.length ? <section className="glass card mt-5 p-8 text-center text-xs text-slate-500">فعلاً هشدار لحظه‌ای برای تیم‌های محبوبت پیدا نشد.</section> : <section className="mt-5 space-y-3">{alerts.map((item) => { const [Icon, badge, tone] = visual[item.kind] || [Bell, "اعلان", "text-slate-300 bg-white/5"]; const urgentItem = Number(item.priority) >= 90; return <Link key={item.id} href={item.match_id ? `/matches/${item.match_id}` : "/matches?live=1"} className={`glass card block p-4 active:scale-[.99] transition ${urgentItem ? "ring-1 ring-red-400/20" : ""}`}><div className="flex items-start gap-3"><div className={`h-11 w-11 shrink-0 rounded-2xl grid place-items-center ${tone}`}><Icon size={19}/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><span className={`rounded-full px-2 py-1 text-[8px] font-black ${tone}`}>{badge}</span>{urgentItem && <span className="rounded-full bg-red-500/10 px-2 py-1 text-[8px] font-black text-red-300">فوری</span>}<span className="text-[8px] text-slate-600">اولویت {item.priority}</span></div><h3 className="mt-2 text-sm font-black leading-6">{item.title}</h3><p className="mt-1 text-[10px] leading-5 text-slate-500">{item.body}</p></div><span className="text-[9px] text-emerald-300">›</span></div></Link>; })}</section>}
    </div>
  </main>;
}
