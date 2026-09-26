"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, RotateCcw, Radio, ShieldAlert, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";

const TEAM = {
  home: { name: "انگلیس", color: "#2563eb", soft: "rgba(37,99,235,.18)", text: "#dbeafe" },
  away: { name: "اسپانیا", color: "#dc2626", soft: "rgba(220,38,38,.18)", text: "#fee2e2" },
};

const EVENT_SEQUENCE = [
  { at: 0, type: "kickoff", minute: 1, label: "شروع مسابقه" },
  { at: 8, type: "attack", team: "home", minute: 9, label: "حمله انگلیس" },
  { at: 16, type: "shot", team: "home", minute: 17, label: "شوت انگلیس" },
  { at: 25, type: "attack", team: "away", minute: 26, label: "حمله اسپانیا" },
  { at: 35, type: "card", team: "away", minute: 35, label: "کارت زرد اسپانیا" },
  { at: 48, type: "goal", team: "home", minute: 42, label: "گل انگلیس" },
  { at: 54, type: "halftime", minute: 45, label: "پایان نیمه اول" },
  { at: 70, type: "attack", team: "home", minute: 52, label: "حمله انگلیس" },
  { at: 82, type: "substitution", team: "away", minute: 57, label: "تعویض اسپانیا" },
  { at: 94, type: "shot", team: "away", minute: 66, label: "شوت اسپانیا" },
  { at: 108, type: "goal", team: "away", minute: 73, label: "گل اسپانیا" },
  { at: 132, type: "finished", minute: 90, label: "پایان مسابقه" },
];

const PLAYER_NAMES = {
  home: ["Pickford", "Walker", "Stones", "Guehi", "Shaw", "Rice", "Bellingham", "Foden", "Saka", "Kane", "Grealish"],
  away: ["Simon", "Carvajal", "Le Normand", "Laporte", "Cucurella", "Rodri", "Pedri", "Olmo", "Yamal", "Morata", "Williams"],
};

const BASE_HOME = [
  [9,50],[22,18],[22,38],[22,62],[22,82],[38,28],[38,48],[38,68],[57,22],[57,50],[57,78]
];
const BASE_AWAY = [
  [91,50],[78,18],[78,38],[78,62],[78,82],[62,28],[62,48],[62,68],[43,22],[43,50],[43,78]
];

function seededOffset(index, tick, teamSign) {
  const wave = Math.sin((tick + index * 1.7) * 0.9) * 2.2;
  const drift = Math.cos((tick * 0.65) + index) * 1.4;
  return {
    x: teamSign * (Math.abs(wave) + 1.2) + drift * 0.22,
    y: Math.sin(tick * 0.7 + index) * 1.7,
  };
}

function buildPlayers(tick, ball, eventType) {
  return [
    ...BASE_HOME.map(([x,y], i) => {
      const o = seededOffset(i, tick, 1);
      const push = eventType === "attack" || eventType === "shot" || eventType === "goal" ? 4 : 0;
      return { id: `h-${i}`, team: "home", name: PLAYER_NAMES.home[i], x: Math.min(95, x + o.x + push), y: Math.max(7, Math.min(93, y + o.y)), state: eventType === "goal" ? "celebrate" : push ? "attack" : "run" };
    }),
    ...BASE_AWAY.map(([x,y], i) => {
      const o = seededOffset(i, tick, -1);
      const push = eventType === "attack" || eventType === "shot" || eventType === "goal" ? 4 : 0;
      return { id: `a-${i}`, team: "away", name: PLAYER_NAMES.away[i], x: Math.max(5, x + o.x - (eventType === "attack" && eventType !== "goal" ? push : 0)), y: Math.max(7, Math.min(93, y + o.y)), state: eventType === "goal" ? "celebrate" : push ? "attack" : "run" };
    }),
  ].map((p) => ({ ...p, distance: Math.hypot(p.x - ball.x, p.y - ball.y) }));
}

function ballFor(eventType, team, tick) {
  const wave = Math.sin(tick * 0.8) * 8;
  if (eventType === "goal") return team === "home" ? { x: 96, y: 50 } : { x: 4, y: 50 };
  if (eventType === "shot") return team === "home" ? { x: 84, y: 48 + wave * .3 } : { x: 16, y: 52 + wave * .3 };
  if (eventType === "attack") return team === "home" ? { x: 70, y: 46 + wave } : { x: 30, y: 54 + wave };
  return { x: 50 + Math.sin(tick * .7) * 15, y: 50 + Math.cos(tick * .5) * 18 };
}

