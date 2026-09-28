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

test("visualization consumes Football360 live signals and real fixture data when a provider id exists", () => {
  const source = read(pagePath);
  assert.match(source, /\/api\/football360\/live/);
  assert.match(source, /Football360/);
  assert.match(source, /\/api\/football\/fixture\?id=\$\{providerId\}&section=details/);
  assert.match(source, /\/api\/football\/fixture\?id=\$\{providerId\}&section=events/);
  assert.match(source, /\/api\/football\/fixture\?id=\$\{providerId\}&section=lineups/);
  assert.match(source, /هر مسابقه‌ای که سیگنال پخش زنده دریافت کند/);
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
