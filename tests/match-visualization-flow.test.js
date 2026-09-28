const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pagePath = path.join(process.cwd(), "app/matches/visualization/page.js");
const detailPath = path.join(process.cwd(), "app/matches/[id]/page.js");
const scopePath = path.join(process.cwd(), "lib/match-visualization-scope.js");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

test("flow contract keeps the 10-league scope explicit", () => {
  const source = read(scopePath);
  const entries = source.match(/\{ key:/g) || [];
  assert.equal(entries.length, 10);
  for (const leagueId of [195, 39, 140, 135, 78, 61, 88, 94, 203, 307]) {
    assert.match(source, new RegExp("leagueIds: \\[\\s*" + leagueId + "\\s*\\]"));
  }
});

test("visualization flow reads fixture list, details, events and lineups", () => {
  const source = read(pagePath);
  assert.match(source, /api\/football\/fixtures\?date=/);
  assert.match(source, /api\/football\/fixture\?id=\$\{id\}&section=details/);
  assert.match(source, /api\/football\/fixture\?id=\$\{id\}&section=events/);
  assert.match(source, /api\/football\/fixture\?id=\$\{id\}&section=lineups/);
  assert.match(source, /Timeline واقعی رویدادها/);
  assert.match(source, /demo=1/);
});

test("real mode never advances the event timeline as a synthetic replay", () => {
  const source = read(pagePath);
  assert.match(source, /if \(!enabled \|\| stale \|\| !running \|\| !activeDemo/);
  assert.ok(source.includes("const demoEvents = useMemo(() => DEMO.events.map"));
  assert.ok(source.includes("const feedSource = activeDemo ? demoEvents : rawEvents"));
  assert.match(source, /playersFor\(match \|\| DEMO\.details, event, tick, lineups, activeDemo\)/);
});

test("mobile QA contract protects touch targets, reduced motion and selection state", () => {
  const source = read(pagePath);
  assert.match(source, /min-h-\[44px\]/);
  assert.match(source, /touch-manipulation/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /setSelected\(\(current\) => current \|\|/);
  assert.match(source, /setStale\(true\); setRunning\(false\)/);
  assert.match(source, /lastMatchDataAt/);
  const fixturesStart = source.indexOf("async function loadFixtures");
  const matchStart = source.indexOf("async function loadMatch");
  assert.ok(fixturesStart >= 0 && matchStart > fixturesStart);
  const fixturesSection = source.slice(fixturesStart, matchStart);
  assert.doesNotMatch(fixturesSection, /setStale/);
  assert.match(source.slice(matchStart), /setLastMatchDataAt\(Date\.now\(\)\);/);
});

test("match details hands the selected fixture id into Match Vision", () => {
  const source = read(detailPath);
  assert.match(source, /\/matches\/visualization\?viz=1&fixture=\$\{encodeURIComponent\(match\.fixture\?\.id \|\| ""\)\}/);
  assert.match(source, /Timeline و Visualization/);
});
