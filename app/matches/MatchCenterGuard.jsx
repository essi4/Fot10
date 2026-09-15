"use client";

import { useEffect } from "react";

function dateFromLink(href) {
  try {
    return new URL(href, window.location.origin).searchParams.get("date");
  } catch {
    return null;
  }
}

function iranDate(offset = 0) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now).reduce((a, p) => ({ ...a, [p.type]: p.value }), {});
  const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+03:30`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function scoreOf(match) {
  const candidates = [
    match?.homeScore,
    match?.scoreHome,
    match?.goalsHome,
    match?.score?.home,
    match?.score?.fulltime?.home,
    match?.score?.fullTime?.home,
  ];
  const value = candidates.find((item) => item !== null && item !== undefined && item !== "");
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stats(matches) {
  const rows = Array.isArray(matches) ? matches : [];
  const leagues = new Set(
    rows.map((match) => `${match?.country || ""}|${match?.league || "مسابقات"}`)
  );
  const goals = rows.reduce(
    (sum, match) =>
      sum +
      scoreOf(match) +
      scoreOf({
        scoreHome: match?.awayScore,
        score: { home: match?.score?.away },
      }),
    0
  );
  return { count: rows.length, leagues: leagues.size, goals };
}

function applyCard(link, value, extra) {
  if (!link) return;
  const strong = link.querySelector("strong");
  const spans = link.querySelectorAll("span");
  const extraNode = spans.length ? spans[spans.length - 1] : null;
  if (strong) strong.textContent = value;
  if (extraNode && extra) extraNode.textContent = extra;
}

function syncBottomStats({ live, today }) {
  const grids = Array.from(document.querySelectorAll("div.grid-cols-3"));
  const grid = grids.find((node) =>
    Array.from(node.querySelectorAll("b")).some((item) => item.textContent?.trim() === "لیگ‌ها")
  );
  if (!grid) return;

  const cards = Array.from(grid.children).filter((node) => node instanceof HTMLElement);
  if (cards.length < 3) return;

  const liveCount = Number(live?.count || 0);
  const liveLeagues = Number(live?.leagues || 0);
  const todayCount = Number(today?.count || 0);
  const todayLeagues = Number(today?.leagues || 0);

  const firstValue = cards[0].lastElementChild;
  const secondValue = cards[1].lastElementChild;
  const thirdValue = cards[2].lastElementChild;
  if (firstValue) firstValue.textContent = `${liveCount} بازی`;
  if (secondValue) secondValue.textContent = `${todayCount} بازی`;
  if (thirdValue) thirdValue.textContent = `${todayLeagues}`;

  // On the dedicated LIVE page the middle card is also a live count.
  const middleLabel = cards[1].querySelector("b")?.textContent?.trim();
  if (middleLabel === "لحظه‌ای" && secondValue) secondValue.textContent = `${liveCount} بازی`;

  // Keep the live card internally consistent even when the main fixture list is still loading.
  const firstLabel = cards[0].querySelector("b")?.textContent?.trim();
  if (firstLabel === "زنده" && firstValue) firstValue.textContent = `${liveCount} بازی`;
  void liveLeagues;
}

export default function MatchCenterGuard() {
  useEffect(() => {
    let cancelled = false;
    let running = false;

    const run = async () => {
      if (cancelled || running) return;
      running = true;
      try {
        const links = Array.from(document.querySelectorAll('a[href^="/matches"]'));
        const cards = links.filter((link) => /(^|\?)date=/.test(link.getAttribute("href") || ""));
        const liveCard = links.find((link) => (link.getAttribute("href") || "").includes("live=1"));
        const dayValues = new Map();
        let liveValue = null;

        const jobs = cards.map(async (card) => {
          const date = dateFromLink(card.getAttribute("href"));
          if (!date) return;
          try {
            const response = await fetch(`/api/football/fixtures?date=${date}`, { cache: "no-store" });
            if (!response.ok || cancelled) return;
            const payload = await response.json();
            if (cancelled) return;
            const value = stats(payload.matches);
            dayValues.set(date, value);
            const label = card.querySelector("b")?.textContent?.trim() || "";
            const extra = label === "فردا"
              ? `${value.leagues} لیگ · برنامه`
              : `${value.leagues} لیگ · ${value.goals} گل`;
            applyCard(card, `${value.count} بازی`, extra);
          } catch {}
        });

        if (liveCard) {
          jobs.push((async () => {
            try {
              const response = await fetch(`/api/football/live?t=${Date.now()}`, { cache: "no-store" });
              if (!response.ok || cancelled) return;
              const payload = await response.json();
              if (cancelled) return;
              liveValue = stats(payload.matches);
              applyCard(
                liveCard,
                liveValue.count ? `${liveValue.count} بازی` : "بدون بازی",
                `${liveValue.leagues} لیگ`
              );
            } catch {}
          })());
        }

        await Promise.allSettled(jobs);
        if (cancelled) return;

        const todayValue = dayValues.get(iranDate(0)) || null;
        syncBottomStats({ live: liveValue, today: todayValue });
      } finally {
        running = false;
      }
    };

    const initialTimer = window.setTimeout(run, 600);
    const refreshTimer = window.setInterval(run, 30000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  return null;
}
