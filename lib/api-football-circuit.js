const FAILURE_THRESHOLD = 2;
const COOLDOWN_MS = 5 * 60 * 1000;

let consecutiveFailures = 0;
let openedAt = 0;
let inFlight = null;

function isOpen() {
  return openedAt > 0 && Date.now() - openedAt < COOLDOWN_MS;
}

function openCircuit() {
  openedAt = Date.now();
}

export function getApiFootballCircuitState() {
  return {
    open: isOpen(),
    consecutiveFailures,
    cooldownMs: COOLDOWN_MS,
    retryAt: openedAt ? new Date(openedAt + COOLDOWN_MS).toISOString() : null,
  };
}

export async function runWithApiFootballCircuit(task) {
  if (isOpen()) return { skipped: true, circuit: getApiFootballCircuitState() };
  if (inFlight) return inFlight;

  inFlight = Promise.resolve()
    .then(task)
    .then((result) => {
      const primarySucceeded = result?.source === "api-football" && result?.fallback === false;
      if (primarySucceeded) {
        consecutiveFailures = 0;
        openedAt = 0;
      } else {
        consecutiveFailures += 1;
        if (consecutiveFailures >= FAILURE_THRESHOLD) openCircuit();
      }
      return { skipped: false, result, circuit: getApiFootballCircuitState() };
    })
    .catch((error) => {
      consecutiveFailures += 1;
      if (consecutiveFailures >= FAILURE_THRESHOLD) openCircuit();
      return { skipped: false, error, circuit: getApiFootballCircuitState() };
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
