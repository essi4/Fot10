"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Crown, Heart, Save, Sparkles, Trash2, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const players = [
  {
    team: "ایتالیا",
    name: "روبرتو باجو",
    number: 10,
    era: "1990–1998",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Roberto_Baggio_cropped.jpg",
    memory: "جام جهانی ۱۹۹۴؛ شماره ۱۰ ایتالیا و آن پنالتی ماندگار فینال مقابل برزیل.",
  },
  {
    team: "آرژانتین",
    name: "دیه‌گو مارادونا",
    number: 10,
    era: "1986–1994",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diego_Maradona_2012.jpg",
    memory: "اسطوره شماره ۱۰ آرژانتین و نماد جام جهانی ۱۹۸۶.",
  },
  {
    team: "برزیل",
    name: "پله",
    number: 10,
    era: "1958–1970",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pele_con_brasil_(cropped).jpg",
    memory: "یکی از ماندگارترین شماره‌های ۱۰ تاریخ فوتبال برزیل.",
  },
  {
    team: "ایران",
    name: "علی دایی",
    number: 10,
    era: "ایران",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ali_Daei.jpg",
    memory: "یکی از چهره‌های ماندگار فوتبال ملی ایران.",
  },
  {
    team: "فرانسه",
    name: "زین‌الدین زیدان",
    number: 10,
    era: "1994–2006",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Zinedine_Zidane_2008.jpg",
    memory: "شماره ۱۰ خلاق فرانسه و قهرمان جهان ۱۹۹۸.",
  },
  {
    team: "بارسلونا",
    name: "رونالدینیو",
    number: 10,
    era: "2003–2008",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ronaldinho_2006.jpg",
    memory: "لبخند، دریبل و جادوی شماره ۱۰ در بارسلونا.",
  },
];

const teams = [...new Set(players.map((player) => player.team))];

