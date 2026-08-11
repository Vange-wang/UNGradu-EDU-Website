const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "style-src 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "media-src 'self' data: blob: https:",
  "worker-src 'self' blob:"
] as const;

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

// Next's route announcer and image runtime emit two stable, non-sensitive
// style attributes. Hash them explicitly instead of opening style attributes
// with unsafe-inline; a changed runtime style fails the browser contract.
const CSP_STYLE_ATTRIBUTE_HASHES = [
  "'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk='",
  "'sha256-32t0bJPIyxns/QqsW8RE3JGUERKnHL5RygHBgJvEanc='"
] as const;

const NONCE_PATTERN = /^[A-Za-z0-9+/_-]+={0,2}$/;

export function createContentSecurityPolicy(
  nonce: string,
  options: { allowUnsafeEval?: boolean } = {}
) {
  const normalizedNonce = nonce.trim();

  if (!normalizedNonce || !NONCE_PATTERN.test(normalizedNonce)) {
    throw new Error("CSP nonce is invalid");
  }

  const scriptSource = [
    "script-src",
    "'self'",
    `'nonce-${normalizedNonce}'`,
    TURNSTILE_ORIGIN,
    ...(options.allowUnsafeEval ? ["'unsafe-eval'"] : [])
  ].join(" ");
  const frameSource = `frame-src ${TURNSTILE_ORIGIN}`;
  // Keep the same fixed, non-sensitive runtime style hashes in style-src as a
  // compatibility fallback for Chromium's shadow-root style attribute
  // enforcement. No unsafe-inline is permitted in any environment.
  const styleSource = [
    "style-src",
    "'self'",
    `'nonce-${normalizedNonce}'`,
    ...CSP_STYLE_ATTRIBUTE_HASHES
  ].join(" ");
  const styleAttributeSource = [
    "style-src-attr",
    "'unsafe-hashes'",
    ...CSP_STYLE_ATTRIBUTE_HASHES
  ].join(" ");

  return [
    ...CSP_DIRECTIVES.slice(0, 5),
    scriptSource,
    styleSource,
    styleAttributeSource,
    frameSource,
    // Skip the legacy style-src entry already replaced above.
    ...CSP_DIRECTIVES.slice(6)
  ].join("; ");
}

export function createCspNonce() {
  const randomUUID = globalThis.crypto?.randomUUID;

  if (typeof randomUUID !== "function") {
    return null;
  }

  const nonce = randomUUID.call(globalThis.crypto).replaceAll("-", "");
  return nonce || null;
}
