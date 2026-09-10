"use client";

import { BarChart3, CalendarDays, ChevronLeft, Flame, Search, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const LIVE = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);

export default function HomeMatchdayHub() {
  const [liveCount, setLiveCount] = useState(null);
  const today = useMemo(() => new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()), []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/football/live?t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json();
        const count = Array.isArray(json.matches)
          ? json.matches.filter((m) => LIVE.has(String(m?.statusShort || m?.status || "").toUpperCase())).length
          : 0;
        if (alive) setLiveCount(count);
      } catch {
        if (alive) setLiveCount(null);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const items = [
    { label: "بازی‌های امروز", hint: "برنامه و نتایج", href: "/matches", icon: CalendarDays, tone: "text-sky-300 bg-sky-400/10 border-sky-300/10" },
    { label: "لیگ‌های مهم", hint: "جدول و بازی‌ها", href: "/leagues", icon: Trophy, tone: "text-yellow-300 bg-yellow-300/10 border-yellow-300/10" },
    { label: "بازیکنان", hint: "فرم و آمار", href: "/players", icon: UserRound, tone: "text-violet-300 bg-violet-400/10 border-violet-300/10" },
    { label: "آمار و ارقام", hint: "تحلیل فوتبال", href: "/stats", icon: BarChart3, tone: "text-emerald-300 bg-emerald-400/10 border-emerald-300/10" },
  ];

  return <section className="mt-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.045] to-white/[.015] p-3.5 shadow-xl">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2"><Flame size={15} className="text-orange-300"/><h2 className="text-sm font-black">مرکز مسابقه</h2></div>
        <p className="mt-1 text-[9px] font-bold text-slate-600">{today} · مسیر سریع دنبال‌کردن فوتبال</p>
      </div>
      <Link href="/matches" className="rounded-xl border border-white/10 bg-white/[.035] px-2.5 py-2 text-[8px] font-black text-slate-400">نمایش همه <ChevronLeft size={11} className="inline"/></Link>
    </div>

    <Link href="/matches?live=1" className="mb-3 flex items-center justify-between rounded-2xl border border-red-400/15 bg-red-500/[.07] px-3 py-2.5 transition hover:border-red-400/30">
      <div className="flex items-center gap-2.5"><span className="relative grid h-8 w-8 place-items-center rounded-xl bg-red-500/10"><span className="absolute h-2 w-2 animate-ping rounded-full bg-red-400/70"/><span className="relative h-2 w-2 rounded-full bg-red-400"/></span><div><div className="text-[10px] font-black text-white">پالس زنده</div><div className="mt-0.5 text-[8px] font-bold text-slate-500">به‌روزرسانی خودکار هر ۳۰ ثانیه</div></div></div>
      <div className="text-left"><div className="text-lg font-black tabular-nums text-red-300">{liveCount === null ? "—" : liveCount}</div><div className="text-[7px] font-black text-red-300/70">مسابقه زنده</div></div>
    </Link>

    <div className="grid grid-cols-2 gap-2">
      {items.map(({ label, hint, href, icon: Icon, tone }) => <Link key={href} href={href} className="group rounded-2xl border border-white/8 bg-black/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/[.045] active:scale-[.98]">
        <div className={`grid h-9 w-9 place-items-center rounded-xl border ${tone}`}><Icon size={17}/></div>
        <div className="mt-2.5 flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-[10px] font-black text-slate-100">{label}</div><div className="mt-1 truncate text-[8px] font-bold text-slate-600">{hint}</div></div><ChevronLeft size={12} className="shrink-0 text-slate-700 transition group-hover:-translate-x-1"/></div>
      </Link>)}
    </div>

    <Link href="/stats" className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/10 bg-emerald-400/[.035] py-2.5 text-[9px] font-black text-emerald-300"><Search size={13}/> جستجو و کشف فوتبال</Link>
  </section>;
}
