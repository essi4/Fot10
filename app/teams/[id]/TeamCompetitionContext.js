"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Trophy } from "lucide-react";
import { LEAGUE_ENTRIES, CLUB_CUPS } from "../../../lib/fot10-universe";

function flatten(rows) {
  return (rows || []).flatMap((item) => item?.league?.standings?.flat?.() || []).filter(Boolean);
}

export default function TeamCompetitionContext({ teamId, leagueId, season, teamName }) {
  const [state, setState] = useState({ loading: true, rows: [], error: "" });
  const entry = LEAGUE_ENTRIES.find((item) => String(item.leagueId) === String(leagueId));
  const cup = CLUB_CUPS.find((item) => String(item.id) === String(leagueId));
  const slug = entry?.slug || cup?.slug;
  const leagueName = entry?.leagueName || cup?.name || "رقابت تیم";

  useEffect(() => {
    if (!leagueId || !season) return;
    let active = true;
    fetch(`/api/football/standings?league=${encodeURIComponent(leagueId)}&season=${encodeURIComponent(season)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || "جدول در دسترس نیست");
        return payload;
      })
      .then((payload) => { if (active) setState({ loading: false, rows: flatten(payload.data), error: "" }); })
      .catch((error) => { if (active) setState({ loading: false, rows: [], error: error?.message || "جدول در دسترس نیست" }); });
    return () => { active = false; };
  }, [leagueId, season]);

  const teamRow = state.rows.find((row) => String(row?.team?.id) === String(teamId) || String(row?.team?.name || "").trim().toLowerCase() === String(teamName || "").trim().toLowerCase());
  const rank = teamRow?.rank;
  const nearby = teamRow ? state.rows.filter((row) => Math.abs(Number(row.rank) - Number(teamRow.rank)) <= 2).sort((a, b) => a.rank - b.rank) : [];

  return (
    <section className="glass rounded-[26px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black tracking-[.14em] text-cyan-300">COMPETITION CONTEXT</p>
          <h2 className="mt-1 flex items-center gap-2 font-black"><Trophy size={17} className="text-cyan-300" /> جایگاه در رقابت</h2>
          <p className="mt-1 text-[9px] text-slate-500">{leagueName} · فصل {season}</p>
        </div>
        {slug && <Link href={`/leagues/${slug}`} className="shrink-0 rounded-xl bg-cyan-400/10 px-3 py-2 text-[9px] font-black text-cyan-300 transition hover:bg-cyan-400/20">مشاهده رقابت <ArrowLeft size={12} className="inline mr-1" /></Link>}
      </div>

      {state.loading ? <div className="mt-4 rounded-2xl bg-white/[.035] p-4 text-center text-[10px] text-slate-500">در حال همگام‌سازی با جدول رسمی…</div> : teamRow ? (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-2xl bg-cyan-400/10 p-3"><span className="text-[8px] text-slate-500">رتبه</span><b className="mt-1 block text-xl text-cyan-300">{rank}</b></div>
            <div className="rounded-2xl bg-white/[.035] p-3"><span className="text-[8px] text-slate-500">امتیاز</span><b className="mt-1 block text-xl">{teamRow.points ?? "—"}</b></div>
            <div className="rounded-2xl bg-white/[.035] p-3"><span className="text-[8px] text-slate-500">بازی</span><b className="mt-1 block text-xl">{teamRow.all?.played ?? "—"}</b></div>
            <div className="rounded-2xl bg-white/[.035] p-3"><span className="text-[8px] text-slate-500">تفاضل</span><b className="mt-1 block text-xl">{teamRow.goalsDiff > 0 ? `+${teamRow.goalsDiff}` : teamRow.goalsDiff ?? "—"}</b></div>
          </div>
          {nearby.length > 0 && <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.05]">
            <div className="grid grid-cols-[32px_1fr_48px_48px] gap-2 bg-white/[.035] px-3 py-2 text-[8px] text-slate-600"><span>#</span><span>تیم</span><span>امتیاز</span><span>تفاضل</span></div>
            {nearby.map((row) => <div key={`${row.rank}-${row.team?.id}`} className={`grid grid-cols-[32px_1fr_48px_48px] items-center gap-2 border-t border-white/[.04] px-3 py-2.5 text-[9px] ${String(row.team?.id) === String(teamId) || row.team?.name === teamName ? "bg-cyan-400/[.07]" : ""}`}><b className={row.rank === rank ? "text-cyan-300" : "text-slate-500"}>{row.rank}</b><span className="truncate font-semibold">{row.team?.name || "—"}</span><b>{row.points ?? "—"}</b><span className="text-slate-500">{row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff ?? "—"}</span></div>)}
          </div>}
        </>
      ) : <div className="mt-4 rounded-2xl bg-white/[.035] p-4 text-center text-[10px] text-slate-500">جایگاه این تیم در جدول فعلی از منبع داده دریافت نشد.</div>}

      {state.error && !teamRow && <p className="mt-3 text-[9px] text-slate-600">{state.error}</p>}
      <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-600"><BarChart3 size={13} /> جایگاه و امتیاز از سرویس جدول FOT10 خوانده می‌شود.</div>
    </section>
  );
}
