import Link from "next/link";
import { teamLogoUrl, teamName } from "../lib/team-identity";

function value(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
function diff(v) { const n = value(v); return n > 0 ? `+${n}` : String(n); }
function rankClass(rank) {
  if (rank === 1) return "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20";
  if (rank === 2) return "bg-slate-300 text-slate-950";
  if (rank === 3) return "bg-orange-300 text-slate-950";
  return "bg-white/[.06] text-slate-300";
}

export default function LeagueStandingsTable({ rows = [], mode = "full", teamLogo }) {
  const full = mode === "full";
  const grid = full
    ? "grid-cols-[2.2rem_minmax(150px,1fr)_3.5rem_3.5rem_3.5rem_3.5rem_4rem_4rem_4rem_4rem] min-w-[760px]"
    : "grid-cols-[2.2rem_minmax(150px,1fr)_3.5rem_3.5rem_4rem_4rem] min-w-[510px]";

  return <div className="overflow-x-auto rounded-2xl border border-white/10">
    <div className={`text-[9px] sm:text-[10px] ${grid}`}>
      <div className="contents text-slate-500 bg-white/[.04] sticky top-0 z-10 font-bold">
        <span className="p-3 text-center">#</span><span className="p-3 text-right">تیم</span><span className="p-3 text-center">بازی</span><span className="p-3 text-center">برد</span>{full && <><span className="p-3 text-center">مساوی</span><span className="p-3 text-center">باخت</span><span className="p-3 text-center">گل‌زده</span><span className="p-3 text-center">گل‌خورده</span></>}<span className="p-3 text-center">تفاضل</span><span className="p-3 text-center">امتیاز</span>
      </div>
      {rows.map((r, i) => {
        const rank = value(r.rank) || i + 1;
        const played = value(r.all?.played);
        const win = value(r.all?.win);
        const draw = value(r.all?.draw);
        const lose = value(r.all?.lose ?? r.all?.loss);
        const gf = value(r.all?.goals?.for);
        const ga = value(r.all?.goals?.against);
        const gd = value(r.goalsDiff ?? gf - ga);
        const points = value(r.points);
        const name = r?.team?.name || "—";
        const href = r?.team?.id && !String(r.team.id).startsWith("iran-") ? `/teams/${r.team.id}` : `/teams?search=${encodeURIComponent(name)}`;
        const logo = r?.team?.logo || teamLogo?.(name) || teamLogoUrl(r?.team?.id);
        const relegation = rows.length >= 3 && rank > rows.length - 3;
        return <div key={`${r?.team?.id || name || i}-${rank}`} className="contents group">
          <div className={`p-2.5 sm:p-3 flex items-center justify-center border-t border-white/5 ${rank <= 3 ? "" : relegation ? "bg-rose-500/[.05]" : ""}`}><span className={`h-7 min-w-7 px-1 rounded-lg grid place-items-center text-[10px] font-black ${rankClass(rank)}`}>{rank}</span></div>
          <Link href={href} className={`p-2.5 sm:p-3 flex items-center gap-2 min-w-0 border-t border-white/5 hover:bg-white/[.04] ${rank <= 4 ? "bg-cyan-400/[.025]" : relegation ? "bg-rose-500/[.05]" : ""}`}>
            <span className="h-8 w-8 rounded-lg bg-white/[.06] grid place-items-center overflow-hidden shrink-0">{logo ? <img src={logo} alt="" className="h-7 w-7 object-contain"/> : "⚽"}</span>
            <span className="font-bold truncate">{teamName(name)}</span>
          </Link>
          {[played, win, ...(full ? [draw, lose, gf, ga] : []), diff(gd), points].map((x, j) => <span key={j} className={`p-2.5 sm:p-3 flex items-center justify-center border-t border-white/5 font-semibold ${j === (full ? 6 : 3) ? "text-cyan-200" : "text-slate-300"}`}>{x}</span>)}
        </div>;
      })}
    </div>
  </div>;
}
