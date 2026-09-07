"use client";

import { useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronLeft, Flame, Home, Search, Shield, Star, Trophy, Tv, Users, Zap } from "lucide-react";

const matches = [
  { id: 1, league: "لیگ قهرمانان اروپا", home: "بارسلونا", away: "پاری‌سن‌ژرمن", time: "21:30", status: "امشب", homeScore: null, awayScore: null, hot: true },
  { id: 2, league: "لالیگا", home: "رئال مادرید", away: "اتلتیکو مادرید", time: "23:00", status: "امشب", homeScore: null, awayScore: null, hot: true },
  { id: 3, league: "پریمیر لیگ", home: "آرسنال", away: "لیورپول", time: "18:30", status: "فردا", homeScore: null, awayScore: null, hot: false },
];

const table = [
  [1, "آرسنال", 24, 58], [2, "لیورپول", 24, 55], [3, "منچسترسیتی", 24, 51], [4, "چلسی", 24, 45], [5, "نیوکاسل", 24, 41]
];

const leagues = ["همه", "ایران", "اروپا", "انگلیس", "اسپانیا", "آلمان"];

function Team({ name, tone = "bg-white/10 text-white" }) {
  return <div className="flex items-center gap-2 min-w-0"><div className={`h-10 w-10 shrink-0 rounded-2xl grid place-items-center text-sm font-black ${tone}`}>{name.slice(0, 1)}</div><span className="truncate font-bold text-sm">{name}</span></div>;
}

function MatchCard({ match, onOpen }) {
  return <button onClick={() => onOpen(match)} className="glass card p-4 w-full text-right active:scale-[.99] transition-transform">
    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-[11px] text-slate-400"><Trophy size={13} />{match.league}</div>{match.hot && <span className="rounded-full bg-orange-400/10 text-orange-300 px-2 py-1 text-[10px] font-bold">🔥 داغ</span>}</div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><Team name={match.home} tone="bg-blue-500/15 text-blue-300"/><div className="text-center min-w-[64px]"><div className="text-base font-black">{match.time}</div><div className="text-[10px] text-slate-500 mt-1">{match.status}</div></div><div className="justify-self-end"><Team name={match.away} tone="bg-red-500/15 text-red-300"/></div></div>
    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500"><span>مشاهده مرکز مسابقه</span><ChevronLeft size={15}/></div>
  </button>;
}

