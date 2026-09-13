"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CircleAlert, Goal, MapPin, RefreshCw, Repeat2, Shield, ShieldAlert, Users, WifiOff, Zap } from "lucide-react";

const tabs = [["events", "گزارش زنده", Zap], ["statistics", "آمار", BarChart3], ["lineups", "ترکیب", Users], ["players", "بازیکنان", Shield], ["details", "اطلاعات", MapPin]];

function formatDate(value) { if (!value) return "—"; const d = new Date(value); if (Number.isNaN(d.getTime())) return value; return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" }); }
function isLive(status) { return ["1H", "HT", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"].includes(String(status || "").toUpperCase()); }
function statusLabel(status) { const map = { NS: "شروع نشده", TBD: "زمان نامشخص", "1H": "نیمه اول", HT: "بین دو نیمه", "2H": "نیمه دوم", ET: "وقت اضافه", P: "پنالتی", BT: "بین دو وقت اضافه", LIVE: "در جریان", "IN PLAY": "در جریان", FT: "پایان بازی", AET: "پایان وقت اضافه", PEN: "پایان پنالتی" }; return map[status] || status || "—"; }
function eventMinute(e) { return `${e?.time?.elapsed ?? "—"}${e?.time?.extra ? `+${e.time.extra}` : ""}'`; }
function eventText(e) { return `${e?.type || ""} ${e?.detail || ""}`.toLowerCase(); }
function isCancelledGoal(e) { return e?.type === "Goal" && /cancel|cancelled|disallowed|var|مردود/i.test(eventText(e)); }
function isPenalty(e) { return /penalty|پنالتی/i.test(eventText(e)); }
function isMissedPenalty(e) { return /penalty.*(missed|saved)|missed.*penalty|پنالتی.*(از دست|مهار)/i.test(eventText(e)); }
function isRedCard(e) { return e?.type === "Card" && /red|second yellow|قرمز/i.test(String(e?.detail || "")); }
function isYellowCard(e) { return e?.type === "Card" && !isRedCard(e); }
function isSubstitution(e) { return e?.type === "subst" || /substitution|تعویض/i.test(String(e?.type || "")); }
function eventMeta(e) {
  if (isCancelledGoal(e)) return { icon: ShieldAlert, label: "گل مردود · VAR", tone: "text-violet-300", box: "border-violet-400/20 bg-violet-400/[.06]" };
  if (e?.type === "Goal" && isPenalty(e)) return { icon: Goal, label: "گل از روی پنالتی", tone: "text-emerald-300", box: "border-emerald-400/20 bg-emerald-400/[.06]" };
  if (e?.type === "Goal") return { icon: Goal, label: "گل", tone: "text-emerald-300", box: "border-emerald-400/20 bg-emerald-400/[.06]" };
  if (isMissedPenalty(e)) return { icon: Goal, label: "پنالتی از دست رفت", tone: "text-amber-300", box: "border-amber-400/20 bg-amber-400/[.05]" };
  if (isPenalty(e)) return { icon: Goal, label: "پنالتی", tone: "text-amber-300", box: "border-amber-400/20 bg-amber-400/[.05]" };
  if (isRedCard(e)) return { icon: CircleAlert, label: "کارت قرمز", tone: "text-rose-300", box: "border-rose-400/20 bg-rose-400/[.05]" };
  if (isYellowCard(e)) return { icon: CircleAlert, label: "کارت زرد", tone: "text-yellow-300", box: "border-yellow-400/20 bg-yellow-400/[.04]" };
  if (isSubstitution(e)) return { icon: Repeat2, label: "تعویض", tone: "text-sky-300", box: "border-sky-400/20 bg-sky-400/[.05]" };
  return { icon: Zap, label: e?.detail || e?.type || "رویداد", tone: "text-slate-300", box: "border-white/10 bg-white/[.025]" };
}

export default function MatchDetailPage({ params }) {
  const id = params?.id;
  const [section, setSection] = useState("events");
  const [fixture, setFixture] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (nextSection, silent = false) => {
    if (!id || String(id).startsWith("demo-")) { setLoading(false); return; }
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/football/fixture?id=${encodeURIComponent(id)}&section=${nextSection}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (payload.ok) {
        setDegraded(false); setError("");
        if (nextSection === "details") setFixture(payload.data?.fixture ?? payload.data ?? null);
        else setData(Array.isArray(payload.data) ? payload.data : []);
      } else {
        setDegraded(true);
        if (!silent) setError(payload.error || "اطلاعات این بخش موقتاً در دسترس نیست.");
        if (nextSection === "details") setFixture(null); else setData([]);
      }
    } catch {
      setDegraded(true);
      if (!silent) setError("ارتباط با سرویس فوتبال برقرار نشد. صفحه در حالت بدون داده ادامه می‌دهد.");
      if (nextSection === "details") setFixture(null); else setData([]);
    } finally { if (!silent) setLoading(false); }
  }, [id]);

  useEffect(() => { load("details"); }, [id, load]);
  useEffect(() => { if (section !== "details") load(section); }, [section, load]);

  const match = useMemo(() => fixture?.fixture ? fixture : fixture, [fixture]);
  const live = isLive(match?.fixture?.status?.short);
  useEffect(() => {
    if (!match || !live) return undefined;
    const timer = setInterval(() => {
      load("details", true);
      if (section !== "details") load(section, true);
    }, 15000);
    return () => clearInterval(timer);
  }, [match, live, section, load]);

  return <main className="fot-shell"><div className="fot-container space-y-4 pb-10">
    <header className="flex items-center gap-3"><Link href="/matches" className="glass h-10 w-10 rounded-xl grid place-items-center shrink-0" aria-label="بازگشت"><ArrowRight size={19} /></Link><div><h1 className="text-xl font-black">مرکز مسابقه</h1><p className="text-[11px] text-slate-500">اطلاعات، رویدادها و آمار واقعی مسابقه</p></div></header>
    {degraded && <FallbackBanner onRetry={() => load(section)} />}
    <MatchHeader match={match} loading={loading && !match} />
    <nav className="glass rounded-2xl p-1.5 grid grid-cols-5 gap-1 overflow-x-auto" aria-label="بخش‌های مسابقه">{tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setSection(key)} className={`rounded-xl px-2 py-3 text-[10px] font-bold whitespace-nowrap transition ${section === key ? "bg-emerald-400 text-slate-950 shadow-lg" : "text-slate-400 hover:bg-white/5"}`}><Icon size={15} className="mx-auto mb-1" />{label}</button>)}</nav>
    {error && !degraded && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-200">{error}</div>}
    <section className="space-y-3">{loading ? <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400"><Activity className="mx-auto mb-2 animate-pulse" size={20} />در حال بارگذاری…</div> : section === "events" ? <Events data={data} /> : section === "statistics" ? <Statistics data={data} /> : section === "lineups" ? <Lineups data={data} /> : section === "players" ? <Players data={data} /> : <Details data={fixture} />}</section>
  </div></main>;
}

function FallbackBanner({ onRetry }) { return <section className="glass rounded-2xl border border-amber-300/10 bg-amber-300/[.035] p-4 md:p-5"><div className="flex items-start gap-3"><div className="h-10 w-10 shrink-0 rounded-xl bg-amber-300/10 grid place-items-center"><WifiOff size={18} className="text-amber-300" /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-black text-amber-300">حالت پایدار FOT10</p><h2 className="mt-1 text-sm font-black">سرویس داده فوتبال فعلاً در دسترس نیست</h2><p className="mt-1 text-[10px] leading-5 text-slate-500">هیچ نتیجه یا رویداد ساختگی نمایش نمی‌دهیم. به محض برقرار شدن سرویس، اطلاعات واقعی دوباره دریافت می‌شود.</p></div><button onClick={onRetry} className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-white/10"><RefreshCw size={13} className="mx-auto mb-1" />تلاش مجدد</button></div></section>; }

function MatchHeader({ match, loading }) {
  if (loading) return <section className="glass rounded-3xl p-7"><div className="mx-auto max-w-sm space-y-4 text-center"><div className="h-3 w-32 mx-auto rounded bg-white/5 animate-pulse" /><div className="h-20 rounded-2xl bg-white/5 animate-pulse" /><p className="text-xs text-slate-500">در حال دریافت اطلاعات مسابقه…</p></div></section>;
  if (!match) return <section className="glass rounded-3xl p-7 md:p-10 text-center"><div className="mx-auto h-14 w-14 rounded-2xl bg-white/5 grid place-items-center"><WifiOff size={22} className="text-slate-500" /></div><h2 className="mt-4 font-black">اطلاعات مسابقه فعلاً قابل نمایش نیست</h2><p className="mt-2 text-[10px] text-slate-500">برای جلوگیری از نمایش اطلاعات نادرست، نتیجه و مشخصات مسابقه بدون تأیید منبع نشان داده نمی‌شود.</p></section>;
  const teams = match.teams; const goals = match.goals; const score = match.score; const live = isLive(match.fixture?.status?.short);
  return <section className="glass rounded-3xl p-5 md:p-7 overflow-hidden"><div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 mb-6"><span>{match.league?.name || "مسابقه فوتبال"}</span><span className={live ? "text-emerald-400 font-black" : "font-bold"}>{statusLabel(match.fixture?.status?.short)}</span></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-8"><TeamHero team={teams?.home} /><div className="text-center min-w-[92px]"><div className="text-3xl md:text-4xl font-black tracking-tight">{goals?.home ?? "—"} - {goals?.away ?? "—"}</div><div className={live ? "mt-2 text-[11px] font-black text-emerald-400" : "mt-2 text-[10px] text-slate-500"}>{match.fixture?.status?.elapsed ? `${match.fixture.status.elapsed}'` : formatDate(match.fixture?.date)}</div><div className="mt-1 text-[9px] text-slate-600">نیمه اول: {score?.halftime?.home ?? "—"} - {score?.halftime?.away ?? "—"}</div></div><TeamHero team={teams?.away} /></div>{live && <div className="mt-6 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 py-2.5 text-center text-[10px] font-bold text-emerald-300">● مسابقه زنده است · بروزرسانی خودکار هر ۱۵ ثانیه</div>}</section>;
}

function TeamHero({ team }) { if (!team) return <div className="text-center text-slate-500">—</div>; return <div className="text-center min-w-0"><Link href={`/teams/${team.id}`} className="inline-flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl bg-white/5 border border-white/5"><img src={team.logo} alt="" className="h-14 w-14 md:h-16 md:w-16 object-contain" /></Link><Link href={`/teams/${team.id}`} className="block mt-3 font-black text-sm md:text-base truncate hover:text-emerald-300">{team.name || "تیم"}</Link></div>; }
function Empty({ text }) { return <div className="glass rounded-2xl p-8 text-center"><div className="mx-auto h-11 w-11 rounded-xl bg-white/5 grid place-items-center"><WifiOff size={18} className="text-slate-600" /></div><p className="mt-3 text-xs text-slate-500">{text}</p></div>; }

function Events({ data }) {
  if (!Array.isArray(data) || !data.length) return <Empty text="هنوز رویدادی برای این مسابقه ثبت نشده است." />;
  const events = [...data].sort((a, b) => (Number(a?.time?.elapsed || 0) * 100 + Number(a?.time?.extra || 0)) - (Number(b?.time?.elapsed || 0) * 100 + Number(b?.time?.extra || 0)));
  return <div className="space-y-2">{events.map((e, index) => { const meta = eventMeta(e); const Icon = meta.icon; return <div key={`${e?.time?.elapsed}-${e?.team?.id}-${index}`} className={`rounded-2xl border p-3 ${meta.box}`}><div className="flex items-center gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/10 ${meta.tone}`}><Icon size={16}/></div><div className="min-w-0 flex-1"><div className={`text-[10px] font-black ${meta.tone}`}>{meta.label}</div><div className="mt-1 truncate text-[11px] font-bold text-slate-300">{e?.player?.name || e?.assist?.name || e?.detail || "رویداد مسابقه"}</div></div><div className="text-[11px] font-black tabular-nums text-slate-500">{eventMinute(e)}</div></div></div>; })}</div>;
}

function Statistics({ data }) { if (!Array.isArray(data) || !data.length) return <Empty text="آمار لحظه‌ای این مسابقه هنوز از منبع داده دریافت نشده است." />; return <div className="space-y-3">{data.map((team, index) => <div key={team?.team?.id || index} className="glass rounded-2xl p-4"><div className="mb-3 flex items-center gap-2"><img src={team?.team?.logo || ""} alt="" className="h-7 w-7 object-contain"/><b className="text-xs">{team?.team?.name || `تیم ${index + 1}`}</b></div><div className="space-y-2">{(team?.statistics || []).map((stat) => <div key={stat?.type} className="flex items-center justify-between gap-3 text-[10px]"><span className="text-slate-500">{stat?.type || "—"}</span><b className="text-slate-200 tabular-nums">{stat?.value ?? "—"}</b></div>)}</div></div>)}</div>; }
function Lineups({ data }) { if (!Array.isArray(data) || !data.length) return <Empty text="ترکیب این مسابقه هنوز در دسترس نیست." />; return <div className="grid gap-3 md:grid-cols-2">{data.map((team, index) => <div key={team?.team?.id || index} className="glass rounded-2xl p-4"><div className="flex items-center gap-2 mb-3"><img src={team?.team?.logo || ""} alt="" className="h-7 w-7 object-contain"/><b className="text-xs">{team?.team?.name || `تیم ${index + 1}`}</b></div><div className="space-y-1">{(team?.startXI || []).slice(0, 11).map((p, i) => <div key={p?.player?.id || i} className="flex justify-between rounded-lg bg-white/[.02] px-2 py-1.5 text-[9px]"><span>{p?.player?.name || "بازیکن"}</span><span className="text-slate-600">{p?.player?.number ?? "—"}</span></div>)}</div></div>)}</div>; }
function Players({ data }) { if (!Array.isArray(data) || !data.length) return <Empty text="اطلاعات بازیکنان این مسابقه هنوز در دسترس نیست." />; return <div className="space-y-2">{data.map((team, index) => <div key={team?.team?.id || index} className="glass rounded-2xl p-4"><b className="text-xs">{team?.team?.name || `تیم ${index + 1}`}</b><div className="mt-3 grid grid-cols-2 gap-2">{(team?.players || []).map((p, i) => <div key={p?.player?.id || i} className="rounded-xl bg-white/[.025] p-2 text-[9px]"><div className="font-bold">{p?.player?.name || "بازیکن"}</div><div className="mt-1 text-slate-600">{p?.statistics?.[0]?.games?.minutes ? `${p.statistics[0].games.minutes} دقیقه` : ""}</div></div>)}</div></div>)}</div>; }
function Details({ data }) { const fixture = data?.fixture; if (!fixture) return <Empty text="جزئیات مسابقه در دسترس نیست." />; return <div className="glass rounded-2xl p-4 space-y-2 text-[10px] text-slate-400"><div className="flex justify-between"><span>ورزشگاه</span><b className="text-slate-200">{fixture?.venue?.name || "—"}</b></div><div className="flex justify-between"><span>شهر</span><b className="text-slate-200">{fixture?.venue?.city || "—"}</b></div><div className="flex justify-between"><span>داور</span><b className="text-slate-200">{fixture?.referee || "—"}</b></div><div className="flex justify-between"><span>زمان</span><b className="text-slate-200">{formatDate(fixture?.date)}</b></div></div>; }
