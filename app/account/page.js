"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, Heart, Languages, LogIn, LogOut, Moon, ShieldCheck, Star, Trophy, UserRound, Zap } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const teams = ["پرسپولیس", "رئال مادرید", "بارسلونا", "آرسنال", "بایرن مونیخ", "منچسترسیتی"];
const leagues = ["لیگ برتر ایران", "لیگ قهرمانان اروپا", "پریمیر لیگ", "لالیگا", "بوندسلیگا", "سری آ"];

export default function AccountPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [favorites, setFavorites] = useState(["پرسپولیس", "رئال مادرید"]);
  const [favoriteLeagues, setFavoriteLeagues] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const local = loadLocalProfile();
    setName(local.name || "");
    setFavorites(Array.isArray(local.favorites) ? local.favorites : ["پرسپولیس", "رئال مادرید"]);
    setNotifications(typeof local.notifications === "boolean" ? local.notifications : true);

    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (data.user) {
        setUser(data.user);
        setEmail(data.user.email || "");
        await loadCloudProfile(data.user.id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const nextUser = session?.user || null;
      setUser(nextUser);
      if (nextUser) {
        setEmail(nextUser.email || "");
        await loadCloudProfile(nextUser.id);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  function loadLocalProfile() {
    try { return JSON.parse(localStorage.getItem("fot10-profile") || "{}"); } catch { return {}; }
  }

  async function loadCloudProfile(userId) {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const [{ data: profile, error: profileError }, { data: prefs, error: prefsError }, { data: favs, error: favError }] = await Promise.all([
        supabase.from("fot10_profiles").select("display_name").eq("id", userId).maybeSingle(),
        supabase.from("fot10_preferences").select("notifications_enabled").eq("user_id", userId).maybeSingle(),
        supabase.from("fot10_favorites").select("item_type,item_name").eq("user_id", userId),
      ]);
      if (profileError) throw profileError;
      if (prefsError) throw prefsError;
      if (favError) throw favError;
      if (profile?.display_name) setName(profile.display_name);
      if (typeof prefs?.notifications_enabled === "boolean") setNotifications(prefs.notifications_enabled);
      if (Array.isArray(favs)) {
        const teamFavs = favs.filter(x => x.item_type === "team").map(x => x.item_name);
        const leagueFavs = favs.filter(x => x.item_type === "league").map(x => x.item_name);
        if (teamFavs.length) setFavorites(teamFavs);
        if (leagueFavs.length) setFavoriteLeagues(leagueFavs);
      }
    } catch (e) {
      setError(e?.message || "خطا در دریافت اطلاعات حساب");
    } finally {
      setBusy(false);
    }
  }

  function persistGuest(next = {}) {
    const data = { name, favorites, favoriteLeagues, notifications, ...next };
    localStorage.setItem("fot10-profile", JSON.stringify(data));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  async function saveCloud(next = {}) {
    if (!supabase || !user) {
      persistGuest(next);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const nextName = next.name ?? name;
      const nextNotifications = next.notifications ?? notifications;
      const nextTeams = next.favorites ?? favorites;
      const nextLeagues = next.favoriteLeagues ?? favoriteLeagues;

      const [{ error: profileError }, { error: prefsError }] = await Promise.all([
        supabase.from("fot10_profiles").upsert({ id: user.id, display_name: nextName, updated_at: new Date().toISOString() }),
        supabase.from("fot10_preferences").upsert({ user_id: user.id, notifications_enabled: nextNotifications, language: "fa", theme: "dark", updated_at: new Date().toISOString() }),
      ]);
      if (profileError) throw profileError;
      if (prefsError) throw prefsError;

      const { error: deleteError } = await supabase.from("fot10_favorites").delete().eq("user_id", user.id).in("item_type", ["team", "league"]);
      if (deleteError) throw deleteError;

      const rows = [
        ...nextTeams.map(item_name => ({ user_id: user.id, item_type: "team", item_name })),
        ...nextLeagues.map(item_name => ({ user_id: user.id, item_type: "league", item_name })),
      ];
      if (rows.length) {
        const { error: favoriteError } = await supabase.from("fot10_favorites").insert(rows);
        if (favoriteError) throw favoriteError;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
    } catch (e) {
      setError(e?.message || "ذخیره‌سازی ابری انجام نشد");
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    if (!supabase) return setError("اتصال Supabase در محیط اجرا تنظیم نشده است.");
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) return setError("ایمیل معتبر وارد کن.");
    setBusy(true); setError(""); setMessage("");
    const { error: authError } = await supabase.auth.signInWithOtp({ email: value, options: { shouldCreateUser: true } });
    setBusy(false);
    if (authError) return setError(authError.message);
    setOtpSent(true);
    setMessage("کد ورود به ایمیلت ارسال شد. کد ۶ رقمی را وارد کن.");
  }

  async function verifyOtp() {
    if (!supabase) return;
    if (!/^\d{6}$/.test(otp.trim())) return setError("کد ورود باید ۶ رقمی باشد.");
    setBusy(true); setError("");
    const { data, error: authError } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp.trim(), type: "email" });
    setBusy(false);
    if (authError) return setError(authError.message);
    if (data.user) {
      setUser(data.user);
      setMessage("ورود با موفقیت انجام شد ✓");
      await loadCloudProfile(data.user.id);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setUser(null); setOtpSent(false); setOtp(""); setMessage("از حساب خارج شدی."); setBusy(false);
  }

  function toggleFavorite(item) {
    const next = favorites.includes(item) ? favorites.filter(x => x !== item) : [...favorites, item];
    setFavorites(next);
    user ? saveCloud({ favorites: next }) : persistGuest({ favorites: next });
  }

  function toggleLeague(item) {
    const next = favoriteLeagues.includes(item) ? favoriteLeagues.filter(x => x !== item) : [...favoriteLeagues, item];
    setFavoriteLeagues(next);
    user ? saveCloud({ favoriteLeagues: next }) : persistGuest({ favoriteLeagues: next });
  }

  function toggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    user ? saveCloud({ notifications: next }) : persistGuest({ notifications: next });
  }

  if (loading) return <main className="fot-shell min-h-screen grid place-items-center text-sm text-slate-400">در حال آماده‌سازی حساب FOT10…</main>;

  return (
    <main className="fot-shell min-h-screen">
      <div className="fot-container pb-10 space-y-4">
        <header className="flex items-center justify-between pt-1">
          <a href="/" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold">← خانه</a>
          <div className="text-right"><div className="text-[10px] text-slate-500">FOT10</div><h1 className="text-xl font-black">حساب من</h1></div>
        </header>

        <section className="glass card p-5 relative overflow-hidden">
          <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-emerald-300 to-cyan-500 text-slate-950 grid place-items-center shadow-xl shadow-emerald-500/10"><UserRound size={28} /></div>
            <div className="min-w-0 flex-1"><div className="text-[10px] text-emerald-300 font-bold">{user ? "حساب متصل FOT10" : "شخصی‌سازی FOT10"}</div><div className="text-xl font-black mt-1 truncate">{name || (user?.email || "مهمان FOT10")}</div><div className="text-[10px] text-slate-500 mt-1">{user ? user.email : "ورود اختیاری • اطلاعات مهمان روی گوشی ذخیره می‌شود"}</div></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5"><Mini n={favorites.length + favoriteLeagues.length} t="مورد علاقه" /><Mini n="۲۴/۷" t="پوشش فوتبال" /><Mini n={user ? "SYNC" : "GUEST"} t="وضعیت حساب" /></div>
        </section>

        {!user && <section className="glass card p-5">
          <div className="flex items-center gap-3 mb-4"><LogIn size={18} className="text-emerald-400"/><div><h2 className="font-black">ورود امن</h2><p className="text-[10px] text-slate-500 mt-1">بدون رمز عبور؛ کد یک‌بارمصرف به ایمیل ارسال می‌شود.</p></div></div>
          <div className="flex gap-2"><input value={email} onChange={e => setEmail(e.target.value)} dir="ltr" type="email" inputMode="email" className="glass min-w-0 flex-1 rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-400/20 text-sm" placeholder="you@example.com" /><button disabled={busy} onClick={sendOtp} className="rounded-2xl bg-emerald-400 text-slate-950 px-4 font-black text-xs disabled:opacity-50">ارسال کد</button></div>
          {otpSent && <div className="mt-3 flex gap-2"><input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} dir="ltr" inputMode="numeric" maxLength={6} className="glass flex-1 rounded-2xl py-3.5 px-4 text-center tracking-[.5em] outline-none" placeholder="••••••" /><button disabled={busy} onClick={verifyOtp} className="rounded-2xl bg-white text-slate-950 px-4 font-black text-xs disabled:opacity-50">تأیید</button></div>}
        </section>}

        {user && <button disabled={busy} onClick={signOut} className="w-full glass card p-4 flex items-center justify-center gap-2 text-sm font-black text-rose-300 disabled:opacity-50"><LogOut size={17}/> خروج از حساب</button>}

        {(message || error) && <div className={`rounded-2xl p-3 text-xs font-bold ${error ? "border border-rose-400/20 bg-rose-400/[.06] text-rose-200" : "border border-emerald-400/10 bg-emerald-400/[.05] text-emerald-200"}`}>{error || message}</div>}

        <section className="glass card p-5">
          <div className="flex items-center gap-3 mb-4"><Zap size={18} className="text-emerald-400"/><div><h2 className="font-black">پروفایل</h2><p className="text-[10px] text-slate-500 mt-1">{user ? "در فضای ابری FOT10 ذخیره می‌شود" : "برای ذخیره ابری، وارد حساب شو"}</p></div></div>
          <input value={name} onChange={e => setName(e.target.value)} onBlur={() => user ? saveCloud() : persistGuest()} className="glass w-full rounded-2xl py-3.5 px-4 outline-none focus:ring-2 focus:ring-emerald-400/20 text-sm" placeholder="اسم شما" />
          <button disabled={busy} onClick={() => user ? saveCloud() : persistGuest()} className="w-full mt-3 rounded-2xl bg-emerald-400 text-slate-950 py-3 font-black text-sm active:scale-[.99] transition disabled:opacity-50">{busy ? "در حال ذخیره…" : saved ? "ذخیره شد ✓" : "ذخیره پروفایل"}</button>
        </section>

        <section className="glass card p-5">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Heart size={18} className="text-rose-300"/><h2 className="font-black">تیم‌های محبوب</h2></div><span className="text-[10px] text-slate-500">{user ? "ابری" : "روی گوشی"}</span></div>
          <div className="flex flex-wrap gap-2">{teams.map(team => <button key={team} onClick={() => toggleFavorite(team)} className={`rounded-full px-3.5 py-2 text-xs font-bold border transition ${favorites.includes(team) ? "bg-emerald-400 text-slate-950 border-emerald-400" : "bg-white/[.03] text-slate-400 border-white/10"}`}>{favorites.includes(team) ? "★ " : "☆ "}{team}</button>)}</div>
        </section>

        <section className="glass card p-5">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Trophy size={18} className="text-amber-300"/><h2 className="font-black">لیگ‌های مورد علاقه</h2></div></div>
          <div className="flex flex-wrap gap-2">{leagues.map(league => <button key={league} onClick={() => toggleLeague(league)} className={`rounded-full px-3.5 py-2 text-xs font-bold border transition ${favoriteLeagues.includes(league) ? "bg-amber-300 text-slate-950 border-amber-300" : "bg-white/[.03] text-slate-400 border-white/10"}`}>{favoriteLeagues.includes(league) ? "★ " : "☆ "}{league}</button>)}</div>
        </section>

        <section className="glass card p-5 space-y-2">
          <Setting icon={Bell} title="اعلان‌های بازی" sub="شروع بازی، گل و پایان مسابقه" active={notifications} onClick={toggleNotifications} />
          <Setting icon={Languages} title="زبان" sub="فارسی • آماده برای انگلیسی" />
          <Setting icon={Moon} title="ظاهر" sub="تم حرفه‌ای تیره" />
          <Setting icon={ShieldCheck} title="امنیت" sub={user ? "احراز هویت Supabase فعال است" : "ورود امن با OTP آماده است"} />
        </section>

        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.04] p-4 text-[10px] leading-5 text-slate-500">FOT10 بین حالت مهمان و حساب واقعی تفاوت می‌گذارد: مهمان تنظیمات را روی دستگاه نگه می‌دارد و حساب واردشده پروفایل، علاقه‌مندی‌ها و تنظیمات را با Supabase همگام می‌کند.</div>
      </div>
    </main>
  );
}

function Mini({ n, t }) { return <div className="rounded-2xl bg-white/[.045] p-3 text-center"><div className="font-black">{n}</div><div className="text-[9px] text-slate-500 mt-1">{t}</div></div>; }
function Setting({ icon: Icon, title, sub, active, onClick }) { return <button onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl p-3 text-right hover:bg-white/[.03] transition"><div className="h-10 w-10 rounded-xl bg-white/[.045] grid place-items-center text-emerald-300"><Icon size={17}/></div><div className="flex-1 min-w-0"><div className="text-xs font-black">{title}</div><div className="text-[9px] text-slate-500 mt-1 truncate">{sub}</div></div>{typeof active === "boolean" && <span className={`h-6 w-11 rounded-full p-1 ${active ? "bg-emerald-400" : "bg-white/10"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : ""}`} /></span>}{onClick && active === undefined && <ChevronLeft size={15} className="text-slate-600"/>}</button>; }
