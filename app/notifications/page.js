"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, Clock3, Flame, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const demoNotifications = [
  { id: "demo-live", type: "live", title: "بازی داغ شروع شد", text: "یک مسابقه از تیم‌های محبوبت در حال برگزاری است.", time: "اکنون", icon: Flame, tone: "text-orange-300 bg-orange-400/10" },
  { id: "demo-match", type: "match", title: "یادآوری مسابقه", text: "۱۵ دقیقه تا شروع یک مسابقه مهم باقی مانده است.", time: "۱۵ دقیقه پیش", icon: Trophy, tone: "text-emerald-300 bg-emerald-400/10" },
  { id: "demo-news", type: "news", title: "خبر فوری فوتبال", text: "یک خبر جدید در مرکز اخبار FOT10 منتشر شد.", time: "۳۵ دقیقه پیش", icon: Zap, tone: "text-cyan-300 bg-cyan-400/10" },
];

function formatTime(value) {
  try { return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(value)); } catch { return "جدید"; }
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setItems(demoNotifications); setLoading(false); return; }
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) { setItems(demoNotifications); return; }
      setSignedIn(true);
      const { data } = await supabase.from("fot10_notifications").select("id,kind,title,body,is_read,created_at").order("created_at", { ascending: false }).limit(30);
      if (Array.isArray(data)) {
        setItems(data.map(item => ({ ...item, type: item.kind, text: item.body, time: formatTime(item.created_at), icon: item.kind === "news" ? Zap : item.kind === "match" || item.kind === "result" ? Trophy : Flame, tone: item.kind === "news" ? "text-cyan-300 bg-cyan-400/10" : item.kind === "match" || item.kind === "result" ? "text-emerald-300 bg-emerald-400/10" : "text-orange-300 bg-orange-400/10" })));
      }
    } catch { setItems(demoNotifications); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadNotifications();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel("fot10-notifications-live").on("postgres_changes", { event: "*", schema: "public", table: "fot10_notifications" }, () => loadNotifications()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unread = useMemo(() => items.filter(item => item.is_read === false).length, [items]);

  async function markAllRead() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !signedIn) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;
    await supabase.from("fot10_notifications").update({ is_read: true }).eq("user_id", auth.user.id).eq("is_read", false);
    setItems(prev => prev.map(item => ({ ...item, is_read: true })));
  }

  async function markRead(id) {
    if (!signedIn || String(id).startsWith("demo-")) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("fot10_notifications").update({ is_read: true }).eq("id", id);
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_read: true } : item));
  }

  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="fot-container pb-12">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="glass touch-target rounded-2xl px-4 py-2 text-xs font-bold inline-flex items-center gap-2"><ChevronLeft size={16} /> بازگشت</Link>
          <div className="text-right"><div className="text-[10px] text-emerald-300 font-black tracking-widest">FOT10</div><h1 className="text-xl font-black">اعلان‌ها</h1></div>
        </header>

        <section className="glass card p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-emerald-400/10 text-emerald-300 grid place-items-center"><Bell size={22} /></div><div><h2 className="font-black">مرکز اعلان FOT10</h2><p className="text-xs text-slate-400 mt-1">نتایج، بازی‌های مهم و خبرهای شخصی‌سازی‌شده را از دست نده.</p></div></div>
            {unread > 0 && <span className="shrink-0 min-w-7 h-7 px-2 rounded-full bg-emerald-400 text-slate-950 grid place-items-center text-[10px] font-black">{unread}</span>}
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between gap-3"><div><h2 className="font-black">آخرین اعلان‌ها</h2><span className="text-[9px] text-slate-500">{signedIn ? "همگام‌سازی با حساب FOT10" : "حالت مهمان • دمو"}</span></div>{signedIn && unread > 0 && <button onClick={markAllRead} className="text-[10px] font-bold text-emerald-300 inline-flex items-center gap-1.5"><CheckCheck size={14} /> همه خوانده شد</button>}</div>

        <section className="mt-3 space-y-3">
          {loading && <div className="glass card p-5 text-center text-xs text-slate-500">در حال آماده‌سازی اعلان‌ها…</div>}
          {!loading && items.map(({ id, title, text, time, icon: Icon, tone, is_read }) => (
            <button key={id} onClick={() => markRead(id)} className={`w-full text-right glass card p-4 active:scale-[.99] transition-transform ${is_read === false ? "ring-1 ring-emerald-400/15" : "opacity-80"}`}>
              <div className="flex gap-3"><div className={`h-11 w-11 shrink-0 rounded-2xl grid place-items-center ${tone}`}><Icon size={19} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-bold text-sm">{title}</h3><span className="text-[9px] text-slate-500 whitespace-nowrap inline-flex items-center gap-1"><Clock3 size={11} />{time}</span></div><p className="text-xs text-slate-400 leading-6 mt-1">{text}</p>{is_read === false && <span className="inline-flex mt-2 rounded-full bg-emerald-400/10 text-emerald-300 px-2 py-0.5 text-[8px] font-black">جدید</span>}</div></div>
            </button>
          ))}
        </section>

        <div className="glass rounded-2xl p-4 mt-5 text-center"><p className="text-[11px] text-slate-500 leading-6">اعلان‌های حساب FOT10 به‌صورت امن از Supabase خوانده می‌شوند و آماده اتصال به Push و منبع داده زنده هستند. اعلان‌های دمو نتیجه زنده واقعی محسوب نمی‌شوند.</p></div>
      </div>
    </main>
  );
}
