"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronLeft, Heart, Languages, Moon, ShieldCheck, Star, Trophy, UserRound, Zap } from "lucide-react";

const teams = ["پرسپولیس", "رئال مادرید", "بارسلونا", "آرسنال", "بایرن مونیخ", "منچسترسیتی"];
const leagues = ["لیگ برتر ایران", "لیگ قهرمانان اروپا", "پریمیر لیگ", "لالیگا", "بوندسلیگا", "سری آ"];

export default function AccountPage() {
  const [name, setName] = useState("");
  const [favorites, setFavorites] = useState(["پرسپولیس", "رئال مادرید"]);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("fot10-profile") || "{}");
      if (data.name) setName(data.name);
      if (Array.isArray(data.favorites)) setFavorites(data.favorites);
      if (typeof data.notifications === "boolean") setNotifications(data.notifications);
    } catch {}
  }, []);

  function persist(next = {}) {
    const data = { name, favorites, notifications, ...next };
    localStorage.setItem("fot10-profile", JSON.stringify(data));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  function toggleFavorite(item) {
    const next = favorites.includes(item) ? favorites.filter(x => x !== item) : [...favorites, item];
    setFavorites(next);
    persist({ favorites: next });
  }

  return (
    <main className="fot-shell min-h-screen">
      <div className="fot-container pb-10 space-y-4">
        <header className="flex items-center justify-between pt-1">
          <a href="/" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">← خانه</a>
          <div className="text-right"><div className="text-[10px] text-slate-500">FOT10</div><h1 className="text-xl font-black">حساب من</h1></div>
        </header>

        <section className="glass card p-5 relative overflow-hidden">
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-emerald-300 to-cyan-500 text-slate-950 grid place-items-center shadow-xl shadow-emerald-500/10"><UserRound size={28} /></div>
            <div className="min-w-0 flex-1"><div className="text-[10px] text-emerald-300 font-bold">شخصی‌سازی FOT10</div><div className="text-xl font-black mt-1 truncate">{name || "مهمان FOT10"}</div><div className="text-[10px] text-slate-500 mt-1">ورود اختیاری • بدون اجبار به ثبت‌نام</div></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5"><Mini n={favorites.length} t="مورد علاقه" /><Mini n="۲۴/۷" t="پوشش فوتبال" /><Mini n="PRO" t="تجربه شخصی" /></div>
        </section>

        <section className="glass card p-5">
          <div className="flex items-center gap-3 mb-4"><Zap size={18} className="text-emerald-400"/><div><h2 className="font-black">پروفایل</h2><p className="text-[10px] text-slate-500 mt-1">نامی که در تجربه FOT10 نمایش داده می‌شود</p></div></div>
          <input value={name} onChange={e => setName(e.target.value)} onBlur={() => persist()} className="glass w-full rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-400/20 text-sm" placeholder="اسم شما" />
          <button onClick={() => persist()} className="w-full mt-3 rounded-2xl bg-emerald-400 text-slate-950 py-3 font-black text-sm active:scale-[.99] transition">{saved ? "ذخیره شد ✓" : "ذخیره پروفایل"}</button>
        </section>

        <section className="glass card p-5">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Heart size={18} className="text-rose-300"/><h2 className="font-black">تیم‌های محبوب</h2></div><span className="text-[10px] text-slate-500">با یک لمس</span></div>
          <div className="flex flex-wrap gap-2">{teams.map(team => <button key={team} onClick={() => toggleFavorite(team)} className={`rounded-full px-3.5 py-2 text-xs font-bold border transition ${favorites.includes(team) ? "bg-emerald-400 text-slate-950 border-emerald-400" : "bg-white/[.03] text-slate-400 border-white/10"}`}>{favorites.includes(team) ? "★ " : "☆ "}{team}</button>)}</div>
        </section>

        <section className="glass card p-5">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Trophy size={18} className="text-amber-300"/><h2 className="font-black">لیگ‌های مورد علاقه</h2></div></div>
          <div className="space-y-2">{leagues.map(league => <div key={league} className="flex items-center justify-between rounded-2xl bg-white/[.035] p-3"><span className="text-xs font-bold">{league}</span><Star size={17} className="text-slate-500" /></div>)}</div>
        </section>

        <section className="glass card p-5 space-y-2">
          <Setting icon={Bell} title="اعلان‌های بازی" sub="شروع بازی، گل و پایان مسابقه" active={notifications} onClick={() => { const next = !notifications; setNotifications(next); persist({ notifications: next }); }} />
          <Setting icon={Languages} title="زبان" sub="فارسی • آماده برای انگلیسی" />
          <Setting icon={Moon} title="ظاهر" sub="تم حرفه‌ای تیره" />
          <Setting icon={ShieldCheck} title="حریم خصوصی" sub="حساب واقعی در مرحله اتصال احراز هویت فعال می‌شود" />
        </section>

        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.04] p-4 text-[10px] leading-5 text-slate-500">نسخه فعلی این صفحه، تجربه پروفایل و شخصی‌سازی را بدون ساخت حساب اجباری فعال می‌کند. در مرحله بعد، ورود امن با OTP و ذخیره‌سازی ابری را به آن وصل می‌کنیم؛ اطلاعات ساختگی به‌عنوان حساب واقعی نمایش داده نمی‌شود.</div>
      </div>
    </main>
  );
}

function Mini({ n, t }) { return <div className="rounded-2xl bg-white/[.045] p-3 text-center"><div className="font-black">{n}</div><div className="text-[9px] text-slate-500 mt-1">{t}</div></div>; }
function Setting({ icon: Icon, title, sub, active, onClick }) { return <button onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl p-3 text-right hover:bg-white/[.03] transition"><div className="h-10 w-10 rounded-xl bg-white/[.045] grid place-items-center text-emerald-300"><Icon size={17}/></div><div className="flex-1 min-w-0"><div className="text-xs font-black">{title}</div><div className="text-[9px] text-slate-500 mt-1 truncate">{sub}</div></div>{typeof active === "boolean" && <span className={`h-6 w-11 rounded-full p-1 ${active ? "bg-emerald-400" : "bg-white/10"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`} /></span>}{onClick && active === undefined && <ChevronLeft size={15} className="text-slate-600"/>}</button>; }
