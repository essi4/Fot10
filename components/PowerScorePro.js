"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { BrainCircuit, Loader2, Zap, TrendingUp, Shield, Swords } from "lucide-react";
import { teamName } from "../lib/team-identity";

const LEAGUES = { iran: 195, "j1-league": 98, "k-league-1": 292, "saudi-pro-league": 307, "qatar-stars-league": 305, "uae-pro-league": 301, "chinese-super-league": 169, "a-league": 188, "premier-league": 39, laliga: 140, bundesliga: 78, "serie-a": 135, "ligue-1": 61, eredivisie: 88, "primeira-liga": 94, "super-lig": 203, mls: 253, "liga-mx": 262, brasileirao: 71, "liga-profesional": 128 };

const clamp = (n) => Math.max(0, Math.min(100, n));
const flatRows = (p) => (p?.data || []).flatMap((x) => x?.league?.standings?.flat?.() || []).filter(Boolean);

function formFor(matches, id) {
  return matches.filter((m) => Number(m.homeId) === Number(id) || Number(m.awayId) === Number(id)).filter((m) => m.homeScore !== null && m.awayScore !== null).sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0,5);
}

function power(row, form, rows) {
  if (!row || !rows.length) return 0;
  const maxPts = Math.max(...rows.map(r => Number(r.points || 0)), 1);
  const maxGF = Math.max(...rows.map(r => Number(r.all?.goals?.for || 0)), 1);
  const maxGD = Math.max(...rows.map(r => Number(r.all?.goals?.for || 0) - Number(r.all?.goals?.against || 0)), 1);
  const maxW = Math.max(...rows.map(r => Number(r.all?.win || 0)), 1);
  const table = Number(row.points || 0) / maxPts * 35;
  const formPts = form.length ? form.reduce((s,m) => { const home = Number(m.homeId) === Number(row.team?.id); const gf = Number(home ? m.homeScore : m.awayScore); const ga = Number(home ? m.awayScore : m.homeScore); return s + (gf > ga ? 1 : gf === ga ? .45 : 0); }, 0) / form.length * 25 : Number(row.all?.win || 0) / maxW * 25;
  const attack = Number(row.all?.goals?.for || 0) / maxGF * 15;
  const defense = (1 - Number(row.all?.goals?.against || 0) / Math.max(...rows.map(r => Number(r.all?.goals?.against || 0)), 1)) * 15;
  const gd = Math.max(0, (Number(row.all?.goals?.for || 0) - Number(row.all?.goals?.against || 0)) / maxGD) * 10;
  return Math.round(clamp(table + formPts + attack + defense + gd));
}

export default function PowerScorePro() {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean).pop();
  const league = LEAGUES[slug];
  const season = league === 195 ? 2026 : new Date().getFullYear();
  const [rows,setRows] = useState([]); const [matches,setMatches] = useState([]); const [loading,setLoading] = useState(true);

  useEffect(() => { let alive=true; if(!league){setLoading(false);return;} Promise.all([
    fetch(`/api/football/standings?league=${league}&season=${season}`,{cache:"no-store"}).then(r=>r.json()),
    fetch(`/api/football/fixtures?league=${league}&season=${season}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({}))
  ]).then(([s,f])=>{if(!alive)return; if(s?.ok)setRows(flatRows(s)); if(f?.ok)setMatches(Array.isArray(f.matches)?f.matches:[]);}).catch(()=>{}).finally(()=>alive&&setLoading(false)); return()=>{alive=false;};},[league,season]);

  const ranked = useMemo(()=>rows.map((row)=>({row,score:power(row,formFor(matches,row.team?.id),rows)})).sort((a,b)=>b.score-a.score),[rows,matches]);
  if(loading) return <section className="mx-auto max-w-5xl rounded-2xl border border-cyan-300/10 bg-cyan-400/[.035] p-4 text-center text-[10px] text-slate-500"><Loader2 size={15} className="mx-auto mb-2 animate-spin text-cyan-300"/>در حال محاسبه قدرت تیم‌ها…</section>;
  if(!ranked.length)return null;
  const top=ranked.slice(0,10); const max=top[0]?.score||1;
  return <section className="mx-auto max-w-5xl rounded-2xl border border-amber-300/10 bg-amber-400/[.035] p-3 shadow-xl shadow-amber-950/10 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><BrainCircuit size={16} className="text-amber-300"/><h2 className="text-sm font-black text-white">FOT10 Power Score</h2></div><span className="text-[8px] text-slate-500">قدرت ترکیبی · ۰ تا ۱۰۰</span></div>
    <div className="mb-3 grid grid-cols-3 gap-2"><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Zap size={13} className="mx-auto text-amber-300"/><b className="mt-1 block text-[9px] text-slate-300">فرم</b><span className="text-[8px] text-slate-500">۲۵٪</span></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Swords size={13} className="mx-auto text-cyan-300"/><b className="mt-1 block text-[9px] text-slate-300">حمله</b><span className="text-[8px] text-slate-500">۱۵٪</span></div><div className="rounded-xl border border-white/5 bg-black/20 p-2 text-center"><Shield size={13} className="mx-auto text-emerald-300"/><b className="mt-1 block text-[9px] text-slate-300">دفاع</b><span className="text-[8px] text-slate-500">۱۵٪</span></div></div>
    <div className="space-y-2">{top.map(({row,score},i)=><div key={row.team?.id||i} className="grid grid-cols-[24px_1fr_44px] items-center gap-2 rounded-xl border border-white/5 bg-black/20 p-2.5"><span className="text-center text-[10px] font-black text-slate-500">#{i+1}</span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><b className="truncate text-[10px] text-white">{teamName(row.team?.name)}</b><span className="text-[8px] text-slate-500">رتبه جدول {row.rank ?? "—"}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-400" style={{width:`${Math.round(score/max*100)}%`}}/></div></div><div className="text-center"><b className="block text-base font-black text-amber-300">{score}</b><span className="text-[7px] text-slate-600">/100</span></div></div>)}</div>
    <div className="mt-3 flex items-center justify-between text-[8px] text-slate-600"><span><TrendingUp size={11} className="inline mr-1"/>امتیاز با داده‌های جدول و فرم اخیر محاسبه می‌شود</span><span>FOT10 Engine</span></div>
  </section>;
}
