import { NextResponse } from "next/server";
import {
  getClientIp,
  readPushRequestBody,
  validatePushSubscription,
} from "../../../../lib/push-subscription-validation";
import { pushSubscribeRateLimit } from "../../../../lib/push-subscribe-rate-limit";

const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TIMEOUT_MS = 5000;

const json = (body, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function POST(request) {
  const clientIp = getClientIp(request);

  if (!pushSubscribeRateLimit.check(clientIp)) {
    return json({ ok: false, error: "RATE_LIMITED" }, 429);
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") || "", 10);
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, 400);
  }

  try {
    const body = await readPushRequestBody(request);
    const subscription = validatePushSubscription(body);

    if (!subscription.ok) {
      return json({ ok: false, error: subscription.error }, 400);
    }

    if (!supabaseUrl() || !serviceKey()) {
      return json({ ok: false, error: "SERVICE_UNAVAILABLE" }, 503);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${supabaseUrl()}/rest/v1/push_subscriptions?on_conflict=endpoint`,
        {
          method: "POST",
          headers: {
            apikey: serviceKey(),
            Authorization: `Bearer ${serviceKey()}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            active: true,
            updated_at: new Date().toISOString(),
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        return json({ ok: false, error: "SUBSCRIBE_FAILED" }, 500);
      }

      return json({ ok: true });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (error?.code === "PAYLOAD_TOO_LARGE" || error?.code === "INVALID_SUBSCRIPTION") {
      return json({ ok: false, error: error.code }, 400);
    }

    if (error?.name === "AbortError") {
      return json({ ok: false, error: "UPSTREAM_TIMEOUT" }, 504);
    }

    return json({ ok: false, error: "SUBSCRIBE_FAILED" }, 500);
  }
}
