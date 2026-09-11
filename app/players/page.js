"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Goal, Crosshair, Zap, BarChart3, Crown, Swords, Check, Filter, Users, Globe2, Shield, Sparkles } from "lucide-react";

function n(value) { const x = Number(value); return Number.isFinite(x) ? x : 0; }
function normalizePlayer(item) {
  const stats = item?.statistics?.[0] || {};
  const games = stats.games || {}; const goals = stats.goals || {}; const shots = stats.shots || {};
  const passes = stats.passes || {}; const tackles = stats.tackles || {}; const dribbles = stats.dribbles || {};
  const duels = stats.duels || {}; const cards = stats.cards || {};
  const appearances = n(games.appearances), minutes = n(games.minutes), goalTotal = n(goals.total), assistTotal = n(goals.assists);
  return { id:item?.player?.id, name:item?.player?.name||"بازیکن", photo:item?.player?.photo, age:item?.player?.age, nationality:item?.player?.nationality,
    team:stats.team?.name||"تیم نامشخص", logo:stats.team?.logo, pos:games.position||"—", rating:n(games.rating), appearances, minutes,
    goals:goalTotal, assists:assistTotal, shots:n(shots.total), shotsOn:n(shots.on), keyPasses:n(passes.key), passAccuracy:n(passes.accuracy),
    tackles:n(tackles.total), tacklesWon:n(tackles.won), dribblesWon:n(dribbles.success), duels:n(duels.total), duelsWon:n(duels.won),
    yellow:n(cards.yellow), red:n(cards.red), goals90:minutes?goalTotal*90/minutes:0, assists90:minutes?assistTotal*90/minutes:0 };
}
function power(p) {
  return Math.max(0, Math.min(100, (p.rating/10)*45 + Math.min(p.goals90/0.9,1)*20 + Math.min(p.assists90/0.6,1)*12 + Math.min(p.keyPasses/30,1)*8 + Math.min(p.shotsOn/20,1)*5 + Math.min(p.duelsWon/30,1)*5 + Math.min(p.tacklesWon/20,1)*5));
}

const QUICK_SEARCHES = ["Mbappe", "Haaland", "Lamine Yamal", "Bellingham", "Vinicius Jr", "Salah"];
const POSITIONS = ["همه پست‌ها", "Goalkeeper", "Defender", "Midfielder", "Attacker"];

