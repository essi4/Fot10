"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, Radio, RotateCcw, ShieldAlert, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  MATCH_VISUALIZATION_SCOPE,
  getMatchVisualizationLeague,
  isMatchVisualizationScope,
} from "../../../lib/match-visualization-scope";
import visualizationNormalizer from "../../../lib/match-visualization-normalizer.cjs";

const { buildVisualizationFeed, eventSide } = visualizationNormalizer;

const DEMO = {
  details: {
    fixture: { status: { short: "FT", elapsed: 90 } },
    teams: { home: { name: "انگلیس" }, away: { name: "اسپانیا" } },
    goals: { home: 2, away: 1 },
  },
  events: [
    ["kickoff", 1, "", "شروع مسابقه", "•"],
    ["Card", 22, "اسپانیا", "کارت زرد اسپانیا", "🟨"],
    ["Card", 35, "انگلیس", "کارت قرمز انگلیس", "🟥"],
    ["Goal", 42, "انگلیس", "گل انگلیس", "⚽"],
    ["halftime", 45, "", "پایان نیمه اول", "•"],
    ["subst", 57, "اسپانیا", "تعویض اسپانیا", "🔄"],
    ["shot", 66, "اسپانیا", "شوت اسپانیا", "🎯"],
    ["Goal", 73, "اسپانیا", "گل اسپانیا", "⚽"],
    ["Goal", 84, "انگلیس", "گل انگلیس", "⚽"],
    ["finished", 90, "", "پایان مسابقه", "•"],
  ],
};

const BASE = {
  home: [[9,50],[22,18],[22,38],[22,62],[22,82],[38,28],[38,48],[38,68],[57,22],[57,50],[57,78]],
  away: [[91,50],[78,18],[78,38],[78,62],[78,82],[62,28],[62,48],[62,68],[43,22],[43,50],[43,78]],
};
const FALLBACK_NAMES = {
  home: ["Pickford","Walker","Stones","Guehi","Shaw","Rice","Bellingham","Foden","Saka","Kane","Grealish"],
  away: ["Simon","Carvajal","Le Normand","Laporte","Cucurella","Rodri","Pedri","Olmo","Yamal","Morata","Williams"],
};

function todayTehran() {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).reduce((a, x) => ({ ...a, [x.type]: x.value }), {});
  return `${p.year}-${p.month}-${p.day}`;
}

function phaseOf(details) {
  const s = String(details?.fixture?.status?.short || "").toUpperCase();
  if (["FT","AET","PEN"].includes(s)) return "finished";
  if (s === "HT") return "halftime";
  if (["1H","2H","ET","P","BT","LIVE","IN PLAY"].includes(s)) return "live";
  if (["PST","CANC","ABD","AWD","WO"].includes(s)) return "cancelled";
  return "upcoming";
}

function playersFor(details, event, tick, lineups) {
  const h = lineups?.find((x) => String(x?.team?.id) === String(details?.teams?.home?.id))?.startXI?.map((x) => x?.player?.name).filter(Boolean) || [];
  const a = lineups?.find((x) => String(x?.team?.id) === String(details?.teams?.away?.id))?.startXI?.map((x) => x?.player?.name).filter(Boolean) || [];
  const names = { home: h.length === 11 ? h : FALLBACK_NAMES.home, away: a.length === 11 ? a : FALLBACK_NAMES.away };
  const active = eventSide(event, details);

  const make = (team) => BASE[team].map(([x, y], i) => {
    const sign = team === "home" ? 1 : -1;
    const push = active === team && ["goal","shot","substitution"].includes(event?.type) ? 4 : 0;
    return {
      id: `${team}-${i}`,
      team,
      name: names[team][i] || `بازیکن ${i + 1}`,
      x: team === "home" ? Math.min(95, x + sign * (1 + Math.abs(Math.sin((tick + i) * .8))) + push) : Math.max(5, x + sign * (1 + Math.abs(Math.sin((tick + i) * .8))) - push),
      y: Math.max(7, Math.min(93, y + Math.sin(tick * .6 + i) * 1.5)),
    };
  });
  return [...make("home"), ...make("away")];
}

function ballFor(details, event, tick) {
  const side = eventSide(event, details);
  if (event?.type === "goal") return side === "home" ? { x: 96, y: 50 } : { x: 4, y: 50 };
  if (event?.type === "shot") return side === "home" ? { x: 84, y: 48 } : { x: 16, y: 52 };
  return { x: 50 + Math.sin(tick * .7) * 14, y: 50 + Math.cos(tick * .5) * 17 };
}

