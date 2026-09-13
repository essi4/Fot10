"use client";

import Link from "next/link";
import { RefreshCw, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const SEASON = 2026;

export default function LeagueStandingsLive({ leagueId, leagueName, country, season = SEASON }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ provider: null, updatedAt: null, loading: true, error: null });

  const load = useCallback(async () => {
    if (!leagueId) return;
    try {
      setMeta(current => ({ ...current, loading: true, error: null }));
      const response = await fetch(`/api/football/standings?league=${encodeURIComponent(leagueId)}&season=${encodeURIComponent(season)}&t=${Date.now()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload?.data)) throw new Error(payload?.error || "دریافت جدول ناموفق بود.");
      setRows(payload.data);
      setMeta({ provider: payload.provider || "unknown", updatedAt: new Date(), loading: false, error: null });
    } catch (error) {
      setMeta(current => ({ ...current, loading: false, error: error?.message || "دریافت جدول ناموفق بود." }));
    }
  }, [leagueId, season]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const providerLabel = meta.provider === "api-football-live" ? "داده زنده" : meta.provider === "api-football-fixtures-derived" ? "محاسبه از نتایج" : meta.provider ? "منبع جایگزین" : "در حال اتصال";

  return (
    <main className="fot-shell min-h-screen pb-12">
      <div className="fot-container space-y-4">
        <header className="glass overflow-hidden rounded-[26px] border border-white/10">
          <div className="bg-gradient-to-l from-cyan-400/[.12] via-emerald-400/[.05] to-transparent p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[8px] font-black tracking-[.2em] text-cyan-300">FOT10 LIVE STANDINGS</p>
                <h1 className="mt-2 text-xl font-black">{leagueName}</h1>
                <p className="mt-1 text-[9px] text-slate-500">{country || "فوتبال"} · فصل {season} · جدول خودکار</p>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.05]"><Trophy size={23} className="text-cyan-300" /></div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-[9px]">
              <span className="rounded-full border border-emerald-300/10 bg-emerald-400/10 px-2.5 py-1.5 text-emerald-300">● {providerLabel}</span>
              <span className="text-slate-500">{meta.updatedAt ? `آخرین بروزرسانی ${meta.updatedAt.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}` : "در حال دریافت..."}</span>
              <button type="button" onClick={load} disabled={meta.loading} className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 disabled:opacity-40" aria-label="بروزرسانی جدول"><RefreshCw size={14} className={meta.loading ? "animate-spin" : ""} /></button>
            </div>
          </div>
        </header>

        {meta.error && <div className="rounded-2xl border border-rose-300/10 bg-rose-400/[.05] px-4 py-3 text-center text-[10px] text-rose-300">{meta.error}</div>}

        <section className="glass overflow-hidden rounded-[24px] border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-[10px] sm:text-[11px]">
              <thead><tr className="bg-white/[.025] text-slate-500"><th className="w-10 p-3">#</th><th className="sticky right-0 bg-slate-950/95 p-3 text-right">تیم</th><th className="p-3">بازی</th><th className="p-3">برد</th><th className="p-3">مساوی</th><th className="p-3">باخت</th><th className="p-3">گل</th><th className="p-3">تفاضل</th><th className="p-3">فرم</th><th className="p-3">امتیاز</th></tr></thead>
              <tbody>
                {rows.map((row, index) => {
                  const name = row?.team?.name || "—";
                  const id = row?.team?.id;
                  const form = String(row?.form || "").toUpperCase().replace(/[^WDL]/g, "").slice(-5).split("");
                  const gd = Number(row?.goalsDiff || 0);
                  return <tr key={`${id || name}-${index}`} className="border-t border-white/[.055] hover:bg-cyan-400/[.035]">
                    <td className="p-2.5 text-center font-black text-slate-500">{row?.rank || index + 1}</td>
                    <td className="sticky right-0 bg-slate-950/95 p-2.5"><Link href={id ? `/teams/${id}` : `/teams?search=${encodeURIComponent(name)}`} className="flex min-w-[170px] items-center gap-2 font-bold"><span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[.05]">{row?.team?.logo ? <img src={row.team.logo} alt="" className="h-7 w-7 object-contain" /> : "⚽"}</span><span className="truncate">{name}</span></Link></td>
                    <td className="p-2.5 text-center">{row?.all?.played ?? 0}</td><td className="p-2.5 text-center text-emerald-300">{row?.all?.win ?? 0}</td><td className="p-2.5 text-center text-amber-300">{row?.all?.draw ?? 0}</td><td className="p-2.5 text-center text-rose-300">{row?.all?.lose ?? row?.all?.loss ?? 0}</td>
                    <td className="p-2.5 text-center">{row?.all?.goals?.for ?? 0}-{row?.all?.goals?.against ?? 0}</td><td className="p-2.5 text-center font-black">{gd > 0 ? `+${gd}` : gd}</td>
                    <td className="p-2"><div className="flex justify-center gap-0.5">{form.map((value, i) => <i key={i} className={`grid h-5 w-5 place-items-center rounded-full text-[8px] font-black not-italic ${value === "W" ? "bg-emerald-400/20 text-emerald-300" : value === "D" ? "bg-amber-400/20 text-amber-300" : "bg-rose-400/20 text-rose-300"}`}>{value}</i>)}</div></td>
                    <td className="p-2.5 text-center text-sm font-black text-cyan-200">{row?.points ?? 0}</td>
                  </tr>;
                })}
              </tbody>
            </table>
            {!rows.length && <div className="p-12 text-center text-xs text-slate-500">{meta.loading ? "در حال دریافت جدول زنده…" : "جدول در دسترس نیست."}</div>}
          </div>
        </section>
        <p className="px-2 text-center text-[8px] leading-5 text-slate-600">نتایج مسابقات، امتیازها و رتبه‌ها خودکار بروزرسانی می‌شوند؛ هیچ امتیازی به‌صورت دستی وارد نشده است.</p>
      </div>
    </main>
  );
}
