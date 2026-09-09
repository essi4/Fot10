"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Flag, Search, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { CONTINENTS, NATIONAL_TEAMS } from "../../lib/fot10-universe";

export default function NationalTeamsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => { const value = query.trim().toLowerCase(); if (!value) return NATIONAL_TEAMS; return NATIONAL_TEAMS.filter((team) => `${team.name} ${team.fa}`.toLowerCase().includes(value)); }, [query]);
  const iran = NATIONAL_TEAMS.find((team) => team.slug === "iran");
  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center gap-3"><Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="بازگشت"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">تیم‌های ملی</h1><p className="text-[11px] text-slate-500">۶ قاره · ۶۰ کشور · بازی‌ها · نتایج · بازیکنان</p></div></header>
    {iran && <Link href="/national-teams/iran" className="group relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-400/15 via-white/[.045] to-transparent p-4 shadow-xl active:scale-[.99] transition-transform"><div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" /><div className="relative flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-4xl shadow-lg">{iran.flag}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Shield size={15} className="text-emerald-300"/><span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">تیم ملی منتخب FOT10</span></div><h2 className="mt-1 text-lg font-black">تیم ملی ایران</h2><p className="mt-1 text-[9px] text-slate-400">بازی‌ها · نتایج · بازیکنان · آمار</p></div><ChevronLeft size={18} className="shrink-0 text-slate-500 transition-transform group-hover:-translate-x-1"/></div></Link>}
    <div className="glass rounded-2xl p-4 flex items-center gap-3"><Flag className="text-emerald-400" size={20}/><div className="flex-1"><b className="text-sm">مرکز تیم‌های ملی FOT10</b><p className="text-[10px] text-slate-500 mt-1">از آسیا تا اروپا، آفریقا، آمریکا و اقیانوسیه</p></div><b className="text-emerald-400">60</b></div>
    <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none" placeholder="جستجوی کشور..."/></div>
    <section className="space-y-5">{CONTINENTS.map((continent) => { const items = filtered.filter((team) => team.continent === continent.slug); if (!items.length) return null; return <div key={continent.slug} className="space-y-2"><div className="flex items-center justify-between px-1"><h2 className="font-black text-sm">{continent.icon} {continent.name}</h2><span className="text-[10px] text-slate-500">{items.length} تیم</span></div><div className="grid grid-cols-2 gap-2">{items.map((team) => <Link key={team.slug} href={`/national-teams/${team.slug}`} className="glass rounded-2xl p-3 flex items-center gap-2 active:scale-[.98] transition-transform"><span className="text-2xl">{team.flag}</span><span className="flex-1 min-w-0"><b className="block text-xs truncate">{team.fa}</b><small className="text-[9px] text-slate-500">{team.name} · بازی‌ها</small></span><ChevronLeft size={14} className="text-slate-600"/></Link>)}</div></div>})}</section>
  </div></main>;
}
