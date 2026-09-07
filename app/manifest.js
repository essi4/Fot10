export default function manifest() {
  return {
    name: "FOT10 | Football Live",
    short_name: "FOT10",
    description: "نتایج زنده، لیگ‌ها، تیم‌ها و آمار فوتبال",
    start_url: "/",
    display: "standalone",
    background_color: "#071018",
    theme_color: "#071018",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
    ],
  };
}
