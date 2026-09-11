import NewsCenter from "../components/NewsCenter";

export const metadata = {
  title: "خبر فوتبال | FOT10",
  description: "مرکز حرفه‌ای خبر فوتبال ایران و جهان در FOT10.",
};

export default function NewsPage() {
  return (
    <main className="fot-shell min-h-screen pb-28" dir="rtl">
      <div className="fot-container">
        <header className="pt-2">
          <div className="text-[10px] font-black tracking-widest text-emerald-300">FOT10</div>
          <h1 className="mt-1 text-2xl font-black text-white">خبر فوتبال</h1>
          <p className="mt-1 text-[10px] font-bold text-slate-500">مرکز خبر؛ از تیتر داغ تا آخرین خبرهای تیم‌های محبوب</p>
        </header>
        <NewsCenter />
      </div>
    </main>
  );
}
