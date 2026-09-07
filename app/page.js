"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronLeft,
  Clock3,
  Flame,
  Home,
  MapPin,
  Newspaper,
  Search,
  Shield,
  Star,
  Trophy,
  Tv,
  Users,
  Video,
  Zap,
  CloudSun,
  CircleDot,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";

const matches = [
  { id: 1, league: "لیگ قهرمانان اروپا", country: "اروپا", home: "بارسلونا", away: "پاری‌سن‌ژرمن", time: "21:30", status: "امشب", homeScore: null, awayScore: null, hot: true },
  { id: 2, league: "لالیگا", country: "اسپانیا", home: "رئال مادرید", away: "اتلتیکو مادرید", time: "23:00", status: "امشب", homeScore: null, awayScore: null, hot: true },
  { id: 3, league: "پریمیر لیگ", country: "انگلیس", home: "آرسنال", away: "لیورپول", time: "18:30", status: "فردا", homeScore: null, awayScore: null, hot: false },
  { id: 4, league: "لیگ برتر ایران", country: "ایران", home: "پرسپولیس", away: "نفت آبادان", time: "18:30", status: "امروز", homeScore: null, awayScore: null, hot: true },
  { id: 5, league: "لیگ برتر ایران", country: "ایران", home: "سپاهان", away: "فولاد", time: "19:00", status: "امروز", homeScore: null, awayScore: null, hot: false },
];

const news = [
  ["پیشنهاد بزرگ برای ستاره ایرانی؛ مذاکره‌ها وارد مرحله تازه شد", "خبرگزاری مهر", "۷ ساعت پیش"],
  ["رویس رسماً به پاری‌سن‌ژرمن پیوست", "تسنیم", "۹ ساعت پیش"],
  ["آخرین وضعیت نقل‌وانتقالات فوتبال اروپا", "FOT10 News", "۱۱ ساعت پیش"],
];

const standings = [
  [1, "آرسنال", 24, 58, "+31"], [2, "لیورپول", 24, 55, "+24"], [3, "منچسترسیتی", 24, 51, "+19"], [4, "چلسی", 24, 45, "+12"], [5, "نیوکاسل", 24, 41, "+7"],
];

const lineup = [
  ["داوید دخیا", "7.4", "دروازه‌بان"], ["دیوگو دالو", "7.0", "مدافع"], ["رافائل واران", "7.1", "مدافع"], ["لیساندرو مارتینز", "7.1", "مدافع"], ["تایرل مالاسیا", "6.8", "مدافع"],
  ["مک‌تومینای", "7.0", "هافبک"], ["اریکسن", "6.5", "هافبک"], ["جیدن سانچو", "7.5", "مهاجم"], ["برونو فرناندز", "7.2", "هافبک"], ["آنتونی الانگا", "6.9", "مهاجم"], ["مارکوس رشفورد", "7.5", "مهاجم"],
];

function Team({ name, tone = "bg-white/10 text-white" }) {
  return <div className="flex items-center gap-2 min-w-0"><div className={`h-11 w-11 shrink-0 rounded-2xl grid place-items-center text-sm font-black ring-1 ring-white/5 ${tone}`}>{name.slice(0, 1)}</div><span className="truncate font-bold text-sm">{name}</span></div>;
}

function MatchCard({ match, onOpen }) {
  return <button onClick={() => onOpen(match)} className="glass card p-4 w-full text-right active:scale-[.985] transition-transform duration-150">
    <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-[11px] text-slate-400"><Trophy size={13} />{match.league}</div>{match.hot && <span className="rounded-full bg-orange-400/10 text-orange-300 px-2.5 py-1 text-[10px] font-bold">🔥 داغ</span>}</div>
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><Team name={match.home} tone="bg-blue-500/15 text-blue-300"/><div className="text-center min-w-[68px]"><div className="text-lg font-black tracking-tight">{match.time}</div><div className="text-[10px] text-slate-500 mt-1">{match.status}</div></div><div className="justify-self-end"><Team name={match.away} tone="bg-red-500/15 text-red-300"/></div></div>
    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400"><span>ورود به مرکز مسابقه</span><ChevronLeft size={15}/></div>
  </button>;
}

