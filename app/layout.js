import "./globals.css";
import Golden10Theme from "../components/Golden10Theme";
import PushBell from "../components/PushBell";
import BottomNav from "../components/BottomNav";

export const metadata = {
  title: "FOT10 | Football Live",
  description: "نتایج زنده، لیگ‌ها، تیم‌ها و آمار کامل فوتبال.",
  applicationName: "FOT10",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#071018",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Golden10Theme>
          <a href="/account" aria-label="حساب من" className="fixed left-3 top-3 z-[60] rounded-2xl border border-white/10 bg-[#0b101a]/85 px-3 py-2 text-[11px] font-black text-slate-200 shadow-lg backdrop-blur-xl">حساب من</a>
          <PushBell />
          {children}
          <BottomNav />
        </Golden10Theme>
      </body>
    </html>
  );
}
