"use strict";

const TERMINAL_STATUS = new Set(["FT", "AET", "PEN"]);
const HALFTIME_STATUS = new Set(["HT"]);
const LIVE_STATUS = new Set(["1H", "2H", "ET", "P", "BT", "LIVE", "IN PLAY"]);
const { toCanonicalEvent, dedupeCanonicalEvents } = require("./canonical-event.cjs");

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function teamIdentity(team) {
  return {
    id: team?.id == null ? "" : String(team.id),
    name: normalizeText(team?.name),
  };
}

function eventTeam(event) {
  return {
    id: event?.team?.id == null ? "" : String(event.team.id),
    name: normalizeText(event?.team?.name || event?.team || ""),
  };
}

function eventSide(event, details) {
  const home = teamIdentity(details?.teams?.home);
  const away = teamIdentity(details?.teams?.away);
  const team = eventTeam(event);
  if (team.id && team.id === home.id) return "home";
  if (team.id && team.id === away.id) return "away";
  if (team.name && team.name === home.name) return "home";
  if (team.name && team.name === away.name) return "away";
  return "";
}

function eventMinute(event) {
  const raw = event?.time?.elapsed ?? event?.minute;
  const minute = Number(raw);
  return Number.isFinite(minute) ? minute : null;
}

function eventExtra(event) {
  const raw = event?.time?.extra ?? event?.extra;
  const extra = Number(raw);
  return Number.isFinite(extra) && extra > 0 ? extra : null;
}

function minuteLabel(minute, extra) {
  if (minute == null) return "—";
  return extra ? `${minute}+${extra}'` : `${minute}'`;
}

function eventKey(event, index) {
  const minute = eventMinute(event);
  const team = eventTeam(event);
  const player = String(event?.player?.id ?? event?.player?.name ?? event?.player ?? "");
  const detail = String(event?.detail ?? event?.label ?? "");
  const type = String(event?.type ?? "");
  const providerId = event?.id == null ? "" : String(event.id);
  return [providerId || type, minute, eventExtra(event), team.id || team.name, player, detail].join("|");
}

function normalizeEvent(event, details, index = 0) {
  const rawType = normalizeText(event?.type);
  const detail = normalizeText(event?.detail);
  const playerName = event?.player?.name || "";
  const assistName = event?.assist?.name || "";
  const minute = eventMinute(event);
  if (minute == null) return null;

  if (event?.label && !event?.time && !event?.team?.id && typeof event.team !== "object") {
    const explicitType = rawType === "goal" ? "goal"
      : rawType === "card" ? "card"
      : rawType === "subst" ? "substitution"
      : rawType;
    return {
      key: event.key || eventKey(event, index),
      type: explicitType,
      minute,
      extra: eventExtra(event),
      minuteLabel: minuteLabel(minute, eventExtra(event)),
      team: typeof event.team === "string" ? event.team : "",
      side: event.side || "",
      label: event.label,
      icon: event.icon || "•",
      red: Boolean(event.red),
      player: playerName,
      assist: assistName,
    };
  }

  const teamName = event?.team?.name || "";
  if (rawType === "goal") {
    const missed = detail.includes("missed penalty") || detail === "missed penalty";
    if (missed) {
      return {
        key: eventKey(event, index),
        type: "shot",
        minute,
        extra: eventExtra(event),
        minuteLabel: minuteLabel(minute, eventExtra(event)),
        team: teamName,
        side: eventSide(event, details),
        label: `پنالتی از دست رفته ${teamName}`.trim(),
        icon: "🎯",
        player: playerName,
        assist: assistName,
      };
    }
    return {
      key: eventKey(event, index),
      type: "goal",
      minute,
      extra: eventExtra(event),
      minuteLabel: minuteLabel(minute, eventExtra(event)),
      team: teamName,
      side: eventSide(event, details),
      label: `گل ${teamName}`.trim(),
      icon: "⚽",
      player: playerName,
      assist: assistName,
      detail: event?.detail || "",
    };
  }

  if (rawType === "card") {
    const red = detail.includes("red") || detail.includes("second yellow") || detail.includes("second_yellow");
    return {
      key: eventKey(event, index),
      type: "card",
      minute,
      extra: eventExtra(event),
      minuteLabel: minuteLabel(minute, eventExtra(event)),
      team: teamName,
      side: eventSide(event, details),
      label: `${red ? "کارت قرمز" : "کارت زرد"} ${teamName}`.trim(),
      icon: red ? "🟥" : "🟨",
      red,
      player: playerName,
      assist: assistName,
      detail: event?.detail || "",
    };
  }

  if (rawType === "subst" || rawType === "substitution") {
    return {
      key: eventKey(event, index),
      type: "substitution",
      minute,
      extra: eventExtra(event),
      minuteLabel: minuteLabel(minute, eventExtra(event)),
      team: teamName,
      side: eventSide(event, details),
      label: `تعویض ${teamName}`.trim(),
      icon: "🔄",
      player: playerName,
      assist: assistName,
      detail: event?.detail || "",
    };
  }

  if (rawType === "var") {
    return {
      key: eventKey(event, index),
      type: "var",
      minute,
      extra: eventExtra(event),
      minuteLabel: minuteLabel(minute, eventExtra(event)),
      team: teamName,
      side: eventSide(event, details),
      label: `VAR ${teamName}`.trim(),
      icon: "📺",
      player: playerName,
      assist: assistName,
      detail: event?.detail || "",
    };
  }

  if (rawType === "shots" || detail.includes("shot") || detail.includes("missed penalty")) {
    return {
      key: eventKey(event, index),
      type: "shot",
      minute,
      extra: eventExtra(event),
      minuteLabel: minuteLabel(minute, eventExtra(event)),
      team: teamName,
      side: eventSide(event, details),
      label: `شوت ${teamName}`.trim(),
      icon: "🎯",
      player: playerName,
      assist: assistName,
      detail: event?.detail || "",
    };
  }

  return null;
}

