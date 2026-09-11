"use client";

import Link from "next/link";
import { Activity, CalendarDays, ShieldCheck, TrendingUp } from "lucide-react";

function resultClass(result) {
  if (result === "W") return "bg-emerald-400/15 text-emerald-300 border-emerald-400/20";
  if (result === "D") return "bg-amber-300/15 text-amber-200 border-amber-300/20";
  if (result === "L") return "bg-rose-400/15 text-rose-300 border-rose-400/20";
  return "bg-white/[.05] text-slate-400 border-white/10";
}

export default function TeamCenterInsights({ team = {}, league = {}, fixtures = [], form = "—", played = 0, wins = 0, draws = 0, loses = 0 }) {
  const winRate = played ? Math.round((wins / played) * 100) : 0;
  const results = String(form || "—").split("").filter((value) => ["W", "D", "L"].includes(value));
  const next = fixtures.find((match) => match?.date && new Date(match.date).getTime() > Date.now());
  const recent = fixtures.filter((match) => match?.date && new Date(match.date).getTime() <= Date.now()).slice(-3).reverse();

  return (
    <section className="glass rounded-[24px] p-4 sm:p-5 space-y-4" aria-label="بینش‌های تیم">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] text-cyan-300 font-bold tracking-widest">TEAM PULSE</p>
          <h2 className="font-black mt-1">نبض تیم</h2>
          <p className="text-[10px] text-slate-500 mt-1">{league?.name || "رقابت"} · فصل جاری</p>
        </div>
        <div className="rounded-2xl bg-cyan-400/10 border border-cyan-300/15 px-3 py-2 text-center">
          <TrendingUp size={15} className="mx-auto text-cyan-300" />
          <b className="block text-sm mt-1">{winRate}٪</b>
          <span className="text-[8px] text-slate-500">نرخ برد</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/[.035] border border-white/5 p-3"><span className="text-[9px] text-slate-500">برد</span><b className="block text-lg mt-1 text-emerald-300">{wins}</b></div>
        <div className="rounded-2xl bg-white/[.035] border border-white/5 p-3"><span className="text-[9px] text-slate-500">مساوی</span><b className="block text-lg mt-1 text-amber-200">{draws}</b></div>
        <div className="rounded-2xl bg-white/[.035] border border-white/5 p-3"><span className="text-[9px] text-slate-500">باخت</span><b className="block text-lg mt-1 text-rose-300">{loses}</b></div>
      </div>

      <div className="rounded-2xl bg-white/[.025] border border-white/5 p-3.5">
        <div className="flex items-center justify-between mb-2.5"><span className="text-[9px] text-slate-500">فرم اخیر</span><Activity size={14} className="text-cyan-300" /></div>
        <div className="flex gap-1.5">
          {results.length ? results.map((result, index) => <span key={`${result}-${index}`} className={`h-8 min-w-8 px-2 rounded-lg border grid place-items-center text-[10px] font-black ${resultClass(result)}`}>{result}</span>) : <span className="text-[10px] text-slate-500">فرم در دسترس نیست.</span>}
        </div>
      </div>

      {next && (
        <Link href={`/matches/${next.id}`} className="block rounded-2xl border border-cyan-300/10 bg-cyan-400/[.04] p-3.5 hover:bg-cyan-400/[.07] transition">
          <div className="flex items-center justify-between mb-2"><span className="text-[9px] text-cyan-300 font-bold">NEXT MATCH</span><CalendarDays size={14} className="text-cyan-300" /></div>
          <div className="text-xs font-bold truncate">{next.home || team.name} <span className="text-slate-600 mx-1">vs</span> {next.away || "حریف"}</div>
          <span className="text-[9px] text-slate-500 mt-1 block">برای ورود به Match Center ضربه بزن</span>
        </Link>
      )}

      {recent.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {recent.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="rounded-xl bg-white/[.03] border border-white/5 p-3 hover:bg-white/[.06] transition">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-2"><ShieldCheck size={12} className="text-cyan-300" /> Match Center</div>
            <div className="text-[10px] font-semibold truncate">{match.home || "—"} · {match.away || "—"}</div>
            <b className="text-xs mt-1 block">{match.homeScore ?? "—"} - {match.awayScore ?? "—"}</b>
          </Link>)}
        </div>
      )}
    </section>
  );
}