function MatchCenter({ match, close }) {
  const events = [["18'", "کارت زرد", match.home], ["31'", "موقعیت خطرناک", match.away], ["45'", "پایان نیمه اول", "بازی"]];
  return <div className="fixed inset-0 z-50 bg-[#060810]/95 backdrop-blur-xl overflow-y-auto"><div className="fot-container">
    <button onClick={close} className="glass rounded-2xl px-4 py-2 text-xs mb-5">← بازگشت</button>
    <div className="glass card p-5 text-center"><div className="text-xs text-slate-400">{match.league}</div><div className="text-[10px] text-emerald-400 font-bold mt-2">● CENTER • DEMO DATA</div><div className="grid grid-cols-3 items-center gap-3 mt-7"><div><div className="mx-auto h-16 w-16 rounded-3xl bg-blue-500/15 text-blue-300 grid place-items-center text-xl font-black">{match.home[0]}</div><div className="font-black mt-3">{match.home}</div></div><div><div className="text-3xl font-black">—</div><div className="text-xs text-slate-500 mt-2">{match.time}</div></div><div><div className="mx-auto h-16 w-16 rounded-3xl bg-red-500/15 text-red-300 grid place-items-center text-xl font-black">{match.away[0]}</div><div className="font-black mt-3">{match.away}</div></div></div>
      <div className="grid grid-cols-3 gap-2 mt-7"><Stat n="—" t="نتیجه"/><Stat n="0" t="گل"/><Stat n="—" t="xG"/></div>
    </div>
    <div className="glass card p-5 mt-4"><h3 className="font-black mb-5">رویدادهای مسابقه</h3>{events.map(([time,title,team]) => <div key={time} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"><span className="text-xs text-emerald-400 font-black w-10">{time}</span><div className="h-2 w-2 rounded-full bg-emerald-400"/><div><div className="text-sm font-bold">{title}</div><div className="text-[10px] text-slate-500 mt-1">{team}</div></div></div>)}</div>
    <div className="grid grid-cols-2 gap-3 mt-4"><Stat n="—" t="مالکیت"/><Stat n="—" t="شوت"/><Stat n="—" t="شوت در چارچوب"/><Stat n="—" t="کرنر"/></div>
  </div></div>;
}
function Stat({ n, t }) { return <div className="rounded-2xl bg-white/[.04] p-3 text-center"><div className="text-lg font-black">{n}</div><div className="text-[10px] text-slate-500 mt-1">{t}</div></div>; }

export default function HomePage() {
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => matches.filter(m => `${m.home} ${m.away} ${m.league}`.includes(query)), [query]);

  return <main className="fot-shell">
    <div className="fot-container space-y-5">
      <header className="flex items-center justify-between pt-2"><div className="flex items-center gap-2"><div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center shadow-lg shadow-emerald-500/20"><Zap size={22} fill="currentColor"/></div><div><h1 className="text-2xl font-black tracking-tight">FOT<span className="text-emerald-400">10</span></h1><p className="text-[11px] text-slate-400">نبض فوتبال، لحظه‌به‌لحظه</p></div></div><button className="glass h-11 w-11 rounded-2xl grid place-items-center"><Bell size={20}/></button></header>

      {tab === "home" && <>
        <section className="hero glass card p-5 overflow-hidden relative"><div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl"/><div className="relative flex items-start justify-between"><div><p className="text-xs text-slate-400 mb-1">فوتبال امروز</p><h2 className="text-2xl font-black leading-tight">هیچ لحظه‌ای را<br/>از دست نده ⚡</h2></div><Flame className="text-orange-400" size={29}/></div><div className="grid grid-cols-3 gap-2 mt-5 relative">{[["LIVE","بازی زنده"],["24","امروز"],["12","لیگ"]].map(([n,t])=><div key={t} className="rounded-2xl bg-white/[.05] p-3"><div className="font-black text-lg">{n}</div><div className="text-[10px] text-slate-400 mt-1">{t}</div></div>)}</div></section>
        <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none placeholder:text-slate-500" placeholder="تیم، بازیکن یا لیگ را جستجو کن..."/></div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">{leagues.map((x,i)=><button key={x} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold border ${i===0?'bg-emerald-400 text-slate-950 border-emerald-400':'glass border-white/10 text-slate-300'}`}>{x}</button>)}</div>
        <section><div className="flex items-center justify-between mb-3"><h2 className="font-black text-lg">بازی‌های مهم</h2><span className="text-[10px] text-slate-500">دمو • آماده اتصال API</span></div><div className="space-y-3">{filtered.map(m=><MatchCard key={m.id} match={m} onOpen={setSelected}/>)}</div></section>
      </>}

      {tab === "matches" && <section><PageTitle icon={CalendarDays} title="همه بازی‌ها" sub="برنامه مسابقات و نتایج"/><div className="glass card p-4 mb-4"><div className="flex gap-2"><span className="rounded-xl bg-emerald-400/10 text-emerald-300 px-3 py-2 text-xs font-bold">امروز</span><span className="rounded-xl bg-white/5 text-slate-400 px-3 py-2 text-xs">فردا</span><span className="rounded-xl bg-white/5 text-slate-400 px-3 py-2 text-xs">دیروز</span></div></div><div className="space-y-3">{matches.map(m=><MatchCard key={m.id} match={m} onOpen={setSelected}/>)}</div></section>}

      {tab === "leagues" && <section><PageTitle icon={Trophy} title="لیگ‌ها" sub="رقابت‌های محبوب فوتبال"/><div className="grid grid-cols-2 gap-3">{["لیگ برتر انگلیس","لالیگا","سری آ","بوندسلیگا","لیگ قهرمانان","لیگ برتر ایران"].map((x,i)=><button key={x} className="glass card p-5 text-right"><div className="h-12 w-12 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center mb-4"><Trophy size={22}/></div><div className="font-black text-sm">{x}</div><div className="text-[10px] text-slate-500 mt-1">جدول • بازی‌ها • اخبار</div></button>)}</div></section>}

      {tab === "search" && <section><PageTitle icon={Search} title="جستجو" sub="تیم، بازیکن و لیگ"/><div className="relative mb-4"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none" placeholder="مثلاً رئال مادرید"/></div><div className="space-y-2">{filtered.map(m=><button onClick={()=>setSelected(m)} key={m.id} className="glass w-full rounded-2xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><Users size={18} className="text-emerald-400"/><span className="font-bold text-sm">{m.home} — {m.away}</span></div><ChevronLeft size={16}/></button>)}</div></section>}

      <section className="glass card p-4 flex items-center gap-3"><Shield size={19} className="text-emerald-400"/><div><div className="text-xs font-black">FOT10 در حال ساخته‌شدن است</div><div className="text-[10px] text-slate-500 mt-1">داده‌های نمایشی هستند؛ اتصال به منبع معتبر در مرحله بعد انجام می‌شود.</div></div></section>
    </div>

    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-[#080b14]/90 backdrop-blur-xl"><div className="mx-auto max-w-[760px] grid grid-cols-4 px-5 py-3 text-[10px] text-slate-500">{[["خانه",Home,"home"],["بازی‌ها",Tv,"matches"],["لیگ‌ها",Trophy,"leagues"],["جستجو",Search,"search"]].map(([label,Icon,id])=><button key={id} onClick={()=>setTab(id)} className={`flex flex-col items-center gap-1 ${tab===id?'text-emerald-400':''}`}><Icon size={20}/><span className="font-bold">{label}</span></button>)}</div></nav>
    {selected && <MatchCenter match={selected} close={()=>setSelected(null)}/>} 
  </main>;
}

function PageTitle({ icon: Icon, title, sub }) { return <div className="mb-5"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center"><Icon size={21}/></div><div><h2 className="text-xl font-black">{title}</h2><p className="text-[11px] text-slate-500 mt-1">{sub}</p></div></div></div>; }
