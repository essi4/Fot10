"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Zap, Shield, Swords, Trophy, Activity } from "lucide-react";
import { scoreParts, level, LEAGUES } from "./TeamPowerScore";
import { teamName } from "../lib/team-identity";

export default function TeamPowerScoreCard({ teamId, leagueId, season }) {
  const [data, setData] = useState([]);
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(true);
  const league = Number(leagueId || 0);
  const resolvedSeason = Number(season || (league === 195 ? 2026 : new Date().getFullYear()));

  useEffect(() => {
    if (!league) { setLoading(false); return; }
    let alive = true;
    const load = () => fetch(`/api/football/standings?league=${league}&season=${resolvedSeason}`, { cache: "no-store" })
      .then(r => r.json()).then(p => { if (alive && p?.ok) setData((p.data || []).flatMap(x => x?.league?.standings?.flat?.() || []).filter(Boolean)); })
      .catch(() => {}).finally(() => alive && setLoading(false));
    load();
    const timer = window.setInterval(load, 30000);
    const countdown = window.setInterval(() => setSeconds(v => v <= 1 ? 30 : v - 1), 1000);
    return () => { alive = false; window.clearInterval(timer); window.clearInterval(countdown); };
  }, [league, resolvedSeason]);

  const ranked = useMemo(() => data.map(row => ({ row, score: scoreParts(row, data) })).sort((a,b) => b.score.total - a.score.total), [data]);
  const target = ranked.find(x => String(x.row.team?.id) === String(teamId));
  if (loading) return <section className="glass rounded-[24px] p-5 text-center text-xs text-slate-500"><Activity className="mx-auto mb-2 animate-pulse text-violet-300" size={18}/>در حال محاسبه Power Score تیم…</section>;
  if (!target) return null;
  const p = target.score;
  const rank = ranked.findIndex(x => String(x.row.team?.id) === String(teamId)) + 1;
  const items = [["جدول", p.table, Trophy], ["فرم", p.form, Zap], ["حمله", p.attack, Swords], ["دفاع", p.defense, Shield], ["تفاضل", p.gd, Activity]];

  return <section className="glass rounded-[24px] border border-violet-300/10 bg-violet-400/[.035] p-4 sm:p-5 shadow-xl shadow-violet-950/10">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BrainCircuit size={18} className="text-violet-300"/><div><p className="text-[9px] font-bold text-violet-300">FOT10 POWER SCORE</p><h2 className="font-black">قدرت {teamName(target.row.team?.name)}</h2></div></div><div className="text-right"><b className="text-3xl font-black text-violet-300">{p.total}</b><div className="text-[9px] text-slate-500">{level(p.total)} · رتبه #{rank}</div></div></div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-violet-400/80" style={{ width: `${p.total}%` }}/></div>
    <div className="mt-4 grid grid-cols-5 gap-2">{items.map(([label,value,Icon]) => <div key={label} className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Icon size={13} className="mx-auto mb-1 text-violet-300"/><b className="block text-sm">{Math.round(value)}</b><span className="text-[8px] text-slate-500">{label}</span></div>)}</div>
    <div className="mt-3 flex justify-between text-[8px] text-slate-600"><span>شاخص داخلی FOT10 · از ۱۰۰</span><span className="text-violet-300">LIVE · {seconds}s</span></div>
  </section>;
}
