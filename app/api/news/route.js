const SOURCES = [
  { name: "ورزش سه", key: "varzesh3", url: "https://www.varzesh3.com/rss/all", type: "rss", color: "#22c55e" },
  { name: "تسنیم فوتبال ایران", key: "tasnim-iran", url: "https://www.tasnimnews.ir/fa/service/27/%D9%81%D9%88%D8%AA%D8%A8%D8%A7%D9%84-%D8%A7%DB%8C%D8%B1%D8%A7%D9%86", type: "html", color: "#38bdf8" },
  { name: "تسنیم فوتبال جهان", key: "tasnim-world", url: "https://www.tasnimnews.ir/fa/service/1410/%D9%81%D9%88%D8%AA%D8%A8%D8%A7%D9%84-%D8%AC%D9%87%D8%A7%D9%86", type: "html", color: "#60a5fa" },
  { name: "فوتبال ایران", key: "footballiran", url: "https://footbaliran.com/latest", type: "html", color: "#f59e0b" },
];

// فقط خبرهای منتشرشده در ۶۰ دقیقه اخیر وارد فید می‌شوند.
const MAX_AGE_MS = 60 * 60 * 1000;
export const revalidate = 300;

const clean = (value = "") => value
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#x27;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const decode = (value = "") => clean(value);

const FOOTBALL_EXCLUDES = [
  "والیبال", "بسکتبال", "هندبال", "کشتی", "وزنه برداری", "وزنه‌برداری",
  "بوکس", "جودو", "تکواندو", "دوچرخه", "شنا", "اسکی", "فرمول یک",
  "اتومبیلرانی", "موتورسواری", "تنیس", "پینگ پنگ", "بدمینتون", "ژیمناستیک",
  "فوتسال", "فوتبال ساحلی"
];

const FOOTBALL_KEYWORDS = [
  "فوتبال", "لیگ برتر", "جام حذفی", "جام جهانی", "لیگ قهرمانان", "لیگ اروپا",
  "تیم ملی", "استقلال", "پرسپولیس", "تراکتور", "سپاهان", "فولاد", "ذوب آهن",
  "ذوب‌آهن", "ملوان", "گل گهر", "گل‌گهر", "آلومینیوم", "چادرملو", "نساجی",
  "خیبر", "پیکان", "بارسلونا", "رئال مادرید", "رئال", "منچستر", "لیورپول",
  "آرسنال", "چلسی", "بایرن", "دورتموند", "یوونتوس", "اینتر", "میلان",
  "پاری سن ژرمن", "پاری‌سن‌ژرمن", "امباپه", "مسی", "رونالدو", "یامال",
  "بازیکن", "مربی", "دروازه", "پنالتی", "آفساید", "نقل و انتقالات", "نقل‌وانتقالات",
  "ترکیب", "گلزنی", "گلزن", "توپ طلا", "VAR"
];

function isFootball(title = "", description = "", sourceKey = "") {
  if (sourceKey.startsWith("tasnim") || sourceKey === "footballiran") return true;
  const text = `${title} ${description}`.toLowerCase();
  if (FOOTBALL_EXCLUDES.some((word) => text.includes(word))) return false;
  return FOOTBALL_KEYWORDS.some((word) => text.includes(word));
}

function getImage(item) {
  return clean(
    item.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1]
    || item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1]
    || item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1]
    || item.match(/<image[^>]*>\s*(?:<url>)?([^<\s]+)(?:<\/url>)?\s*<\/image>/i)?.[1]
    || ""
  );
}

function isFresh(date) {
  const time = date ? new Date(date).getTime() : NaN;
  if (!Number.isFinite(time)) return false;
  const age = Date.now() - time;
  return age >= -5 * 60 * 1000 && age <= MAX_AGE_MS;
}

function parseRss(xml, source) {
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return items.map((item, index) => {
    const title = decode(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    const link = clean(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]);
    const description = decode(item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]).slice(0, 150);
    const pubDate = clean(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]);
    const image = getImage(item);
    if (!title || !link || !pubDate || !isFresh(pubDate) || !isFootball(title, description, source.key)) return null;
    return {
      id: `${source.key}-${index}-${encodeURIComponent(title).slice(0, 20)}`,
      title,
      description,
      link,
      image,
      source: source.name,
      sourceKey: source.key,
      color: source.color,
      publishedAt: new Date(pubDate).toISOString(),
    };
  }).filter(Boolean);
}

function parseRelativeTime(text) {
  const normalized = clean(text)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const minute = normalized.match(/(\d+)\s*دقیقه\s*پیش/);
  const hour = normalized.match(/(\d+)\s*ساعت\s*پیش/);
  if (minute) return new Date(Date.now() - Number(minute[1]) * 60 * 1000).toISOString();
  if (hour) return new Date(Date.now() - Number(hour[1]) * 60 * 60 * 1000).toISOString();
  return null;
}

function parseHtml(html, source) {
  const found = [];
  const seen = new Set();
  const linkPattern = source.key.startsWith("tasnim")
    ? /href=["'](https?:\/\/www\.tasnimnews\.ir\/fa\/news\/[^"']+)["'][^>]*>[\s\S]{0,900}?<[^>]*>([^<]{12,220})<\//gi
    : /href=["'](https?:\/\/footbaliran\.com\/[^"']+)["'][^>]*>[\s\S]{0,900}?<[^>]*>([^<]{12,220})<\//gi;

  for (const match of html.matchAll(linkPattern)) {
    const link = match[1];
    const title = clean(match[2]);
    if (!title || !link || seen.has(link) || title.length < 12 || !isFootball(title, "", source.key)) continue;

    const start = Math.max(0, match.index - 1600);
    const end = Math.min(html.length, match.index + match[0].length + 1600);
    const context = html.slice(start, end);
    const publishedAt = parseRelativeTime(context)
      || context.match(/(?:datetime|data-date|data-time|dateTime)=["']([^"']+)["']/i)?.[1]
      || context.match(/<meta[^>]+(?:property|name)=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || null;
    const image = clean(
      context.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1]
      || context.match(/<source[^>]+srcset=["']([^"']+)["']/i)?.[1]?.split(",")[0]?.trim()?.split(" ")[0]
      || ""
    );

    if (!publishedAt || !isFresh(publishedAt)) continue;
    seen.add(link);
    found.push({
      id: `${source.key}-${found.length}-${encodeURIComponent(title).slice(0, 16)}`,
      title,
      description: "",
      link,
      image,
      source: source.name,
      sourceKey: source.key,
      color: source.color,
      publishedAt: new Date(publishedAt).toISOString(),
    });
    if (found.length >= 10) break;
  }
  return found;
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "FOT10-News/1.0" },
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
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
  const news = batches.flat()
    .filter((item) => isFresh(item.publishedAt))
    .filter((item, index, all) => all.findIndex((other) => other.title === item.title) === index)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 18);

  return Response.json(
    { ok: true, news, sport: "football", ttlMinutes: 60, sources: SOURCES.map(({ name, key }) => ({ name, key })), updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
