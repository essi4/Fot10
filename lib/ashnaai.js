import crypto from "node:crypto";

const BASE_URL = "https://api.ashna.ai/v1/api";
const REQUEST_TIMEOUT_MS = 20_000;

function getKey() {
  const key = process.env.ASHNAAI_API_KEY?.trim();
  if (!key) throw new Error("AI provider is not configured");
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
  headers.set("Accept", "application/json");
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI provider request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readAshnaJson(response) {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {
      error: {
        message: "AI provider returned an invalid response.",
        type: "provider_response_error",
      },
    };
  }
}
