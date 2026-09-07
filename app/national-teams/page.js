"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Flag, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CONTINENTS, NATIONAL_TEAMS } from "../../lib/fot10-universe";

export default function NationalTeamsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => { const value = query.trim().toLowerCase(); if (!value) return NATIONAL_TEAMS; return NATIONAL_TEAMS.filter((team) => `${team.name} ${team.fa}`.toLowerCase().includes(value)); }, [query]);
  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center gap-3"><Link href="/" className="glass h-10 w-10 rounded-xl grid place-items-center" aria-label="بازگشت"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">تیم‌های ملی</h1><p className="text-[11px] text-slate-500">۶ قاره · ۶۰ کشور · بازی‌ها · نتایج · بازیکنان</p></div></header>
    <div className="glass rounded-2xl p-4 flex items-center gap-3"><Flag className="text-emerald-400" size={20}/><div className="flex-1"><b className="text-sm">مرکز تیم‌های ملی FOT10</b><p className="text-[10px] text-slate-500 mt-1">از آسیا تا اروپا، آفریقا، آمریکا و اقیانوسیه</p></div><b className="text-emerald-400">60</b></div>
    <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none" placeholder="جستجوی کشور..."/></div>
    <section className="space-y-5">{CONTINENTS.map((continent) => { const items = filtered.filter((team) => team.continent === continent.slug); if (!items.length) return null; return <div key={continent.slug} className="space-y-2"><div className="flex items-center justify-between px-1"><h2 className="font-black text-sm">{continent.icon} {continent.name}</h2><span className="text-[10px] text-slate-500">{items.length} تیم</span></div><div className="grid grid-cols-2 gap-2">{items.map((team) => <Link key={team.slug} href={`/national-teams/${team.slug}`} className="glass rounded-2xl p-3 flex items-center gap-2 active:scale-[.98] transition-transform"><span className="text-2xl">{team.flag}</span><span className="flex-1 min-w-0"><b className="block text-xs truncate">{team.fa}</b><small className="text-[9px] text-slate-500">{team.name} · بازی‌ها</small></span><ChevronLeft size={14} className="text-slate-600"/></Link>)}</div></div>})}</section>
  </div></main>;
}
