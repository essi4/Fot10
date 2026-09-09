"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, BarChart3, Check, Goal, Search, Shield, Swords, Trophy, Zap } from "lucide-react";

const metrics = [
  ["امتیاز FOT10", "score"], ["ریتینگ", "rating"], ["بازی", "appearances"], ["دقیقه", "minutes"], ["گل", "goals"], ["پاس گل", "assists"],
  ["گل در ۹۰", "goals90"], ["پاس گل در ۹۰", "assists90"], ["شوت", "shots"], ["شوت در چارچوب", "shotsOn"], ["پاس کلیدی", "keyPasses"], ["دقت پاس", "passAccuracy"],
  ["تکل موفق", "tacklesWon"], ["دریبل موفق", "dribblesWon"], ["دوئل موفق", "duelsWon"], ["کارت زرد", "yellow"],
];

const radarAxes = [
  ["قدرت", "power"], ["هجومی", "attack"], ["خلق موقعیت", "creation"], ["شوت", "shooting"], ["پاس", "passing"], ["دفاع", "defense"],
];

function num(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function stat(item, group, field) { return num(item?.statistics?.[0]?.[group]?.[field]); }

function buildPlayer(item) {
  const p = item?.player || {};
  const g = item?.statistics?.[0]?.games || {};
  const goals = stat(item, "goals", "total");
  const assists = stat(item, "goals", "assists");
  const minutes = stat(item, "games", "minutes");
  const appearances = stat(item, "games", "appearances");
  const goals90 = minutes ? goals / (minutes / 90) : 0;
  const assists90 = minutes ? assists / (minutes / 90) : 0;
  const rating = num(g.rating);
  const keyPasses = stat(item, "passes", "key");
  const shotsOn = stat(item, "shots", "on");
  const tacklesWon = stat(item, "tackles", "won");
  const duelsWon = stat(item, "duels", "won");
  const score = Math.min(100, Math.round((rating / 10) * 45 + Math.min(goals90 / 1.2, 1) * 20 + Math.min(assists90 / 0.7, 1) * 12 + Math.min(keyPasses / 5, 1) * 8 + Math.min(shotsOn / 4, 1) * 5 + Math.min(duelsWon / 10, 1) * 5 + Math.min(tacklesWon / 5, 1) * 5));
  return {
    id: p.id, name: p.name || "بازیکن", photo: p.photo, nationality: p.nationality || "—", age: p.age,
    position: g.position || "—", team: item?.statistics?.[0]?.team?.name || "—", score, rating,
    appearances, minutes, goals, assists, goals90, assists90,
    shots: stat(item, "shots", "total"), shotsOn, keyPasses, passAccuracy: stat(item, "passes", "accuracy"),
    tacklesWon, dribblesWon: stat(item, "dribbles", "success"), duelsWon, yellow: stat(item, "cards", "yellow"),
  };
}

function radarData(p) {
  if (!p) return {};
  return {
    power: p.score,
    attack: Math.min(100, Math.round(Math.min(p.goals90 / 1.2, 1) * 60 + Math.min(p.shotsOn / 4, 1) * 25 + Math.min(p.assists90 / 0.7, 1) * 15)),
    creation: Math.min(100, Math.round(Math.min(p.assists90 / 0.7, 1) * 55 + Math.min(p.keyPasses / 5, 1) * 45)),
    shooting: Math.min(100, Math.round(Math.min(p.shotsOn / 4, 1) * 65 + Math.min(p.goals90 / 1.2, 1) * 35)),
    passing: Math.min(100, Math.round(num(p.passAccuracy))),
    defense: Math.min(100, Math.round(Math.min(p.tacklesWon / 5, 1) * 55 + Math.min(p.duelsWon / 10, 1) * 45)),
  };
}

function fmt(key, value) {
  if (["goals90", "assists90"].includes(key)) return value.toFixed(2);
  if (key === "rating") return value ? value.toFixed(2) : "—";
  if (key === "passAccuracy") return value ? `${Math.round(value)}%` : "—";
  return value;
}

function pointFor(index, value, size, center) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / radarAxes.length);
  const radius = (size / 2 - 18) * (Math.max(0, Math.min(100, value)) / 100);
  return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
}

