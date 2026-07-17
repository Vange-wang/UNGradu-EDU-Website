type Env = {
  UPSTREAM_ORIGIN: string;
};

const defaultSecurityHeaders = new Headers({
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:"
  ].join("; "),
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=86400",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
});

const requestHeadersToDrop = new Set([
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "cf-visitor",
  "forwarded",
  "host",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-real-ip"
]);

const responseHeadersToDrop = new Set([
  "server",
  "x-cloudbase-request-id",
  "x-cloudbase-trace-id",
  "x-powered-by",
  "x-tcb-request-id",
  "x-tencent-request-id"
]);

function normalizeOrigin(origin: string) {
  const normalized = new URL(origin);
  normalized.pathname = "";
  normalized.search = "";
  normalized.hash = "";
  return normalized;
}

function buildUpstreamRequest(request: Request, upstreamOrigin: URL) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(upstreamOrigin);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  for (const header of requestHeadersToDrop) {
    headers.delete(header);
  }
  headers.set("host", upstreamUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  return new Request(upstreamUrl, {
    body: request.body,
    headers,
    method: request.method,
    redirect: "manual"
  });
}

function hardenResponse(response: Response) {
  const headers = new Headers(response.headers);
  for (const header of responseHeadersToDrop) {
    headers.delete(header);
  }
  for (const [key, value] of defaultSecurityHeaders) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.UPSTREAM_ORIGIN) {
      return new Response("Missing UPSTREAM_ORIGIN.", { status: 500 });
    }

    const upstreamOrigin = normalizeOrigin(env.UPSTREAM_ORIGIN);
    const upstreamRequest = buildUpstreamRequest(request, upstreamOrigin);
    const upstreamResponse = await fetch(upstreamRequest);

    return hardenResponse(upstreamResponse);
  }
};

export default worker;
