"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Shield, Trophy, UserRound, X, Globe2 } from "lucide-react";

const typeLabels = { teams: "تیم‌ها", players: "بازیکنان", leagues: "لیگ‌ها", countries: "کشورها" };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState({ teams: [], players: [], leagues: [], countries: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);

  useEffect(() => { return () => clearTimeout(timer.current); }, []);
  useEffect(() => {
    const value = query.trim();
    clearTimeout(timer.current);
    if (value.length < 2) { setData({ teams: [], players: [], leagues: [], countries: [] }); setLoading(false); return; }
    setLoading(true); setError("");
    timer.current = setTimeout(async () => {
      try { const response = await fetch(`/api/football/search?q=${encodeURIComponent(value)}`, { cache: "no-store" }); const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.error || "جستجو ناموفق بود"); setData(payload); }
      catch (err) { setError(err?.message || "جستجو ناموفق بود"); }
      finally { setLoading(false); }
    }, 350);
  }, [query]);

  const total = Object.values(data).reduce((sum, list) => sum + list.length, 0);
  return <main className="fot-shell min-h-screen"><div className="fot-container space-y-4 pb-10">
    <header className="flex items-center gap-3 pt-1"><Link href="/" aria-label="بازگشت" className="glass grid h-11 w-11 place-items-center rounded-2xl"><ArrowRight size={19}/></Link><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-emerald-300">FOT10 • GLOBAL SEARCH</p><h1 className="text-xl font-black">جستجوی سراسری</h1></div></header>
    <section className="glass card p-4"><div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={19}/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="تیم، بازیکن، لیگ یا کشور…" className="w-full rounded-2xl border border-white/5 bg-white/[.04] py-4 pl-11 pr-12 text-sm outline-none focus:border-emerald-400/30" />{query && <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 hover:text-white" aria-label="پاک کردن"><X size={16}/></button>}</div><div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500"><span>پیشنهاد:</span>{["پرسپولیس", "Real Madrid", "Messi", "Premier League"].map(item => <button key={item} onClick={() => setQuery(item)} className="rounded-full bg-white/5 px-3 py-1.5 hover:bg-white/10">{item}</button>)}</div></section>
    {query.trim().length < 2 ? <section className="glass card p-8 text-center"><Search className="mx-auto text-emerald-300" size={32}/><h2 className="mt-4 font-black">همه‌چیز را یک‌جا پیدا کن</h2><p className="mt-2 text-xs leading-6 text-slate-500">نام تیم، بازیکن، لیگ یا کشور را وارد کن. جستجو با تأخیر کوتاه انجام می‌شود تا درخواست‌های اضافی به سرویس فوتبال ارسال نشود.</p></section> : loading ? <div className="glass rounded-2xl p-8 text-center text-xs text-slate-500">در حال جستجوی FOT10…</div> : error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.05] p-4 text-xs text-rose-200">{error}</div> : total === 0 ? <div className="glass rounded-2xl p-8 text-center"><Search className="mx-auto text-slate-600" size={30}/><h2 className="mt-3 font-black">نتیجه‌ای پیدا نشد</h2><p className="mt-2 text-xs text-slate-500">نام فارسی یا انگلیسی دیگری را امتحان کن.</p></div> : <div className="space-y-4"><div className="text-[10px] text-slate-500">{total} نتیجه برای «{query.trim()}»</div><ResultSection title="تیم‌ها" icon={Shield} items={data.teams} render={(item) => <Link href={`/teams/${item.id}`} className="flex items-center gap-3 rounded-2xl bg-white/[.025] p-3 hover:bg-white/[.06]"><Logo src={item.logo} fallback="⚽"/><div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.name}</b><span className="text-[10px] text-slate-500">{item.country || "کشور نامشخص"}</span></div><ArrowRight size={14} className="text-slate-600"/></Link>} />
      <ResultSection title="بازیکنان" icon={UserRound} items={data.players} render={(item) => <Link href={`/players/${item.id}`} className="flex items-center gap-3 rounded-2xl bg-white/[.025] p-3 hover:bg-white/[.06]"><Logo src={item.photo} fallback="👤"/><div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.name}</b><span className="text-[10px] text-slate-500">{item.position || "بازیکن"}{item.team ? ` • ${item.team}` : ""}{item.nationality ? ` • ${item.nationality}` : ""}</span></div><ArrowRight size={14} className="text-slate-600"/></Link>} />
      <ResultSection title="لیگ‌ها" icon={Trophy} items={data.leagues} render={(item) => <Link href={`/leagues?search=${encodeURIComponent(item.name)}`} className="flex items-center gap-3 rounded-2xl bg-white/[.025] p-3 hover:bg-white/[.06]"><Logo src={item.logo} fallback="🏆"/><div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.name}</b><span className="text-[10px] text-slate-500">{item.country || "بین‌المللی"}{item.type ? ` • ${item.type}` : ""}</span></div><ArrowRight size={14} className="text-slate-600"/></Link>} />
      <ResultSection title="کشورها" icon={Globe2} items={data.countries} render={(item) => <Link href={`/national-teams?country=${encodeURIComponent(item.name)}`} className="flex items-center gap-3 rounded-2xl bg-white/[.025] p-3 hover:bg-white/[.06]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-xl">{item.flag || "🌍"}</span><div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.name}</b><span className="text-[10px] text-slate-500">{item.code || "کشور فوتبال"}</span></div><ArrowRight size={14} className="text-slate-600"/></Link>} />
    </div>}
  </div></main>;
}

function ResultSection({ title, icon: Icon, items, render }) { if (!items?.length) return null; return <section className="glass card p-4"><div className="mb-3 flex items-center gap-2"><Icon size={17} className="text-emerald-300"/><h2 className="font-black">{title}</h2><span className="mr-auto text-[10px] text-slate-600">{items.length}</span></div><div className="space-y-2">{items.map((item, index) => <div key={`${title}-${item.id || item.name}-${index}`}>{render(item)}</div>)}</div></section>; }
function Logo({ src, fallback }) { return <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5 text-lg">{src ? <img src={src} alt="" className="h-9 w-9 object-contain" /> : fallback}</div>; }
