"use client";

import Link from "next/link";
import { Activity, ArrowLeft, CalendarDays, Clock3, Radio, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function dateValue(match) {
  const value = match?.date || match?.fixture?.date;
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : 0;
}

function isLive(match) {
  const status = String(match?.status || match?.fixture?.status?.short || "").toUpperCase();
  return ["1H", "HT", "2H", "ET", "P", "LIVE", "INT"].includes(status) || match?.live === true;
}

function isFinished(match) {
  const status = String(match?.status || match?.fixture?.status?.short || "").toUpperCase();
  return ["FT", "AET", "PEN", "FINISHED"].includes(status) || match?.finished === true;
}

function formatKickoff(value) {
  if (!value) return "زمان نامشخص";
  return new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "شروع مسابقه نزدیک است";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days} روز · ${hours} ساعت`;
  if (hours > 0) return `${hours} ساعت · ${minutes} دقیقه`;
  return `${Math.max(1, minutes)} دقیقه`;
}

function resultFor(match, teamId, teamName) {
  const home = String(match?.homeTeamId ?? match?.homeId ?? match?.home?.id ?? "") === String(teamId) || String(match?.home || "").trim().toLowerCase() === String(teamName || "").trim().toLowerCase();
  const hs = Number(match?.homeScore);
  const as = Number(match?.awayScore);
  if (!Number.isFinite(hs) || !Number.isFinite(as)) return "";
  const won = home ? hs > as : as > hs;
  return won ? "W" : hs === as ? "D" : "L";
}

export default function TeamMatchTimeline({ teamId, teamName, fixtures = [] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const ordered = useMemo(() => [...fixtures].sort((a, b) => dateValue(a) - dateValue(b)), [fixtures]);
  const nextMatch = useMemo(() => ordered.find((match) => !isFinished(match) && dateValue(match) >= now - 2 * 60 * 60 * 1000) || null, [ordered, now]);
  const recent = useMemo(() => ordered.filter((match) => isFinished(match) && dateValue(match) <= now).slice(-5).reverse(), [ordered, now]);
  const liveMatch = ordered.find(isLive) || null;
  const focus = liveMatch || nextMatch;

  if (!fixtures.length) return null;

  return (
    <section className="glass rounded-[26px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black tracking-[.14em] text-cyan-300">TEAM MATCH TIMELINE</p>
          <h2 className="mt-1 flex items-center gap-2 font-black"><Activity size={17} className="text-cyan-300" /> نبض مسابقات تیم</h2>
          <p className="mt-1 text-[9px] text-slate-500">بازی بعدی، نتیجه اخیر و فرم واقعی تیم</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[8px] font-black text-cyan-300">{recent.length} نتیجه</span>
      </div>

      {focus && <Link href={`/matches/${focus.id}`} className="group mt-4 block overflow-hidden rounded-[22px] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[.12] to-white/[.025] p-4 transition hover:bg-cyan-400/[.15]">
        <div className="flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] font-black ${isLive(focus) ? "bg-rose-400/15 text-rose-300" : "bg-white/[.06] text-slate-400"}`}>
            {isLive(focus) ? <><Radio size={11}/> LIVE</> : <><CalendarDays size={11}/> بازی بعدی</>}
          </span>
          <span className="text-[9px] text-slate-500">{focus.date ? formatKickoff(focus.date) : "—"}</span>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
          <div className="min-w-0"><div className="mx-auto mb-2 h-11 w-11 rounded-2xl bg-white/[.06] grid place-items-center overflow-hidden">{focus.homeLogo ? <img src={focus.homeLogo} alt="" className="h-9 w-9 object-contain"/> : <Trophy size={18} className="text-cyan-300"/>}</div><b className="block truncate text-[10px]">{focus.home || "خانه"}</b></div>
          <div className="px-1"><b className="text-lg">{isLive(focus) || isFinished(focus) ? `${focus.homeScore ?? "—"} - ${focus.awayScore ?? "—"}` : "VS"}</b><span className="mt-1 flex items-center justify-center gap-1 text-[8px] text-slate-600"><Clock3 size={10}/> {isLive(focus) ? "در حال برگزاری" : formatCountdown(dateValue(focus) - now)}</span></div>
          <div className="min-w-0"><div className="mx-auto mb-2 h-11 w-11 rounded-2xl bg-white/[.06] grid place-items-center overflow-hidden">{focus.awayLogo ? <img src={focus.awayLogo} alt="" className="h-9 w-9 object-contain"/> : <Trophy size={18} className="text-cyan-300"/>}</div><b className="block truncate text-[10px]">{focus.away || "مهمان"}</b></div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[.05] pt-3 text-[8px] text-slate-500"><span>ورود مستقیم به Match Center</span><ArrowLeft size={13} className="transition group-hover:-translate-x-1"/></div>
      </Link>}

      {recent.length > 0 && <div className="mt-4">
        <div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-black text-slate-300">آخرین ۵ نتیجه</span><span className="text-[8px] text-slate-600">جدیدترین ← قدیمی‌تر</span></div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recent.map((match) => {
            const result = resultFor(match, teamId, teamName);
            return <Link key={match.id} href={`/matches/${match.id}`} className="min-w-[142px] rounded-2xl border border-white/[.05] bg-white/[.035] p-3 transition hover:bg-white/[.06]">
              <div className="flex items-center justify-between gap-2"><span className="text-[8px] text-slate-600">{formatKickoff(match.date)}</span><b className={`h-6 w-6 rounded-lg grid place-items-center text-[8px] ${result === "W" ? "bg-emerald-400 text-slate-950" : result === "D" ? "bg-amber-300 text-slate-950" : "bg-rose-400 text-white"}`}>{result || "—"}</b></div>
              <p className="mt-2 truncate text-[9px] font-semibold">{match.home || "—"}</p><p className="truncate text-[9px] font-semibold">{match.away || "—"}</p>
              <b className="mt-2 block text-xs">{match.homeScore ?? "—"} - {match.awayScore ?? "—"}</b>
            </Link>;
          })}
        </div>
      </div>}
    </section>
  );
}
