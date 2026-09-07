"use client";

import { ArrowRight, ChevronLeft, Search, Shield, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const quickTeams = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Bayern Munich", "Persepolis"];

export default function TeamsPage() {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchTeam(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setLoading(true); setError(""); setTeam(null);
    try {
      const response = await fetch(`/api/football/teams?search=${encodeURIComponent(value)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "تیم پیدا نشد");
      setTeam(payload);
    } catch (err) { setError(err?.message || "جستجوی تیم ناموفق بود"); }
    finally { setLoading(false); }
  }

  function pick(name) { setQuery(name); }

  return <main className="fot-shell"><div className="fot-container space-y-5">
    <header className="flex items-center gap-3"><Link href="/" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">تیم‌ها</h1><p className="text-[11px] text-slate-500">جستجوی تیم واقعی و ورود به پرونده آماری</p></div></header>
    <form onSubmit={searchTeam} className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-20 outline-none" placeholder="مثلاً Real Madrid..."/><button className="absolute left-2 top-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950" disabled={loading}>{loading ? "..." : "جستجو"}</button></form>
    <div className="flex flex-wrap gap-2">{quickTeams.map((name) => <button key={name} onClick={() => pick(name)} className="rounded-xl bg-white/5 px-3 py-2 text-[10px] text-slate-400">{name}</button>)}</div>
    {error && <div className="glass rounded-2xl p-4 text-xs text-red-300">{error}</div>}
    {team?.team && <Link href={`/teams/${team.team.id}`} className="glass card rounded-3xl p-5 flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-white/5 grid place-items-center overflow-hidden">{team.team.logo ? <img src={team.team.logo} alt="" className="h-14 w-14 object-contain"/> : <Shield size={24}/>}</div><div className="min-w-0 flex-1"><b className="block text-lg truncate">{team.team.name}</b><p className="text-xs text-slate-500 mt-1">{team.team.country || "—"}{team.team.national ? " · تیم ملی" : ""}</p><div className="mt-3 flex items-center gap-1 text-[10px] text-cyan-300">پرونده تیم <ChevronLeft size={12}/></div></div><Star size={18} className="text-slate-600"/></Link>}
    <div className="glass rounded-2xl p-4 text-xs leading-6 text-slate-500">اینجا دیگر تیم‌های نمونه یا آمار ساختگی نداریم؛ نتیجه جستجو از منبع زنده فوتبال می‌آید.</div>
  </div></main>;
}
