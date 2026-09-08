"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Heart, Search, Star, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function FavoritesPage() {
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function load() {
      const local = readLocal();
      if (active) {
        setTeams(local.favorites);
        setLeagues(local.favoriteLeagues);
      }
      if (!supabase) { if (active) setReady(true); return; }
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!active) return;
        if (auth?.user) {
          setSignedIn(true);
          const { data, error } = await supabase.from("fot10_favorites").select("item_type,item_name").eq("user_id", auth.user.id);
          if (error) throw error;
          const cloudTeams = Array.isArray(data) ? data.filter(x => x.item_type === "team").map(x => x.item_name).filter(Boolean) : [];
          const cloudLeagues = Array.isArray(data) ? data.filter(x => x.item_type === "league").map(x => x.item_name).filter(Boolean) : [];
          if (cloudTeams.length || cloudLeagues.length) {
            setTeams(cloudTeams);
            setLeagues(cloudLeagues);
            writeLocal({ favorites: cloudTeams, favoriteLeagues: cloudLeagues });
          }
        }
      } catch {
        setMessage("همگام‌سازی ابری در دسترس نبود؛ علاقه‌مندی‌های گوشی نمایش داده شد.");
      } finally { if (active) setReady(true); }
    }
    load();
    return () => { active = false; };
  }, []);

  function readLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem("fot10-profile") || "{}");
      return { favorites: Array.isArray(raw.favorites) ? raw.favorites : [], favoriteLeagues: Array.isArray(raw.favoriteLeagues) ? raw.favoriteLeagues : [] };
    } catch { return { favorites: [], favoriteLeagues: [] }; }
  }

  function writeLocal(next) {
    try {
      const raw = JSON.parse(localStorage.getItem("fot10-profile") || "{}");
      localStorage.setItem("fot10-profile", JSON.stringify({ ...raw, ...next }));
    } catch {}
  }

  async function removeTeam(name) {
    const next = teams.filter(item => item !== name);
    setTeams(next); writeLocal({ favorites: next }); await removeCloud("team", name);
  }

  async function removeLeague(name) {
    const next = leagues.filter(item => item !== name);
    setLeagues(next); writeLocal({ favoriteLeagues: next }); await removeCloud("league", name);
  }

  async function removeCloud(type, name) {
    if (!signedIn) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSyncing(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        const { error } = await supabase.from("fot10_favorites").delete().eq("user_id", auth.user.id).eq("item_type", type).eq("item_name", name);
        if (error) throw error;
      }
    } catch { setMessage("حذف روی فضای ابری انجام نشد؛ اطلاعات گوشی همچنان به‌روز است."); }
    finally { setSyncing(false); }
  }

  const total = teams.length + leagues.length;

  return <main className="fot-shell min-h-screen"><div className="fot-container space-y-4 pb-10">
    <header className="flex items-center justify-between pt-1"><Link href="/" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">خانه ←</Link><div className="text-right"><div className="text-[10px] text-emerald-300 font-bold">FOT10</div><h1 className="text-xl font-black">علاقه‌مندی‌های من</h1></div></header>
    <section className="glass card relative overflow-hidden p-5"><div className="absolute -left-14 -top-14 h-40 w-40 rounded-full bg-rose-400/10 blur-3xl"/><div className="relative flex items-center gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-rose-400/10 text-rose-300 ring-1 ring-rose-300/10"><Heart size={29} fill="currentColor"/></div><div><p className="text-[10px] font-bold text-rose-300">شخصی‌سازی FOT10</p><h2 className="mt-1 text-2xl font-black">انتخاب‌های تو</h2><p className="mt-1 text-[10px] text-slate-500">تیم‌ها و لیگ‌های محبوبت را یک‌جا دنبال کن.</p></div></div><div className="mt-5 grid grid-cols-3 gap-2"><Stat n={total} t="مورد ذخیره‌شده"/><Stat n={teams.length} t="تیم"/><Stat n={leagues.length} t="لیگ"/></div></section>
    {message && <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[.05] p-3 text-[10px] leading-5 text-amber-200">{message}</div>}
    {syncing && <div className="text-center text-[9px] text-emerald-300">در حال همگام‌سازی…</div>}
    {!ready ? <div className="glass rounded-2xl p-8 text-center text-xs text-slate-500">در حال بارگذاری…</div> : total === 0 ? <section className="glass card p-8 text-center"><Heart className="mx-auto text-slate-600" size={30}/><h2 className="mt-3 font-black">هنوز چیزی ذخیره نکرده‌ای</h2><p className="mt-2 text-[10px] leading-5 text-slate-500">از صفحه حساب من تیم‌ها و لیگ‌های محبوبت را انتخاب کن.</p><Link href="/account" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-xs font-black text-slate-950">رفتن به حساب من <ArrowRight size={14}/></Link></section> : <>
      {teams.length > 0 && <FavoriteSection title="تیم‌های محبوب" icon={Users}>{teams.map(name => <FavoriteCard key={`team-${name}`} name={name} type="team" href={`/teams?search=${encodeURIComponent(name)}`} onRemove={() => removeTeam(name)}/>)}</FavoriteSection>}
      {leagues.length > 0 && <FavoriteSection title="لیگ‌های محبوب" icon={Trophy}>{leagues.map(name => <FavoriteCard key={`league-${name}`} name={name} type="league" href={`/leagues?search=${encodeURIComponent(name)}`} onRemove={() => removeLeague(name)}/>)}</FavoriteSection>}
    </>}
    <Link href="/account" className="glass flex items-center justify-between rounded-2xl p-4 text-xs font-black"><span className="flex items-center gap-2"><Star size={16} className="text-yellow-300"/> مدیریت علاقه‌مندی‌ها</span><ArrowRight size={15}/></Link>
    <div className="glass rounded-2xl p-4 text-[10px] leading-5 text-slate-600">{signedIn ? "علاقه‌مندی‌های حساب به‌صورت ابری از Supabase خوانده و حذف‌ها با حساب همگام می‌شوند." : "حالت مهمان روی همین گوشی ذخیره می‌شود. پس از ورود به حساب، علاقه‌مندی‌ها برای همگام‌سازی ابری FOT10 آماده‌اند."}</div>
  </div></main>;
}
function Stat({ n, t }) { return <div className="rounded-2xl bg-white/[.03] p-3 text-center"><div className="text-lg font-black">{n}</div><div className="text-[9px] font-bold text-slate-600">{t}</div></div>; }
function FavoriteSection({ title, icon: Icon, children }) { return <section className="glass card p-5"><div className="mb-4 flex items-center gap-2"><Icon size={18} className="text-emerald-300"/><h2 className="font-black">{title}</h2></div><div className="space-y-2">{children}</div></section>; }
function FavoriteCard({ name, type, href, onRemove }) { return <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.025] p-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5">{type === "team" ? <Users size={19} className="text-cyan-300"/> : <Trophy size={19} className="text-yellow-300"/>}</div><Link href={href} className="min-w-0 flex-1"><div className="truncate text-sm font-black">{name}</div><div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-600"><Search size={11}/> مشاهده</div></Link><button onClick={onRemove} className="rounded-xl bg-rose-400/10 px-3 py-2 text-[9px] font-black text-rose-300" aria-label={`حذف ${name}`}>حذف</button></div>; }
