"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Crown, Save, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const presets = [
  ["پرسپولیس", "علی پروین"], ["ایران", "علی دایی"], ["آرژانتین", "دیگو مارادونا"], ["برزیل", "پله"],
  ["رئال مادرید", "کریستیانو رونالدو"], ["بارسلونا", "لیونل مسی"], ["فرانسه", "زین‌الدین زیدان"],
  ["ایتالیا", "الساندرو دل‌پیرو"], ["اسپانیا", "ژاوی"], ["پرتغال", "لوئیس فیگو"],
];
const teams = [...new Set(presets.map(x => x[0]).concat(["آرسنال", "بایرن مونیخ", "منچسترسیتی"]))];

export default function GoldenTenPage() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState(null), [items, setItems] = useState([]), [team, setTeam] = useState(""), [player, setPlayer] = useState(""), [era, setEra] = useState("legend"), [busy, setBusy] = useState(false), [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user || null);
      if (data.user) {
        const { data: rows } = await supabase.from("fot10_golden_tens").select("id,team_name,player_name,era,created_at").eq("user_id", data.user.id).order("created_at", { ascending: false });
        if (active) setItems(rows || []);
      }
    });
    return () => { active = false; };
  }, [supabase]);

  function preset(value) { const p = presets.find(x => `${x[0]} — ${x[1]}` === value); if (p) { setTeam(p[0]); setPlayer(p[1]); setEra("legend"); } }
  async function save() {
    if (!user) return setMessage("برای ثبت ۱۰ طلایی، ابتدا از صفحه حساب وارد شو.");
    if (!team || !player.trim()) return setMessage("تیم و بازیکن را انتخاب کن.");
    setBusy(true); setMessage("");
    const { data, error } = await supabase.from("fot10_golden_tens").upsert({ user_id: user.id, team_name: team, player_name: player.trim(), era }, { onConflict: "user_id,team_name" }).select("id,team_name,player_name,era,created_at").single();
    setBusy(false);
    if (error) return setMessage(error.message);
    setItems(prev => [data, ...prev.filter(x => x.team_name !== data.team_name)]); setPlayer(""); setMessage("۱۰ طلایی با موفقیت ذخیره شد ✓");
  }
  async function remove(id) { const { error } = await supabase.from("fot10_golden_tens").delete().eq("id", id).eq("user_id", user.id); if (!error) setItems(prev => prev.filter(x => x.id !== id)); }

  return <main className="fot-shell min-h-screen"><div className="fot-container pb-10 space-y-4">
    <header className="flex items-center justify-between"><a href="/account" className="glass rounded-2xl px-4 py-2 text-xs font-bold">← حساب من</a><div className="text-right"><div className="text-[10px] text-amber-300 font-black">FOT10 SIGNATURE</div><h1 className="text-xl font-black">۱۰ طلایی من</h1></div></header>
    <section className="glass card p-5 overflow-hidden relative"><div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl"/><div className="relative"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-amber-300/10 text-amber-300 grid place-items-center"><Crown size={24}/></div><div><h2 className="font-black text-lg">شماره ۱۰ انتخابی تو</h2><p className="text-[10px] text-slate-500 mt-1">برای هر تیم یک بازیکن ویژه؛ فعلی یا اسطوره‌ای</p></div></div><div className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-300/[.04] p-3 text-[10px] leading-5 text-slate-400">«۱۰ طلایی» انتخاب شخصی توست. در نسخه‌های بعدی کارت تاریخی، آمار و لحظه‌های ماندگار هر انتخاب را اضافه می‌کنیم.</div></div></section>
    {!user ? <section className="glass card p-5"><b>ابتدا وارد حساب FOT10 شو</b><p className="text-[10px] text-slate-500 mt-2">انتخاب‌های طلایی فقط برای حساب واردشده ذخیره می‌شوند.</p><a href="/account" className="inline-flex mt-4 rounded-2xl bg-emerald-400 text-slate-950 px-5 py-3 text-xs font-black">رفتن به حساب</a></section> : <section className="glass card p-5 space-y-3">
      <select value={team} onChange={e=>setTeam(e.target.value)} className="glass w-full rounded-2xl px-4 py-3 text-sm bg-transparent outline-none"><option value="">تیم را انتخاب کن</option>{teams.map(x=><option key={x}>{x}</option>)}</select>
      <select value={presets.some(x=>x[0]===team&&x[1]===player)?`${team} — ${player}`:""} onChange={e=>preset(e.target.value)} className="glass w-full rounded-2xl px-4 py-3 text-sm bg-transparent outline-none"><option value="">انتخاب سریع یک اسطوره</option>{presets.filter(x=>!team||x[0]===team).map(x=><option key={`${x[0]}-${x[1]}`} value={`${x[0]} — ${x[1]}`}>{x[1]} • {x[0]}</option>)}</select>
      <div className="flex gap-2"><input value={player} onChange={e=>setPlayer(e.target.value)} className="glass min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm outline-none" placeholder="یا نام بازیکن را بنویس"/><button disabled={busy} onClick={save} className="rounded-2xl bg-amber-300 text-slate-950 px-4 font-black text-xs"><Save size={15} className="inline mr-1"/>ذخیره</button></div>
      <div className="flex gap-2"><button onClick={()=>setEra("legend")} className={`flex-1 rounded-xl py-2 text-[10px] font-black border ${era==="legend"?"bg-amber-300 text-slate-950 border-amber-300":"border-white/10 text-slate-400"}`}>اسطوره / نوستالژی</button><button onClick={()=>setEra("current")} className={`flex-1 rounded-xl py-2 text-[10px] font-black border ${era==="current"?"bg-emerald-400 text-slate-950 border-emerald-400":"border-white/10 text-slate-400"}`}>بازیکن فعلی</button></div>
      {message&&<div className="text-[10px] text-amber-200">{message}</div>}
    </section>}
    {items.length>0&&<section className="glass card p-5"><h2 className="font-black mb-3">۱۰های طلایی من</h2><div className="space-y-2">{items.map(x=><div key={x.id} className="flex items-center gap-3 rounded-2xl bg-white/[.025] border border-white/5 p-3"><div className="h-11 w-11 rounded-xl bg-amber-300/10 text-amber-300 grid place-items-center font-black text-lg">10</div><div className="flex-1"><div className="text-[10px] text-slate-500">{x.team_name}</div><div className="font-black text-sm">{x.player_name}</div><div className="text-[9px] text-amber-200 mt-1">{x.era === "legend" ? "اسطوره • نوستالژی" : "بازیکن فعلی"}</div></div><button onClick={()=>remove(x.id)} className="h-9 w-9 rounded-xl bg-rose-400/5 text-rose-300 grid place-items-center"><Trash2 size={15}/></button></div>)}</div></section>}
    <a href="/" className="flex items-center justify-center gap-2 text-xs text-slate-500 py-3"><ArrowRight size={15}/> بازگشت به FOT10</a>
  </div></main>;
}
