"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Crown, Flag, Search, SlidersHorizontal, Trophy, X, Sparkles, Globe2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CLUB_CUPS, CONTINENTS, LEAGUE_ENTRIES } from "../../lib/fot10-universe";

const featuredSlugs = ["iran", "premier-league", "laliga", "bundesliga", "serie-a", "ucl"];

function LeagueLogo({ league, size = 44 }) {
  const src = league.leagueId
    ? `https://media.api-sports.io/football/leagues/${league.leagueId}.png`
    : "/league-default.svg";
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.035]" style={{ width: size, height: size }}>
      <img src={src} alt={`${league.leagueName || league.name} logo`} width={size - 10} height={size - 10} className="h-[calc(100%-10px)] w-[calc(100%-10px)] object-contain" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/league-default.svg"; }} />
    </span>
  );
}

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

  const featured = featuredSlugs
    .map((slug) => LEAGUE_ENTRIES.find((item) => item.slug === slug) || CLUB_CUPS.find((item) => item.slug === slug))
    .filter(Boolean);

  const chooseContinent = (slug) => {
    setContinent(slug);
    setCountry("all");
  };

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/" aria-label="بازگشت" className="glass h-11 w-11 rounded-2xl grid place-items-center hover:-translate-y-0.5"><ArrowRight size={19} /></Link>
          <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="text-[9px] font-black tracking-[.2em] text-emerald-400">FOT10 WORLD</span><span className="h-1 w-1 rounded-full bg-emerald-400" /></div><h1 className="text-xl font-black mt-0.5">لیگ‌ها و رقابت‌ها</h1><p className="text-[10px] text-slate-500 mt-0.5">فوتبال جهان، یک‌جا و حرفه‌ای</p></div>
          <button type="button" aria-label="فیلترها" className="glass h-11 w-11 rounded-2xl grid place-items-center"><SlidersHorizontal size={18} className="text-emerald-400" /></button>
        </header>

        <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/15 bg-[radial-gradient(circle_at_15%_15%,rgba(37,211,102,.16),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(18,168,255,.15),transparent_34%),linear-gradient(145deg,#101a26,#080d17)] p-5 shadow-[0_25px_70px_rgba(0,0,0,.28)]">
          <div className="absolute -left-10 -bottom-14 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-emerald-300 text-[10px] font-black"><Sparkles size={14} /> مرکز فوتبال جهان</div><h2 className="mt-2 text-2xl font-black leading-tight">همه لیگ‌ها،<br /><span className="text-emerald-400">یک لمس تا بازی</span></h2><p className="mt-2 max-w-[290px] text-[10px] leading-5 text-slate-400">لیگ محبوب خودت را پیدا کن، جدول و نتایج را ببین و مستقیم وارد رقابت شو.</p></div><div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-white/10 bg-white/[.045] shadow-inner"><Globe2 size={31} className="text-emerald-300" /></div></div>
          <div className="relative mt-5 grid grid-cols-3 gap-2"><div className="rounded-2xl border border-white/[.06] bg-white/[.045] p-3"><b className="text-lg">۶</b><p className="text-[9px] text-slate-500 mt-1">قاره</p></div><div className="rounded-2xl border border-white/[.06] bg-white/[.045] p-3"><b className="text-lg">۶۰</b><p className="text-[9px] text-slate-500 mt-1">کشور</p></div><div className="rounded-2xl border border-white/[.06] bg-white/[.045] p-3"><b className="text-lg">{LEAGUE_ENTRIES.length}</b><p className="text-[9px] text-slate-500 mt-1">لیگ</p></div></div>
        </section>

        <Link href="/national-teams" className="glass group flex items-center gap-3 rounded-2xl p-4 active:scale-[.99] transition-transform"><span className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-400/10 grid place-items-center"><Flag className="text-emerald-400" size={20} /></span><span className="flex-1"><b className="block text-sm">مرکز تیم‌های ملی</b><small className="text-[10px] text-slate-500">بازی‌های ملی، نتایج، بازیکنان و تیم‌های محبوب</small></span><ChevronLeft size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" /></Link>

        <section className="space-y-3"><div className="flex items-end justify-between px-1"><div><p className="text-[9px] font-black text-emerald-400">QUICK ACCESS</p><h2 className="text-sm font-black mt-1">⭐ لیگ‌های محبوب</h2></div><span className="text-[9px] text-slate-500">انتخاب سریع</span></div><div className="grid grid-cols-2 gap-2">{featured.map((league) => <Link key={league.slug} href={`/leagues/${league.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-gradient-to-br from-white/[.075] to-white/[.025] p-3.5 hover:-translate-y-0.5"><div className="flex items-center gap-3"><LeagueLogo league={league} size={44} /><span className="min-w-0 flex-1"><b className="block truncate text-[11px]">{league.leagueName || league.name}</b><small className="mt-1 block truncate text-[9px] text-slate-500">{league.name || league.country}</small></span><ChevronLeft size={14} className="shrink-0 text-slate-600 group-hover:text-emerald-400" /></div></Link>)}</div></section>

        <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="glass w-full rounded-2xl py-3.5 pr-11 pl-11 outline-none placeholder:text-slate-600" placeholder="جستجوی لیگ یا کشور..." /><button type="button" onClick={() => setQuery("")} className={`absolute left-3 top-2.5 h-8 w-8 rounded-xl grid place-items-center text-slate-500 ${query ? "" : "hidden"}`} aria-label="پاک کردن جستجو"><X size={15} /></button></div>

        <section className="space-y-3"><div className="flex items-center justify-between px-1"><h2 className="text-sm font-black">🌍 انتخاب قاره</h2><span className="text-[9px] text-slate-500">{filtered.length} لیگ</span></div><div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"><button onClick={() => chooseContinent("all")} className={`shrink-0 rounded-2xl px-4 py-2.5 text-[10px] font-black transition ${continent === "all" ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/15" : "glass text-slate-400"}`}>همه 🌐</button>{CONTINENTS.map((item) => <button key={item.slug} onClick={() => chooseContinent(item.slug)} className={`shrink-0 rounded-2xl px-4 py-2.5 text-[10px] font-black transition ${continent === item.slug ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/15" : "glass text-slate-400"}`}>{item.icon} {item.name}</button>)}</div></section>

        <section className="space-y-2"><div className="flex items-center justify-between px-1"><h2 className="text-sm font-black">📍 کشور</h2><span className="text-[9px] text-slate-600">فیلتر دقیق</span></div><select value={country} onChange={(event) => setCountry(event.target.value)} className="glass w-full rounded-2xl px-4 py-3.5 outline-none text-sm bg-[#0b111d] text-slate-200"><option value="all">همه کشورهای این قاره</option>{countries.map((item) => <option key={item} value={item}>{item}</option>)}</select></section>

        {filtered.length === 0 ? <div className="glass rounded-3xl p-10 text-center"><Search className="mx-auto text-slate-600" size={28} /><p className="mt-3 font-bold">موردی پیدا نشد</p><p className="text-[10px] text-slate-500 mt-1">عبارت جستجو یا فیلتر کشور را تغییر بده.</p></div> : <section className="space-y-6">{CONTINENTS.map((item) => { const entries = filtered.filter((league) => league.continent === item.slug); if (!entries.length) return null; return <div key={item.slug} className="space-y-2.5"><div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[.04]">{item.icon}</span><h2 className="font-black text-sm">{item.name}</h2></div><span className="rounded-full bg-white/[.04] px-2.5 py-1 text-[9px] text-slate-500">{entries.length} لیگ</span></div><div className="grid grid-cols-1 gap-2">{entries.map((league) => <Link key={league.slug} href={`/leagues/${league.slug}`} className="glass group rounded-2xl p-3.5 flex items-center gap-3 text-right active:scale-[.99] transition-transform"><LeagueLogo league={league} size={46} /><span className="flex-1 min-w-0"><b className="block text-sm truncate">{league.leagueName}</b><small className="text-[10px] text-slate-500">{league.name} · جدول · نتایج · برنامه</small></span><Trophy size={15} className="text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" /><ChevronLeft size={15} className="text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" /></Link>)}</div></div>})}</section>}

        <section className="space-y-3"><div className="flex items-center justify-between px-1"><div><p className="text-[9px] font-black text-yellow-400">CONTINENTAL CUPS</p><h2 className="text-sm font-black mt-1">🏆 جام‌های باشگاهی قاره‌ای</h2></div><span className="text-[9px] text-slate-500">{CLUB_CUPS.length} رقابت</span></div><div className="grid grid-cols-1 gap-2">{CLUB_CUPS.map((cup) => <Link key={cup.slug} href={`/leagues/${cup.slug}`} className="glass group rounded-2xl p-4 flex items-center gap-3"><span className="text-2xl">{cup.icon}</span><span className="flex-1"><b className="block text-sm">{cup.name}</b><small className="text-[10px] text-slate-500">{cup.country}</small></span><ChevronLeft size={16} className="text-slate-600 group-hover:text-yellow-400 transition-colors" /></Link>)}</div></section>
      </div>
    </main>
  );
}
