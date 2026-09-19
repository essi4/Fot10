"use client";

import { useEffect, useMemo, useState } from "react";
import { LEAGUE_ENTRIES } from "../../lib/fot10-universe";
import { ChevronDown, Crown, Shield, Trophy } from "lucide-react";

const leagues = LEAGUE_ENTRIES.filter((item) => item.leagueId).slice(0, 16);
const SEASON = "2026";
use client";

import { useEffect, useMemo, useState } from "react";
import { LEAGUE_ENTRIES } from "../../lib/fot10-universe";
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
  const [leagueId, setLeagueId] = useState(String(leagues[0]?.leagueId || 195));
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const league = useMemo(() => leagues.find((x) => String(x.leagueId) === leagueId) || leagues[0], [leagueId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    fetch(`/api/football/standings?league=${leagueId}&season=${SEASON}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload.ok) throw new Error(payload.error?.message || payload.error || "دریافت جدول ناموفق بود");
        setTable(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch((err) => { if (!cancelled) setError(err.message || "ارتباط با سرویس جدول برقرار نشد."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [leagueId]);

  return (
    <main className="mobile-shell pb-10" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#070a12]/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-emerald-400">FOT10 • TABLE</p><h1 className="mt-1 text-xl font-black">جدول لیگ</h1><p className="mt-1 text-[10px] text-slate-500">جدول واقعی و به‌روز مسابقات</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><Trophy size={20}/></div>
        </div>
      </header>
      <section className="px-5 pt-5">
        <div className="relative">
          <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)} className="w-full appearance-none rounded-2xl border border-white/10 bg-[#111827] px-4 py-4 pl-11 text-sm font-bold outline-none">
            {leagues.map((x) => <option key={x.leagueId} value={x.leagueId}>{x.flag} {x.leagueName}</option>)}
          </select><ChevronDown className="pointer-events-none absolute left-4 top-4 text-slate-400" size={20}/>
        </div>

        {error && <div className="mt-3 rounded-2xl border border-amber-400/10 bg-amber-400/5 p-3 text-[10px] text-amber-200">{error}</div>}

        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]">
          <div className="border-b border-white/10 px-4 py-3"><b className="text-sm">{league?.leagueName || "جدول"}</b><p className="mt-1 text-[9px] text-slate-500">فصل {SEASON}</p></div>
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[38px_1fr_38px_38px_38px_38px_55px_55px_78px] gap-1 border-b border-white/10 px-3 py-3 text-[9px] text-slate-500"><span>#</span><span>تیم</span><span>ب</span><span>برد</span><span>مساوی</span><span>باخت</span><span>تفاضل</span><span>امتیاز</span><span>فرم</span></div>
              {loading ? <div className="p-10 text-center text-xs text-slate-500">در حال دریافت جدول واقعی…</div> : table.length ? table.map((r, i) => {
                const a = r.all || {}, diff = Number(r.goalsDiff ?? ((a.goals?.for || 0) - (a.goals?.against || 0)));
                const form = String(r.form || "").slice(-5).split("");
                return <div key={r.team?.id || i} className="grid grid-cols-[38px_1fr_38px_38px_38px_38px_55px_55px_78px] items-center gap-1 border-b border-white/5 px-3 py-3 last:border-0">
                  <span className={`text-sm font-black ${i === 0 ? "text-emerald-400" : "text-slate-500"}`}>{r.rank || i + 1}</span>
                  <div className="flex min-w-0 items-center gap-2"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/5">{r.team?.logo ? <img src={r.team.logo} alt="" className="h-7 w-7 object-contain" /> : <Shield size={15}/>}</div><span className="truncate text-xs font-bold">{r.team?.name || "—"}</span></div>
                  <span className="text-center text-xs text-slate-400">{a.played ?? 0}</span><span className="text-center text-xs text-slate-400">{a.win ?? 0}</span><span className="text-center text-xs text-slate-400">{a.draw ?? 0}</span><span className="text-center text-xs text-slate-400">{a.lose ?? 0}</span>
                  <span className={`text-center text-xs ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-400"}`}>{diff > 0 ? "+" : ""}{diff}</span><span className="text-center text-sm font-black">{r.points ?? 0}</span>
                  <div className="flex justify-center gap-1">{form.map((v,j)=><i key={j} className={`grid h-4 w-4 place-items-center rounded text-[6px] font-black ${v==="W"?"bg-emerald-400 text-black":v==="D"?"bg-amber-300 text-black":"bg-red-400 text-black"}`}>{v}</i>)}</div>
                </div>;
              }) : <div className="p-10 text-center text-xs text-slate-500">جدول برای این لیگ موجود نیست.</div>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}\n