"use client";

import { useState } from "react";
import { ChevronDown, Crown, Shield, Trophy } from "lucide-react";

const leagues = ["لیگ برتر ایران", "Champions League", "Premier League", "LaLiga"];
const rows = [
  ["1", "Barcelona", "30", "24", "4", "2", "76", "+48"],
  ["2", "Real Madrid", "30", "22", "5", "3", "71", "+39"],
  ["3", "Atletico Madrid", "30", "18", "7", "5", "61", "+24"],
  ["4", "Arsenal", "29", "17", "6", "6", "57", "+27"],
  ["5", "Liverpool", "30", "16", "8", "6", "56", "+21"],
  ["6", "Man City", "30", "15", "7", "8", "52", "+18"],
];

export default function StandingsPage() {
  const [league, setLeague] = useState(leagues[0]);
  return (
    <main className="mobile-shell pb-10">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070a12]/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-emerald-400">FOT10 • TABLE</p><h1 className="mt-1 text-xl font-black">جدول مسابقات</h1></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><Trophy size={20}/></div>
        </div>
      </header>
      <section className="px-5 pt-5">
        <div className="relative">
          <select value={league} onChange={e=>setLeague(e.target.value)} className="w-full appearance-none rounded-2xl border border-white/10 bg-[#111827] px-4 py-4 pl-11 text-sm font-bold outline-none">
            {leagues.map(x=><option key={x}>{x}</option>)}
          </select><ChevronDown className="pointer-events-none absolute left-4 top-4 text-slate-400" size={20}/>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[['30','بازی'],['76','امتیاز'],['+48','تفاضل']].map(([a,b])=><div key={b} className="glass rounded-2xl p-3 text-center"><b className="text-lg">{a}</b><p className="mt-1 text-[11px] text-slate-500">{b}</p></div>)}
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]">
          <div className="grid grid-cols-[38px_1fr_35px_35px_35px_48px] gap-1 border-b border-white/10 px-3 py-3 text-[10px] text-slate-500"><span>#</span><span>تیم</span><span>ب</span><span>پ</span><span>م</span><span>امتیاز</span></div>
          {rows.map((r,i)=><div key={r[0]} className="grid grid-cols-[38px_1fr_35px_35px_35px_48px] items-center gap-1 border-b border-white/5 px-3 py-4 last:border-0">
            <span className={`text-sm font-black ${i<2?'text-emerald-400':'text-slate-500'}`}>{r[0]}</span>
            <div className="flex min-w-0 items-center gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/5"><Shield size={15}/></div><span className="truncate text-xs font-bold">{r[1]}</span></div>
            <span className="text-xs text-slate-400">{r[2]}</span><span className="text-xs text-slate-400">{r[3]}</span><span className="text-xs text-slate-400">{r[5]}</span><span className="text-sm font-black">{r[6]}</span>
          </div>)}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4 text-xs text-slate-400"><Crown size={18} className="text-amber-300"/> جایگاه‌ها و آمار این نسخه نمونه هستند و پس از اتصال منبع رسمی داده به‌صورت زنده به‌روزرسانی می‌شوند.</div>
      </section>
    </main>
  );
}
