const SOURCES = [
  { name: "ورزش سه", key: "varzesh3", url: "https://www.varzesh3.com/rss/all", type: "rss", color: "#22c55e" },
  { name: "تسنیم", key: "tasnim", url: "https://www.tasnimnews.ir/fa/keyword/74/%D9%88%D8%B1%D8%B2%D8%B4", type: "html", color: "#38bdf8" },
  { name: "فوتبال ایران", key: "footballiran", url: "https://footbaliran.com/latest", type: "html", color: "#f59e0b" },
];

export const revalidate = 300;

const clean = (value = "") => value
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const decode = (value = "") => clean(value);

function parseRss(xml, source) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return items.map((item, index) => {
    const title = decode(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    const link = clean(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]);
    const description = decode(item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]).slice(0, 150);
    const pubDate = clean(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]);
    if (!title || !link) return null;
    return { id: `${source.key}-${index}-${encodeURIComponent(title).slice(0, 20)}`, title, description, link, source: source.name, sourceKey: source.key, color: source.color, publishedAt: pubDate || null };
  }).filter(Boolean);
}

function parseHtml(html, source) {
  const found = [];
  const seen = new Set();
  const patterns = source.key === "tasnim"
    ? [/href=["'](https?:\/\/www\.tasnimnews\.ir\/fa\/news\/[^"']+)["'][^>]*>[\s\S]{0,600}?<[^>]*>([^<]{12,180})<\//gi]
    : [/href=["'](https?:\/\/footbaliran\.com\/[^"']+)["'][^>]*>[\s\S]{0,300}?<[^>]*>([^<]{12,180})<\//gi];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const link = match[1];
      const title = clean(match[2]);
      if (!title || !link || seen.has(link) || title.length < 12) continue;
      seen.add(link);
      found.push({ id: `${source.key}-${found.length}`, title, description: "", link, source: source.name, sourceKey: source.key, color: source.color, publishedAt: null });
      if (found.length >= 8) break;
    }
  }
  return found;
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "FOT10-News/1.0" },
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    return source.type === "rss" ? parseRss(body, source) : parseHtml(body, source);
  } catch {
    return [];
  }
}

export async function GET() {
  const batches = await Promise.all(SOURCES.map(fetchSource));
  const news = batches.flat().filter((item, index, all) => all.findIndex((other) => other.title === item.title) === index).slice(0, 18);
  return Response.json({ ok: true, news, sources: SOURCES.map(({ name, key }) => ({ name, key })), updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
}
