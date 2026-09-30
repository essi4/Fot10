const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pagePath = path.join(process.cwd(), "app/matches/visualization/page.js");
const homePath = path.join(process.cwd(), "app/page.js");
const layoutPath = path.join(process.cwd(), "app/layout.js");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

test("FOT10 home is the minimalist broadcast", () => {
  const source = read(homePath);
  assert.match(source, /export \{ default \} from "\.\/matches\/visualization\/page"/);
});

test("visualization consumes the unified live resolver and real fixture data when a provider id exists", () => {
  const source = read(pagePath);
  // قرارداد ۱: endpoint قدیمی مستقیماً مصرف نمی‌شود
  assert.doesNotMatch(source, /\/api\/football360\/live/);
  // قرارداد ۲: Unified Live Resolver endpoint مصرف می‌شود
  assert.match(source, /\/api\/fot10\/live/);
  // قرارداد ۳: Football360 هنوز به‌عنوان provider معتبر شناخته می‌شود
  assert.match(source, /broadcastSource\s*===\s*["']football360["']/);
  assert.match(source, /categoryLabel/);
  assert.match(source, /\/api\/football\/fixture\?id=\$\{providerId\}&section=details/);
  assert.match(source, /\/api\/football\/fixture\?id=\$\{providerId\}&section=events/);
  assert.match(source, /\/api\/football\/fixture\?id=\$\{providerId\}&section=lineups/);
  assert.match(source, /بازی‌های مهم زنده/);
  assert.match(source, /لیگ‌ها/);
  assert.match(source, /ملی/);
  assert.match(source, /SOURCE DOWN/);
  assert.match(source, /NO_MATCH/);
});

test("retro player sprites are clearly illustrative and not live positional data", () => {
  const source = read(pagePath);
  assert.match(source, /RetroPlayerSprite/);
  assert.match(source, /چیدمان پیکسلی · نمایشی؛ موقعیت لحظه‌ای نیست/);
  assert.match(source, /motion-reduce/);
});

test("demo mode remains explicitly isolated", () => {
  const source = read(pagePath);
  assert.match(source, /sp\.get\("demo"\) === "1"/);
  assert.match(source, /DEMO MATCH/);
  assert.match(source, /activeDemo/);
});

test("old product navigation is not part of the new shell", () => {
  const source = read(layoutPath);
  assert.doesNotMatch(source, /BottomNav/);
  assert.doesNotMatch(source, /PushBell/);
  assert.doesNotMatch(source, /LanguageToggle/);
  assert.doesNotMatch(source, /حساب من/);
});

test("touch targets and stale-data protection remain in the broadcast UI", () => {
  const source = read(pagePath);
  assert.match(source, /min-h-\[44px\]/);
  assert.match(source, /touch-manipulation/);
  assert.match(source, /lastMatchDataAt/);
  assert.match(source, /setStale\(true\)/);
  assert.match(source, /داده تازه دریافت نشد؛ نمایش زنده متوقف می‌شود/);
});

test("live empty state distinguishes source down from no match", () => {
  const source = read(pagePath);
  assert.match(source, /function LiveEmptyState/);
  assert.match(source, /data-testid="live-empty-state"/);
  assert.match(source, /اسکن پخش زنده/);
  assert.match(source, /هنوز مسابقه زنده‌ای پیدا نشد/);
  assert.match(source, /منابع داده زنده در دسترس نیستند/);
  assert.match(source, /SOURCE DOWN/);
  assert.match(source, /WAITING FOR SIGNAL/);
  assert.match(source, /آخرین بررسی سیگنال/);
  assert.match(source, /RETRO PITCH/);
  assert.match(source, /motion-reduce|prefers-reduced-motion/);
  assert.doesNotMatch(source, /منتظر سیگنال زنده هستیم/);
  assert.doesNotMatch(source, /typewriter/);
  assert.doesNotMatch(source, /parallax/i);
});

test("retro final appearance uses a pixel grid and old-broadcast treatment", () => {
  const source = read(pagePath);
  const css = read(path.join(process.cwd(), "app/globals.css"));
  assert.match(source, /fot-retro-page/);
  assert.match(source, /retro-monitor-screen/);
  assert.match(source, /retro-empty-player/);
  assert.match(source, /retro-empty-ball/);
  assert.match(source, /RetroPlayerSprite/);
  assert.match(css, /--retro-field:#1a6b2c/);
  assert.match(css, /aspect-ratio:4\/3/);
  assert.match(css, /image-rendering:pixelated/);
  assert.match(css, /border-radius:0/);
  assert.match(css, /@keyframes retroLamp/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
