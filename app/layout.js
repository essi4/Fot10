import "./globals.css";
import Golden10Theme from "../components/Golden10Theme";

export const metadata = {
  title: "FOT10 | Football Live",
  description: "Fast football scores, fixtures and match statistics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Golden10Theme>
          <a href="/account" aria-label="حساب من" className="fixed left-3 top-3 z-[60] rounded-2xl border border-white/10 bg-[#0b101a]/85 px-3 py-2 text-[11px] font-black text-slate-200 shadow-lg backdrop-blur-xl">حساب من</a>
          {children}
        </Golden10Theme>
      </body>
    </html>
  );
}
