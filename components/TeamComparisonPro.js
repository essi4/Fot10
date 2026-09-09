"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Shield, Swords, Trophy, Target, TrendingUp } from "lucide-react";

function score(a, b) {
  const x = Number(a || 0);
  const y = Number(b || 0);
  if (x === y) return "draw";
  return x > y ? "home" : "away";
}

function Metric({ label, left, right, icon: Icon }) {
  const winner = score(left, right);
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-500"><Icon size={12} />{label}</div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <b className={winner === "home" ? "text-cyan-300" : "text-slate-300"}>{left ?? "—"}</b>
        <span className="text-[8px] text-slate-600">مقایسه</span>
        <b className={winner === "away" ? "text-cyan-300" : "text-slate-300"}>{right ?? "—"}</b>
      </div>
    </div>
  );
}

export default function TeamComparisonPro({ teams = [] }) {
  const [leftId, setLeftId] = useState(teams[0]?.team?.id ?? "");
  const [rightId, setRightId] = useState(teams[1]?.team?.id ?? "");
  const left = useMemo(() => teams.find((x) => String(x.team?.id) === String(leftId)), [teams, leftId]);
  const right = useMemo(() => teams.find((x) => String(x.team?.id) === String(rightId)), [teams, rightId]);
  if (!teams.length) return null;

  const stat = (row, key) => row?.all?.[key] ?? 0;
  const goalsFor = (row) => row?.all?.goals?.for ?? 0;
  const goalsAgainst = (row) => row?.all?.goals?.against ?? 0;
  const goalDiff = (row) => Number(goalsFor(row)) - Number(goalsAgainst(row));

  return (
    <section className="mx-auto max-w-5xl rounded-2xl border border-cyan-300/10 bg-cyan-400/[.035] p-3 shadow-xl shadow-cyan-950/10 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><ArrowLeftRight size={16} className="text-cyan-300" /><h2 className="text-sm font-black text-white">مقایسه حرفه‌ای تیم‌ها</h2></div>
        <span className="text-[8px] text-slate-500">FOT10 TEAM COMPARISON</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <label className="text-[9px] font-bold text-slate-500">تیم اول<select value={leftId} onChange={(e) => setLeftId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none"><option value="">انتخاب تیم</option>{teams.map((x) => <option key={x.team?.id} value={x.team?.id}>{x.team?.name}</option>)}</select></label>
        <div className="hidden h-10 w-10 place-items-center rounded-full border border-cyan-300/15 bg-cyan-300/[.05] text-[9px] font-black text-cyan-300 sm:grid">VS</div>
        <label className="text-[9px] font-bold text-slate-500">تیم دوم<select value={rightId} onChange={(e) => setRightId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none"><option value="">انتخاب تیم</option>{teams.map((x) => <option key={x.team?.id} value={x.team?.id}>{x.team?.name}</option>)}</select></label>
      </div>
      {left && right && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            {[left, right].map((row) => <div key={row.team?.id} className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="text-sm font-black">{row.team?.name}</div><div className="mt-1 text-[9px] text-cyan-300">{row.points ?? 0} امتیاز</div></div>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="برد" left={stat(left,"win")} right={stat(right,"win")} icon={Trophy}/>
            <Metric label="گل زده" left={goalsFor(left)} right={goalsFor(right)} icon={Swords}/>
            <Metric label="گل خورده" left={goalsAgainst(left)} right={goalsAgainst(right)} icon={Shield}/>
            <Metric label="تفاضل گل" left={goalDiff(left)} right={goalDiff(right)} icon={Target}/>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/15 px-3 py-2 text-[9px] text-slate-500"><TrendingUp size={12}/><span>رتبه:</span><b className="text-slate-300">{left.team?.name} #{left.rank ?? "—"}</b><span>در برابر</span><b className="text-slate-300">{right.team?.name} #{right.rank ?? "—"}</b></div>
        </>
      )}
    </section>
  );
}