function buildVisualizationFeed(rawEvents = [], details = null, demo = false) {
  const out = [];
  const events = Array.isArray(rawEvents) ? rawEvents : [];
  const canonicalEvents = dedupeCanonicalEvents(events
    .map((event, index) => toCanonicalEvent(event, details, index))
    .filter(Boolean));
  const canonicalIds = new Set(canonicalEvents.map((event) => event.event_id));
  events.forEach((event, index) => {
    const normalized = normalizeEvent(event, details, index);
    if (normalized && (!normalized.canonicalEvent || canonicalIds.has(normalized.canonicalEvent.event_id))) out.push(normalized);
  });

  if (demo) {
    return out.sort((a, b) => a.minute - b.minute || a.key.localeCompare(b.key));
  }

  const status = String(details?.fixture?.status?.short || "").toUpperCase();
  const startedStatus = new Set([...LIVE_STATUS, ...HALFTIME_STATUS, ...TERMINAL_STATUS]);
  const hasStarted = startedStatus.has(status) || Boolean(details?.fixture?.status?.elapsed);
  if (details && hasStarted && !out.some((event) => event.type === "kickoff")) {
    out.unshift({
      key: "kickoff",
      type: "kickoff",
      minute: 1,
      extra: null,
      minuteLabel: "1'",
      team: "",
      side: "",
      label: "شروع مسابقه",
      icon: "•",
    });
  }

  if (
    details &&
    !out.some((event) => event.type === "halftime") &&
    (HALFTIME_STATUS.has(status) || ["2H", "ET", "P", "BT", "FT", "AET", "PEN"].includes(status))
  ) {
    out.push({
      key: "halftime",
      type: "halftime",
      minute: 45,
      extra: null,
      minuteLabel: "45'",
      team: "",
      side: "",
      label: "پایان نیمه اول",
      icon: "•",
    });
  }

  if (
    details &&
    !out.some((event) => event.type === "finished") &&
    TERMINAL_STATUS.has(status)
  ) {
    const minute = Number(details?.fixture?.status?.elapsed) || 90;
    out.push({
      key: "finished",
      type: "finished",
      minute,
      extra: null,
      minuteLabel: minuteLabel(minute, null),
      team: "",
      side: "",
      label: "پایان مسابقه",
      icon: "•",
    });
  }

  return [...new Map(out.map((event) => [event.key, event])).values()]
    .sort((a, b) => a.minute - b.minute || a.key.localeCompare(b.key));
}

function normalizeFixtureSummary(match) {
  if (!match) return null;
  const status = String(match?.fixture?.status?.short || "").toUpperCase();
  return {
    status,
    phase: TERMINAL_STATUS.has(status)
      ? "finished"
      : HALFTIME_STATUS.has(status)
        ? "halftime"
        : LIVE_STATUS.has(status)
          ? "live"
          : status
            ? "upcoming"
            : "unknown",
    elapsed: Number.isFinite(Number(match?.fixture?.status?.elapsed))
      ? Number(match.fixture.status.elapsed)
      : null,
    score: {
      home: Number.isFinite(Number(match?.goals?.home)) ? Number(match.goals.home) : null,
      away: Number.isFinite(Number(match?.goals?.away)) ? Number(match.goals.away) : null,
    },
  };
}

module.exports = {
  TERMINAL_STATUS,
  HALFTIME_STATUS,
  LIVE_STATUS,
  normalizeText,
  normalizeEvent,
  buildVisualizationFeed,
  normalizeFixtureSummary,
  eventSide,
};
