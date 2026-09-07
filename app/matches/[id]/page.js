"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, MapPin, Radio, Shield, Users, Zap } from "lucide-react";

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

function isLive(status) {
  return ["1H", "HT", "2H", "ET", "P", "BT"].includes(status);
}

export default function MatchDetailPage({ params }) {
  const id = params?.id;
  const [section, setSection] = useState("events");
  const [fixture, setFixture] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (nextSection = section, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/football/fixture?id=${encodeURIComponent(id)}&section=${nextSection}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "دریافت اطلاعات مسابقه ناموفق بود");
      if (nextSection === "details") setFixture(payload.data?.fixture ?? payload.data ?? null);
      else setData(payload.data ?? []);
    } catch (err) {
      if (!silent) setError(err?.message || "اطلاعات مسابقه در دسترس نیست.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { if (id && !String(id).startsWith("demo-")) load("details"); else setLoading(false); }, [id]);
  useEffect(() => { if (id && !String(id).startsWith("demo-") && section !== "details") load(section); }, [section, id]);

  useEffect(() => {
    if (!id || !fixture || !isLive(fixture.fixture?.status?.short)) return undefined;
    const timer = setInterval(() => {
      load("details", true);
      if (section !== "lineups") load(section, true);
    }, 30000);
    return () => clearInterval(timer);
  }, [id, fixture?.fixture?.status?.short, section]);

  const match = useMemo(() => fixture?.fixture ? fixture : fixture, [fixture]);
  const teams = match?.teams;
  const goals = match?.goals;
  const score = match?.score;

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-4 pb-10">
        <header className="flex items-center gap-3">
          <Link href="/matches" className="glass h-10 w-10 rounded-xl grid place-items-center"><ArrowRight size={19} /></Link>
          <div><h1 className="text-xl font-black">مرکز مسابقه</h1><p className="text-[11px] text-slate-500">اطلاعات، رویدادها و آمار واقعی مسابقه</p></div>
        </header>

        <section className="glass rounded-3xl p-5">
          {loading && !match ? <div className="py-12 text-center text-sm text-slate-400">در حال دریافت اطلاعات مسابقه…</div> : match ? (
            <>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-5"><span>{match.league?.name || "مسابقه فوتبال"}</span><span className={isLive(match.fixture?.status?.short) ? "text-emerald-400 font-bold" : ""}>{match.fixture?.status?.long || match.fixture?.status?.short || ""}</span></div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-center"><Link href={`/teams/${teams?.home?.id}`} aria-label={`صفحه ${teams?.home?.name || "تیم میزبان"}`}><img src={teams?.home?.logo} alt="" className="h-14 w-14 object-contain mx-auto" /></Link><Link href={`/teams/${teams?.home?.id}`} className="block mt-2 font-bold hover:text-emerald-300">{teams?.home?.name || "میزبان"}</Link></div>
                <div className="text-center"><div className="text-3xl font-black">{goals?.home ?? "—"} - {goals?.away ?? "—"}</div><div className="mt-1 text-[10px] text-slate-500">{match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : formatDate(match.fixture?.date)}</div><div className="mt-1 text-[9px] text-slate-600">نیمه اول: {score?.halftime?.home ?? "—"} - {score?.halftime?.away ?? "—"}</div></div>
                <div className="text-center"><Link href={`/teams/${teams?.away?.id}`} aria-label={`صفحه ${teams?.away?.name || "تیم مهمان"}`}><img src={teams?.away?.logo} alt="" className="h-14 w-14 object-contain mx-auto" /></Link><Link href={`/teams/${teams?.away?.id}`} className="block mt-2 font-bold hover:text-emerald-300">{teams?.away?.name || "مهمان"}</Link></div>
              </div>
              {isLive(match.fixture?.status?.short) && <div className="mt-5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 py-2 text-center text-[10px] text-emerald-300">● مسابقه زنده است · بروزرسانی خودکار هر ۳۰ ثانیه</div>}
            </>
          ) : <div className="py-10 text-center text-sm text-slate-400">مسابقه پیدا نشد.</div>}
        </section>

        <nav className="glass rounded-2xl p-1.5 grid grid-cols-5 gap-1 overflow-x-auto">
          {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`rounded-xl px-2 py-3 text-[10px] font-bold whitespace-nowrap ${section === key ? "bg-emerald-400 text-slate-950" : "text-slate-400"}`}><Icon size={15} className="mx-auto mb-1" />{label}</button>)}
        </nav>

        {error && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">{error}</div>}
        <section className="space-y-3">
          {loading ? <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">در حال بارگذاری…</div> : section === "events" ? <Events data={data} /> : section === "statistics" ? <Statistics data={data} /> : section === "lineups" ? <Lineups data={data} /> : section === "players" ? <Players data={data} /> : <Details data={fixture} />}
        </section>
      </div>
    </main>
  );
}

