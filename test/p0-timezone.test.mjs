import test from "node:test";
import assert from "node:assert/strict";
import { PROJECT_TIMEZONE, projectDate, addDateDays } from "../lib/project-date.mjs";

test("uses the single project timezone", () => {
  assert.equal(PROJECT_TIMEZONE, "Asia/Tehran");
});

test("keeps the Tehran date until the exact midnight boundary", () => {
  assert.equal(projectDate(0, new Date("2026-09-26T20:29:59Z")), "2026-09-26");
  assert.equal(projectDate(0, new Date("2026-09-26T20:30:00Z")), "2026-09-27");
});

test("applies date offsets without UTC/local timezone drift", () => {
  assert.equal(addDateDays("2026-09-26", -1), "2026-09-25");
  assert.equal(addDateDays("2026-09-26", 1), "2026-09-27");
});
