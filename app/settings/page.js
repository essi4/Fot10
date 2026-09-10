"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Check, ChevronLeft, Globe2, Info, LockKeyhole, Moon, Palette, ShieldCheck, SlidersHorizontal, Smartphone, Trophy, Zap } from "lucide-react";

const DEFAULTS = { notifications: true, liveAlerts: true, autoRefresh: true, compactScores: true, darkMode: true };
const SETTINGS_KEY = "fot10-settings";

function Toggle({ value, onChange, label }) {
  return <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className={`relative h-7 w-12 shrink-0 rounded-full border transition ${value ? "border-emerald-300/30 bg-emerald-400/20" : "border-white/10 bg-white/5"}`}><span className={`absolute top-1 h-5 w-5 rounded-full transition-all ${value ? "right-1 bg-emerald-300" : "right-6 bg-slate-600"}`} /></button>;
}

function SettingRow({ icon: Icon, title, desc, value, onChange, tone = "emerald" }) {
  const toneClass = tone === "cyan" ? "border-cyan-300/15 bg-cyan-400/10 text-cyan-300" : tone === "yellow" ? "border-yellow-300/15 bg-yellow-400/10 text-yellow-300" : "border-emerald-300/15 bg-emerald-400/10 text-emerald-300";
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3.5"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${toneClass}`}><Icon size={18}/></div><div className="min-w-0 flex-1 text-right"><div className="text-[11px] font-black text-slate-100">{title}</div><div className="mt-1 text-[8px] font-bold text-slate-600">{desc}</div></div><Toggle value={value} onChange={onChange} label={title}/></div>;
}

function broadcastSettings(next) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); window.dispatchEvent(new Event("fot10-settings-changed")); } catch {}
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); if (saved) setSettings({ ...DEFAULTS, ...saved }); } catch {}
    setReady(true);
  }, []);

  useEffect(() => { if (ready) broadcastSettings(settings); }, [settings, ready]);

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  const reset = () => setSettings(DEFAULTS);

  return <main className="fot-container min-h-screen pb-10">
    <header className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#10251e] via-[#0b1517] to-[#080c15] p-5 shadow-2xl"><div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"/><div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl"/><div className="relative flex items-center justify-between gap-3"><Link href="/" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-slate-300"><ChevronLeft size={19}/></Link><div className="text-right"><p className="text-[9px] font-black tracking-widest text-emerald-300">FOT10 · CONTROL CENTER</p><h1 className="mt-1 text-2xl font-black">تنظیمات</h1></div><div className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300"><SlidersHorizontal size={21}/></div></div><p className="relative mt-4 text-[10px] leading-5 text-slate-400">کنترل کامل تجربه FOT10؛ تغییرات شما همین‌جا روی دستگاه ذخیره می‌شوند و بخش‌های برنامه فوراً از آن مطلع می‌شوند.</p></header>
    <section className="mt-4 space-y-2.5"><div className="mb-2 px-1"><h2 className="text-xs font-black">اعلان و مسابقات</h2><p className="mt-1 text-[8px] text-slate-600">تنظیمات فوری برای تجربه زنده فوتبال</p></div><SettingRow icon={Bell} title="اعلان‌ها" desc="دریافت اعلان‌های مهم FOT10" value={settings.notifications} onChange={(v) => set("notifications", v)}/><SettingRow icon={Zap} title="هشدار بازی زنده" desc="وقتی مسابقه وارد حالت زنده شد اطلاع بده" value={settings.liveAlerts} onChange={(v) => set("liveAlerts", v)} tone="cyan"/><SettingRow icon={SlidersHorizontal} title="به‌روزرسانی خودکار" desc="اطلاعات مسابقات را خودکار تازه کن" value={settings.autoRefresh} onChange={(v) => set("autoRefresh", v)} tone="yellow"/><SettingRow icon={Trophy} title="نمایش فشرده نتایج" desc="کارت‌های مسابقات مرتب و کم‌حجم نمایش داده شوند" value={settings.compactScores} onChange={(v) => set("compactScores", v)}/></section>
    <section className="mt-5"><div className="mb-2 px-1"><h2 className="text-xs font-black">ظاهر برنامه</h2><p className="mt-1 text-[8px] text-slate-600">ظاهر مورد علاقه‌ات را انتخاب کن</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-3.5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-300"><Moon size={18}/></div><div className="flex-1 text-right"><div className="text-[11px] font-black">حالت تیره</div><div className="mt-1 text-[8px] text-slate-600">حالت فعلی و مناسب استفاده شبانه</div></div><Toggle value={settings.darkMode} onChange={(v) => set("darkMode", v)} label="حالت تیره"/></div></div><div className="mt-2.5 grid grid-cols-2 gap-2.5"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[.06] p-3.5"><Palette size={16} className="text-emerald-300"/><p className="mt-2 text-[10px] font-black">تم FOT10</p><p className="mt-1 text-[8px] text-slate-600">سبز · تیره · حرفه‌ای</p></div><div className="rounded-2xl border border-violet-300/10 bg-violet-400/[.04] p-3.5"><Globe2 size={16} className="text-violet-300"/><p className="mt-2 text-[10px] font-black">زبان</p><p className="mt-1 text-[8px] text-slate-600">فارسی</p></div></div></section>
    <section className="mt-5 rounded-2xl border border-blue-300/10 bg-blue-400/[.035] p-4"><div className="flex items-center gap-3"><ShieldCheck size={19} className="text-blue-300"/><div><h2 className="text-[11px] font-black">حریم خصوصی</h2><p className="mt-1 text-[8px] leading-5 font-bold text-slate-600">تنظیمات این صفحه به‌صورت محلی روی همین دستگاه ذخیره می‌شوند.</p></div></div></section>
    <button type="button" onClick={reset} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.025] py-3 text-[9px] font-black text-slate-500 transition hover:text-emerald-300"><Check size={14}/> بازگردانی تنظیمات پیش‌فرض</button><footer className="mt-5 flex items-center justify-center gap-2 text-[8px] font-bold text-slate-700"><Smartphone size={12}/> FOT10 <span>•</span> <Info size={12}/> مرکز کنترل برنامه <LockKeyhole size={12}/></footer>
  </main>;
}
