export const PROJECT_TIMEZONE = "Asia/Tehran";

function projectDateParts(instant = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PROJECT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

function assertDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new Error(`Invalid date-only value: ${value}`);
  }
}

export function projectDate(offset = 0, instant = new Date()) {
  const { year, month, day } = projectDateParts(instant);
  return addDateDays(`${year}-${month}-${day}`, offset);
}

export function addDateDays(dateOnly, offset = 0) {
  assertDateOnly(dateOnly);

  const date = new Date(`${dateOnly}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(offset || 0));

  return date.toISOString().slice(0, 10);
}

export function formatProjectDate(dateOnly) {
  assertDateOnly(dateOnly);

  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: PROJECT_TIMEZONE,
  }).format(new Date(`${dateOnly}T12:00:00Z`));
}
