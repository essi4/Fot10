import HomeNews from "../components/HomeNews";

export const metadata = {
  title: "خبر فوتبال | FOT10",
  description: "آخرین خبرهای تازه فوتبال ایران و جهان در FOT10.",
};

export default function NewsPage() {
  return (
    <main className="fot-shell min-h-screen pb-28" dir="rtl">
      <div className="fot-container">
        <header className="mb-2 flex items-center justify-between pt-2">
          <div>
            <div className="text-[10px] font-black text-emerald-300">FOT10</div>
            <h1 className="mt-1 text-2xl font-black text-white">خبر فوتبال</h1>
            <p className="mt-1 text-[10px] font-bold text-slate-500">تازه‌ترین خبرهای فوتبال، یک‌جا</p>
          </div>
        </header>
        <HomeNews />
      </div>
    </main>
  );
}
