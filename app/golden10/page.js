"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Crown, Heart, Save, Sparkles, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const fallbackPlayers = [
  { team: "ایتالیا", name: "روبرتو باجو", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Roberto_Baggio_cropped.jpg", memoryTitle: "پنالتی ۱۹۹۴", memory: "شماره ۱۰ ایتالیا در جام جهانی ۱۹۹۴ و یکی از ماندگارترین لحظه‌های فوتبال." },
  { team: "آرژانتین", name: "دیه‌گو مارادونا", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diego_Maradona_2012.jpg", memoryTitle: "مکزیک ۱۹۸۶", memory: "شماره ۱۰ آرژانتین و نماد جام جهانی ۱۹۸۶." },
  { team: "برزیل", name: "پله", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pele_con_brasil_(cropped).jpg", memoryTitle: "۱۰ جاودانه", memory: "یکی از نمادین‌ترین شماره‌های ۱۰ تاریخ فوتبال برزیل." },
  { team: "فرانسه", name: "زین‌الدین زیدان", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Zinedine_Zidane_2008.jpg", memoryTitle: "فرانسه ۱۹۹۸", memory: "شماره ۱۰ فرانسه و قهرمان جام جهانی ۱۹۹۸." },
  { team: "بارسلونا", name: "رونالدینیو", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ronaldinho_2006.jpg", memoryTitle: "جادوی نیوکمپ", memory: "یکی از ماندگارترین شماره‌های ۱۰ بارسلونا." },
];

export default function Golden10Page() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [catalog, setCatalog] = useState(fallbackPlayers);
  const [selectedTeam, setSelectedTeam] = useState("ایتالیا");
  const [selectedPlayer, setSelectedPlayer] = useState(fallbackPlayers[0]);
  const [golden, setGolden] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const teams = useMemo(() => [...new Set(catalog.map((p) => p.team))], [catalog]);
  const teamPlayers = useMemo(() => catalog.filter((p) => p.team === selectedTeam && p.number === 10), [catalog, selectedTeam]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.from("fot10_golden10_catalog").select("team_name,player_name,shirt_number,player_image,era,memory_title,memory_text").eq("shirt_number", 10).order("team_name").order("player_name").then(({ data, error: loadError }) => {
      if (!active) return;
      if (!loadError && data?.length) {
        const next = data.map((p) => ({ team: p.team_name, name: p.player_name, number: p.shirt_number, era: p.era, image: p.player_image, memoryTitle: p.memory_title, memory: p.memory_text }));
        setCatalog(next);
        if (!next.some((p) => p.team === selectedTeam)) setSelectedTeam(next[0].team);
        setSelectedPlayer(next.find((p) => p.team === selectedTeam) || next[0]);
      }
    });
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    const local = loadLocal();
    if (local) setGolden(local);
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      setUser(data.user);
      const { data: row, error: loadError } = await supabase.from("fot10_golden_tens").select("id,team_name,player_name,player_image,era,shirt_number,memory_title,memory_text,created_at").eq("user_id", data.user.id).maybeSingle();
      if (!loadError && row) setGolden({ ...row, number: 10, memoryTitle: row.memory_title, memory: row.memory_text });
    });
    return () => { active = false; };
  }, [supabase]);

  function loadLocal() { try { return JSON.parse(localStorage.getItem("fot10-golden10") || "null"); } catch { return null; } }
  function chooseTeam(value) { setSelectedTeam(value); const first = catalog.find((p) => p.team === value && p.number === 10); if (first) setSelectedPlayer(first); }
  function choosePlayer(value) { const next = teamPlayers.find((p) => p.name === value); if (next) setSelectedPlayer(next); }

  async function saveGolden() {
    if (!selectedPlayer || selectedPlayer.number !== 10) return;
    setBusy(true); setError(""); setMessage("");
    const row = { team_name: selectedPlayer.team, player_name: selectedPlayer.name, player_image: selectedPlayer.image, era: selectedPlayer.era === "current" ? "current" : "legend", shirt_number: 10, memory_title: selectedPlayer.memoryTitle, memory_text: selectedPlayer.memory };
    if (!user) {
      const next = { id: `guest-${Date.now()}`, ...row, number: 10, memoryTitle: selectedPlayer.memoryTitle, memory: selectedPlayer.memory };
      localStorage.setItem("fot10-golden10", JSON.stringify(next)); setGolden(next); setMessage("۱۰ طلایی تو ذخیره شد ✓"); setBusy(false); return;
    }
    const { data, error: saveError } = await supabase.from("fot10_golden_tens").upsert({ user_id: user.id, ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("id,team_name,player_name,player_image,era,shirt_number,memory_title,memory_text,created_at").single();
    if (saveError) setError(saveError.message); else { setGolden({ ...data, number: 10, memoryTitle: data.memory_title, memory: data.memory_text }); setMessage("۱۰ طلایی تو ذخیره شد ✓"); }
    setBusy(false);
  }

  async function removeGolden() {
    setBusy(true); setError("");
    if (user && golden?.id && !String(golden.id).startsWith("guest-")) {
      const { error: removeError } = await supabase.from("fot10_golden_tens").delete().eq("id", golden.id).eq("user_id", user.id);
      if (removeError) { setError(removeError.message); setBusy(false); return; }
    }
    localStorage.removeItem("fot10-golden10"); setGolden(null); setMessage("۱۰ طلایی حذف شد."); setBusy(false);
  }

  const displayPlayer = golden || selectedPlayer;

  return (
    <main className="fot-shell min-h-screen">
      <div className="fot-container pb-12 space-y-4">
        <header className="flex items-center justify-between pt-1">
          <a href="/account" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">← حساب من</a>
          <div className="text-right"><div className="text-[10px] text-amber-300 font-bold">FOT10 SIGNATURE</div><h1 className="text-xl font-black">۱۰ طلایی من</h1></div>
        </header>
        <section className="glass card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-300/10 via-transparent to-emerald-400/10" />
          <div className="relative h-[390px] overflow-hidden bg-slate-950">
            <img src={displayPlayer.image} alt={displayPlayer.name} className="absolute inset-0 h-full w-full object-cover object-top opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute top-5 right-5 h-24 w-24 rounded-full border border-amber-200/40 bg-black/20 backdrop-blur-md grid place-items-center"><span className="text-6xl leading-none font-black italic text-amber-200">10</span></div>
            <div className="absolute bottom-0 inset-x-0 p-5"><div className="flex items-end justify-between gap-3"><div><div className="text-[11px] text-amber-200 font-black">۱۰ طلایی من • {displayPlayer.team}</div><h2 className="text-3xl font-black mt-1">{displayPlayer.name}</h2><div className="text-xs text-slate-300 mt-2">شماره ۱۰ • {displayPlayer.era}</div></div><div className="h-16 w-16 rounded-2xl border border-amber-200/30 bg-amber-200/10 grid place-items-center text-amber-200 font-black text-2xl">10</div></div></div>
          </div>
          <div className="relative p-4 border-t border-white/5"><div className="flex gap-3"><Crown size={18} className="text-amber-300 mt-0.5 shrink-0"/><div><div className="text-xs font-black text-amber-100">{displayPlayer.memoryTitle || "خاطره شماره ۱۰"}</div><p className="text-[11px] leading-6 text-slate-300 mt-1">{displayPlayer.memory || "شماره ۱۰ انتخابی تو در FOT10."}</p></div></div></div>
        </section>
        <section className="glass card p-5 space-y-4">
          <div className="flex items-center gap-2"><Sparkles size={17} className="text-amber-300"/><div><h2 className="font-black">یک ۱۰ طلایی انتخاب کن</h2><p className="text-[10px] text-slate-500 mt-1">فقط بازیکنانی که در همین تیم شماره ۱۰ پوشیده‌اند.</p></div></div>
          <label className="block"><span className="text-[10px] text-slate-500 block mb-2">تیم / کشور</span><select value={selectedTeam} onChange={(e) => chooseTeam(e.target.value)} className="glass w-full rounded-2xl py-3.5 px-4 outline-none text-sm bg-transparent">{teams.map((team) => <option key={team} value={team} className="bg-slate-900">۱۰ {team}</option>)}</select></label>
          <label className="block"><span className="text-[10px] text-slate-500 block mb-2">بازیکن</span><select value={selectedPlayer.name} onChange={(e) => choosePlayer(e.target.value)} className="glass w-full rounded-2xl py-3.5 px-4 outline-none text-sm bg-transparent">{teamPlayers.map((player) => <option key={player.name} value={player.name} className="bg-slate-900">{player.name} • ۱۰</option>)}</select></label>
          <button disabled={busy || !selectedPlayer} onClick={saveGolden} className="w-full rounded-2xl bg-amber-300 text-slate-950 py-3.5 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Save size={17}/> انتخاب همین ۱۰</button>
          {golden && <button disabled={busy} onClick={removeGolden} className="w-full rounded-2xl border border-rose-400/15 bg-rose-400/[.04] text-rose-300 py-3 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"><Trash2 size={15}/> حذف ۱۰ طلایی</button>}
          {(message || error) && <div className={`rounded-2xl p-3 text-xs font-bold ${error ? "border border-rose-400/20 bg-rose-400/[.06] text-rose-200" : "border border-amber-300/10 bg-amber-300/[.05] text-amber-100"}`}>{error || message}</div>}
        </section>
        <section className="glass card p-5"><div className="flex items-center gap-3"><Heart size={18} className="text-rose-300"/><div><h2 className="font-black">قانون ۱۰ طلایی FOT10</h2><p className="text-[10px] text-slate-500 mt-1">فقط عدد ۱۰ ملاک است؛ اسم بازیکن مهم نیست. هر کاربر فقط یک انتخاب دارد.</p></div></div></section>
      </div>
    </main>
  );
}
