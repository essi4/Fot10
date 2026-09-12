"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Heart, Search, Shield, SlidersHorizontal, Sparkles, Star, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const fallbackPlayers = [
  { team: "ایتالیا", country: "ایتالیا", type: "national", name: "روبرتو باجو", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Roberto_Baggio_cropped.jpg", memoryTitle: "پنالتی ۱۹۹۴", memory: "شماره ۱۰ ایتالیا در جام جهانی ۱۹۹۴ و یکی از ماندگارترین لحظه‌های فوتبال." },
  { team: "آرژانتین", country: "آرژانتین", type: "national", name: "دیه‌گو مارادونا", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diego_Maradona_2012.jpg", memoryTitle: "مکزیک ۱۹۸۶", memory: "شماره ۱۰ آرژانتین و نماد جام جهانی ۱۹۸۶." },
  { team: "برزیل", country: "برزیل", type: "national", name: "پله", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pele_con_brasil_(cropped).jpg", memoryTitle: "۱۰ جاودانه", memory: "یکی از نمادین‌ترین شماره‌های ۱۰ تاریخ فوتبال برزیل." },
  { team: "فرانسه", country: "فرانسه", type: "national", name: "زین‌الدین زیدان", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Zinedine_Zidane_2008.jpg", memoryTitle: "فرانسه ۱۹۹۸", memory: "شماره ۱۰ فرانسه و قهرمان جام جهانی ۱۹۹۸." },
  { team: "بارسلونا", country: "اسپانیا", type: "club", name: "رونالدینیو", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ronaldinho_2006.jpg", memoryTitle: "جادوی نیوکمپ", memory: "یکی از ماندگارترین شماره‌های ۱۰ بارسلونا." },
];

const NATIONAL_TEAMS = new Set(["ایران", "آرژانتین", "برزیل", "فرانسه", "ایتالیا", "اسپانیا", "آلمان", "انگلیس", "هلند", "پرتغال", "بلژیک", "کرواسی", "اروگوئه", "مکزیک", "کلمبیا", "شیلی", "ژاپن", "کره جنوبی", "آمریکا", "سوئیس", "دانمارک", "سوئد", "صربستان", "لهستان", "سنگال", "مراکش", "کامرون", "نیجریه", "مصر", "پرو", "رومانی", "مجارستان", "غنا"]);

const COUNTRY_CODES = {
  "ایران": "ir", "آرژانتین": "ar", "برزیل": "br", "فرانسه": "fr", "ایتالیا": "it", "اسپانیا": "es", "آلمان": "de", "انگلیس": "gb", "هلند": "nl", "پرتغال": "pt", "بلژیک": "be", "کرواسی": "hr", "اروگوئه": "uy", "مکزیک": "mx", "کلمبیا": "co", "شیلی": "cl", "ژاپن": "jp", "کره جنوبی": "kr", "آمریکا": "us", "سوئیس": "ch", "دانمارک": "dk", "سوئد": "se", "صربستان": "rs", "لهستان": "pl", "سنگال": "sn", "مراکش": "ma", "کامرون": "cm", "نیجریه": "ng", "مصر": "eg", "پرو": "pe", "رومانی": "ro", "مجارستان": "hu", "غنا": "gh", "اسکاتلند": "gb-sct", "ولز": "gb-wls", "ترکیه": "tr", "اوکراین": "ua", "روسیه": "ru", "اتریش": "at", "چک": "cz", "اسلواکی": "sk", "اسلوونی": "si", "یونان": "gr", "نروژ": "no", "فنلاند": "fi", "ایرلند": "ie", "آفریقای جنوبی": "za", "الجزایر": "dz", "تونس": "tn", "عربستان": "sa", "استرالیا": "au", "کانادا": "ca"
};

function normalizeText(value = "") {
  return String(value)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/[أإ]/g, "ا")
    .replace(/\u200c/g, " ")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa");
}

function normalizePlayer(p) {
  const team = p.team_name || p.team || "";
  const country = p.country || (NATIONAL_TEAMS.has(team) ? team : "نامشخص");
  return {
    team,
    country,
    type: p.team_type || p.type || (NATIONAL_TEAMS.has(team) ? "national" : "club"),
    name: p.player_name || p.name || "",
    number: Number(p.shirt_number ?? p.number ?? 10),
    era: p.era === "current" ? "current" : "legend",
    image: p.player_image || p.image || "",
    memoryTitle: p.memory_title || p.memoryTitle || "خاطره شماره ۱۰",
    memory: p.memory_text || p.memory || "شماره ۱۰ انتخابی تو در FOT10.",
  };
}

function CountryBadge({ country, type = "club", large = false }) {
  const code = COUNTRY_CODES[country];
  if (code && !code.includes("-")) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-white/10 ${large ? "h-10 w-14" : "h-5 w-7"}`} title={country}>
        <img src={`https://flagcdn.com/w80/${code}.png`} alt={`پرچم ${country}`} className="h-full w-full object-cover" loading="lazy" />
      </span>
    );
  }
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-md border border-amber-200/20 bg-amber-200/10 text-amber-200 ${large ? "h-10 w-10" : "h-5 w-5"}`} title={country || "کشور"}>
      {type === "club" ? <Shield size={large ? 18 : 12} /> : "🌍"}
    </span>
  );
}

export default function Golden10Page() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [catalog, setCatalog] = useState(fallbackPlayers);
  const [selectedPlayer, setSelectedPlayer] = useState(fallbackPlayers[0]);
  const [golden, setGolden] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [eraFilter, setEraFilter] = useState("all");
  const [sort, setSort] = useState("current");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.from("fot10_golden10_catalog").select("team_name,player_name,shirt_number,player_image,era,memory_title,memory_text,country,team_type").eq("shirt_number", 10).order("team_name").order("player_name").then(({ data, error: loadError }) => {
      if (!active) return;
      if (!loadError && data?.length) {
        const next = data.map(normalizePlayer);
        setCatalog(next);
        setSelectedPlayer((current) => next.find((p) => p.team === current?.team && p.name === current?.name) || next[0]);
      } else if (loadError) {
        setError("کاتالوگ آنلاین در دسترس نبود؛ نسخه پشتیبان نمایش داده شد.");
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
      if (!loadError && row) {
        const next = normalizePlayer(row);
        setGolden({ ...row, ...next, id: row.id });
        localStorage.setItem("fot10-golden10", JSON.stringify({ ...row, ...next, id: row.id }));
        applyGolden10Event();
      }
    });
    return () => { active = false; };
  }, [supabase]);

  function loadLocal() { try { return JSON.parse(localStorage.getItem("fot10-golden10") || "null"); } catch { return null; } }
  function applyGolden10Event() { window.dispatchEvent(new CustomEvent("fot10-golden10-change")); }

  const countries = useMemo(() => [...new Set(catalog.map((p) => p.country).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa")), [catalog]);
  const teams = useMemo(() => [...new Set(catalog.map((p) => p.team).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa")), [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = normalizeText(query);
    const result = catalog.filter((p) => {
      const haystack = normalizeText(`${p.name} ${p.team} ${p.country}`);
      const matchesSearch = !q || haystack.includes(q);
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      const matchesCountry = countryFilter === "all" || p.country === countryFilter;
      const matchesTeam = teamFilter === "all" || p.team === teamFilter;
      const matchesEra = eraFilter === "all" || p.era === eraFilter;
      return matchesSearch && matchesType && matchesCountry && matchesTeam && matchesEra;
    });
    return result.sort((a, b) => {
      if (sort === "historical") return (a.era === "legend" ? 0 : 1) - (b.era === "legend" ? 0 : 1) || a.name.localeCompare(b.name, "fa");
      if (sort === "name") return a.name.localeCompare(b.name, "fa");
      return (a.era === "current" ? 0 : 1) - (b.era === "current" ? 0 : 1) || a.name.localeCompare(b.name, "fa");
    });
  }, [catalog, query, typeFilter, countryFilter, teamFilter, eraFilter, sort]);

  function selectPlayer(player) {
    setSelectedPlayer(player);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setQuery(""); setTypeFilter("all"); setCountryFilter("all"); setTeamFilter("all"); setEraFilter("all"); setSort("current");
  }

  async function saveGolden() {
    if (!selectedPlayer || selectedPlayer.number !== 10) return;
    setBusy(true); setError(""); setMessage("");
    const row = { team_name: selectedPlayer.team, player_name: selectedPlayer.name, player_image: selectedPlayer.image, era: selectedPlayer.era, shirt_number: 10, memory_title: selectedPlayer.memoryTitle, memory_text: selectedPlayer.memory };
    if (!user) {
      const next = { id: `guest-${Date.now()}`, ...row, ...selectedPlayer };
      localStorage.setItem("fot10-golden10", JSON.stringify(next)); setGolden(next); applyGolden10Event(); setMessage("۱۰ طلایی تو ذخیره شد ✓"); setBusy(false); return;
    }
    const { data, error: saveError } = await supabase.from("fot10_golden_tens").upsert({ user_id: user.id, ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("id,team_name,player_name,player_image,era,shirt_number,memory_title,memory_text,created_at").single();
    if (saveError) setError(saveError.message); else { const next = { ...data, ...normalizePlayer(data) }; localStorage.setItem("fot10-golden10", JSON.stringify(next)); setGolden(next); applyGolden10Event(); setMessage("۱۰ طلایی تو ذخیره شد ✓"); }
    setBusy(false);
  }

  async function removeGolden() {
    setBusy(true); setError("");
    if (user && golden?.id && !String(golden.id).startsWith("guest-")) {
      const { error: removeError } = await supabase.from("fot10_golden_tens").delete().eq("id", golden.id).eq("user_id", user.id);
      if (removeError) { setError(removeError.message); setBusy(false); return; }
    }
    localStorage.removeItem("fot10-golden10"); setGolden(null); applyGolden10Event(); setMessage("۱۰ طلایی حذف شد."); setBusy(false);
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
            {displayPlayer.image ? <img src={displayPlayer.image} alt={displayPlayer.name} className="absolute inset-0 h-full w-full object-cover object-top opacity-75" /> : <div className="absolute inset-0 grid place-items-center text-8xl font-black text-amber-200/20">10</div>}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute top-5 right-5 flex items-center gap-2 rounded-2xl border border-amber-200/20 bg-black/30 p-2 backdrop-blur-md"><CountryBadge country={displayPlayer.country} type={displayPlayer.type} large /><span className="text-6xl leading-none font-black italic text-amber-200 px-1">10</span></div>
            <div className="absolute bottom-0 inset-x-0 p-5"><div className="flex items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-[11px] text-amber-200 font-black"><CountryBadge country={displayPlayer.country} type={displayPlayer.type}/><span>۱۰ طلایی من • {displayPlayer.team}</span></div><h2 className="text-3xl font-black mt-2">{displayPlayer.name}</h2><div className="text-xs text-slate-300 mt-2">شماره ۱۰ • {displayPlayer.era === "current" ? "معاصر" : "تاریخی"}</div></div><div className="h-16 w-16 rounded-2xl border border-amber-200/30 bg-amber-200/10 grid place-items-center text-amber-200 font-black text-2xl">10</div></div></div>
          </div>
          <div className="relative p-4 border-t border-white/5"><div className="flex gap-3"><Crown size={18} className="text-amber-300 mt-0.5 shrink-0"/><div><div className="text-xs font-black text-amber-100">{displayPlayer.memoryTitle || "خاطره شماره ۱۰"}</div><p className="text-[11px] leading-6 text-slate-300 mt-1">{displayPlayer.memory || "شماره ۱۰ انتخابی تو در FOT10."}</p></div></div></div>
        </section>

        <section className="glass card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><SlidersHorizontal size={17} className="text-amber-300"/><div><h2 className="font-black">کاتالوگ ۱۰ طلایی</h2><p className="text-[10px] text-slate-500 mt-1">{filteredCatalog.length} نتیجه از {catalog.length} بازیکن</p></div></div><button onClick={clearFilters} className="text-[10px] font-bold text-slate-400">پاک‌کردن</button></div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Search size={17} className="text-slate-500 shrink-0"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="نام بازیکن، تیم یا کشور..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/></div>
          <div className="grid grid-cols-2 gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="glass rounded-2xl py-3 px-3 text-xs bg-transparent outline-none"><option value="all" className="bg-slate-900">همه تیم‌ها</option><option value="national" className="bg-slate-900">تیم ملی</option><option value="club" className="bg-slate-900">باشگاه</option></select>
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="glass rounded-2xl py-3 px-3 text-xs bg-transparent outline-none"><option value="all" className="bg-slate-900">همه کشورها</option>{countries.map((c) => <option key={c} value={c} className="bg-slate-900">{c}</option>)}</select>
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="glass rounded-2xl py-3 px-3 text-xs bg-transparent outline-none"><option value="all" className="bg-slate-900">همه تیم‌ها</option>{teams.map((t) => <option key={t} value={t} className="bg-slate-900">{t}</option>)}</select>
            <select value={eraFilter} onChange={(e) => setEraFilter(e.target.value)} className="glass rounded-2xl py-3 px-3 text-xs bg-transparent outline-none"><option value="all" className="bg-slate-900">همه دوره‌ها</option><option value="current" className="bg-slate-900">معاصر</option><option value="legend" className="bg-slate-900">تاریخی</option></select>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setSort("current")} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${sort === "current" ? "bg-amber-300 text-slate-950" : "bg-white/5 text-slate-400"}`}>معاصر اول</button><button onClick={() => setSort("historical")} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${sort === "historical" ? "bg-amber-300 text-slate-950" : "bg-white/5 text-slate-400"}`}>تاریخی اول</button><button onClick={() => setSort("name")} className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold ${sort === "name" ? "bg-amber-300 text-slate-950" : "bg-white/5 text-slate-400"}`}>الفبایی</button></div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredCatalog.map((player, index) => (
            <button key={`${player.team}-${player.name}-${index}`} onClick={() => selectPlayer(player)} className={`group relative overflow-hidden rounded-3xl border text-right transition duration-200 active:scale-[.98] ${selectedPlayer.name === player.name && selectedPlayer.team === player.team ? "border-amber-300/60 ring-1 ring-amber-300/30" : "border-white/10"}`}>
              <div className="relative aspect-[.78] bg-slate-950">
                {player.image ? <img src={player.image} alt={player.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition duration-300 group-hover:scale-105" /> : <div className="absolute inset-0 grid place-items-center text-6xl font-black text-amber-200/20">10</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/45 px-1.5 py-1 backdrop-blur-sm"><CountryBadge country={player.country} type={player.type}/><span className="text-[9px] font-black text-amber-200">10</span></div>
                <div className="absolute bottom-0 inset-x-0 p-3"><div className="flex items-center gap-1.5 text-[9px] text-amber-200/90"><CountryBadge country={player.country} type={player.type}/><span>{player.type === "national" ? "تیم ملی" : "باشگاه"} • {player.country}</span></div><div className="mt-1 text-sm font-black leading-5">{player.name}</div><div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-400"><Shield size={11}/><span>{player.team}</span></div></div>
              </div>
            </button>
          ))}
        </section>
        {!filteredCatalog.length && <div className="glass card py-12 text-center"><Star className="mx-auto text-amber-300/50" size={24}/><p className="mt-3 text-sm font-bold">بازیکنی با این فیلترها پیدا نشد.</p><button onClick={clearFilters} className="mt-3 text-xs text-amber-200 font-bold">حذف فیلترها</button></div>}

        <section className="glass card p-5 space-y-3">
          <button disabled={busy || !selectedPlayer} onClick={saveGolden} className="w-full rounded-2xl bg-amber-300 text-slate-950 py-3.5 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Sparkles size={17}/> انتخاب {selectedPlayer?.name || "۱۰"} به‌عنوان ۱۰ طلایی</button>
          {golden && <button disabled={busy} onClick={removeGolden} className="w-full rounded-2xl border border-rose-400/15 bg-rose-400/[.04] text-rose-300 py-3 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"><Trash2 size={15}/> حذف ۱۰ طلایی من</button>}
          {(message || error) && <div className={`rounded-2xl p-3 text-xs font-bold ${error ? "border border-rose-400/20 bg-rose-400/[.06] text-rose-200" : "border border-amber-300/10 bg-amber-300/[.05] text-amber-100"}`}>{error || message}</div>}
        </section>

        <section className="glass card p-5"><div className="flex items-center gap-3"><Heart size={18} className="text-rose-300"/><div><h2 className="font-black">قانون ۱۰ طلایی FOT10</h2><p className="text-[10px] text-slate-500 mt-1">کاتالوگ برای شماره ۱۰ طراحی شده؛ هر کارت یک انتخاب از تاریخ و دوران معاصر فوتبال است.</p></div></div></section>
      </div>
    </main>
  );
}
