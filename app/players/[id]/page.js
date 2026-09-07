"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Goal, Shield, Star, Trophy } from "lucide-react";

function normalizeStats(item) {
  const player = item?.player || {};
  const stats = Array.isArray(item?.statistics) ? item.statistics : [];
  return { player, stats };
}

export default function PlayerDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/football/players?id=${encodeURIComponent(params.id)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.ok || !payload.players?.[0]) throw new Error(payload.error || "اطلاعات بازیکن پیدا نشد");
        const normalized = normalizeStats(payload.players[0]);
        if (active) setData(normalized);
      } catch (err) {
        if (active) setError(err?.message || "خطا در دریافت اطلاعات بازیکن");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [params.id]);

  if (loading) return <main className="mobile-shell p-6"><div className="rounded-3xl bg-white/5 p-8 text-center text-sm text-slate-400">در حال دریافت پرونده کامل بازیکن…</div></main>;
  if (error || !data) return <main className="mobile-shell p-6"><Link href="/players" className="mb-5 inline-flex items-center gap-2 text-sm text-sky-400"><ArrowRight size={17}/> بازیکنان</Link><div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">{error || "بازیکن پیدا نشد."}</div></main>;

  const { player, stats } = data;
  const first = stats[0] || {};
  const games = first.games || {};
  const goals = first.goals || {};
  const shots = first.shots || {};
  const passes = first.passes || {};
  const dribbles = first.dribbles || {};
  const duels = first.duels || {};
  const tackles = first.tackles || {};
  const cards = first.cards || {};

  return (
    <main className="mobile-shell pb-10">
      <header className="px-5 pb-5 pt-6">
        <Link href="/players" className="mb-5 inline-flex items-center gap-2 text-xs text-sky-400"><ArrowRight size={16}/> همه بازیکنان</Link>
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white/5">{player.photo && <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1"><p className="text-xs text-sky-400">FOT10 • PLAYER PROFILE</p><h1 className="mt-1 text-2xl font-black">{player.name}</h1><p className="mt-1 text-xs text-slate-500">{player.nationality || "—"} • {player.age ? `${player.age} سال` : "سن نامشخص"}</p></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">پست</p><b>{games.position || "—"}</b></div><div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">ریتینگ</p><b className="text-emerald-400">{games.rating || "—"}</b></div></div>
        </div>
      </header>

      <section className="space-y-4 px-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-3xl p-4"><Goal className="mb-2 text-emerald-400" size={19}/><p className="text-xs text-slate-500">گل</p><b className="text-2xl">{goals.total ?? 0}</b></div>
          <div className="glass rounded-3xl p-4"><Trophy className="mb-2 text-sky-400" size={19}/><p className="text-xs text-slate-500">پاس گل</p><b className="text-2xl">{goals.assists ?? 0}</b></div>
          <div className="glass rounded-3xl p-4"><BarChart3 className="mb-2 text-violet-400" size={19}/><p className="text-xs text-slate-500">بازی / دقیقه</p><b className="text-xl">{games.appearances ?? 0} / {games.minutes ?? 0}</b></div>
          <div className="glass rounded-3xl p-4"><Star className="mb-2 text-amber-400" size={19}/><p className="text-xs text-slate-500">شروع</p><b className="text-2xl">{games.lineups ?? 0}</b></div>
        </div>

        <div className="glass rounded-3xl p-4"><h2 className="mb-4 font-black">آمار عملکرد</h2><div className="grid grid-cols-2 gap-3 text-sm"><span>شوت: <b>{shots.total ?? 0}</b></span><span>شوت در چارچوب: <b>{shots.on ?? 0}</b></span><span>پاس کلیدی: <b>{passes.key ?? 0}</b></span><span>دقت پاس: <b>{passes.accuracy ?? "—"}</b></span><span>دریبل موفق: <b>{dribbles.success ?? 0}</b></span><span>دوئل برده: <b>{duels.won ?? 0}</b></span><span>تکل: <b>{tackles.total ?? 0}</b></span><span>کارت زرد: <b>{cards.yellow ?? 0}</b></span></div></div>

        <div className="glass rounded-3xl p-4"><h2 className="mb-4 font-black">آمار رقابت‌ها</h2>{stats.length ? <div className="space-y-2">{stats.map((entry, index) => <div key={`${entry.league?.id || index}-${entry.team?.id || index}`} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"><div className="h-9 w-9 overflow-hidden rounded-xl bg-white/5">{entry.league?.logo && <img src={entry.league.logo} alt="" className="h-full w-full object-contain"/>}</div><div className="min-w-0 flex-1"><b className="block truncate">{entry.league?.name || "رقابت نامشخص"}</b><p className="text-[11px] text-slate-500">{entry.team?.name || "تیم نامشخص"}</p></div><span className="text-xs text-slate-400">{entry.games?.appearances ?? 0} بازی</span></div>)}</div> : <p className="text-sm text-slate-500">آمار رقابتی موجود نیست.</p>}</div>

        <div className="rounded-3xl border border-sky-400/10 bg-sky-400/5 p-4 text-xs leading-6 text-slate-400">این صفحه آمار بازیکن را مستقل از شماره پیراهن نمایش می‌دهد؛ شماره ۱۰ فقط هویت و امضای FOT10 است.</div>
      </section>
    </main>
  );
}
