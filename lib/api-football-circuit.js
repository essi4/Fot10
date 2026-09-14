const FAILURE_THRESHOLD = 2;
// A provider-level suspension should not be re-probed every few minutes.
// Keep the key/IP protected until the provider itself is restored.
const SUSPENDED_COOLDOWN_MS = 60 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;
const AUTH_COOLDOWN_MS = 5 * 60 * 1000;
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

let consecutiveFailures = 0;
let openedAt = 0;
let cooldownMs = DEFAULT_COOLDOWN_MS;
let reason = null;
let inFlight = null;

function isOpen() {
  return openedAt > 0 && Date.now() - openedAt < cooldownMs;
}

function openCircuit(nextReason, nextCooldownMs) {
  openedAt = Date.now();
  reason = nextReason || "UPSTREAM_FAILURE";
  cooldownMs = nextCooldownMs || DEFAULT_COOLDOWN_MS;
}

function classify(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "");
  if (code === "SUSPENDED" || /account\s+is\s+suspended|your\s+account\s+is\s+suspended/i.test(message)) return { reason: "SUSPENDED", cooldownMs: SUSPENDED_COOLDOWN_MS };
  if (code === "RATE_LIMIT" || error?.details?.status === 429) return { reason: "RATE_LIMIT", cooldownMs: RATE_LIMIT_COOLDOWN_MS };
  if (code === "AUTH_ERROR" || error?.details?.status === 401 || error?.details?.status === 403) return { reason: "AUTH_ERROR", cooldownMs: AUTH_COOLDOWN_MS };
  if (/firewall|blocked|forbidden/i.test(message)) return { reason: "FIREWALL", cooldownMs: AUTH_COOLDOWN_MS };
  return { reason: "UPSTREAM_FAILURE", cooldownMs: DEFAULT_COOLDOWN_MS };
}

export function getApiFootballCircuitState() {
  const open = isOpen();
  return {
    open,
    consecutiveFailures,
    reason,
    cooldownMs,
    retryAt: openedAt ? new Date(openedAt + cooldownMs).toISOString() : null,
    retryAfterMs: open ? Math.max(0, openedAt + cooldownMs - Date.now()) : 0,
  };
}

export function recordApiFootballFailure(error) {
  consecutiveFailures += 1;
  const classification = classify(error);
  if (consecutiveFailures >= FAILURE_THRESHOLD || classification.reason !== "UPSTREAM_FAILURE") {
    openCircuit(classification.reason, classification.cooldownMs);
  }
  return getApiFootballCircuitState();
}

export function recordApiFootballSuccess() {
  consecutiveFailures = 0;
  openedAt = 0;
  reason = null;
  cooldownMs = DEFAULT_COOLDOWN_MS;
  return getApiFootballCircuitState();
}

export async function runWithApiFootballCircuit(task) {
  if (isOpen()) return { skipped: true, circuit: getApiFootballCircuitState() };
  if (inFlight) return inFlight;

  inFlight = Promise.resolve()
    .then(task)
    .then((result) => {
      const primarySucceeded = result?.source === "api-football" && result?.fallback === false;
      if (primarySucceeded) recordApiFootballSuccess();
      else recordApiFootballFailure();
      return { skipped: false, result, circuit: getApiFootballCircuitState() };
    })
    .catch((error) => ({ skipped: false, error, circuit: recordApiFootballFailure(error) }))
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
