export const MAX_PUSH_PAYLOAD_BYTES = 4096;
const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;

export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 128) || "unknown";

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 128) || "unknown";

  return "unknown";
}

export async function readPushRequestBody(request) {
  let raw;

  try {
    raw = await request.text();
  } catch {
    const error = new Error("Invalid request body");
    error.code = "INVALID_SUBSCRIPTION";
    throw error;
  }

  const byteLength = new TextEncoder().encode(raw).byteLength;
  if (byteLength > MAX_PUSH_PAYLOAD_BYTES) {
    const error = new Error("Payload too large");
    error.code = "PAYLOAD_TOO_LARGE";
    throw error;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON");
    error.code = "INVALID_SUBSCRIPTION";
    throw error;
  }
}

function isBase64Url(value) {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function normalizeEndpoint(value) {
  if (typeof value !== "string") return null;

  const endpoint = value.trim();
  if (!endpoint || endpoint.length > MAX_ENDPOINT_LENGTH) return null;

  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    url.hash
  ) {
    return null;
  }

  return url.toString();
}

function normalizeKey(value) {
  if (typeof value !== "string") return null;

  const key = value.trim();
  if (
    !key ||
    key.length > MAX_KEY_LENGTH ||
    !isBase64Url(key)
  ) {
    return null;
  }

  return key;
}

export function validatePushSubscription(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "INVALID_SUBSCRIPTION" };
  }

  const bodyKeys = Object.keys(body).sort();
  if (bodyKeys.length !== 2 || bodyKeys[0] !== "endpoint" || bodyKeys[1] !== "keys") {
    return { ok: false, error: "INVALID_SUBSCRIPTION" };
  }

  if (!body.keys || typeof body.keys !== "object" || Array.isArray(body.keys)) {
    return { ok: false, error: "INVALID_SUBSCRIPTION" };
  }

  const keyNames = Object.keys(body.keys).sort();
  if (keyNames.length !== 2 || keyNames[0] !== "auth" || keyNames[1] !== "p256dh") {
    return { ok: false, error: "INVALID_SUBSCRIPTION" };
  }

  const endpoint = normalizeEndpoint(body.endpoint);
  const p256dh = normalizeKey(body.keys.p256dh);
  const auth = normalizeKey(body.keys.auth);

  if (!endpoint || !p256dh || !auth) {
    return { ok: false, error: "INVALID_SUBSCRIPTION" };
  }

  return {
    ok: true,
    endpoint,
    keys: { p256dh, auth },
  };
}

export const __test__ = {
  isBase64Url,
  normalizeEndpoint,
  normalizeKey,
};
