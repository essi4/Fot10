const SOURCES = [
  { name: "ورزش سه", key: "varzesh3", url: "https://www.varzesh3.com/rss/all", type: "rss", color: "#22c55e" },
  { name: "تسنیم فوتبال ایران", key: "tasnim-iran", url: "https://www.tasnimnews.ir/fa/service/27/%D9%81%D9%88%D8%AA%D8%A8%D8%A7%D9%84-%D8%A7%DB%8C%D8%B1%D8%A7%D9%86", type: "html", color: "#38bdf8" },
  { name: "تسنیم فوتبال جهان", key: "tasnim-world", url: "https://www.tasnimnews.ir/fa/service/1410/%D9%81%D9%88%D8%AA%D8%A8%D8%A7%D9%84-%D8%AC%D8%B0%D8%A7%D9%86", type: "html", color: "#60a5fa" },
  { name: "فوتبال ایران", key: "footballiran", url: "https://footbaliran.com/latest", type: "html", color: "#f59e0b" },
];

const MAX_AGE_MS = 60 * 60 * 1000;
export const revalidate = 300;

const clean = (value = "") => value
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;|&#x27;/gi, "'")
  .replace(/\s+/g, " ")
  .trim();

const decode = (value = "") => clean(value);

const FOOTBALL_EXCLUDES = [
  "والیبال", "بسکتبال", "هندبال", "کشتی", "وزنه برداری", "وزنه‌برداری", "بوکس", "جودو",
  "تکواندو", "دوچرخه", "شنا", "اسکی", "فرمول یک", "اتومبیلرانی", "موتورسواری", "تنیس",
  "پینگ پنگ", "بدمینتون", "ژیمناستیک", "فوتسال", "فوتبال ساحلی"
];

const FOOTBALL_KEYWORDS = [
  "فوتبال", "لیگ برتر", "جام حذفی", "جام جهانی", "لیگ قهرمانان", "لیگ اروپا", "تیم ملی",
  "استقلال", "پرسپولیس", "تراکتور", "سپاهان", "فولاد", "ذوب آهن", "ذوب‌آهن", "ملوان",
  "گل گهر", "گل‌گهر", "آلومینیوم", "چادرملو", "نساجی", "خیبر", "پیکان", "بارسلونا",
  "رئال مادرید", "رئال", "منچستر", "لیورپول", "آرسنال", "چلسی", "بایرن", "دورتموند",
  "یوونتوس", "اینتر", "میلان", "پاری سن ژرمن", "پاری‌سن‌ژرمن", "امباپه", "مسی", "رونالدو",
  "یامال", "بازیکن", "مربی", "دروازه", "پنالتی", "آفساید", "نقل و انتقالات", "نقل‌وانتقالات",
  "ترکیب", "گلزنی", "گلزن", "توپ طلا", "VAR"
];