export default function Golden10Page() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState("ایتالیا");
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]);
  const [golden, setGolden] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const local = loadLocal();
    if (local) setGolden(local);
    if (!supabase) return;

    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (data.user) {
        setUser(data.user);
        await loadCloud(data.user.id);
      }
    });
    return () => { active = false; };
  }, [supabase]);

  const teamPlayers = players.filter((player) => player.team === selectedTeam);

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem("fot10-golden10") || "null");
    } catch {
      return null;
    }
  }

  async function loadCloud(userId) {
    setBusy(true);
    const { data, error: loadError } = await supabase
      .from("fot10_golden_tens")
      .select("id,team_name,player_name,player_image,era,created_at")
      .eq("user_id", userId)
      .maybeSingle();
    setBusy(false);
    if (loadError) return setError(loadError.message);
    if (data) {
      const match = players.find((item) => item.name === data.player_name && item.team === data.team_name);
      setGolden({
        ...data,
        player_image: data.player_image || match?.image,
        number: match?.number || 10,
        memory: match?.memory || "۱۰ طلایی انتخاب‌شده توسط کاربر",
      });
    }
  }

  function chooseTeam(value) {
    setSelectedTeam(value);
    const first = players.find((player) => player.team === value);
    if (first) setSelectedPlayer(first);
  }

  function choosePlayer(value) {
    const next = players.find((player) => player.name === value);
    if (next) setSelectedPlayer(next);
  }

  async function saveGolden() {
    setBusy(true);
    setError("");
    setMessage("");

    const row = {
      team_name: selectedPlayer.team,
      player_name: selectedPlayer.name,
      player_image: selectedPlayer.image,
      era: "legend",
    };

    if (!user) {
      const next = { id: `guest-${Date.now()}`, ...row, number: selectedPlayer.number, memory: selectedPlayer.memory };
      localStorage.setItem("fot10-golden10", JSON.stringify(next));
      setGolden(next);
      setMessage("۱۰ طلایی تو ذخیره شد ✓");
      setBusy(false);
      return;
    }

    const { data, error: saveError } = await supabase
      .from("fot10_golden_tens")
      .upsert({ user_id: user.id, ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select("id,team_name,player_name,player_image,era,created_at")
      .single();

    if (saveError) {
      setError(saveError.message);
    } else {
      setGolden({ ...data, number: selectedPlayer.number, memory: selectedPlayer.memory });
      setMessage("۱۰ طلایی تو ذخیره شد ✓");
    }
    setBusy(false);
  }

  async function removeGolden() {
    setBusy(true);
    setError("");
    if (user && golden?.id && !String(golden.id).startsWith("guest-")) {
      const { error: removeError } = await supabase
        .from("fot10_golden_tens")
        .delete()
        .eq("id", golden.id)
        .eq("user_id", user.id);
      if (removeError) {
        setError(removeError.message);
        setBusy(false);
        return;
      }
    }
    localStorage.removeItem("fot10-golden10");
    setGolden(null);
    setMessage("۱۰ طلایی حذف شد.");
    setBusy(false);
  }

  const displayPlayer = golden || selectedPlayer;

  return (
    <main className="fot-shell min-h-screen">
      <div className="fot-container pb-12 space-y-4">
        <header className="flex items-center justify-between pt-1">
          <a href="/account" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">← حساب من</a>
          <div className="text-right">
            <div className="text-[10px] text-amber-300 font-bold">FOT10 SIGNATURE</div>
            <h1 className="text-xl font-black">۱۰ طلایی من</h1>
          </div>
        </header>

        <section className="glass card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-300/10 via-transparent to-emerald-400/10" />
          <div className="relative h-[390px] overflow-hidden bg-slate-950">
            <img src={displayPlayer.image} alt={displayPlayer.name} className="absolute inset-0 h-full w-full object-cover object-top opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute top-5 right-5 h-24 w-24 rounded-full border border-amber-200/40 bg-black/20 backdrop-blur-md grid place-items-center">
              <span className="text-6xl leading-none font-black italic text-amber-200">10</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] text-amber-200 font-black">۱۰ طلایی من • {displayPlayer.team}</div>
                  <h2 className="text-3xl font-black mt-1">{displayPlayer.name}</h2>
                  <div className="text-xs text-slate-300 mt-2">شماره {displayPlayer.number} • {displayPlayer.era}</div>
                </div>
                <div className="h-16 w-16 rounded-2xl border border-amber-200/30 bg-amber-200/10 grid place-items-center text-amber-200 font-black text-2xl">10</div>
              </div>
            </div>
          </div>
          <div className="relative p-4 border-t border-white/5">
            <div className="flex gap-3"><Crown size={18} className="text-amber-300 mt-0.5 shrink-0"/><p className="text-[11px] leading-6 text-slate-300">{displayPlayer.memory}</p></div>
          </div>
        </section>

        <section className="glass card p-5 space-y-4">
          <div className="flex items-center gap-2"><Sparkles size={17} className="text-amber-300"/><div><h2 className="font-black">یک ۱۰ طلایی انتخاب کن</h2><p className="text-[10px] text-slate-500 mt-1">فقط یک بازیکن؛ امضای فوتبالی شخصی تو در FOT10.</p></div></div>

          <label className="block">
            <span className="text-[10px] text-slate-500 block mb-2">تیم / کشور</span>
            <select value={selectedTeam} onChange={(event) => chooseTeam(event.target.value)} className="glass w-full rounded-2xl py-3.5 px-4 outline-none text-sm bg-transparent">
              {teams.map((team) => <option key={team} value={team} className="bg-slate-900">۱۰ {team}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] text-slate-500 block mb-2">بازیکن شماره ۱۰</span>
            <select value={selectedPlayer.name} onChange={(event) => choosePlayer(event.target.value)} className="glass w-full rounded-2xl py-3.5 px-4 outline-none text-sm bg-transparent">
              {teamPlayers.map((player) => <option key={player.name} value={player.name} className="bg-slate-900">{player.name} • شماره {player.number}</option>)}
            </select>
          </label>

          <button disabled={busy} onClick={saveGolden} className="w-full rounded-2xl bg-amber-300 text-slate-950 py-3.5 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Save size={17}/> انتخاب همین ۱۰</button>
          {golden && <button disabled={busy} onClick={removeGolden} className="w-full rounded-2xl border border-rose-400/15 bg-rose-400/[.04] text-rose-300 py-3 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"><Trash2 size={15}/> حذف ۱۰ طلایی</button>}
          {(message || error) && <div className={`rounded-2xl p-3 text-xs font-bold ${error ? "border border-rose-400/20 bg-rose-400/[.06] text-rose-200" : "border border-amber-300/10 bg-amber-300/[.05] text-amber-100"}`}>{error || message}</div>}
        </section>

        <section className="glass card p-5">
          <div className="flex items-center gap-3"><Heart size={18} className="text-rose-300"/><div><h2 className="font-black">قانون ۱۰ طلایی FOT10</h2><p className="text-[10px] text-slate-500 mt-1">هر کاربر فقط یک ۱۰ طلایی دارد. انتخاب جدید، انتخاب قبلی را جایگزین می‌کند.</p></div></div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[.035] p-3"><UserRound size={18} className="text-emerald-300"/><span className="text-[10px] leading-5 text-slate-400">می‌توانی بگویی «۱۰ ایتالیا بده» و روبرتو باجو را انتخاب کنی؛ کارت اختصاصی او با عکس، شماره ۱۰ و خاطره فوتبالی نمایش داده می‌شود.</span></div>
        </section>

        <div className="text-[9px] text-slate-600 px-1">تصویرهای نمونه از Wikimedia Commons استفاده می‌شوند و اعتبار/مجوز هر فایل در منبع اصلی آن مشخص است.</div>
      </div>
    </main>
  );
}
