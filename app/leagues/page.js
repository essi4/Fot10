"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, Heart, Search, SlidersHorizontal, Trophy, X, Sparkles, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CLUB_CUPS, CONTINENTS, LEAGUE_ENTRIES } from "../../lib/fot10-universe";
import FavoriteButton from "../../components/FavoriteButton";

const featuredSlugs = ["iran", "premier-league", "laliga", "bundesliga", "serie-a", "ucl"];

function LeagueLogo({ league, size = 44 }) {
  const src = league.leagueId ? `https://media.api-sports.io/football/leagues/${league.leagueId}.png` : "/league-default.svg";
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-[18px] border border-white/[.08] bg-slate-950/70 shadow-inner" style={{ width: size, height: size }}>
      <img src={src} alt={`${league.leagueName || league.name} logo`} width={size - 10} height={size - 10} className="h-[calc(100%-10px)] w-[calc(100%-10px)] object-contain" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/league-default.svg"; }} />
    </span>
  );
}

function LeagueCard({ league, featured = false }) {
  return (
    <div className={`group relative overflow-hidden rounded-[24px] border border-white/[.07] text-right transition duration-200 hover:-translate-y-0.5 ${featured ? "min-h-[126px] bg-[radial-gradient(circle_at_85%_15%,rgba(16,185,129,.18),transparent_38%),linear-gradient(145deg,#111c29,#070c15)] p-4" : "bg-white/[.035] p-3.5"}`}>
      {featured && <div className="absolute left-3 top-3 rounded-full border border-emerald-300/10 bg-emerald-400/10 px-2 py-1 text-[8px] font-black text-emerald-300">محبوب</div>}
      <Link href={`/leagues/${league.slug}`} className="block active:scale-[.985]">
        <div className="flex items-center gap-3">
          <LeagueLogo league={league} size={featured ? 54 : 46} />
          <span className="min-w-0 flex-1">
            <b className={`${featured ? "text-[13px]" : "text-[11px]"} block truncate font-black`}>{league.leagueName || league.name}</b>
            <small className="mt-1 block truncate text-[9px] text-slate-500">{league.name || league.country}</small>
          </span>
          <ChevronLeft size={15} className="shrink-0 text-slate-600 transition group-hover:text-emerald-400" />
        </div>
        {featured && <div className="mt-4 flex items-center gap-2 text-[9px] text-slate-500"><span className="rounded-full bg-white/[.05] px-2 py-1">جدول</span><span className="rounded-full bg-white/[.05] px-2 py-1">نتایج</span><span className="rounded-full bg-white/[.05] px-2 py-1">آمار</span></div>}
      </Link>
      <div className="mt-2 flex justify-end"><FavoriteButton type="league" name={league.leagueName || league.name || ""} className="px-3 py-2 text-[9px]" /></div>
    </div>
  );
}

function FavoriteLeagues({ entries }) {
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    const read = () => {
      try {
        const profile = JSON.parse(localStorage.getItem("fot10-profile") || "{}");
        setFavorites(Array.isArray(profile.favoriteLeagues) ? profile.favoriteLeagues : []);
      } catch { setFavorites([]); }
    };
    read();
    window.addEventListener("fot10-favorites-changed", read);
    window.addEventListener("fot10-profile-changed", read);
    return () => {
      window.removeEventListener("fot10-favorites-changed", read);
      window.removeEventListener("fot10-profile-changed", read);
    };
  }, []);
  const matches = entries.filter((item) => favorites.includes(item.leagueName || item.name)).slice(0, 6);
  if (!matches.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between px-1"><div><p className="text-[9px] font-black tracking-[.16em] text-rose-300">MY LEAGUES</p><h2 className="mt-1 text-sm font-black">❤️ رقابت‌های من</h2></div><Link href="/favorites" className="text-[9px] text-slate-500 hover:text-rose-300">همه علاقه‌مندی‌ها</Link></div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">{matches.map((league) => <div key={league.slug} className="min-w-[210px] flex-1"><LeagueCard league={league} /></div>)}</div>
    </section>
  );
}

