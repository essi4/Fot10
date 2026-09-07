"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Home, Trophy, Tv, ChevronLeft, RefreshCw, UserRound } from "lucide-react";
import Link from "next/link";

const tehranDate = (offset = 0) => {
  const d = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(d);
};
const fa = (value) => String(value ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

function Team({ name, logo }) {
  return <div className="flex min-w-0 items-center gap-2"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">{logo ? <img src={logo} alt="" className="h-8 w-8 object-contain" /> : <span className="text-sm font-black">{name?.slice(0, 1) || "?"}</span>}</div><span className="truncate text-sm font-bold">{name || "—"}</span></div>;
}
function MatchCard({ match }) {
  const live = ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"].includes(match.statusShort);
  const finished = ["FT", "AET", "PEN"].includes(match.statusShort);
  const time = match.date ? new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" }).format(new Date(match.date)) : "—";
  return <Link href={`/matches/${match.id}`} className="glass card block w-full p-4 transition-transform active:scale-[.985]"><div className="mb-4 flex items-center justify-between gap-2 text-[10px] text-slate-400"><span>{match.country || "فوتبال"} • {match.league || "مسابقه"}</span>{live ? <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 font-black text-emerald-300">● زنده {match.elapsed ? fa(`${match.elapsed}'`) : ""}</span> : <span>{finished ? "پایان" : fa(time)}</span>}</div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><Team name={match.home} logo={match.homeLogo} /><div className="min-w-[62px] text-center">{match.homeScore != null || match.awayScore != null ? <div className="text-xl font-black">{fa(match.homeScore ?? 0)} - {fa(match.awayScore ?? 0)}</div> : <div className="text-lg font-black">{fa(time)}</div>}<div className="mt-1 text-[9px] text-slate-500">{match.status || "برنامه‌ریزی‌شده"}</div></div><div className="justify-self-end"><Team name={match.away} logo={match.awayLogo} /></div></div><div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-500"><span>جزئیات و مرکز مسابقه</span><ChevronLeft size={14} /></div></Link>;
}

export default function HomePage() {
  const [day, setDay] = useState(0), [matches, setMatches] = useState([]), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState("");
  const date = useMemo(() => tehranDate(day), [day]);
  const load = async (silent = false) => { if (silent) setRefreshing(true); else setLoading(true); setError(""); try { const res = await fetch(`/api/football/fixtures?date=${date}`, { cache: "no-store" }); const json = await res.json(); if (!res.ok || !json.ok) throw new Error(json.error || "خطا در دریافت مسابقات"); setMatches(Array.isArray(json.matches) ? json.matches : []); } catch (e) { setError(e.message || "ارتباط با سرویس فوتبال برقرار نشد"); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { load(false); }, [date]);
  useEffect(() => { const id = setInterval(() => load(true), 30000); return () => clearInterval(id); }, [date]);
  const liveCount = matches.filter((m) => ["1H", "HT", "2H", "ET", "P", "BT", "LIVE"].includes(m.statusShort)).length;
  const leagueCount = new Set(matches.map((m) => `${m.country}|${m.league}`)).size;
  const nav = [["۱۰", Home, "/number10"], ["بازی‌ها", Tv, "/matches"], ["لیگ‌ها", Trophy, "/leagues"], ["حساب من", UserRound, "/account"]];
  return <main className="fot-container pb-28"><header className="py-6"><div className="flex items-center justify-between"><Link href="/" className="block"><div className="text-2xl font-black tracking-tight">FOT<span className="text-emerald-400">10</span></div><p className="mt-1 text-[10px] text-slate-500">نبض فوتبال، لحظه‌به‌لحظه</p></Link><button onClick={() => load(true)} disabled={refreshing} className="glass touch-target grid h-11 w-11 place-items-center rounded-2xl" aria-label="به‌روزرسانی"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button></div></header>
    <Link href="/number10" className="glass card mb-5 block overflow-hidden p-5 active:scale-[.99] transition-transform"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-yellow-400/10 text-4xl font-black italic text-yellow-300">۱۰</div><div className="flex-1"><p className="text-[10px] font-black text-yellow-300">FOT10</p><h1 className="text-xl font-black">جهان شماره ۱۰</h1><p className="mt-1 text-[10px] text-slate-500">بازیکنان پیراهن شماره ۱۰؛ دقیق و بدون بازیکن اضافه</p></div><ChevronLeft className="text-slate-500" size={18}/></div></Link>
    <section className="grid grid-cols-3 gap-2"><div className="glass rounded-2xl p-3 text-center"><div className="text-lg font-black text-emerald-300">{fa(liveCount)}</div><div className="text-[9px] text-slate-500">زنده</div></div><div className="glass rounded-2xl p-3 text-center"><div className="text-lg font-black">{fa(matches.length)}</div><div className="text-[9px] text-slate-500">بازی امروز</div></div><div className="glass rounded-2xl p-3 text-center"><div className="text-lg font-black">{fa(leagueCount)}</div><div className="text-[9px] text-slate-500">لیگ</div></div></section>
    <section className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black">مرکز مسابقات</h2><p className="mt-1 text-[10px] text-slate-500">داده زنده و برنامه بازی‌ها از منبع فوتبال</p></div><Activity size={19} className="text-emerald-400" /></div><div className="mb-4 grid grid-cols-3 gap-2">{[["دیروز", -1], ["امروز", 0], ["فردا", 1]].map(([label, value]) => <button key={value} onClick={() => setDay(value)} className={`touch-target rounded-2xl px-3 py-3 text-xs font-black ${day === value ? "bg-emerald-400 text-slate-950" : "glass text-slate-400"}`}>{label}</button>)}</div>{error && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-200">{error}</div>}{loading ? <div className="glass rounded-2xl p-8 text-center text-xs text-slate-500">در حال دریافت مسابقات واقعی…</div> : matches.length === 0 ? <div className="glass rounded-2xl p-8 text-center"><div className="text-sm font-bold">برای این روز مسابقه‌ای پیدا نشد</div><p className="mt-2 text-[10px] text-slate-500">به‌محض وجود مسابقه، اینجا نمایش داده می‌شود.</p></div> : <div className="space-y-3">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div>}</section>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#05070d]/90 px-2 py-2 backdrop-blur-xl"><div className="mx-auto grid max-w-xl grid-cols-4 gap-1">{nav.map(([label, Icon, href]) => <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] text-slate-500"><Icon size={17}/><span>{label}</span></Link>)}</div></nav>
  </main>;
}