function Events({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="هنوز رویدادی برای این مسابقه ثبت نشده است." />;
  return <div className="glass rounded-2xl p-4 space-y-1">{data.map((e, i) => {
    const icon = e.type === "Card" ? (e.detail?.includes("Red") ? "🟥" : "🟨") : e.type === "subst" ? "🔄" : e.type === "Goal" ? "⚽" : "•";
    const minute = `${e.time?.elapsed ?? "—"}${e.time?.extra ? `+${e.time.extra}` : ""}'`;
    const subtitle = e.type === "subst" ? `${e.assist?.name ? `ورود: ${e.assist.name}` : ""}` : `${e.team?.name || ""}${e.assist?.name ? ` · پاس گل: ${e.assist.name}` : ""}`;
    return <div key={`${e.time?.elapsed}-${e.time?.extra}-${i}`} className="flex items-center gap-3 border-b border-white/5 last:border-0 py-3"><span className="text-xs font-black w-12">{minute}</span><span className="text-xl">{icon}</span><div className="flex-1"><b className="text-xs">{e.player?.id ? <Link href={`/players/${e.player.id}`} className="hover:text-emerald-300">{e.player?.name || "بازیکن"}</Link> : (e.player?.name || e.detail || e.type)}</b><div className="text-[10px] text-slate-500">{e.team?.id ? <Link href={`/teams/${e.team.id}`} className="hover:text-emerald-300">{e.team.name}</Link> : e.team?.name || ""}{e.assist?.name ? ` · پاس گل: ${e.assist.name}` : ""}</div></div></div>;
  })}</div>;
}

function Statistics({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="آمار این مسابقه هنوز در دسترس نیست." />;
  const home = data[0]?.statistics || [];
  const away = data[1]?.statistics || [];
  const awayMap = new Map(away.map((item) => [String(item.type).toLowerCase(), item.value]));
  return <div className="glass rounded-2xl p-4 space-y-1">{home.map((item, i) => {
    const left = item.value ?? "—";
    const right = awayMap.get(String(item.type).toLowerCase()) ?? "—";
    return <div key={item.type || i} className="py-2.5 border-b border-white/5 last:border-0"><div className="grid grid-cols-[1fr_90px_1fr] items-center gap-2"><span className="text-center font-bold text-xs">{left}</span><span className="text-center text-[10px] text-slate-500">{item.type}</span><span className="text-center font-bold text-xs">{right}</span></div>{typeof left === "string" && left.endsWith("%") && typeof right === "string" && right.endsWith("%") && <div className="mt-2 grid grid-cols-2 gap-1"><div className="h-1 rounded-full bg-emerald-400" style={{ width: left }} /><div className="h-1 rounded-full bg-slate-600 ml-auto" style={{ width: right }} /></div>}</div>;
  })}</div>;
}

function Lineups({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="ترکیب رسمی هنوز اعلام نشده است." />;
  return <div className="grid gap-3">{data.map((team, i) => <div key={team.team?.id || i} className="glass rounded-2xl p-4"><div className="flex items-center gap-2 mb-3"><Link href={`/teams/${team.team?.id}`}><img src={team.team?.logo} alt="" className="h-7 w-7 object-contain" /></Link><Link href={`/teams/${team.team?.id}`} className="font-bold hover:text-emerald-300">{team.team?.name}</Link><span className="mr-auto text-[10px] text-slate-500">{team.formation || "—"}</span></div><div className="grid grid-cols-2 gap-2">{(team.startXI || []).map((p, j) => <div key={p.player?.id || j} className="rounded-xl bg-white/5 p-2 text-[10px] flex justify-between"><Link href={p.player?.id ? `/players/${p.player.id}` : "#"} className="hover:text-emerald-300">{p.player?.name}</Link><span>{p.player?.number ?? ""}</span></div>)}</div></div>)}</div>;
}

function Players({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="امتیازات بازیکنان هنوز در دسترس نیست." />;
  const teams = data.flatMap((t) => (t.players || []).map((p) => ({ ...p.player, statistics: p.statistics?.[0], team: t.team })));
  return <div className="grid gap-2">{teams.map((p, i) => <Link key={p.id || i} href={p.id ? `/players/${p.id}` : "#"} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-emerald-400/20"><img src={p.photo} alt="" className="h-10 w-10 rounded-full object-cover bg-white/5" /><div className="flex-1"><b className="text-xs">{p.name || "بازیکن"}</b><div className="text-[10px] text-slate-500">{p.team?.id ? <span>{p.team.name}</span> : ""} · {p.statistics?.games?.minutes ?? 0} دقیقه</div></div><div className="text-left"><strong className="text-lg">{p.statistics?.games?.rating ? Number(p.statistics.games.rating).toFixed(1) : "—"}</strong><div className="text-[9px] text-slate-500">امتیاز</div></div></Link>)}</div>;
}

function Details({ data }) {
  const f = data?.fixture || data;
  if (!f) return <Empty text="جزئیات مسابقه موجود نیست." />;
  return <div className="glass rounded-2xl p-4 space-y-3">{[[CalendarDays, "زمان", formatDate(f.date)], [MapPin, "ورزشگاه", f.venue?.name || "—"], [MapPin, "شهر", f.venue?.city || "—"], [Users, "داور", f.referee || "—"], [Radio, "وضعیت", f.status?.long || "—"]].map(([Icon, label, value]) => <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"><Icon size={16} className="text-emerald-400" /><span className="text-xs text-slate-500 w-16">{label}</span><b className="text-xs">{value}</b></div>)}</div>;
}

function Empty({ text }) { return <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">{text}</div>; }
