"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, RefreshCw, BrainCircuit, ShieldCheck, Goal, Trophy } from "lucide-react";

const REFRESH_SECONDS = 30;

function leagueIdFromSlug(slug) {
  const ids = { iran: 195, "j1-league": 98, "k-league-1": 292, "saudi-pro-league": 307, "qatar-stars-league": 305, "uae-pro-league": 301, "chinese-super-league": 169, "a-league": 188, "premier-league": 39, laliga: 140, bundesliga: 78, "serie-a": 135, "ligue-1": 61, eredivisie: 88, "primeira-liga": 94, "super-lig": 203, mls: 253, "liga-mx": 262, brasileirao: 71, "liga-profesional": 128 };
  return ids[slug] || null;
}

function flatRows(payload) {
  return (payload?.data || []).flatMap((item) => item?.league?.standings?.flat?.() || []).filter(Boolean);
}

function metric(rows, field, direction) {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => direction === "min" ? Number(a[field] ?? 0) - Number(b[field] ?? 0) : Number(b[field] ?? 0) - Number(a[field] ?? 0))[0];
}

export default function StandingsProfessional() {
  const router = useRouter();
  const pathname = usePathname();
  const [seconds, setSeconds] = useState(REFRESH_SECONDS);
  const [syncing, setSyncing] = useState(false);
  const [intel, setIntel] = useState(null);

  useEffect(() => {
    let alive = true;
    const slug = pathname?.split("/").filter(Boolean).pop();
    const league = leagueIdFromSlug(slug);
    const loadIntel = async () => {
      if (!league) return;
      try {
        const season = league === 195 ? 2026 : new Date().getFullYear();
        const res = await fetch(`/api/football/standings?league=${league}&season=${season}`, { cache: "no-store" });
        const payload = await res.json();
        if (!alive || !payload?.ok) return;
        const rows = flatRows(payload);
        if (!rows.length) return;
        const leader = rows[0];
        const attack = metric(rows.map((r) => ({ ...r, value: r.all?.goals?.for })), "value", "max");
        const defense = metric(rows.map((r) => ({ ...r, value: r.all?.goals?.against })), "value", "min");
        const wins = metric(rows.map((r) => ({ ...r, value: r.all?.win })), "value", "max");
        const goals = rows.reduce((sum, r) => sum + Number(r.all?.goals?.for || 0), 0);
        const matches = rows.reduce((sum, r) => sum + Number(r.all?.played || 0), 0) / 2;
        setIntel({ leader, attack, defense, wins, goals, matches, provider: payload.provider });
      } catch {}
    };
    loadIntel();
    const timer = window.setInterval(loadIntel, REFRESH_SECONDS * 1000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [pathname]);

  useEffect(() => {
    const refresh = () => {
      setSyncing(true);
      router.refresh();
      window.setTimeout(() => setSyncing(false), 900);
      setSeconds(REFRESH_SECONDS);
    };
    const countdown = window.setInterval(() => setSeconds((value) => { if (value <= 1) { refresh(); return REFRESH_SECONDS; } return value - 1; }), 1000);
    return () => window.clearInterval(countdown);
  }, [router]);

  return (
    <div className="space-y-2 -mb-1">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[9px] font-bold text-emerald-300 shadow-lg shadow-emerald-950/10" title="داده‌های جدول و نتایج هر ۳۰ ثانیه به‌روزرسانی می‌شوند">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50"/><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"/></span>
          <Activity size={12}/><span>داده زنده</span><span className="text-emerald-200/60">·</span><span className="tabular-nums">{syncing ? "در حال همگام‌سازی…" : `${seconds} ثانیه`}</span><RefreshCw size={11} className={syncing ? "animate-spin" : "opacity-50"}/>
        </div>
      </div>
      {intel && (
        <div className="mx-auto max-w-4xl rounded-2xl border border-cyan-300/10 bg-cyan-400/[.045] p-3 shadow-lg shadow-cyan-950/10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2"><BrainCircuit size={15} className="text-cyan-300"/><span className="text-[10px] font-black text-cyan-100">FOT10 League Intelligence</span></div>
            <span className="text-[8px] text-slate-500">تحلیل خودکار جدول</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl bg-black/20 border border-white/5 p-2.5"><div className="flex items-center gap-1 text-[8px] text-slate-500"><Trophy size={11}/> صدرنشین</div><b className="block text-[11px] mt-1 truncate">{intel.leader?.team?.name || "—"}</b><span className="text-[8px] text-cyan-300">{intel.leader?.points ?? "—"} امتیاز</span></div>
            <div className="rounded-xl bg-black/20 border border-white/5 p-2.5"><div className="flex items-center gap-1 text-[8px] text-slate-500"><Goal size={11}/> بهترین حمله</div><b className="block text-[11px] mt-1 truncate">{intel.attack?.team?.name || "—"}</b><span className="text-[8px] text-cyan-300">{intel.attack?.value ?? "—"} گل</span></div>
            <div className="rounded-xl bg-black/20 border border-white/5 p-2.5"><div className="flex items-center gap-1 text-[8px] text-slate-500"><ShieldCheck size={11}/> بهترین دفاع</div><b className="block text-[11px] mt-1 truncate">{intel.defense?.team?.name || "—"}</b><span className="text-[8px] text-cyan-300">{intel.defense?.value ?? "—"} گل خورده</span></div>
            <div className="rounded-xl bg-black/20 border border-white/5 p-2.5"><div className="flex items-center gap-1 text-[8px] text-slate-500"><Activity size={11}/> بیشترین برد</div><b className="block text-[11px] mt-1 truncate">{intel.wins?.team?.name || "—"}</b><span className="text-[8px] text-cyan-300">{intel.wins?.value ?? "—"} برد</span></div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[8px] text-slate-500"><span>⚽ مجموع گل‌ها: <b className="text-slate-300">{intel.goals}</b></span><span>🏟️ بازی‌های محاسبه‌شده: <b className="text-slate-300">{Math.round(intel.matches)}</b></span><span>منبع: <b className="text-slate-300">{intel.provider || "—"}</b></span></div>
        </div>
      )}
    </div>
  );
}
