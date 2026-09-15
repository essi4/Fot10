"use client";

import { useEffect } from "react";

function dateFromLink(href) {
  try {
    return new URL(href, window.location.origin).searchParams.get("date");
  } catch {
    return null;
  }
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

        const jobs = cards.map(async (card) => {
          const date = dateFromLink(card.getAttribute("href"));
          if (!date) return;
          try {
            const response = await fetch(`/api/football/fixtures?date=${date}`, { cache: "no-store" });
            if (!response.ok || cancelled) return;
            const payload = await response.json();
            if (cancelled) return;
            const value = stats(payload.matches);
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
              const value = stats(payload.matches);
              applyCard(
                liveCard,
                value.count ? `${value.count} بازی` : "بدون بازی",
                `${value.leagues} لیگ`
              );
            } catch {}
          })());
        }

        await Promise.allSettled(jobs);
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
