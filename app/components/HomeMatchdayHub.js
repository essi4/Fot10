"use client";

import { ChevronLeft, Flame } from "lucide-react";
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

  return <section className="mt-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.045] to-white/[.015] p-3.5 shadow-xl">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2"><Flame size={15} className="text-orange-300"/><h2 className="text-sm font-black">مرکز مسابقه</h2></div>
        <p className="mt-1 text-[9px] font-bold text-slate-600">{today} · مسیر سریع دنبال‌کردن فوتبال</p>
      </div>
      <Link href="/matches" className="rounded-xl border border-white/10 bg-white/[.035] px-2.5 py-2 text-[8px] font-black text-slate-400">نمایش همه <ChevronLeft size={11} className="inline"/></Link>
    </div>

    <Link href="/matches?live=1" className="flex items-center justify-between rounded-2xl border border-red-400/15 bg-red-500/[.07] px-3 py-2.5 transition hover:border-red-400/30">
      <div className="flex items-center gap-2.5"><span className="relative grid h-8 w-8 place-items-center rounded-xl bg-red-500/10"><span className="absolute h-2 w-2 animate-ping rounded-full bg-red-400/70"/><span className="relative h-2 w-2 rounded-full bg-red-400"/></span><div><div className="text-[10px] font-black text-white">پالس زنده</div><div className="mt-0.5 text-[8px] font-bold text-slate-500">به‌روزرسانی خودکار هر ۳۰ ثانیه</div></div></div>
      <div className="text-left"><div className="text-lg font-black tabular-nums text-red-300">{liveCount === null ? "—" : liveCount}</div><div className="text-[7px] font-black text-red-300/70">مسابقه زنده</div></div>
    </Link>
  </section>;
}
