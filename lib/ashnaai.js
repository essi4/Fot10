import crypto from "node:crypto";

const BASE_URL = "https://api.ashna.ai/v1/api";

function getKey() {
  const key = process.env.ASHNAAI_API_KEY;
  if (!key) throw new Error("ASHNAAI_API_KEY is not configured");
  return key;
}

export function verifyLabSecret(request) {
  const configured = process.env.ASHNAAI_LAB_SECRET;
  const supplied = request.headers.get("x-ashna-lab-secret") || "";
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function ashnaFetch(path, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${getKey()}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
