const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd());
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("match center exposes exactly twelve selected club leagues", () => {
  const source = read("lib/match-center-scope.js");
  assert.equal((source.match(/leagueIds: \[/g) || []).length, 12);
  for (const id of [195, 39, 140, 135, 78, 61, 88, 94, 203, 307, 128, 71]) {
    assert.ok(source.includes("leagueIds: [" + id + "]"), "missing league " + id);
  }
});

test("national competition scope is senior-only and anchored to the twelve selected countries", async () => {
  const { isMatchCenterScope } = await import("../lib/match-center-scope.js");
  const match = (home, away, league = "UEFA Nations League") => ({ home, away, league, country: "Europe" });

  assert.equal(isMatchCenterScope(match("Türkiye", "Italy")), true);
  assert.equal(isMatchCenterScope(match("Belgium", "France")), true);
  assert.equal(isMatchCenterScope(match("Belgium", "Ukraine")), false);
  assert.equal(isMatchCenterScope(match("England", "Spain", "International Friendlies")), true);
  assert.equal(isMatchCenterScope(match("Belgium", "Netherlands", "FIFA World Cup")), true);

  for (const league of [
    "UEFA European Under-21 Championship",
    "UEFA European Under-19 Championship",
    "FIFA U20 World Cup",
    "FIFA U17 World Cup",
  ]) {
    assert.equal(isMatchCenterScope(match("France U21", "Belgium U21", league)), false, league);
  }
});

test("club competitions outside the twelve leagues are not granted by country alone", () => {
  const source = read("lib/match-center-scope.js");
  assert.match(source, /getClubLeagueScope/);
  assert.match(source, /return null/);
});

test("core navigation has the four requested features", () => {
  const source = read("components/BottomNav.js");
  assert.match(source, /["خانه", House, "\/"]/);
  assert.match(source, /["فوتبال منتخب", Shield, "\/leagues"]/);
  assert.doesNotMatch(source, /۱۰ لیگ و تیم ملی/);
  assert.match(source, /نتایج زنده/);
  assert.match(source, /علاقه‌مندی/);
  assert.match(source, /grid-cols-4/);
});
