import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOURCES = [
  { name: "ورزش سه", key: "varzesh3", url: "https://www.varzesh3.com/rss/all", color: "#22c55e" },
  { name: "تسنیم فوتبال جهان", key: "tasnim-world", url: "https://www.tasnimnews.ir/fa/service/1410/%D9%81%D9%88%D8%AA%D8%A8%D8%A7%D9%84-%D8%AC%D9%87%D8%A7%D9%86", color: "#60a5fa" },
  { name: "فوتبال ایران", key: "footballiran", url: "https://footbaliran.com/latest", color: "#f59e0b" },
];

const TEAM_ALIASES = {
  "پرسپولیس": ["پرسپولیس", "پرسپولیس تهران", "Persepolis"],
  "رئال مادرید": ["رئال مادرید", "رئال", "Real Madrid", "Real Madrid CF"],
  "بارسلونا": ["بارسلونا", "بارسا", "Barcelona", "FC Barcelona"],
  "آرسنال": ["آرسنال", "Arsenal", "Arsenal FC"],
  "بایرن مونیخ": ["بایرن مونیخ", "بایرن", "Bayern Munich", "Bayern München"],
  "منچسترسیتی": ["منچسترسیتی", "منچستر سیتی", "Manchester City", "Man City"],
};

const clean = (v = "") => String(v).replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
const normalize = (v = "") => clean(v).toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ");

function matchesTeam(text, aliases) {
  const value = normalize(text);
  return aliases.some((alias) => value.includes(normalize(alias)));
}

function published(item) {
  const raw = clean(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]);
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  const age = Date.now() - date.getTime();
  return age >= -5 * 60 * 1000 && age <= 7 * 24 * 60 * 60 * 1000 ? date.toISOString() : null;
}

function image(item, base) {
  const value = item.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1]
    || item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1]
    || item.match(/<description[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1] || "";
  try { return value ? new URL(value, base).toString() : ""; } catch { return ""; }
}

function parseRss(xml, source, aliases) {
  return [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((m, i) => {
    const item = m[0];
    const title = clean(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    const link = clean(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]);
    const publishedAt = published(item);
    const description = clean(item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]).slice(0, 180);
    const haystack = `${title} ${description}`;
    if (!title || !link || !publishedAt || !matchesTeam(haystack, aliases)) return null;
    return { id: `${source.key}-${i}-${encodeURIComponent(title).slice(0, 24)}`, title, description, link, image: image(item, source.url), source: source.name, sourceKey: source.key, color: source.color, publishedAt };
  }).filter(Boolean);
}

async function fetchSource(source, aliases) {
  try {
    const response = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0 FOT10-TeamNews/1.0", Accept: "application/rss+xml,text/html" }, signal: AbortSignal.timeout(7000), cache: "no-store" });
    if (!response.ok) return [];
    const body = await response.text();
    return parseRss(body, source, aliases);
  } catch { return []; }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team")?.trim() || "";
  const aliases = TEAM_ALIASES[team];
  if (!aliases) return NextResponse.json({ ok: true, team, news: [], message: "تیم مورد نظر در موتور اخبار تیمی تعریف نشده است." });

  const batches = await Promise.all(SOURCES.map((source) => fetchSource(source, aliases)));
  const news = batches.flat()
    .filter((item, index, all) => all.findIndex((other) => normalize(other.title) === normalize(item.title)) === index)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 5);

  return NextResponse.json({ ok: true, team, count: news.length, news, updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
