"use client";

import { Bell, ChevronLeft, Flame, Home, Search, Star, Trophy, Tv, Zap } from "lucide-react";

const matches = [
  { league: "لیگ قهرمانان اروپا", home: "بارسلونا", away: "پاری‌سن‌ژرمن", time: "21:30", status: "امشب", hot: true },
  { league: "لالیگا", home: "رئال مادرید", away: "اتلتیکو مادرید", time: "23:00", status: "امشب", hot: true },
  { league: "پریمیر لیگ", home: "آرسنال", away: "لیورپول", time: "فردا 18:30", status: "فردا", hot: false },
];

const leagues = ["همه", "ایران", "اروپا", "انگلیس", "اسپانیا", "آلمان"];

function Team({ name, tone }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`h-9 w-9 shrink-0 rounded-xl grid place-items-center text-sm font-black ${tone}`}>{name.slice(0, 1)}</div>
      <span className="truncate font-bold text-sm">{name}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center justify-between pt-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center shadow-lg shadow-emerald-500/20"><Zap size={21} fill="currentColor" /></div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">FOT<span className="text-emerald-400">10</span></h1>
                <p className="text-[11px] text-slate-400">نبض فوتبال، لحظه‌به‌لحظه</p>
              </div>
            </div>
          </div>
          <button aria-label="اعلان‌ها" className="glass h-11 w-11 rounded-2xl grid place-items-center"><Bell size={20} /></button>
        </header>

        <section className="glass card p-4 overflow-hidden relative">
          <div className="absolute -left-12 -top-16 h-36 w-36 rounded-full bg-cyan-400/10 blur-2xl" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-xs text-slate-400 mb-1">امروز در فوتبال</p>
              <h2 className="text-xl font-black">بازی‌های مهم را از دست نده</h2>
            </div>
            <Flame className="text-orange-400" size={28} />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 relative">
            {[['LIVE','بازی زنده'],['24','مسابقه امروز'],['12','لیگ محبوب']].map(([n,t]) => <div key={t} className="rounded-2xl bg-white/[.04] p-3"><div className="font-black text-lg">{n}</div><div className="text-[10px] text-slate-400 mt-1">{t}</div></div>)}
          </div>
        </section>

        <div className="relative">
          <Search className="absolute right-4 top-3.5 text-slate-500" size={18} />
          <input className="glass w-full rounded-2xl py-3 pr-11 pl-4 outline-none placeholder:text-slate-500 focus:border-emerald-400/40" placeholder="جستجوی تیم، بازیکن یا لیگ..." />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {leagues.map((x, i) => <button key={x} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold border ${i === 0 ? 'bg-emerald-400 text-slate-950 border-emerald-400' : 'glass border-white/10 text-slate-300'}`}>{x}</button>)}
        </div>

        <section>
          <div className="flex items-center justify-between mb-3"><h2 className="font-black text-lg">بازی‌های مهم</h2><button className="text-xs text-emerald-400 flex items-center gap-1">همه <ChevronLeft size={14}/></button></div>
          <div className="space-y-3">
            {matches.map((m) => <article key={m.home} className="glass card p-4">
              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-[11px] text-slate-400"><Trophy size={13} /> {m.league}</div>{m.hot && <span className="rounded-full bg-orange-400/10 text-orange-300 px-2 py-1 text-[10px] font-bold">داغ</span>}</div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Team name={m.home} tone="bg-blue-500/20 text-blue-300" />
                <div className="text-center"><div className="text-sm font-black">{m.time}</div><div className="text-[10px] text-slate-500 mt-1">{m.status}</div></div>
                <div className="justify-self-end"><Team name={m.away} tone="bg-red-500/20 text-red-300" /></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500"><span>آمار و جزئیات مسابقه</span><Star size={15} /></div>
            </article>)}
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-[#080b14]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[760px] grid grid-cols-4 px-5 py-3 text-[10px] text-slate-500">
          {[['خانه', Home, true], ['بازی‌ها', Tv, false], ['لیگ‌ها', Trophy, false], ['جستجو', Search, false]].map(([label, Icon, active]) => <button key={label} className={`flex flex-col items-center gap-1 ${active ? 'text-emerald-400' : ''}`}><Icon size={20}/><span className="font-bold">{label}</span></button>)}
        </div>
      </nav>
    </main>
  );
}
