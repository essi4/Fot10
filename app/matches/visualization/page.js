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

const { buildVisualizationFeed } = visualizationNormalizer;
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

const EVENT_ICONS = { goal: "⚽", shot: "◉", yellow_card: "▮", red_card: "▮", substitution: "↔", var: "V", penalty: "P", missed_penalty: "×", corner: "⌜" };

function eventTeamSide(canonical, match) {
  const home = String(match?.teams?.home?.id ?? match?.teams?.home?.name ?? "");
  const away = String(match?.teams?.away?.id ?? match?.teams?.away?.name ?? "");
  const team = String(canonical?.acting_team ?? "");
  if (team && team === home) return "home";
  if (team && team === away) return "away";
  return "";
}

function eventLabel(event) {
  return event?.label || ({ goal: "گل", yellow_card: "کارت زرد", red_card: "کارت قرمز", substitution: "تعویض", var: "VAR", penalty: "پنالتی", missed_penalty: "پنالتی از دست رفته", corner: "کرنر", shot: "شوت" }[event?.canonicalEvent?.event_type] || "رویداد");
}

function RetroPitch({ events, selectedEvent, match, reduced }) {
  const canonicalEvents = events.map((e) => e?.canonicalEvent).filter(Boolean);
  const located = selectRenderablePitchEvents(canonicalEvents);
  const selectedCanonical = selectedEvent?.canonicalEvent;
  const selectedLocated = located.find((e) => e.event_id === selectedCanonical?.event_id);
  const homeName = match?.teams?.home?.name || "میزبان";
  const awayName = match?.teams?.away?.name || "مهمان";
  return <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#07130f] p-2 shadow-[0_25px_80px_rgba(0,0,0,.38)]">
    <div className="mb-2 flex items-center justify-between gap-2 px-1 text-[8px] font-black">
      <span className="flex items-center gap-1.5 text-blue-200"><span className="h-2 w-2 rounded-full bg-blue-400"/>{homeName}</span>
      <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-slate-500">MODERN RETRO · LOCATION SAFE</span>
      <span className="flex items-center gap-1.5 text-red-200">{awayName}<span className="h-2 w-2 rounded-full bg-red-400"/></span>
    </div>
    <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] border border-white/15 bg-[#0b693e]">
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",backgroundSize:"24px 24px"}}/>
      <div className="absolute inset-[3.5%] rounded-xl border-2 border-[#f5f1dc]/80"/>
      <div className="absolute left-1/2 top-[3.5%] h-[93%] border-l border-[#f5f1dc]/75"/>
      <div className="absolute left-1/2 top-1/2 h-[29%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f5f1dc]/75"/>
      <div className="absolute left-[3.5%] top-[25%] h-[50%] w-[17%] border-2 border-l-0 border-[#f5f1dc]/75"/>
      <div className="absolute right-[3.5%] top-[25%] h-[50%] w-[17%] border-2 border-r-0 border-[#f5f1dc]/75"/>
      <div className="absolute left-[3.5%] top-[38%] h-[24%] w-[5%] border border-[#f5f1dc]/70"/>
      <div className="absolute right-[3.5%] top-[38%] h-[24%] w-[5%] border border-[#f5f1dc]/70"/>
      {located.map((p) => {
        const side = eventTeamSide(p, match);
        const active = p.event_id === selectedCanonical?.event_id;
        return <div key={p.event_id} className={`absolute -translate-x-1/2 -translate-y-1/2 ${reduced ? "" : "transition-transform duration-300"} ${active ? "z-20 scale-125" : "z-10"}`} style={{left:`${p.coordinates.x}%`,top:`${p.coordinates.y}%`}} title={`${p.game_clock || "—"} · ${p.event_type}`}>
          <div className={`grid h-8 w-8 place-items-center rounded-full border-2 shadow-lg ${side === "home" ? "border-blue-300 bg-blue-500/90" : side === "away" ? "border-red-300 bg-red-500/90" : "border-[#f5f1dc] bg-slate-800/90"} ${active ? "ring-4 ring-white/25" : ""}`}>
            <span className="font-black text-white">{EVENT_ICONS[p.event_type] || "•"}</span>
          </div>
          {active && <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/70 px-1.5 py-1 text-[7px] font-black text-white">{p.game_clock || "—"}</span>}
        </div>;
      })}
      {selectedLocated && <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{left:`${selectedLocated.coordinates.x}%`,top:`${selectedLocated.coordinates.y}%`}}><div className="h-12 w-12 animate-ping rounded-full border border-white/30"/></div>}
      {!located.length && <div className="absolute inset-0 grid place-items-center"><div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-center backdrop-blur"><Crosshair className="mx-auto mb-1 text-slate-400" size={18}/><b className="block text-[9px] text-slate-200">داده مکانی در فید موجود نیست</b><span className="mt-1 block text-[7px] text-slate-500">هیچ نقطه‌ای حدس زده نمی‌شود</span></div></div>}
      <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[7px] font-black text-white backdrop-blur">PITCH · {located.length} موقعیت معتبر</div>
    </div>
  </div>;
}
  const pitchEvents = useMemo(() => sequence.filter((e) => e?.canonicalEvent), [sequence]);    <RetroPitch events={pitchEvents} selectedEvent={event} match={match || DEMO.details} reduced={reduced}/>    {!activeDemo && event?.canonicalEvent && event.canonicalEvent.coordinates.has_location === false && <div className="rounded-2xl border border-slate-400/10 bg-slate-400/[.03] px-3 py-2 text-[8px] text-slate-500">این رویداد مکان معتبر ندارد؛ Timeline و Scoreboard فعال‌اند اما روی Pitch نقطه‌ای برای آن ساخته نمی‌شود.</div>}
