"use client";

import { useEffect, useState } from "react";
import { Crown, Plus, Save, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

const catalog = [
  { team: "آرژانتین", player: "دیگو مارادونا", era: "legend" },
  { team: "برزیل", player: "پله", era: "legend" },
  { team: "ایران", player: "علی دایی", era: "legend" },
  { team: "فرانسه", player: "زین‌الدین زیدان", era: "legend" },
  { team: "ایتالیا", player: "الساندرو دل‌پیرو", era: "legend" },
  { team: "اسپانیا", player: "ژاوی", era: "legend" },
  { team: "پرتغال", player: "لوئیس فیگو", era: "legend" },
  { team: "رئال مادرید", player: "کریستیانو رونالدو", era: "legend" },
  { team: "بارسلونا", player: "لیونل مسی", era: "legend" },
  { team: "پرسپولیس", player: "علی پروین", era: "legend" },
];

const teams = ["پرسپولیس", "رئال مادرید", "بارسلونا", "آرسنال", "بایرن مونیخ", "منچسترسیتی", "ایران", "آرژانتین", "برزیل", "فرانسه", "ایتالیا", "اسپانیا", "پرتغال"];

export default function GoldenTenSection({ user }) {
  const supabase = getSupabaseBrowserClient();
  const [items, setItems] = useState([]);
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [era, setEra] = useState("legend");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user || !supabase) return;
    let active = true;
    supabase.from("fot10_golden_tens").select("id,team_name,player_name,player_image,era,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (!error) setItems(data || []);
    });
    return () => { active = false; };
  }, [user, supabase]);

  function applyPreset(value) {
    const preset = catalog.find(x => `${x.team} — ${x.player}` === value);
    if (!preset) return;
    setTeam(preset.team); setPlayer(preset.player); setEra(preset.era);
  }

  async function save() {
    if (!user || !supabase) return setMessage("برای ذخیره «۱۰ طلایی من» ابتدا وارد حساب شو.");
    if (!team.trim() || !player.trim()) return setMessage("تیم و نام بازیکن را انتخاب کن.");
    setBusy(true); setMessage("");
    const row = { user_id: user.id, team_name: team.trim(), player_name: player.trim(), era };
    const { data, error } = await supabase.from("fot10_golden_tens").upsert(row, { onConflict: "user_id,team_name" }).select("id,team_name,player_name,player_image,era,created_at").single();
    setBusy(false);
    if (error) return setMessage(error.message);
    setItems(prev => [data, ...prev.filter(x => x.team_name !== data.team_name)]);
    setMessage("۱۰ طلایی ذخیره شد ✓");
    setPlayer("");
  }

  async function remove(id) {
    if (!user || !supabase) return;
    const { error } = await supabase.from("fot10_golden_tens").delete().eq("id", id).eq("user_id", user.id);
    if (!error) setItems(prev => prev.filter(x => x.id !== id));
  }

  return (
    <section className="glass card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-amber-300/10 text-amber-300 grid place-items-center"><Crown size={19}/></div><div><h2 className="font-black">۱۰ طلایی من</h2><p className="text-[10px] text-slate-500 mt-1">برای هر تیم یک ۱۰ محبوب؛ اسطوره یا بازیکن امروزی</p></div></div>
        <span className="rounded-full bg-amber-300/10 text-amber-200 px-2.5 py-1 text-[9px] font-black">FOT10 SIGNATURE</span>
      </div>

      {user ? <>
        <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[.04] p-3 text-[10px] leading-5 text-slate-400">انتخاب تو شخصی است؛ FOT10 آن را به تیم موردنظر وصل می‌کند و بعداً می‌توانیم کارت اسطوره، آمار تاریخی و لحظه‌های ماندگار را هم اضافه کنیم.</div>
        <select value={team} onChange={e => setTeam(e.target.value)} className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none bg-transparent"><option value="">تیم را انتخاب کن</option>{teams.map(x => <option key={x} value={x}>{x}</option>)}</select>
        <select value={catalog.some(x => x.team === team && x.player === player) ? `${team} — ${player}` : ""} onChange={e => applyPreset(e.target.value)} className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none bg-transparent"><option value="">یک اسطوره آماده انتخاب کن</option>{catalog.filter(x => !team || x.team === team).map(x => <option key={`${x.team}-${x.player}`} value={`${x.team} — ${x.player}`}>{x.player} • {x.team}</option>)}</select>
        <div className="flex gap-2"><input value={player} onChange={e => setPlayer(e.target.value)} className="glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="یا نام بازیکن را خودت وارد کن"/><button disabled={busy} onClick={save} className="rounded-2xl bg-amber-300 text-slate-950 px-4 font-black text-xs disabled:opacity-50"><Save size={15} className="inline mr-1"/>ذخیره</button></div>
        <div className="flex gap-2"><button onClick={() => setEra("legend")} className={`flex-1 rounded-xl py-2 text-[10px] font-black border ${era === "legend" ? "bg-amber-300 text-slate-950 border-amber-300" : "border-white/10 text-slate-400"}`}>اسطوره / نوستالژی</button><button onClick={() => setEra("current")} className={`flex-1 rounded-xl py-2 text-[10px] font-black border ${era === "current" ? "bg-emerald-400 text-slate-950 border-emerald-400" : "border-white/10 text-slate-400"}`}>بازیکن فعلی</button></div>
        {message && <div className="text-[10px] text-amber-200">{message}</div>}
        {items.length > 0 && <div className="grid gap-2">{items.map(item => <div key={item.id} className="rounded-2xl border border-white/5 bg-white/[.025] p-3 flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-amber-300/10 text-amber-300 grid place-items-center font-black text-lg">10</div><div className="flex-1 min-w-0"><div className="text-[10px] text-slate-500">{item.team_name}</div><div className="font-black text-sm truncate">{item.player_name}</div><div className="text-[9px] text-amber-200 mt-0.5">{item.era === "legend" ? "اسطوره • ۱۰ طلایی" : "فعلی • ۱۰ طلایی"}</div></div><button onClick={() => remove(item.id)} className="h-9 w-9 rounded-xl bg-rose-400/5 text-rose-300 grid place-items-center"><Trash2 size={15}/></button></div>)}</div>}
      </> : <div className="rounded-2xl border border-white/5 bg-white/[.025] p-4"><div className="text-sm font-black">اول وارد حساب شو</div><p className="text-[10px] text-slate-500 mt-1">بعد می‌توانی برای هر تیم «۱۰ طلایی من» را ثبت کنی و انتخاب‌هایت روی حساب بماند.</p></div>}
      <div className="flex items-center gap-2 text-[9px] text-slate-600"><Plus size={13}/> این بخش طوری طراحی شده که بعداً به کارت‌های تاریخی و رأی‌گیری محبوب‌ترین ۱۰های FOT10 وصل شود.</div>
    </section>
  );
}
