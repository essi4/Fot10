"use client";

import { useState } from "react";
import { Search, Star, TrendingUp } from "lucide-react";

function normalizePlayer(item) {
  const stats = item?.statistics?.[0] || {};
  const games = stats.games || {};
  const goals = stats.goals || {};
  return {
    id: item?.player?.id,
    name: item?.player?.name || "بازیکن",
    photo: item?.player?.photo,
    age: item?.player?.age,
    nationality: item?.player?.nationality,
    team: stats.team?.name || "تیم نامشخص",
    logo: stats.team?.logo,
    pos: games.position || "—",
    rating: games.rating || "—",
    appearances: games.appearances ?? 0,
    minutes: games.minutes ?? 0,
    goals: goals.total ?? 0,
    assists: goals.assists ?? 0,
    shots: goals.shots ?? 0,
    penalties: goals.penalty ?? 0,
  };
}

export default function PlayersPage() {
  const [q, setQ] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function searchPlayers(event) {
    event.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const response = await fetch(`/api/football/players?search=${encodeURIComponent(query)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "خطا در دریافت اطلاعات بازیکن");
      setPlayers(payload.players.map(normalizePlayer));
    } catch (err) {
      setPlayers([]);
      setError(err?.message || "خطا در دریافت اطلاعات بازیکن");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mobile-shell pb-10">
      <header className="px-5 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-sky-400">FOT10 • PLAYERS</p>
            <h1 className="mt-1 text-2xl font-black">بازیکنان</h1>
            <p className="mt-1 text-xs text-slate-500">آمار واقعی؛ بدون محدود شدن به شماره ۱۰</p>
          </div>
          <TrendingUp className="text-emerald-400" />
        </div>

        <form onSubmit={searchPlayers} className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="نام بازیکن؛ مثلاً Mbappe" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
          <button type="submit" disabled={loading || q.trim().length < 2} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">جستجو</button>
        </form>
      </header>

      <section className="space-y-3 px-5">
        {loading && <div className="rounded-3xl bg-white/5 p-6 text-center text-sm text-slate-400">در حال دریافت آمار زنده…</div>}
        {error && <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}
        {!loading && !error && searched && !players.length && <div className="py-12 text-center text-sm text-slate-500">بازیکنی پیدا نشد.</div>}
        {!searched && <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-500">نام بازیکن را جستجو کن تا اطلاعات واقعی نمایش داده شود.</div>}

        {players.map((player) => (
          <article key={`${player.id}-${player.team}`} className="glass rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/5">
                {player.photo ? <img src={player.photo} alt={player.name} className="h-full w-full object-cover" /> : <span className="text-lg font-black">⚽</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-black">{player.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{player.team} • {player.pos}</p>
              </div>
              <div className="text-left">
                <b className="text-xl text-emerald-400">{player.rating}</b>
                <p className="text-[10px] text-slate-600">ریتینگ</p>
              </div>
              <Star size={17} className="text-slate-500" />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">بازی</p><b className="text-lg">{player.appearances}</b></div>
              <div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">دقیقه</p><b className="text-lg">{player.minutes}</b></div>
              <div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">گل</p><b className="text-lg">{player.goals}</b></div>
              <div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">پاس گل</p><b className="text-lg">{player.assists}</b></div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