export default function PlayersPage() {
  const [q,setQ]=useState(""); const [players,setPlayers]=useState([]); const [loading,setLoading]=useState(false); const [searched,setSearched]=useState(false); const [error,setError]=useState("");
  const [sort,setSort]=useState("power"); const [position,setPosition]=useState("همه پست‌ها"); const [country,setCountry]=useState("همه کشورها"); const [team,setTeam]=useState("همه تیم‌ها"); const [selected,setSelected]=useState([]); const [showFilters,setShowFilters]=useState(false);

  async function searchPlayers(event, forcedQuery) {
    event?.preventDefault(); const query=(forcedQuery ?? q).trim(); if(query.length<2)return;
    if(forcedQuery) setQ(forcedQuery); setLoading(true); setSearched(true); setError("");
    try { const response=await fetch(`/api/football/players?search=${encodeURIComponent(query)}`,{cache:"no-store"}); const payload=await response.json();
      if(!response.ok||!payload.ok) throw new Error(payload.error||"خطا در دریافت اطلاعات بازیکن");
      setPlayers((payload.players||[]).map(normalizePlayer));
    } catch(err) { setPlayers([]); setError(err?.message||"خطا در دریافت اطلاعات بازیکن"); } finally { setLoading(false); }
  }

  const countries=useMemo(()=>[...new Set(players.map(p=>p.nationality).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),[players]);
  const teams=useMemo(()=>[...new Set(players.map(p=>p.team).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),[players]);
  const filtered=useMemo(()=>players.filter(p=>(position==="همه پست‌ها"||p.pos===position)&&(country==="همه کشورها"||p.nationality===country)&&(team==="همه تیم‌ها"||p.team===team)),[players,position,country,team]);
  const ranked=useMemo(()=>filtered.map(p=>({...p,power:power(p)})).sort((a,b)=>{
    if(sort==="goals")return b.goals-a.goals; if(sort==="assists")return b.assists-a.assists; if(sort==="shots")return b.shots-a.shots;
    if(sort==="keyPasses")return b.keyPasses-a.keyPasses; if(sort==="tackles")return b.tackles-a.tackles; if(sort==="rating")return b.rating-a.rating;
    if(sort==="young")return n(a.age)-n(b.age); if(sort==="experience")return n(b.age)-n(a.age); return b.power-a.power;
  }),[filtered,sort]);
  const leader=ranked[0];
  function toggleCompare(player){setSelected(current=>current.some(p=>p.id===player.id)?current.filter(p=>p.id!==player.id):current.length<2?[...current,player]:[current[1],player]);}
  function compareNow(){if(selected.length===2)window.location.href=`/players/compare?a=${selected[0].id}&b=${selected[1].id}`;}
  function resetFilters(){setPosition("همه پست‌ها");setCountry("همه کشورها");setTeam("همه تیم‌ها");setSort("power");}

  return <main className="mobile-shell pb-10">
    <header className="px-5 pb-5 pt-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-wide text-sky-400">FOT10 • PLAYERS CENTER</p><h1 className="mt-1 text-2xl font-black">مرکز بازیکنان</h1><p className="mt-1 text-xs leading-5 text-slate-500">کشف، رتبه‌بندی و مقایسه بازیکنان فوتبال</p></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-400/10"><Users className="text-sky-400" size={21}/></div></div>
      <form onSubmit={searchPlayers} className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Search size={18} className="text-slate-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="نام بازیکن؛ مثلاً Mbappe" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/><button type="submit" disabled={loading||q.trim().length<2} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">جستجو</button></form>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{QUICK_SEARCHES.map(name=><button key={name} onClick={()=>searchPlayers(null,name)} className="shrink-0 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:bg-white/10">{name}</button>)}</div>
      {players.length>0&&<div className="mt-4 flex items-center gap-2"><button onClick={()=>setShowFilters(v=>!v)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black ${showFilters?"bg-sky-500 text-white":"bg-white/5 text-slate-400"}`}><Filter size={14}/> فیلترها</button><span className="text-[10px] text-slate-600">{ranked.length} نتیجه</span><button onClick={resetFilters} className="mr-auto text-[10px] text-slate-600">پاک‌سازی</button></div>}
      {showFilters&&players.length>0&&<div className="mt-3 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-3">
        <label className="rounded-xl bg-white/5 p-2"><span className="mb-1 flex items-center gap-1 text-[9px] text-slate-600"><Shield size={11}/> پست</span><select value={position} onChange={e=>setPosition(e.target.value)} className="w-full bg-transparent text-xs outline-none">{POSITIONS.map(x=><option key={x} value={x} className="bg-slate-900">{x}</option>)}</select></label>
        <label className="rounded-xl bg-white/5 p-2"><span className="mb-1 flex items-center gap-1 text-[9px] text-slate-600"><Globe2 size={11}/> کشور</span><select value={country} onChange={e=>setCountry(e.target.value)} className="w-full bg-transparent text-xs outline-none"><option className="bg-slate-900">همه کشورها</option>{countries.map(x=><option key={x} className="bg-slate-900">{x}</option>)}</select></label>
        <label className="rounded-xl bg-white/5 p-2"><span className="mb-1 flex items-center gap-1 text-[9px] text-slate-600"><Users size={11}/> تیم</span><select value={team} onChange={e=>setTeam(e.target.value)} className="w-full bg-transparent text-xs outline-none"><option className="bg-slate-900">همه تیم‌ها</option>{teams.map(x=><option key={x} className="bg-slate-900">{x}</option>)}</select></label>
      </div>}
      {players.length>0&&<div className="mt-3 flex gap-2 overflow-x-auto pb-1">{[["power","FOT10"],["rating","ریتینگ"],["goals","گل"],["assists","پاس گل"],["shots","شوت"],["keyPasses","پاس کلیدی"],["tackles","تکل"],["young","جوان‌ترین"],["experience","باتجربه‌ترین"]].map(([value,label])=><button key={value} onClick={()=>setSort(value)} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${sort===value?"bg-sky-500 text-white":"bg-white/5 text-slate-400"}`}>{label}</button>)}</div>}
    </header>

    <section className="space-y-3 px-5">
      {selected.length>0&&<div className="sticky top-2 z-40 rounded-2xl border border-sky-400/20 bg-slate-950/90 p-3 shadow-2xl backdrop-blur"><div className="flex items-center gap-3"><Swords size={18} className="shrink-0 text-sky-400"/><div className="min-w-0 flex-1"><b className="block text-xs">مقایسه بازیکنان</b><p className="truncate text-[10px] text-slate-500">{selected.map(p=>p.name).join(" × ")}</p></div><span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">{selected.length}/۲</span><button onClick={compareNow} disabled={selected.length!==2} className="rounded-xl bg-sky-500 px-3 py-2 text-[10px] font-black text-white disabled:opacity-30">مقایسه</button></div></div>}
      {leader&&<div className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-white/[0.03] to-transparent p-5"><div className="mb-3 flex items-center gap-2 text-[10px] font-black text-amber-400"><Crown size={14}/> صدرنشین فهرست فعلی</div><div className="flex items-center gap-4"><div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/5">{leader.photo&&<img src={leader.photo} alt={leader.name} className="h-full w-full object-cover"/>}<span className="absolute bottom-0 right-0 rounded-tl-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-black">#1</span></div><div className="min-w-0 flex-1"><p className="truncate text-lg font-black">{leader.name}</p><p className="text-xs text-slate-500">{leader.team} • {leader.pos}</p></div><div className="text-center"><b className="text-3xl text-amber-400">{leader.power.toFixed(0)}</b><p className="text-[9px] text-slate-500">قدرت FOT10</p></div></div></div>}
      {loading&&<div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-slate-400">در حال دریافت و محاسبه اطلاعات بازیکنان…</div>}
      {error&&<div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}
      {!loading&&!error&&searched&&!players.length&&<div className="py-12 text-center text-sm text-slate-500">بازیکنی پیدا نشد.</div>}
      {!loading&&!error&&searched&&players.length>0&&!ranked.length&&<div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-slate-500">با فیلترهای فعلی بازیکنی باقی نمانده است.</div>}
      {!searched&&<div className="rounded-3xl border border-white/10 bg-gradient-to-b from-sky-400/5 to-transparent p-6"><div className="mb-3 flex items-center gap-2 text-sky-400"><Sparkles size={17}/><b className="text-sm">شروع Players Center</b></div><p className="text-xs leading-6 text-slate-500">یک نام جستجو کن یا از پیشنهادهای بالا استفاده کن. بعد می‌توانی بازیکنان را بر اساس پست، کشور، تیم و شاخص‌های عملکرد مرتب و دو نفر را با هم مقایسه کنی.</p></div>}
      {ranked.map((player,index)=>{const isSelected=selected.some(p=>p.id===player.id); return <article key={`${player.id}-${player.team}`} className={`glass rounded-3xl p-4 transition ${isSelected?"border border-sky-400/50 ring-1 ring-sky-400/20":""}`}>
        <button onClick={()=>toggleCompare(player)} className="block w-full text-right" aria-label={`انتخاب ${player.name} برای مقایسه`}><div className="flex items-center gap-3"><div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/5">{player.photo?<img src={player.photo} alt={player.name} className="h-full w-full object-cover"/>:<span className="text-lg">⚽</span>}{isSelected&&<span className="absolute inset-0 grid place-items-center bg-sky-500/70"><Check size={22} className="text-white"/></span>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-[10px] font-black">{index+1}</span><h2 className="truncate font-black">{player.name}</h2></div><p className="mt-1 truncate text-xs text-slate-500">{player.team} • {player.pos}{player.age?` • ${player.age} سال`:""}</p></div><div className="text-left"><b className="text-2xl text-amber-400">{player.power.toFixed(0)}</b><p className="text-[10px] text-slate-600">FOT10</p></div></div>
        <div className="mt-4 grid grid-cols-4 gap-2"><div className="rounded-2xl bg-white/5 p-3"><Goal size={14} className="mb-1 text-emerald-400"/><p className="text-[10px] text-slate-500">گل</p><b className="text-lg">{player.goals}</b></div><div className="rounded-2xl bg-white/5 p-3"><Zap size={14} className="mb-1 text-sky-400"/><p className="text-[10px] text-slate-500">پاس گل</p><b className="text-lg">{player.assists}</b></div><div className="rounded-2xl bg-white/5 p-3"><Crosshair size={14} className="mb-1 text-violet-400"/><p className="text-[10px] text-slate-500">شوت</p><b className="text-lg">{player.shots}</b></div><div className="rounded-2xl bg-white/5 p-3"><BarChart3 size={14} className="mb-1 text-amber-400"/><p className="text-[10px] text-slate-500">دقیقه</p><b className="text-lg">{player.minutes}</b></div></div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-slate-400"><span>پاس کلیدی <b className="text-slate-200">{player.keyPasses}</b></span><span>تکل <b className="text-slate-200">{player.tackles}</b></span><span>دریبل موفق <b className="text-slate-200">{player.dribblesWon}</b></span><span>دوئل موفق <b className="text-slate-200">{player.duelsWon}</b></span></div>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-500"><span>گل/۹۰ <b className="text-emerald-300">{player.goals90.toFixed(2)}</b></span><span>پاس/۹۰ <b className="text-sky-300">{player.assists90.toFixed(2)}</b></span><span>دقت پاس <b className="text-slate-300">{player.passAccuracy||0}٪</b></span><span>کارت <b className="text-amber-300">{player.yellow}/{player.red}</b></span></div></button>
        <div className="mt-3 flex gap-2 border-t border-white/5 pt-3"><button onClick={()=>toggleCompare(player)} className={`flex-1 rounded-xl px-3 py-2 text-[10px] font-black ${isSelected?"bg-sky-500 text-white":"bg-white/5 text-slate-400"}`}>{isSelected?"✓ انتخاب شده":"+ انتخاب برای مقایسه"}</button><Link href={`/players/${player.id}`} className="rounded-xl bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-400">پروفایل</Link></div>
      </article>;})}
      {players.length>0&&<p className="pt-2 text-center text-[10px] leading-5 text-slate-600">داده‌ها از سرویس فوتبال پروژه دریافت می‌شوند؛ امتیاز FOT10 یک شاخص ترکیبی برای رتبه‌بندی همین نتایج است و رتبه رسمی نیست.</p>}
    </section>
  </main>;
}
