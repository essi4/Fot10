import "./globals.css";

export const metadata = {
  title: "FOT10 | Football Live",
  description: "Fast football scores, fixtures and match statistics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