function StatBar({ label, left, right, percent = 50 }) {
  return <div className="py-3"><div className="flex justify-between text-xs font-bold mb-2"><span>{left}</span><span className="text-slate-500">{label}</span><span>{right}</span></div><div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-emerald-300 to-cyan-400" style={{ width: `${percent}%` }}/></div></div>;
}

function MatchCenter({ match, close }) {
  const [tab, setTab] = useState("events");
  const tabs = [["events", "گزارش زنده", Activity], ["stats", "آمار", Activity], ["lineup", "ترکیب", Users], ["table", "جدول", Trophy], ["info", "اطلاعات", MapPin], ["video", "ویدیو", Video]];
  const events = [["90+2'", "پایان بازی", "سوت پایان مسابقه"], ["78'", "تعویض", `${match.home} • بازیکن جدید وارد شد`], ["64'", "کارت زرد", match.away], ["52'", "موقعیت خطرناک", match.home], ["45'", "پایان نیمه اول", "بازی"]];
  return <div className="fixed inset-0 z-50 bg-[#05070d]/96 backdrop-blur-xl overflow-y-auto overscroll-contain">
    <div className="fot-container pb-10">
      <div className="flex items-center justify-between mb-4"><button onClick={close} className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">← بازگشت</button><button className="glass touch-target h-11 w-11 rounded-2xl grid place-items-center"><Star size={19}/></button></div>
      <section className="glass card p-5 text-center overflow-hidden relative"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400"/><div className="text-xs text-slate-400">{match.league}</div><div className="inline-flex items-center gap-2 mt-2 rounded-full bg-emerald-400/10 text-emerald-300 px-3 py-1 text-[10px] font-black"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-pulse"/> DEMO • مرکز مسابقه</div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-7"><div><div className="mx-auto h-16 w-16 rounded-3xl bg-blue-500/15 text-blue-300 grid place-items-center text-xl font-black">{match.home[0]}</div><div className="font-black mt-3 text-sm">{match.home}</div></div><div><div className="text-4xl font-black tracking-tight">—</div><div className="text-xs text-slate-500 mt-2">{match.time}</div></div><div><div className="mx-auto h-16 w-16 rounded-3xl bg-red-500/15 text-red-300 grid place-items-center text-xl font-black">{match.away[0]}</div><div className="font-black mt-3 text-sm">{match.away}</div></div></div>
        <div className="grid grid-cols-3 gap-2 mt-7"><Stat n="—" t="نتیجه"/><Stat n="0" t="گل"/><Stat n="—" t="xG"/></div>
      </section>
      <div className="glass rounded-2xl p-1 mt-4 overflow-x-auto scrollbar-none flex gap-1">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`shrink-0 touch-target rounded-xl px-3 text-[11px] font-bold flex items-center gap-1.5 ${tab===id?'bg-emerald-400 text-slate-950':'text-slate-400'}`}><Icon size={14}/>{label}</button>)}</div>
      {tab === "events" && <section className="glass card p-5 mt-4"><div className="flex items-center justify-between mb-4"><h3 className="font-black">گزارش زنده</h3><span className="text-[10px] text-slate-500">لحظه‌به‌لحظه</span></div>{events.map(([time,title,detail])=><div key={time} className="relative flex gap-3 py-3 border-b border-white/5 last:border-0"><span className="text-xs text-emerald-400 font-black w-12">{time}</span><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10"/><div><div className="text-sm font-bold">{title}</div><div className="text-[10px] text-slate-500 mt-1">{detail}</div></div></div>)}</section>}
      {tab === "stats" && <section className="glass card p-5 mt-4"><h3 className="font-black mb-3">آمار مسابقه</h3><StatBar label="مالکیت" left="48%" right="52%" percent={48}/><StatBar label="شوت" left="8" right="11" percent={42}/><StatBar label="شوت در چارچوب" left="3" right="5" percent={38}/><StatBar label="کرنر" left="4" right="6" percent={40}/><StatBar label="xG" left="0.92" right="1.36" percent={41}/><div className="grid grid-cols-2 gap-3 mt-3"><Stat n="86%" t="دقت پاس"/><Stat n="12" t="حملات خطرناک"/></div></section>}
      {tab === "lineup" && <section className="glass card p-5 mt-4"><div className="flex items-center justify-between mb-4"><h3 className="font-black">نمره بازیکنان</h3><span className="text-[10px] text-slate-500">منچستر یونایتد • 4-2-3-1</span></div><div className="space-y-2">{lineup.map(([name,rating,pos],i)=><div key={name} className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3"><span className="w-6 text-xs text-slate-600 font-black">{i+1}</span><div className="h-9 w-9 rounded-xl bg-white/5 grid place-items-center text-xs font-black">{name[0]}</div><div className="min-w-0 flex-1"><div className="text-sm font-bold truncate">{name}</div><div className="text-[10px] text-slate-500 mt-0.5">{pos}</div></div><div className={`rounded-xl px-2.5 py-1.5 text-xs font-black ${Number(rating)>=7.5?'bg-emerald-400/15 text-emerald-300':'bg-white/5 text-slate-300'}`}>{rating}</div></div>)}</div></section>}
      {tab === "table" && <section className="glass card p-5 mt-4"><div className="flex items-center justify-between mb-4"><h3 className="font-black">جدول لیگ</h3><span className="text-[10px] text-slate-500">پریمیر لیگ • دمو</span></div><div className="space-y-1">{standings.map(([rank,team,played,points,gd])=><div key={team} className="grid grid-cols-[24px_1fr_42px_42px] gap-2 items-center rounded-xl px-2 py-3 bg-white/[.025] text-xs"><span className="text-slate-500">{rank}</span><span className="font-bold">{team}</span><span className="text-center text-slate-500">{played}</span><span className="text-center font-black">{points}</span></div>)}</div><div className="grid grid-cols-[24px_1fr_42px_42px] px-2 mt-2 text-[9px] text-slate-600"><span>#</span><span>تیم</span><span className="text-center">ب</span><span className="text-center">امتیاز</span></div></section>}
      {tab === "info" && <section className="glass card p-5 mt-4"><h3 className="font-black mb-4">اطلاعات بازی</h3><div className="space-y-3">{[[CalendarDays,"چهارشنبه، ۹ شهریور ۱۴۰۱، ۱۸:۳۰"],[Trophy,"هفته ۴ • لیگ برتر • ۲۰۲۲/۲۰۲۳"],[Users,"داور: سامان سلطانی"],[Tv,"شبکه سه"],[MapPin,"ورزشگاه آزادی • تهران"],[CloudSun,"۳۳°C • آسمان صاف"]].map(([Icon,text])=><div key={text} className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3"><Icon size={17} className="text-emerald-400"/><span className="text-xs font-bold">{text}</span></div>)}</div></section>}
      {tab === "video" && <section className="glass card p-4 mt-4"><div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 grid place-items-center relative overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,.18),transparent_45%)]"/><div className="h-16 w-16 rounded-full bg-emerald-400 text-slate-950 grid place-items-center shadow-2xl"><Video size={26} fill="currentColor"/></div><span className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2 py-1 text-[9px]">ویدیوی نمایشی</span></div><h3 className="font-black text-sm mt-4">خلاصه بازی و مهم‌ترین لحظات</h3><p className="text-[10px] text-slate-500 mt-1">ویدیوهای رسمی پس از اتصال منبع معتبر نمایش داده می‌شوند.</p></section>}
      <div className="mt-4 grid grid-cols-2 gap-3"><Stat n="—" t="مالکیت"/><Stat n="—" t="شوت"/><Stat n="—" t="کرنر"/><Stat n="—" t="کارت"/></div>
    </div>
  </div>;
}

function Stat({ n, t }) { return <div className="rounded-2xl bg-white/[.04] p-3 text-center"><div className="text-lg font-black">{n}</div><div className="text-[10px] text-slate-500 mt-1">{t}</div></div>; }

function PageTitle({ icon: Icon, title, sub }) { return <div className="mb-5"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center"><Icon size={21}/></div><div><h2 className="text-xl font-black">{title}</h2><p className="text-[11px] text-slate-500 mt-1">{sub}</p></div></div></div>; }

export default function HomePage() {
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("همه");
  const filtered = useMemo(() => matches.filter(m => `${m.home} ${m.away} ${m.league}`.includes(query.trim()) && (league === "همه" || m.country === league)), [query, league]);
  const nav = [["خانه",Home,"home"],["بازی‌ها",Tv,"matches"],["اخبار",Newspaper,"news"],["لیگ‌ها",Trophy,"leagues"],["جستجو",Search,"search"]];
  return <main className="fot-shell">
    <div className="fot-container space-y-5">
      <header className="flex items-center justify-between pt-1"><div className="flex items-center gap-2.5"><div className="h-12 w-12 rounded-[18px] bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center shadow-xl shadow-emerald-500/15"><Zap size={23} fill="currentColor"/></div><div><h1 className="text-[26px] leading-none font-black tracking-tight">FOT<span className="text-emerald-400">10</span></h1><p className="text-[11px] text-slate-400 mt-1.5">نبض فوتبال، لحظه‌به‌لحظه</p></div></div><button aria-label="اعلان‌ها" className="glass touch-target h-11 w-11 rounded-2xl grid place-items-center"><Bell size={20}/></button></header>
      {tab === "home" && <>
        <section className="hero glass card p-5 overflow-hidden relative"><div className="absolute -left-16 -top-20 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl"/><div className="absolute -right-20 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl"/><div className="relative flex items-start justify-between"><div><p className="text-xs text-slate-400 mb-1.5">فوتبال امروز</p><h2 className="text-[25px] font-black leading-[1.25]">هیچ لحظه‌ای را<br/>از دست نده ⚡</h2></div><div className="h-10 w-10 rounded-2xl bg-orange-400/10 grid place-items-center"><Flame className="text-orange-400" size={22}/></div></div><div className="grid grid-cols-3 gap-2 mt-6 relative">{[["LIVE","بازی زنده",true],["24","امروز",false],["12","لیگ",false]].map(([n,t,live])=><div key={t} className="rounded-2xl bg-white/[.055] border border-white/5 p-3"><div className={`font-black text-lg ${live?'text-emerald-300':''}`}>{live && <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-1.5 live-pulse"/>}{n}</div><div className="text-[10px] text-slate-400 mt-1">{t}</div></div>)}</div></section>
        <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input aria-label="جستجو" value={query} onChange={e=>setQuery(e.target.value)} className="glass w-full rounded-2xl py-3.5 pr-11 pl-4 outline-none focus:ring-2 focus:ring-emerald-400/20 transition" placeholder="تیم، بازیکن یا لیگ را جستجو کن..."/></div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">{["همه","ایران","انگلیس","اسپانیا","اروپا"].map(x=><button key={x} onClick={()=>setLeague(x)} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold border transition ${league===x?'bg-emerald-400 text-slate-950 border-emerald-400':'glass border-white/10 text-slate-300'}`}>{x}</button>)}</div>
        <section><div className="flex items-end justify-between mb-3"><div><h2 className="font-black text-lg">بازی‌های مهم</h2><p className="text-[10px] text-slate-500 mt-1">منتخب FOT10</p></div><span className="text-[10px] text-slate-500">دمو • آماده API</span></div><div className="space-y-3">{filtered.map(m=><MatchCard key={m.id} match={m} onOpen={setSelected}/>)}</div>{filtered.length===0&&<div className="glass rounded-2xl p-7 text-center text-sm text-slate-500">نتیجه‌ای پیدا نشد</div>}</section>
      </>}
      {tab === "matches" && <section><PageTitle icon={CalendarDays} title="نتایج زنده" sub="امروز • دیروز • فردا"/><div className="glass card p-3 mb-4 flex gap-2 overflow-x-auto scrollbar-none">{["دوشنبه ۰۷ شهریور","دیروز","امروز","فردا","جمعه ۱۱ شهریور"].map((x,i)=><button key={x} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${i===2?'bg-emerald-400 text-slate-950':'bg-white/5 text-slate-400'}`}>{x}</button>)}</div><div className="glass card p-4 mb-4"><div className="flex items-center gap-2 text-xs font-black"><CircleDot size={15} className="text-emerald-400"/> ایران • لیگ برتر</div><div className="mt-3 grid grid-cols-1 gap-2">{[["تراکتور","هوادار","LIVE • ۸'"],["پرسپولیس","نفت آبادان","۱۸:۳۰"],["سپاهان","فولاد","۱۹:۰۰"],["مس رفسنجان","آلومینیوم اراک","۱۹:۳۰"]].map(([a,b,t])=><button key={a} onClick={()=>setSelected({...matches[3],home:a,away:b,time:t.replace("LIVE • ",""),status:t.startsWith("LIVE")?"زنده":"امروز"})} className="flex items-center justify-between rounded-xl bg-white/[.035] p-3"><span className="text-xs font-bold">{a}</span><span className="text-[10px] text-emerald-300 font-black">{t}</span><span className="text-xs font-bold">{b}</span></button>)}</div></div><div className="space-y-3">{matches.slice(0,3).map(m=><MatchCard key={m.id} match={m} onOpen={setSelected}/>)}</div></section>}
      {tab === "news" && <section><PageTitle icon={Newspaper} title="آخرین اخبار" sub="نبض خبرهای فوتبال ایران و جهان"/><div className="glass rounded-2xl p-1 flex gap-1 overflow-x-auto scrollbar-none mb-4">{["اخبار من","آخرین اخبار","هایلایت","ایران","سراسر جهان"].map((x,i)=><button key={x} className={`shrink-0 rounded-xl px-3 py-2.5 text-[10px] font-bold ${i===1?'bg-emerald-400 text-slate-950':'text-slate-400'}`}>{x}</button>)}</div><div className="flex items-center gap-2 text-xs font-black mb-3"><Flame size={15} className="text-orange-400"/> بیشترین مشاهده در ۲۴ ساعت گذشته</div><div className="space-y-3">{news.map(([title,source,time],i)=><article key={title} className="glass card p-4"><div className="flex gap-3"><div className="h-11 w-11 shrink-0 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center font-black">{i+1}</div><div className="min-w-0"><h3 className="text-sm font-black leading-6">{title}</h3><div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500"><span>{source}</span><span>•</span><Clock3 size={11}/><span>{time}</span></div></div></div></article>)}</div></section>}
      {tab === "leagues" && <section><PageTitle icon={Trophy} title="لیگ‌ها" sub="رقابت‌های محبوب فوتبال"/><div className="grid grid-cols-2 gap-3">{["لیگ برتر انگلیس","لالیگا","سری آ","بوندسلیگا","لیگ قهرمانان","لیگ برتر ایران"].map(x=><button key={x} className="glass card p-4 text-right active:scale-[.985] transition"><div className="h-11 w-11 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center mb-4"><Trophy size={21}/></div><div className="font-black text-sm">{x}</div><div className="text-[10px] text-slate-500 mt-1">جدول • بازی‌ها • اخبار</div></button>)}</div></section>}
      {tab === "search" && <section><PageTitle icon={Search} title="جستجو" sub="تیم، بازیکن و لیگ"/><div className="relative mb-4"><Search className="absolute right-4 top-3.5 text-slate-500" size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} className="glass w-full rounded-2xl py-3.5 pr-11 pl-4 outline-none focus:ring-2 focus:ring-emerald-400/20" placeholder="مثلاً رئال مادرید"/></div><div className="space-y-2">{filtered.map(m=><button onClick={()=>setSelected(m)} key={m.id} className="glass w-full rounded-2xl p-4 flex items-center justify-between active:scale-[.99]"><div className="flex items-center gap-3"><Users size={18} className="text-emerald-400"/><span className="font-bold text-sm">{m.home} — {m.away}</span></div><ChevronLeft size={16}/></button>)}</div></section>}
      <section className="glass card p-4 flex items-center gap-3"><Shield size={19} className="text-emerald-400 shrink-0"/><div><div className="text-xs font-black">FOT10 • داده معتبر در مرحله بعد</div><div className="text-[10px] text-slate-500 mt-1 leading-5">اعداد و رویدادهای فعلی نمایشی‌اند و تا اتصال API به‌عنوان نتیجه واقعی ارائه نمی‌شوند.</div></div></section>
    </div>
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-[#080b14]/90 backdrop-blur-xl safe-bottom"><div className="mx-auto max-w-[760px] grid grid-cols-5 px-2 pt-2 pb-1">{nav.map(([label,Icon,id])=><button key={id} onClick={()=>setTab(id)} className={`touch-target rounded-2xl flex flex-col items-center justify-center gap-1 transition ${tab===id?'text-emerald-400 bg-emerald-400/5':'text-slate-500'}`}><Icon size={20}/><span className="font-bold text-[10px]">{label}</span></button>)}</div></nav>
    {selected && <MatchCenter match={selected} close={()=>setSelected(null)}/>} 
  </main>;
}
