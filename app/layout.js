import "./globals.css";

export const metadata = {
  title: "FOT10 | پخش مینیمال",
  description: "پخش مینیمال نوستالژیک مسابقات زنده با داده واقعی.",
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
      <body>{children}</body>
    </html>
  );
}
