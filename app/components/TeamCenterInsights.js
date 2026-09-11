"use client";

import Link from "next/link";
import { ArrowLeft, CalendarClock, ChevronLeft, Flame, ShieldCheck, Sparkles } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function isFuture(match) {
  return match?.date ? new Date(match.date).getTime() > Date.now() : false;
}

function scoreText(match) {
  const home = match?.homeScore;
  const away = match?.awayScore;
  return home == null || away == null ? "—" : `${home} - ${away}`;
}

export default function TeamCenterInsights({ team, league, fixtures = [], form = "—", played = 0, wins = 0, draws = 0, loses = 0 }) {
  const ordered = [...fixtures].sort((a, b) => new Date(a?.date || 0) - new Date(b?.date || 0));
  const upcoming = ordered.filter(isFuture).slice(0, 3);
  const recent = ordered.filter((match) => !isFuture(match)).slice(-3).reverse();
  const winRate = played ? Math.round((wins / played) * 100) : 0;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_.65fr] gap-3">
        <div className="glass rounded-[24px] p-4 sm:p-5 border border-cyan-300/10 overflow-hidden relative">
          <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[9px] text-cyan-300 font-black tracking-wider">TEAM MOMENTUM</p>
              <h2 className="font-black mt-1">نبض تیم</h2>
            </div>
            <span className="rounded-full bg-white/[.05] px-2.5 py-1 text-[9px] text-slate-400">{league?.name || "رقابت"}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[["برد", wins], ["مساوی", draws], ["باخت", loses], ["نرخ برد", `${winRate}٪`]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/[.035] border border-white/5 p-3 text-center">
                <b className="block text-lg sm:text-xl">{value}</b>
                <span className="text-[8px] sm:text-[9px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="shrink-0 text-[9px] text-slate-500">فرم</span>
            {String(form).split("").filter((x) => /[WDL]/.test(x)).map((result, index) => (
              <span key={`${result}-${index}`} className={`h-8 w-8 shrink-0 rounded-lg grid place-items-center text-[10px] font-black ${result === "W" ? "bg-emerald-400 text-slate-950" : result === "D" ? "bg-amber-300 text-slate-950" : "bg-rose-400 text-white"}`}>
                {result}
              </span>
            ))}
            {String(form) === "—" && <span className="text-[9px] text-slate-500">فرم هنوز در دسترس نیست</span>}
          </div>
        </div>

        <div className="glass rounded-[24px] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-cyan-300" /><div><p className="text-[9px] text-cyan-300 font-black">TEAM SNAPSHOT</p><h2 className="font-black">وضعیت سریع</h2></div></div>
          <div className="space-y-2.5 text-[10px]">
            <div className="rounded-2xl bg-white/[.035] p-3 flex items-center gap-3"><Flame size={15} className="text-cyan-300" /><span className="text-slate-400">بازی‌های بررسی‌شده</span><b className="mr-auto">{played}</b></div>
            <div className="rounded-2xl bg-white/[.035] p-3 flex items-center gap-3"><ShieldCheck size={15} className="text-cyan-300" /><span className="text-slate-400">رکورد فصل</span><b className="mr-auto">{wins} برد · {draws} مساوی · {loses} باخت</b></div>
            <div className="rounded-2xl bg-white/[.035] p-3 flex items-center gap-3"><CalendarClock size={15} className="text-cyan-300" /><span className="text-slate-400">برنامه آینده</span><b className="mr-auto">{upcoming.length ? `${upcoming.length} بازی` : "—"}</b></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-[24px] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3"><div><p className="text-[9px] text-cyan-300 font-black">NEXT</p><h2 className="font-black">بازی‌های پیش‌رو</h2></div><CalendarClock size={16} className="text-slate-500" /></div>
          {upcoming.length ? <div className="space-y-2">{upcoming.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="flex items-center gap-3 rounded-2xl bg-white/[.035] border border-white/5 p-3 hover:bg-white/[.06] transition"><div className="h-9 w-9 rounded-xl bg-white/[.05] grid place-items-center overflow-hidden">{match.homeLogo && <img src={match.homeLogo} alt="" className="h-7 w-7 object-contain" />}</div><div className="min-w-0 flex-1"><b className="block text-[10px] truncate">{match.home} <span className="text-slate-600">vs</span> {match.away}</b><span className="text-[9px] text-slate-500">{formatDate(match.date)}</span></div><ChevronLeft size={14} className="text-slate-600" /></Link>)}</div> : <p className="text-[10px] text-slate-500">بازی آینده‌ای در داده فعلی پیدا نشد.</p>}
        </div>

        <div className="glass rounded-[24px] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3"><div><p className="text-[9px] text-cyan-300 font-black">RECENT</p><h2 className="font-black">آخرین نتایج</h2></div><ArrowLeft size={16} className="text-slate-500" /></div>
          {recent.length ? <div className="space-y-2">{recent.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="flex items-center gap-3 rounded-2xl bg-white/[.035] border border-white/5 p-3 hover:bg-white/[.06] transition"><div className="min-w-0 flex-1"><b className="block text-[10px] truncate">{match.home} <span className="text-slate-600">vs</span> {match.away}</b><span className="text-[9px] text-slate-500">{formatDate(match.date)}</span></div><b className="rounded-lg bg-white/[.06] px-2.5 py-1 text-[10px]">{scoreText(match)}</b></Link>)}</div> : <p className="text-[10px] text-slate-500">نتیجه‌ای در داده فعلی پیدا نشد.</p>}
        </div>
      </div>

      <p className="text-center text-[9px] text-slate-600">{team?.name || "تیم"} · نمای فشرده Team Center در FOT10</p>
    </section>
  );
}
