export const dynamic = "force-dynamic";

const SOURCES = [
  { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { name: "Sky Sports", url: "https://www.skysports.com/rss/12040" },
];

function tagFromTitle(title = "") {
  const t = title.toLowerCase();
  if (t.includes("iran") || t.includes("ایران")) return "ایران";
  if (t.includes("world cup") || t.includes("جام جهانی")) return "جام جهانی";
  if (t.includes("champions league") || t.includes("لیگ قهرمانان")) return "لیگ قهرمانان";
  if (t.includes("transfer") || t.includes("نقل و انتقال") || t.includes("انتقال")) return "نقل‌وانتقالات";
  return "فوتبال جهان";
}

function parseXml(xml, source) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)];
  return items.map((m, index) => {
    const block = m[0];
    const get = (tag) => {
      const hit = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return hit ? hit[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim() : "";
    };
    const title = get("title");
    const link = get("link");
    const date = get("pubDate");
    return { id: `${source.name}-${index}-${Buffer.from(title).toString("base64url").slice(0, 12)}`, title, link, publishedAt: date || null, source: source.name, tag: tagFromTitle(title) };
  }).filter((x) => x.title && x.link);
}

export async function GET() {
  const results = await Promise.allSettled(SOURCES.map(async (source) => {
    const response = await fetch(source.url, { cache: "no-store", headers: { "user-agent": "FOT10-News/1.0" } });
    if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
    return parseXml(await response.text(), source);
  }));
  const items = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
  const unique = new Map();
  for (const item of items) {
    const key = item.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (!unique.has(key)) unique.set(key, item);
  }
  const news = [...unique.values()].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  return Response.json({ ok: true, count: news.length, news: news.slice(0, 40) }, { headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" } });
}
