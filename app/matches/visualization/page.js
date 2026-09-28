"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, Radio, RotateCcw, ShieldAlert, Zap, Crosshair } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  MATCH_VISUALIZATION_SCOPE,
  getMatchVisualizationLeague,
  isMatchVisualizationScope,
} from "../../../lib/match-visualization-scope";
import visualizationNormalizer from "../../../lib/match-visualization-normalizer.cjs";

const { buildVisualizationFeed, eventSide } = visualizationNormalizer;
import retroPitchRenderer from "../../../lib/retro-pitch-renderer.cjs";
const { selectRenderablePitchEvents } = retroPitchRenderer;

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
  const s = String(details?.fixture?.status?.short || details?.statusShort || "").toUpperCase();
  if (["FT","AET","PEN"].includes(s)) return "finished";
  if (s === "HT") return "halftime";
  if (["1H","2H","ET","P","BT","LIVE","IN PLAY"].includes(s)) return "live";
  if (["PST","CANC","ABD","AWD","WO"].includes(s)) return "cancelled";
  return "upcoming";
}

function playersFor(details, event, tick, lineups, allowFallback = false) {
  const starters = (teamId) => lineups?.find((x) => String(x?.team?.id) === String(teamId))?.startXI?.map((x) => ({
    name: x?.player?.name || "",
    number: x?.player?.number ?? null,
  }))?.filter((x) => x.name) || [];
  const h = starters(details?.teams?.home?.id);
  const a = starters(details?.teams?.away?.id);
  const names = allowFallback
    ? { home: FALLBACK_NAMES.home.map((name, i) => ({ name, number: i + 1 })), away: FALLBACK_NAMES.away.map((name, i) => ({ name, number: i + 1 })) }
    : { home: h, away: a };
  const active = eventSide(event, details);

  const make = (team) => BASE[team].map(([x, y], i) => {
    const sign = team === "home" ? 1 : -1;
    const push = active === team && ["goal","shot","substitution"].includes(event?.type) ? 4 : 0;
    return {
      id: `${team}-${i}`,
      team,
      name: names[team][i]?.name || `#${i + 1}`,
      number: names[team][i]?.number ?? i + 1,
      known: Boolean(names[team][i]?.name),
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

const EVENT_ICONS = { goal: "⚽", shot: "◉", yellow_card: "▮", red_card: "▮", substitution: "↔", var: "V", penalty: "P", missed_penalty: "×", corner: "⌜" };

function eventTeamSide(canonical, match) {
  const home = String(match?.teams?.home?.id ?? match?.teams?.home?.name ?? "");
  const away = String(match?.teams?.away?.id ?? match?.teams?.away?.name ?? "");
  const team = String(canonical?.acting_team ?? "");
  if (team && team === home) return "home";
  if (team && team === away) return "away";
  return "";
}

function RetroPitch({ events, selectedEvent, match, reduced }) {
  const canonicalEvents = events.map((e) => e?.canonicalEvent).filter(Boolean);
  const located = selectRenderablePitchEvents(canonicalEvents);
  const selectedCanonical = selectedEvent?.canonicalEvent;
  const selectedLocated = located.find((e) => e.event_id === selectedCanonical?.event_id);
  const homeName = match?.teams?.home?.name || "میزبان";
  const awayName = match?.teams?.away?.name || "مهمان";
  return <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07130f] p-2 shadow-[0_25px_80px_rgba(0,0,0,.38)]">
    <div className="mb-2 flex items-center justify-between gap-2 px-1 text-[8px] font-black"><span className="flex items-center gap-1.5 text-blue-200"><span className="h-2 w-2 rounded-full bg-blue-400"/>{homeName}</span><span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-slate-500">MODERN RETRO · LOCATION SAFE</span><span className="flex items-center gap-1.5 text-red-200">{awayName}<span className="h-2 w-2 rounded-full bg-red-400"/></span></div>
    <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] border border-white/15 bg-[#0b693e]">
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",backgroundSize:"24px 24px"}}/>
      <div className="absolute inset-[3.5%] rounded-xl border-2 border-[#f5f1dc]/80"/><div className="absolute left-1/2 top-[3.5%] h-[93%] border-l border-[#f5f1dc]/75"/><div className="absolute left-1/2 top-1/2 h-[29%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f5f1dc]/75"/><div className="absolute left-[3.5%] top-[25%] h-[50%] w-[17%] border-2 border-l-0 border-[#f5f1dc]/75"/><div className="absolute right-[3.5%] top-[25%] h-[50%] w-[17%] border-2 border-r-0 border-[#f5f1dc]/75"/><div className="absolute left-[3.5%] top-[38%] h-[24%] w-[5%] border border-[#f5f1dc]/70"/><div className="absolute right-[3.5%] top-[38%] h-[24%] w-[5%] border border-[#f5f1dc]/70"/>
      {located.map((p) => { const side = eventTeamSide(p, match); const active = p.event_id === selectedCanonical?.event_id; return <div key={p.event_id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${reduced ? "" : "transition-transform duration-300"} ${active ? "z-20 scale-125" : "z-10"}`} style={{left:`${p.coordinates.x}%`,top:`${p.coordinates.y}%`}} title={`${p.game_clock || "—"} · ${p.event_type}`}><div className={`grid h-8 w-8 place-items-center rounded-full border-2 shadow-lg ${side === "home" ? "border-blue-300 bg-blue-500/90" : side === "away" ? "border-red-300 bg-red-500/90" : "border-[#f5f1dc] bg-slate-800/90"} ${active ? "ring-4 ring-white/25" : ""}`}><span className="font-black text-white">{EVENT_ICONS[p.event_type] || "•"}</span></div>{active && <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/70 px-1.5 py-1 text-[7px] font-black text-white">{p.game_clock || "—"}</span>}</div>; })}
      {selectedLocated && <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{left:`${selectedLocated.coordinates.x}%`,top:`${selectedLocated.coordinates.y}%`}}><div className="h-12 w-12 animate-ping rounded-full border border-white/30"/></div>}
      {!located.length && <div className="absolute inset-0 grid place-items-center"><div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center backdrop-blur"><Crosshair className="mx-auto mb-1 text-slate-400" size={18}/><b className="block text-[9px] text-slate-200">داده مکانی در فید موجود نیست</b><span className="mt-1 block text-[7px] text-slate-500">هیچ نقطه‌ای حدس زده نمی‌شود</span></div></div>}
      <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[7px] font-black text-white backdrop-blur">PITCH · {located.length} موقعیت معتبر</div>
    </div>
  </div>;
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
  const [league, setLeague] = useState(sp.get("league") || "all");
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const [stale, setStale] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [error, setError] = useState("");
  const [lastMatchDataAt, setLastMatchDataAt] = useState(0);
  const [followLatest, setFollowLatest] = useState(true);

  const scoped = useMemo(() => fixtures.filter(isMatchVisualizationScope), [fixtures]);
  const activeDemo = demo;
  const filtered = useMemo(() => league === "all" ? scoped : scoped.filter((x) => getMatchVisualizationLeague(x)?.key === league), [league, scoped]);
  const match = activeDemo ? DEMO.details : details || scoped.find((x) => String(x.id) === String(selected));
  const demoEvents = useMemo(() => DEMO.events.map(([type, minute, team, label, icon]) => ({ type, minute, team, label, icon })), []);
  const feedSource = activeDemo ? demoEvents : rawEvents;
  const sequence = useMemo(() => buildVisualizationFeed(feedSource, match, activeDemo), [feedSource, match, activeDemo]);
  const event = sequence[Math.min(index, Math.max(sequence.length - 1, 0))] || sequence[0] || null;
  const phase = stale ? "stale" : activeDemo ? (event?.type === "finished" ? "finished" : event?.type === "halftime" ? "halftime" : "live") : phaseOf(match);
  const players = useMemo(() => playersFor(match || DEMO.details, event, tick, lineups, activeDemo), [match, event, tick, lineups, activeDemo]);
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
      setSelected((current) => current || (next[0]?.id ? String(next[0].id) : ""));
      setError("");
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
      setLastMatchDataAt(Date.now()); setStale(false); setError("");
    } catch (e) {
      setError(e?.message || "داده مسابقه دریافت نشد.");
      if (!quiet && lastMatchDataAt && Date.now() - lastMatchDataAt > 20000) setStale(true);
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
    if (!enabled || stale || !running || !activeDemo || sequence.length <= 1 || index >= sequence.length - 1) return;
    const t = setInterval(() => {
      setTick((v) => v + 1);
      setIndex((v) => Math.min(v + 1, sequence.length - 1));
    }, reduced ? 1400 : 1200);
    return () => clearInterval(t);
  }, [enabled, stale, running, activeDemo, sequence.length, index, reduced]);

  useEffect(() => {
    if (!activeDemo && followLatest) setIndex(Math.max(sequence.length - 1, 0));
  }, [activeDemo, followLatest, sequence.length]);

  useEffect(() => {
    if (activeDemo || league === "all") return;
    if (selected && !filtered.some((item) => String(item.id) === String(selected))) {
      setSelected(filtered[0]?.id ? String(filtered[0].id) : "");
      setDetails(null);
      setRawEvents([]);
      setLineups([]);
      setFollowLatest(true);
    }
  }, [activeDemo, league, filtered, selected]);

  useEffect(() => {
    if (!enabled || activeDemo || !lastMatchDataAt) return;
    const t = setInterval(() => {
      const s = String(match?.fixture?.status?.short || "").toUpperCase();
      const terminal = ["FT","AET","PEN","CANC","ABD","AWD","WO"].includes(s);
      if (!terminal && Date.now() - lastMatchDataAt > 20000) {
        setStale(true); setRunning(false);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [enabled, activeDemo, lastMatchDataAt, match]);

  function selectFixture(id) {
    setSelected(String(id));
    setDetails(null);
    setRawEvents([]);
    setLineups([]);
    setFollowLatest(true);
    const u = new URL(window.location.href);
    u.searchParams.set("viz", "1");
    u.searchParams.set("fixture", String(id));
    u.searchParams.set("league", league);
    u.searchParams.delete("demo");
    window.history.replaceState(null, "", u);
  }

  if (!enabled) return <section className="glass rounded-3xl p-6 text-center"><ShieldAlert className="mx-auto mb-3 text-amber-300" size={28}/><h2 className="font-black text-slate-200">Match Visualization غیرفعال است</h2><p className="mt-2 text-xs text-slate-500">برای Preview می‌توان با viz=1 فعالش کرد.</p></section>;

  const hasRenderableMatch = Boolean(match || activeDemo);
  const scoreHomeValue = match?.goals?.home ?? match?.homeScore;
  const scoreAwayValue = match?.goals?.away ?? match?.awayScore;
  const scoreHome = Number.isFinite(Number(scoreHomeValue)) ? Number(scoreHomeValue) : "—";
  const scoreAway = Number.isFinite(Number(scoreAwayValue)) ? Number(scoreAwayValue) : "—";
  const homeTeamName = match?.teams?.home?.name || match?.home || "میزبان";
  const awayTeamName = match?.teams?.away?.name || match?.away || "مهمان";

  return <section className="space-y-3">
    <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[.05] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex items-center gap-2"><Radio size={15} className="shrink-0 text-cyan-300"/><span className="truncate text-[10px] font-black tracking-widest text-cyan-200">MATCH VISUALIZATION · V1 · MOBILE</span></div><p className="mt-1 text-[9px] leading-4 text-slate-500">فقط ۱۰ لیگ تعیین‌شده FOT10؛ رویدادها از فید خواندنی مسابقه نرمال‌سازی می‌شوند و حرکت‌ها فقط نمایشگر هستند، نه مختصات واقعی بازیکنان.</p></div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${phase === "stale" ? "bg-amber-400/10 text-amber-300" : phase === "finished" ? "bg-slate-400/10 text-slate-300" : phase === "halftime" ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{phase === "stale" ? "STALE" : phase === "finished" ? "پایان" : phase === "halftime" ? "نیمه‌وقت" : phase === "upcoming" ? "UPCOMING" : "LIVE"}</span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" aria-label="انتخاب لیگ">{MATCH_VISUALIZATION_SCOPE.map((x) => { const count = scoped.filter((item) => getMatchVisualizationLeague(item)?.key === x.key).length; return <button type="button" key={x.key} onClick={() => setLeague(x.key === league ? "all" : x.key)} aria-pressed={x.key === league} className={`min-w-[82px] shrink-0 rounded-xl border px-2 py-2 touch-manipulation ${x.key === league ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200" : "border-white/7 bg-white/[.025] text-slate-500"}`}><span className="block text-[8px] font-black">{x.label}</span><span className={`mt-0.5 block text-[7px] ${count ? "text-slate-400" : "text-slate-700"}`}>{count} مسابقه</span></button>; })}</div>

      {!activeDemo && <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="انتخاب مسابقه">{filtered.slice(0, 20).map((x) => <button type="button" key={x.id} onClick={() => selectFixture(x.id)} className={`min-w-[170px] shrink-0 rounded-xl border p-2.5 text-right ${String(x.id) === String(selected) ? "border-emerald-300/25 bg-emerald-400/10" : "border-white/7 bg-white/[.02]"}`}><span className="block truncate text-[8px] text-slate-500">{x.league} · {x.statusShort || "—"}</span><span className="mt-1 block truncate text-[9px] font-black text-slate-300">{x.home} · {x.away}</span></button>)}</div>}
    </div>

    {activeDemo && <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-3 text-[9px] text-amber-100">Demo QA فقط با ?demo=1 فعال می‌شود و برای تست کارت، گل، نیمه‌وقت، پایان و Reduced Motion است؛ داده واقعی را تغییر نمی‌دهد.</div>}
    {error && <div className="rounded-2xl border border-red-400/15 bg-red-400/5 p-3 text-[9px] text-red-200">{error}</div>}

    {hasRenderableMatch && <>
    <div className="rounded-3xl border border-white/10 bg-white/[.025] p-3.5">    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/15 p-3 text-[9px]">
      <div><span className="block text-slate-600">لیگ</span><b className="mt-0.5 block truncate text-slate-300">{match?.league?.name || match?.league || "—"}</b></div>
      <div><span className="block text-slate-600">وضعیت</span><b className="mt-0.5 block text-slate-300">{phase === "live" ? "زنده" : phase === "finished" ? "پایان" : phase === "halftime" ? "نیمه‌وقت" : phase === "stale" ? "STALE" : "برنامه‌ریزی‌شده"}</b></div>
      <div><span className="block text-slate-600">زمان</span><b className="mt-0.5 block truncate text-slate-300">{match?.fixture?.date ? new Date(match.fixture.date).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }) : "—"}</b></div>
      <div><span className="block text-slate-600">ورزشگاه</span><b className="mt-0.5 block truncate text-slate-300">{match?.fixture?.venue?.name || "—"}</b></div>
      <div><span className="block text-slate-600">شهر</span><b className="mt-0.5 block truncate text-slate-300">{match?.fixture?.venue?.city || "—"}</b></div>
      <div><span className="block text-slate-600">داور</span><b className="mt-0.5 block truncate text-slate-300">{match?.fixture?.referee || "—"}</b></div>
    </div>


      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-black/20 p-3 text-center">
        <div className="min-w-0"><b className="block truncate text-sm text-blue-200">{homeTeamName}</b><strong className="mt-1 block text-2xl text-white tabular-nums">{scoreHome}</strong></div>
        <div className="min-w-[90px]"><span className="text-xs font-black text-slate-500">{event?.minuteLabel || (match?.fixture?.status?.elapsed != null ? `${match.fixture.status.elapsed}'` : "—")}</span><span className="mx-1 text-slate-700">·</span><span className="text-[8px] text-slate-500">{event?.label || "داده رویدادی"}</span></div>
        <div className="min-w-0"><b className="block truncate text-sm text-red-200">{awayTeamName}</b><strong className="mt-1 block text-2xl text-white tabular-nums">{scoreAway}</strong></div>
      </div>
    </div>

    <RetroPitch events={sequence} selectedEvent={event} match={match || DEMO.details} reduced={reduced}/>
    {!activeDemo && event?.canonicalEvent && event.canonicalEvent.coordinates.has_location === false && <div className="rounded-2xl border border-slate-400/10 bg-slate-400/[.03] px-3 py-2 text-[8px] text-slate-500">این رویداد مکان معتبر ندارد؛ Timeline و Scoreboard فعال‌اند اما روی Pitch نقطه‌ای برای آن ساخته نمی‌شود.</div>}

    {event?.type === "card" && <div className={`rounded-2xl border px-3 py-2 text-[9px] ${event.red ? "border-red-400/20 bg-red-400/5 text-red-200" : "border-amber-400/20 bg-amber-400/5 text-amber-200"}`}>{event.red ? "🟥" : "🟨"} {event.label}</div>}
    {event?.type === "goal" && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[9px] font-black text-emerald-200">⚽ {event.label} · نتیجه معتبر: {scoreHome} - {scoreAway}</div>}
    {event?.type === "halftime" && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] font-black text-amber-200">⏸️ پایان نیمه اول</div>}
    {event?.type === "finished" && <div className="rounded-2xl border border-slate-400/15 bg-slate-400/5 px-3 py-2 text-[9px] font-black text-slate-200">🏁 پایان مسابقه · نتیجه: {scoreHome} - {scoreAway}</div>}
    {!activeDemo && !(lineups?.some((x) => Array.isArray(x?.startXI) && x.startXI.length)) && <div className="rounded-2xl border border-slate-400/10 bg-slate-400/[.03] px-3 py-2 text-[8px] text-slate-500">ترکیب رسمی هنوز از منبع بازی دریافت نشده؛ بازیکنان روی زمین فقط نشانگرهای تاکتیکی هستند و نام واقعی ادعا نمی‌شود.</div>}
    {stale && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[9px] text-amber-200">داده تازه دریافت نشد؛ نمایش متحرک متوقف شد تا از نمایش وضعیت جعلی جلوگیری شود.</div>}

    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between gap-2"><div><div className="flex items-center gap-2"><Zap size={14} className="text-cyan-300"/><span className="text-[10px] font-black">Timeline واقعی رویدادها</span></div><span className="mt-0.5 block text-[7px] text-slate-600">{activeDemo ? "Fixture QA Demo" : "فید خواندنی مسابقه"}</span></div><div className="flex items-center gap-2"><span className="text-[8px] text-slate-600">{sequence.length} رویداد</span>{!activeDemo && <button type="button" onClick={() => { setFollowLatest(true); setIndex(Math.max(sequence.length - 1, 0)); }} className={`rounded-lg border px-2 py-1 text-[7px] font-black touch-manipulation ${followLatest ? "border-emerald-400/15 bg-emerald-400/5 text-emerald-200" : "border-white/8 bg-white/[.02] text-slate-400"}`}>آخرین رویداد</button>}</div></div>
      <div className="max-h-[360px] space-y-1.5 overflow-y-auto">
        {sequence.map((e, i) => <button key={e.key} type="button" onClick={() => { setIndex(i); setFollowLatest(false); }} className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-right touch-manipulation ${i === index ? "border-cyan-400/15 bg-cyan-400/[.05]" : "border-white/5 bg-white/[.02]"}`}><span className="text-[12px]">{e.icon}</span><span className="min-w-0 flex-1 text-right"><span className="block truncate text-[9px] font-bold text-slate-300">{e.label}</span>{(e.player || e.assist) && <span className="block truncate text-[7px] text-slate-600">{e.player || ""}{e.assist ? ` · پاس: ${e.assist}` : ""}</span>}</span><span className="text-[8px] font-black text-slate-500">{e.minuteLabel}</span></button>)}
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => setRunning((v) => !v)} className="glass min-h-[44px] rounded-xl px-3 py-2 text-[10px] font-black touch-manipulation">{running ? <><Pause size={13} className="mr-1 inline"/>توقف</> : <><Play size={13} className="mr-1 inline"/>ادامه</>}</button>
      <button type="button" onClick={() => { setIndex(activeDemo ? 0 : Math.max(sequence.length - 1, 0)); setTick(0); setRunning(true); setStale(false); setFollowLatest(true); }} className="glass min-h-[44px] rounded-xl px-3 py-2 text-[10px] font-black touch-manipulation"><RotateCcw size={13} className="mr-1 inline"/>ریست</button>
      <button type="button" onClick={() => { setStale(true); setRunning(false); }} className="min-h-[44px] rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[10px] font-black text-amber-200 touch-manipulation">تست STALE</button>
      {activeDemo && <button type="button" onClick={() => setIndex(sequence.length - 1)} className="min-h-[44px] rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-[10px] font-black text-red-200 touch-manipulation">برو پایان</button>}
    </div>
    </>}
  </section>;
}

export default function MatchVisualizationPage() {
  return <main className="fot-shell"><div className="fot-container space-y-4 pb-28"><header className="flex items-center gap-3"><Link href="/matches" aria-label="بازگشت" className="glass grid h-11 w-11 shrink-0 place-items-center rounded-xl touch-manipulation"><ArrowRight size={18}/></Link><div className="min-w-0"><h1 className="truncate text-xl font-black text-slate-100">نمایش آتاری‌مانند مسابقه</h1><p className="text-[10px] text-slate-500">FOT10 · Match Visualization V1 · Mobile · ۱۰ لیگ</p></div></header><Suspense fallback={<section className="glass rounded-3xl p-6 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-cyan-400/20"/><p className="text-xs font-bold text-slate-400">در حال آماده‌سازی Match Vision…</p></section>}><Visualization/></Suspense></div></main>;
}