function Visualization() {
  const sp = useSearchParams();
  const enabled = process.env.NEXT_PUBLIC_FOT10_MATCH_VISUALIZATION === "true" || sp.get("viz") === "1";
  const demo = sp.get("demo") === "1";
  const initialFixture = sp.get("fixture") || "";

  const [fixtures, setFixtures] = useState([]);
  const [selected, setSelected] = useState(initialFixture);
  const [details, setDetails] = useState(null);
  const [rawEvents, setRawEvents] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [league, setLeague] = useState("all");
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [stale, setStale] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [error, setError] = useState("");
  const [lastDataAt, setLastDataAt] = useState(0);

  const scoped = useMemo(() => fixtures.filter(isMatchVisualizationScope), [fixtures]);
  const activeDemo = demo;
  const match = activeDemo ? DEMO.details : details || scoped.find((x) => String(x.id) === String(selected));
  const sequence = useMemo(() => buildVisualizationFeed(rawEvents, match, activeDemo), [rawEvents, match, activeDemo]);
  const event = sequence[Math.min(index, Math.max(sequence.length - 1, 0))] || sequence[0] || null;
  const phase = stale ? "stale" : activeDemo ? (event?.type === "finished" ? "finished" : event?.type === "halftime" ? "halftime" : "live") : phaseOf(match);
  const players = useMemo(() => playersFor(match || DEMO.details, event, tick, lineups), [match, event, tick, lineups]);
  const ball = useMemo(() => ballFor(match || DEMO.details, event, tick), [match, event, tick]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync(); mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  async function loadFixtures() {
    try {
      const r = await fetch(`/api/football/fixtures?date=${todayTehran()}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !Array.isArray(j?.matches)) throw new Error("دریافت مسابقات ناموفق بود.");
      const next = j.matches.filter(isMatchVisualizationScope);
      setFixtures(next);
      if (!selected && next[0]?.id) setSelected(String(next[0].id));
      setLastDataAt(Date.now()); setStale(false); setError("");
    } catch (e) {
      setError(e?.message || "دریافت مسابقات ناموفق بود.");
    }
  }

  async function loadMatch(id, quiet = false) {
    if (!id) return;
    try {
      const [d, e, l] = await Promise.all([
        fetch(`/api/football/fixture?id=${id}&section=details`, { cache: "no-store" }),
        fetch(`/api/football/fixture?id=${id}&section=events`, { cache: "no-store" }),
        fetch(`/api/football/fixture?id=${id}&section=lineups`, { cache: "no-store" }),
      ]);
      const [dj, ej, lj] = await Promise.all([d.json(), e.json(), l.json()]);
      if (!d.ok || !dj?.ok || !dj?.data) throw new Error(dj?.error || "جزئیات مسابقه در دسترس نیست.");
      setDetails(dj.data);
      setRawEvents(Array.isArray(ej?.data) ? ej.data : []);
      setLineups(Array.isArray(lj?.data) ? lj.data : []);
      setLastDataAt(Date.now()); setStale(false); setError("");
    } catch (e) {
      setError(e?.message || "داده مسابقه دریافت نشد.");
      if (!quiet && lastDataAt && Date.now() - lastDataAt > 20000) setStale(true);
    }
  }

  useEffect(() => {
    if (!enabled || activeDemo) return;
    loadFixtures();
    const t = setInterval(loadFixtures, 30000);
    return () => clearInterval(t);
  }, [enabled, activeDemo]);

  useEffect(() => {
    if (!enabled || activeDemo || !selected) return;
    setIndex(0); setTick(0); setRunning(true);
    loadMatch(selected);
    const t = setInterval(() => loadMatch(selected, true), 15000);
    return () => clearInterval(t);
  }, [enabled, activeDemo, selected]);

  useEffect(() => {
    if (!enabled || stale || !running || sequence.length <= 1 || index >= sequence.length - 1) return;
    const t = setInterval(() => {
      setTick((v) => v + 1);
      setIndex((v) => Math.min(v + 1, sequence.length - 1));
    }, reduced ? 1400 : 1200);
    return () => clearInterval(t);
  }, [enabled, stale, running, sequence.length, index, reduced]);

  useEffect(() => {
    if (!enabled || activeDemo || !lastDataAt) return;
    const t = setInterval(() => {
      const s = String(match?.fixture?.status?.short || "").toUpperCase();
      const terminal = ["FT","AET","PEN","CANC","ABD","AWD","WO"].includes(s);
      if (!terminal && Date.now() - lastDataAt > 20000) {
        setStale(true); setRunning(false);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [enabled, activeDemo, lastDataAt, match]);

  function selectFixture(id) {
    setSelected(String(id));
    const u = new URL(window.location.href);
    u.searchParams.set("viz", "1");
    u.searchParams.set("fixture", String(id));
    u.searchParams.delete("demo");
    window.history.replaceState(null, "", u);
  }

  if (!enabled) return <section className="glass rounded-3xl p-6 text-center"><ShieldAlert className="mx-auto mb-3 text-amber-300" size={28}/><h2 className="font-black text-slate-200">Match Visualization غیرفعال است</h2><p className="mt-2 text-xs text-slate-500">برای Preview می‌توان با viz=1 فعالش کرد.</p></section>;

  const filtered = league === "all" ? scoped : scoped.filter((x) => getMatchVisualizationLeague(x)?.key === league);
  const hasRenderableMatch = Boolean(match || activeDemo);
  const scoreHome = Number.isFinite(Number(match?.goals?.home)) ? match.goals.home : "—";
  const scoreAway = Number.isFinite(Number(match?.goals?.away)) ? match.goals.away : "—";

  return <section className="space-y-3">
    <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[.05] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex items-center gap-2"><Radio size={15} className="shrink-0 text-cyan-300"/><span className="truncate text-[10px] font-black tracking-widest text-cyan-200">MATCH VISUALIZATION · V1 · MOBILE</span></div><p className="mt-1 text-[9px] leading-4 text-slate-500">فقط ۱۰ لیگ تعیین‌شده FOT10؛ رویدادها از فید خواندنی مسابقه نرمال‌سازی می‌شوند و حرکت‌ها فقط نمایشگر هستند، نه مختصات واقعی بازیکنان.</p></div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${phase === "stale" ? "bg-amber-400/10 text-amber-300" : phase === "finished" ? "bg-slate-400/10 text-slate-300" : phase === "halftime" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{phase === "stale" ? "STALE" : phase === "finished" ? "پایان" : phase === "halftime" ? "نیمه‌وقت" : phase === "upcoming" ? "UPCOMING" : "LIVE"}</span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">{MATCH_VISUALIZATION_SCOPE.map((x) => <button type="button" key={x.key} onClick={() => setLeague(x.key === league ? "all" : x.key)} className={`min-w-[72px] shrink-0 rounded-xl border px-2 py-2.5 text-[8px] font-black touch-manipulation ${x.key === league ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200" : "border-white/7 bg-white/[.025] text-slate-500"}`}>{x.label}</button>)}</div>

      {!activeDemo && <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">{filtered.slice(0, 10).map((x) => <button type="button" key={x.id} onClick={() => selectFixture(x.id)} className={`min-w-[170px] shrink-0 rounded-xl border p-2.5 text-right ${String(x.id) === String(selected) ? "border-emerald-300/25 bg-emerald-400/10" : "border-white/7 bg-white/[.02]"}`}><span className="block truncate text-[8px] text-slate-500">{x.league}</span><span className="mt-1 block truncate text-[9px] font-black text-slate-300">{x.home} · {x.away}</span></button>)}</div>}
    </div>

    {activeDemo && <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-3 text-[9px] text-amber-100">Demo QA فقط با ?demo=1 فعال می‌شود و برای تست کارت، گل، نیمه‌وقت، پایان و Reduced Motion است؛ داده واقعی را تغییر نمی‌دهد.</div>}
    {error && <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-3 text-[9px] text-red-200">{error}</div>}

    {hasRenderableMatch && <>
    <div className="rounded-3xl border border-white/10 bg-white/[.025] p-3.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-black/20 p-3 text-center">
        <div className="min-w-0"><b className="block truncate text-sm text-blue-200">{match?.teams?.home?.name || "میزبان"}</b><strong className="mt-1 block text-2xl text-white tabular-nums">{scoreHome}</strong></div>
        <div className="min-w-[90px]"><span className="text-xs font-black text-slate-500">{event?.minuteLabel || (match?.fixture?.status?.elapsed != null ? `${match.fixture.status.elapsed}'` : "—")}</span><span className="mx-1 text-slate-700">·</span><span className="text-[8px] text-slate-500">{event?.label || "داده رویدادی"}</span></div>
        <div className="min-w-0"><b className="block truncate text-sm text-red-200">{match?.teams?.away?.name || "مهمان"}</b><strong className="mt-1 block text-2xl text-white tabular-nums">{scoreAway}</strong></div>
      </div>
    </div>

    <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[28px] border border-white/15 bg-[#087443] shadow-2xl" style={{ aspectRatio: "2 / 3" }}>
      <div className="pointer-events-none absolute inset-[4%] rounded-[22px] border-2 border-white/60"/><div className="pointer-events-none absolute left-[4%] right-[4%] top-1/2 border-t border-white/60"/><div className="pointer-events-none absolute left-1/2 top-1/2 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"/><div className="pointer-events-none absolute left-[4%] top-[33%] h-[34%] w-[17%] border border-white/60"/><div className="pointer-events-none absolute right-[4%] top-[33%] h-[34%] w-[17%] border border-white/60"/>
      {players.map((p) => <div key={p.id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${reduced ? "" : "transition-[left,top] duration-700"}`} style={{left:`${p.x}%`,top:`${p.y}%`}}><span className="pointer-events-none absolute bottom-full left-1/2 mb-0.5 max-w-[74px] -translate-x-1/2 truncate rounded bg-black/65 px-1 py-0.5 text-[7px] font-black">{p.name}</span><div className={`grid h-8 w-8 place-items-center rounded-full border-2 shadow-lg ${p.team === "home" ? "border-blue-400 bg-blue-400/15" : "border-red-400 bg-red-400/15"} ${event?.type === "goal" && eventSide(event, match || DEMO.details) === p.team ? "scale-125" : ""}`}><span className="text-[19px]">🏃‍♂️</span></div></div>)}
      <div className={`absolute -translate-x-1/2 -translate-y-1/2 ${reduced ? "" : "transition-[left,top] duration-700"}`} style={{left:`${ball.x}%`,top:`${ball.y}%`}}><span className="text-[24px]">⚽</span></div>
    </div>

    {event?.type === "card" && <div className={`rounded-2xl border px-3 py-2 text-[9px] ${event.red ? "border-red-400/20 bg-red-400/5 text-red-200" : "border-amber-400/20 bg-amber-400/5 text-amber-200"}`}>{event.red ? "🟥" : "🟨"} {event.label}</div>}
    {event?.type === "goal" && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[9px] font-black text-emerald-200">⚽ {event.label} · نتیجه معتبر: {scoreHome} - {scoreAway}</div>}
    {event?.type === "halftime" && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] font-black text-amber-200">⏸️ پایان نیمه اول</div>}
    {event?.type === "finished" && <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 px-3 py-2 text-[9px] font-black text-slate-200">🏁 پایان مسابقه · نتیجه: {scoreHome} - {scoreAway}</div>}
    {stale && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] text-amber-200">داده تازه دریافت نشد؛ نمایش متحرک متوقف شد تا از نمایش وضعیت جعلی جلوگیری شود.</div>}

    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Zap size={14} className="text-cyan-300"/><span className="text-[10px] font-black">Event Feed</span></div><span className="text-[8px] text-slate-600">{sequence.length} رویداد</span></div>
      <div className="max-h-[360px] space-y-1.5 overflow-y-auto">
        {sequence.map((e, i) => <button key={e.key} type="button" onClick={() => setIndex(i)} className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-right touch-manipulation ${i === index ? "border-cyan-400/15 bg-cyan-400/[.05]" : "border-white/5 bg-white/[.02]"}`}><span className="text-[12px]">{e.icon}</span><span className="min-w-0 flex-1 text-right"><span className="block truncate text-[9px] font-bold text-slate-300">{e.label}</span>{(e.player || e.assist) && <span className="block truncate text-[7px] text-slate-600">{e.player || ""}{e.assist ? ` · پاس: ${e.assist}` : ""}</span>}</span><span className="text-[8px] font-black text-slate-500">{e.minuteLabel}</span></button>)}
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => setRunning((v) => !v)} className="glass min-h-[44px] rounded-xl px-3 py-2 text-[10px] font-black touch-manipulation">{running ? <><Pause size={13} className="mr-1 inline"/>توقف</> : <><Play size={13} className="mr-1 inline"/>ادامه</>}</button>
      <button type="button" onClick={() => { setIndex(0); setTick(0); setRunning(true); setStale(false); }} className="glass min-h-[44px] rounded-xl px-3 py-2 text-[10px] font-black touch-manipulation"><RotateCcw size={13} className="mr-1 inline"/>ریست</button>
      <button type="button" onClick={() => { setStale(true); setRunning(false); }} className="min-h-[44px] rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-black text-amber-200 touch-manipulation">تست STALE</button>
      {activeDemo && <button type="button" onClick={() => setIndex(sequence.length - 1)} className="min-h-[44px] rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-[10px] font-black text-red-200 touch-manipulation">برو پایان</button>}
    </div>
    </>}
  </section>;
}

export default function MatchVisualizationPage() {
  return <main className="fot-shell"><div className="fot-container space-y-4 pb-28"><header className="flex items-center gap-3"><Link href="/matches" aria-label="بازگشت" className="glass grid h-11 w-11 shrink-0 place-items-center rounded-xl touch-manipulation"><ArrowRight size={18}/></Link><div className="min-w-0"><h1 className="truncate text-xl font-black text-slate-100">نمایش آتاری‌مانند مسابقه</h1><p className="text-[10px] text-slate-500">FOT10 · Match Visualization V1 · Mobile · ۱۰ لیگ</p></div></header><Suspense fallback={<section className="glass rounded-3xl p-6 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-cyan-400/20"/><p className="text-xs font-bold text-slate-400">در حال آماده‌سازی Match Vision…</p></section>}><Visualization/></Suspense></div></main>;
}
