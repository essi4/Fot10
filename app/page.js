"use client";

import { BarChart3, ChevronLeft, Medal, Search, Shield, Sparkles, Trophy, Users, Zap, Newspaper, Radio, Star } from "lucide-react";
import Link from "next/link";
import HomeMatchdayHub from "./components/HomeMatchdayHub";
import HomeNews from "./components/HomeNews";

const quickNav = [
  ["نتایج زنده", Radio, "/matches?live=1"],
  ["لیگ‌ها و جدول", Trophy, "/leagues"],
  ["تیم‌ها", Shield, "/teams"],
  ["بازیکنان", Users, "/players"],
  ["آمار فوتبال", BarChart3, "/stats"],
  ["برترین‌ها", Medal, "/players"],
  ["اخبار", Newspaper, "/news"],
  ["علاقه‌مندی‌ها", Star, "/favorites"],
];

const intelligence = [
  ["نبض زنده", "بازی‌های در جریان و تغییرات لحظه‌ای", "/matches?live=1", Radio, "red"],
  ["جدول واقعی", "رتبه، امتیاز، فرم و تفاضل گل", "/standings", Trophy, "cyan"],
  ["جستجوی هوشمند", "تیم، بازیکن، لیگ یا کشور", "/search", Search, "violet"],
  ["AI Match Intelligence", "تحلیل سناریو و مقایسه مدل‌ها", "/ai-lab", Sparkles, "emerald"],
];

export default function HomePage() {
  return (
    <main className="fot-container pb-28" dir="rtl">
      <header className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#07101d] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_95%_100%,rgba(16,185,129,.14),transparent_30%)]" />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-[19px] font-black italic text-slate-950 shadow-[0_8px_30px_rgba(34,211,238,.2)]">10</div>
              <div><div className="text-xl font-black tracking-tight">FOT<span className="text-cyan-300">10</span></div><div className="text-[8px] font-bold text-slate-500">Football Intelligence Hub</div></div>
            </Link>
            <Link href="/search" aria-label="جستجوی سراسری" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300"><Search size={18}/></Link>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center gap-2 text-[9px] font-black text-cyan-300"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse"/> FOOTBALL · NOW</div>
            <h1 className="max-w-[600px] text-[28px] font-black leading-[1.2] tracking-tight sm:text-[36px]">نبض فوتبال، نه فقط نتیجه</h1>
            <p className="mt-3 max-w-[600px] text-[10px] font-bold leading-6 text-slate-400">بازی زنده، جدول واقعی، تیم، بازیکن، خبر و تحلیل هوشمند؛ همه در یک تجربه سریع و یکپارچه.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {intelligence.map(([title, desc, href, Icon, tone]) => (
              <Link key={title} href={href} className={`group rounded-2xl border p-3 transition hover:-translate-y-0.5 ${tone==="red"?"border-red-400/15 bg-red-500/[.06]":tone==="cyan"?"border-cyan-300/15 bg-cyan-400/[.05]":tone==="violet"?"border-violet-300/15 bg-violet-400/[.05]":"border-emerald-300/15 bg-emerald-400/[.05]"}`}>
                <Icon size={17} className={tone==="red"?"text-red-300":tone==="cyan"?"text-cyan-300":tone==="violet"?"text-violet-300":"text-emerald-300"}/>
                <b className="mt-3 block text-[10px] text-white">{title}</b>
                <span className="mt-1 block text-[7px] font-bold leading-4 text-slate-500">{desc}</span>
                <span className="mt-2 flex items-center gap-1 text-[7px] font-black text-slate-500 group-hover:text-white">ورود <ChevronLeft size={10}/></span>
              </Link>
            ))}
          </div>
        </div>
        <div className="relative grid grid-cols-3 border-t border-white/10 bg-black/10">
          <Link href="/matches" className="py-3 text-center text-[9px] font-black text-slate-300">بازی‌ها</Link>
          <Link href="/standings" className="border-x border-white/10 py-3 text-center text-[9px] font-black text-slate-300">جدول‌ها</Link>
          <Link href="/players" className="py-3 text-center text-[9px] font-black text-slate-300">بازیکنان</Link>
        </div>
      </header>

      <HomeMatchdayHub />
      <HomeNews />

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between"><div><h2 className="text-sm font-black">FOT10 Intelligence</h2><p className="mt-1 text-[9px] font-bold text-slate-600">لایه‌ای فراتر از نتیجه مسابقه</p></div><Link href="/ai-lab" className="text-[8px] font-black text-emerald-300">آزمایشگاه AI</Link></div>
        <div className="rounded-3xl border border-emerald-300/10 bg-gradient-to-br from-emerald-400/[.07] to-cyan-400/[.03] p-4 shadow-xl">
          <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Sparkles size={19}/></div><div><h3 className="text-sm font-black">تحلیل کن، فقط نگاه نکن</h3><p className="mt-1 text-[9px] font-bold leading-5 text-slate-500">سناریو، UX فوتبال، داده و تحلیل مدل‌ها را در AI Lab آزمایش کن.</p></div></div>
          <Link href="/ai-lab" className="mt-4 flex items-center justify-between rounded-2xl border border-white/7 bg-black/10 px-3 py-3 text-[9px] font-black text-slate-200"><span>ورود به AI Match Intelligence</span><ChevronLeft size={14}/></Link>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3"><h2 className="text-sm font-black">همه FOT10</h2><p className="mt-1 text-[9px] font-bold text-slate-600">دسترسی سریع به تمام بخش‌های فوتبال</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickNav.map(([label, Icon, href]) => <Link key={label} href={href} className="group flex items-center gap-2.5 rounded-2xl border border-white/8 bg-[#0a1422] p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/20"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.04] text-cyan-300"><Icon size={17}/></span><span className="min-w-0 flex-1 truncate text-[10px] font-black">{label}</span><ChevronLeft size={12} className="text-slate-700 group-hover:text-white"/></Link>)}
        </div>
      </section>
    </main>
  );
}
