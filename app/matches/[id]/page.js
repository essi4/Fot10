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

function statusLabel(status) {
  const map = { NS: "شروع نشده", TBD: "زمان نامشخص", 1H: "نیمه اول", HT: "بین دو نیمه", 2H: "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "بین دو وقت اضافه", FT: "پایان بازی", AET: "پایان وقت اضافه", PEN: "پایان پنالتی" };
  return map[status] || status || "—";
}

function eventIcon(e) {
  if (e.type === "Goal") return "⚽";
  if (e.type === "Card") return e.detail?.toLowerCase().includes("red") ? "🟥" : "🟨";
  if (e.type === "subst") return "🔄";
  return "•";
}

function eventTitle(e) {
  if (e.type === "Goal") return e.detail || "گل";
  if (e.type === "Card") return e.detail || "کارت";
  if (e.type === "subst") return "تعویض";
  return e.detail || e.type || "رویداد";
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
  const live = isLive(match?.fixture?.status?.short);

  return (
    <main className="fot-shell">
      <div className="fot-container space-y-4 pb-10">
        <header className="flex items-center gap-3">
          <Link href="/matches" className="glass h-10 w-10 rounded-xl grid place-items-center shrink-0" aria-label="بازگشت"><ArrowRight size={19} /></Link>
          <div><h1 className="text-xl font-black">مرکز مسابقه</h1><p className="text-[11px] text-slate-500">Match Center Pro · اطلاعات واقعی مسابقه</p></div>
        </header>

        <section className="glass rounded-3xl p-5 md:p-7 overflow-hidden">
          {loading && !match ? <div className="py-12 text-center text-sm text-slate-400">در حال دریافت اطلاعات مسابقه…</div> : match ? (
            <>
              <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 mb-6"><span>{match.league?.name || "مسابقه فوتبال"}</span><span className={live ? "text-emerald-400 font-black" : "font-bold"}>{statusLabel(match.fixture?.status?.short)}</span></div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-8">
                <TeamHero team={teams?.home} />
                <div className="text-center min-w-[92px]"><div className="text-3xl md:text-4xl font-black tracking-tight">{goals?.home ?? "—"} - {goals?.away ?? "—"}</div><div className={live ? "mt-2 text-[11px] font-black text-emerald-400" : "mt-2 text-[10px] text-slate-500"}>{match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : formatDate(match.fixture?.date)}</div><div className="mt-1 text-[9px] text-slate-600">نیمه اول: {score?.halftime?.home ?? "—"} - {score?.halftime?.away ?? "—"}</div></div>
                <TeamHero team={teams?.away} />
              </div>
              {live && <div className="mt-6 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 py-2.5 text-center text-[10px] font-bold text-emerald-300">● مسابقه زنده است · بروزرسانی خودکار هر ۳۰ ثانیه</div>}
            </>
          ) : <div className="py-10 text-center text-sm text-slate-400">مسابقه پیدا نشد.</div>}
        </section>

        <nav className="glass rounded-2xl p-1.5 grid grid-cols-5 gap-1 overflow-x-auto" aria-label="بخش‌های مسابقه">
          {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`rounded-xl px-2 py-3 text-[10px] font-bold whitespace-nowrap transition ${section === key ? "bg-emerald-400 text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/5"}`}><Icon size={15} className="mx-auto mb-1" />{label}</button>)}
        </nav>

        {error && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">{error}</div>}
        <section className="space-y-3">
          {loading ? <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">در حال بارگذاری…</div> : section === "events" ? <Events data={data} /> : section === "statistics" ? <Statistics data={data} /> : section === "lineups" ? <Lineups data={data} /> : section === "players" ? <Players data={data} /> : <Details data={fixture} />}
        </section>
      </div>
    </main>
  );
}

function TeamHero({ team }) {
  if (!team) return <div className="text-center text-slate-500">—</div>;
  return <div className="text-center min-w-0"><Link href={`/teams/${team.id}`} aria-label={`صفحه ${team.name || "تیم"}`} className="inline-flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl bg-white/5 border border-white/5"><img src={team.logo} alt="" className="h-14 w-14 md:h-16 md:w-16 object-contain" /></Link><Link href={`/teams/${team.id}`} className="block mt-3 font-black text-sm md:text-base truncate hover:text-emerald-300">{team.name || "تیم"}</Link></div>;
}

function Events({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="هنوز رویدادی برای این مسابقه ثبت نشده است." />;
  return <div className="glass rounded-2xl p-3 md:p-5">{data.map((e, i) => {
    const minute = `${e.time?.elapsed ?? "—"}${e.time?.extra ? `+${e.time.extra}` : ""}'`;
    return <div key={`${e.time?.elapsed}-${e.time?.extra}-${i}`} className="grid grid-cols-[1fr_46px_1fr] items-center gap-2 py-3 border-b border-white/5 last:border-0">
      <div className={e.team?.id && i % 2 === 0 ? "text-right" : "text-right"}><b className="text-xs">{e.team?.id ? <Link href={`/teams/${e.team.id}`} className="hover:text-emerald-300">{e.team.name}</Link> : ""}</b><div className="text-[11px] text-slate-300">{e.player?.id ? <Link href={`/players/${e.player.id}`} className="hover:text-emerald-300">{e.player.name}</Link> : e.player?.name || ""}</div>{e.assist?.name && <div className="text-[9px] text-slate-500">پاس گل: {e.assist.name}</div>}</div>
      <div className="text-center"><div className="text-lg">{eventIcon(e)}</div><div className="text-[10px] font-black text-emerald-300">{minute}</div></div>
      <div className="text-right"><b className="text-[10px] text-slate-500">{eventTitle(e)}</b></div>
    </div>;
  })}</div>;
}

function Statistics({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="آمار این مسابقه هنوز در دسترس نیست." />;
  const home = data[0]?.statistics || [];
  const away = data[1]?.statistics || [];
  const awayMap = new Map(away.map((item) => [String(item.type).toLowerCase(), item.value]));
  return <div className="glass rounded-2xl p-4 md:p-5 space-y-1">{home.map((item, i) => {
    const left = item.value ?? "—";
    const right = awayMap.get(String(item.type).toLowerCase()) ?? "—";
    const percentages = typeof left === "string" && left.endsWith("%") && typeof right === "string" && right.endsWith("%");
    const lp = percentages ? Math.max(0, Math.min(100, Number.parseFloat(left))) : 0;
    const rp = percentages ? Math.max(0, Math.min(100, Number.parseFloat(right))) : 0;
    return <div key={item.type || i} className="py-3 border-b border-white/5 last:border-0"><div className="grid grid-cols-[1fr_100px_1fr] items-center gap-2"><span className="text-center font-black text-xs">{left}</span><span className="text-center text-[10px] text-slate-500">{item.type}</span><span className="text-center font-black text-xs">{right}</span></div>{percentages && <div className="mt-2 grid grid-cols-2 gap-2"><div className="h-1.5 rounded-full bg-emerald-400/80" style={{ width: `${lp}%` }} /><div className="h-1.5 rounded-full bg-slate-600/80 ml-auto" style={{ width: `${rp}%` }} /></div>}</div>;
  })}</div>;
}

function Lineups({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="ترکیب رسمی هنوز اعلام نشده است." />;
  return <div className="grid gap-3 md:grid-cols-2">{data.map((team, i) => <div key={team.team?.id || i} className="glass rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-4"><Link href={`/teams/${team.team?.id}`}><img src={team.team?.logo} alt="" className="h-8 w-8 object-contain" /></Link><Link href={`/teams/${team.team?.id}`} className="font-black hover:text-emerald-300">{team.team?.name}</Link><span className="mr-auto rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-500">{team.formation || "—"}</span></div>
    <div className="text-[10px] font-black text-emerald-300 mb-2">ترکیب اصلی</div>
    <div className="grid grid-cols-2 gap-2">{(team.startXI || []).map((p, j) => <div key={p.player?.id || j} className="rounded-xl bg-white/5 p-2.5 text-[10px] flex justify-between gap-2"><Link href={p.player?.id ? `/players/${p.player.id}` : "#"} className="truncate hover:text-emerald-300">{p.player?.name}</Link><span className="shrink-0 text-slate-500">{p.player?.number ?? ""}</span></div>)}</div>
    <div className="text-[10px] font-black text-slate-300 mt-4 mb-2">نیمکت</div>
    {(team.substitutes || []).length ? <div className="grid grid-cols-2 gap-2">{team.substitutes.map((p, j) => <div key={p.player?.id || `sub-${j}`} className="rounded-xl bg-white/5 p-2.5 text-[10px] flex justify-between gap-2"><Link href={p.player?.id ? `/players/${p.player.id}` : "#"} className="truncate hover:text-emerald-300">{p.player?.name}</Link><span className="shrink-0 text-slate-500">{p.player?.number ?? ""}</span></div>)}</div> : <div className="rounded-xl bg-white/5 p-3 text-[10px] text-slate-500">اطلاعات نیمکت هنوز در دسترس نیست.</div>}
  </div>)}</div>;
}

function Players({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="امتیازات بازیکنان هنوز در دسترس نیست." />;
  const teams = data.flatMap((t) => (t.players || []).map((p) => ({ ...p.player, statistics: p.statistics?.[0], team: t.team })));
  return <div className="grid gap-2">{teams.map((p, i) => <Link key={p.id || i} href={p.id ? `/players/${p.id}` : "#"} className="glass rounded-2xl p-3.5 flex items-center gap-3 hover:border-emerald-400/20"><img src={p.photo} alt="" className="h-11 w-11 rounded-full object-cover bg-white/5" /><div className="flex-1 min-w-0"><b className="text-xs">{p.name || "بازیکن"}</b><div className="text-[10px] text-slate-500 truncate">{p.team?.name || ""} · {p.statistics?.games?.minutes ?? 0} دقیقه</div></div><div className="text-left"><strong className="text-lg">{p.statistics?.games?.rating ? Number(p.statistics.games.rating).toFixed(1) : "—"}</strong><div className="text-[9px] text-slate-500">امتیاز</div></div></Link>)}</div>;
}

function Details({ data }) {
  const f = data?.fixture || data;
  if (!f) return <Empty text="جزئیات مسابقه موجود نیست." />;
  return <div className="glass rounded-2xl p-4 md:p-5 space-y-1">{[[CalendarDays, "زمان", formatDate(f.date)], [MapPin, "ورزشگاه", f.venue?.name || "—"], [MapPin, "شهر", f.venue?.city || "—"], [Users, "داور", f.referee || "—"], [Radio, "وضعیت", statusLabel(f.status?.short)]].map(([Icon, label, value]) => <div key={label} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"><Icon size={16} className="text-emerald-400 shrink-0" /><span className="text-xs text-slate-500 w-16">{label}</span><b className="text-xs">{value}</b></div>)}</div>;
}

function Empty({ text }) { return <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">{text}</div>; }
