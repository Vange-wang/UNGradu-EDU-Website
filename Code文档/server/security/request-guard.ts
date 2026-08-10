const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// This module is imported by Next middleware (an edge runtime), so it cannot
// depend on the Node-only `node:crypto` scheme. Keep the small synchronous
// HMAC-SHA-256 implementation here so the server and edge guard share exactly
// the same request proof without bundler fallbacks.
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rotateRight(value: number, bits: number) {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256(input: Uint8Array) {
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let a = h0; let b = h1; let c = h2; let d = h3;
    let e = h4; let f = h5; let g = h6; let h = h7;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const digest = new Uint8Array(32);
  const output = new DataView(digest.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((value, index) => output.setUint32(index * 4, value));
  return digest;
}

export function createHmacSha256Hex(secret: string, message: string) {
  const encoder = new TextEncoder();
  let key = encoder.encode(secret);
  if (key.length > 64) key = sha256(key);
  const block = new Uint8Array(64);
  block.set(key);
  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let index = 0; index < 64; index += 1) {
    inner[index] = block[index] ^ 0x36;
    outer[index] = block[index] ^ 0x5c;
  }
  const messageBytes = encoder.encode(message);
  const innerInput = new Uint8Array(inner.length + messageBytes.length);
  innerInput.set(inner);
  innerInput.set(messageBytes, inner.length);
  const innerDigest = sha256(innerInput);
  const outerInput = new Uint8Array(outer.length + innerDigest.length);
  outerInput.set(outer);
  outerInput.set(innerDigest, outer.length);
  return Array.from(sha256(outerInput), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type WriteRequestSecurityEnv = {
  appEnv?: string;
  allowedOrigins?: string[] | string;
  csrfSecret?: string;
  mode?: "off" | "observe" | "enforce";
  nodeEnv?: string;
  subjectId?: string;
  allowAnonymous?: boolean;
};

export type WriteRequestSecurityResult =
  | { correlationId: string; ok: true }
  | {
      correlationId: string;
      ok: false;
      reason:
        | "csrf-missing"
        | "csrf-invalid"
        | "csrf-subject-missing"
        | "origin-missing"
        | "origin-not-allowed";
    };

function createCorrelationId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, "");
}

function normalizeOrigins(value: WriteRequestSecurityEnv["allowedOrigins"]) {
  const configured = Array.isArray(value)
    ? value
    : value?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];

  return new Set(configured.map(normalizeOrigin).filter(Boolean));
}

export function createCsrfProof({
  method,
  origin,
  secret,
  subjectId
}: {
  method: string;
  origin: string;
  secret: string;
  subjectId: string;
}) {
  return createHmacSha256Hex(
    secret,
    `${method.toUpperCase()}\n${normalizeOrigin(origin)}\n${subjectId.trim()}`
  );
}

export function timingSafeEqualText(expected: string, actual: string) {
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return difference === 0;
}

export function evaluateWriteRequest({
  env,
  request
}: {
  env: WriteRequestSecurityEnv;
  request: Request;
}): WriteRequestSecurityResult {
  const correlationId = request.headers.get("x-correlation-id")?.trim() || createCorrelationId();

  if (SAFE_METHODS.has(request.method.toUpperCase()) || env.mode !== "enforce") {
    return { correlationId, ok: true };
  }

  const origin = request.headers.get("origin")?.trim();
  if (!origin) {
    return { correlationId, ok: false, reason: "origin-missing" };
  }

  const allowed = normalizeOrigins(env.allowedOrigins);
  if (!allowed.has(normalizeOrigin(origin))) {
    return { correlationId, ok: false, reason: "origin-not-allowed" };
  }

  if (!env.csrfSecret) {
    return { correlationId, ok: false, reason: "csrf-missing" };
  }

  if (!env.subjectId?.trim()) {
    if (env.allowAnonymous) {
      const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
      if (contentType !== "application/json") {
        return { correlationId, ok: false, reason: "csrf-subject-missing" };
      }
      return { correlationId, ok: true };
    }
    const proof = request.headers.get("x-ungrade-csrf")?.trim();
    if (
      env.nodeEnv !== "production" &&
      env.appEnv !== "production" &&
      proof === env.csrfSecret &&
      !request.headers.has("x-ungrade-session-user")
    ) {
      return { correlationId, ok: true };
    }
    return { correlationId, ok: false, reason: "csrf-subject-missing" };
  }

  const proof = request.headers.get("x-ungrade-csrf")?.trim();
  if (!proof) {
    return { correlationId, ok: false, reason: "csrf-missing" };
  }

  const expected = createCsrfProof({
    method: request.method,
    origin,
    secret: env.csrfSecret,
    subjectId: env.subjectId
  });

  if (!timingSafeEqualText(expected, proof)) {
    return { correlationId, ok: false, reason: "csrf-invalid" };
  }

  return { correlationId, ok: true };
}

export function resolveTrustedRequestKeys({
  serverProxyIp,
  sessionUserId
}: {
  forwardedFor?: string;
  serverProxyIp?: string;
  sessionUserId?: string;
  suppliedDeviceKey?: string;
}) {
  const sessionKey = sessionUserId?.trim() || "unknown-session";
  const proxyKey = serverProxyIp?.trim() || "unknown-proxy";

  return {
    deviceKey: `session:${sessionKey}`,
    ipKey: `proxy:${proxyKey}`,
    sessionKey
  };
}
