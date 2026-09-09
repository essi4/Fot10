"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star, TrendingUp, Goal, Crosshair, Shield, Zap, BarChart3 } from "lucide-react";

function n(value) { const x = Number(value); return Number.isFinite(x) ? x : 0; }
function normalizePlayer(item) {
  const stats = item?.statistics?.[0] || {};
  const games = stats.games || {};
  const goals = stats.goals || {};
  const shots = stats.shots || {};
  const passes = stats.passes || {};
  const tackles = stats.tackles || {};
  const dribbles = stats.dribbles || {};
  const duels = stats.duels || {};
  const cards = stats.cards || {};
  const appearances = n(games.appearances), minutes = n(games.minutes), goalTotal = n(goals.total), assistTotal = n(goals.assists);
  return {
    id: item?.player?.id, name: item?.player?.name || "بازیکن", photo: item?.player?.photo, age: item?.player?.age,
    nationality: item?.player?.nationality, team: stats.team?.name || "تیم نامشخص", logo: stats.team?.logo,
    pos: games.position || "—", rating: games.rating || "—", appearances, minutes, goals: goalTotal, assists: assistTotal,
    shots: n(shots.total), shotsOn: n(shots.on), keyPasses: n(passes.key), passTotal: n(passes.total), passAccuracy: n(passes.accuracy),
    tackles: n(tackles.total), tacklesWon: n(tackles.won), dribbles: n(dribbles.attempts), dribblesWon: n(dribbles.success),
    duels: n(duels.total), duelsWon: n(duels.won), yellow: n(cards.yellow), red: n(cards.red),
    goals90: minutes ? (goalTotal * 90 / minutes) : 0, assists90: minutes ? (assistTotal * 90 / minutes) : 0,
  };
}
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

export default function PlayersPage() {
  const [q, setQ] = useState(""); const [players, setPlayers] = useState([]); const [loading, setLoading] = useState(false); const [searched, setSearched] = useState(false); const [error, setError] = useState(""); const [sort, setSort] = useState("rating");
  async function searchPlayers(event) {
    event.preventDefault(); const query = q.trim(); if (query.length < 2) return; setLoading(true); setSearched(true); setError("");
    try { const response = await fetch(`/api/football/players?search=${encodeURIComponent(query)}`, { cache: "no-store" }); const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.error || "خطا در دریافت اطلاعات بازیکن"); setPlayers((payload.players || []).map(normalizePlayer)); }
    catch (err) { setPlayers([]); setError(err?.message || "خطا در دریافت اطلاعات بازیکن"); } finally { setLoading(false); }
  }
  const sorted = useMemo(() => [...players].sort((a,b) => sort === "goals" ? b.goals-a.goals : sort === "assists" ? b.assists-a.assists : sort === "shots" ? b.shots-a.shots : sort === "keyPasses" ? b.keyPasses-a.keyPasses : sort === "tackles" ? b.tackles-a.tackles : n(b.rating)-n(a.rating)), [players, sort]);
  return <main className="mobile-shell pb-10">
    <header className="px-5 pb-5 pt-6"><div className="flex items-center justify-between"><div><p className="text-xs text-sky-400">FOT10 • PLAYER ANALYTICS</p><h1 className="mt-1 text-2xl font-black">آمار پیشرفته بازیکنان</h1><p className="mt-1 text-xs text-slate-500">گل، پاس گل، شوت، پاس کلیدی، تکل، دریبل و دوئل</p></div><TrendingUp className="text-emerald-400" /></div>
      <form onSubmit={searchPlayers} className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Search size={18} className="text-slate-500" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="نام بازیکن؛ مثلاً Mbappe" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" /><button type="submit" disabled={loading || q.trim().length < 2} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">جستجو</button></form>
      {players.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{[["rating","ریتینگ"],["goals","گل"],["assists","پاس گل"],["shots","شوت"],["keyPasses","پاس کلیدی"],["tackles","تکل"]].map(([value,label]) => <button key={value} onClick={() => setSort(value)} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${sort===value?"bg-sky-500 text-white":"bg-white/5 text-slate-400"}`}>{label}</button>)}</div>}
    </header>
    <section className="space-y-3 px-5">{loading && <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-slate-400">در حال دریافت آمار زنده…</div>}{error && <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}{!loading && !error && searched && !players.length && <div className="py-12 text-center text-sm text-slate-500">بازیکنی پیدا نشد.</div>}{!searched && <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-500">نام بازیکن را جستجو کن تا داشبورد آماری کامل نمایش داده شود.</div>}
      {sorted.map((player) => <Link href={`/players/${player.id}`} key={`${player.id}-${player.team}`} className="glass block rounded-3xl p-4 transition hover:border-sky-400/30"><div className="flex items-center gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/5">{player.photo ? <img src={player.photo} alt={player.name} className="h-full w-full object-cover" /> : <span className="text-lg font-black">⚽</span>}</div><div className="min-w-0 flex-1"><h2 className="truncate font-black">{player.name}</h2><p className="mt-1 text-xs text-slate-500">{player.team} • {player.pos} {player.age ? `• ${player.age} سال` : ""}</p></div><div className="text-left"><b className="text-xl text-emerald-400">{player.rating}</b><p className="text-[10px] text-slate-600">ریتینگ</p></div><Star size={17} className="text-slate-500" /></div>
        <div className="mt-4 grid grid-cols-4 gap-2"><div className="rounded-2xl bg-white/5 p-3"><Goal size={14} className="mb-1 text-emerald-400"/><p className="text-[10px] text-slate-500">گل</p><b className="text-lg">{player.goals}</b></div><div className="rounded-2xl bg-white/5 p-3"><Zap size={14} className="mb-1 text-sky-400"/><p className="text-[10px] text-slate-500">پاس گل</p><b className="text-lg">{player.assists}</b></div><div className="rounded-2xl bg-white/5 p-3"><Crosshair size={14} className="mb-1 text-violet-400"/><p className="text-[10px] text-slate-500">شوت</p><b className="text-lg">{player.shots}</b></div><div className="rounded-2xl bg-white/5 p-3"><BarChart3 size={14} className="mb-1 text-amber-400"/><p className="text-[10px] text-slate-500">دقیقه</p><b className="text-lg">{player.minutes}</b></div></div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-slate-400"><span>پاس کلیدی <b className="text-slate-200">{player.keyPasses}</b></span><span>تکل <b className="text-slate-200">{player.tackles}</b></span><span>دریبل موفق <b className="text-slate-200">{player.dribblesWon}</b></span><span>دوئل موفق <b className="text-slate-200">{pct(player.duelsWon,player.duels)}٪</b></span></div>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-500"><span>گل/۹۰: <b className="text-emerald-300">{player.goals90.toFixed(2)}</b></span><span>پاس/۹۰: <b className="text-sky-300">{player.assists90.toFixed(2)}</b></span><span>دقت پاس: <b className="text-slate-300">{player.passAccuracy || 0}٪</b></span><span>کارت: <b className="text-amber-300">{player.yellow}/{player.red}</b></span></div>
      </Link>)}
    </section>
  </main>;
}
