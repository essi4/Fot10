"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Heart, LogIn, Trophy, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

const fallbackTeams = ["پرسپولیس", "رئال مادرید"];

export default function ForYouSection({ matches, onOpen }) {
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      let teamNames = [];
      let leagueNames = [];
      try {
        const profile = JSON.parse(window.localStorage.getItem("fot10-profile") || "null");
        if (Array.isArray(profile?.favorites)) teamNames = profile.favorites;
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: auth } = await supabase.auth.getUser();
          if (auth?.user) {
            setSignedIn(true);
            const { data } = await supabase
              .from("fot10_favorites")
              .select("item_type,item_name")
              .eq("user_id", auth.user.id);
            if (Array.isArray(data)) {
              teamNames = data.filter(x => x.item_type === "team").map(x => x.item_name);
              leagueNames = data.filter(x => x.item_type === "league").map(x => x.item_name);
            }
          }
        }
      } catch {}
      if (!active) return;
      setTeams([...new Set(teamNames)].filter(Boolean));
      setLeagues([...new Set(leagueNames)].filter(Boolean));
      setReady(true);
    }
    load();
    return () => { active = false; };
  }, []);

  if (!ready) return null;

  const preferredTeams = teams.length ? teams : fallbackTeams;
  const related = matches.filter(m => preferredTeams.includes(m.home) || preferredTeams.includes(m.away) || leagues.includes(m.league));
  const shown = related.length ? related.slice(0, 3) : matches.slice(0, 2);

  return (
    <section className="glass card p-4 overflow-hidden relative">
      <div className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-400/10 text-emerald-300 grid place-items-center"><Heart size={17} fill="currentColor" /></div>
              <h2 className="font-black text-lg">برای تو</h2>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">بر اساس تیم‌ها و لیگ‌های مورد علاقه‌ات</p>
          </div>
          <span className="text-[9px] rounded-full px-2.5 py-1 bg-emerald-400/10 text-emerald-300 font-bold">{signedIn ? "همگام‌سازی شده" : "مهمان"}</span>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-3">
          {preferredTeams.map(team => <span key={team} className="shrink-0 rounded-full bg-white/[.05] border border-white/5 px-3 py-1.5 text-[10px] font-bold">★ {team}</span>)}
          {leagues.slice(0, 3).map(league => <span key={league} className="shrink-0 rounded-full bg-white/[.05] border border-white/5 px-3 py-1.5 text-[10px] font-bold"><Trophy size={11} className="inline mr-1 text-emerald-300" />{league}</span>)}
        </div>

        <div className="space-y-2">
          {shown.map(match => (
            <button key={match.id} onClick={() => onOpen(match)} className="w-full rounded-2xl bg-white/[.035] border border-white/5 p-3 flex items-center gap-3 text-right active:scale-[.99] transition">
              <div className="min-w-0 flex-1"><div className="text-[9px] text-slate-500">{match.league}</div><div className="text-xs font-black mt-1 truncate">{match.home} <span className="text-slate-600">—</span> {match.away}</div></div>
              <div className="text-center shrink-0"><div className="text-xs font-black">{match.time}</div><div className="text-[9px] text-slate-500 mt-1">{match.status}</div></div>
              <ChevronLeft size={15} className="text-slate-500 shrink-0" />
            </button>
          ))}
        </div>

        {!signedIn && <a href="/account" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 text-slate-950 py-2.5 text-[10px] font-black"><LogIn size={14} /> ورود برای ذخیره علاقه‌مندی‌ها روی همه دستگاه‌ها</a>}
        {signedIn && <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-slate-500"><UserRound size={13} /> علاقه‌مندی‌ها از حساب FOT10 خوانده می‌شوند</div>}
      </div>
    </section>
  );
}