const TEAM_ALIASES = {
  "پرسپولیس": ["پرسپولیس", "پرسپولیس تهران", "persepolis", "perspolis"],
  "رئال مادرید": ["رئال مادرید", "رئال", "real madrid", "real madrid cf"],
  "بارسلونا": ["بارسلونا", "barcelona", "fc barcelona", "barça", "barca"],
  "آرسنال": ["آرسنال", "arsenal", "arsenal fc"],
  "بایرن مونیخ": ["بایرن مونیخ", "بایرن", "bayern munich", "bayern münchen", "fc bayern"],
  "منچسترسیتی": ["منچسترسیتی", "منچستر سیتی", "منچستر سیتی", "manchester city", "man city"]
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/\u200c/g, "")
    .replace(/[أإ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

function teamMatches(item, team) {
  if (!team) return true;
  const aliases = TEAM_ALIASES[team] || [team];
  const text = normalize(`${item.title} ${item.description}`);
  return aliases.some((alias) => text.includes(normalize(alias)));
}

function isFootball(title = "", description = "", sourceKey = "") {
  if (sourceKey.startsWith("tasnim") || sourceKey === "footballiran") return true;
  const text = `${title} ${description}`.toLowerCase();
  if (FOOTBALL_EXCLUDES.some((word) => text.includes(word))) return false;
  return FOOTBALL_KEYWORDS.some((word) => text.includes(word));
}

function absolutizeImage(value, baseUrl) {
  if (!value) return "";
  try { return new URL(value, baseUrl).toString(); } catch { return ""; }
}

function getImage(item, baseUrl) {
  const candidates = [
    item.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1],
    item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1],
    item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1],
    item.match(/<(?:content:encoded|description)[^>]*>[\s\S]*?<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1],
    item.match(/<(?:content:encoded|description)[^>]*>[\s\S]*?<source[^>]+srcset=["']([^"']+)["']/i)?.[1]?.split(",")[0]?.trim()?.split(" ")[0],
    item.match(/<image[^>]*>[\s\S]*?<url[^>]*>([^<]+)<\/url>/i)?.[1],
  ];
  return absolutizeImage(candidates.find(Boolean) || "", baseUrl);
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
    const image = getImage(item, source.url);
    if (!title || !link || !pubDate || !isFresh(pubDate) || !isFootball(title, description, source.key)) return null;
    return { id: `${source.key}-${index}-${encodeURIComponent(title).slice(0, 20)}`, title, description, link, image, source: source.name, sourceKey: source.key, color: source.color, publishedAt: new Date(pubDate).toISOString() };
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
    const start = Math.max(0, match.index - 1800);
    const end = Math.min(html.length, match.index + match[0].length + 1800);
    const context = html.slice(start, end);
    const publishedAt = parseRelativeTime(context)
      || context.match(/(?:datetime|data-date|data-time|dateTime)=["']([^"']+)["']/i)?.[1]
      || context.match(/<meta[^>]+(?:property|name)=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || null;
    const image = absolutizeImage(
      context.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1]
      || context.match(/<source[^>]+srcset=["']([^"']+)["']/i)?.[1]?.split(",")[0]?.trim()?.split(" ")[0]
      || "", source.url
    );
    if (!publishedAt || !isFresh(publishedAt)) continue;
    seen.add(link);
    found.push({ id: `${source.key}-${found.length}-${encodeURIComponent(title).slice(0, 16)}`, title, description: "", link, image, source: source.name, sourceKey: source.key, color: source.color, publishedAt: new Date(publishedAt).toISOString() });
    if (found.length >= 10) break;
  }
  return found;
}

async function articleImage(link) {
  try {
    const response = await fetch(link, {
      headers: { "User-Agent": "Mozilla/5.0 FOT10-News/2.0", Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return "";
    const html = await response.text();
    return absolutizeImage(
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i)?.[1]
      || html.match(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/i)?.[1]
      || "",
      link
    );
  } catch {
    return "";
  }
}

async function fillMissingImages(items) {
  const targets = items.filter((item) => !item.image).slice(0, 12);
  const images = await Promise.all(targets.map((item) => articleImage(item.link)));
  const map = new Map(targets.map((item, index) => [item.link, images[index]]));
  return items.map((item) => ({ ...item, image: item.image || map.get(item.link) || "" }));
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0 FOT10-News/2.0" }, signal: AbortSignal.timeout(7000), cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    return source.type === "rss" ? parseRss(body, source) : parseHtml(body, source);
  } catch { return []; }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team")?.trim() || "";
  const requestedLimit = Number(searchParams.get("limit") || 5);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 10) : 5;

  const batches = await Promise.all(SOURCES.map(fetchSource));
  let news = batches.flat()
    .filter((item) => isFresh(item.publishedAt))
    .filter((item, index, all) => all.findIndex((other) => other.title === item.title) === index)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (team) news = news.filter((item) => teamMatches(item, team)).slice(0, limit);
  else news = news.slice(0, 18);

  news = await fillMissingImages(news);

  return Response.json({ ok: true, news, team: team || null, sport: "football", ttlMinutes: 60, sources: SOURCES.map(({ name, key }) => ({ name, key })), updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
