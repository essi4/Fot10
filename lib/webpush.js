import crypto from "node:crypto";

const b64u = (value) => Buffer.from(value).toString("base64url");
const fromB64u = (value) => Buffer.from(value, "base64url");

function hkdfExtract(salt, ikm) {
  return crypto.createHmac("sha256", salt).update(ikm).digest();
}

function hkdfExpand(prk, info, length) {
  const out = [];
  let previous = Buffer.alloc(0);
  for (let counter = 1; Buffer.concat(out).length < length; counter += 1) {
    previous = crypto.createHmac("sha256", prk).update(Buffer.concat([previous, info, Buffer.from([counter])])).digest();
    out.push(previous);
  }
  return Buffer.concat(out).subarray(0, length);
}

function vapidKeys() {
  const privateDer = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!privateDer || !publicKey) throw new Error("VAPID keys are not configured");
  return { privateKey: crypto.createPrivateKey({ key: Buffer.from(privateDer, "base64"), format: "der", type: "pkcs8" }), publicKey };
}

function vapidJwt(audience) {
  const { privateKey, publicKey } = vapidKeys();
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = b64u(JSON.stringify({ aud: audience, exp: now + 12 * 60 * 60, sub: process.env.VAPID_SUBJECT || "https://fot10-dcuw.onrender.com" }));
  const input = `${header}.${payload}`;
  const signature = crypto.createSign("SHA256").update(input).sign({ key: privateKey, dsaEncoding: "ieee-p1363" });
  return { token: `${input}.${b64u(signature)}`, publicKey };
}

function encryptPayload(subscription, payload) {
  const uaPublic = fromB64u(subscription.keys.p256dh);
  const authSecret = fromB64u(subscription.keys.auth);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error("Invalid push subscription keys");

  const ecdh = crypto.createECDH("prime256v1");
  const serverPublic = ecdh.generateKeys();
  const sharedSecret = ecdh.computeSecret(uaPublic);
  const salt = crypto.randomBytes(16);

  const authInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, serverPublic]);
  const ikm = hkdfExpand(hkdfExtract(authSecret, sharedSecret), authInfo, 32);
  const prk = hkdfExtract(salt, ikm);
  const cek = hkdfExpand(prk, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdfExpand(prk, Buffer.from("Content-Encoding: nonce\0"), 12);

  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload)), Buffer.from([2])]);
  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096, 0);
  const body = Buffer.concat([salt, recordSize, Buffer.from([serverPublic.length]), serverPublic, ciphertext]);
  return { body, salt, serverPublic };
}

export async function sendWebPush(subscription, payload) {
  const endpoint = new URL(subscription.endpoint);
  const { token, publicKey } = vapidJwt(`${endpoint.protocol}//${endpoint.host}`);
  const encrypted = encryptPayload(subscription, payload);
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      TTL: "300",
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      Encryption: `salt=${b64u(encrypted.salt)}`,
      "Crypto-Key": `dh=${b64u(encrypted.serverPublic)};p256ecdsa=${publicKey}`,
      Authorization: `vapid t=${token}, k=${publicKey}`,
    },
    body: encrypted.body,
  });
  if (!response.ok) {
    const error = new Error(`Push provider returned ${response.status}`);
    error.status = response.status;
    error.endpoint = subscription.endpoint;
    throw error;
  }
  return true;
}
