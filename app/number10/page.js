"use client";

import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

const fa = (value) => String(value ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

export default function Number10Page() {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findTeam(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setTeam(null);
    setPlayers([]);
    try {
      const response = await fetch(`/api/football/number10?search=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || "خطا در دریافت شماره ۱۰");
      setTeam(json.team);
      setPlayers(json.players || []);
    } catch (e) {
      setError(e.message || "ارتباط با سرویس فوتبال برقرار نشد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-5">
        <header className="flex items-center gap-3 pt-3">
          <Link href="/" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19} /></Link>
          <div><p className="text-[10px] font-black text-emerald-300">FOT10</p><h1 className="text-xl font-black">جهان شماره ۱۰</h1></div>
        </header>

        <section className="glass card overflow-hidden p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-yellow-400/10 text-2xl font-black text-yellow-300">۱۰</div>
            <div><h2 className="text-lg font-black">فقط شماره ۱۰</h2><p className="mt-1 text-[11px] leading-6 text-slate-400">در FOT10 بازیکن فقط وقتی وارد این بخش می‌شود که شماره پیراهن ثبت‌شده‌اش دقیقاً ۱۰ باشد؛ پست تاکتیکی به‌تنهایی کافی نیست.</p></div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-300"><ShieldCheck size={14} /> فیلتر سخت‌گیرانهٔ پیراهن #10</div>
        </section>

        <form onSubmit={findTeam} className="glass rounded-2xl p-2 flex gap-2">
          <div className="relative flex-1"><Search className="absolute right-3 top-3 text-slate-500" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl bg-white/[.03] py-3 pr-10 pl-3 outline-none" placeholder="نام تیم؛ مثلاً Real Madrid یا Iran" /></div>
          <button disabled={loading || !query.trim()} className="touch-target rounded-xl bg-emerald-400 px-4 text-xs font-black text-slate-950 disabled:opacity-50">{loading ? "..." : "بررسی"}</button>
        </form>

        {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-xs text-red-200">{error}</div>}

        {team && <section className="space-y-3">
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/[.04] grid place-items-center overflow-hidden">{team.logo ? <img src={team.logo} alt="" className="h-9 w-9 object-contain" /> : "⚽"}</div>
            <div className="flex-1"><p className="text-[10px] text-slate-500">تیم انتخاب‌شده</p><h2 className="text-base font-black">{team.name}</h2><p className="text-[10px] text-slate-500">{team.country || ""}</p></div>
            <div className="text-center"><div className="text-2xl font-black text-yellow-300">{fa(players.length)}</div><div className="text-[9px] text-slate-500">شماره ۱۰</div></div>
          </div>

          {players.length ? players.map((player) => <div key={player.id || player.name} className="glass card p-4 flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/[.04]">{player.photo ? <img src={player.photo} alt={player.name} className="h-full w-full object-cover" /> : <div className="h-full grid place-items-center text-xl font-black text-yellow-300">۱۰</div>}</div>
            <div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-black">{player.name}</h3><span className="rounded-full bg-yellow-400/10 px-2 py-1 text-[9px] font-black text-yellow-300">#۱۰</span></div><p className="mt-1 text-[10px] text-slate-500">{player.position || "بازیکن شماره ۱۰"}{player.age ? ` · ${fa(player.age)} سال` : ""}</p></div>
            <Sparkles size={16} className="text-yellow-300" />
          </div>) : <div className="glass rounded-2xl p-7 text-center"><div className="text-sm font-black">شماره ۱۰ ثبت‌شده پیدا نشد</div><p className="mt-2 text-[10px] leading-5 text-slate-500">برای این تیم، منبع داده فعلاً بازیکنی با پیراهن شماره ۱۰ برنگرداند.</p></div>}
        </section>}

        {!team && !error && <div className="glass rounded-2xl p-7 text-center"><div className="text-5xl font-black text-yellow-300">۱۰</div><p className="mt-3 text-sm font-black">اول یک تیم را جستجو کن</p><p className="mt-2 text-[10px] text-slate-500">بعد FOT10 فقط شماره ۱۰ همان تیم را نمایش می‌دهد.</p></div>}
      </div>
    </main>
  );
}
