import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECT_TIMEZONE,
  addDateDays,
  formatProjectDate,
  projectDate,
} from "../lib/project-date.js";

test("uses Asia/Tehran as the project timezone", () => {
  assert.equal(PROJECT_TIMEZONE, "Asia/Tehran");
});

test("keeps 2026-09-24 until the Tehran midnight boundary", () => {
  assert.equal(projectDate(0, new Date("2026-09-24T20:29:59Z")), "2026-09-24");
  assert.equal(projectDate(0, new Date("2026-09-24T20:30:00Z")), "2026-09-25");
});

test("supports date-only day offsets without timezone drift", () => {
  assert.equal(addDateDays("2026-09-24", -1), "2026-09-23");
  assert.equal(addDateDays("2026-09-24", 1), "2026-09-25");
});

test("formats 2026-09-24 as Thursday 2 Mehr 1405", () => {
  assert.equal(formatProjectDate("2026-09-24"), "پنجشنبه ۲ مهر");
});
