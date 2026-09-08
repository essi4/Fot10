"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Crown, Flag, Search, SlidersHorizontal, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CLUB_CUPS, CONTINENTS, LEAGUE_ENTRIES } from "../../lib/fot10-universe";

export default function LeaguesPage() {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("all");
  const [country, setCountry] = useState("all");

  const countries = useMemo(() => {
    const entries = continent === "all" ? LEAGUE_ENTRIES : LEAGUE_ENTRIES.filter((item) => item.continent === continent);
    return [...new Set(entries.map((item) => item.name))].sort((a, b) => a.localeCompare(b, "fa"));
  }, [continent]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return LEAGUE_ENTRIES.filter((item) => {
      const matchesQuery = !value || `${item.name} ${item.apiCountry} ${item.leagueName}`.toLowerCase().includes(value);
      const matchesContinent = continent === "all" || item.continent === continent;
      const matchesCountry = country === "all" || item.name === country;
      return matchesQuery && matchesContinent && matchesCountry;
    });
  }, [query, continent, country]);

  const chooseContinent = (slug) => {
    setContinent(slug);
    setCountry("all");
  };

  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center gap-3"><Link href="/" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div className="flex-1"><h1 className="text-xl font-black">لیگ‌ها و رقابت‌ها</h1><p className="text-[11px] text-slate-500">۶ قاره · ۶۰ کشور · جستجو و فیلتر حرفه‌ای</p></div><span className="glass h-10 w-10 rounded-xl grid place-items-center"><SlidersHorizontal size={18} className="text-emerald-400"/></span></header>

    <Link href="/national-teams" className="glass rounded-2xl p-4 flex items-center gap-3 active:scale-[.99] transition-transform"><span className="h-11 w-11 rounded-2xl bg-emerald-400/10 grid place-items-center"><Flag className="text-emerald-400" size={20}/></span><span className="flex-1"><b className="block text-sm">مرکز تیم‌های ملی</b><small className="text-[10px] text-slate-500">بازی‌های ملی، نتایج، فهرست بازیکنان و تیم‌های محبوب</small></span><ChevronLeft size={16} className="text-slate-600"/></Link>

    <Link href="/leagues/ucl" className="glass card p-5 relative overflow-hidden block active:scale-[.99] transition-transform"><Crown className="absolute left-4 top-4 text-yellow-400/50"/><p className="text-xs text-slate-400">جام‌های باشگاهی منتخب</p><h2 className="text-2xl font-black mt-1">اروپا · آسیا · آفریقا · آمریکا</h2><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/[.04] p-3"><b>{CLUB_CUPS.length}</b><p className="text-[9px] text-slate-500 mt-1">جام قاره‌ای</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>۶۰</b><p className="text-[9px] text-slate-500 mt-1">کشور</p></div><div className="rounded-xl bg-white/[.04] p-3"><b>۱۰</b><p className="text-[9px] text-slate-500 mt-1">کشور در هر قاره</p></div></div></Link>

    <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-11 outline-none" placeholder="جستجوی لیگ یا کشور..."/><button type="button" onClick={() => setQuery("")} className={`absolute left-3 top-2.5 h-7 w-7 rounded-lg grid place-items-center text-slate-500 ${query ? "" : "hidden"}`} aria-label="پاک کردن جستجو"><X size={15}/></button></div>

    <div className="space-y-2"><div className="flex items-center justify-between px-1"><h2 className="text-sm font-black">قاره</h2><span className="text-[10px] text-slate-500">{filtered.length} لیگ</span></div><div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"><button onClick={() => chooseContinent("all")} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition ${continent === "all" ? "bg-emerald-400 text-slate-950" : "glass text-slate-400"}`}>همه</button>{CONTINENTS.map((item) => <button key={item.slug} onClick={() => chooseContinent(item.slug)} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition ${continent === item.slug ? "bg-emerald-400 text-slate-950" : "glass text-slate-400"}`}>{item.icon} {item.name}</button>)}</div></div>

    <div className="space-y-2"><h2 className="text-sm font-black">کشور</h2><select value={country} onChange={(event) => setCountry(event.target.value)} className="glass w-full rounded-2xl px-4 py-3 outline-none text-sm bg-transparent"><option value="all">همه کشورهای این قاره</option>{countries.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>

    {filtered.length === 0 ? <div className="glass rounded-2xl p-8 text-center"><Search className="mx-auto text-slate-600" size={28}/><p className="mt-3 font-bold">موردی پیدا نشد</p><p className="text-[10px] text-slate-500 mt-1">عبارت جستجو یا فیلتر کشور را تغییر بده.</p></div> : <section className="space-y-5">{CONTINENTS.map((item) => { const entries = filtered.filter((league) => league.continent === item.slug); if (!entries.length) return null; return <div key={item.slug} className="space-y-2"><div className="flex items-center justify-between px-1"><h2 className="font-black text-sm">{item.icon} {item.name}</h2><span className="text-[10px] text-slate-500">{entries.length} کشور</span></div><div className="grid grid-cols-1 gap-2">{entries.map((league) => <Link key={league.slug} href={`/leagues/${league.slug}`} className="glass rounded-2xl p-4 flex items-center gap-3 text-right active:scale-[.99] transition-transform"><span className="h-11 w-11 rounded-2xl bg-white/[.04] grid place-items-center text-xl">{league.flag}</span><span className="flex-1 min-w-0"><b className="block text-sm truncate">{league.leagueName}</b><small className="text-[10px] text-slate-500">{league.name} · جدول · نتایج · برنامه</small></span><Trophy size={16} className="text-slate-600 shrink-0"/><ChevronLeft size={16} className="text-slate-600 shrink-0"/></Link>)}</div></div>})}</section>}

    <section className="space-y-2"><h2 className="text-sm font-black">🏆 جام‌های باشگاهی قاره‌ای</h2>{CLUB_CUPS.map((cup) => <Link key={cup.slug} href={`/leagues/${cup.slug}`} className="glass rounded-2xl p-4 flex items-center gap-3"><span className="text-2xl">{cup.icon}</span><span className="flex-1"><b className="block text-sm">{cup.name}</b><small className="text-[10px] text-slate-500">{cup.country}</small></span><ChevronLeft size={16} className="text-slate-600"/></Link>)}</section>
  </div></main>;
}
