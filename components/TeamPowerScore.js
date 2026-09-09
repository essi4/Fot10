"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Zap, Shield, Swords, Trophy, Activity, RefreshCw } from "lucide-react";
import { teamName } from "../lib/team-identity";

const LEAGUES = { iran: 195, "j1-league": 98, "k-league-1": 292, "saudi-pro-league": 307, "qatar-stars-league": 305, "uae-pro-league": 301, "chinese-super-league": 169, "a-league": 188, "premier-league": 39, laliga: 140, bundesliga: 78, "serie-a": 135, "ligue-1": 61, eredivisie: 88, "primeira-liga": 94, "super-lig": 203, mls: 253, "liga-mx": 262, brasileirao: 71, "liga-profesional": 128 };
function rows(payload) { return (payload?.data || []).flatMap(x => x?.league?.standings?.flat?.() || []).filter(Boolean); }
function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }
function parts(row, allRows) {
  const played = Number(row?.all?.played || 0);
  const maxPoints = Math.max(...allRows.map(x => Number(x.points || 0)), 1);
  const maxGF = Math.max(...allRows.map(x => Number(x.all?.goals?.for || 0)), 1);
  const maxGA = Math.max(...allRows.map(x => Number(x.all?.goals?.against || 0)), 1);
  const maxGD = Math.max(...allRows.map(x => Number(x.goalsDiff || 0)), 1);
  const table = Number(row.points || 0) / maxPoints * 35;
  const form = played ? ((Number(row.all?.win || 0) * 3 + Number(row.all?.draw || 0)) / (played * 3)) * 25 : 0;
  const attack = Number(row.all?.goals?.for || 0) / maxGF * 15;
  const defense = (1 - Number(row.all?.goals?.against || 0) / maxGA) * 15;
  const gd = Math.max(0, Number(row.goalsDiff || 0)) / maxGD * 10;
  return { table, form, attack, defense: Math.max(0, defense), gd, total: clamp(table + form + attack + Math.max(0, defense) + gd) };
}
function level(score) { if (score >= 85) return "Elite"; if (score >= 75) return "قوی"; if (score >= 60) return "خوب"; if (score >= 45) return "متوسط"; return "در حال رشد"; }

export default function TeamPowerScore() {
  const [path, setPath] = useState(""); const [data, setData] = useState([]); const [seconds, setSeconds] = useState(30); const [loading, setLoading] = useState(true);
  useEffect(() => { setPath(window.location.pathname); }, []);
  const slug = path.split("/").filter(Boolean).pop(); const league = LEAGUES[slug]; const season = league === 195 ? 2026 : new Date().getFullYear();
  useEffect(() => { let alive=true; if(!league){setLoading(false);return;} const load=()=>fetch(`/api/football/standings?league=${league}&season=${season}`,{cache:"no-store"}).then(r=>r.json()).then(p=>{if(alive&&p?.ok)setData(rows(p));}).catch(()=>{}).finally(()=>alive&&setLoading(false)); load(); const t=window.setInterval(load,30000); const c=window.setInterval(()=>setSeconds(v=>v<=1?30:v-1),1000); return()=>{alive=false;window.clearInterval(t);window.clearInterval(c);}; },[league,season]);
  const ranked = useMemo(() => data.map(row => ({ row, parts: parts(row,data) })).sort((a,b) => b.parts.total-a.parts.total), [data]);
  if(loading) return <section className="mx-auto max-w-5xl rounded-2xl border border-violet-300/10 bg-violet-400/[.035] p-4 text-center text-[10px] text-slate-500"><Activity size={15} className="mx-auto mb-2 animate-pulse text-violet-300"/>در حال محاسبه FOT10 Power Score…</section>;
  if(!ranked.length)return null;
  const leader=ranked[0];
  return <section className="mx-auto max-w-5xl rounded-2xl border border-violet-300/10 bg-violet-400/[.035] p-3 shadow-xl shadow-violet-950/10 sm:p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><BrainCircuit size={17} className="text-violet-300"/><div><h2 className="text-sm font-black text-white">FOT10 Power Score</h2><p className="text-[8px] text-slate-500">موتور امتیازدهی قدرت · ۰ تا ۱۰۰</p></div></div><div className="flex items-center gap-1.5 rounded-full border border-violet-300/10 bg-violet-300/[.04] px-2 py-1 text-[8px] text-violet-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300"/>LIVE · {seconds}s<RefreshCw size={10}/></div></div>
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5"><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Trophy size={13} className="mx-auto text-amber-300"/><div className="mt-1 text-[8px] text-slate-500">جدول</div><b className="text-[9px] text-slate-300">۳۵٪</b></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Zap size={13} className="mx-auto text-violet-300"/><div className="mt-1 text-[8px] text-slate-500">فرم</div><b className="text-[9px] text-slate-300">۲۵٪</b></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Swords size={13} className="mx-auto text-cyan-300"/><div className="mt-1 text-[8px] text-slate-500">حمله</div><b className="text-[9px] text-slate-300">۱۵٪</b></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Shield size={13} className="mx-auto text-emerald-300"/><div className="mt-1 text-[8px] text-slate-500">دفاع</div><b className="text-[9px] text-slate-300">۱۵٪</b></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><TargetIcon/><div className="mt-1 text-[8px] text-slate-500">تفاضل</div><b className="text-[9px] text-slate-300">۱۰٪</b></div></div>
    <div className="mb-3 rounded-xl border border-violet-300/10 bg-violet-300/[.04] p-3"><div className="flex items-center justify-between gap-2"><div><div className="text-[8px] text-slate-500">صدر Power Ranking</div><b className="text-sm text-white">{teamName(leader.row.team?.name)}</b></div><div className="text-right"><b className="text-2xl font-black text-violet-300">{leader.parts.total}</b><div className="text-[8px] text-slate-500">{level(leader.parts.total)}</div></div></div></div>
    <div className="space-y-1.5">{ranked.slice(0,10).map(({row,parts:p},i)=><div key={row.team?.id||i} className="rounded-xl border border-white/5 bg-black/20 p-2.5"><div className="grid grid-cols-[22px_1fr_48px] items-center gap-2"><span className="text-center text-[9px] font-black text-slate-600">{i+1}</span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><b className="truncate text-[10px] text-slate-200">{teamName(row.team?.name)}</b><span className="text-[7px] text-slate-600">{level(p.total)}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-violet-400/70 transition-all" style={{width:`${p.total}%`}}/></div></div><div className="text-right"><Zap size={10} className="ml-auto text-violet-300"/><b className="text-sm text-violet-300">{p.total}</b></div></div><div className="mt-2 grid grid-cols-5 gap-1 text-center text-[7px] text-slate-600"><span>جدول<br/><b className="text-slate-400">{Math.round(p.table)}</b></span><span>فرم<br/><b className="text-slate-400">{Math.round(p.form)}</b></span><span>حمله<br/><b className="text-slate-400">{Math.round(p.attack)}</b></span><span>دفاع<br/><b className="text-slate-400">{Math.round(p.defense)}</b></span><span>تفاضل<br/><b className="text-slate-400">{Math.round(p.gd)}</b></span></div></div>)}</div>
    <div className="mt-3 flex flex-wrap justify-between gap-2 text-[8px] leading-5 text-slate-600"><span>⚡ شاخص داخلی FOT10 است؛ رتبه رسمی یا پیش‌بینی قطعی نیست.</span><span>به‌روزرسانی خودکار هر ۳۰ ثانیه</span></div>
  </section>;
}

function TargetIcon(){ return <span className="mx-auto block text-[13px] leading-4">🎯</span>; }