export default function LeaguesPage() {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("all");
  const [country, setCountry] = useState("all");
  const filtersRef = useRef(null);

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

  const featured = featuredSlugs.map((slug) => LEAGUE_ENTRIES.find((item) => item.slug === slug) || CLUB_CUPS.find((item) => item.slug === slug)).filter(Boolean);
  const chooseContinent = (slug) => { setContinent(slug); setCountry("all"); };
  const clearFilters = () => { setQuery(""); setContinent("all"); setCountry("all"); };

  return (
    <main className="fot-shell min-h-screen bg-[radial-gradient(circle_at_50%_-5%,rgba(16,185,129,.14),transparent_30%),#020617]">
      <div className="fot-container space-y-5 pb-28">
        <header className="flex items-center gap-3 pt-1">
          <Link href="/" aria-label="بازگشت" className="glass grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition hover:-translate-y-0.5"><ArrowRight size={19} /></Link>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[9px] font-black tracking-[.2em] text-emerald-400">FOT10 COMPETITIONS</span><span className="h-1 w-1 rounded-full bg-emerald-400" /></div><h1 className="mt-0.5 text-xl font-black">رقابت‌ها</h1><p className="mt-0.5 text-[10px] text-slate-500">مرکز دنبال‌کردن لیگ‌ها و جام‌ها</p></div>
          <button type="button" aria-label="رفتن به فیلترها" onClick={() => filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="glass grid h-11 w-11 shrink-0 place-items-center rounded-2xl"><SlidersHorizontal size={18} className="text-emerald-400" /></button>
        </header>

        <section className="relative overflow-hidden rounded-[30px] border border-emerald-300/10 bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,.22),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,.16),transparent_34%),linear-gradient(145deg,#101b28,#060b13)] p-5 shadow-[0_25px_70px_rgba(0,0,0,.3)]">
          <div className="absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div><div className="flex items-center gap-2 text-[10px] font-black text-emerald-300"><Sparkles size={14} /> نبض رقابت‌ها</div><h2 className="mt-2 text-[27px] font-black leading-[1.25]">لیگ مورد علاقه‌ات<br /><span className="text-emerald-400">همین‌جاست.</span></h2><p className="mt-2 max-w-[285px] text-[10px] leading-5 text-slate-400">از لیگ برتر ایران تا بزرگ‌ترین رقابت‌های اروپا؛ جدول، بازی‌ها، آمار و اخبار را یک‌جا دنبال کن.</p></div>
            <div className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[24px] border border-white/10 bg-white/[.045] shadow-inner"><Trophy size={31} className="text-emerald-300" /></div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2"><div className="rounded-2xl border border-white/[.06] bg-white/[.045] p-3"><b className="text-lg">{CONTINENTS.length}</b><p className="mt-1 text-[9px] text-slate-500">قاره</p></div><div className="rounded-2xl border border-white/[.06] bg-white/[.045] p-3"><b className="text-lg">{new Set(LEAGUE_ENTRIES.map((item) => item.name)).size}</b><p className="mt-1 text-[9px] text-slate-500">کشور</p></div><div className="rounded-2xl border border-white/[.06] bg-white/[.045] p-3"><b className="text-lg">{LEAGUE_ENTRIES.length}</b><p className="mt-1 text-[9px] text-slate-500">لیگ</p></div></div>
        </section>

        <FavoriteLeagues entries={LEAGUE_ENTRIES} />

        <section className="space-y-3">
          <div className="flex items-end justify-between px-1"><div><p className="text-[9px] font-black tracking-[.16em] text-emerald-400">QUICK ACCESS</p><h2 className="mt-1 text-sm font-black">🔥 محبوب‌ترین رقابت‌ها</h2></div><span className="text-[9px] text-slate-500">ورود سریع</span></div>
          <div className="grid grid-cols-2 gap-2">{featured.map((league) => <LeagueCard key={league.slug} league={league} featured />)}</div>
        </section>

        <section className="glass rounded-[26px] p-4">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-black text-cyan-400">MATCHDAY</p><h2 className="mt-1 text-sm font-black">⚡ سریع برو سراغ فوتبال</h2></div><CalendarDays size={19} className="text-cyan-400" /></div>
          <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/matches" className="rounded-2xl border border-white/[.06] bg-white/[.035] p-3 transition hover:bg-white/[.06]"><b className="block text-[11px]">نتایج و بازی‌ها</b><small className="mt-1 block text-[9px] text-slate-500">برنامه کامل مسابقات</small></Link><Link href="/stats" className="rounded-2xl border border-white/[.06] bg-white/[.035] p-3 transition hover:bg-white/[.06]"><b className="block text-[11px]">آمار فوتبال</b><small className="mt-1 block text-[9px] text-slate-500">اعداد و رکوردها</small></Link></div>
        </section>

        <div ref={filtersRef} className="scroll-mt-24 space-y-3"><div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="glass w-full rounded-2xl py-3.5 pl-11 pr-11 outline-none placeholder:text-slate-600" placeholder="جستجوی لیگ، کشور یا رقابت..." /><button type="button" onClick={() => setQuery("")} className={`absolute left-3 top-2.5 grid h-8 w-8 place-items-center rounded-xl text-slate-500 ${query ? "" : "hidden"}`} aria-label="پاک کردن جستجو"><X size={15} /></button></div>
          <div className="flex items-center justify-between px-1"><span className="text-[9px] text-slate-500">{filtered.length} رقابت قابل نمایش</span>{(query || continent !== "all" || country !== "all") && <button type="button" onClick={clearFilters} className="text-[9px] font-black text-rose-300">پاک کردن فیلترها</button>}</div>
        </div>

        <section className="space-y-3"><div className="flex items-center justify-between px-1"><div><p className="text-[9px] font-black text-slate-500">EXPLORE</p><h2 className="mt-1 text-sm font-black">🌍 کشف رقابت‌ها</h2></div><span className="text-[9px] text-slate-500">{filtered.length} لیگ</span></div><div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"><button onClick={() => chooseContinent("all")} className={`shrink-0 rounded-2xl px-4 py-2.5 text-[10px] font-black transition ${continent === "all" ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/15" : "glass text-slate-400"}`}>همه 🌐</button>{CONTINENTS.map((item) => <button key={item.slug} onClick={() => chooseContinent(item.slug)} className={`shrink-0 rounded-2xl px-4 py-2.5 text-[10px] font-black transition ${continent === item.slug ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/15" : "glass text-slate-400"}`}>{item.icon} {item.name}</button>)}</div></section>

        <section className="space-y-2"><div className="flex items-center justify-between px-1"><h2 className="text-sm font-black">📍 انتخاب کشور</h2><span className="text-[9px] text-slate-600">فیلتر دقیق</span></div><select value={country} onChange={(event) => setCountry(event.target.value)} className="glass w-full rounded-2xl bg-[#0b111d] px-4 py-3.5 text-sm text-slate-200 outline-none"><option value="all">همه کشورهای این قاره</option>{countries.map((item) => <option key={item} value={item}>{item}</option>)}</select></section>

        {filtered.length === 0 ? <div className="glass rounded-3xl p-10 text-center"><Search className="mx-auto text-slate-600" size={28} /><p className="mt-3 font-bold">رقابتی پیدا نشد</p><p className="mt-1 text-[10px] text-slate-500">جستجو یا فیلتر را تغییر بده.</p></div> : <section className="space-y-6">{CONTINENTS.map((item) => { const entries = filtered.filter((league) => league.continent === item.slug); if (!entries.length) return null; return <div key={item.slug} className="space-y-2.5"><div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[.04]">{item.icon}</span><h2 className="text-sm font-black">{item.name}</h2></div><span className="rounded-full bg-white/[.04] px-2.5 py-1 text-[9px] text-slate-500">{entries.length} لیگ</span></div><div className="grid grid-cols-1 gap-2">{entries.map((league) => <LeagueCard key={league.slug} league={league} />)}</div></div> })}</section>}

        <section className="space-y-3"><div className="flex items-center justify-between px-1"><div><p className="text-[9px] font-black text-yellow-400">CONTINENTAL CUPS</p><h2 className="mt-1 text-sm font-black">🏆 جام‌های باشگاهی</h2></div><span className="text-[9px] text-slate-500">{CLUB_CUPS.length} رقابت</span></div><div className="grid grid-cols-1 gap-2">{CLUB_CUPS.map((cup) => <div key={cup.slug} className="glass group flex items-center gap-3 rounded-2xl p-4"><Link href={`/leagues/${cup.slug}`} className="flex min-w-0 flex-1 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-yellow-400/10 text-2xl">{cup.icon}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{cup.name}</b><small className="text-[10px] text-slate-500">{cup.country}</small></span><ChevronLeft size={16} className="text-slate-600 transition group-hover:text-yellow-400" /></Link><FavoriteButton type="league" name={cup.name} className="shrink-0 px-3 py-2 text-[9px]" /></div>)}</div></section>
      </div>
    </main>
  );
}
