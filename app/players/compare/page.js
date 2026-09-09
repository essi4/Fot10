"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, BarChart3, Check, Goal, Search, Shield, Swords, Trophy } from "lucide-react";

const metrics = [
  ["امتیاز FOT10", "power", "score"],
  ["ریتینگ", "rating", "rating"],
  ["بازی", "appearances", "appearances"],
  ["دقیقه", "minutes", "minutes"],
  ["گل", "goals", "goals"],
  ["پاس گل", "assists", "assists"],
  ["گل در ۹۰", "goals90", "goals90"],
  ["پاس گل در ۹۰", "assists90", "assists90"],
  ["شوت", "shots", "shots"],
  ["شوت در چارچوب", "shotsOn", "shotsOn"],
  ["پاس کلیدی", "keyPasses", "keyPasses"],
  ["دقت پاس", "passAccuracy", "passAccuracy"],
  ["تکل موفق", "tacklesWon", "tacklesWon"],
  ["دریبل موفق", "dribblesWon", "dribblesWon"],
  ["دوئل موفق", "duelsWon", "duelsWon"],
  ["کارت زرد", "yellow", "yellow"],
];

function num(value) { return Number(value || 0); }
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
  const score = Math.min(100, Math.round((rating / 10) * 45 + Math.min(goals90 / 1.2, 1) * 20 + Math.min(assists90 / 0.7, 1) * 12 + Math.min(stat(item, "passes", "key") / 5, 1) * 8 + Math.min(stat(item, "shots", "on") / 4, 1) * 5 + Math.min(stat(item, "duels", "won") / 10, 1) * 5 + Math.min(stat(item, "tackles", "won") / 5, 1) * 5));
  return {
    id: p.id, name: p.name || "بازیکن", photo: p.photo, nationality: p.nationality || "—", age: p.age,
    position: g.position || "—", team: item?.statistics?.[0]?.team?.name || "—", score, rating,
    appearances, minutes, goals, assists, goals90, assists90,
    shots: stat(item, "shots", "total"), shotsOn: stat(item, "shots", "on"),
    keyPasses: stat(item, "passes", "key"), passAccuracy: stat(item, "passes", "accuracy"),
    tacklesWon: stat(item, "tackles", "won"), dribblesWon: stat(item, "dribbles", "success"),
    duelsWon: stat(item, "duels", "won"), yellow: stat(item, "cards", "yellow"),
  };
}

function fmt(key, value) {
  if (["goals90", "assists90"].includes(key)) return value.toFixed(2);
  if (key === "rating") return value ? value.toFixed(2) : "—";
  if (key === "passAccuracy") return value ? `${Math.round(value)}%` : "—";
  return value;
}

