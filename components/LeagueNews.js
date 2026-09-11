import { Newspaper, ExternalLink } from "lucide-react";

const NEWS_ALIASES = {
  "لیگ برتر ایران": ["لیگ برتر", "لیگ برتر ایران", "پرشین گلف پرو لیگ", "persian gulf pro league", "استقلال", "پرسپولیس", "تراکتور", "سپاهان", "فولاد", "ذوب آهن", "ملوان", "گل گهر", "آلومینیوم", "چادرملو", "نساجی", "خیبر", "پیکان"],
};

function clean(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function matchesLeague(item, leagueName = "", country = "") {
  const aliases = NEWS_ALIASES[leagueName] || [leagueName, country].filter(Boolean);
  const text = clean(`${item?.title || ""} ${item?.description || ""}`).toLowerCase();
  return aliases.some((alias) => text.includes(String(alias).toLowerCase()));
}

async function getNews(leagueName, country) {
  try {
    const base = process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_APP_URL || "https://fot10-dcuw.onrender.com";
    const response = await fetch(`${base.replace(/\/$/, "")}/api/news?limit=18`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const payload = await response.json();
    const all = Array.isArray(payload?.news) ? payload.news : [];
    const filtered = all.filter((item) => matchesLeague(item, leagueName, country));
    return (filtered.length ? filtered : all).slice(0, 8);
  } catch {
    return [];
  }
}

export default async function LeagueNews({ leagueName, country }) {
  const news = await getNews(leagueName, country);
  return (
    <section className="glass rounded-[24px] border border-white/10 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-white/[.07] flex items-center justify-between gap-3">
        <div><p className="text-[8px] tracking-[.18em] text-cyan-300 font-black">LATEST NEWS</p><h2 className="text-base sm:text-lg font-black mt-1 flex items-center gap-2"><Newspaper size={17}/> آخرین اخبار {leagueName}</h2></div>
        <span className="text-[9px] text-slate-500">به‌روزرسانی خودکار</span>
      </div>
      <div className="divide-y divide-white/[.055]">
        {news.map((item, index) => (
          <a key={item?.id || index} href={item?.link || "#"} target="_blank" rel="noreferrer" className="grid grid-cols-[76px_1fr] sm:grid-cols-[110px_1fr] gap-3 p-3 sm:p-4 hover:bg-cyan-400/[.035] transition">
            <div className="h-[62px] sm:h-[72px] rounded-xl overflow-hidden bg-white/[.04] border border-white/[.06]">
              {item?.image ? <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy"/> : <div className="h-full grid place-items-center text-cyan-300"><Newspaper size={20}/></div>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[8px] text-slate-500"><span className="text-cyan-300 font-bold">{item?.source || "FOT10"}</span><span>•</span><span>{item?.publishedAt ? new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.publishedAt)) : "جدید"}</span></div>
              <h3 className="text-[11px] sm:text-xs font-black leading-5 mt-1 line-clamp-2">{clean(item?.title || "خبر فوتبال")}</h3>
              {item?.description && <p className="text-[9px] text-slate-500 mt-1 line-clamp-1">{clean(item.description)}</p>}
              <span className="inline-flex items-center gap-1 text-[8px] text-cyan-300 mt-1"><ExternalLink size={10}/> مشاهده خبر</span>
            </div>
          </a>
        ))}
        {!news.length && <div className="p-10 text-center text-slate-500 text-xs">فعلاً خبر تازه‌ای برای این رقابت پیدا نشد.</div>}
      </div>
    </section>
  );
}