function Visualization() {
  const searchParams = useSearchParams();
  const flagEnabled = process.env.NEXT_PUBLIC_FOT10_MATCH_VISUALIZATION === "true" || searchParams.get("viz") === "1";
  const [running, setRunning] = useState(true);
  const [cancelled, setCancelled] = useState(false);
  const [stale, setStale] = useState(false);
  const [tick, setTick] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const [minute, setMinute] = useState(1);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [phase, setPhase] = useState("upcoming");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lastEvent, setLastEvent] = useState(EVENT_SEQUENCE[0]);
  const [lastDataAt, setLastDataAt] = useState(Date.now());

  const currentEvent = EVENT_SEQUENCE[Math.min(eventIndex, EVENT_SEQUENCE.length - 1)];
  const ball = useMemo(() => ballFor(currentEvent.type, currentEvent.team, tick), [currentEvent, tick]);
  const players = useMemo(() => buildPlayers(tick, ball, currentEvent.type), [tick, ball, currentEvent.type]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!flagEnabled) return;
    const timer = setTimeout(() => setPhase("live"), 900);
    return () => clearTimeout(timer);
  }, [flagEnabled]);

  useEffect(() => {
    if (!running || cancelled || stale || !flagEnabled || phase === "finished") return;
    const timer = setInterval(() => {
      setTick((v) => v + 1);
      setLastDataAt(Date.now());
      setEventIndex((index) => {
        const next = Math.min(index + 1, EVENT_SEQUENCE.length - 1);
        const event = EVENT_SEQUENCE[next];
        setMinute(event.minute);
        setLastEvent(event);
        if (event.type === "goal") setScore((s) => ({ ...s, [event.team]: s[event.team] + 1 }));
        if (event.type === "halftime") setPhase("halftime");
        else if (event.type === "finished") setPhase("finished");
        else if (phase === "halftime") setPhase("live");
        return next;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [running, cancelled, stale, flagEnabled, phase]);

  useEffect(() => {
    if (!running || cancelled || !flagEnabled) return;
    const watchdog = setInterval(() => {
      if (Date.now() - lastDataAt > 6000) setStale(true);
    }, 1000);
    return () => clearInterval(watchdog);
  }, [running, cancelled, flagEnabled, lastDataAt]);

  useEffect(() => {
    if (currentEvent.type === "halftime") {
      const timer = setTimeout(() => setPhase("live"), 1600);
      return () => clearTimeout(timer);
    }
  }, [currentEvent.type]);

  function reset() {
    setRunning(true); setCancelled(false); setStale(false); setTick(0); setEventIndex(0);
    setMinute(1); setScore({ home: 0, away: 0 }); setPhase("upcoming"); setLastEvent(EVENT_SEQUENCE[0]); setLastDataAt(Date.now());
  }

  function simulateStale() {
    setStale(true);
    setRunning(false);
  }

  if (!flagEnabled) {
    return <section className="glass rounded-3xl p-6 text-center"><ShieldAlert className="mx-auto mb-3 text-amber-300" size={28}/><h2 className="font-black text-slate-200">Match Visualization غیرفعال است</h2><p className="mt-2 text-xs text-slate-500">این قابلیت پشت Feature Flag قرار دارد. برای Preview می‌توان آن را با پارامتر viz=1 فعال کرد.</p></section>;
  }

  if (cancelled) {
    return <section className="glass rounded-3xl p-6 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-500/10 text-slate-400">×</div><h2 className="font-black text-slate-200">مسابقه لغو شده</h2><p className="mt-2 text-xs text-slate-500">هیچ موقعیت یا رویداد جدیدی نمایش داده نمی‌شود.</p><button onClick={reset} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">شروع مجدد دمو</button></section>;
  }

  return <section className="space-y-3">
    <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[.08] via-white/[.025] to-transparent p-4">
      <div className="flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><Radio size={15} className="text-cyan-300"/><span className="text-[10px] font-black tracking-widest text-cyan-200">MATCH VISUALIZATION · V1</span></div><p className="mt-1 text-[9px] text-slate-500">نمایش شبیه‌سازی‌شده بر اساس رویدادها — مختصات بازیکنان واقعی نیست.</p></div>
        <span className={`rounded-full px-2 py-1 text-[8px] font-black ${stale ? "bg-amber-400/10 text-amber-300" : phase === "finished" ? "bg-slate-400/10 text-slate-300" : "bg-emerald-400/10 text-emerald-300"}`}>{stale ? "STALE" : phase.toUpperCase()}</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-black/20 p-3 text-center">
        <div><b className="text-sm text-blue-200">{TEAM.home.name}</b><strong className="mt-1 block text-2xl text-white">{score.home}</strong></div>
        <div><span className="text-xs font-black text-slate-500">{minute}'</span><span className="mx-1 text-slate-700">·</span><span className="text-[9px] text-slate-500">{lastEvent.label}</span></div>
        <div><b className="text-sm text-red-200">{TEAM.away.name}</b><strong className="mt-1 block text-2xl text-white">{score.away}</strong></div>
      </div>
    </div>

    <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[28px] border border-white/15 bg-[#087443] shadow-2xl" style={{ aspectRatio: "2 / 3" }}>
      <div className="pointer-events-none absolute inset-[4%] rounded-[22px] border-2" style={{borderColor:"rgba(255,255,255,.65)"}}/>
      <div className="pointer-events-none absolute left-[4%] right-[4%] top-1/2 border-t border-white/60"/>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"/>
      <div className="pointer-events-none absolute left-[4%] top-[33%] h-[34%] w-[17%] border border-white/60"/>
      <div className="pointer-events-none absolute right-[4%] top-[33%] h-[34%] w-[17%] border border-white/60"/>
      <div className="pointer-events-none absolute left-[4%] top-[42%] h-[16%] w-[6%] border border-white/60"/>
      <div className="pointer-events-none absolute right-[4%] top-[42%] h-[16%] w-[6%] border border-white/60"/>
      {players.map((player) => {
        const t = TEAM[player.team];
        return <div key={player.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ease-out ${reducedMotion ? "" : "transition-[left,top] duration-700"}`} style={{left:`${player.x}%`,top:`${player.y}%`}}><span className="pointer-events-none absolute bottom-full left-1/2 mb-0.5 max-w-[64px] -translate-x-1/2 truncate rounded bg-black/65 px-1 py-0.5 text-center text-[7px] font-black leading-none shadow-sm sm:max-w-[72px] sm:text-[8px]" style={{color:t.text, border:`1px solid ${t.color}66`}}><span className="min-[360px]:hidden">{player.name.slice(0, 1)}</span><span className="hidden min-[360px]:inline">{player.name}</span></span><div className={`grid h-8 w-8 place-items-center rounded-full border-2 shadow-lg ${player.state === "celebrate" ? "scale-125" : player.state === "attack" ? "scale-110" : ""}`} style={{background:t.soft,borderColor:t.color}}><span className="text-[20px] leading-none">🏃‍♂️</span></div></div>;
      })}
      <div className={`absolute -translate-x-1/2 -translate-y-1/2 ease-out ${reducedMotion ? "" : "transition-[left,top] duration-700"}`} style={{left:`${ball.x}%`,top:`${ball.y}%`}}><span className="block text-[24px] leading-none drop-shadow-lg">⚽</span></div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/30 px-3 py-2 text-[8px] font-bold text-white/80"><span>{TEAM.home.name}</span><span>{lastEvent.label}</span><span>{TEAM.away.name}</span></div>
    </div>

    {lastEvent.type === "card" && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] text-amber-200">🟨 کارت زرد برای {lastEvent.team === "home" ? TEAM.home.name : TEAM.away.name}</div>}
    {lastEvent.type === "substitution" && <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-[9px] text-cyan-200">🔄 تعویض برای {lastEvent.team === "home" ? TEAM.home.name : TEAM.away.name}</div>}
    {lastEvent.type === "goal" && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[9px] font-black text-emerald-200">⚽ گل {lastEvent.team === "home" ? TEAM.home.name : TEAM.away.name} — نتیجه به‌روزرسانی شد</div>}
    {stale && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] text-amber-200">داده تازه دریافت نشد؛ انیمیشن متوقف شد تا از نمایش وضعیت جعلی جلوگیری شود.</div>}

    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-cyan-300"/>
          <span className="text-[10px] font-black text-slate-200">رویدادهای اخیر</span>
        </div>
        <span className="text-[8px] text-slate-600">EVENT FEED</span>
      </div>
      <div className="space-y-1.5">
        {EVENT_SEQUENCE.slice(0, eventIndex + 1).slice(-4).reverse().map((event, index) => (
          <div key={event.at} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${index === 0 ? "border-cyan-400/15 bg-cyan-400/[.05]" : "border-white/5 bg-white/[.02]"}`}>
            <span className="text-[12px]">{event.type === "goal" ? "⚽" : event.type === "card" ? "🟨" : event.type === "substitution" ? "🔄" : event.type === "shot" ? "🎯" : event.type === "attack" ? "⚡" : "•"}</span>
            <span className="min-w-0 flex-1 truncate text-[9px] font-bold text-slate-300">{event.label}</span>
            <span className="text-[8px] font-black text-slate-500">{event.minute}'</span>
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2">
      <button onClick={() => { setRunning((v) => !v); setStale(false); setLastDataAt(Date.now()); }} className="glass rounded-xl px-3 py-2 text-[10px] font-black text-slate-200">{running ? <><Pause size={13} className="mr-1 inline"/> توقف</> : <><Play size={13} className="mr-1 inline"/> ادامه</>}</button>
      <button onClick={reset} className="glass rounded-xl px-3 py-2 text-[10px] font-black text-slate-200"><RotateCcw size={13} className="mr-1 inline"/> ریست</button>
      <button onClick={simulateStale} className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-black text-amber-200">تست STALE</button>
      <button onClick={() => { setCancelled(true); setRunning(false); }} className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-[10px] font-black text-red-200">لغو مسابقه</button>
    </div>
  </section>;
}

export default function MatchVisualizationPage() {
  return <main className="fot-shell"><div className="fot-container space-y-4">
    <header className="flex items-center justify-between"><div className="flex items-center gap-3"><Link href="/matches" className="glass grid h-10 w-10 place-items-center rounded-xl"><ArrowRight size={18}/></Link><div><h1 className="text-xl font-black text-slate-100">نمایش آتاری‌مانند مسابقه</h1><p className="text-[10px] text-slate-500">FOT10 · Match Visualization V1</p></div></div></header>
    <Suspense fallback={<section className="glass rounded-3xl p-6 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-cyan-400/20" /><p className="text-xs font-bold text-slate-400">در حال آماده‌سازی Match Vision…</p></section>}><Visualization /></Suspense>
  </div></main>;
}