function polygonPoints(values, size) {
  const center = size / 2;
  return values.map((value, index) => pointFor(index, value, size, center).join(",")).join(" ");
}

function RadarChart({ left, right }) {
  const size = 330;
  const center = size / 2;
  const radius = size / 2 - 18;
  const a = radarAxes.map(([, key]) => radarData(left)[key] || 0);
  const b = radarAxes.map(([, key]) => radarData(right)[key] || 0);
  const rings = [25, 50, 75, 100];
  return <div className="relative mx-auto w-full max-w-[370px] rounded-3xl border border-white/10 bg-slate-950/50 p-3 sm:p-5">
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label={`نمودار راداری مقایسه ${left.name} و ${right.name}`}>
      {rings.map((level) => <polygon key={level} points={polygonPoints(radarAxes.map(() => level), size)} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1" />)}
      {radarAxes.map(([label], index) => { const [x, y] = pointFor(index, 100, size, center); const lx = center + (x - center) * 1.13; const ly = center + (y - center) * 1.13; return <g key={label}><line x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,.10)" /><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="10">{label}</text></g>; })}
      <polygon points={polygonPoints(a, size)} fill="rgba(56,189,248,.20)" stroke="#38bdf8" strokeWidth="2.5" />
      <polygon points={polygonPoints(b, size)} fill="rgba(251,191,36,.16)" stroke="#fbbf24" strokeWidth="2.5" />
      {a.map((value, index) => { const [x, y] = pointFor(index, value, size, center); return <circle key={`a-${index}`} cx={x} cy={y} r="3.5" fill="#38bdf8" />; })}
      {b.map((value, index) => { const [x, y] = pointFor(index, value, size, center); return <circle key={`b-${index}`} cx={x} cy={y} r="3.5" fill="#fbbf24" />; })}
    </svg>
    <div className="mt-1 flex items-center justify-center gap-5 text-[10px] font-bold"><span className="flex items-center gap-1.5 text-sky-300"><i className="h-2.5 w-2.5 rounded-full bg-sky-400" />{left.name}</span><span className="flex items-center gap-1.5 text-amber-300"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />{right.name}</span></div>
  </div>;
}

function SearchBox({ label, value, onChange, onPick }) {
  const [results, setResults] = useState([]); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!value || value.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => { setBusy(true); try { const res = await fetch(`/api/football/players?search=${encodeURIComponent(value.trim())}&page=1`, { cache: "no-store" }); const json = await res.json(); setResults(json.ok ? (json.players || []).slice(0, 6) : []); } catch { setResults([]); } finally { setBusy(false); } }, 350);
    return () => clearTimeout(timer);
  }, [value]);
  return <div className="relative"><label className="mb-2 block text-xs font-bold text-slate-400">{label}</label><div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3"><Search size={17} className="shrink-0 text-slate-500"/><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="نام بازیکن را بنویسید…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/>{busy && <span className="text-[10px] text-slate-500">جستجو…</span>}</div>{results.length > 0 && <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">{results.map((item) => <button key={item.player?.id} onClick={() => onPick(buildPlayer(item))} className="flex w-full items-center gap-3 border-b border-white/5 p-3 text-right hover:bg-white/5"><div className="h-10 w-10 overflow-hidden rounded-xl bg-white/5">{item.player?.photo && <img src={item.player.photo} alt="" className="h-full w-full object-cover"/>}</div><span className="min-w-0 flex-1"><b className="block truncate text-sm">{item.player?.name}</b><small className="text-slate-500">{item.statistics?.[0]?.team?.name || "تیم نامشخص"}</small></span><ArrowLeftRight size={15} className="text-slate-600"/></button>)}</div>}</div>;
}

export default function PlayerComparePage() {
  const [left, setLeft] = useState(null); const [right, setRight] = useState(null); const [leftSearch, setLeftSearch] = useState(""); const [rightSearch, setRightSearch] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const params = new URLSearchParams(window.location.search); const a = params.get("a"); const b = params.get("b"); if (!a || !b) { setLoading(false); return; } Promise.all([fetch(`/api/football/players?id=${encodeURIComponent(a)}`, { cache: "no-store" }), fetch(`/api/football/players?id=${encodeURIComponent(b)}`, { cache: "no-store" })]).then(async ([ra, rb]) => [await ra.json(), await rb.json()]).then(([pa, pb]) => { if (!pa.ok || !pb.ok) throw new Error("اطلاعات یکی از بازیکنان در دسترس نیست."); setLeft(buildPlayer(pa.players[0])); setRight(buildPlayer(pb.players[0])); setLeftSearch(pa.players[0]?.player?.name || ""); setRightSearch(pb.players[0]?.player?.name || ""); }).catch((e) => setError(e.message || "خطا در مقایسه بازیکنان")).finally(() => setLoading(false)); }, []);
  const comparison = useMemo(() => metrics.map(([label, key]) => ({ label, key, a: left?.[key] ?? 0, b: right?.[key] ?? 0 })), [left, right]);
  const updateUrl = (a, b) => { if (a?.id && b?.id) window.history.replaceState({}, "", `/players/compare?a=${a.id}&b=${b.id}`); };
  const pickLeft = (p) => { setLeft(p); setLeftSearch(p.name); updateUrl(p, right); }; const pickRight = (p) => { setRight(p); setRightSearch(p.name); updateUrl(left, p); };
  const radarLeft = left ? radarData(left) : null; const radarRight = right ? radarData(right) : null;

  return <main className="mobile-shell min-h-screen pb-12">
    <header className="px-5 pb-5 pt-6"><Link href="/players" className="mb-5 inline-flex items-center gap-2 text-xs text-sky-400">بازگشت به بازیکنان</Link><div className="glass rounded-3xl p-5"><div className="flex items-center gap-3"><div className="rounded-2xl bg-sky-400/10 p-3"><Swords className="text-sky-400" size={22}/></div><div><p className="text-xs font-bold text-sky-400">FOT10 • PLAYER VS PLAYER</p><h1 className="mt-1 text-2xl font-black">مقایسه حرفه‌ای دو بازیکن</h1></div></div><p className="mt-3 text-xs leading-6 text-slate-500">نمودار راداری، شاخص قدرت و آمار جزئی را همزمان ببین و تفاوت سبک بازی دو بازیکن را سریع تشخیص بده.</p></div></header>
    <section className="space-y-4 px-5">
      <div className="grid gap-3 md:grid-cols-2"><div className="glass rounded-3xl p-4"><SearchBox label="بازیکن اول" value={leftSearch} onChange={setLeftSearch} onPick={pickLeft}/></div><div className="glass rounded-3xl p-4"><SearchBox label="بازیکن دوم" value={rightSearch} onChange={setRightSearch} onPick={pickRight}/></div></div>
      {loading && <div className="glass rounded-3xl p-7 text-center text-sm text-slate-500">در حال آماده‌سازی مقایسه…</div>}
      {error && <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}
      {left && right && <>
        <div className="grid grid-cols-2 gap-3">{[left, right].map((p, index) => <div key={p.id} className="glass rounded-3xl p-4 text-center"><div className="mx-auto h-20 w-20 overflow-hidden rounded-3xl bg-white/5">{p.photo && <img src={p.photo} alt={p.name} className="h-full w-full object-cover"/>}</div><h2 className="mt-3 truncate text-base font-black">{p.name}</h2><p className="mt-1 text-[11px] text-slate-500">{p.team} • {p.position}</p><div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-300"><Trophy size={13}/> {p.score} FOT10</div>{((index === 0 && p.score >= right.score) || (index === 1 && p.score >= left.score)) && <span className="mt-2 block text-[10px] text-emerald-400">پیشتاز مقایسه</span>}</div>)}</div>
        <div className="glass rounded-3xl p-4"><div className="mb-4 flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-black"><BarChart3 size={18} className="text-sky-400"/> پروفایل راداری</h2><p className="mt-1 text-[10px] text-slate-500">هر محور از ۰ تا ۱۰۰ نرمال‌سازی شده است.</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-slate-500">FOT10 Analytics</span></div><RadarChart left={left} right={right}/><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{radarAxes.map(([label, key]) => <div key={key} className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between"><b className="text-sky-300">{radarLeft[key]}</b><b className="text-amber-300">{radarRight[key]}</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="flex h-full"><span className="bg-sky-400" style={{width:`${radarLeft[key]}%`}}/><span className="bg-amber-400" style={{width:`${radarRight[key]}%`}}/></div></div></div>)}</div></div>
        <div className="glass overflow-hidden rounded-3xl"><div className="border-b border-white/10 p-4"><h2 className="flex items-center gap-2 font-black"><BarChart3 size={18} className="text-sky-400"/> مقایسه آماری دقیق</h2></div><div className="divide-y divide-white/5">{comparison.map((row) => { const a = num(row.a); const b = num(row.b); const lowerBetter = row.key === "yellow"; const aWins = lowerBetter ? a < b : a > b; const bWins = lowerBetter ? b < a : b > a; return <div key={row.key} className="grid grid-cols-[1fr_100px_1fr] items-center gap-2 p-3 text-center"><div className={aWins ? "font-black text-emerald-400" : "text-slate-300"}>{fmt(row.key, a)} {aWins && <Check size={13} className="inline"/>}</div><div className="text-[10px] font-bold text-slate-500">{row.label}</div><div className={bWins ? "font-black text-emerald-400" : "text-slate-300"}>{bWins && <Check size={13} className="inline"/>} {fmt(row.key, b)}</div></div>; })}</div></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="glass rounded-3xl p-4"><Goal className="mb-2 text-emerald-400" size={18}/><p className="text-xs text-slate-500">نبرد هجومی</p><b className="text-sm">{left.goals + left.assists > right.goals + right.assists ? left.name : right.name}</b></div><div className="glass rounded-3xl p-4"><Shield className="mb-2 text-sky-400" size={18}/><p className="text-xs text-slate-500">نبرد دفاعی</p><b className="text-sm">{left.tacklesWon + left.duelsWon > right.tacklesWon + right.duelsWon ? left.name : right.name}</b></div><div className="glass rounded-3xl p-4"><Trophy className="mb-2 text-amber-400" size={18}/><p className="text-xs text-slate-500">برنده کلی FOT10</p><b className="text-sm">{left.score >= right.score ? left.name : right.name}</b></div></div>
        <div className="rounded-3xl border border-sky-400/10 bg-sky-400/5 p-4 text-xs leading-6 text-slate-400">امتیاز و نمودار FOT10 شاخص داخلی برای مقایسه داده‌های دریافت‌شده هستند و رتبه‌بندی رسمی لیگ یا فدراسیون نیستند. در معیارهایی مثل کارت زرد، عدد کمتر بهتر است.</div>
      </>}
      {!loading && !left && !right && <div className="glass rounded-3xl p-8 text-center"><ArrowLeftRight className="mx-auto mb-3 text-sky-400" size={28}/><p className="font-bold">دو بازیکن را انتخاب کن</p><p className="mt-2 text-xs text-slate-500">برای شروع، حداقل دو حرف از نام هر بازیکن را وارد کن.</p></div>}
    </section>
  </main>;
}