function SearchBox({ label, value, onChange, onPick }) {
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!value || value.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/football/players?search=${encodeURIComponent(value.trim())}&page=1`, { cache: "no-store" });
        const json = await res.json();
        setResults(json.ok ? (json.players || []).slice(0, 6) : []);
      } catch { setResults([]); } finally { setBusy(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [value]);
  return <div className="relative">
    <label className="mb-2 block text-xs font-bold text-slate-400">{label}</label>
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
      <Search size={17} className="shrink-0 text-slate-500" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="نام بازیکن را بنویسید…" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
      {busy && <span className="text-[10px] text-slate-500">جستجو…</span>}
    </div>
    {results.length > 0 && <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
      {results.map((item) => <button key={item.player?.id} onClick={() => onPick(buildPlayer(item))} className="flex w-full items-center gap-3 border-b border-white/5 p-3 text-right hover:bg-white/5">
        <div className="h-10 w-10 overflow-hidden rounded-xl bg-white/5">{item.player?.photo && <img src={item.player.photo} alt="" className="h-full w-full object-cover" />}</div>
        <span className="min-w-0 flex-1"><b className="block truncate text-sm">{item.player?.name}</b><small className="text-slate-500">{item.statistics?.[0]?.team?.name || "تیم نامشخص"}</small></span>
        <ArrowLeftRight size={15} className="text-slate-600" />
      </button>)}
    </div>}
  </div>;
}

export default function PlayerComparePage() {
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a"); const b = params.get("b");
    if (!a || !b) { setLoading(false); return; }
    Promise.all([fetch(`/api/football/players?id=${encodeURIComponent(a)}`, { cache: "no-store" }), fetch(`/api/football/players?id=${encodeURIComponent(b)}`, { cache: "no-store" })])
      .then(async ([ra, rb]) => [await ra.json(), await rb.json()])
      .then(([pa, pb]) => { if (!pa.ok || !pb.ok) throw new Error("اطلاعات یکی از بازیکنان در دسترس نیست."); setLeft(buildPlayer(pa.players[0])); setRight(buildPlayer(pb.players[0])); setLeftSearch(pa.players[0]?.player?.name || ""); setRightSearch(pb.players[0]?.player?.name || ""); })
      .catch((e) => setError(e.message || "خطا در مقایسه بازیکنان"))
      .finally(() => setLoading(false));
  }, []);

  const comparison = useMemo(() => metrics.map(([label, key]) => ({ label, key, a: left?.[key] ?? 0, b: right?.[key] ?? 0, tie: left?.[key] === right?.[key] })), [left, right]);
  const updateUrl = (a, b) => { if (a?.id && b?.id) window.history.replaceState({}, "", `/players/compare?a=${a.id}&b=${b.id}`); };
  const pickLeft = (p) => { setLeft(p); setLeftSearch(p.name); updateUrl(p, right); };
  const pickRight = (p) => { setRight(p); setRightSearch(p.name); updateUrl(left, p); };

  return <main className="mobile-shell min-h-screen pb-12">
    <header className="px-5 pb-5 pt-6"><Link href="/players" className="mb-5 inline-flex items-center gap-2 text-xs text-sky-400">بازگشت به بازیکنان</Link><div className="glass rounded-3xl p-5"><div className="flex items-center gap-3"><div className="rounded-2xl bg-sky-400/10 p-3"><Swords className="text-sky-400" size={22}/></div><div><p className="text-xs font-bold text-sky-400">FOT10 • PLAYER VS PLAYER</p><h1 className="mt-1 text-2xl font-black">مقایسه دو بازیکن</h1></div></div><p className="mt-3 text-xs leading-6 text-slate-500">دو بازیکن را انتخاب کن؛ آمار کلیدی، عملکرد هجومی و دفاعی و امتیاز اختصاصی FOT10 را کنار هم ببین.</p></div></header>
    <section className="space-y-4 px-5">
      <div className="grid gap-3 md:grid-cols-2"><div className="glass rounded-3xl p-4"><SearchBox label="بازیکن اول" value={leftSearch} onChange={setLeftSearch} onPick={pickLeft}/></div><div className="glass rounded-3xl p-4"><SearchBox label="بازیکن دوم" value={rightSearch} onChange={setRightSearch} onPick={pickRight}/></div></div>
      {loading && <div className="glass rounded-3xl p-7 text-center text-sm text-slate-500">در حال آماده‌سازی مقایسه…</div>}
      {error && <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}
      {left && right && <>
        <div className="grid grid-cols-2 gap-3">
          {[left, right].map((p, index) => <div key={p.id} className="glass rounded-3xl p-4 text-center"><div className="mx-auto h-20 w-20 overflow-hidden rounded-3xl bg-white/5">{p.photo && <img src={p.photo} alt={p.name} className="h-full w-full object-cover"/>}</div><h2 className="mt-3 truncate text-base font-black">{p.name}</h2><p className="mt-1 text-[11px] text-slate-500">{p.team} • {p.position}</p><div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-300"><Trophy size={13}/> {p.score} FOT10</div>{index === 0 && p.score >= right.score && <span className="mt-2 block text-[10px] text-emerald-400">پیشتاز مقایسه</span>}{index === 1 && p.score >= left.score && <span className="mt-2 block text-[10px] text-emerald-400">پیشتاز مقایسه</span>}</div>)}
        </div>
        <div className="glass overflow-hidden rounded-3xl"><div className="border-b border-white/10 p-4"><h2 className="flex items-center gap-2 font-black"><BarChart3 size={18} className="text-sky-400"/> مقایسه آماری</h2></div><div className="divide-y divide-white/5">{comparison.map((row) => { const a = num(row.a); const b = num(row.b); const aWins = a > b; const bWins = b > a; return <div key={row.key} className="grid grid-cols-[1fr_100px_1fr] items-center gap-2 p-3 text-center"><div className={aWins ? "font-black text-emerald-400" : "text-slate-300"}>{fmt(row.key, a)} {aWins && <Check size={13} className="inline"/>}</div><div className="text-[10px] font-bold text-slate-500">{row.label}</div><div className={bWins ? "font-black text-emerald-400" : "text-slate-300"}>{bWins && <Check size={13} className="inline"/>} {fmt(row.key, b)}</div></div>; })}</div></div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="glass rounded-3xl p-4"><Goal className="mb-2 text-emerald-400" size={18}/><p className="text-xs text-slate-500">نبرد هجومی</p><b className="text-sm">{left.goals + left.assists > right.goals + right.assists ? left.name : right.name}</b></div><div className="glass rounded-3xl p-4"><Shield className="mb-2 text-sky-400" size={18}/><p className="text-xs text-slate-500">نبرد دفاعی</p><b className="text-sm">{left.tacklesWon + left.duelsWon > right.tacklesWon + right.duelsWon ? left.name : right.name}</b></div><div className="glass rounded-3xl p-4"><Trophy className="mb-2 text-amber-400" size={18}/><p className="text-xs text-slate-500">امتیاز نهایی FOT10</p><b className="text-sm">{left.score >= right.score ? left.name : right.name}</b></div></div>
        <div className="rounded-3xl border border-sky-400/10 bg-sky-400/5 p-4 text-xs leading-6 text-slate-400">امتیاز FOT10 یک شاخص داخلی برای مقایسه است و رتبه‌بندی رسمی لیگ یا فدراسیون محسوب نمی‌شود. در معیارهایی مثل کارت زرد، عدد کمتر بهتر است.</div>
      </>}
      {!loading && !left && !right && <div className="glass rounded-3xl p-8 text-center"><ArrowLeftRight className="mx-auto mb-3 text-sky-400" size={28}/><p className="font-bold">دو بازیکن را انتخاب کن</p><p className="mt-2 text-xs text-slate-500">برای شروع، حداقل دو حرف از نام هر بازیکن را وارد کن.</p></div>}
    </section>
  </main>;
}
