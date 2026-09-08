"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Trophy, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import FavoriteButton from "../../../components/FavoriteButton";

export default function TeamDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/football/team-stats?team=${encodeURIComponent(params.id)}`, { cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.error || "اطلاعات تیم دریافت نشد"); return payload; })
      .then(setData)
      .catch((err) => setError(err?.message || "خطا در دریافت اطلاعات تیم"));
  }, [params.id]);

  if (error) return <main className="fot-shell p-5"><Link href="/teams" className="text-sm text-cyan-300">بازگشت به تیم‌ها</Link><div className="glass mt-5 rounded-3xl p-5 text-sm text-red-300">{error}</div></main>;
  if (!data) return <main className="fot-shell p-5"><div className="glass rounded-3xl p-8 text-center text-sm text-slate-400">در حال دریافت پرونده تیم…</div></main>;

  const team = data.team || {};
  const stat = data.statistics || {};
  const fixtures = data.fixtures || [];
  const squad = data.squad || [];
  const form = stat.form || "—";
  const played = stat.fixtures?.played?.total ?? 0;
  const wins = stat.fixtures?.wins?.total ?? 0;
  const draws = stat.fixtures?.draws?.total ?? 0;
  const loses = stat.fixtures?.loses?.total ?? 0;
  const goalsFor = stat.goals?.for?.total?.total ?? 0;
  const goalsAgainst = stat.goals?.against?.total?.total ?? 0;

  return <main className="fot-shell pb-10"><div className="fot-container space-y-5">
    <header className="flex items-center gap-3"><Link href="/teams" aria-label="بازگشت" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19}/></Link><div><h1 className="text-xl font-black">پرونده تیم</h1><p className="text-[11px] text-slate-500">آمار واقعی · فصل {data.season || "—"}</p></div></header>
    <section className="glass card rounded-3xl p-5"><div className="flex items-center gap-4"><div className="h-20 w-20 rounded-3xl bg-white/5 grid place-items-center overflow-hidden">{team.logo && <img src={team.logo} alt="" className="h-16 w-16 object-contain"/>}</div><div className="min-w-0 flex-1"><h2 className="text-2xl font-black truncate">{team.name || "تیم"}</h2><p className="text-xs text-slate-500 mt-1">{team.country || "—"} {team.national ? "· تیم ملی" : ""}</p><p className="text-[10px] text-cyan-300 mt-2">{data.league?.name || "رقابت نامشخص"}</p></div><FavoriteButton type="team" name={team.name || ""} className="shrink-0"/></div></section>
    <section className="grid grid-cols-2 gap-3"><div className="glass rounded-2xl p-4"><Trophy size={18} className="mb-2 text-yellow-400"/><b className="text-2xl">{played}</b><p className="text-[10px] text-slate-500">بازی</p></div><div className="glass rounded-2xl p-4"><Shield size={18} className="mb-2 text-emerald-400"/><b className="text-2xl">{form}</b><p className="text-[10px] text-slate-500">فرم اخیر</p></div><div className="glass rounded-2xl p-4"><b className="text-2xl">{wins}</b><p className="text-[10px] text-slate-500">برد · {draws} مساوی</p></div><div className="glass rounded-2xl p-4"><b className="text-2xl">{goalsFor}-{goalsAgainst}</b><p className="text-[10px] text-slate-500">گل زده / خورده</p></div></section>
    <section className="glass rounded-3xl p-4"><h2 className="mb-4 flex items-center gap-2 font-black"><CalendarDays size={18}/> برنامه و نتایج</h2>{fixtures.length ? <div className="space-y-2">{fixtures.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="rounded-2xl bg-white/5 p-3 flex items-center gap-3"><img src={match.homeLogo} alt="" className="h-8 w-8 object-contain"/><div className="flex-1 text-xs"><b>{match.home}</b><span className="mx-2 text-slate-600">vs</span><b>{match.away}</b></div><span className="text-xs text-slate-400">{match.homeScore ?? "—"} - {match.awayScore ?? "—"}</span></Link>)}</div> : <p className="text-sm text-slate-500">بازی‌ای در دسترس نیست.</p>}</section>
    <section className="glass rounded-3xl p-4"><h2 className="mb-4 flex items-center gap-2 font-black"><Users size={18}/> فهرست بازیکنان</h2>{squad.length ? <div className="grid grid-cols-2 gap-2">{squad.slice(0, 24).map((player) => <Link key={player.id} href={`/players/${player.id}`} className="rounded-2xl bg-white/5 p-3 flex items-center gap-2"><img src={player.photo} alt="" className="h-9 w-9 rounded-xl object-cover"/><div className="min-w-0"><b className="block truncate text-xs">{player.name}</b><span className="text-[10px] text-slate-500">{player.position || "—"} · #{player.number || "—"}</span></div></Link>)}</div> : <p className="text-sm text-slate-500">فهرست بازیکنان در دسترس نیست.</p>}</section>
    <p className="text-[10px] leading-5 text-slate-600">FOT10: شماره ۱۰ هویت برند است؛ این پرونده شامل کل تیم و همه بازیکنان است.</p>
  </div></main>;
}
