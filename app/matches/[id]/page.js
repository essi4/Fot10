"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Clock3, MapPin, Radio, Shield, Users, Zap } from "lucide-react";

const tabs = [
  ["events", "گزارش زنده", Zap],
  ["statistics", "آمار", BarChart3],
  ["lineups", "ترکیب", Users],
  ["players", "بازیکنان", Shield],
  ["details", "اطلاعات", MapPin],
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}

function statValue(item, side) {
  const value = item?.statistics?.find((s) => String(s.type).toLowerCase() === String(side).toLowerCase())?.value;
  return value ?? "—";
}

export default function MatchDetailPage({ params }) {
  const id = params?.id;
  const [section, setSection] = useState("events");
  const [fixture, setFixture] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (nextSection = section) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/football/fixture?id=${encodeURIComponent(id)}&section=${nextSection}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "دریافت اطلاعات مسابقه ناموفق بود");
      setData(payload.data ?? []);
      if (nextSection === "details") setFixture(payload.data?.fixture ?? payload.data ?? null);
    } catch (err) {
      setError(err?.message || "اطلاعات مسابقه در دسترس نیست.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id && !String(id).startsWith("demo-")) load("details"); else setLoading(false); }, [id]);
  useEffect(() => { if (id && !String(id).startsWith("demo-") && section !== "details") load(section); }, [section]);

  const match = useMemo(() => fixture?.fixture ? fixture : fixture, [fixture]);
  const teams = match?.teams;
  const goals = match?.goals;

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-4 pb-10">
        <header className="flex items-center gap-3">
          <Link href="/matches" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19} /></Link>
          <div><h1 className="text-xl font-black">مرکز مسابقه</h1><p className="text-[11px] text-slate-500">اطلاعات و آمار واقعی مسابقه</p></div>
        </header>

        <section className="glass rounded-3xl p-5">
          {loading && !match ? <div className="py-12 text-center text-sm text-slate-400">در حال دریافت اطلاعات مسابقه…</div> : match ? (
            <>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-5"><span>{match.league?.name || "مسابقه فوتبال"}</span><span>{match.fixture?.status?.long || match.fixture?.status?.short || ""}</span></div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-center"><img src={teams?.home?.logo} alt="" className="h-14 w-14 object-contain mx-auto" /><b className="block mt-2">{teams?.home?.name || "میزبان"}</b></div>
                <div className="text-center"><div className="text-3xl font-black">{goals?.home ?? "—"} - {goals?.away ?? "—"}</div><div className="mt-1 text-[10px] text-slate-500">{match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : formatDate(match.fixture?.date)}</div></div>
                <div className="text-center"><img src={teams?.away?.logo} alt="" className="h-14 w-14 object-contain mx-auto" /><b className="block mt-2">{teams?.away?.name || "مهمان"}</b></div>
              </div>
            </>
          ) : <div className="py-10 text-center text-sm text-slate-400">مسابقه پیدا نشد.</div>}
        </section>

        <nav className="glass rounded-2xl p-1.5 grid grid-cols-5 gap-1 overflow-x-auto">
          {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`rounded-xl px-2 py-3 text-[10px] font-bold whitespace-nowrap ${section === key ? "bg-emerald-400 text-slate-950" : "text-slate-400"}`}><Icon size={15} className="mx-auto mb-1" />{label}</button>)}
        </nav>

        {error && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">{error}</div>}

        <section className="space-y-3">
          {loading ? <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">در حال بارگذاری…</div> : section === "events" ? <Events data={data} /> : section === "statistics" ? <Statistics data={data} /> : section === "lineups" ? <Lineups data={data} /> : section === "players" ? <Players data={data} /> : <Details data={data} />}
        </section>
      </div>
    </main>
  );
}

function Events({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="هنوز رویدادی برای این مسابقه ثبت نشده است." />;
  return <div className="glass rounded-2xl p-4 space-y-2">{data.map((e, i) => <div key={`${e.time?.elapsed}-${i}`} className="flex items-center gap-3 border-b border-white/5 last:border-0 py-3"><span className="text-xs font-black w-10">{e.time?.elapsed ? `${e.time.elapsed}'` : "—"}</span><span className="text-xl">{e.type === "Card" ? "🟨" : e.type === "subst" ? "🔄" : e.type === "Goal" ? "⚽" : "•"}</span><div className="flex-1"><b className="text-xs">{e.player?.name || e.detail || e.type}</b><div className="text-[10px] text-slate-500">{e.team?.name || ""}{e.assist?.name ? ` · پاس گل: ${e.assist.name}` : ""}</div></div></div>)}</div>;
}

function Statistics({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="آمار این مسابقه هنوز در دسترس نیست." />;
  const home = data[0]?.statistics || [];
  const away = data[1]?.statistics || [];
  return <div className="glass rounded-2xl p-4 space-y-2">{home.map((item, i) => <div key={item.type || i} className="grid grid-cols-[1fr_80px_1fr] items-center gap-2 py-2 border-b border-white/5"><span className="text-center font-bold text-xs">{item.value ?? "—"}</span><span className="text-center text-[10px] text-slate-500">{item.type}</span><span className="text-center font-bold text-xs">{away[i]?.value ?? "—"}</span></div>)}</div>;
}

function Lineups({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="ترکیب رسمی هنوز اعلام نشده است." />;
  return <div className="grid gap-3">{data.map((team, i) => <div key={team.team?.id || i} className="glass rounded-2xl p-4"><div className="flex items-center gap-2 mb-3"><img src={team.team?.logo} alt="" className="h-7 w-7 object-contain" /><b>{team.team?.name}</b><span className="mr-auto text-[10px] text-slate-500">{team.formation || "—"}</span></div><div className="grid grid-cols-2 gap-2">{(team.startXI || []).map((p, j) => <div key={p.player?.id || j} className="rounded-xl bg-white/5 p-2 text-[10px] flex justify-between"><span>{p.player?.name}</span><span>{p.player?.number ?? ""}</span></div>)}</div></div>)}</div>;
}

function Players({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="امتیازات بازیکنان هنوز در دسترس نیست." />;
  const teams = data.flatMap((t) => (t.players || []).map((p) => ({ ...p.player, team: t.team })));
  return <div className="grid gap-2">{teams.map((p, i) => <div key={p.id || i} className="glass rounded-2xl p-3 flex items-center gap-3"><img src={p.photo} alt="" className="h-10 w-10 rounded-full object-cover bg-white/5" /><div className="flex-1"><b className="text-xs">{p.name || "بازیکن"}</b><div className="text-[10px] text-slate-500">{p.team?.name || ""}</div></div><strong className="text-lg">{p.statistics?.[0]?.games?.rating ? Number(p.statistics[0].games.rating).toFixed(1) : "—"}</strong></div>)}</div>;
}

function Details({ data }) {
  const f = data?.fixture || data;
  if (!f) return <Empty text="جزئیات مسابقه موجود نیست." />;
  return <div className="glass rounded-2xl p-4 space-y-3">{[[CalendarDays, "زمان", formatDate(f.date)], [MapPin, "ورزشگاه", f.venue?.name || "—"], [MapPin, "شهر", f.venue?.city || "—"], [Users, "داور", f.referee || "—"], [Radio, "وضعیت", f.status?.long || "—"]].map(([Icon, label, value]) => <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"><Icon size={16} className="text-emerald-400" /><span className="text-xs text-slate-500 w-16">{label}</span><b className="text-xs">{value}</b></div>)}</div>;
}

function Empty({ text }) { return <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">{text}</div>; }
