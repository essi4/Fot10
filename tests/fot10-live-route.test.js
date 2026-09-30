const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("FOT10 unified live route stays server-side", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/fot10/live/route.js"), "utf8");
  assert.match(source, /fetchFootball360/);
  assert.match(source, /getMatches/);
  assert.match(source, /fetchEspnFallback/);
  assert.match(source, /resolveLiveMatches/);
  assert.match(source, /export async function GET/);
  assert.doesNotMatch(source, /export async function POST/);
});