"use client";

import { Activity, ChevronLeft } from "lucide-react";
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

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.05)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={17} className="text-slate-700" />
            <h2 className="text-sm font-black text-slate-950">وضعیت مسابقات</h2>
          </div>
          <p className="mt-1 text-[9px] font-bold text-slate-400">{today} · داده‌های مسابقات منتخب</p>
        </div>
        <Link href="/matches" className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[8px] font-black text-slate-600">
          نمایش همه <ChevronLeft size={11} className="inline" />
        </Link>
      </div>

      <Link href="/matches?live=1" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-slate-300">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-slate-700 shadow-sm"><Activity size={15} /></span>
          <div>
            <div className="text-[10px] font-black text-slate-950">بازی‌های زنده</div>
            <div className="mt-0.5 text-[8px] font-bold text-slate-400">به‌روزرسانی خودکار هر ۳۰ ثانیه</div>
          </div>
        </div>
        <div className="text-left">
          <div className="text-lg font-black tabular-nums text-slate-900">{liveCount === null ? "—" : liveCount}</div>
          <div className="text-[7px] font-black text-slate-400">مسابقه زنده</div>
        </div>
      </Link>
    </section>
  );
}
