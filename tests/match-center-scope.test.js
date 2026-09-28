const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("match center exposes exactly ten selected club leagues", () => {
  const source = read("lib/match-center-scope.js");
  assert.equal((source.match(/leagueIds: \[/g) || []).length, 10);
  for (const id of [195, 39, 140, 135, 78, 61, 88, 94, 203, 307]) {
    assert.ok(source.includes("leagueIds: [" + id + "]"), "missing league " + id);
  }
});

test("national competition scope is senior-only", async () => {
  const { isMatchCenterScope } = await import("../lib/match-center-scope.js");
  assert.equal(isMatchCenterScope({ league: "UEFA Nations League", country: "Europe" }), true);
  assert.equal(isMatchCenterScope({ league: "FIFA World Cup", country: "World" }), true);
  assert.equal(isMatchCenterScope({ league: "International Friendlies", country: "World" }), true);
  for (const league of [
    "UEFA European Under-21 Championship",
    "UEFA European Under-19 Championship",
    "FIFA U20 World Cup",
    "FIFA U17 World Cup",
  ]) {
    assert.equal(isMatchCenterScope({ league, country: "World" }), false, league);
  }
});

test("club competitions outside the ten leagues are not granted by country alone", () => {
  const source = read("lib/match-center-scope.js");
  assert.match(source, /getClubLeagueScope/);
  assert.match(source, /NATIONAL_ONLY_COUNTRIES/);
  assert.match(source, /return null/);
});

test("core navigation has the four requested features", () => {
  const source = read("components/BottomNav.js");
  assert.match(source, /\["خانه", House, "\/"]/);
  assert.match(source, /\["فوتبال منتخب", Shield, "\/matches"\]/);
  assert.doesNotMatch(source, /۱۰ لیگ و تیم ملی/);
  assert.match(source, /نتایج زنده/);
  assert.match(source, /علاقه‌مندی/);
  assert.match(source, /grid-cols-4/);
});
