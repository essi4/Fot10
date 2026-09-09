"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Zap } from "lucide-react";
import { teamName } from "../lib/team-identity";

const LEAGUES = { iran: 195, "j1-league": 98, "k-league-1": 292, "saudi-pro-league": 307, "qatar-stars-league": 305, "uae-pro-league": 301, "chinese-super-league": 169, "a-league": 188, "premier-league": 39, laliga: 140, bundesliga: 78, "serie-a": 135, "ligue-1": 61, eredivisie: 88, "primeira-liga": 94, "super-lig": 203, mls: 253, "liga-mx": 262, brasileirao: 71, "liga-profesional": 128 };
function rows(payload) { return (payload?.data || []).flatMap(x => x?.league?.standings?.flat?.() || []).filter(Boolean); }
function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

function power(row, allRows) {
  const played = Number(row?.all?.played || 0);
  const maxPoints = Math.max(...allRows.map(x => Number(x.points || 0)), 1);
  const maxGF = Math.max(...allRows.map(x => Number(x.all?.goals?.for || 0)), 1);
  const maxGD = Math.max(...allRows.map(x => Number(x.goalsDiff || 0)), 1);
  const ppg = played ? Number(row.points || 0) / played : 0;
  const form = played ? (Number(row.all?.win || 0) * 3 + Number(row.all?.draw || 0)) / (played * 3) : 0;
  const attack = Number(row.all?.goals?.for || 0) / maxGF;
  const defense = 1 - Math.min(1, Number(row.all?.goals?.against || 0) / Math.max(1, Number(row.all?.goals?.against || 0) + Number(row.all?.goals?.for || 0)));
  const table = Number(row.points || 0) / maxPoints;
  const gd = Math.max(0, Number(row.goalsDiff || 0)) / maxGD;
  return clamp(table * 35 + form * 25 + attack * 15 + defense * 15 + gd * 10 + Math.min(5, ppg) * 2);
}

export default function TeamPowerScore() {
  const pathname = useMemo(() => typeof window === "undefined" ? "" : window.location.pathname, []);
  const slug = pathname.split("/").filter(Boolean).pop();
  const league = LEAGUES[slug];
  const season = league === 195 ? 2026 : new Date().getFullYear();
  const [data, setData] = useState([]);
  useEffect(() => { let alive = true; if (!league) return; fetch(`/api/football/standings?league=${league}&season=${season}`, { cache: "no-store" }).then(r => r.json()).then(p => alive && p?.ok && setData(rows(p))).catch(() => {}); return () => { alive = false; }; }, [league, season]);
  const ranked = useMemo(() => data.map(row => ({ row, power: power(row, data) })).sort((a,b) => b.power - a.power), [data]);
  if (!ranked.length) return null;
  return <section className="mx-auto max-w-5xl rounded-2xl border border-violet-300/10 bg-violet-400/[.035] p-3 shadow-xl shadow-violet-950/10 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BrainCircuit size={16} className="text-violet-300"/><div><h2 className="text-sm font-black text-white">FOT10 Power Score</h2><p className="text-[8px] text-slate-500">قدرت فعلی تیم‌ها · مقیاس ۰ تا ۱۰۰</p></div></div><span className="text-[8px] text-violet-300">LIVE RATING</span></div>
    <div className="space-y-1.5">{ranked.slice(0,10).map(({row,power:indexScore},i) => <div key={row.team?.id || i} className="grid grid-cols-[22px_1fr_58px] items-center gap-2 rounded-xl border border-white/5 bg-black/20 px-2.5 py-2"><span className="text-center text-[9px] font-black text-slate-600">{i+1}</span><div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-200">{teamName(row.team?.name)}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-violet-400/70" style={{ width: `${indexScore}%` }}/></div></div><div className="flex items-center justify-end gap-1 text-violet-300"><Zap size={11}/><b className="text-sm">{indexScore}</b></div></div>)}</div>
    <div className="mt-3 text-[8px] leading-5 text-slate-500">فرمول FOT10: جایگاه و امتیاز جدول ۳۵٪ · فرم نتایج ۲۵٪ · حمله ۱۵٪ · دفاع ۱۵٪ · تفاضل گل ۱۰٪. این امتیاز شاخص داخلی FOT10 است و رتبه رسمی یا پیش‌بینی قطعی نیست.</div>
  </section>;
}
