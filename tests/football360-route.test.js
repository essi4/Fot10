const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Football360 route is read-only and server-side", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/football360/live/route.js"), "utf8");
  assert.match(source, /process\.env\.FOOTBALL360_LIVE_API_URL/);
  assert.match(source, /fetch\(url/);
  assert.match(source, /normalizeFootball360LiveResponse/);
  assert.doesNotMatch(source, /POST|PUT|PATCH|DELETE/);
});
