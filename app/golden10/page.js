"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Crown, Heart, Save, Sparkles, Trophy, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const teams = ["ایران", "پرسپولیس", "آرژانتین", "برزیل", "بارسلونا", "رئال مادرید", "فرانسه", "یوونتوس"];
const legends = [
  { name: "مارادونا", team: "آرژانتین", era: "legend" },
  { name: "پله", team: "برزیل", era: "legend" },
  { name: "علی دایی", team: "ایران", era: "legend" },
  { name: "لیونل مسی", team: "بارسلونا", era: "legend" },
  { name: "رونالدینیو", team: "برزیل", era: "legend" },
  { name: "زین‌الدین زیدان", team: "فرانسه", era: "legend" },
  { name: "الساندرو دل‌پیرو", team: "یوونتوس", era: "legend" },
  { name: "میشل پلاتینی", team: "یوونتوس", era: "legend" },
];

export default function Golden10Page() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(teams[0]);
  const [player, setPlayer] = useState(legends.find(x => x.team === teams[0])?.name || legends[0].name);
  const [goldens, setGoldens] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const local = loadLocal();
    if (local.length) setGoldens(local);
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

  const teamPlayers = legends.filter(x => x.team === team || x.team === "برزیل");

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem("fot10-golden10") || "[]"); } catch { return []; }
  }

  async function loadCloud(userId) {
    setBusy(true); setError("");
    const { data, error: loadError } = await supabase
      .from("fot10_golden_tens")
      .select("id,team_name,player_name,player_image,era,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setBusy(false);
    if (loadError) return setError(loadError.message);
    setGoldens(data || []);
  }

  async function saveGolden() {
    if (!team || !player) return;
    setBusy(true); setError(""); setMessage("");
    const row = { team_name: team, player_name: player, era: "legend" };
    if (!user) {
      const next = [{ ...row, id: `guest-${Date.now()}` }, ...goldens.filter(x => x.team_name !== team)];
      localStorage.setItem("fot10-golden10", JSON.stringify(next));
      setGoldens(next);
      setMessage("۱۰ طلایی ذخیره شد ✓");
      setBusy(false);
      return;
    }
    const { data, error: saveError } = await supabase
      .from("fot10_golden_tens")
      .upsert({ user_id: user.id, ...row, updated_at: new Date().toISOString() }, { onConflict: "user_id,team_name" })
      .select("id,team_name,player_name,player_image,era,created_at")
      .single();
    if (saveError) {
      setError(saveError.message);
    } else {
      setGoldens([data, ...goldens.filter(x => x.team_name !== team)]);
      setMessage("۱۰ طلایی ذخیره شد ✓");
    }
    setBusy(false);
  }

  async function removeGolden(item) {
    setBusy(true); setError("");
    if (user && !String(item.id).startsWith("guest-")) {
      const { error: removeError } = await supabase.from("fot10_golden_tens").delete().eq("id", item.id).eq("user_id", user.id);
      if (removeError) { setError(removeError.message); setBusy(false); return; }
    }
    const next = goldens.filter(x => x.id !== item.id);
    setGoldens(next);
    localStorage.setItem("fot10-golden10", JSON.stringify(next));
    setBusy(false);
  }

  return (
    <main className="fot-shell min-h-screen">
      <div className="fot-container pb-12 space-y-4">
        <header className="flex items-center justify-between pt-1">
          <a href="/account" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">← حساب من</a>
          <div className="text-right"><div className="text-[10px] text-emerald-300 font-bold">FOT10 SIGNATURE</div><h1 className="text-xl font-black">۱۰ طلایی من</h1></div>
        </header>

        <section className="glass card p-5 relative overflow-hidden">
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-400 text-slate-950 grid place-items-center shadow-xl"><Crown size={25}/></div>
            <div><div className="text-[10px] text-amber-200 font-black">امضای فوتبالی تو</div><h2 className="text-lg font-black mt-1">برای هر تیم، یک «۱۰ طلایی» انتخاب کن</h2><p className="text-[10px] text-slate-500 mt-2 leading-5">می‌تواند یک اسطوره نوستالژیک باشد یا ستاره‌ای که برای تو نماد آن تیم است.</p></div>
          </div>
        </section>

        <section className="glass card p-5 space-y-4">
          <div className="flex items-center gap-2"><Sparkles size={17} className="text-amber-300"/><h2 className="font-black">انتخاب ۱۰ طلایی</h2></div>
          <label className="block"><span className="text-[10px] text-slate-500 block mb-2">تیم</span><select value={team} onChange={e => { setTeam(e.target.value); const first = legends.find(x => x.team === e.target.value); if (first) setPlayer(first.name); }} className="glass w-full rounded-2xl py-3.5 px-4 outline-none text-sm bg-transparent">{teams.map(x => <option key={x} value={x} className="bg-slate-900">{x}</option>)}</select></label>
          <label className="block"><span className="text-[10px] text-slate-500 block mb-2">بازیکن ۱۰ طلایی</span><select value={player} onChange={e => setPlayer(e.target.value)} className="glass w-full rounded-2xl py-3.5 px-4 outline-none text-sm bg-transparent"><option value={player} className="bg-slate-900">{player}</option>{teamPlayers.filter(x => x.name !== player).map(x => <option key={x.name} value={x.name} className="bg-slate-900">{x.name}</option>)}<option value="انتخاب شخصی" className="bg-slate-900">انتخاب شخصی...</option></select></label>
          <button disabled={busy || player === "انتخاب شخصی"} onClick={saveGolden} className="w-full rounded-2xl bg-amber-300 text-slate-950 py-3.5 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Save size={17}/> ذخیره ۱۰ طلایی من</button>
          {(message || error) && <div className={`rounded-2xl p-3 text-xs font-bold ${error ? "border border-rose-400/20 bg-rose-400/[.06] text-rose-200" : "border border-amber-300/10 bg-amber-300/[.05] text-amber-100"}`}>{error || message}</div>}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><Heart size={17} className="text-rose-300"/><h2 className="font-black">۱۰های طلایی من</h2></div><span className="text-[10px] text-slate-500">{goldens.length} تیم</span></div>
          {goldens.length === 0 ? <div className="glass card p-8 text-center"><UserRound size={26} className="mx-auto text-slate-500"/><p className="text-sm font-bold mt-3">هنوز ۱۰ طلایی انتخاب نکردی</p><p className="text-[10px] text-slate-500 mt-2">مارادونا، پله، علی دایی یا هر اسطوره‌ای که برایت شماره یک است.</p></div> : goldens.map(item => <article key={item.id} className="glass card p-4 flex items-center gap-3"><div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-200/20 to-emerald-400/10 grid place-items-center text-amber-200 font-black text-xl">10</div><div className="flex-1 min-w-0"><div className="text-[10px] text-emerald-300 font-bold">{item.team_name}</div><div className="font-black mt-1 truncate">{item.player_name}</div><div className="text-[9px] text-slate-500 mt-1">LEGEND • GOLDEN TEN</div></div><button disabled={busy} onClick={() => removeGolden(item)} className="text-[10px] text-rose-300 rounded-xl px-2 py-2 hover:bg-rose-400/5">حذف</button></article>)}
        </section>

        <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[.04] p-4 text-[10px] leading-5 text-slate-500">حالت مهمان روی گوشی ذخیره می‌شود؛ با ورود به حساب FOT10، انتخاب‌های ۱۰ طلایی هر کاربر در Supabase به‌صورت اختصاصی ذخیره می‌شوند.</div>
      </div>
    </main>
  );
}
