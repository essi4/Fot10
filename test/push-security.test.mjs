import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PUSH_PAYLOAD_BYTES,
  getClientIp,
  readPushRequestBody,
  validatePushSubscription,
} from "../lib/push-subscription-validation.js";
import {
  pushSubscribeRateLimit,
  PUSH_SUBSCRIBE_RATE_LIMIT,
} from "../lib/push-subscribe-rate-limit.js";

const valid = {
  endpoint: "https://push.example.test/send/abc",
  keys: {
    p256dh: "BNExampleP256dh_123456789",
    auth: "ExampleAuthKey_123456789",
  },
};

test("accepts a strict HTTPS subscription shape", () => {
  const result = validatePushSubscription(valid);
  assert.equal(result.ok, true);
  assert.equal(result.endpoint, valid.endpoint);
  assert.deepEqual(result.keys, valid.keys);
});

test("rejects insecure, credentialed, hashed, or over-shaped endpoints", () => {
  for (const endpoint of [
    "http://push.example.test/send",
    "https://user:pass@push.example.test/send",
    "https://push.example.test/send#fragment",
    "not-a-url",
  ]) {
    assert.equal(validatePushSubscription({ ...valid, endpoint }).ok, false, endpoint);
  }

  assert.equal(
    validatePushSubscription({
      ...valid,
      extra: "reject-me",
    }).ok,
    false,
  );
  assert.equal(
    validatePushSubscription({
      ...valid,
      keys: { ...valid.keys, extra: "reject-me" },
    }).ok,
    false,
  );
});

test("rejects malformed key material", () => {
  assert.equal(
    validatePushSubscription({
      ...valid,
      keys: { ...valid.keys, auth: "bad key!" },
    }).ok,
    false,
  );
});

test("enforces the 4 KiB body limit", async () => {
  const body = JSON.stringify(valid);
  const parsed = await readPushRequestBody(
    new Request("https://fot10.test/api/push/subscribe", {
      method: "POST",
      body,
    }),
  );
  assert.deepEqual(parsed, valid);

  const oversized = JSON.stringify({
    ...valid,
    endpoint: valid.endpoint + "x".repeat(MAX_PUSH_PAYLOAD_BYTES),
  });
  await assert.rejects(
    readPushRequestBody(
      new Request("https://fot10.test/api/push/subscribe", {
        method: "POST",
        body: oversized,
      }),
    ),
    (error) => error?.code === "PAYLOAD_TOO_LARGE",
  );
});

test("resolves client IP deterministically", () => {
  const request = new Request("https://fot10.test/api/push/subscribe", {
    headers: {
      "x-forwarded-for": "203.0.113.9, 198.51.100.2",
      "x-real-ip": "198.51.100.3",
    },
  });
  assert.equal(getClientIp(request), "203.0.113.9");
});

test("limits each IP to 10 requests per 60 seconds", () => {
  pushSubscribeRateLimit.reset();
  for (let i = 0; i < PUSH_SUBSCRIBE_RATE_LIMIT.maxRequests; i += 1) {
    assert.equal(pushSubscribeRateLimit.check("203.0.113.10"), true);
  }
  assert.equal(pushSubscribeRateLimit.check("203.0.113.10"), false);
  assert.equal(pushSubscribeRateLimit.check("203.0.113.11"), true);
});
